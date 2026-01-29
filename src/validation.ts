import { GoalNode, RecursiveGoalsSettings } from "./types";

export interface ValidationIssue {
	type: "orphaned" | "circular" | "missing-progress" | "missing-date" | "missing-priority";
	path: string;
	name: string;
	message: string;
}

export function validateGoalGraph(
	graph: Map<string, GoalNode>,
	settings: RecursiveGoalsSettings
): ValidationIssue[] {
	const issues: ValidationIssue[] = [];

	for (const [path, node] of graph) {
		if (node.parentPath && !graph.has(node.parentPath)) {
			issues.push({
				type: "orphaned",
				path,
				name: node.name,
				message: `"${node.name}" links to non-existent parent goal`,
			});
		}

		if (detectCycle(graph, path)) {
			issues.push({
				type: "circular",
				path,
				name: node.name,
				message: `"${node.name}" is part of a circular reference`,
			});
		}

		if (node.children.length === 0) {
			if (node.progress === 0) {
				issues.push({
					type: "missing-progress",
					path,
					name: node.name,
					message: `Leaf goal "${node.name}" has no progress set`,
				});
			}

			if (!node.expectedAcquireDate) {
				issues.push({
					type: "missing-date",
					path,
					name: node.name,
					message: `"${node.name}" has no expected acquire date`,
				});
			}
		}

		if (node.priority === 0) {
			issues.push({
				type: "missing-priority",
				path,
				name: node.name,
				message: `"${node.name}" has no priority set`,
			});
		}
	}

	return issues;
}

function detectCycle(graph: Map<string, GoalNode>, startPath: string): boolean {
	const visited = new Set<string>();
	let current = startPath;

	while (current) {
		if (visited.has(current)) {
			return true;
		}
		visited.add(current);

		const node = graph.get(current);
		if (!node || !node.parentPath) {
			break;
		}
		current = node.parentPath;
	}

	return false;
}

export function groupIssuesByType(issues: ValidationIssue[]): Map<string, ValidationIssue[]> {
	const grouped = new Map<string, ValidationIssue[]>();

	for (const issue of issues) {
		if (!grouped.has(issue.type)) {
			grouped.set(issue.type, []);
		}
		grouped.get(issue.type)!.push(issue);
	}

	return grouped;
}

export function formatIssuesForNotice(issues: ValidationIssue[]): string {
	if (issues.length === 0) {
		return "All goals validated successfully!";
	}

	const grouped = groupIssuesByType(issues);
	const lines: string[] = [`Found ${issues.length} issue(s):`];

	const typeLabels: Record<string, string> = {
		orphaned: "Orphaned goals",
		circular: "Circular references",
		"missing-progress": "Missing progress",
		"missing-date": "Missing dates",
		"missing-priority": "Missing priority",
	};

	for (const [type, typeIssues] of grouped) {
		lines.push(`\n${typeLabels[type] || type} (${typeIssues.length}):`);
		for (const issue of typeIssues.slice(0, 3)) {
			lines.push(`  - ${issue.name}`);
		}
		if (typeIssues.length > 3) {
			lines.push(`  ... and ${typeIssues.length - 3} more`);
		}
	}

	return lines.join("\n");
}

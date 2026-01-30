import { GoalNode, RecursiveGoalsSettings } from "./types";

export type ValidationIssueType =
	| "orphaned"
	| "circular"
	| "missing-progress"
	| "missing-date"
	| "missing-priority"
	| "missing-size"
	| "missing-category"
	| "inbox-stale"
	| "urgent-no-date";

export interface ValidationIssue {
	type: ValidationIssueType;
	path: string;
	name: string;
	message: string;
	severity: "error" | "warning" | "info";
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
				severity: "error",
			});
		}

		if (detectCycle(graph, path)) {
			issues.push({
				type: "circular",
				path,
				name: node.name,
				message: `"${node.name}" is part of a circular reference`,
				severity: "error",
			});
		}

		if (node.children.length === 0) {
			if (node.progress === 0 && node.category === "active") {
				issues.push({
					type: "missing-progress",
					path,
					name: node.name,
					message: `Active leaf "${node.name}" has no progress set`,
					severity: "warning",
				});
			}

			if (!node.expectedAcquireDate && node.category === "active") {
				issues.push({
					type: "missing-date",
					path,
					name: node.name,
					message: `Active goal "${node.name}" has no expected date`,
					severity: "warning",
				});
			}

			if (!node.size && node.category === "active") {
				issues.push({
					type: "missing-size",
					path,
					name: node.name,
					message: `Active task "${node.name}" has no size (S/M/L)`,
					severity: "info",
				});
			}
		}

		if (node.priority === 0 && node.category === "active") {
			issues.push({
				type: "missing-priority",
				path,
				name: node.name,
				message: `Active goal "${node.name}" has no priority set`,
				severity: "warning",
			});
		}

		if (!node.category) {
			issues.push({
				type: "missing-category",
				path,
				name: node.name,
				message: `"${node.name}" has no category - needs triage`,
				severity: "info",
			});
		}

		if (node.category === "inbox") {
			issues.push({
				type: "inbox-stale",
				path,
				name: node.name,
				message: `"${node.name}" is in inbox - needs processing`,
				severity: "info",
			});
		}

		if (node.urgent && !node.expectedAcquireDate) {
			issues.push({
				type: "urgent-no-date",
				path,
				name: node.name,
				message: `Urgent item "${node.name}" has no expected date`,
				severity: "warning",
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

	const errors = issues.filter((i) => i.severity === "error");
	const warnings = issues.filter((i) => i.severity === "warning");
	const infos = issues.filter((i) => i.severity === "info");

	const lines: string[] = [];

	if (errors.length > 0) {
		lines.push(`Errors: ${errors.length}`);
	}
	if (warnings.length > 0) {
		lines.push(`Warnings: ${warnings.length}`);
	}
	if (infos.length > 0) {
		lines.push(`Info: ${infos.length}`);
	}

	const grouped = groupIssuesByType(issues);

	const typeLabels: Record<string, string> = {
		orphaned: "Orphaned goals",
		circular: "Circular references",
		"missing-progress": "Missing progress",
		"missing-date": "Missing dates",
		"missing-priority": "Missing priority",
		"missing-size": "Missing size",
		"missing-category": "Needs triage",
		"inbox-stale": "In inbox",
		"urgent-no-date": "Urgent without date",
	};

	const orderedTypes: ValidationIssueType[] = [
		"orphaned",
		"circular",
		"urgent-no-date",
		"missing-progress",
		"missing-date",
		"missing-priority",
		"missing-size",
		"missing-category",
		"inbox-stale",
	];

	for (const type of orderedTypes) {
		const typeIssues = grouped.get(type);
		if (!typeIssues || typeIssues.length === 0) continue;

		const severity = typeIssues[0].severity;
		const icon = severity === "error" ? "❌" : severity === "warning" ? "⚠️" : "ℹ️";

		lines.push(`\n${icon} ${typeLabels[type] || type} (${typeIssues.length}):`);
		for (const issue of typeIssues.slice(0, 3)) {
			lines.push(`  - ${issue.name}`);
		}
		if (typeIssues.length > 3) {
			lines.push(`  ... and ${typeIssues.length - 3} more`);
		}
	}

	return lines.join("\n");
}

export function getValidationSummary(issues: ValidationIssue[]): {
	errors: number;
	warnings: number;
	infos: number;
	total: number;
} {
	return {
		errors: issues.filter((i) => i.severity === "error").length,
		warnings: issues.filter((i) => i.severity === "warning").length,
		infos: issues.filter((i) => i.severity === "info").length,
		total: issues.length,
	};
}

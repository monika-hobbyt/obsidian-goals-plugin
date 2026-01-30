import { GoalNode, NodeType, ProgressCalculationMethod, SIZE_HOURS } from "./types";

export function calculateAccumulatedProgress(
	graph: Map<string, GoalNode>,
	path: string,
	method: ProgressCalculationMethod = "weighted",
	visited: Set<string> = new Set()
): number {
	if (visited.has(path)) return 0;
	visited.add(path);

	const node = graph.get(path);
	if (!node) return 0;

	if (node.children.length === 0) {
		return node.progress;
	}

	const childData: { progress: number; priority: number }[] = [];
	for (const childPath of node.children) {
		const child = graph.get(childPath);
		if (!child) continue;
		childData.push({
			progress: calculateAccumulatedProgress(graph, childPath, method, visited),
			priority: child.priority || 1,
		});
	}

	if (childData.length === 0) return 0;

	if (method === "simple") {
		const total = childData.reduce((sum, c) => sum + c.progress, 0);
		return total / childData.length;
	}

	const maxPriority = Math.max(...childData.map((c) => c.priority));
	let weightedSum = 0;
	let totalWeight = 0;

	for (const child of childData) {
		const weight = maxPriority - child.priority + 1;
		weightedSum += child.progress * weight;
		totalWeight += weight;
	}

	return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

export function findRootGoal(
	graph: Map<string, GoalNode>,
	path: string,
	visited: Set<string> = new Set()
): GoalNode | null {
	if (visited.has(path)) return null;
	visited.add(path);

	const node = graph.get(path);
	if (!node) return null;

	if (!node.parentPath || !graph.has(node.parentPath)) {
		return node;
	}

	return findRootGoal(graph, node.parentPath, visited);
}

export function calculateChainPriority(
	graph: Map<string, GoalNode>,
	path: string,
	visited: Set<string> = new Set()
): number {
	if (visited.has(path)) return 0;
	visited.add(path);

	const node = graph.get(path);
	if (!node) return 0;

	if (!node.parentPath || !graph.has(node.parentPath)) {
		return node.priority;
	}

	const parentChainPriority = calculateChainPriority(graph, node.parentPath, visited);
	return parentChainPriority + node.priority;
}

export function findLatestDate(
	graph: Map<string, GoalNode>,
	path: string,
	visited: Set<string> = new Set()
): string | null {
	if (visited.has(path)) return null;
	visited.add(path);

	const node = graph.get(path);
	if (!node) return null;

	if (node.children.length === 0) {
		return node.expectedAcquireDate;
	}

	let latest: string | null = null;
	for (const childPath of node.children) {
		const childDate = findLatestDate(graph, childPath, visited);
		if (childDate && (!latest || childDate > latest)) {
			latest = childDate;
		}
	}
	return latest;
}

export function getYearFromDate(dateStr: string | null): number | null {
	if (!dateStr) return null;
	const match = dateStr.match(/(\d{4})/);
	return match ? parseInt(match[1]) : null;
}

export function getQuarterFromDate(dateStr: string | null): string | null {
	if (!dateStr) return null;
	const match = dateStr.match(/\d{4}-(\d{2})/);
	if (!match) return null;
	const month = parseInt(match[1]);
	if (month <= 3) return "Q1";
	if (month <= 6) return "Q2";
	if (month <= 9) return "Q3";
	return "Q4";
}

export function formatDateAsLink(dateStr: string | null): string | null {
	if (!dateStr) return null;
	const match = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
	return match ? `[[${match[1]}]]` : null;
}

export function getChildrenLinks(graph: Map<string, GoalNode>, path: string): string[] {
	const node = graph.get(path);
	if (!node) return [];
	return node.children
		.map((childPath) => {
			const child = graph.get(childPath);
			return child ? `[[${child.name}]]` : "";
		})
		.filter((link) => link !== "");
}

export function calculateStatus(progress: number, dateStr: string | null): string {
	if (progress >= 100) return "completed";

	if (dateStr) {
		const match = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
		if (match) {
			const targetDate = new Date(match[1]);
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			if (targetDate < today) return "overdue";
		}
	}

	if (progress > 0) return "in-progress";
	return "not-started";
}

export function calculateDaysRemaining(dateStr: string | null): number | null {
	if (!dateStr) return null;
	const match = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
	if (!match) return null;

	const targetDate = new Date(match[1]);
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	targetDate.setHours(0, 0, 0, 0);

	const diffTime = targetDate.getTime() - today.getTime();
	return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isOverdue(progress: number, dateStr: string | null): boolean {
	if (progress >= 100) return false;
	const daysRemaining = calculateDaysRemaining(dateStr);
	return daysRemaining !== null && daysRemaining < 0;
}

export function getTodayDateString(): string {
	const today = new Date();
	const year = today.getFullYear();
	const month = String(today.getMonth() + 1).padStart(2, "0");
	const day = String(today.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

export function calculateDepth(
	graph: Map<string, GoalNode>,
	path: string,
	visited: Set<string> = new Set()
): number {
	if (visited.has(path)) return 0;
	visited.add(path);

	const node = graph.get(path);
	if (!node) return 0;

	if (!node.parentPath || !graph.has(node.parentPath)) {
		return 0;
	}

	return 1 + calculateDepth(graph, node.parentPath, visited);
}

export function countTotalDescendants(
	graph: Map<string, GoalNode>,
	path: string,
	visited: Set<string> = new Set()
): number {
	if (visited.has(path)) return 0;
	visited.add(path);

	const node = graph.get(path);
	if (!node) return 0;

	let count = node.children.length;
	for (const childPath of node.children) {
		count += countTotalDescendants(graph, childPath, visited);
	}
	return count;
}

export function countLeafGoals(
	graph: Map<string, GoalNode>,
	path: string,
	visited: Set<string> = new Set()
): number {
	if (visited.has(path)) return 0;
	visited.add(path);

	const node = graph.get(path);
	if (!node) return 0;

	if (node.children.length === 0) {
		return 1;
	}

	let count = 0;
	for (const childPath of node.children) {
		count += countLeafGoals(graph, childPath, visited);
	}
	return count;
}

export function hasBlockedDescendants(
	graph: Map<string, GoalNode>,
	path: string,
	visited: Set<string> = new Set()
): boolean {
	if (visited.has(path)) return false;
	visited.add(path);

	const node = graph.get(path);
	if (!node) return false;

	for (const childPath of node.children) {
		const child = graph.get(childPath);
		if (child?.blocked) return true;
		if (hasBlockedDescendants(graph, childPath, visited)) return true;
	}
	return false;
}

export function hasUrgentDescendants(
	graph: Map<string, GoalNode>,
	path: string,
	visited: Set<string> = new Set()
): boolean {
	if (visited.has(path)) return false;
	visited.add(path);

	const node = graph.get(path);
	if (!node) return false;

	for (const childPath of node.children) {
		const child = graph.get(childPath);
		if (child?.urgent) return true;
		if (hasUrgentDescendants(graph, childPath, visited)) return true;
	}
	return false;
}

export function inferNodeType(
	graph: Map<string, GoalNode>,
	path: string
): NodeType {
	const node = graph.get(path);
	if (!node) return "task";

	// If user specified a type, respect it
	if (node.nodeType) return node.nodeType;

	const depth = calculateDepth(graph, path);
	const hasChildren = node.children.length > 0;

	// Auto-infer based on depth and structure
	if (depth === 0) {
		return "strategic-goal";
	} else if (depth === 1) {
		return hasChildren ? "sub-goal" : "project";
	} else if (depth === 2) {
		return hasChildren ? "project" : "task";
	} else if (depth === 3) {
		return hasChildren ? "stage" : "task";
	} else if (depth === 4) {
		return hasChildren ? "task" : "sub-task";
	} else {
		return "sub-task";
	}
}

export function calculateTotalTimeEstimate(
	graph: Map<string, GoalNode>,
	path: string,
	visited: Set<string> = new Set()
): number {
	if (visited.has(path)) return 0;
	visited.add(path);

	const node = graph.get(path);
	if (!node) return 0;

	// If it's a leaf node, return its size in hours
	if (node.children.length === 0) {
		if (node.size) {
			return SIZE_HOURS[node.size];
		}
		return 0;
	}

	// Sum up all children's time estimates
	let total = 0;
	for (const childPath of node.children) {
		total += calculateTotalTimeEstimate(graph, childPath, visited);
	}
	return total;
}

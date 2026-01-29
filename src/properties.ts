import { App } from "obsidian";
import { GoalNode, RecursiveGoalsSettings, COMPUTED_PROPERTY_ORDER } from "./types";
import {
	calculateAccumulatedProgress,
	calculateChainPriority,
	calculateDepth,
	calculateDaysRemaining,
	calculateStatus,
	countLeafGoals,
	countTotalDescendants,
	findLatestDate,
	findRootGoal,
	formatDateAsLink,
	getChildrenLinks,
	getQuarterFromDate,
	getTodayDateString,
	getYearFromDate,
	hasBlockedDescendants,
	isOverdue,
} from "./calculations";

export function reorderProperties(properties: Record<string, any>): void {
	const computed: Record<string, any> = {};
	const regular: Record<string, any> = {};

	for (const key of Object.keys(properties)) {
		if (key.startsWith("_")) {
			computed[key] = properties[key];
		} else {
			regular[key] = properties[key];
		}
		delete properties[key];
	}

	for (const key of COMPUTED_PROPERTY_ORDER) {
		if (computed[key] !== undefined) {
			properties[key] = computed[key];
		}
	}

	for (const key of Object.keys(regular)) {
		properties[key] = regular[key];
	}
}

export async function updateGoalFile(
	app: App,
	graph: Map<string, GoalNode>,
	path: string,
	settings: RecursiveGoalsSettings
): Promise<void> {
	const node = graph.get(path);
	if (!node) return;

	const rootGoal = findRootGoal(graph, path);
	const hasChildren = node.children.length > 0;

	await app.fileManager.processFrontMatter(node.file, (properties) => {
		if (rootGoal) {
			properties["_rootGoal"] = `[[${rootGoal.name}]]`;
			properties["_rootGoalPriority"] = rootGoal.priority;
		}

		if (node.parentPath) {
			properties["_chainPriority"] = calculateChainPriority(graph, path);
		}

		properties["_depth"] = calculateDepth(graph, path);

		if (hasChildren) {
			properties["_totalDescendants"] = countTotalDescendants(graph, path);
			properties["_leafCount"] = countLeafGoals(graph, path);
			properties["_hasBlockedChildren"] = hasBlockedDescendants(graph, path);
			properties["_childCount"] = node.children.length;
			properties["_children"] = getChildrenLinks(graph, path);

			const calculatedProgress = Math.round(calculateAccumulatedProgress(graph, path));
			properties["_calculatedProgress"] = calculatedProgress;

			if (properties[settings.progressProperty] !== undefined) {
				delete properties[settings.progressProperty];
			}

			const latestDate = findLatestDate(graph, path);
			if (latestDate) {
				properties["_calculatedExpectedAcquireDate"] = formatDateAsLink(latestDate);
				properties["_goalYear"] = getYearFromDate(latestDate);
				properties["_goalQuarter"] = getQuarterFromDate(latestDate);
			}

			properties["_status"] = calculateStatus(calculatedProgress, latestDate);
			properties["_daysRemaining"] = calculateDaysRemaining(latestDate);
			properties["_isOverdue"] = isOverdue(calculatedProgress, latestDate);

			if (calculatedProgress >= 100 && !properties["_completedDate"]) {
				properties["_completedDate"] = `[[${getTodayDateString()}]]`;
			} else if (calculatedProgress < 100) {
				delete properties["_completedDate"];
			}
		} else {
			const date = node.expectedAcquireDate;
			if (date) {
				properties["_goalYear"] = getYearFromDate(date);
				properties["_goalQuarter"] = getQuarterFromDate(date);
			}

			properties["_status"] = calculateStatus(node.progress, date);
			properties["_daysRemaining"] = calculateDaysRemaining(date);
			properties["_isOverdue"] = isOverdue(node.progress, date);

			if (node.progress >= 100 && !properties["_completedDate"]) {
				properties["_completedDate"] = `[[${getTodayDateString()}]]`;
			} else if (node.progress < 100) {
				delete properties["_completedDate"];
			}
		}

		reorderProperties(properties);
	});
}

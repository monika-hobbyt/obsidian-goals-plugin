import { App } from "obsidian";
import { GoalNode, RecursiveGoalsSettings, COMPUTED_PROPERTY_ORDER } from "./types";
import {
	calculateAccumulatedProgress,
	calculateChainPriority,
	calculateDepth,
	calculateDaysRemaining,
	calculateStatus,
	calculateTotalTimeEstimate,
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
	hasUrgentDescendants,
	inferNodeType,
	isOverdue,
} from "./calculations";

export function getComputedPropertyOrder(prefix: string): string[] {
	return COMPUTED_PROPERTY_ORDER.map((p) => p.replace(/^_/, prefix));
}

export function reorderProperties(properties: Record<string, any>, prefix: string): void {
	const computed: Record<string, any> = {};
	const regular: Record<string, any> = {};

	for (const key of Object.keys(properties)) {
		if (key.startsWith(prefix)) {
			computed[key] = properties[key];
		} else {
			regular[key] = properties[key];
		}
		delete properties[key];
	}

	for (const key of getComputedPropertyOrder(prefix)) {
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

	const prefix = settings.computedPropertyPrefix;
	const enabled = settings.enabledProperties;
	const rootGoal = findRootGoal(graph, path);
	const hasChildren = node.children.length > 0;

	await app.fileManager.processFrontMatter(node.file, (properties) => {
		if (enabled.rootGoal && rootGoal) {
			properties[`${prefix}rootGoal`] = `[[${rootGoal.name}]]`;
			properties[`${prefix}rootGoalPriority`] = rootGoal.priority;
		}

		if (enabled.chainPriority && node.parentPath) {
			properties[`${prefix}chainPriority`] = calculateChainPriority(graph, path);
		}

		if (enabled.depth) {
			properties[`${prefix}depth`] = calculateDepth(graph, path);
		}

		if (enabled.nodeType) {
			properties[`${prefix}nodeType`] = inferNodeType(graph, path);
			properties[`${prefix}isLeaf`] = !hasChildren;
		}

		if (hasChildren) {
			if (enabled.hierarchyMetrics) {
				properties[`${prefix}totalDescendants`] = countTotalDescendants(graph, path);
				properties[`${prefix}leafCount`] = countLeafGoals(graph, path);
				properties[`${prefix}childCount`] = node.children.length;
				properties[`${prefix}children`] = getChildrenLinks(graph, path);
			}

			if (enabled.blockedTracking) {
				properties[`${prefix}hasBlockedChildren`] = hasBlockedDescendants(graph, path);
			}

			if (enabled.workflowTracking) {
				properties[`${prefix}hasUrgentChildren`] = hasUrgentDescendants(graph, path);
				const totalTime = calculateTotalTimeEstimate(graph, path);
				if (totalTime > 0) {
					properties[`${prefix}totalTimeEstimate`] = totalTime;
				}
			}

			const calculatedProgress = Math.round(
				calculateAccumulatedProgress(graph, path, settings.progressCalculationMethod)
			);
			properties[`${prefix}calculatedProgress`] = calculatedProgress;

			if (properties[settings.progressProperty] !== undefined) {
				delete properties[settings.progressProperty];
			}

			const latestDate = findLatestDate(graph, path);
			if (latestDate) {
				properties[`${prefix}calculatedExpectedAcquireDate`] = formatDateAsLink(latestDate);
				properties[`${prefix}goalYear`] = getYearFromDate(latestDate);
				properties[`${prefix}goalQuarter`] = getQuarterFromDate(latestDate);
			}

			if (enabled.status) {
				properties[`${prefix}status`] = calculateStatus(calculatedProgress, latestDate);
			}

			if (enabled.timeMetrics) {
				properties[`${prefix}daysRemaining`] = calculateDaysRemaining(latestDate);
				properties[`${prefix}isOverdue`] = isOverdue(calculatedProgress, latestDate);

				if (calculatedProgress >= 100 && !properties[`${prefix}completedDate`]) {
					properties[`${prefix}completedDate`] = `[[${getTodayDateString()}]]`;
				} else if (calculatedProgress < 100) {
					delete properties[`${prefix}completedDate`];
				}
			}
		} else {
			const date = node.expectedAcquireDate;
			if (date) {
				properties[`${prefix}goalYear`] = getYearFromDate(date);
				properties[`${prefix}goalQuarter`] = getQuarterFromDate(date);
			}

			if (enabled.status) {
				properties[`${prefix}status`] = calculateStatus(node.progress, date);
			}

			if (enabled.timeMetrics) {
				properties[`${prefix}daysRemaining`] = calculateDaysRemaining(date);
				properties[`${prefix}isOverdue`] = isOverdue(node.progress, date);

				if (node.progress >= 100 && !properties[`${prefix}completedDate`]) {
					properties[`${prefix}completedDate`] = `[[${getTodayDateString()}]]`;
				} else if (node.progress < 100) {
					delete properties[`${prefix}completedDate`];
				}
			}
		}

		reorderProperties(properties, prefix);
	});
}

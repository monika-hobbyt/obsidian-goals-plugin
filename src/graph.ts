import { App, TFile } from "obsidian";
import { GoalNode, RecursiveGoalsSettings } from "./types";

export function extractLinkPath(value: any): string | null {
	if (!value) return null;
	if (typeof value === "string") {
		const match = value.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/);
		if (match) return match[1];
		return value;
	}
	if (typeof value === "object" && value.path) return value.path;
	return null;
}

export function getProperties(app: App, file: TFile): Record<string, any> | null {
	const cache = app.metadataCache.getFileCache(file);
	return cache?.frontmatter || null;
}

export function getProgress(app: App, file: TFile, settings: RecursiveGoalsSettings): number {
	const properties = getProperties(app, file);
	if (!properties) return 0;
	const value = Number(properties[settings.progressProperty]);
	return isNaN(value) ? 0 : value;
}

export function getPriority(app: App, file: TFile, settings: RecursiveGoalsSettings): number {
	const properties = getProperties(app, file);
	if (!properties) return 0;
	const value = Number(properties[settings.priorityProperty]);
	return isNaN(value) ? 0 : value;
}

export function getExpectedAcquireDate(
	app: App,
	file: TFile,
	settings: RecursiveGoalsSettings
): string | null {
	const properties = getProperties(app, file);
	if (!properties) return null;
	const value = properties[settings.expectedAcquireDateProperty];
	const linkPath = extractLinkPath(value);
	return linkPath || (typeof value === "string" ? value : null);
}

export function isBlocked(app: App, file: TFile, settings: RecursiveGoalsSettings): boolean {
	const properties = getProperties(app, file);
	if (!properties) return false;
	return properties[settings.blockedProperty] === true;
}

export function getParentGoal(
	app: App,
	file: TFile,
	settings: RecursiveGoalsSettings
): TFile | null {
	const properties = getProperties(app, file);
	if (!properties) return null;
	const linkPath = extractLinkPath(properties[settings.goalProperty]);
	if (!linkPath) return null;
	return app.metadataCache.getFirstLinkpathDest(linkPath, file.path);
}

export function isGoalFile(file: TFile, settings: RecursiveGoalsSettings): boolean {
	return file.extension === "md" && file.path.startsWith(settings.goalsFolder);
}

export function getGoalFiles(app: App, settings: RecursiveGoalsSettings): TFile[] {
	return app.vault.getMarkdownFiles().filter((file) => isGoalFile(file, settings));
}

export function buildGoalGraph(app: App, settings: RecursiveGoalsSettings): Map<string, GoalNode> {
	const graph = new Map<string, GoalNode>();
	const goalFiles = getGoalFiles(app, settings);

	for (const file of goalFiles) {
		const parentGoal = getParentGoal(app, file, settings);
		graph.set(file.path, {
			file,
			path: file.path,
			name: file.basename,
			progress: getProgress(app, file, settings),
			priority: getPriority(app, file, settings),
			expectedAcquireDate: getExpectedAcquireDate(app, file, settings),
			blocked: isBlocked(app, file, settings),
			parentPath: parentGoal?.path || null,
			children: [],
		});
	}

	for (const [path, node] of graph) {
		if (node.parentPath && graph.has(node.parentPath)) {
			graph.get(node.parentPath)!.children.push(path);
		}
	}

	return graph;
}

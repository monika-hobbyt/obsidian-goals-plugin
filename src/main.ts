import { Plugin, TFile } from "obsidian";
import { RecursiveGoalsSettings, DEFAULT_SETTINGS, GoalNode } from "./types";
import { RecursiveGoalsSettingTab } from "./settings";
import { buildGoalGraph, isGoalFile } from "./graph";
import { updateGoalFile } from "./properties";
import { findRootGoal } from "./calculations";

export default class RecursiveGoalsPlugin extends Plugin {
	settings: RecursiveGoalsSettings;
	private updateTimeout: ReturnType<typeof setTimeout> | null = null;
	private isProcessing = false;
	private cachedGraph: Map<string, GoalNode> | null = null;
	private pendingUpdates: Set<string> = new Set();

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new RecursiveGoalsSettingTab(this.app, this));

		this.addRibbonIcon("target", "Recalculate goals", () => {
			this.processAllGoals();
		});

		this.addCommand({
			id: "recalculate-goals",
			name: "Recalculate all goals",
			callback: () => {
				this.processAllGoals();
			},
		});

		this.app.workspace.onLayoutReady(() => {
			this.processAllGoals();
		});

		this.registerEvent(
			this.app.metadataCache.on("changed", (file) => {
				if (file instanceof TFile && isGoalFile(file, this.settings)) {
					this.pendingUpdates.add(file.path);
					this.scheduleProcessing();
				}
			})
		);

		this.registerEvent(
			this.app.vault.on("delete", (file) => {
				if (file instanceof TFile && isGoalFile(file, this.settings)) {
					this.invalidateCache();
					this.scheduleProcessing();
				}
			})
		);

		this.registerEvent(
			this.app.vault.on("rename", (file, oldPath) => {
				if (file instanceof TFile && isGoalFile(file, this.settings)) {
					this.invalidateCache();
					this.scheduleProcessing();
				}
			})
		);
	}

	invalidateCache(): void {
		this.cachedGraph = null;
		this.pendingUpdates.clear();
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	scheduleProcessing(): void {
		if (this.updateTimeout) {
			clearTimeout(this.updateTimeout);
		}
		this.updateTimeout = setTimeout(() => {
			this.processAllGoals();
		}, 500);
	}

	async processAllGoals(): Promise<void> {
		if (this.isProcessing) return;
		this.isProcessing = true;

		try {
			const graph = buildGoalGraph(this.app, this.settings);
			this.cachedGraph = graph;

			const pathsToUpdate = this.getAffectedPaths(graph);
			this.pendingUpdates.clear();

			for (const path of pathsToUpdate) {
				await updateGoalFile(this.app, graph, path, this.settings);
			}
		} finally {
			this.isProcessing = false;
		}
	}

	private getAffectedPaths(graph: Map<string, GoalNode>): Set<string> {
		if (this.pendingUpdates.size === 0) {
			return new Set(graph.keys());
		}

		const affected = new Set<string>();

		for (const changedPath of this.pendingUpdates) {
			this.collectAffectedBranch(graph, changedPath, affected);
		}

		return affected;
	}

	private collectAffectedBranch(
		graph: Map<string, GoalNode>,
		path: string,
		affected: Set<string>
	): void {
		if (affected.has(path)) return;

		const node = graph.get(path);
		if (!node) return;

		affected.add(path);

		if (node.parentPath && graph.has(node.parentPath)) {
			this.collectAffectedBranch(graph, node.parentPath, affected);
		}

		for (const childPath of node.children) {
			this.collectAffectedBranch(graph, childPath, affected);
		}
	}
}

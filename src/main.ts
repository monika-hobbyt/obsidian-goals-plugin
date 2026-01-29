import { Plugin, TFile } from "obsidian";
import { RecursiveGoalsSettings, DEFAULT_SETTINGS } from "./types";
import { RecursiveGoalsSettingTab } from "./settings";
import { buildGoalGraph, isGoalFile } from "./graph";
import { updateGoalFile } from "./properties";

export default class RecursiveGoalsPlugin extends Plugin {
	settings: RecursiveGoalsSettings;
	private updateTimeout: ReturnType<typeof setTimeout> | null = null;
	private isProcessing = false;

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
					this.scheduleProcessing();
				}
			})
		);
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
			for (const path of graph.keys()) {
				await updateGoalFile(this.app, graph, path, this.settings);
			}
		} finally {
			this.isProcessing = false;
		}
	}
}

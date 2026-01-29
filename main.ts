import { App, Plugin, PluginSettingTab, Setting, TFile } from "obsidian";

interface RecursiveGoalsSettings {
	goalsFolder: string;
	goalProperty: string;
	progressProperty: string;
}

const DEFAULT_SETTINGS: RecursiveGoalsSettings = {
	goalsFolder: "Goals",
	goalProperty: "goal",
	progressProperty: "progress",
};

interface GoalNode {
	file: TFile;
	path: string;
	name: string;
	progress: number;
	parentPath: string | null;
	children: string[];
}

export default class RecursiveGoalsPlugin extends Plugin {
	settings: RecursiveGoalsSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new RecursiveGoalsSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	isGoalFile(file: TFile): boolean {
		return file.extension === "md" && file.path.startsWith(this.settings.goalsFolder);
	}

	getGoalFiles(): TFile[] {
		return this.app.vault.getMarkdownFiles().filter((file) => this.isGoalFile(file));
	}

	getProperties(file: TFile): Record<string, any> | null {
		const cache = this.app.metadataCache.getFileCache(file);
		return cache?.frontmatter || null;
	}

	getProgress(file: TFile): number {
		const properties = this.getProperties(file);
		if (!properties) return 0;
		const value = Number(properties[this.settings.progressProperty]);
		return isNaN(value) ? 0 : value;
	}

	extractLinkPath(value: any): string | null {
		if (!value) return null;
		if (typeof value === "string") {
			const match = value.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/);
			if (match) return match[1];
			return value;
		}
		if (typeof value === "object" && value.path) return value.path;
		return null;
	}

	getParentGoal(file: TFile): TFile | null {
		const properties = this.getProperties(file);
		if (!properties) return null;
		const linkPath = this.extractLinkPath(properties[this.settings.goalProperty]);
		if (!linkPath) return null;
		return this.app.metadataCache.getFirstLinkpathDest(linkPath, file.path);
	}

	buildGoalGraph(): Map<string, GoalNode> {
		const graph = new Map<string, GoalNode>();
		const goalFiles = this.getGoalFiles();

		for (const file of goalFiles) {
			const parentGoal = this.getParentGoal(file);
			graph.set(file.path, {
				file,
				path: file.path,
				name: file.basename,
				progress: this.getProgress(file),
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
}

class RecursiveGoalsSettingTab extends PluginSettingTab {
	plugin: RecursiveGoalsPlugin;

	constructor(app: App, plugin: RecursiveGoalsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Goals folder")
			.setDesc("Folder path where goals are stored")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.goalsFolder)
					.onChange(async (value) => {
						this.plugin.settings.goalsFolder = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Goal property")
			.setDesc("Property linking to parent goal")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.goalProperty)
					.onChange(async (value) => {
						this.plugin.settings.goalProperty = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Progress property")
			.setDesc("Property storing progress value")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.progressProperty)
					.onChange(async (value) => {
						this.plugin.settings.progressProperty = value;
						await this.plugin.saveSettings();
					})
			);
	}
}

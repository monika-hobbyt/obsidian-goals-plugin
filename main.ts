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

import { App, PluginSettingTab, Setting } from "obsidian";
import type RecursiveGoalsPlugin from "./main";

export class RecursiveGoalsSettingTab extends PluginSettingTab {
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
				text.setValue(this.plugin.settings.goalsFolder).onChange(async (value) => {
					this.plugin.settings.goalsFolder = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Goal property")
			.setDesc("Property linking to parent goal")
			.addText((text) =>
				text.setValue(this.plugin.settings.goalProperty).onChange(async (value) => {
					this.plugin.settings.goalProperty = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Progress property")
			.setDesc("Property storing progress value")
			.addText((text) =>
				text.setValue(this.plugin.settings.progressProperty).onChange(async (value) => {
					this.plugin.settings.progressProperty = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Priority property")
			.setDesc("Property storing priority value")
			.addText((text) =>
				text.setValue(this.plugin.settings.priorityProperty).onChange(async (value) => {
					this.plugin.settings.priorityProperty = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Expected acquire date property")
			.setDesc("Property storing expected completion date")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.expectedAcquireDateProperty)
					.onChange(async (value) => {
						this.plugin.settings.expectedAcquireDateProperty = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Blocked property")
			.setDesc("Property indicating goal is blocked (boolean)")
			.addText((text) =>
				text.setValue(this.plugin.settings.blockedProperty).onChange(async (value) => {
					this.plugin.settings.blockedProperty = value;
					await this.plugin.saveSettings();
				})
			);
	}
}

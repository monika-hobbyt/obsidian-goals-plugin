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

		containerEl.createEl("h3", { text: "Property Names" });

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

		containerEl.createEl("h3", { text: "Workflow Properties" });

		new Setting(containerEl)
			.setName("Node type property")
			.setDesc("Property storing node type (strategic-goal, sub-goal, project, stage, task, sub-task)")
			.addText((text) =>
				text.setValue(this.plugin.settings.nodeTypeProperty).onChange(async (value) => {
					this.plugin.settings.nodeTypeProperty = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Category property")
			.setDesc("Property storing workflow category (inbox, active, incubator, archive, history)")
			.addText((text) =>
				text.setValue(this.plugin.settings.categoryProperty).onChange(async (value) => {
					this.plugin.settings.categoryProperty = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Size property")
			.setDesc("Property storing task size (S, M, L)")
			.addText((text) =>
				text.setValue(this.plugin.settings.sizeProperty).onChange(async (value) => {
					this.plugin.settings.sizeProperty = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Energy type property")
			.setDesc("Property storing energy type (creative, administrative)")
			.addText((text) =>
				text.setValue(this.plugin.settings.energyTypeProperty).onChange(async (value) => {
					this.plugin.settings.energyTypeProperty = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Assignee property")
			.setDesc("Property storing who is assigned to the task")
			.addText((text) =>
				text.setValue(this.plugin.settings.assigneeProperty).onChange(async (value) => {
					this.plugin.settings.assigneeProperty = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Urgent property")
			.setDesc("Property indicating task is urgent/time-sensitive (boolean)")
			.addText((text) =>
				text.setValue(this.plugin.settings.urgentProperty).onChange(async (value) => {
					this.plugin.settings.urgentProperty = value;
					await this.plugin.saveSettings();
				})
			);

		containerEl.createEl("h3", { text: "Calculation Options" });

		new Setting(containerEl)
			.setName("Computed property prefix")
			.setDesc("Prefix for computed properties (default: _)")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.computedPropertyPrefix)
					.onChange(async (value) => {
						this.plugin.settings.computedPropertyPrefix = value || "_";
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Progress calculation method")
			.setDesc("How to calculate parent progress from children")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("weighted", "Weighted by priority")
					.addOption("simple", "Simple average")
					.setValue(this.plugin.settings.progressCalculationMethod)
					.onChange(async (value: "weighted" | "simple") => {
						this.plugin.settings.progressCalculationMethod = value;
						await this.plugin.saveSettings();
					})
			);

		containerEl.createEl("h3", { text: "Enabled Properties" });

		new Setting(containerEl)
			.setName("Root goal tracking")
			.setDesc("Add _rootGoal and _rootGoalPriority")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enabledProperties.rootGoal)
					.onChange(async (value) => {
						this.plugin.settings.enabledProperties.rootGoal = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Chain priority")
			.setDesc("Add _chainPriority (sum of priorities from root)")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enabledProperties.chainPriority)
					.onChange(async (value) => {
						this.plugin.settings.enabledProperties.chainPriority = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Depth tracking")
			.setDesc("Add _depth (levels from root)")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enabledProperties.depth)
					.onChange(async (value) => {
						this.plugin.settings.enabledProperties.depth = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Status tracking")
			.setDesc("Add _status (not-started, in-progress, completed, overdue)")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enabledProperties.status)
					.onChange(async (value) => {
						this.plugin.settings.enabledProperties.status = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Time metrics")
			.setDesc("Add _daysRemaining, _isOverdue, _completedDate")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enabledProperties.timeMetrics)
					.onChange(async (value) => {
						this.plugin.settings.enabledProperties.timeMetrics = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Hierarchy metrics")
			.setDesc("Add _childCount, _children, _totalDescendants, _leafCount")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enabledProperties.hierarchyMetrics)
					.onChange(async (value) => {
						this.plugin.settings.enabledProperties.hierarchyMetrics = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Blocked tracking")
			.setDesc("Add _hasBlockedChildren")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enabledProperties.blockedTracking)
					.onChange(async (value) => {
						this.plugin.settings.enabledProperties.blockedTracking = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Node type inference")
			.setDesc("Add _nodeType and _isLeaf (auto-inferred from hierarchy)")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enabledProperties.nodeType)
					.onChange(async (value) => {
						this.plugin.settings.enabledProperties.nodeType = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Workflow tracking")
			.setDesc("Add _hasUrgentChildren, _totalTimeEstimate")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enabledProperties.workflowTracking)
					.onChange(async (value) => {
						this.plugin.settings.enabledProperties.workflowTracking = value;
						await this.plugin.saveSettings();
					})
			);
	}
}

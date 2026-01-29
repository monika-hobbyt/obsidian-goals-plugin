import { App, Plugin, PluginSettingTab, Setting, TFile } from "obsidian";

interface RecursiveGoalsSettings {
	goalsFolder: string;
	goalProperty: string;
	progressProperty: string;
	priorityProperty: string;
	expectedAcquireDateProperty: string;
}

const DEFAULT_SETTINGS: RecursiveGoalsSettings = {
	goalsFolder: "Goals",
	goalProperty: "goal",
	progressProperty: "progress",
	priorityProperty: "priority",
	expectedAcquireDateProperty: "expectedAcquireDate",
};

const COMPUTED_PROPERTY_ORDER = [
	"_rootGoal",
	"_rootGoalPriority",
	"_childCount",
	"_children",
	"_calculatedProgress",
	"_calculatedExpectedAcquireDate",
	"_goalYear",
	"_goalQuarter",
];

interface GoalNode {
	file: TFile;
	path: string;
	name: string;
	progress: number;
	priority: number;
	expectedAcquireDate: string | null;
	parentPath: string | null;
	children: string[];
}

export default class RecursiveGoalsPlugin extends Plugin {
	settings: RecursiveGoalsSettings;
	private updateTimeout: ReturnType<typeof setTimeout> | null = null;
	private isProcessing = false;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new RecursiveGoalsSettingTab(this.app, this));

		this.app.workspace.onLayoutReady(() => {
			this.processAllGoals();
		});

		this.registerEvent(
			this.app.metadataCache.on("changed", (file) => {
				if (file instanceof TFile && this.isGoalFile(file)) {
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

	getPriority(file: TFile): number {
		const properties = this.getProperties(file);
		if (!properties) return 0;
		const value = Number(properties[this.settings.priorityProperty]);
		return isNaN(value) ? 0 : value;
	}

	getExpectedAcquireDate(file: TFile): string | null {
		const properties = this.getProperties(file);
		if (!properties) return null;
		const value = properties[this.settings.expectedAcquireDateProperty];
		const linkPath = this.extractLinkPath(value);
		return linkPath || (typeof value === "string" ? value : null);
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
				priority: this.getPriority(file),
				expectedAcquireDate: this.getExpectedAcquireDate(file),
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

	calculateAccumulatedProgress(graph: Map<string, GoalNode>, path: string, visited: Set<string> = new Set()): number {
		if (visited.has(path)) return 0;
		visited.add(path);

		const node = graph.get(path);
		if (!node) return 0;

		if (node.children.length === 0) {
			return node.progress;
		}

		let total = 0;
		for (const childPath of node.children) {
			total += this.calculateAccumulatedProgress(graph, childPath, visited);
		}
		return total / node.children.length;
	}

	findRootGoal(graph: Map<string, GoalNode>, path: string, visited: Set<string> = new Set()): GoalNode | null {
		if (visited.has(path)) return null;
		visited.add(path);

		const node = graph.get(path);
		if (!node) return null;

		if (!node.parentPath || !graph.has(node.parentPath)) {
			return node;
		}

		return this.findRootGoal(graph, node.parentPath, visited);
	}

	findLatestDate(graph: Map<string, GoalNode>, path: string, visited: Set<string> = new Set()): string | null {
		if (visited.has(path)) return null;
		visited.add(path);

		const node = graph.get(path);
		if (!node) return null;

		if (node.children.length === 0) {
			return node.expectedAcquireDate;
		}

		let latest: string | null = null;
		for (const childPath of node.children) {
			const childDate = this.findLatestDate(graph, childPath, visited);
			if (childDate && (!latest || childDate > latest)) {
				latest = childDate;
			}
		}
		return latest;
	}

	getYearFromDate(dateStr: string | null): number | null {
		if (!dateStr) return null;
		const match = dateStr.match(/(\d{4})/);
		return match ? parseInt(match[1]) : null;
	}

	getQuarterFromDate(dateStr: string | null): string | null {
		if (!dateStr) return null;
		const match = dateStr.match(/\d{4}-(\d{2})/);
		if (!match) return null;
		const month = parseInt(match[1]);
		if (month <= 3) return "Q1";
		if (month <= 6) return "Q2";
		if (month <= 9) return "Q3";
		return "Q4";
	}

	formatDateAsLink(dateStr: string | null): string | null {
		if (!dateStr) return null;
		const match = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
		return match ? `[[${match[1]}]]` : null;
	}

	getChildrenLinks(graph: Map<string, GoalNode>, path: string): string[] {
		const node = graph.get(path);
		if (!node) return [];
		return node.children.map((childPath) => {
			const child = graph.get(childPath);
			return child ? `[[${child.name}]]` : "";
		}).filter((link) => link !== "");
	}

	reorderProperties(properties: Record<string, any>): void {
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

	async updateGoalFile(graph: Map<string, GoalNode>, path: string): Promise<void> {
		const node = graph.get(path);
		if (!node) return;

		const rootGoal = this.findRootGoal(graph, path);
		const hasChildren = node.children.length > 0;

		await this.app.fileManager.processFrontMatter(node.file, (properties) => {
			if (rootGoal) {
				properties["_rootGoal"] = `[[${rootGoal.name}]]`;
				properties["_rootGoalPriority"] = rootGoal.priority;
			}

			if (hasChildren) {
				properties["_childCount"] = node.children.length;
				properties["_children"] = this.getChildrenLinks(graph, path);
				properties["_calculatedProgress"] = Math.round(this.calculateAccumulatedProgress(graph, path));

				const latestDate = this.findLatestDate(graph, path);
				if (latestDate) {
					properties["_calculatedExpectedAcquireDate"] = this.formatDateAsLink(latestDate);
					properties["_goalYear"] = this.getYearFromDate(latestDate);
					properties["_goalQuarter"] = this.getQuarterFromDate(latestDate);
				}
			} else {
				const date = node.expectedAcquireDate;
				if (date) {
					properties["_goalYear"] = this.getYearFromDate(date);
					properties["_goalQuarter"] = this.getQuarterFromDate(date);
				}
			}

			this.reorderProperties(properties);
		});
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
			const graph = this.buildGoalGraph();
			for (const path of graph.keys()) {
				await this.updateGoalFile(graph, path);
			}
		} finally {
			this.isProcessing = false;
		}
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

		new Setting(containerEl)
			.setName("Priority property")
			.setDesc("Property storing priority value")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.priorityProperty)
					.onChange(async (value) => {
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
	}
}

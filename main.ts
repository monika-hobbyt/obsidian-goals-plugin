import { App, Plugin, PluginSettingTab, Setting, TFile } from "obsidian";

interface RecursiveGoalsSettings {
	goalsFolder: string;
	goalProperty: string;
	progressProperty: string;
	priorityProperty: string;
	expectedAcquireDateProperty: string;
	blockedProperty: string;
}

const DEFAULT_SETTINGS: RecursiveGoalsSettings = {
	goalsFolder: "Goals",
	goalProperty: "goal",
	progressProperty: "progress",
	priorityProperty: "priority",
	expectedAcquireDateProperty: "expectedAcquireDate",
	blockedProperty: "blocked",
};

const COMPUTED_PROPERTY_ORDER = [
	"_rootGoal",
	"_rootGoalPriority",
	"_chainPriority",
	"_depth",
	"_status",
	"_daysRemaining",
	"_isOverdue",
	"_completedDate",
	"_hasBlockedChildren",
	"_childCount",
	"_children",
	"_totalDescendants",
	"_leafCount",
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
	blocked: boolean;
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

	isBlocked(file: TFile): boolean {
		const properties = this.getProperties(file);
		if (!properties) return false;
		return properties[this.settings.blockedProperty] === true;
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
				blocked: this.isBlocked(file),
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

		let weightedSum = 0;
		let totalPriority = 0;

		for (const childPath of node.children) {
			const child = graph.get(childPath);
			if (!child) continue;

			const childProgress = this.calculateAccumulatedProgress(graph, childPath, visited);
			const priority = child.priority || 1;

			weightedSum += childProgress * priority;
			totalPriority += priority;
		}

		return totalPriority > 0 ? weightedSum / totalPriority : 0;
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

	calculateChainPriority(graph: Map<string, GoalNode>, path: string, visited: Set<string> = new Set()): number {
		if (visited.has(path)) return 0;
		visited.add(path);

		const node = graph.get(path);
		if (!node) return 0;

		if (!node.parentPath || !graph.has(node.parentPath)) {
			return node.priority;
		}

		const parentPriority = this.calculateChainPriority(graph, node.parentPath, visited);
		return parentPriority * node.priority;
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

	calculateStatus(progress: number, dateStr: string | null): string {
		if (progress >= 100) return "completed";

		if (dateStr) {
			const match = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
			if (match) {
				const targetDate = new Date(match[1]);
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				if (targetDate < today) return "overdue";
			}
		}

		if (progress > 0) return "in-progress";
		return "not-started";
	}

	calculateDaysRemaining(dateStr: string | null): number | null {
		if (!dateStr) return null;
		const match = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
		if (!match) return null;

		const targetDate = new Date(match[1]);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		targetDate.setHours(0, 0, 0, 0);

		const diffTime = targetDate.getTime() - today.getTime();
		return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	}

	isOverdue(progress: number, dateStr: string | null): boolean {
		if (progress >= 100) return false;
		const daysRemaining = this.calculateDaysRemaining(dateStr);
		return daysRemaining !== null && daysRemaining < 0;
	}

	getTodayDateString(): string {
		const today = new Date();
		const year = today.getFullYear();
		const month = String(today.getMonth() + 1).padStart(2, "0");
		const day = String(today.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	}

	calculateDepth(graph: Map<string, GoalNode>, path: string, visited: Set<string> = new Set()): number {
		if (visited.has(path)) return 0;
		visited.add(path);

		const node = graph.get(path);
		if (!node) return 0;

		if (!node.parentPath || !graph.has(node.parentPath)) {
			return 0;
		}

		return 1 + this.calculateDepth(graph, node.parentPath, visited);
	}

	countTotalDescendants(graph: Map<string, GoalNode>, path: string, visited: Set<string> = new Set()): number {
		if (visited.has(path)) return 0;
		visited.add(path);

		const node = graph.get(path);
		if (!node) return 0;

		let count = node.children.length;
		for (const childPath of node.children) {
			count += this.countTotalDescendants(graph, childPath, visited);
		}
		return count;
	}

	countLeafGoals(graph: Map<string, GoalNode>, path: string, visited: Set<string> = new Set()): number {
		if (visited.has(path)) return 0;
		visited.add(path);

		const node = graph.get(path);
		if (!node) return 0;

		if (node.children.length === 0) {
			return 1;
		}

		let count = 0;
		for (const childPath of node.children) {
			count += this.countLeafGoals(graph, childPath, visited);
		}
		return count;
	}

	hasBlockedDescendants(graph: Map<string, GoalNode>, path: string, visited: Set<string> = new Set()): boolean {
		if (visited.has(path)) return false;
		visited.add(path);

		const node = graph.get(path);
		if (!node) return false;

		for (const childPath of node.children) {
			const child = graph.get(childPath);
			if (child?.blocked) return true;
			if (this.hasBlockedDescendants(graph, childPath, visited)) return true;
		}
		return false;
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

			if (node.parentPath) {
				properties["_chainPriority"] = this.calculateChainPriority(graph, path);
			}

			properties["_depth"] = this.calculateDepth(graph, path);

			if (hasChildren) {
				properties["_totalDescendants"] = this.countTotalDescendants(graph, path);
				properties["_leafCount"] = this.countLeafGoals(graph, path);
				properties["_hasBlockedChildren"] = this.hasBlockedDescendants(graph, path);
				properties["_childCount"] = node.children.length;
				properties["_children"] = this.getChildrenLinks(graph, path);

				const calculatedProgress = Math.round(this.calculateAccumulatedProgress(graph, path));
				properties["_calculatedProgress"] = calculatedProgress;

				if (properties[this.settings.progressProperty] !== undefined) {
					delete properties[this.settings.progressProperty];
				}

				const latestDate = this.findLatestDate(graph, path);
				if (latestDate) {
					properties["_calculatedExpectedAcquireDate"] = this.formatDateAsLink(latestDate);
					properties["_goalYear"] = this.getYearFromDate(latestDate);
					properties["_goalQuarter"] = this.getQuarterFromDate(latestDate);
				}

				properties["_status"] = this.calculateStatus(calculatedProgress, latestDate);
				properties["_daysRemaining"] = this.calculateDaysRemaining(latestDate);
				properties["_isOverdue"] = this.isOverdue(calculatedProgress, latestDate);

				if (calculatedProgress >= 100 && !properties["_completedDate"]) {
					properties["_completedDate"] = `[[${this.getTodayDateString()}]]`;
				} else if (calculatedProgress < 100) {
					delete properties["_completedDate"];
				}
			} else {
				const date = node.expectedAcquireDate;
				if (date) {
					properties["_goalYear"] = this.getYearFromDate(date);
					properties["_goalQuarter"] = this.getQuarterFromDate(date);
				}

				properties["_status"] = this.calculateStatus(node.progress, date);
				properties["_daysRemaining"] = this.calculateDaysRemaining(date);
				properties["_isOverdue"] = this.isOverdue(node.progress, date);

				if (node.progress >= 100 && !properties["_completedDate"]) {
					properties["_completedDate"] = `[[${this.getTodayDateString()}]]`;
				} else if (node.progress < 100) {
					delete properties["_completedDate"];
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

		new Setting(containerEl)
			.setName("Blocked property")
			.setDesc("Property indicating goal is blocked (boolean)")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.blockedProperty)
					.onChange(async (value) => {
						this.plugin.settings.blockedProperty = value;
						await this.plugin.saveSettings();
					})
			);
	}
}

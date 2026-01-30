import { TFile } from "obsidian";

export type ProgressCalculationMethod = "weighted" | "simple";

export type NodeType =
	| "strategic-goal"
	| "sub-goal"
	| "project"
	| "stage"
	| "task"
	| "sub-task";

export type Category =
	| "inbox"
	| "active"
	| "incubator"
	| "archive"
	| "history";

export type TaskSize = "S" | "M" | "L";

export type EnergyType = "creative" | "administrative";

export interface ComputedPropertyToggles {
	rootGoal: boolean;
	chainPriority: boolean;
	depth: boolean;
	status: boolean;
	timeMetrics: boolean;
	hierarchyMetrics: boolean;
	blockedTracking: boolean;
	nodeType: boolean;
	workflowTracking: boolean;
}

export interface RecursiveGoalsSettings {
	goalsFolder: string;
	goalProperty: string;
	progressProperty: string;
	priorityProperty: string;
	expectedAcquireDateProperty: string;
	blockedProperty: string;
	nodeTypeProperty: string;
	categoryProperty: string;
	sizeProperty: string;
	energyTypeProperty: string;
	assigneeProperty: string;
	urgentProperty: string;
	computedPropertyPrefix: string;
	progressCalculationMethod: ProgressCalculationMethod;
	enabledProperties: ComputedPropertyToggles;
}

export const DEFAULT_SETTINGS: RecursiveGoalsSettings = {
	goalsFolder: "Goals",
	goalProperty: "goal",
	progressProperty: "progress",
	priorityProperty: "priority",
	expectedAcquireDateProperty: "expectedAcquireDate",
	blockedProperty: "blocked",
	nodeTypeProperty: "nodeType",
	categoryProperty: "category",
	sizeProperty: "size",
	energyTypeProperty: "energyType",
	assigneeProperty: "assignee",
	urgentProperty: "urgent",
	computedPropertyPrefix: "_",
	progressCalculationMethod: "weighted",
	enabledProperties: {
		rootGoal: true,
		chainPriority: true,
		depth: true,
		status: true,
		timeMetrics: true,
		hierarchyMetrics: true,
		blockedTracking: true,
		nodeType: true,
		workflowTracking: true,
	},
};

export const COMPUTED_PROPERTY_ORDER = [
	"_rootGoal",
	"_rootGoalPriority",
	"_chainPriority",
	"_depth",
	"_nodeType",
	"_isLeaf",
	"_status",
	"_daysRemaining",
	"_isOverdue",
	"_completedDate",
	"_hasBlockedChildren",
	"_hasUrgentChildren",
	"_childCount",
	"_children",
	"_totalDescendants",
	"_leafCount",
	"_calculatedProgress",
	"_calculatedExpectedAcquireDate",
	"_totalTimeEstimate",
	"_goalYear",
	"_goalQuarter",
];

export interface GoalNode {
	file: TFile;
	path: string;
	name: string;
	progress: number;
	priority: number;
	expectedAcquireDate: string | null;
	blocked: boolean;
	parentPath: string | null;
	children: string[];
	nodeType: NodeType | null;
	category: Category | null;
	size: TaskSize | null;
	energyType: EnergyType | null;
	assignee: string | null;
	urgent: boolean;
}

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
	"strategic-goal": "Strategic Goal",
	"sub-goal": "Sub-goal",
	"project": "Project",
	"stage": "Stage",
	"task": "Task",
	"sub-task": "Sub-task",
};

export const CATEGORY_LABELS: Record<Category, string> = {
	"inbox": "Inbox",
	"active": "Active",
	"incubator": "Incubator",
	"archive": "Archive",
	"history": "History",
};

export const SIZE_HOURS: Record<TaskSize, number> = {
	"S": 0.5,
	"M": 2,
	"L": 4,
};

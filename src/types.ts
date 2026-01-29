import { TFile } from "obsidian";

export type ProgressCalculationMethod = "weighted" | "simple";

export interface ComputedPropertyToggles {
	rootGoal: boolean;
	chainPriority: boolean;
	depth: boolean;
	status: boolean;
	timeMetrics: boolean;
	hierarchyMetrics: boolean;
	blockedTracking: boolean;
}

export interface RecursiveGoalsSettings {
	goalsFolder: string;
	goalProperty: string;
	progressProperty: string;
	priorityProperty: string;
	expectedAcquireDateProperty: string;
	blockedProperty: string;
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
	},
};

export const COMPUTED_PROPERTY_ORDER = [
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
}

import { TFile } from "obsidian";

export interface RecursiveGoalsSettings {
	goalsFolder: string;
	goalProperty: string;
	progressProperty: string;
	priorityProperty: string;
	expectedAcquireDateProperty: string;
	blockedProperty: string;
}

export const DEFAULT_SETTINGS: RecursiveGoalsSettings = {
	goalsFolder: "Goals",
	goalProperty: "goal",
	progressProperty: "progress",
	priorityProperty: "priority",
	expectedAcquireDateProperty: "expectedAcquireDate",
	blockedProperty: "blocked",
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

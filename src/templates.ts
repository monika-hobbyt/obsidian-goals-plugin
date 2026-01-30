import { App, TFolder } from "obsidian";

const TEMPLATES_FOLDER = "Templates";

const TEMPLATES: Record<string, string> = {
	"Goal - Quick Capture": `---
category: inbox
---

# {{title}}

## Idea


## Why


## Next Action

`,

	"Goal - Strategic Goal": `---
nodeType: strategic-goal
category: active
priority: 1
expectedAcquireDate:
---

# {{title}}

## Vision


## Success Criteria

- [ ]

## Notes

`,

	"Goal - Sub-goal": `---
goal: "[[]]"
nodeType: sub-goal
category: active
priority: 1
expectedAcquireDate:
---

# {{title}}

## Objective


## Success Criteria

- [ ]

## Notes

`,

	"Goal - Project": `---
goal: "[[]]"
nodeType: project
category: active
priority: 1
expectedAcquireDate:
---

# {{title}}

## Objective


## Deliverables

- [ ]

## Notes

`,

	"Goal - Stage": `---
goal: "[[]]"
nodeType: stage
category: active
priority: 1
expectedAcquireDate:
---

# {{title}}

## Objective


## Milestones

- [ ]

## Notes

`,

	"Goal - Task": `---
goal: "[[]]"
nodeType: task
category: active
priority: 1
progress: 0
expectedAcquireDate:
size: M
energyType:
assignee:
blocked: false
urgent: false
---

# {{title}}

## Description


## Acceptance Criteria

- [ ]

## Notes

`,

	"Goal - Sub-task": `---
goal: "[[]]"
nodeType: sub-task
category: active
priority: 1
progress: 0
expectedAcquireDate:
size: S
energyType:
assignee:
blocked: false
urgent: false
---

# {{title}}

## Description


## Done When

- [ ]

`,

	"Goal Templates - README": `# Goal Templates

Use these templates with Obsidian's core Templates plugin or Templater.

## Available Templates

| Template | Use Case |
|----------|----------|
| **Goal - Quick Capture** | Fast inbox capture for new ideas |
| **Goal - Strategic Goal** | Top-level life/business goals (depth 0) |
| **Goal - Sub-goal** | Major objectives under a strategic goal (depth 1) |
| **Goal - Project** | Concrete projects with deliverables (depth 2) |
| **Goal - Stage** | Project phases or milestones (depth 3) |
| **Goal - Task** | Actionable items with progress tracking (depth 4) |
| **Goal - Sub-task** | Small atomic actions (depth 5+) |

## Property Order

All templates follow a consistent property order:

\`\`\`yaml
# Structural
goal: "[[Parent]]"
nodeType: task

# Workflow
category: active

# Planning
priority: 1
progress: 0
expectedAcquireDate:

# Execution
size: M
energyType: creative
assignee:

# Flags
blocked: false
urgent: false
\`\`\`

## Property Reference

### Manual Properties

| Property | Type | Values |
|----------|------|--------|
| \`goal\` | link | \`"[[Parent Name]]"\` |
| \`nodeType\` | string | strategic-goal, sub-goal, project, stage, task, sub-task |
| \`category\` | string | inbox, active, incubator, archive, history |
| \`priority\` | number | 1 = highest importance |
| \`progress\` | number | 0-100 (leaf nodes only) |
| \`expectedAcquireDate\` | date | \`"[[2025-03-15]]"\` or \`2025-03-15\` |
| \`size\` | string | S (0.5h), M (2h), L (4h) |
| \`energyType\` | string | creative, administrative |
| \`assignee\` | string | Person responsible |
| \`blocked\` | boolean | true / false |
| \`urgent\` | boolean | true / false |

### Computed Properties (auto-generated)

Added automatically by the plugin:

\`\`\`yaml
_rootGoal:
_rootGoalPriority:
_chainPriority:
_depth:
_nodeType:
_isLeaf:
_status:
_daysRemaining:
_isOverdue:
_completedDate:
_hasBlockedChildren:
_hasUrgentChildren:
_childCount:
_children:
_totalDescendants:
_leafCount:
_calculatedProgress:
_calculatedExpectedAcquireDate:
_totalTimeEstimate:
_goalYear:
_goalQuarter:
\`\`\`

## Workflow

\`\`\`
Quick Capture -> inbox
    |
    v
[Triage] -> active / incubator / archive
    |
    v
[Work] -> progress updates
    |
    v
[Complete] -> archive -> history
\`\`\`

## Tips

1. Use **Goal - Quick Capture** for fast idea capture without thinking about structure
2. During triage, convert inbox items to proper goal types
3. Set \`progress\` only on leaf nodes (tasks/sub-tasks)
4. Parent progress is calculated automatically from children
5. Use commands (Ctrl/Cmd+P) to quickly change category, size, or toggle urgent/blocked
`,
};

export async function installTemplates(app: App): Promise<number> {
	let installed = 0;

	const templatesFolder = app.vault.getAbstractFileByPath(TEMPLATES_FOLDER);
	if (!templatesFolder) {
		await app.vault.createFolder(TEMPLATES_FOLDER);
	} else if (!(templatesFolder instanceof TFolder)) {
		return 0;
	}

	for (const [name, content] of Object.entries(TEMPLATES)) {
		const filePath = `${TEMPLATES_FOLDER}/${name}.md`;
		const existingFile = app.vault.getAbstractFileByPath(filePath);

		if (!existingFile) {
			await app.vault.create(filePath, content);
			installed++;
		}
	}

	return installed;
}

export function getTemplateNames(): string[] {
	return Object.keys(TEMPLATES);
}

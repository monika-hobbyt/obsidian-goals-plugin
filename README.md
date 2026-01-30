# Recursive Goals Plugin for Obsidian

Automatically calculates and maintains computed properties for hierarchical goal trees in Obsidian. This plugin enables you to build goal hierarchies where parent goals automatically inherit and aggregate data from their children.

## Features

- **Weighted Progress Calculation**: Parent goals show accumulated progress weighted by child priorities (configurable)
- **Goal Hierarchy Tracking**: Automatically detects and links parent-child relationships between goals
- **Status Tracking**: Automatic status computation (not-started, in-progress, completed, overdue)
- **Time-Based Metrics**: Days remaining, overdue detection, and completion date tracking
- **Hierarchy Metrics**: Depth tracking, total descendants count, and leaf goal count
- **Blocked Goals Support**: Mark goals as blocked and see which parent goals have blocked children
- **Root Goal Inheritance**: Every goal knows its root goal and inherits the root's priority
- **Chain Priority Calculation**: Sum of priorities from root to leaf (lower = more important)
- **Date Aggregation**: Parent goals automatically show the latest expected completion date from their children
- **Smart Caching**: Only recalculates affected branches when files change
- **Validation**: Detects orphaned goals, circular references, and missing properties
- **Customizable**: Toggle property groups, custom prefix, choice of progress calculation method
- **Property Ordering**: Computed properties are consistently ordered at the top of the properties section

## Installation

### Manual Installation

1. Create a folder named `recursive-goals` in your vault's `.obsidian/plugins/` directory
2. Copy `main.js` and `manifest.json` into the folder
3. Reload Obsidian
4. Enable the plugin in Settings → Community plugins

### Building from Source

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run build` for production build or `npm run dev` for development with watch mode
4. Copy `main.js` and `manifest.json` to your vault's plugins folder

## Configuration

Access settings via Settings → Recursive Goals.

### Property Names

| Setting | Default | Description |
|---------|---------|-------------|
| Goals folder | `Goals` | Folder path where goal files are stored |
| Goal property | `goal` | Property that links to parent goal |
| Progress property | `progress` | Property storing progress (0-100) |
| Priority property | `priority` | Property storing priority value (lower = more important) |
| Expected acquire date property | `expectedAcquireDate` | Property storing target completion date |
| Blocked property | `blocked` | Property indicating goal is blocked (boolean) |

### Workflow Properties

| Setting | Default | Description |
|---------|---------|-------------|
| Node type property | `nodeType` | Type: strategic-goal, sub-goal, project, stage, task, sub-task |
| Category property | `category` | Workflow state: inbox, active, incubator, archive, history |
| Size property | `size` | Task size: S (0.5h), M (2h), L (4h) |
| Energy type property | `energyType` | Energy required: creative, administrative |
| Assignee property | `assignee` | Person assigned to the task |
| Urgent property | `urgent` | Boolean flag for time-sensitive items |

### Calculation Options

| Setting | Default | Description |
|---------|---------|-------------|
| Computed property prefix | `_` | Prefix for all computed properties |
| Progress calculation method | `weighted` | How to calculate parent progress: `weighted` (by priority) or `simple` (average) |

### Enabled Properties

Toggle which computed property groups are added to your files:

| Toggle | Properties | Default |
|--------|------------|---------|
| Root goal tracking | `_rootGoal`, `_rootGoalPriority` | On |
| Chain priority | `_chainPriority` | On |
| Depth tracking | `_depth` | On |
| Status tracking | `_status` | On |
| Time metrics | `_daysRemaining`, `_isOverdue`, `_completedDate` | On |
| Hierarchy metrics | `_childCount`, `_children`, `_totalDescendants`, `_leafCount` | On |
| Blocked tracking | `_hasBlockedChildren` | On |
| Node type inference | `_nodeType`, `_isLeaf` | On |
| Workflow tracking | `_hasUrgentChildren`, `_totalTimeEstimate` | On |

## Workflow System

The plugin implements a PARA-inspired workflow for managing ideas and tasks.

### Categories

| Category | Description |
|----------|-------------|
| **inbox** | New ideas that need processing/triage |
| **active** | Items you're currently working on |
| **incubator** | Ideas that need time to mature |
| **archive** | Completed or paused items |
| **history** | Reference-only items |

### Workflow Transitions

```
inbox -> active      (ready to work on)
inbox -> incubator   (needs more thought)
inbox -> archive     (not relevant now)

active -> archive    (completed or paused)
active -> incubator  (blocked, needs rethinking)

incubator -> active  (idea is mature, ready to act)
incubator -> archive (decided not to pursue)

archive -> history   (for long-term reference)
archive -> active    (reactivating old item)
```

### Node Types

The plugin auto-infers node type from hierarchy depth:

| Depth | With Children | Without Children |
|-------|---------------|------------------|
| 0 | strategic-goal | strategic-goal |
| 1 | sub-goal | project |
| 2 | project | task |
| 3 | stage | task |
| 4 | task | sub-task |
| 5+ | sub-task | sub-task |

You can override by setting `nodeType` manually.

### Task Sizing

| Size | Time Estimate |
|------|---------------|
| S | 0.5 hours |
| M | 2 hours |
| L | 4 hours |

Parent nodes show `_totalTimeEstimate` as the sum of all leaf task sizes.

## How It Works

### Goal Hierarchy

Goals are organized in a tree structure using property links. Each goal can have:
- A **parent goal** (linked via the `goal` property)
- Multiple **child goals** (goals that link to this goal as their parent)

Example hierarchy:
```
Develop Creative Hobbies (root)
├── Master Photography
│   ├── Master Portrait Lighting
│   └── Complete Photo Portfolio
└── Become a Musician
    ├── Play Guitar Proficiently
    └── Release Original Song
```

### Setting Up Goals

**Root Goal** (no parent):
```yaml
---
priority: 1
expectedAcquireDate: "[[2025-12-31]]"
---
# Develop Creative Hobbies
```

**Child Goal** (has parent):
```yaml
---
goal: "[[Develop Creative Hobbies]]"
priority: 2
expectedAcquireDate: "[[2025-06-30]]"
---
# Master Photography
```

**Leaf Goal** (no children, has progress):
```yaml
---
goal: "[[Master Photography]]"
priority: 1
progress: 60
expectedAcquireDate: "[[2025-04-15]]"
---
# Master Portrait Lighting
```

**Blocked Goal**:
```yaml
---
goal: "[[Become a Musician]]"
priority: 2
progress: 10
blocked: true
---
# Release Original Song
```

## Computed Properties

The plugin automatically adds computed properties (prefixed with `_` by default) to your goal files:

### Core Properties

| Property | Description | Applies To |
|----------|-------------|------------|
| `_rootGoal` | Link to the topmost goal in the hierarchy | All goals |
| `_rootGoalPriority` | Priority value of the root goal | All goals |
| `_chainPriority` | Sum of all priorities from root to this goal (lower = more important) | Non-root goals |
| `_depth` | Levels from root (root = 0, direct child = 1, etc.) | All goals |

### Status Properties

| Property | Description | Applies To |
|----------|-------------|------------|
| `_status` | Current status: `not-started`, `in-progress`, `completed`, or `overdue` | All goals |
| `_daysRemaining` | Days until expected date (negative if overdue) | All goals with dates |
| `_isOverdue` | Boolean flag for overdue goals (false if completed) | All goals |
| `_completedDate` | Daily note link when progress reached 100% | Completed goals |

### Hierarchy Properties

| Property | Description | Applies To |
|----------|-------------|------------|
| `_childCount` | Number of direct children | Parent goals |
| `_children` | List of links to direct children | Parent goals |
| `_totalDescendants` | Count of all descendants (recursive) | Parent goals |
| `_leafCount` | Number of actionable leaf goals underneath | Parent goals |
| `_hasBlockedChildren` | True if any descendant is blocked | Parent goals |

### Calculated Properties

| Property | Description | Applies To |
|----------|-------------|------------|
| `_calculatedProgress` | Weighted average progress of all descendants | Parent goals |
| `_calculatedExpectedAcquireDate` | Latest date among all descendants | Parent goals |
| `_goalYear` | Year extracted from date (e.g., 2025) | All goals with dates |
| `_goalQuarter` | Quarter extracted from date (Q1-Q4) | All goals with dates |

### Example: Computed Properties in Action

**Leaf goal** (after plugin processes):
```yaml
---
_rootGoal: "[[Develop Creative Hobbies]]"
_rootGoalPriority: 1
_chainPriority: 4
_depth: 2
_status: in-progress
_daysRemaining: 76
_isOverdue: false
_goalYear: 2025
_goalQuarter: Q2
goal: "[[Master Photography]]"
priority: 1
progress: 60
expectedAcquireDate: "[[2025-04-15]]"
---
```

**Parent goal with children**:
```yaml
---
_rootGoal: "[[Develop Creative Hobbies]]"
_rootGoalPriority: 1
_chainPriority: 3
_depth: 1
_status: in-progress
_daysRemaining: 152
_isOverdue: false
_hasBlockedChildren: false
_childCount: 2
_children:
  - "[[Master Portrait Lighting]]"
  - "[[Complete Photo Portfolio]]"
_totalDescendants: 2
_leafCount: 2
_calculatedProgress: 45
_calculatedExpectedAcquireDate: "[[2025-06-30]]"
_goalYear: 2025
_goalQuarter: Q2
goal: "[[Develop Creative Hobbies]]"
priority: 2
---
```

## Priority System

**Lower priority number = More important** (like rankings: 1st place is best)

### Chain Priority

Chain priority is the **sum** of all priorities from root to the current goal. Lower values indicate goals that are important AND belong to important parent goals.

**Example**:
```
Develop Creative Hobbies (priority: 1)
└── Master Photography (priority: 2)
    └── Master Portrait Lighting (priority: 1)
```

- Develop Creative Hobbies: No chain priority (is root)
- Master Photography: `_chainPriority` = 1 + 2 = **3**
- Master Portrait Lighting: `_chainPriority` = 1 + 2 + 1 = **4**

### Weighted Progress

Progress is weighted by priority - higher priority children (lower numbers) contribute more to the parent's progress.

**Example**:
```
Master Photography
├── Master Portrait Lighting (priority: 1, progress: 80)
└── Complete Photo Portfolio (priority: 3, progress: 20)
```

Weights are calculated as `maxPriority - priority + 1`:
- Master Portrait Lighting: weight = 3 - 1 + 1 = **3**
- Complete Photo Portfolio: weight = 3 - 3 + 1 = **1**

Weighted progress = (80×3 + 20×1) / (3+1) = 260/4 = **65%**

(Simple average would be 50%, but the higher priority goal has more influence)

You can switch to simple averaging in settings if preferred.

## Status Calculation

Status is automatically determined:

| Status | Condition |
|--------|-----------|
| `completed` | Progress >= 100% |
| `overdue` | Progress < 100% AND expected date has passed |
| `in-progress` | Progress > 0% but < 100% |
| `not-started` | Progress = 0% |

## Blocked Goals

Mark any goal as blocked by adding `blocked: true` to its properties. Parent goals will show `_hasBlockedChildren: true` if any goal in their subtree is blocked.

This helps identify which high-level goals are impacted by blockers further down the hierarchy.

## Validation

The plugin validates your goal hierarchy and categorizes issues by severity.

### Errors (Critical)

| Issue | Description |
|-------|-------------|
| Orphaned goals | Goals linking to non-existent parents |
| Circular references | Goals that form loops in the hierarchy |

### Warnings

| Issue | Description |
|-------|-------------|
| Missing progress | Active leaf goals without progress |
| Missing date | Active goals without expected date |
| Missing priority | Active goals without priority |
| Urgent without date | Urgent items without deadline |

### Info

| Issue | Description |
|-------|-------------|
| Missing size | Active tasks without size estimate |
| Missing category | Goals that need triage |
| In inbox | Items waiting in inbox |

Run validation via command palette: **"Recursive Goals: Validate goal hierarchy"**

Critical issues (orphaned/circular) trigger automatic warnings during processing.

## Smart Caching

The plugin uses smart caching to improve performance:

- Only rebuilds the goal graph when files change
- Only updates affected branches (changed file + ancestors + descendants)
- Full cache invalidation on file delete/rename

This makes the plugin efficient even with large goal hierarchies.

## Date Handling

Dates can be specified as:
- Daily note links: `[[2025-03-15]]`
- Plain strings: `2025-03-15`

For parent goals:
- `_calculatedExpectedAcquireDate` shows the **latest** date among all descendants
- `_daysRemaining` is calculated from this aggregated date

## Commands

### Core Commands

| Command | Description |
|---------|-------------|
| Recalculate all goals | Manually trigger full recalculation |
| Validate goal hierarchy | Check for issues and show report |

### Workflow Commands

| Command | Description |
|---------|-------------|
| Move to Inbox | Set category to inbox (new ideas) |
| Move to Active | Set category to active (currently working on) |
| Move to Incubator | Set category to incubator (needs to mature) |
| Move to Archive | Set category to archive (completed/paused) |
| Move to History | Set category to history (reference only) |
| Toggle Urgent | Mark/unmark as time-sensitive |
| Toggle Blocked | Mark/unmark as blocked |
| Set Size: Small (0.5h) | Set task size to S |
| Set Size: Medium (2h) | Set task size to M |
| Set Size: Large (4h) | Set task size to L |
| Install goal templates | Add goal templates to Templates folder |

Access via command palette (Ctrl/Cmd + P) or ribbon icon (target icon).

## Templates

The plugin automatically installs goal templates in your vault's `Templates` folder on first load:

| Template | Use Case |
|----------|----------|
| Goal - Quick Capture | Fast inbox capture for new ideas |
| Goal - Strategic Goal | Top-level goals (depth 0) |
| Goal - Sub-goal | Major objectives (depth 1) |
| Goal - Project | Concrete projects (depth 2) |
| Goal - Stage | Project phases (depth 3) |
| Goal - Task | Actionable items (depth 4) |
| Goal - Sub-task | Small atomic actions (depth 5+) |

Use with Obsidian's core Templates plugin or Templater. Run "Install goal templates" command to restore deleted templates.

## Property Ordering

The plugin automatically maintains consistent property order in all goal files:

```yaml
# Computed properties (auto-generated, at top)
_rootGoal: ...
_chainPriority: ...
_depth: ...
# ... other computed properties

# Manual properties (consistent order)
goal: "[[Parent]]"
nodeType: task
category: active
priority: 1
progress: 0
expectedAcquireDate: ...
size: M
energyType: creative
assignee: ...
blocked: false
urgent: false

# Other properties (user-defined, at bottom)
tags: ...
```

## Usage Tips

### Dataview Examples

The computed properties work with Dataview and Obsidian Bases for creating dashboards.

#### Inbox Processing

Items that need triage:
```dataview
TABLE
  _nodeType as "Type",
  _rootGoal as "Root Goal"
FROM "Goals"
WHERE category = "inbox"
SORT file.ctime DESC
```

#### Active Work Dashboard

Current tasks sorted by priority:
```dataview
TABLE
  _rootGoal as "Goal",
  size as "Size",
  energyType as "Energy",
  _daysRemaining as "Days Left"
FROM "Goals"
WHERE category = "active" AND _isLeaf = true
SORT _chainPriority ASC
```

#### Urgent Items

Time-sensitive items requiring attention:
```dataview
TABLE
  _rootGoal as "Goal",
  expectedAcquireDate as "Due",
  _daysRemaining as "Days"
FROM "Goals"
WHERE urgent = true AND _status != "completed"
SORT _daysRemaining ASC
```

#### Daily Planning by Energy Type

Creative work (morning focus):
```dataview
LIST
FROM "Goals"
WHERE category = "active" AND energyType = "creative" AND _isLeaf = true
SORT _chainPriority ASC
LIMIT 5
```

Administrative work (afternoon):
```dataview
LIST
FROM "Goals"
WHERE category = "active" AND energyType = "administrative" AND _isLeaf = true
SORT _chainPriority ASC
LIMIT 5
```

#### Quick Wins (Small Tasks)

```dataview
TABLE
  _rootGoal as "Goal",
  _chainPriority as "Priority"
FROM "Goals"
WHERE category = "active" AND size = "S" AND _isLeaf = true
SORT _chainPriority ASC
```

#### Blocked Items

```dataview
TABLE
  _rootGoal as "Goal",
  _depth as "Level"
FROM "Goals"
WHERE blocked = true
SORT _rootGoal ASC
```

#### Projects with Blocked Children

```dataview
TABLE
  _childCount as "Children",
  _calculatedProgress as "Progress"
FROM "Goals"
WHERE _hasBlockedChildren = true AND _isLeaf = false
SORT _chainPriority ASC
```

#### Overdue Goals

```dataview
TABLE
  _rootGoal as "Goal",
  _daysRemaining as "Days Overdue",
  progress as "Progress"
FROM "Goals"
WHERE _isOverdue = true
SORT _daysRemaining ASC
```

#### Progress by Root Goal

```dataview
TABLE
  _calculatedProgress as "Progress",
  _leafCount as "Tasks",
  _totalTimeEstimate as "Hours"
FROM "Goals"
WHERE _depth = 0
SORT _calculatedProgress DESC
```

#### Incubator Review

Ideas that may be ready to activate:
```dataview
TABLE
  _nodeType as "Type",
  file.ctime as "Added"
FROM "Goals"
WHERE category = "incubator"
SORT file.ctime ASC
```

#### Time Estimates

Total time by project:
```dataview
TABLE
  _totalTimeEstimate + "h" as "Estimate",
  _leafCount as "Tasks",
  _calculatedProgress as "Progress"
FROM "Goals"
WHERE _nodeType = "project" OR _nodeType = "sub-goal"
SORT _totalTimeEstimate DESC
```

#### Goal Hierarchy Tree

```dataview
TABLE
  _nodeType as "Type",
  _depth as "Level",
  _status as "Status",
  choice(_isLeaf, progress, _calculatedProgress) as "Progress"
FROM "Goals"
WHERE _rootGoal = "[[Your Root Goal]]"
SORT _depth ASC, _chainPriority ASC
```

#### Weekly Review: Completed This Week

```dataview
LIST
FROM "Goals"
WHERE _status = "completed" AND _completedDate
SORT _completedDate DESC
LIMIT 10
```

#### Assignee Workload

```dataview
TABLE
  rows.file.link as "Tasks",
  length(rows) as "Count"
FROM "Goals"
WHERE category = "active" AND assignee
GROUP BY assignee
```

### Organizing Goals

1. Create a dedicated folder for goals (default: `Goals`)
2. Use consistent property names across all goal files
3. Link child goals to parents using wikilinks: `goal: "[[Parent Goal Name]]"`
4. Set `progress` only on leaf goals (goals without children)
5. Use lower priority numbers for more important goals (1 = highest priority)

### Custom Property Prefix

If `_` conflicts with other plugins, change the prefix in settings. For example, using `computed_` would create properties like `computed_rootGoal`, `computed_status`, etc.

## Troubleshooting

**Properties not updating?**
- Ensure files are in the configured goals folder
- Check that the `goal` property uses valid wikilinks
- Try manual recalculation via ribbon icon

**Circular references?**
- Run "Validate goal hierarchy" to identify loops
- The plugin includes cycle detection and will skip circular references

**Progress showing 0?**
- Ensure leaf goals have numeric `progress` values (0-100)
- Parent goals derive progress from children only

**Status showing wrong value?**
- Check that `expectedAcquireDate` uses correct format (YYYY-MM-DD)
- Verify progress values are correct

**Blocked not propagating?**
- Ensure `blocked: true` (boolean, not string)
- Check the blocked property name in settings

**Performance issues?**
- The plugin uses smart caching; only affected branches update
- For very large hierarchies, consider disabling unused property groups in settings

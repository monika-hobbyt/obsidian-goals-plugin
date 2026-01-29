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

## How It Works

### Goal Hierarchy

Goals are organized in a tree structure using property links. Each goal can have:
- A **parent goal** (linked via the `goal` property)
- Multiple **child goals** (goals that link to this goal as their parent)

Example hierarchy:
```
Hobbies (root)
├── Photography
│   ├── Learn Portrait Lighting
│   └── Build Photo Portfolio
└── Music
    ├── Learn Guitar
    └── Record First Song
```

### Setting Up Goals

**Root Goal** (no parent):
```yaml
---
priority: 1
expectedAcquireDate: "[[2025-12-31]]"
---
# Hobbies
```

**Child Goal** (has parent):
```yaml
---
goal: "[[Hobbies]]"
priority: 2
expectedAcquireDate: "[[2025-06-30]]"
---
# Photography
```

**Leaf Goal** (no children, has progress):
```yaml
---
goal: "[[Photography]]"
priority: 1
progress: 60
expectedAcquireDate: "[[2025-04-15]]"
---
# Learn Portrait Lighting
```

**Blocked Goal**:
```yaml
---
goal: "[[Music]]"
priority: 2
progress: 10
blocked: true
---
# Record First Song
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
_rootGoal: "[[Hobbies]]"
_rootGoalPriority: 1
_chainPriority: 4
_depth: 2
_status: in-progress
_daysRemaining: 76
_isOverdue: false
_goalYear: 2025
_goalQuarter: Q2
goal: "[[Photography]]"
priority: 1
progress: 60
expectedAcquireDate: "[[2025-04-15]]"
---
```

**Parent goal with children**:
```yaml
---
_rootGoal: "[[Hobbies]]"
_rootGoalPriority: 1
_chainPriority: 3
_depth: 1
_status: in-progress
_daysRemaining: 152
_isOverdue: false
_hasBlockedChildren: false
_childCount: 2
_children:
  - "[[Learn Portrait Lighting]]"
  - "[[Build Photo Portfolio]]"
_totalDescendants: 2
_leafCount: 2
_calculatedProgress: 45
_calculatedExpectedAcquireDate: "[[2025-06-30]]"
_goalYear: 2025
_goalQuarter: Q2
goal: "[[Hobbies]]"
priority: 2
---
```

## Priority System

**Lower priority number = More important** (like rankings: 1st place is best)

### Chain Priority

Chain priority is the **sum** of all priorities from root to the current goal. Lower values indicate goals that are important AND belong to important parent goals.

**Example**:
```
Hobbies (priority: 1)
└── Photography (priority: 2)
    └── Learn Portrait Lighting (priority: 1)
```

- Hobbies: No chain priority (is root)
- Photography: `_chainPriority` = 1 + 2 = **3**
- Learn Portrait Lighting: `_chainPriority` = 1 + 2 + 1 = **4**

### Weighted Progress

Progress is weighted by priority - higher priority children (lower numbers) contribute more to the parent's progress.

**Example**:
```
Photography
├── Learn Portrait Lighting (priority: 1, progress: 80)
└── Build Photo Portfolio (priority: 3, progress: 20)
```

Weights are calculated as `maxPriority - priority + 1`:
- Learn Portrait Lighting: weight = 3 - 1 + 1 = **3**
- Build Photo Portfolio: weight = 3 - 3 + 1 = **1**

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

The plugin validates your goal hierarchy and warns about issues:

- **Orphaned goals**: Goals linking to non-existent parents
- **Circular references**: Goals that form loops in the hierarchy
- **Missing progress**: Leaf goals without progress values
- **Missing dates**: Goals without expected acquire dates
- **Missing priority**: Goals without priority values

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

| Command | Description |
|---------|-------------|
| Recalculate all goals | Manually trigger full recalculation |
| Validate goal hierarchy | Check for issues and show report |

Access via command palette (Ctrl/Cmd + P) or ribbon icon (target icon).

## Usage Tips

### Using with Obsidian Bases

The computed properties work seamlessly with Obsidian Bases for creating goal dashboards:

```
table
  _rootGoal as "Root Goal",
  _status as "Status",
  _calculatedProgress as "Progress",
  _daysRemaining as "Days Left",
  _chainPriority as "Priority"
from "Goals"
where _status != "completed"
sort _chainPriority asc
```

**Overdue goals view**:
```
table
  _rootGoal as "Root Goal",
  _daysRemaining as "Days Overdue",
  _calculatedProgress as "Progress"
from "Goals"
where _isOverdue = true
sort _daysRemaining asc
```

**Blocked goals impact view**:
```
table
  _childCount as "Children",
  _hasBlockedChildren as "Has Blockers"
from "Goals"
where _hasBlockedChildren = true
```

**Hobby progress dashboard**:
```
table
  _depth as "Level",
  _status as "Status",
  _calculatedProgress as "Progress",
  _leafCount as "Tasks"
from "Goals"
where _rootGoal = "[[Hobbies]]"
sort _depth asc, _chainPriority asc
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

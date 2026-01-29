# Recursive Goals Plugin for Obsidian

Automatically calculates and maintains computed properties for hierarchical goal trees in Obsidian. This plugin enables you to build goal hierarchies where parent goals automatically inherit and aggregate data from their children.

## Features

- **Recursive Progress Calculation**: Parent goals automatically show accumulated progress based on their children's progress (averaged)
- **Goal Hierarchy Tracking**: Automatically detects and links parent-child relationships between goals
- **Root Goal Inheritance**: Every goal knows its root goal and inherits the root's priority
- **Chain Priority Calculation**: Computes weighted priority by multiplying priorities down the chain from root to leaf
- **Date Aggregation**: Parent goals automatically show the latest expected completion date from their children
- **Year and Quarter Extraction**: Automatically extracts goal year and quarter (Q1-Q4) from dates
- **Children Links**: Parent goals maintain a list of links to their direct children
- **Property Ordering**: Computed properties are consistently ordered at the top of frontmatter
- **Automatic Updates**: Recalculates on file changes with debouncing to prevent excessive updates
- **Manual Recalculation**: Ribbon icon and command palette entry for manual triggering

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

| Setting | Default | Description |
|---------|---------|-------------|
| Goals folder | `Goals` | Folder path where goal files are stored |
| Goal property | `goal` | Frontmatter property that links to parent goal |
| Progress property | `progress` | Frontmatter property storing progress (0-100) |
| Priority property | `priority` | Frontmatter property storing priority value |
| Expected acquire date property | `expectedAcquireDate` | Frontmatter property storing target completion date |

## How It Works

### Goal Hierarchy

Goals are organized in a tree structure using frontmatter links. Each goal can have:
- A **parent goal** (linked via the `goal` property)
- Multiple **child goals** (goals that link to this goal as their parent)

Example hierarchy:
```
Master Life Goals (root)
├── Career Goals
│   ├── Learn TypeScript
│   └── Get Promotion
└── Health Goals
    ├── Run Marathon
    └── Eat Healthier
```

### Setting Up Goals

**Root Goal** (no parent):
```yaml
---
priority: 10
expectedAcquireDate: "[[2025-12-31]]"
---
# Master Life Goals
```

**Child Goal** (has parent):
```yaml
---
goal: "[[Master Life Goals]]"
priority: 8
expectedAcquireDate: "[[2025-06-30]]"
---
# Career Goals
```

**Leaf Goal** (no children, has progress):
```yaml
---
goal: "[[Career Goals]]"
priority: 5
progress: 75
expectedAcquireDate: "[[2025-03-15]]"
---
# Learn TypeScript
```

## Computed Properties

The plugin automatically adds computed properties (prefixed with `_`) to your goal files:

| Property | Description | Applies To |
|----------|-------------|------------|
| `_rootGoal` | Link to the topmost goal in the hierarchy | All goals |
| `_rootGoalPriority` | Priority value of the root goal | All goals |
| `_chainPriority` | Product of all priorities from root to this goal | Non-root goals |
| `_childCount` | Number of direct children | Parent goals |
| `_children` | List of links to direct children | Parent goals |
| `_calculatedProgress` | Average progress of all descendants | Parent goals |
| `_calculatedExpectedAcquireDate` | Latest date among all descendants | Parent goals |
| `_goalYear` | Year extracted from date (e.g., 2025) | All goals with dates |
| `_goalQuarter` | Quarter extracted from date (Q1-Q4) | All goals with dates |

### Example: Computed Properties in Action

**Before** (leaf goal):
```yaml
---
goal: "[[Career Goals]]"
priority: 5
progress: 75
expectedAcquireDate: "[[2025-03-15]]"
---
```

**After** (plugin adds computed properties):
```yaml
---
_rootGoal: "[[Master Life Goals]]"
_rootGoalPriority: 10
_chainPriority: 400
_goalYear: 2025
_goalQuarter: Q1
goal: "[[Career Goals]]"
priority: 5
progress: 75
expectedAcquireDate: "[[2025-03-15]]"
---
```

**Parent goal with children**:
```yaml
---
_rootGoal: "[[Master Life Goals]]"
_rootGoalPriority: 10
_chainPriority: 80
_childCount: 2
_children:
  - "[[Learn TypeScript]]"
  - "[[Get Promotion]]"
_calculatedProgress: 63
_calculatedExpectedAcquireDate: "[[2025-06-30]]"
_goalYear: 2025
_goalQuarter: Q2
goal: "[[Master Life Goals]]"
priority: 8
expectedAcquireDate: "[[2025-06-30]]"
---
```

## Chain Priority Explained

Chain priority helps you understand the "weighted importance" of a goal within its hierarchy. It's calculated by multiplying all priorities from the root goal down to the current goal.

**Example**:
```
Master Life Goals (priority: 10)
└── Career Goals (priority: 8)
    └── Learn TypeScript (priority: 5)
```

- Master Life Goals: No chain priority (is root)
- Career Goals: `_chainPriority` = 10 × 8 = **80**
- Learn TypeScript: `_chainPriority` = 10 × 8 × 5 = **400**

Higher chain priority indicates goals that are important AND belong to important parent goals.

## Progress Calculation

Progress flows **up** the hierarchy:

1. **Leaf goals** (no children): Use their own `progress` property
2. **Parent goals**: Calculate average of all children's progress (recursive)

The `progress` property is automatically removed from parent goals since `_calculatedProgress` replaces it.

**Example**:
```
Career Goals
├── Learn TypeScript (progress: 75)
└── Get Promotion (progress: 50)
```

Career Goals will have `_calculatedProgress: 63` (average of 75 and 50, rounded)

## Date Handling

Dates can be specified as:
- Daily note links: `[[2025-03-15]]`
- Plain strings: `2025-03-15`

For parent goals, `_calculatedExpectedAcquireDate` shows the **latest** date among all descendants, representing when the entire goal subtree will be complete.

## Usage Tips

### Using with Obsidian Bases

The computed properties work seamlessly with Obsidian Bases for creating goal dashboards:

```
table
  _rootGoal as "Root Goal",
  _calculatedProgress as "Progress",
  _goalQuarter as "Quarter",
  _chainPriority as "Priority Score"
from "Goals"
where _calculatedProgress < 100
sort _chainPriority desc
```

### Organizing Goals

1. Create a dedicated folder for goals (default: `Goals`)
2. Use consistent property names across all goal files
3. Link child goals to parents using wikilinks: `goal: "[[Parent Goal Name]]"`
4. Set `progress` only on leaf goals (goals without children)

### Manual Recalculation

- Click the **target icon** in the ribbon, or
- Use command palette: "Recursive Goals: Recalculate all goals"

## Troubleshooting

**Properties not updating?**
- Ensure files are in the configured goals folder
- Check that the `goal` property uses valid wikilinks
- Try manual recalculation via ribbon icon

**Circular references?**
- The plugin includes cycle detection and will skip circular references
- Check your goal hierarchy for loops

**Progress showing 0?**
- Ensure leaf goals have numeric `progress` values (0-100)
- Parent goals derive progress from children only

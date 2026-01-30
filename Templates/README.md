# Goal Templates

Copy these templates to your vault's templates folder and use them with Obsidian's core Templates plugin or Templater.

## Templates

| Template | Use Case |
|----------|----------|
| **Quick Capture** | Fast inbox capture for new ideas |
| **Strategic Goal** | Top-level life/business goals (depth 0) |
| **Sub-goal** | Major objectives under a strategic goal (depth 1) |
| **Project** | Concrete projects with deliverables (depth 2) |
| **Stage** | Project phases or milestones (depth 3) |
| **Task** | Actionable items with progress tracking (depth 4) |
| **Sub-task** | Small atomic actions (depth 5+) |

## Property Order

All templates follow a consistent property order:

```yaml
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
```

## Property Reference

### Manual Properties

| Property | Type | Values |
|----------|------|--------|
| `goal` | link | `"[[Parent Name]]"` |
| `nodeType` | string | strategic-goal, sub-goal, project, stage, task, sub-task |
| `category` | string | inbox, active, incubator, archive, history |
| `priority` | number | 1 = highest importance |
| `progress` | number | 0-100 (leaf nodes only) |
| `expectedAcquireDate` | date | `"[[2025-03-15]]"` or `2025-03-15` |
| `size` | string | S (0.5h), M (2h), L (4h) |
| `energyType` | string | creative, administrative |
| `assignee` | string | Person responsible |
| `blocked` | boolean | true / false |
| `urgent` | boolean | true / false |

### Computed Properties (auto-generated)

Added automatically by the plugin in this order:

```yaml
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
```

## Workflow

```
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
```

## Tips

1. Use **Quick Capture** for fast idea capture without thinking about structure
2. During triage, convert inbox items to proper goal types
3. Set `progress` only on leaf nodes (tasks/sub-tasks)
4. Parent progress is calculated automatically from children
5. Use commands (Ctrl/Cmd+P) to quickly change category, size, or toggle urgent/blocked

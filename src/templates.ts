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

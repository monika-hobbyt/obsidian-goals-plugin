import { Plugin } from "obsidian";

export default class RecursiveGoalsPlugin extends Plugin {
	async onload() {
		console.log("Recursive Goals plugin loaded");
	}

	onunload() {
		console.log("Recursive Goals plugin unloaded");
	}
}

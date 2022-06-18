import Tab from './Tab.js'
import TestTabStatusWatcher from './TestTabStatusWatcher.js'

export default class TestTab extends Tab {
	constructor({
		storage,
		timer,
		...parameters
	}) {
		if (!storage) {
			throw new Error('[web-browser-tab] `storage` parameter is required when creating a `TestTab`')
		}

		if (!timer) {
			throw new Error('[web-browser-tab] `timer` parameter is required when creating a `TestTab`')
		}

		super({
			...parameters,
			storage,
			timer,
			tabStatusWatcher: new TestTabStatusWatcher()
		})
	}

	setActive(isActive) {
		this.tabStatusWatcher.setActive(isActive)
	}
}
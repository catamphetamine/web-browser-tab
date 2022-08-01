import { nanoid } from 'nanoid'
import { LocalStorage } from 'web-browser-storage'
import { Timer } from 'web-browser-timer'

import TabStatusWatcher from './TabStatusWatcher.js'
import wait from './wait.js'

export default class Tab {
	constructor({
		storage = new LocalStorage(),
		tabStatusWatcher = new TabStatusWatcher(),
		timer = new Timer(),
		id = nanoid(),
		log = () => {}
	}) {
		this.storage = storage
		this.tabStatusWatcher = tabStatusWatcher
		this.timer = timer
		this.id = id
		this.log = log

		// Some web browsers limit `setTimeout()` delay to be 1 second minimum
		// for background tabs.
		this.activeTabRequestRefreshInterval = 1000
	}

	getStorageKeyForActiveTab() {
		return 'Tab.Active'
		// return this.storageKeyPrefix + 'activeTab'
	}

	getStorageKeyForGetActiveTab() {
		return 'Tab.GetActive'
		return this.storageKeyPrefix + 'getActiveTab'
	}

	getActiveTabRequestRefreshInterval() {
		return this.activeTabRequestRefreshInterval
	}

	getActiveTabRequestRefreshWaitInterval(tryNumber) {
		switch (tryNumber) {
			// case 1:
			// 	return ACTIVE_TAB_REQUEST_FIRST_REFRESH_DELAY
			// case 2:
			// 	return ACTIVE_TAB_REQUEST_SECOND_REFRESH_DELAY
			default:
				return this.getActiveTabRequestRefreshInterval()
		}
	}

	getActiveTabRequestTimeout() {
		// Some web browsers limit `setTimeout()` delay to be 1 second minimum
		// for background tabs.
		// In that scenario, `1.5` seconds timeout would mean "2 tries".
		return this.getActiveTabRequestRefreshInterval() * 1.5
	}

	getId() {
		return this.id
	}

	isActive() {
		return this.tabStatusWatcher.isActive()
	}

	async getActiveTabId() {
		this.log('Get Active Tab')

		if (this.tabStatusWatcher.isActive()) {
			return this.getId()
		}

		const requestedAt = this.timer.now()

		this.storage.set(this.getStorageKeyForGetActiveTab(), { requestedAt })

		let tryNumber = 1
		while (this.timer.now() - requestedAt < this.getActiveTabRequestTimeout()) {
			const interval = this.getActiveTabRequestRefreshWaitInterval(tryNumber)

			this.log('Wait', interval)
			await wait(interval, this.timer)

			const activeTab = this.storage.get(this.getStorageKeyForActiveTab())

			if (activeTab) {
				if (activeTab.activeAt >= requestedAt) {
					this.log('Active Tab', activeTab.id)
					return activeTab.id
				}
			}

			tryNumber++
		}

		this.log('No Active Tab')
	}

	start() {
		if (this._isStarted) {
			throw new Error('[web-browser-tab] Can\'t start a `Tab` that has already been started')
		}

		this._isStarted = true

		this.tabStatusWatcher.start()

		// Answer to "get active tab" requests.
		this.unlistenOnExternalChange = this.storage.onExternalChange(({ key }) => {
			if (key === this.getStorageKeyForGetActiveTab()) {
				if (this.tabStatusWatcher.isActive()) {
					this.storage.set(this.getStorageKeyForActiveTab(), {
						id: this.id,
						activeAt: this.timer.now()
					})
				}
			}
		})
	}

	stop() {
		if (!this._isStarted) {
			throw new Error('[web-browser-tab] Can\'t stop a `Tab` that hasn\'t been started')
		}

		this._isStarted = false

		this.tabStatusWatcher.stop()
		this.unlistenOnExternalChange()
	}
}
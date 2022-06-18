export default class TestTabStatusWatcher {
	constructor() {
		this._isActive = false

		this.onActiveListeners = []
		this.onInactiveListeners = []
	}

	onActive(listener) {
		this.onActiveListeners.push(listener)
		return () => this.onActiveListeners = this.onActiveListeners.filter(_ => _ !== listener)
	}

	onInactive(listener) {
		this.onInactiveListeners.push(listener)
		return () => this.onInactiveListeners = this.onInactiveListeners.filter(_ => _ !== listener)
	}

	start() {
		if (this._isStarted) {
			throw new Error('[web-browser-tab] Can\'t start a `TestTabStatusWatcher` that has already been started')
		}

		this._isStarted = true
	}

	stop() {
		if (!this._isStarted) {
			throw new Error('[web-browser-tab] Can\'t stop a `TestTabStatusWatcher` that hasn\'t been started')
		}

		this._isStarted = false
	}

	isActive() {
		return this._isActive
	}

	setActive(isActive) {
		if (this._isActive === isActive) {
			return
		}

		this._isActive = isActive

		if (isActive) {
			for (const listener of this.onActiveListeners) {
				listener()
			}
		} else {
			for (const listener of this.onInactiveListeners) {
				listener()
			}
		}
	}
}
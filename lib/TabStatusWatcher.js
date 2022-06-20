export default class TabStatusWatcher {
	constructor({
		log = () => {}
	} = {}) {
		this.log = log

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
			throw new Error('[web-browser-tab] Can\'t start a `TabStatusWatcher` that has already been started')
		}

		this._isStarted = true

		this._isActive = this.hasFocus()

		this.log(this._isActive ? 'Active' : 'Inactive')

		// Uses Visibility API to detect the current tab being
		// closed, navigated from, switched from, minimized
		// (including going into background on mobile phones).
		// https://golb.hplar.ch/2019/07/page-visibility-api.html
		// When a tab is closed, web browsers emit `visibilitychange: "hidden"` event.
		// Exceptions:
		// * Android <= 4.4.
		// * Desktop Safari < 13 when closing a tab by clicking "x".
		// https://github.com/fusionjs/fusion-plugin-universal-events/pull/158#issuecomment-450958837
		// https://github.com/GoogleChromeLabs/page-lifecycle/issues/2
		document.addEventListener('visibilitychange', this.onVisibilityChange)

		// On mobile (at least on iPhones), all browsers (Safari, Chrome, Firefox)
		// have a bug: they don't emit a "visibilitychange" event on page refresh.
		// A workaround is to listen to "pagehide" event.
		// https://developer.mozilla.org/en-US/docs/Web/API/Window/pagehide_event
		// Also, they say Safari doesn’t fire the `visibilitychange` event
		// when `visibilityState` transitions to "hidden".
		// To work around that, listen to `pagehide` event.
		// The `pagehide` event doesn't correspond to "page hidden"
		// but rather to "page will be unloaded": it's not triggered
		// when a window is minimized, for example.
		// It's not clear when `pagehide` is triggered on mobile Safari:
		// https://stackoverflow.com/questions/11795864/pagehide-event-on-imminent-tab-switching-in-mobile-safari-does-not-fire-when-run
		// They say it's triggered when the user minimizes the mobile browser,
		// or when the user switches a tab in a mobile browser.
		// Apple only says that `pageshow`/`pagehide` are an alternative to `unload`:
		// https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/HandlingEvents.html#//apple_ref/doc/uid/TP40006511-SW5
		// https://stackoverflow.com/questions/47135242/ios-10-3-3-iphone-safari-beforeunload-unload-pagehide-wont-work
		window.addEventListener('pagehide', this.onPageHide)
		window.addEventListener('pageshow', this.onPageShow)

		// Just having "Page Visibility API" doesn't detect switching between browser windows
		// because if a user has opened several browser windows and hasn't maximized them
		// then they could switch between such browser windows while all of them're still visible.
		// To work around that, `focus` and `blur` events are tracked.
		window.addEventListener('blur', this.onBlur)
		window.addEventListener('focus', this.onFocus)
	}

	/**
	 * `.stop()` should be called when the instance will no longer be used.
	 */
	stop() {
		if (!this._isStarted) {
			throw new Error('[web-browser-tab] Can\'t stop a `TabStatusWatcher` that hasn\'t been started')
		}

		this._isStarted = false

		document.removeEventListener('visibilitychange', this.onVisibilityChange)
		window.removeEventListener('pagehide', this.onPageHide)
		window.removeEventListener('pageshow', this.onPageShow)
		window.removeEventListener('blur', this.onBlur)
		window.removeEventListener('focus', this.onFocus)
	}

	hasFocus() {
		// https://developer.mozilla.org/en-US/docs/Web/API/Document/hasFocus
		// https://caniuse.com/mdn-api_document_hasfocus
		return document.hasFocus()
	}

	isVisible() {
		// Other possible values: `hidden` and `prerender` (deprecated; can be considered `hidden`).
		return document.visibilityState === 'visible'
	}

	isActive() {
		return this._isActive
	}

	onPageHide = () => {
		this.setActive(false)
	}

	onPageShow = () => {
		this.setActive(true)
	}

	onBlur = () => {
		this.setActive(false)
	}

	onFocus = () => {
		this.setActive(true)
	}

	onVisibilityChange = () => {
		if (!this.isVisible()) {
			this.setActive(false)
		}
	}

	setActive(isActive) {
		if (this._isActive === isActive) {
			return
		}

		this._isActive = isActive

		this.log(isActive ? 'Active' : 'Inactive')

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

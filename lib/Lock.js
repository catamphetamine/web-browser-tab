import { nanoid } from 'nanoid'
import { Timer } from 'web-browser-timer'
import { LocalStorage } from 'web-browser-storage'

import wait from './wait.js'

// A delay before checking that the lock has actually been acquired.
//
// Sidenote: Some web browsers limit `setTimeout()` delay to be 1 second minimum
// for background tabs, so this delay will only be less that 1 second for a foreground tab.
//
const LOCK_REPEATABLE_READ_CHECK_DELAY = 200

export default class Lock {
	constructor(name, {
		storage = new LocalStorage(),
		timer = new Timer(),
		timeout,
		log = () => {}
	}) {
		if (!name) {
			throw new Error('[web-browser-tab] `Lock` constructor `name` argument is required')
		}
		if (!timeout) {
			throw new Error('[web-browser-tab] `Lock` constructor `timeout` parameter is required')
		}
		this.name = name
		this.key = name
		this.storage = storage
		this.log = log
		this.timeout = timeout
		this.timer = timer
		this.ensureLockAcquiredDelay = LOCK_REPEATABLE_READ_CHECK_DELAY
	}

	async acquire() {
		const now = this.timer.now()

		// If a concurrent clean-up is in progress,
		// then schedule a retry.
		let lock = this._getLock()
		if (lock) {
			// If the lock still holds, then schedule a retry.
			if (lock.expiresAt > now) {
				this.log('A concurrent process is running')
				return {
					retryAfter: lock.expiresAt - now
				}
			}
		}

		// Generate a random lock id.
		const lockId = nanoid()

		// Create a lock info object.
		lock = {
			id: lockId,
			createdAt: now,
			expiresAt: now + this.timeout
		}

		// Attempt to acquire the "lock".
		this._setLock(lock)

		// Wait a bit to detect possible "race conditions".
		await wait(this.ensureLockAcquiredDelay, this.timer)

		// Check that the lock has been acquired.
		// For example, some other concurrent tab could accidentally overwrite it.
		lock = this._getLock()
		if (lock.id !== lockId) {
			this.log('A concurrent process has acquired the lock')
			return {
				// Don't return `0` retry delay just so it could be checked via `if (retryAfter)`.
				retryAfter: (lock.expiresAt - this.timer.now()) || 1
			}
		}

		return {
			releaseLock: () => {
				// If the lock still holds, release it.
				const lock = this._getLock()
				if (lock && lock.id === lockId) {
					this.storage.delete(this.key)
				}
			},
			hasLockTimedOut: () => {
				// Check that the lock record still exists
				// and that it hasn't been overtaken by some other concurrent process.
				const lock = this._getLock()
				const stillHeld = Boolean(lock && lock.id === lockId)
				return !stillHeld
			},
			getRetryDelayAfterLockTimedOut: () => {
				const lock = this._getLock()
				if (lock) {
					return lock.expiresAt - this.timer.now()
				} else {
					return 0
				}
			}
		}
	}

	_getLock() {
		return this.storage.get(this.key)
	}

	_setLock(lock) {
		this.storage.set(this.key, lock)
	}
}
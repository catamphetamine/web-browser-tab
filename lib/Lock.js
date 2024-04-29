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

		this.log('Acquire lock')

		// If a concurrent clean-up is in progress,
		// then schedule a retry.
		let lock = this._getLock()
		if (lock) {
			// If the lock still holds, then schedule a retry.
			if (lock.expiresAt > now) {
				this.log('A concurrent process is holding the lock', lock)
				return new LockFail({
					code: 'LOCK_ACQUIRED_BY_CONCURRENT_PROCESS',
					retryAfter: lock.expiresAt - now
				})
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
			this.log('A concurrent process has overwritten the lock', lock)
			return new LockFail({
				code: 'LOCK_OVERWRITTEN_BY_CONCURRENT_PROCESS',
				// Don't return `0` retry delay just so it could be checked via `if (retryAfter)`.
				retryAfter: (lock.expiresAt - this.timer.now()) || 1
			})
		}

		this.log('Lock acquired', lock)

		return new LockSuccess({
			lock,
			lockId,
			getLock: () => this._getLock(),
			clearLock: () => this.storage.delete(this.key),
			timer: this.timer,
			log: this.log
		})
	}

	_getLock() {
		return this.storage.get(this.key)
	}

	_setLock(lock) {
		this.storage.set(this.key, lock)
	}
}

export class LockFail {
	constructor({ code, retryAfter }) {
		this.code = code
		this.retryAfter = retryAfter
	}
}

export class LockSuccess {
	constructor({ lock, lockId, getLock, clearLock, timer, log }) {
		this.lock = lock
		this.lockId = lockId
		this.getLock = getLock
		this.clearLock = clearLock
		this.timer = timer
		this.log = log
	}

	releaseLock() {
		this.log('Release lock', this.lock)
		const lock = this.getLock()
		if (!lock) {
			this.log('There\'s no lock')
			return
		}
		if (lock.id !== this.lockId) {
			this.log('A concurrent process has overwritten the lock', lock)
			return
		}
		this.clearLock()
	}

	hasLockTimedOut() {
		// Check that the lock record still exists
		// and that it hasn't been overtaken by some other concurrent process.
		const lock = this.getLock()
		const stillHeld = Boolean(lock && lock.id === this.lockId)
		return !stillHeld
	}

	getRetryDelayAfterLockTimedOut() {
		const lock = this.getLock()
		if (lock) {
			return lock.expiresAt - this.timer.now()
		} else {
			return 0
		}
	}
}
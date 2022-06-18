import Lock from './Lock.js'

import { MemoryStorage } from 'web-browser-storage'
import { TestTimer } from 'web-browser-timer'

describe('Lock', function() {
	it('should handle two parties contending for a lock', async function() {
		const baseStorage = new MemoryStorage()
		const storage1 = baseStorage.createSharedInstance('1')
		const storage2 = baseStorage.createSharedInstance('2')

		const timer = new TestTimer()
		const timeout = 5000

		const lock1 = new Lock('LockName', {
			storage: storage1,
			timer,
			timeout
		})

		const lock2 = new Lock('LockName', {
			storage: storage2,
			timer,
			timeout
		})

		const promise1 = lock1.acquire()
		const promise2 = lock2.acquire()

		await timer.skip(1000)

		const lock1Result = await promise1
		const lock2Result = await promise2

		lock1Result.releaseLock.should.be.a('function')
		lock2Result.retryAfter.should.equal(0 + timeout)
	})

	it('should handle two parties contending for a lock (storage un-sync)', async function() {
		const baseStorage = new MemoryStorage()
		const storage1 = baseStorage.createSharedInstance('1')
		const storage2 = baseStorage.createSharedInstance('2')

		const timer = new TestTimer()
		const timeout = 5000

		const lock1 = new Lock('LockName', {
			storage: storage1,
			timer,
			timeout
		})

		const lock2 = new Lock('LockName', {
			storage: storage2,
			timer,
			timeout
		})

		const promise1 = lock1.acquire()

		// Suppose that the storage is not synced immediately between the two browser tabs.
		// In that case, the second contender overwrites the first contender's lock.
		storage1.delete('LockName')

		const promise2 = lock2.acquire()

		await timer.skip(1000)

		const lock1Result = await promise1
		const lock2Result = await promise2

		lock1Result.retryAfter.should.equal(0 + timeout - 1000)
		lock2Result.releaseLock.should.be.a('function')
	})

	it('should time out', async function() {
		const baseStorage = new MemoryStorage()
		const storage1 = baseStorage.createSharedInstance('1')
		const storage2 = baseStorage.createSharedInstance('2')

		const timer = new TestTimer()
		const timeout = 5000

		const lock1 = new Lock('LockName', {
			storage: storage1,
			timer,
			timeout
		})

		const lock2 = new Lock('LockName', {
			storage: storage2,
			timer,
			timeout
		})

		const promise1 = lock1.acquire()

		await timer.skip(1000)

		const lock1Result = await promise1
		lock1Result.releaseLock.should.be.a('function')

		await timer.skip(timeout)

		const promise2 = lock2.acquire()

		await timer.skip(1000)

		const lock2Result = await promise2

		lock2Result.releaseLock.should.be.a('function')
	})
})
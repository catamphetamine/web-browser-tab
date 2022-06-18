import TestTabStatusWatcher from './TestTabStatusWatcher.js'

describe('TestTabStatusWatcher', function() {
	it('should work', function() {
		const tabStatusWatcher = new TestTabStatusWatcher()

		tabStatusWatcher.start()

		let isActive1 = false
		let isActive2 = false
		tabStatusWatcher.onActive(() => isActive1 = true)
		tabStatusWatcher.onActive(() => isActive2 = true)

		let isInactive1 = false
		let isInactive2 = false
		tabStatusWatcher.onInactive(() => isInactive1 = true)
		tabStatusWatcher.onInactive(() => isInactive2 = true)

		tabStatusWatcher.isActive().should.equal(false)
		isActive1.should.equal(false)
		isActive1.should.equal(false)
		isInactive1.should.equal(false)
		isInactive2.should.equal(false)

		tabStatusWatcher.setActive(true)

		tabStatusWatcher.isActive().should.equal(true)
		isActive1.should.equal(true)
		isActive1.should.equal(true)
		isInactive1.should.equal(false)
		isInactive2.should.equal(false)

		isActive1 = false
		isActive2 = false
		isInactive1 = false
		isInactive2 = false

		tabStatusWatcher.setActive(false)
		isActive1.should.equal(false)
		isActive1.should.equal(false)
		isInactive1.should.equal(true)
		isInactive2.should.equal(true)

		tabStatusWatcher.stop()
	})
})
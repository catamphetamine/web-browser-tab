import { MemoryStorage } from 'web-browser-storage'
import { TestTimer } from 'web-browser-timer'

import TestTab from './TestTab.js'

describe('TestTab', function() {
	it('should work', async function() {
		const timer = new TestTimer()

		const baseStorage = new MemoryStorage()

		const storage1 = baseStorage.createSharedInstance('1')
		const storage2 = baseStorage.createSharedInstance('2')

		const tab1 = new TestTab({
			timer,
			storage: storage1
		})

		const tab2 = new TestTab({
			timer,
			storage: storage2
		})

		tab1.start()
		tab2.start()

		expect(typeof tab1.getId()).to.equal('string')
		expect(typeof tab2.getId()).to.equal('string')
		expect(tab1.getId()).to.not.equal(tab2.getId())

		tab1.isActive().should.equal(false)
		tab2.isActive().should.equal(false)

		let activeTabId1Promise = tab1.getActiveTabId()
		let activeTabId2Promise = tab2.getActiveTabId()

		await timer.end()

		expect(await activeTabId1Promise).to.be.undefined
		expect(await activeTabId2Promise).to.be.undefined

		tab1.setActive(true)

		activeTabId1Promise = tab1.getActiveTabId()
		activeTabId2Promise = tab2.getActiveTabId()

		await timer.end()

		expect(await activeTabId1Promise).to.equal(tab1.getId())
		expect(await activeTabId2Promise).to.equal(tab1.getId())

		tab1.setActive(false)

		activeTabId1Promise = tab1.getActiveTabId()
		activeTabId2Promise = tab2.getActiveTabId()

		await timer.end()

		expect(await activeTabId1Promise).to.be.undefined
		expect(await activeTabId2Promise).to.be.undefined

		tab1.stop()
		tab2.stop()
	})
})
import {
	Tab,
	TestTab
} from 'web-browser-tab'

import {
	TabStatusWatcher,
	TestTabStatusWatcher
} from 'web-browser-tab/status-watcher'

describe('exports', function() {
	it('should export stuff', function() {
		Tab.should.be.a('function')
		TestTab.should.be.a('function')
		TabStatusWatcher.should.be.a('function')
		TestTabStatusWatcher.should.be.a('function')
	})
})
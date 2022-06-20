# `web-browser-tab`

Web browser tab utilities:

* ID generator.
* "Active" status getter.

## Install

```
npm install web-browser-tab --save
```

## Definitions

### Tab "active" status

A tab is "active" when it's in foreground and has the focus.

A tab goes "inactive" when:

* The user minimizes the web browser window.
* The user puts the web browser application into background.
* The tab loses focus.
* The user refreshes the tab.
* The user switches to some other tab.
* The user switches to some other application.
* The user closes the web browser application or the web browser tab.
  * Exceptions:
    * [Android <= 4.4](https://github.com/fusionjs/fusion-plugin-universal-events/pull/158#issuecomment-450958837).
    * Desktop Safari < 13 when [closing a tab by clicking "x"](https://github.com/GoogleChromeLabs/page-lifecycle/issues/2).

## Use

### Browser

```js
import { Tab } from 'web-browser-tab'

const tab = new Tab()

tab.start()

console.log(tab.getId())
console.log(tab.isActive())

tab.stop()
```

Uses [`LocalStorage`](https://npmjs.com/package/web-browser-storage).

### Stub

`TestTab` could be used instead of `Tab` in tests.

```js
import { TestTab } from 'web-browser-tab'
import { MemoryStorage } from 'web-browser-storage'
import { TestTimer } from 'web-browser-timer'

const baseStorage = new MemoryStorage()

const storage1 = baseStorage.createSharedInstance('1')
const storage2 = baseStorage.createSharedInstance('2')

const timer = new TestTimer()

const tab1 = new TestTab({
  storage: storage1,
  timer
})

const tab2 = new TestTab({
  storage: storage2,
  timer
})

tab1.start()
tab2.start()

let activeTabIdPromise1 = tab1.getActiveTabId()
let activeTabIdPromise2 = tab2.getActiveTabId()

await timer.next()

await activeTabIdPromise1 === undefined
await activeTabIdPromise2 === undefined

tab1.setActive(true)

activeTabIdPromise1 = tab1.getActiveTabId()
activeTabIdPromise2 = tab2.getActiveTabId()

await timer.next()

await activeTabIdPromise1 === tab1.getId()
await activeTabIdPromise2 === tab1.getId()

tab1.stop()
tab2.stop()
```

### `TabStatusWatcher`

Watches a tab's "active" status. Is used by `Tab`.

#### Browser

```js
import { TabStatusWatcher } from 'web-browser-tab/status-watcher'

const tabStatusWatcher = new TabStatusWatcher()

console.log(tabStatusWatcher.isActive())

tabStatusWatcher.onActive(() => console.log('This tab is active now'))
tabStatusWatcher.onInactive(() => console.log('This tab is inactive now'))
```

#### Stub

`TestTabStatusWatcher` could be used instead of `TabStatusWatcher` in tests.

```js
import { TestTabStatusWatcher } from 'web-browser-tab/status-watcher'

const tabStatusWatcher = new TestTabStatusWatcher()

console.log(tabStatusWatcher.isActive())

tabStatusWatcher.onActive(() => console.log('This tab is active now'))
tabStatusWatcher.onInactive(() => console.log('This tab is inactive now'))

tabStatusWatcher.setActive(true)
tabStatusWatcher.setActive(false)
```

### `Lock`

`Lock` could be used to acquire a cross-tab lock: if different tabs attempt to acquire a lock with the same name, only one of them will succeed.

#### Browser

```js
import { Lock } from 'web-browser-tab'

const lock = new Lock('LockName', { timeout: 60 * 1000 })

const {
  retryAfter,
  releaseLock,
  hasLockTimedOut,
  getRetryDelayAfterLockTimedOut
} = await lock.acquire()

// If the lock hasn't been acquired, `retryAfter` property will be present
// and it will be `> 0`.
if (retryAfter) {
  return console.log(`Couldn't lock. Can retry after ${retryAfter}ms`)
}

// Do some stuff.
await doSomeStuff()

if (hasLockTimedOut()) {
  return console.log(`Lock timed out. Can retry after ${getRetryDelayAfterLockTimedOut()}ms`)
}

// Do some more stuff.
await doSomeMoreStuff()

// Release the lock.
releaseLock()
```

#### Stub

`Lock` could be used in tests when passed custom `storage` and `timer`.

```js
import { TestLock } from 'web-browser-tab'
import { TestTimer } from 'web-browser-timer'
import { MemoryStorage } from 'web-browser-storage'

const baseStorage = new MemoryStorage()
const storage1 = baseStorage.createSharedInstance('1')

const lock = new Lock('LockName', {
  timeout: 60 * 1000,
  timer: new TestTimer(),
  storage: storage1
})

const {
  retryAfter,
  releaseLock
} = await lock.acquire()
```

## Test

```
npm test
```

## GitHub Ban

On March 9th, 2020, GitHub, Inc. silently [banned](https://medium.com/@catamphetamine/how-github-blocked-me-and-all-my-libraries-c32c61f061d3) my account (erasing all my repos, issues and comments) without any notice or explanation. Because of that, all source codes had to be promptly moved to GitLab. The [GitHub repo](https://github.com/catamphetamine/web-browser-tab) is now only used as a backup (you can star the repo there too), and the primary repo is now the [GitLab one](https://gitlab.com/catamphetamine/web-browser-tab). Issues can be reported in any repo.

## License

[MIT](LICENSE)
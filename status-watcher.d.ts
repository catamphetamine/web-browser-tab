import { Storage } from 'web-browser-storage'
import { ITimer } from 'web-browser-timer'
import { ITabStatusWatcher } from './status-watcher.d.js'

interface TabConstructorParametersRest {
	log?: (...args: any[]) => void;
	tabStatusWatcher?: ITabStatusWatcher;
}

interface TabConstructorParameters<StorageValue> extends TabConstructorParametersRest {
	storage?: Storage<StorageValue>;
	timer?: ITimer;
}

interface TestTabConstructorParameters<StorageValue> extends TabConstructorParametersRest {
	storage: Storage<StorageValue>;
	timer: ITimer;
}


export interface ITab {
	start(): void;
	stop(): void;
	getId(): string;
	isActive(): boolean;
	getActiveTabId(): Promise<string | undefined>;
}

interface Tab<StorageValue> extends ITab {}
export class Tab<StorageValue = any> {
	constructor(parameters?: TabConstructorParameters<StorageValue>);
}

interface TestTab<StorageValue> extends ITab {}
export class TestTab<StorageValue = any> {
	constructor(parameters?: TestTabConstructorParameters<StorageValue>);
}

//-----------------------------------

export class LockSuccess {
	releaseLock: () => void;
	hasLockTimedOut: () => boolean;
	getRetryDelayAfterLockTimedOut: () => number;
}

export class LockFail {
	code: 'LOCK_ACQUIRED_BY_CONCURRENT_PROCESS' | 'LOCK_OVERWRITTEN_BY_CONCURRENT_PROCESS';
	retryAfter: number;
}

interface LockConstructorParameters<StorageValue> {
	timeout: number;
	timer?: ITimer;
	storage?: Storage<StorageValue>;
	log?: (...args: any[]) => void;
}

export class Lock<StorageValue = any> {
	constructor(name: string, parameters: LockConstructorParameters<StorageValue>);
	acquire(): Promise<LockSuccess | LockFail>;
}
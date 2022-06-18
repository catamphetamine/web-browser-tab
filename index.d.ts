import { Storage } from 'web-browser-storage'
import { ITimer } from 'web-browser-timer'
import { ITabStatusWatcher } from './status-watcher'

interface TabConstructorParametersRest {
	log?: (...args: any[]) => void;
	tabStatusWatcher?: ITabStatusWatcher;
}

interface TabConstructorParameters extends TabConstructorParametersRest {
	storage?: Storage;
	timer?: ITimer;
}

interface TestTabConstructorParameters extends TabConstructorParametersRest {
	storage: Storage;
	timer: ITimer;
}

export interface ITab {
	start(): void;
	stop(): void;
	getId(): string;
	isActive(): boolean;
	async getActiveTabId(): string | undefined;
}

interface Tab extends ITab {}
export class Tab {
	constructor(parameters?: TabConstructorParameters);
}

interface TestTab extends Tab {}
export class TestTab {
	constructor(parameters?: TestTabConstructorParameters);
}

//-----------------------------------

interface LockSuccessResult {
	releaseLock: () => void;
	hasLockTimedOut: () => boolean;
	getRetryDelayAfterLockTimedOut: () => number;
}

interface LockFailedResult {
	retryAfter: number;
}

type LockResult = LockSuccessResult | LockFailedResult;

export interface ILock {
	async acquire(): LockResult;
}

interface LockConstructorParameters {
	timeout: number;
	timer?: ITimer;
	storage?: Storage;
	log?: (...args: any[]) => void;
}

interface Lock extends ILock {}
export class Lock {
	constructor(name: string, LockConstructorParameters)
}
interface TabStatusWatcherParameters {
	log?: (...args: any[]) => void;
}

type TabStatusWatcherListener = () => void;
type TabStatusWatcherUnlistener = () => void;

export interface ITabStatusWatcher {
	start(): void;
	stop(): void;
	isActive(): boolean;
	onActive(listener: TabStatusWatcherListener): TabStatusWatcherUnlistener;
	onInactive(listener: TabStatusWatcherListener): TabStatusWatcherUnlistener;
}

interface TabStatusWatcher extends ITabStatusWatcher {}
export class TabStatusWatcher {
	constructor(parameters?: TabStatusWatcherParameters);
}

interface TestTabStatusWatcher extends ITabStatusWatcher {
	setActive(isActive: boolean): void;
}
export class TestTabStatusWatcher {
	constructor(parameters?: TabStatusWatcherParameters);
}
export default function wait(interval, timer) {
	return new Promise(resolve => timer.schedule(resolve, interval))
}
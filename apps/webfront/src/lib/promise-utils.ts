export function mkPromise<T = any>(): { promise: Promise<T> } {
	let resolve: (payload: T) => any;
	let reject: (error: any) => any;

	const promise = new Promise<T>((promiseResolve, promiseReject) => {
		resolve = promiseResolve;
		reject = promiseReject;
	});

	return { promise, resolve, reject };
}

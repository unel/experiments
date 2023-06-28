import { get_current_component } from 'svelte/internal';

export function createAwaitingEventDispatcher() {
	const component = get_current_component();

	return async function dispatchEvent<E>(event: E) {
		const type = event.type;
		const callbacks = component.$$.callbacks[type];

		if (callbacks) {
			try {
				await Promise.all(
					callbacks.slice().map((fn: (e: E) => any) => {
						return fn.call(component, event as E);
					})
				);
			} finally {
				return !event.defaultPrevented;
			}
		}

		return true;
	};
}

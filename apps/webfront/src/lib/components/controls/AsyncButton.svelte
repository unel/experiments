<script lang="ts">
	import { createAwaitingEventDispatcher } from '$lib/svelte-utils';

	const dispatchEvent = createAwaitingEventDispatcher();

	let isAwaiting = false;

	async function forward(e: Event) {
		isAwaiting = true;

		try {
			await dispatchEvent<Event>(e);
		} finally {
			isAwaiting = false;
		}
	}

	$: props = {
		...$$props,
		disabled: $$props.disabled || isAwaiting
	};
</script>

<button {...props} on:click={forward}>
	{#if isAwaiting}
		<slot name="awaiting">...</slot>
	{:else}
		<slot />
	{/if}
</button>

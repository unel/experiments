<script lang="ts">
	import { createAwaitingEventDispatcher } from '$lib/svelte-utils';

	import DualRingSpinner from '@components/spinners/DualRingSpinner.svelte';
	import AsyncButton from './AsyncButton.svelte';

	const dispatchEvent = createAwaitingEventDispatcher();

	function forward(event: Event) {
		return dispatchEvent<Event>(event);
	}
</script>

<AsyncButton class="btn-octicon" {...$$props} on:click={forward}>
	<slot />

	<svelte:fragment slot="awaiting">
		<DualRingSpinner />
	</svelte:fragment>
</AsyncButton>

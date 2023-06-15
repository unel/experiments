<script lang="ts">
	// imports
	import { createEventDispatcher } from 'svelte';
	// ----------------------------------------------


	// props
	export let actionString = 'action';
	// ----------------------------------------------

	type State = 'pending' | 'confirmation';
	let state: State = 'pending';

	// component logic
	const dispatchEvent = createEventDispatcher<{
		confirmed: void,
		cancelled: void,
	}>();

	function cancelConfirmation() {
		state = 'pending';
		dispatchEvent('cancelled');
	}

	function confirmAction() {
		state = 'pending';
		dispatchEvent('confirmed');
	}
</script>

{#if state === 'pending'}
	<button class='btn btn-sm btn-danger' on:click|preventDefault={() => state = 'confirmation'}>
		{actionString}
	</button>
{:else}
	<span>
		<!-- <span class='Label'>{confirmationString}</span> -->
		<span class='BtnGroup'>
			<button class='BtnGroup-item btn btn-sm' on:click|preventDefault={cancelConfirmation}>
				n
			</button>

			<button class='BtnGroup-item btn btn-sm btn-danger' on:click|preventDefault={confirmAction}>
				y
			</button>
		</span>
	</span>


{/if}

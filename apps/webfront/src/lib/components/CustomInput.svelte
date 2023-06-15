<script lang="ts">
	// imports
	import { createEventDispatcher } from 'svelte';
	// ----------------------------------------------


	// props
	export let value = ';'
	// ----------------------------------------------

	let input: HTMLInputElement;

	// component logic
	const dispatchEvent = createEventDispatcher<{
		confirmed: void,
	}>();

	function processKeyPress(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			confirmInput();
			input?.blur();
		}
	}

	function confirmInput() {
		dispatchEvent('confirmed');
	}
</script>


<input type='text' class='custom-input' bind:value={value} on:keypress={processKeyPress} on:blur={confirmInput} bind:this={input}>


<style>
	.custom-input {
		border: none;

		outline-color: rgba(0, 0, 0, 0.1);
		outline-width: 1px;
		outline-offset: var(--space-sm);
	}
</style>

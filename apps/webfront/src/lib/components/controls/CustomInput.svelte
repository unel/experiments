<script lang="ts">
	// imports
	import { createEventDispatcher } from 'svelte';
	// ----------------------------------------------

	// props
	export let value = '';
	export let multiline: boolean = false;
	// ----------------------------------------------

	let input: HTMLInputElement | HTMLTextAreaElement;

	// component logic
	const dispatchEvent = createEventDispatcher<{
		confirmed: void;
	}>();

	function processKeyPress(e: KeyboardEvent) {
		if (e.ctrlKey && e.code === 'Enter') {
			confirmInput();
			input?.blur();
		}
	}

	function syncScrollHeight() {
		if (!input) {
			return;
		}

		input.style.height = `${input.scrollHeight}px`;
		setTimeout(() => {
			if (input) {
				input.style.height = '';
			}
		});
	}

	function confirmInput() {
		dispatchEvent('confirmed');
	}

	$: {
		if (input) {
			syncScrollHeight();
		}
	}
</script>

{#if multiline}
	<textarea
		class="custom-input"
		bind:value
		bind:this={input}
		on:keypress={processKeyPress}
		on:blur={confirmInput}
		on:input={syncScrollHeight}
	/>
{:else}
	<input
		type="text"
		class="custom-input"
		bind:value
		bind:this={input}
		on:keypress={processKeyPress}
		on:blur={confirmInput}
	/>
{/if}

<style>
	.custom-input {
		display: block;
		box-sizing: border-box;
		overflow: hidden;

		width: 100%;
		border: none;

		padding: 0;
		margin: 0;

		outline-color: rgba(0, 0, 0, 0.1);
		outline-width: 1px;
		outline-offset: var(--space-sm);

		resize: none;
	}
</style>

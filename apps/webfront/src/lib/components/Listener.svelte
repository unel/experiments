<script lang="ts">
	// imports
	import { createEventDispatcher } from 'svelte';
	import type { SR, SRStructure } from '$lib/stt';
	// ----------------------------------------------


	// props
	export let sr: SR;
	// ----------------------------------------------


	// component logic
	const dispatchEvent = createEventDispatcher();
	let isListening = false;

	function startListening() {
		sr.startListening();
	}

	function stopListening() {
		sr.stopListening();
	}

	function toggleListening() {
		(isListening ? stopListening : startListening)();
	}

	function onStatusUpdate(status) {
		isListening = status.isActive;

		dispatchEvent('status', status);
	}

	function onMessageRecognised(data) {
		dispatchEvent('message', data);
	}


	// this is re-subscription logic to events from SR instance in case when instance is changed by props change
	// IMPROVEME: could we use Storage api (.subscribe / .unsubscribe) for this case?
	let usubSR = () => {};
	$: {
		usubSR();

		isListening = sr.isActive;
		const unsubStatus = sr.addStatusListener(onStatusUpdate);
		const unsubMessage = sr.addMessageListener(onMessageRecognised);

		usubSR = () => {
			unsubStatus();
			unsubMessage();
		};
	}

</script>

<button class='btn btn-mr2' on:click={toggleListening} aria-selected={isListening}>
	{#if isListening}
	<svg class="octicon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M8 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"></path></svg>
	{/if}
	<span>{isListening ? 'listening..' : 'listen'}</span>
</button>

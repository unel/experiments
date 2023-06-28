<script lang="ts">
	// imports
	import { createEventDispatcher } from 'svelte';

	import type { SR, SRStatus, SRResultItem } from '$lib/stt';
	import RecordingIcon from '@components/octicons/sm/DotIcon.svelte';
	// ----------------------------------------------

	// props
	export let sr: SR;
	// ----------------------------------------------

	// component logic
	const dispatchEvent = createEventDispatcher<{
		status: SRStatus;
		message: SRResultItem;
	}>();
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

	function onStatusUpdate(status: SRStatus) {
		isListening = status.isActive;

		dispatchEvent('status', status);
	}

	function onMessageRecognised(data: SRResultItem) {
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

<button class="btn btn-mr2" on:click={toggleListening} aria-selected={isListening}>
	{#if isListening}
		<RecordingIcon />
	{/if}
	<span>{isListening ? 'listening..' : 'listen'}</span>
</button>

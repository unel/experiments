<script lang="ts">
	// imports
	import { createEventDispatcher } from 'svelte';

	import type { STTEngine, SRStatus, SRResultItem } from '$lib/stt';
	import RecordingIcon from '@components/octicons/sm/DotIcon.svelte';
	// ----------------------------------------------

	// props
	export let stt: STTEngine;
	export let language: string = 'en';
	// ----------------------------------------------

	// component logic
	const dispatchEvent = createEventDispatcher<{
		status: SRStatus;
		message: SRResultItem;
	}>();
	let isListening = false;

	function startListening() {
		stt.startListening(language);
	}

	function stopListening() {
		stt.stopListening();
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

	$: {
		if (stt.language !== language) {
			stt.switchLanguage(language);
		}
	}

	// this is re-subscription logic to events from SR instance in case when instance is changed by props change
	// IMPROVEME: could we use Storage api (.subscribe / .unsubscribe) for this case?
	let usubSR = () => {};
	$: {
		usubSR();

		isListening = stt.isActive;
		const unsubStatus = stt.addStatusListener(onStatusUpdate);
		const unsubMessage = stt.addMessageListener(onMessageRecognised);

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

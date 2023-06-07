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

<section>
	<button class="btn" on:click={startListening} disabled={isListening}> listen me </button>
	<button class="btn" on:click={stopListening} disabled={!isListening}> stop this </button>

	<span class="State">[{isListening ? 'listen' : 'deaf'}]</span>
</section>

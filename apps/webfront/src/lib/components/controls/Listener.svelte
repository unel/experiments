<script lang="ts" context="module">
	export const LISTEN_MODES = ['new', 'put'];
</script>

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
		mode_switched: { mode?: string };
		message: { message: SRResultItem; mode?: string };
	}>();
	let isListening = false;

	function onStatusUpdate(status: SRStatus) {
		isListening = status.isActive;

		if (!isListening) {
			clearListenMode();
		}
		dispatchEvent('status', status);
	}

	function onMessageRecognised(data: SRResultItem) {
		dispatchEvent('message', {
			message: data,
			mode: currentListenMode
		});
	}

	let currentListenMode: string | undefined;
	async function setLisenMode(newMode: string) {
		if (!stt) {
			return;
		}

		if (currentListenMode == newMode) {
			return clearListenMode();
		}

		const continuous = newMode === 'put';
		if (stt.isActive) {
			await stt.stopListening();
		}

		await stt.startListening(language, continuous);
		currentListenMode = newMode;
		dispatchEvent('mode_switched', { mode: currentListenMode });
	}

	function clearListenMode() {
		currentListenMode = undefined;
		stt?.stopListening();
		dispatchEvent('mode_switched', { mode: currentListenMode });
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

<div class="BtnGroup">
	<button
		class="BtnGroup-item btn"
		class:btn-danger={isListening}
		title={isListening ? 'stop listening' : ''}
		aria-selected={!isListening}
		on:click={() => clearListenMode()}
	>
		{#if isListening}
			<RecordingIcon />
		{:else}
			deaf
		{/if}
	</button>

	{#each LISTEN_MODES as mode}
		<button
			class="BtnGroup-item btn"
			aria-selected={isListening && mode === currentListenMode}
			on:click={() => setLisenMode(mode)}
		>
			{mode}
		</button>
	{/each}
</div>

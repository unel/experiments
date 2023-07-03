<script lang="ts" context="module">
	import OptionsIcon from '@components/octicons/GearIcon.svelte';
	import type { ExtendedVoice } from '$lib/tts';

	function strCmp(a: string, b: string): -1 | 0 | 1 {
		if (a === b) {
			return 0;
		}

		return a < b ? -1 : 1;
	}

	function sortVoices(voices?: Set<ExtendedVoice>): ExtendedVoice[] {
		const evoices = Array.from(voices || new Set<ExtendedVoice>());

		evoices.sort((a, b) => strCmp(a.title, b.title));

		return evoices;
	}

	function isInacceptableVoiceId(voices: ExtendedVoice[], voiceId?: string) {
		return !voiceId || !findById(voices, voiceId);
	}
</script>

<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	import {
		getConfigurationParameters,
		isSpeechSynthesAvailable,
		type SpeachParams
	} from '$lib/tts';
	import { findById } from '$lib/collections';

	export let language: string;
	export let voiceId: string;
	export let pitch: number = 1;
	export let rate: number = 1;

	// export let config: SpeachParams = {};

	if (isSpeechSynthesAvailable()) {
		globalThis.speechSynthesis.addEventListener('voiceschanged', () => syncParams());
	}

	const dispatchEvent = createEventDispatcher<{
		config: SpeachParams;
	}>();

	let params = getConfigurationParameters();
	let languages = params.language.values;

	function syncParams() {
		params = getConfigurationParameters();
		languages = params.language.values;
	}

	$: voices = sortVoices(params.voice.values[language]);

	let isOptionsVisible = false;
	function toggleOptions() {
		isOptionsVisible = !isOptionsVisible;
	}

	$: {
		if (isInacceptableVoiceId(voices, voiceId)) {
			voiceId = voices[0]?.id;
		}
	}
</script>

<div class="root">
	<select class="form-select voice-selector" bind:value={voiceId}>
		{#each voices as voice}
			<option value={voice.id}>{voice.title}</option>
		{/each}
	</select>

	<button class="btn-octicon" on:click={toggleOptions}><OptionsIcon /></button>
	{#if isOptionsVisible}
		<div class="options">
			<div>
				<label>rate: {rate.toFixed(1)}</label>

				<input
					type="range"
					name="rate"
					min={params.rate.min}
					max={params.rate.max}
					step={params.rate.step}
					bind:value={rate}
					list="rate-markers"
				/>
				<datalist id="rate-markers">
					<option value={0.1} label="minimum" />
					<option value={0.5} label="half speed" />
					<option value={1} label="norm speed" />
					<option value={1.5} label="norm+" />
					<option value={2} label="twice" />
					<option value={3} label="hurry" />
				</datalist>
			</div>

			<div>
				<label>pitch: {pitch.toFixed(1)}</label>

				<input
					type="range"
					name="pitch"
					min={params.pitch.min}
					max={params.pitch.max}
					step={params.pitch.step}
					bind:value={pitch}
					list="pitch-markers"
				/>
				<datalist id="pitch-markers">
					<option value={0.1} />
					<option value={0.5} label="half pitch" />
					<option value={1} label="norm pitch" />
					<option value={1.5} />
					<option value={params.pitch.max} label="max" />
				</datalist>
			</div>
		</div>
	{/if}
</div>

<style>
	.root {
		position: relative;
	}

	.voice-selector {
		min-width: 208px;
	}

	.options {
		position: absolute;
		background: white;
		z-index: 10;
		padding: var(--space);
		box-shadow: 8px 12px 8px 2px rgba(0, 0, 0, 0.4);
	}

	input[type='range'] {
		width: 100%;
		margin: 0;
	}

	datalist {
	}

	datalist option {
		padding: 0;
	}
</style>

<script lang="ts" context="module">
	import OptionsIcon from '@components/octicons/GearIcon.svelte';
	type ExtendedVoice = {
		id: string;
		title: string;
		voice: SpeechSynthesisVoice;
	};

	function formatVoiceName(title: string): string {
		return title
			.replace(/^microsoft\s+/gi, '')
			.replace(/\s+online\s+/gi, '')
			.replace(/\(natural\)/gi, '')
			.replace(/\s*-\s*.+\s*(\(.+\))/gi, (match, g1) => ` ${g1}`);
	}

	function formatVoiceId(title: string): string {
		return btoa(title.toLowerCase().replace(/\s+/g, ''));
	}

	function strCmp(a: string, b: string): -1 | 0 | 1 {
		if (a === b) {
			return 0;
		}

		return a < b ? -1 : 1;
	}

	function mapVoices(voices?: Set<SpeechSynthesisVoice>): ExtendedVoice[] {
		const evoices = Array.from(
			voices || new Set<SpeechSynthesisVoice>(),
			(v: SpeechSynthesisVoice): ExtendedVoice => ({
				id: formatVoiceId(v.name),
				title: formatVoiceName(v.name),
				voice: v
			})
		);

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

	let activeVoiceId: string;
	$: voices = mapVoices(params.voice.values[language]);
	$: activeVoice = findById(voices, activeVoiceId);

	let currentRate = 1;
	let currentPitch = 1;

	let isOptionsVisible = false;
	function toggleOptions() {
		isOptionsVisible = !isOptionsVisible;
	}

	$: {
		if (isInacceptableVoiceId(voices, activeVoiceId)) {
			activeVoiceId = voices[0]?.id;
		}
	}

	$: {
		const config: SpeachParams = { rate: currentRate, pitch: currentPitch };

		if (activeVoice) {
			config.voice = activeVoice.voice;
		}

		dispatchEvent('config', config);
	}
</script>

<div class="root">
	<select class="form-select voice-selector" bind:value={activeVoiceId}>
		{#each voices as voice}
			<option value={voice.id}>{voice.title}</option>
		{/each}
	</select>

	<button class="btn-octicon" on:click={toggleOptions}><OptionsIcon /></button>
	{#if isOptionsVisible}
		<div class="options">
			<div>
				<label>rate: {currentRate.toFixed(1)}</label>

				<input
					type="range"
					name="rate"
					min={params.rate.min}
					max={params.rate.max}
					step={params.rate.step}
					bind:value={currentRate}
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
				<label>pitch: {currentPitch.toFixed(1)}</label>

				<input
					type="range"
					name="pitch"
					min={params.pitch.min}
					max={params.pitch.max}
					step={params.pitch.step}
					bind:value={currentPitch}
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

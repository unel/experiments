<script lang="ts">
	import { isSpeechRecognitionAvailable, initSpeechRecognition, makeSpeechRecognitionStructure, type SRStructure } from "$lib/stt";

	let languages = ['en', 'ru', 'fr', 'ge'];
	let activeLanguage: string = languages[0] || 'en';
	const speechRecognitionAvailable = isSpeechRecognitionAvailable();


	let speechRecognisersList: Array<SRStructure> = []
	let speechRecognisersMap: Record<string, SRStructure> = {};

	function initSpeechRecognisers() {
		for (const language of languages) {
			const structure = makeSpeechRecognitionStructure({
				language,
				continuous: true,
				listener: () => {
					triggerUpdates();
				},
			})

			speechRecognisersList.push(structure);
			speechRecognisersMap[language] = structure;
		}
	}

	if (speechRecognitionAvailable) {
		initSpeechRecognisers();
	}

	$: activeRecogniserStructure = speechRecognisersMap[activeLanguage];
	$: isListening = activeRecogniserStructure?.state.isListening || false;
	$: log = activeRecogniserStructure?.state.log || [];

	function startListening() {
		activeRecogniserStructure?.speechRecogniser.start();
	}

	function stopListening() {
		activeRecogniserStructure?.speechRecogniser.stop();
	}

	function clearHistory() {
		if (activeRecogniserStructure) {
			activeRecogniserStructure.state.log = [];
			triggerUpdates();
		}
	}

	function removeTranscript(idx: number) {
		if (activeRecogniserStructure) {
			activeRecogniserStructure.state.log.splice(idx, 1);
			triggerUpdates();
		}
	}

	function selectLanguage(language: string): void {
		if (isListening) {
			activeRecogniserStructure.speechRecogniser.stop();
			speechRecognisersMap[language]?.speechRecogniser.start();
		}

		activeLanguage = language;
	}

	function triggerUpdates() {
		speechRecognisersList = speechRecognisersList;
		speechRecognisersMap = speechRecognisersMap;
	}
</script>

<main class="MainContent">
	<header class="Subhead">
		<h1 class="Subhead-heading">Chats</h1>

		<div class="Subhead-actions">
			<div class="BtnGroup">
				{#each languages as language}
					<button class="BtnGroup-item btn" aria-selected={language === activeLanguage} on:click={() => selectLanguage(language)}>
						{language}
					</button>
				{/each}
			</div>

			<button class="btn" on:click={startListening} disabled={isListening}>
				listen me
			</button>

			<button class="btn" on:click={stopListening} disabled={!isListening}>
				stop this
			</button>


			<button class="btn" on:click={clearHistory} disabled={!log.length}>
				clear
			</button>

			<span class="State">[{activeLanguage} / {isListening ? 'listen' : 'deaf'}]</span>
		</div>


	</header>

	<section class="transcripts">
		{#each log as logEntry, idx}
			<div class="transcript">
				<div class="transcript-number">
					# {idx + 1} ({logEntry.datetime})
				</div>

				<div class="transcript-text">
					[{logEntry.language}]: {logEntry.text}
				</div>

				<div class="transcript-controls">
					<button class="btn" on:click={() => removeTranscript(idx)}>
						delete
					</button>
				</div>
			</div>
		{/each}
	</section>
</main>

<style>
	.MainContent {
		height: 100%;

		display: flex;
		flex-direction: column;

		padding-top: var(--space-mid);

		padding-left: var(--space-large);
		padding-right: var(--space-large);
	}

	.transcripts {
		display: flex;
		flex-direction: column;
		row-gap: var(--space-mid);
	}

	.transcript {
		border: 1px solid gray;
		padding: var(--space);

		display: flex;
		flex-direction: row;
		align-items: center;
		column-gap: var(--space)
	}
</style>

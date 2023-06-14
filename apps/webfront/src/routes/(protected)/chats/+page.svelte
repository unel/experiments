<script lang="ts">
	import { isSpeechRecognitionAvailable, initSpeechRecognition, makeSpeechRecognitionStructure, type SRStructure } from "$lib/stt";

	let languages = ['en', 'ru', 'fr', 'ge'];
	let activeLanguage: string = languages[0] || 'en';
	const speechRecognitionAvailable = isSpeechRecognitionAvailable();
	const dtFormatter = new Intl.DateTimeFormat('en-GB', { dateStyle: 'short', timeStyle: 'medium' });

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


	<div class="Layout">
		<div class="Layout-main">
			<section class="transcriptss">
				{#each log as logEntry, idx}
					<div class="TimelineItem">
						<div class="TimelineItem-badge">
							{idx + 1}
						</div>

						<div class="TimelineItem-body transcript">
							<div class="transcript-meta">
								{dtFormatter.format(logEntry.datetime)}
							</div>

							<div class="transcript-text">
								{logEntry.text}
							</div>

							<div class="transcript-controls">
								<button class="btn-octicon btn-octicon-danger" on:click={() => removeTranscript(idx)}>
									<svg class="octicon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path fill-rule="evenodd" d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"></path></svg>
								</button>
							</div>
						</div>
					</div>
				{/each}
			</section>
		</div>

		<div class="Layout-sidebar">
			<nav class="SideNav border" style="max-width: 360px">
				<button class="SideNav-item">+ Chat</button>

				<a class="SideNav-item" href="#url">Account</a>
				<a class="SideNav-item" href="#url">Profile</a>
				<a class="SideNav-item" href="#url">Emails</a>
				<a class="SideNav-item" href="#url">Notifications</a>
			</nav>
		</div>
	  </div>
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
		display: flex;
		flex-direction: row;
		align-items: center;
		column-gap: var(--space)
	}
</style>

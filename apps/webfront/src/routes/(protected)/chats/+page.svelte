<script lang="ts">
	import { initSpeechRecognition } from "$lib/stt";

	let transcripts: string[] = [];
	let isListening = false;

	const srg = initSpeechRecognition({
		lang: 'en',
		continuous: true,
		listen: {
			'start': () => {
				isListening = true;
			},

			'error': (e) => {
				console.warn('speech listening error', e);
			},

			'result': (e) => {
				const data = (e as SpeechRecognitionEvent);
				const item = data.results[data.resultIndex].item(0);

				transcripts.push(item.transcript);
				transcripts = transcripts;
			},

			'end': () => {
				isListening = false;
			},
		},
	});

	function startListening() {
		srg?.start();
	}

	function stopListening() {
		srg?.stop();
	}

	function clearHistory() {
		transcripts = [];
	}
</script>

<main class="MainContent">
	<header>
		<h1>Chats</h1>

		<button on:click={startListening}>
			listen me
		</button>

		<button on:click={stopListening}>
			stop this
		</button>


		<button on:click={clearHistory}>
			clear
		</button>

		[status: {isListening ? 'listen' : 'deaf'}]
	</header>

	<section>
		{#each transcripts as transcript}
			<p>{transcript}</p>
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
</style>

<script lang="ts">
	// imports
	import { SR, isSpeechRecognitionAvailable } from "$lib/stt";
	import Listener from '@components/Listener.svelte';
	// ------------------------------------


	// page data (see +page.server.ts@load)
	export let data;
	// ------------------------------------


	// page logic
	const dtFormatter = new Intl.DateTimeFormat('en-GB', { dateStyle: 'short', timeStyle: 'medium' });

	let log = [];
	function updateLog(e) {
		console.log('updating log', e);

		log.push({
			datetime: Date.now(),
			text: e.detail.transcript,
		});
		log = log;
	}

	function removeTranscript(idx: number) {
		log.splice(idx, 1);
		log = log;
	}

	let active = 'en';
	let languages = ['en', 'ru'];
	const speechRecognitionAvailable = isSpeechRecognitionAvailable();
	const srs = speechRecognitionAvailable
		? {
			en: new SR({ language: 'en', continuous: true }),
			ru: new SR({ language: 'ru', continuous: true }),
		}
		: undefined;

</script>

<main class="MainContent">
	<header class="Subhead">
		<h1 class="Subhead-heading">Chats { data.chats.length }</h1>

		<div class="Subhead-actions">
			{#if srs}
				<div class="BtnGroup">
					{#each languages as language}
						<button
							class="BtnGroup-item btn"
							aria-selected={language === active}
							on:click={() => active = language}
						>
							{language}
						</button>
					{/each}
				</div>

				<Listener sr={srs[active]} on:message={updateLog} />
			{:else}
				speech recongition is unavailable =(
			{/if}
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

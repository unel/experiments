<script lang="ts">
	// imports
	import { onDestroy } from 'svelte';

	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	import { api, type ChatMessage } from '$lib/api';
	import { SR, isSpeechRecognitionAvailable, type SRResultItem } from '$lib/stt';
	import { SP, isSpeechSynthesAvailable, type SpeachParams } from '$lib/tts';
	import createSPStores from '$lib/stores/sp-store';

	import Listener from '@components/Listener.svelte';
	import CButton from '@components/ButtonWithConfirmation.svelte';
	import CInput from '@components/CustomInput.svelte';
	import SpConfigurator from '@components/SPConfigurator.svelte';
	import ThreadControl from '@components/Thread/ThreadControl.svelte';

	import StopIcon from '@components/octicons/MuteIcon.svelte';
	import PlayIcon from '@components/octicons/UnmuteIcon.svelte';
	import RmIcon from '@components/octicons/XIcon.svelte';
	// ------------------------------------

	// page data (see +page.server.ts@load)
	export let data;
	// ------------------------------------

	// page logic
	const dtFormatter = new Intl.DateTimeFormat('en-GB', {
		dateStyle: undefined,
		timeStyle: 'short'
	});
	const {
		isActive: isSPActive,
		talkingStatus: spTalkingStatus,
		resubscribe: spResub,
		unsubscribe: spUnsub
	} = createSPStores();

	function updateLog(e: CustomEvent<SRResultItem>) {
		addMessage(e.detail.transcript, activeLanguage);
	}

	function addMessage(text: string, language = activeLanguage) {
		createMessage({ language, text });
	}

	function navigateToChat(chatId: string) {
		goto(`${currentPageUrl.origin}${currentPageUrl.pathname}#chats:${chatId}`);
	}

	function navigateToDefaultState() {
		goto(`${currentPageUrl.origin}${currentPageUrl.pathname}`);
	}

	async function removeChat(idx: number) {
		const chat = data.chats?.[idx];

		if (!chat) {
			return;
		}

		const result = await api.removeChat(fetch, { chatId: chat.id });
		if (!result?.ok) {
			return;
		}

		const isActiveChat = chat.id === activeChatId;
		const nextChatId = data.chats[idx + 1]?.id;
		const prevChatId = data.chats[idx - 1]?.id;
		const newActiveChatId = nextChatId || prevChatId;

		data.chats.splice(idx, 1);
		data.chats = data.chats;
		if (isActiveChat) {
			if (newActiveChatId) {
				navigateToChat(newActiveChatId);
			} else {
				navigateToDefaultState();
			}
		}
	}

	async function saveActiveChatTitle() {
		const { id, title } = activeChat || {};

		if (!id) {
			return;
		}

		await api.updateChat(fetch, { chatId: id, title });
	}

	async function removeTranscript(idx: number) {
		if (!activeChat?.messages) {
			return;
		}

		const result = await api.removeMessage(fetch, {
			chatId: activeChat.id,
			messageId: activeChat.messages[idx].id
		});

		if (!result.ok) {
			return;
		}

		activeChat.messages.splice(idx, 1);
		activeChat.messages = activeChat.messages;
	}

	async function createChat() {
		const result = await api.createChat(fetch, { title: 'new chat', userId: data.user?.id || '-' });
		data.chats.unshift({
			...result,
			messages: []
		});
		data.chats = data.chats;
		navigateToChat(result.id);
	}

	async function createMessage({
		language,
		text,
		userId = data.user?.id || ''
	}: Record<string, string>) {
		if (!activeChatId || !data.user?.id) {
			return;
		}

		const result = await api.createMessage(fetch, {
			chatId: activeChatId,
			userId,
			language,
			text
		});

		if (!activeChat) {
			return;
		}

		activeChat.messages = activeChat.messages || [];
		activeChat.messages.push(result);
		activeChat.messages = activeChat.messages;

		return result;
	}

	async function saveChatMessage(chatMessage: ChatMessage) {
		const { chatId, text, id, userId } = chatMessage || {};

		if (!id || !chatId) {
			return;
		}

		await api.updateMessage(fetch, { messageId: id, chatId, text, userId });
	}

	function speakText(text: string) {
		sp?.speak(text);
	}

	function syncSPConfig(e: CustomEvent<SpeachParams>) {
		sp?.applyConfig(e.detail);
	}

	type Lang = 'en' | 'ru';
	let activeLanguage: Lang = 'en';
	const languages: Array<Lang> = ['en', 'ru'];
	const speechRecognitionAvailable = isSpeechRecognitionAvailable();
	const speechSynthesAvailable = isSpeechSynthesAvailable();

	const sp = speechSynthesAvailable ? new SP({ rate: 1 }) : undefined;
	const srs = speechRecognitionAvailable
		? {
				en: new SR({ language: 'en', continuous: true }),
				ru: new SR({ language: 'ru', continuous: true })
		  }
		: undefined;

	const WordMarkers = ['<b>', '</b>'];
	function markWord(str: string, from?: number, to?: number): string {
		if (from === undefined || to == undefined) {
			return str;
		}

		return (
			str.substring(0, from) +
			WordMarkers[0] +
			str.substring(from, to + 1) +
			WordMarkers[1] +
			str.substring(to + 1)
		);
	}

	type ThreadState = {
		data: Record<string, any>;
	};

	const THREADS: Record<string, ThreadState> = {};
	let openedThreadId: string;
	async function toggleThread(message: ChatMessage) {
		THREADS[message.id] = THREADS[message.id] || {};

		const isThreadOpen = Boolean(openedThreadId === message.id);

		if (isThreadOpen) {
			openedThreadId = '';
			return;
		}

		if (!THREADS[message.id].data) {
			THREADS[message.id].data = await api.openMessageThread(fetch, {
				messageId: message.id,
				messageText: message.text
			});
		}

		openedThreadId = message.id;
	}

	$: currentPageUrl = $page.url;
	$: activeChatId = currentPageUrl.hash.split(':')[1];
	$: activeChat = data.chats?.find?.((chat) => chat.id === activeChatId);

	$: {
		if (sp) {
			spResub(sp);
		} else {
			spUnsub();
		}
	}

	function destroy() {
		console.log('destroying!!!');
		sp?.destroy();
		srs?.en.destroy();
		srs?.ru.destroy();
	}

	onDestroy(destroy);
</script>

<svelte:window on:beforeunload={destroy} />

<main class="MainContent">
	<header class="Subhead">
		<h1 class="Subhead-heading">
			{#if activeChat}
				Chat::
				<CInput bind:value={activeChat.title} on:confirmed={saveActiveChatTitle} />
			{:else}
				Chats
			{/if}
		</h1>

		<div class="Subhead-actions">
			{#if srs}
				<div class="Box">
					<div class="Box-header">Speach-to-text</div>
					<div class="Box-body">
						<div class="BtnGroup">
							{#each languages as language}
								<button
									class="BtnGroup-item btn"
									aria-selected={language === activeLanguage}
									on:click={() => (activeLanguage = language)}
								>
									{language}
								</button>
							{/each}
						</div>

						<Listener sr={srs[activeLanguage]} on:message={updateLog} />
					</div>
				</div>
			{:else}
				speech recongition is unavailable =(
			{/if}

			{#if sp}
				<div class="Box">
					<div class="Box-header">Text-to-speech</div>
					<div class="Box-body">
						<SpConfigurator
							includeGroups={['en', 'fr', 'ru']}
							includeLangs={['us', 'gb', 'ng', 'in', 'ru']}
							on:config={syncSPConfig}
						/>
					</div>
				</div>
			{/if}
		</div>
	</header>

	<div class="Layout">
		<div class="Layout-main">
			<section class="transcripts">
				{#each activeChat?.messages || [] as chatMessage, idx}
					<div class="TimelineItem message-line">
						{#if openedThreadId === chatMessage.id}
							<div class="thread-box">
								<ThreadControl thread={THREADS[chatMessage.id].data} />
							</div>
						{/if}

						<div class="TimelineItem-badge">
							{idx + 1}
						</div>

						<div class="TimelineItem-body transcript">
							<div class="transcript-meta">
								{dtFormatter.format(chatMessage.createdAt)}
							</div>

							<div class="transcript-user">
								<CInput
									bind:value={chatMessage.userId}
									on:confirmed={() => saveChatMessage(chatMessage)}
								/>
							</div>

							<div class="transcript-text" data-element="transcript.text">
								{#if $isSPActive && $spTalkingStatus.text == chatMessage.text}
									<div class="text">
										{@html markWord(
											chatMessage.text,
											$spTalkingStatus.wordStartIndex,
											$spTalkingStatus.wordEndIndex
										)}
									</div>
								{:else}
									<CInput
										multiline
										bind:value={chatMessage.text}
										on:confirmed={() => saveChatMessage(chatMessage)}
									/>
								{/if}
							</div>

							<div class="transcript-controls">
								{#if sp}
									{#if $isSPActive && $spTalkingStatus.text == chatMessage.text}
										<button class="btn-octicon btn-octicon-danger" on:click={() => sp.stop()}>
											<StopIcon />
										</button>
									{:else}
										<button class="btn-octicon" on:click={() => speakText(chatMessage.text)}>
											<PlayIcon />
										</button>
									{/if}
								{/if}

								<button class="btn" on:click={() => toggleThread(chatMessage)}> &lt;?&gt;</button>

								<button
									class="btn-octicon btn-octicon-danger"
									on:click={() => removeTranscript(idx)}
								>
									<RmIcon />
								</button>
							</div>
						</div>
					</div>
				{/each}

				<div class="TimelineItem">
					<div class="TimelineItem-badge">
						<button class="btn" on:click={() => addMessage(' ')}> + </button>
					</div>
				</div>
			</section>
		</div>

		<div class="Layout-sidebar">
			<nav class="SideNav border" style="max-width: 360px">
				<button class="SideNav-item" on:click={createChat}>+ Chat</button>

				{#each data.chats as chat, idx}
					<a
						class="SideNav-item chat-item"
						aria-current={chat.id === activeChatId}
						href="#chat:{chat.id}"
					>
						#{idx}
						{chat.title}

						<CButton actionString="remove" on:confirmed={() => removeChat(idx)}>remove</CButton>
					</a>
				{/each}
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

	.Subhead-heading {
		display: inline-flex;
		flex-direction: row;
		align-items: flex-start;
	}

	.Subhead-actions {
		display: inline-flex;
		flex-direction: row;
		column-gap: var(--space);
	}

	.transcripts {
		display: flex;
		flex-direction: column;
		/* row-gap: var(--space-mid); */
	}

	.transcript {
		width: 100%;
		display: flex;
		flex-direction: row;
		column-gap: var(--space);
	}

	.transcript-user {
		min-width: 60px;
		flex-basis: 60px;
		flex-shrink: 1;
	}

	.transcript-text {
		flex-grow: 1;
	}

	.transcript-text .text {
		display: block;
		box-sizing: border-box;

		white-space: pre-line;
		padding: 0;
		margin: 0;
		max-width: 100%;
	}

	.transcript-controls {
		flex-shrink: 1;

		display: flex;
		flex-direction: row;
		align-items: center;
	}

	.chat-item {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
	}

	.message-line {
		position: relative;
	}

	.thread-box {
		position: absolute;
		background-color: rgba(250, 250, 250);
		border: 1px solid rgba(0, 0, 0, 0.08);
		box-shadow: 8px 12px 8px 2px rgba(0, 0, 0, 0.4);
		max-width: 600px;

		overflow-x: hidden;
		overflow-y: auto;
		top: 80%;
		z-index: 10;
		left: 24px;
	}
</style>

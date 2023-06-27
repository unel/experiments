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
	// ------------------------------------

	// page data (see +page.server.ts@load)
	export let data;
	// ------------------------------------

	// page logic
	const dtFormatter = new Intl.DateTimeFormat('en-GB', { dateStyle: 'short', timeStyle: 'medium' });
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

	async function createMessage({ language, text }: Record<string, string>) {
		if (!activeChatId || !data.user?.id) {
			return;
		}

		const result = await api.createMessage(fetch, {
			chatId: activeChatId,
			userId: data.user?.id,
			language,
			text
		});

		if (!activeChat) {
			return;
		}

		activeChat.messages = activeChat.messages || [];
		activeChat.messages.push(result);
		activeChat.messages = activeChat.messages;
	}

	async function saveChatMessageText(chatMessage: ChatMessage) {
		const { chatId, text, id } = chatMessage || {};

		if (!id || !chatId) {
			return;
		}

		await api.updateMessage(fetch, { messageId: id, chatId, text });
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

							<div class="transcript-text">
								{#if $isSPActive && $spTalkingStatus.text == chatMessage.text}
									{@html markWord(
										chatMessage.text,
										$spTalkingStatus.wordStartIndex,
										$spTalkingStatus.wordEndIndex
									)}
								{:else}
									<CInput
										bind:value={chatMessage.text}
										on:confirmed={() => saveChatMessageText(chatMessage)}
									/>
								{/if}
							</div>

							<div class="transcript-controls">
								{#if sp}
									{#if $isSPActive && $spTalkingStatus.text == chatMessage.text}
										<button class="btn-octicon btn-octicon-danger" on:click={() => sp.stop()}>
											<svg
												class="octicon"
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 24 24"
												width="24"
												height="24"
												><path
													d="M12 3.75v16.5a.75.75 0 0 1-1.255.555L5.46 16H2.75A1.75 1.75 0 0 1 1 14.25v-4.5C1 8.784 1.784 8 2.75 8h2.71l5.285-4.805A.75.75 0 0 1 12 3.75ZM6.255 9.305a.748.748 0 0 1-.505.195h-3a.25.25 0 0 0-.25.25v4.5c0 .138.112.25.25.25h3c.187 0 .367.069.505.195l4.245 3.86V5.445ZM16.28 8.22a.75.75 0 1 0-1.06 1.06L17.94 12l-2.72 2.72a.75.75 0 1 0 1.06 1.06L19 13.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L20.06 12l2.72-2.72a.75.75 0 0 0-1.06-1.06L19 10.94l-2.72-2.72Z"
												/></svg
											>
										</button>
									{:else}
										<button class="btn-octicon" on:click={() => speakText(chatMessage.text)}>
											<svg
												class="octicon"
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 24 24"
												width="24"
												height="24"
												><path
													d="M11.553 3.064A.75.75 0 0 1 12 3.75v16.5a.75.75 0 0 1-1.255.555L5.46 16H2.75A1.75 1.75 0 0 1 1 14.25v-4.5C1 8.784 1.784 8 2.75 8h2.71l5.285-4.805a.752.752 0 0 1 .808-.13ZM10.5 5.445l-4.245 3.86a.748.748 0 0 1-.505.195h-3a.25.25 0 0 0-.25.25v4.5c0 .138.112.25.25.25h3c.187 0 .367.069.505.195l4.245 3.86Zm8.218-1.223a.75.75 0 0 1 1.06 0c4.296 4.296 4.296 11.26 0 15.556a.75.75 0 0 1-1.06-1.06 9.5 9.5 0 0 0 0-13.436.75.75 0 0 1 0-1.06Z"
												/><path
													d="M16.243 7.757a.75.75 0 1 0-1.061 1.061 4.5 4.5 0 0 1 0 6.364.75.75 0 0 0 1.06 1.06 6 6 0 0 0 0-8.485Z"
												/></svg
											>
										</button>
									{/if}
								{/if}

								<button class="btn" on:click={() => toggleThread(chatMessage)}> &lt;?&gt;</button>

								<button
									class="btn-octicon btn-octicon-danger"
									on:click={() => removeTranscript(idx)}
								>
									<svg
										class="octicon"
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 16 16"
										width="16"
										height="16"
										><path
											fill-rule="evenodd"
											d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"
										/></svg
									>
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

	.transcript-text {
		flex-grow: 1;
	}

	.transcript-controls {
		flex-shrink: 1;
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

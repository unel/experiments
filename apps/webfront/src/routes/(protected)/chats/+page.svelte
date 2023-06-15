<script lang="ts">
	// imports
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	import { api } from '$lib/api';
	import { SR, isSpeechRecognitionAvailable, type SRResultItem } from "$lib/stt";

	import Listener from '@components/Listener.svelte';
	import CButton from '@components/ButtonWithConfirmation.svelte';
	import CInput from '@components/CustomInput.svelte';
	// ------------------------------------


	// page data (see +page.server.ts@load)
	export let data;
	// ------------------------------------


	// page logic
	const dtFormatter = new Intl.DateTimeFormat('en-GB', { dateStyle: 'short', timeStyle: 'medium' });

	function updateLog(e: CustomEvent<SRResultItem>) {
		createMessage({ language: activeLanguage, text: e.detail.transcript });
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
			messageId: activeChat.messages[idx].id,
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
			messages: [],
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
			text,
		});

		if (!activeChat) {
			return;
		}

		activeChat.messages = activeChat.messages || [];
		activeChat.messages.push(result);
		activeChat.messages = activeChat.messages;
	}

	type Lang = 'en' | 'ru';
	let activeLanguage: Lang = 'en';
	const languages: Array<Lang> = ['en', 'ru'];
	const speechRecognitionAvailable = isSpeechRecognitionAvailable();
	const srs = speechRecognitionAvailable
		? {
			en: new SR({ language: 'en', continuous: true }),
			ru: new SR({ language: 'ru', continuous: true }),
		}
		: undefined;

	$: currentPageUrl = $page.url;
	$: activeChatId = currentPageUrl.hash.split(':')[1];
	$: activeChat = data.chats?.find?.(chat => chat.id === activeChatId);
</script>

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
				<div class="BtnGroup">
					{#each languages as language}
						<button
							class="BtnGroup-item btn"
							aria-selected={language === activeLanguage}
							on:click={() => activeLanguage = language}
						>
							{language}
						</button>
					{/each}
				</div>

				<Listener sr={srs[activeLanguage]} on:message={updateLog} />
			{:else}
				speech recongition is unavailable =(
			{/if}
		</div>
	</header>


	<div class="Layout">
		<div class="Layout-main">
			<section class="transcripts">
				{#each (activeChat?.messages || []) as chatMessage, idx}
					<div class="TimelineItem">
						<div class="TimelineItem-badge">
							{idx + 1}
						</div>

						<div class="TimelineItem-body transcript">
							<div class="transcript-meta">
								{dtFormatter.format(chatMessage.createdAt)}
							</div>

							<div class="transcript-text">
								{chatMessage.text}
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
				<button class="SideNav-item" on:click={createChat}>+ Chat</button>

				{#each data.chats as chat, idx}
					<a class="SideNav-item chat-item" aria-current={chat.id === activeChatId} href="#chat:{chat.id}">
						#{idx} {chat.title}

						<CButton actionString='remove' on:confirmed={() => removeChat(idx)}>remove</CButton>
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

	.transcripts {
		display: flex;
		flex-direction: column;
		/* row-gap: var(--space-mid); */
	}

	.transcript {
		display: flex;
		flex-direction: row;
		align-items: center;
		column-gap: var(--space)
	}

	.chat-item {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
	}
</style>

<script lang="ts">
	// imports
	import { onDestroy } from 'svelte';

	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	import { api } from '$lib/api';
	import { SR, isSpeechRecognitionAvailable, type SRResultItem } from '$lib/stt';
	import { SP, isSpeechSynthesAvailable, type SpeachParams } from '$lib/tts';

	import Listener from '@components/controls/Listener.svelte';
	import CInput from '@components/controls/CustomInput.svelte';
	import SpConfigurator from '@components/controls/SPConfigurator.svelte';

	import ChatsList from '@components/chat/ChatsList.svelte';
	import ChatMessages, { focusOnText } from '@components/chat/ChatMessages.svelte';

	import { createChatControls } from '$lib/chat-page-controls/chat-controls';
	import { createNavigationControls } from '$lib/chat-page-controls/navigation-controls.js';
	import { createChatMessagesControls } from '$lib/chat-page-controls/chat-messages-controls.js';
	// ------------------------------------

	// page data (see +page.server.ts@load)
	export let data;
	// ------------------------------------

	// page logic
	const nav = createNavigationControls({ goto, getPageUrl: () => $page.url });
	const chats = createChatControls({
		api,
		fetchFn: fetch,
		chats: data.chats,
		user: data.user,
		notifyUpdate: (type: 'created' | 'removed' | 'updated', payload: Record<string, any>) => {
			data.chats = data.chats;

			if (type === 'created') {
				nav.navigateToChat(payload.id);
			}

			if (type === 'removed') {
				if (payload.id === activeChatId) {
					const prevChatId = data.chats[payload.idx - 1]?.id;
					const nextChatId = data.chats[payload.idx]?.id;
					const newActiveChatId = nextChatId || prevChatId;

					if (newActiveChatId) {
						nav.navigateToChat(newActiveChatId);
					} else {
						nav.navigateToDefaultState();
					}
				}
			}
		}
	});
	const messages = createChatMessagesControls({
		api,
		fetchFn: fetch,
		user: data.user,
		getActiveChat: () => activeChat,
		notifyUpdate: (type: 'created' | 'updated' | 'removed') => {
			if (activeChat?.messages) {
				activeChat.messages = activeChat.messages;
			}

			if (type === 'created') {
				setTimeout(() => {
					if (activeChat?.messages?.length) {
						focusOnText(activeChat.messages.length);
					}
				}, 0);
			}
		}
	});

	function updateLog(e: CustomEvent<SRResultItem>) {
		messages.addNewMessage('default', { text: e.detail.transcript, language: activeLanguage });
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

	let isAiReplyMode = false;
	function setAiReplyMode(newMode: boolean) {
		isAiReplyMode = newMode;
	}

	function processKeyDown(e: KeyboardEvent) {
		if (e.key === 'Alt') {
			setAiReplyMode(true);
			e.preventDefault();
		}
	}

	function processKeyUp(e: KeyboardEvent) {
		if (e.key === 'Alt') {
			setAiReplyMode(false);
			e.preventDefault();
		}
	}

	async function onForwardMessages(e: CustomEvent) {
		const messages = e.detail.messages || [];
		if (!messages.length) {
			return;
		}

		await chats.createChat();
		for (const message of messages) {
			await messages.addNewMessage('default', {
				text: message.text,
				language: activeLanguage,
				userId: message.user
			});
		}
	}

	$: currentPageUrl = $page.url;
	$: activeChatId = currentPageUrl.hash.split(':')[1];
	$: activeChat = data.chats?.find?.((chat) => chat.id === activeChatId);

	function destroy() {
		sp?.destroy();
		srs?.en.destroy();
		srs?.ru.destroy();
	}

	onDestroy(destroy);
</script>

<svelte:window
	on:beforeunload={destroy}
	on:keydown={processKeyDown}
	on:keyup={processKeyUp}
	on:blur={() => setAiReplyMode(false)}
/>

<main class="MainContent">
	<header class="Subhead">
		<h1 class="Subhead-heading">
			{#if activeChat}
				Chat::
				<CInput
					bind:value={activeChat.title}
					on:confirmed={() => chats.updateChat(activeChat?.id, { title: activeChat?.title })}
				/>
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
			<ChatMessages
				{sp}
				messages={activeChat?.messages || []}
				creatingMode={isAiReplyMode ? 'aireply' : 'default'}
				on:create={(e) => messages.addNewMessage(e.detail.creatingMode)}
				on:save={(e) => messages.saveChatMessage(e.detail.message)}
				on:remove={(e) => messages.removeMessage(e.detail.id)}
				on:fw_thread_messages={onForwardMessages}
			/>
		</div>

		<div class="Layout-sidebar">
			<ChatsList
				chats={data.chats}
				currentId={activeChatId}
				on:create={() => chats.createChat()}
				on:remove={(e) => chats.removeChat(e.detail.id)}
			/>
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
</style>

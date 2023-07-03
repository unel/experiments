<script lang="ts" context="module">
	import { findById } from '$lib/collections';
	import type { ChatMessage } from '$lib/api';

	import type { CreatigMode } from '@components/chat/ChatMessages.svelte';
	import ChatMessages, { focusOnText, CREATING_MODES } from '@components/chat/ChatMessages.svelte';

	type Lang = 'fr' | 'en' | 'ru';

	function threadMessageToChatMessageBody(
		threadMessage: Record<string, string>,
		language = 'en'
	): Partial<ChatMessage> {
		return {
			text: threadMessage.text,
			userId: threadMessage.user,
			language
		};
	}

	function threadMessagesToChatMessages(
		messages: Array<Record<string, string>>,
		language = 'en'
	): Array<Partial<ChatMessage>> {
		return messages.map((m) => threadMessageToChatMessageBody(m, language));
	}

	const AI_CREATING_KEY = 'Alt';
	const AVAILABLE_LANGUAGES: Array<Lang> = ['ru', 'en', 'fr'];
	const SPEAK_MODES = ['no', 'auto speak'];
</script>

<script lang="ts">
	// imports
	import { onDestroy } from 'svelte';

	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	import { api } from '$lib/api';
	import { STTEngine, isSpeechRecognitionAvailable, type SRResultItem } from '$lib/stt';
	import { TTSEngine, isSpeechSynthesAvailable, type SpeachParams } from '$lib/tts';

	import Listener from '@components/controls/Listener.svelte';
	import CInput from '@components/controls/CustomInput.svelte';
	import TTSConfigurator from '@components/controls/TTSConfigurator.svelte';

	import ChatsList from '@components/chat/ChatsList.svelte';

	import { createChatControls } from '$lib/chat-page-controls/chat-controls';
	import { createNavigationControls } from '$lib/chat-page-controls/navigation-controls.js';
	import { createChatMessagesControls } from '$lib/chat-page-controls/chat-messages-controls.js';
	import { returnLastFocus } from '@components/chat/ChatMessages.svelte';
	// ------------------------------------

	// page data (see +page.server.ts@load)
	export let data;
	// ------------------------------------

	let currentVoiceId: string;
	let currentVoicePitch = 1;
	let currentVoiceRate = 1;

	$: {
		tts?.applyConfig({ pitch: currentVoicePitch });
	}

	$: {
		tts?.applyConfig({ rate: currentVoiceRate });
	}

	$: {
		tts?.applyConfig({ voiceId: currentVoiceId });
	}

	// page logic
	const navCtl = createNavigationControls({ goto, getPageUrl: () => $page.url });
	const chatsCtl = createChatControls({
		api,
		fetchFn: fetch,
		chats: data.chats,
		user: data.user,
		notifyUpdate: (type: 'created' | 'removed' | 'updated', payload: Record<string, any>) => {
			data.chats = data.chats;

			if (type === 'created') {
				navCtl.navigateToChat(payload.id);
			}

			if (type === 'removed') {
				if (payload.id === activeChatId) {
					const prevChatId = data.chats[payload.idx - 1]?.id;
					const nextChatId = data.chats[payload.idx]?.id;
					const newActiveChatId = nextChatId || prevChatId;

					if (newActiveChatId) {
						navCtl.navigateToChat(newActiveChatId);
					} else {
						navCtl.navigateToDefaultState();
					}
				}
			}
		}
	});

	const messagesCtl = createChatMessagesControls({
		api,
		fetchFn: fetch,
		user: data.user,
		getActiveChat: () => activeChat,
		notifyUpdate: async (type: 'created' | 'updated' | 'removed') => {
			if (activeChat?.messages) {
				activeChat.messages = activeChat.messages;
			}

			if (type === 'created' && activeChat?.messages?.length) {
				const createdMessage = activeChat.messages.at(-1);

				if (
					creatingMessageMode === 'aireply' &&
					currentSpeakingMode !== 'put' &&
					createdMessage?.userId !== 'assistant'
				) {
					if (currentSpeakingMode === 'auto speak' && stt) {
						if (stt.isActive) {
							await stt.pauseListening();
						}
					}

					return messagesCtl.addNewMessage('aireply');
				}

				if (currentSpeakingMode === 'auto speak' && createdMessage?.userId === 'assistant') {
					if (tts) {
						await tts.speak(createdMessage.text);
					}

					if (stt?.isPaused) {
						await stt.resumeListening();
					}

					return;
				}

				setTimeout(() => {
					if (activeChat?.messages?.length) {
						focusOnText(activeChat.messages.length);
					}
				}, 0);
			}
		}
	});

	async function onTTSMessage(e: CustomEvent<{ message: SRResultItem; mode?: string }>) {
		const text = e.detail.message.transcript;
		const mode = e.detail.mode;

		if (mode === 'new') {
			await messagesCtl.addNewMessage('default', { text, language: activeLanguage });
		}

		if (mode === 'put') {
			const el = document.activeElement;

			if (el instanceof HTMLTextAreaElement) {
				const [start, end] = [el.selectionStart || 0, el.selectionEnd || 0];

				el.setRangeText(' ' + text + ' ', start, end, 'select');
				el.value = el.value.trim();
				el.dispatchEvent(new Event('input'));
			} else {
				await messagesCtl.addNewMessage('default', { text, language: activeLanguage });
			}
		}
	}

	async function onListenModeSwitched(e: CustomEvent<{ mode?: string }>) {
		const mode = e.detail.mode;

		if (mode === 'put') {
			if (activeChat?.messages?.length) {
				returnLastFocus();
			} else {
				await messagesCtl.addNewMessage('default', { text: ' ' });
			}
		}
	}

	function syncTTSConfig(e: CustomEvent<SpeachParams>) {
		// tts?.applyConfig(e.detail);
	}

	let activeLanguage: Lang = 'en';
	let currentMode: CreatigMode = 'default';
	let currentModeHot: CreatigMode | undefined;
	let currentSpeakingMode: string = 'no';

	const speechRecognitionAvailable = isSpeechRecognitionAvailable();
	const speechSynthesAvailable = isSpeechSynthesAvailable();

	const tts = speechSynthesAvailable ? new TTSEngine({ rate: 1 }) : undefined;
	const stt = speechRecognitionAvailable ? new STTEngine({ continuous: true }) : undefined;

	$: creatingMessageMode = currentModeHot ?? currentMode;

	function setMode(newMode: CreatigMode) {
		currentMode = newMode;
	}

	function setHotMode(newMode: CreatigMode) {
		currentModeHot = newMode;
	}
	function clearHotMode() {
		currentModeHot = undefined;
	}

	function processKeyDown(e: KeyboardEvent) {
		if (e.key === AI_CREATING_KEY) {
			setHotMode('aireply');
			e.preventDefault();
		}
	}

	function processKeyUp(e: KeyboardEvent) {
		if (e.key === AI_CREATING_KEY) {
			clearHotMode();
			e.preventDefault();
		}
	}

	async function onForwardMessages(e: CustomEvent) {
		return messagesCtl.createChatMessages({
			chat: await chatsCtl.createChat(),
			messages: threadMessagesToChatMessages(e.detail.messages || [], activeLanguage)
		});
	}

	$: currentPageUrl = $page.url;
	$: activeChatId = currentPageUrl.hash.split(':')[1];
	$: activeChat = findById(data.chats || [], activeChatId);

	$: {
		if (activeChatId) {
			const chatSettings = chatsCtl.loadChatSettings(activeChatId);

			activeLanguage = chatSettings.language;
			currentMode = chatSettings.createMode;
			currentSpeakingMode = chatSettings.speakMode;
			currentVoiceId = chatSettings.voiceId;
			currentVoicePitch = chatSettings.voicePitch ?? 1;
			currentVoiceRate = chatSettings.voiceRate ?? 1;
		}
	}

	$: {
		if (chatsCtl.isSettingsAvailable && activeLanguage && activeChatId) {
			chatsCtl.updateChatSettings(activeChatId, { language: activeLanguage });
		}
	}

	$: {
		if (chatsCtl.isSettingsAvailable && currentMode && activeChatId) {
			chatsCtl.updateChatSettings(activeChatId, { createMode: currentMode });
		}
	}

	$: {
		if (chatsCtl.isSettingsAvailable && currentSpeakingMode && activeChatId) {
			chatsCtl.updateChatSettings(activeChatId, { speakMode: currentSpeakingMode });
		}
	}

	$: {
		if (chatsCtl.isSettingsAvailable && currentVoiceId) {
			chatsCtl.updateChatSettings(activeChatId, { voiceId: currentVoiceId });
		}
	}

	$: {
		if (chatsCtl.isSettingsAvailable && currentVoicePitch !== undefined) {
			chatsCtl.updateChatSettings(activeChatId, { voicePitch: currentVoicePitch });
		}
	}

	$: {
		if (chatsCtl.isSettingsAvailable && currentVoiceRate !== undefined) {
			chatsCtl.updateChatSettings(activeChatId, { voiceRate: currentVoiceRate });
		}
	}

	function destroy() {
		tts?.destroy();
		stt?.destroy();
	}

	onDestroy(destroy);
</script>

<svelte:window
	on:beforeunload={destroy}
	on:keydown={processKeyDown}
	on:keyup={processKeyUp}
	on:blur={() => clearHotMode()}
/>

<main class="MainContent">
	<header class="Subhead">
		<h1 class="Subhead-heading">
			{#if activeChat}
				Chat::
				<CInput
					bind:value={activeChat.title}
					on:confirmed={() => chatsCtl.updateChat(activeChat?.id, { title: activeChat?.title })}
				/>
			{:else}
				Chats
			{/if}
		</h1>

		<div class="Subhead-actions">
			<div class="BtnGroup">
				{#each AVAILABLE_LANGUAGES as language}
					<button
						class="BtnGroup-item btn"
						aria-selected={language === activeLanguage}
						on:click={() => (activeLanguage = language)}
					>
						{language}
					</button>
				{/each}
			</div>

			<div class="BtnGroup">
				{#each CREATING_MODES as mode}
					<button
						class="BtnGroup-item btn"
						aria-selected={currentMode === mode}
						on:click={() => setMode(mode)}
					>
						{mode}
					</button>
				{/each}
			</div>

			{#if tts}
				<div class="BtnGroup">
					{#each SPEAK_MODES as mode}
						<button
							class="BtnGroup-item btn"
							aria-selected={mode === currentSpeakingMode}
							on:click={() => (currentSpeakingMode = mode)}
						>
							{mode}
						</button>
					{/each}
				</div>
			{/if}

			{#if stt}
				<Listener
					{stt}
					language={activeLanguage}
					on:message={onTTSMessage}
					on:mode_switched={onListenModeSwitched}
				/>
			{:else}
				speech recongition is unavailable =(
			{/if}

			{#if tts}
				<TTSConfigurator
					language={activeLanguage}
					bind:voiceId={currentVoiceId}
					bind:pitch={currentVoicePitch}
					bind:rate={currentVoiceRate}
				/>
			{/if}
		</div>
	</header>

	<div class="Layout">
		<div class="Layout-main">
			<ChatMessages
				{tts}
				messages={activeChat?.messages || []}
				creatingMode={creatingMessageMode}
				on:create={(e) => messagesCtl.addNewMessage(e.detail.creatingMode)}
				on:save={(e) => messagesCtl.saveChatMessage(e.detail.message)}
				on:remove={(e) => messagesCtl.removeMessage(e.detail.id)}
				on:fw_thread_messages={onForwardMessages}
			/>
		</div>

		<div class="Layout-sidebar">
			<ChatsList
				chats={data.chats}
				currentId={activeChatId}
				on:create={() => chatsCtl.createChat()}
				on:remove={(e) => chatsCtl.removeChat(e.detail.id)}
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

<script lang="ts" context="module">
	const dtFormatter = new Intl.DateTimeFormat('en-GB', {
		dateStyle: undefined,
		timeStyle: 'short'
	});

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

	export function focusOnText(number = 1) {
		const query = `[data-element="message"]:nth-of-type(${number}) [data-element="message.text"] textarea`;

		const element = document.querySelector(query);

		if (element) {
			(element as HTMLInputElement).focus();
		}
	}

	export type CreatigMode = 'aireply' | 'default';
</script>

<script lang="ts">
	// -- imports
	import { onDestroy, createEventDispatcher } from 'svelte';

	import { createAwaitingEventDispatcher } from '$lib/svelte-utils';
	import { type ChatMessage, api } from '$lib/api';
	import type { SP } from '$lib/tts';
	import createSPStores from '$lib/stores/sp-store';

	import CInput from '@components/controls/CustomInput.svelte';
	import AsyncIconButton from '@components/controls/AsyncIconButton.svelte';
	import ThreadControl from '@components/controls/Thread/ThreadControl.svelte';

	import StopIcon from '@components/octicons/MuteIcon.svelte';
	import PlayIcon from '@components/octicons/UnmuteIcon.svelte';
	import RmIcon from '@components/octicons/XIcon.svelte';
	import AddIcon from '@components/octicons/sm/PlusIcon.svelte';
	import AiAddIcon from '@components/octicons/sm/HubotIcon.svelte';
	// -- endof imports

	// -- props

	export let messages: ChatMessage[] = [];
	export let sp: SP | undefined;
	export let creatingMode: CreatigMode = 'default';
	// -- endof props

	// -- events
	const dispatchEvent = createEventDispatcher<{
		save: { message: ChatMessage };
		remove: { id: string };
		create: { creatingMode: CreatigMode };
		fw_thread_messages: { messages: Array<Record<string, any>> };
	}>();

	const dispatchAwaitEvent = createAwaitingEventDispatcher();

	function saveChatMessage(message: ChatMessage) {
		dispatchEvent('save', { message });
	}

	function createMessage() {
		return dispatchAwaitEvent(
			new CustomEvent<{ creatingMode: CreatigMode }>('create', {
				detail: { creatingMode }
			})
		);
	}

	function removeMessage(id: string) {
		dispatchEvent('remove', { id });
	}

	function onForwardMessages(e: CustomEvent) {
		dispatchEvent('fw_thread_messages', { messages: e.detail.messages || [] });
	}
	// -- endo events

	// -- threads logic
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
	// -- endof threads logic

	// text-to-speach logic
	const {
		isActive: isSPActive,
		talkingStatus: spTalkingStatus,
		resubscribe: spResub,
		unsubscribe: spUnsub
	} = createSPStores();

	$: {
		if (sp) {
			spResub(sp);
		} else {
			spUnsub();
		}
	}

	function stopSpeak() {
		sp?.stop();
	}

	function speakText(text: string) {
		sp?.speak(text);
	}

	function TTSCleanup() {
		sp?.destroy();
	}

	onDestroy(TTSCleanup);
	// endof sp listening logic
</script>

<svelte:window on:beforeunload={TTSCleanup} />

<section class="messages">
	{#each messages || [] as chatMessage, idx}
		<div class="TimelineItem message-line" data-element="message">
			{#if openedThreadId && openedThreadId === chatMessage.id}
				<div class="thread-box">
					<ThreadControl thread={THREADS[chatMessage.id].data} on:fw_messages={onForwardMessages} />
				</div>
			{/if}

			<div class="TimelineItem-badge">
				{idx + 1}
			</div>

			<div class="TimelineItem-body message-main">
				<div class="message-meta">
					{dtFormatter.format(chatMessage.createdAt)}
				</div>

				<div class="message-user">
					<CInput
						bind:value={chatMessage.userId}
						on:confirmed={() => saveChatMessage(chatMessage)}
					/>
				</div>

				<div class="message-text" data-element="message.text">
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

				<div class="message-controls">
					{#if sp}
						{#if $isSPActive && $spTalkingStatus.text == chatMessage.text}
							<button class="btn-octicon btn-octicon-danger" on:click={() => stopSpeak()}>
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
						on:click={() => removeMessage(chatMessage.id)}
					>
						<RmIcon />
					</button>
				</div>
			</div>
		</div>
	{/each}

	<div class="TimelineItem">
		<div class="TimelineItem-badge">
			<AsyncIconButton class="btn" on:click={() => createMessage()}>
				{#if creatingMode === 'aireply'}
					<AiAddIcon />
				{:else}
					<AddIcon />
				{/if}
			</AsyncIconButton>
		</div>
	</div>
</section>

<style>
	.messages {
		display: flex;
		flex-direction: column;
	}

	.message-line {
		position: relative;
	}

	.message-main {
		width: 100%;
		display: flex;
		flex-direction: row;
		column-gap: var(--space);
	}

	.message-user {
		min-width: 60px;
		flex-basis: 60px;
		flex-shrink: 1;
	}

	.message-text {
		flex-grow: 1;
	}

	.message-text .text {
		display: block;
		box-sizing: border-box;

		white-space: pre-line;
		padding: 0;
		margin: 0;
		max-width: 100%;
	}

	.message-controls {
		flex-shrink: 1;

		display: flex;
		flex-direction: row;
		align-items: center;
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

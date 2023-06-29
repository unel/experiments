<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { api, type ChatMessage } from '$lib/api';
	import AnswerNode from './AnswerNode.svelte';

	import CollapsedIcon from '@components/octicons/sm/ChevronRightIcon.svelte';
	import ExpandedIcon from '@components/octicons/sm/ChevronDownIcon.svelte';
	import SendIcon from '@components/octicons/sm/PaperAirplaneIcon.svelte';

	const dispatchEvent = createEventDispatcher();

	type WayNode = Record<string, unknown> & {
		id: string;
		name: string;
		title: string;
		threadParams: Record<string, any>;
	};

	type ThreadNode = Record<string, unknown> & {
		id: string;
		messageText: string;
		threadId: string;

		childNodes: Array<ThreadNode>;
		possibleWays: Array<WayNode>;
	};

	export let threadNode: ThreadNode;
	const shortAnswerLimit = 10;

	$: children = threadNode?.childNodes || [];
	$: possibleWays = threadNode?.possibleWays || [];

	$: answerNode = children.find((node) => node.title === 'answer');
	$: answerText = answerNode?.messageText ?? '';
	$: isShortAnswer = answerText && answerText.length < shortAnswerLimit;

	let showChilds = threadNode.title === 'answer' || !isShortAnswer;
	let showWays = showChilds;
	let messages: undefined | Array<Record<string, any>>;

	function toggleChilds() {
		showChilds = !showChilds;
	}

	function toggleWays() {
		showWays = !showWays;
	}

	async function ensureMessages() {
		if (messages) {
			return messages;
		}

		messages = await api.getNodeMessages(fetch, {
			threadId: threadNode.threadId,
			nodeId: threadNode.id
		});

		return messages;
	}

	async function forwardMessages() {
		await ensureMessages();

		dispatchEvent('fw_messages', { threadNode, messages });
	}

	function toggle() {
		toggleChilds();
		showWays = showChilds;
	}

	async function acceptWay(way: WayNode, threadParams = {}) {
		const result = await api.acceptWay(fetch, {
			threadId: threadNode.threadId,
			nodeId: threadNode.id,
			wayId: way.id,
			threadParams
		});

		threadNode.childNodes.push(result as ThreadNode);
		threadNode.possibleWays = threadNode.possibleWays.filter((w) => w.id !== way.id);
	}
</script>

<section class="node">
	{#if threadNode.title === 'answer'}
		{#if threadNode.messageText.length >= shortAnswerLimit}
			<AnswerNode answer={threadNode.messageText} />
		{/if}
	{:else}
		<span class="title" on:click={toggle}>
			<button class="btn-octicon" on:click={toggle}>
				{#if showWays}
					<ExpandedIcon />
				{:else}
					<CollapsedIcon />
				{/if}
			</button>

			{#if isShortAnswer}
				<span title={threadNode.messageText}>
					{threadNode.title}: {answerText}
				</span>
			{:else}
				<span title={threadNode.messageText}>
					{threadNode.title}
				</span>
			{/if}
		</span>
	{/if}

	{#if showChilds}
		<section class="children">
			{#each children as child}
				<div class="child">
					<svelte:self threadNode={child} on:fw_messages />
				</div>
			{/each}
		</section>
	{/if}

	{#if showWays}
		<section class="ways">
			{#each possibleWays as way}
				<div
					class="way"
					title={`${way.name} // ${way.threadParams?.message}`}
					on:click={() => acceptWay(way)}
				>
					>> {way.title}
					<button class="btn-octicon" on:click={() => acceptWay(way)}><SendIcon /></button>
				</div>
			{/each}
		</section>
	{/if}

	{#if threadNode.title === 'answer'}
		<button class="btn-link" on:click={forwardMessages}> forward messages </button>
	{/if}
</section>

<style>
	.node {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	.title {
		display: flex;
		flex-direction: row;
		align-items: center;
		column-gap: 0;
		cursor: pointer;
	}

	.way {
		cursor: pointer;
	}

	.children {
		border-left: 1px solid rgba(0, 0, 0, 0.04);
		margin-left: var(--space-sm);
		padding-left: var(--space-sm);
	}
</style>

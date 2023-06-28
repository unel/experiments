<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { api, type ChatMessage } from '$lib/api';
	import AnswerNode from './AnswerNode.svelte';

	type WayNode = Record<string, unknown> & {
		id: string;
		name: string;
		title: string;
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

	const dispatchEvent = createEventDispatcher();

	$: children = threadNode?.childNodes || [];
	$: possibleWays = threadNode?.possibleWays || [];

	$: answerNode = children.find((node) => node.title === 'answer');
	$: answerText = answerNode?.messageText ?? '';
	$: isShortAnswer = answerText && answerText.length < shortAnswerLimit;

	$: {
		console.log({ threadNode, children, possibleWays, answerNode });
	}

	let showChilds = threadNode.title === 'answer' || !isShortAnswer;
	let showWays = showChilds;
	let messages: undefined | Array<Record<string, any>>;

	function toggleChilds() {
		showChilds = !showChilds;
	}

	function toggleWays() {
		showWays = !showWays;
	}

	async function logMessages() {
		if (messages) {
			console.log('thread messages', messages);
			return;
		}

		messages = await api.getNodeMessages(fetch, {
			threadId: threadNode.threadId,
			nodeId: threadNode.id
		});

		logMessages();
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
					<svg
						class="octicon"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 16 16"
						width="16"
						height="16"
					>
						<path
							d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z"
						/>
					</svg>
				{:else}
					<svg
						class="octicon"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 16 16"
						width="16"
						height="16"
					>
						<path
							d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z"
						/>
					</svg>
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
					<svelte:self threadNode={child} />
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
					<button class="btn-octicon" on:click={() => acceptWay(way)}>
						<svg
							class="octicon"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 16 16"
							width="16"
							height="16"
						>
							<path
								d="M.989 8 .064 2.68a1.342 1.342 0 0 1 1.85-1.462l13.402 5.744a1.13 1.13 0 0 1 0 2.076L1.913 14.782a1.343 1.343 0 0 1-1.85-1.463L.99 8Zm.603-5.288L2.38 7.25h4.87a.75.75 0 0 1 0 1.5H2.38l-.788 4.538L13.929 8Z"
							/>
						</svg>
					</button>
				</div>
			{/each}
		</section>
	{/if}

	{#if threadNode.title === 'answer'}
		<button class="btn-link" on:click={logMessages}> log messages </button>
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

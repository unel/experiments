<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import CButton from '@components/controls/ButtonWithConfirmation.svelte';
	import type { Chat } from '$lib/api';

	export let currentId = '';
	export let chats: Chat[] = [];

	const dispatchEvent = createEventDispatcher<{
		remove: { id: string };
		create: {};
	}>();

	function removeChat(id: string) {
		dispatchEvent('remove', { id });
	}

	function createChat() {
		dispatchEvent('create');
	}
</script>

<nav class="SideNav border" style="max-width: 360px">
	<button class="SideNav-item" on:click={createChat}>+ Chat</button>

	{#each chats as chat, idx}
		<a class="SideNav-item chat-item" aria-current={chat.id === currentId} href="#chat:{chat.id}">
			#{idx}
			{chat.title}

			<CButton on:confirmed={() => removeChat(chat.id)}>remove</CButton>
		</a>
	{/each}
</nav>

<style>
	.chat-item {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
	}
</style>

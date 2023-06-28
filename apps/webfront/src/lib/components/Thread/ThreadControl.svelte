<script lang="ts">
	import ThreadNode from './ThreadNode.svelte';

	export let thread: Record<string, any>;
</script>

<section class="thread">
	<ThreadNode threadNode={thread.rootNode} on:fw_messages />
</section>

<style>
	.thread {
		padding: var(--space-sm) var(--space) var(--space-sm) 0;
	}
</style>

<script lang="ts">
	import ThreadNode from './ThreadNode.svelte';

	export let thread: Record<string, any>;
</script>

<section class="thread">
	<ThreadNode threadNode={thread.rootNode} />
</section>

<style>
	.thread {
		border: 1px solid red;
		padding: var(--space);
	}
</style>

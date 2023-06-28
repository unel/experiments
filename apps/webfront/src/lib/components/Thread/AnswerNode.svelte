<script lang="ts">
	export let answer: string = '';
</script>

<span class="answer" title={answer}>
	{answer}
</span>

<style>
	.answer {
		white-space: pre-line;
	}
</style>

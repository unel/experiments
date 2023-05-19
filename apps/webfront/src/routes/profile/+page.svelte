<script lang="ts">
	export let data;
</script>

<main class="MainContent">
	<header>
		<h1>Profile page // {data.user.id}</h1>
	</header>

	just kidding
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
</style>

<script>
	import { page } from '$app/stores';
	import './styles.css';
	import './primer.css';

	export let data;

	const authorizedLinks = [
		{ title: 'Profile', path: '/profile' },
		{ title: 'Api tests', path: '/api-tests' },
		{ title: 'Chats', path: '/chats' }
	];

	const unauthorizedLinks = [{ title: 'Login', path: '/login' }];

	const links = data.user ? authorizedLinks : unauthorizedLinks;
</script>

<header class="Header">
	{#if data.user}
		<div class="Header-item">
			[ {data.user.id} ]
		</div>
	{/if}

	{#each links as link}
		<a
			class="Header-item Header-link {link.path === $page.route.id ? 'active' : ''}"
			href={link.path}>{link.title}</a
		>
	{/each}
</header>

<slot />

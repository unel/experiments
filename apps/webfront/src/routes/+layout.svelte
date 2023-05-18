<script>
	import { page } from '$app/stores';
	import './styles.css';
	import './primer.css';

	let links = [
		{ title: 'Login', path: '/login' },
		{ title: 'Profile', path: '/profile' },
		{ title: 'Api tests', path: '/api-tests' },
		{ title: 'Chats', path: '/chats' },
	];
</script>

<header class="Header">
	{#each links as link}
		<a class="Header-item Header-link {link.path === $page.route.id ? "active" : ""}" href={link.path}>{link.title}</a>
	{/each}
</header>

<slot />

<script>
	import { page } from '$app/stores';
	import './styles.css';

	let links = [
		{ title: 'Login', path: '/login' },
		{ title: 'Profile', path: '/profile' },
		{ title: 'Api tests', path: '/api-tests' },
		{ title: 'Chats', path: '/chats' },
	];
</script>

<header class="container">
	<nav>
		<ul class="nav nav-underline">
			{#each links as link}
				<li class="nav-item">
					<a class="nav-link {link.path === $page.route.id ? "active" : undefined}" href={link.path}>{link.title}</a>
				</li>
			{/each}
		</ul>
	</nav>
</header>

<slot />

import { fail, redirect, type RequestEvent, type Actions, type ActionFailure } from '@sveltejs/kit';
import { loginUser } from '$lib/user.model';

function redirectNext(event: RequestEvent) {
	console.log('ev', JSON.stringify(event.url.searchParams, undefined, 4))
	console.log('redirecting', event.url.searchParams.get('redirectTo'));
	throw redirect(302, event.url.searchParams.get('redirectTo') || '/profile');
}

export async function load(event: RequestEvent) {
	if (event.locals.user) {
		redirectNext(event);
	}
}

export const actions: Actions = {
	default: async (event: RequestEvent) => {
		const formData = Object.fromEntries(await event.request.formData());

		const { id, password } = formData as Record<'id' | 'password', string>;
		const { error, token } = await loginUser(id, password);

		if (error || !token) {
			return fail(401, { error: error || 'no token returned' });
		}

		event.cookies.set('AuthorizationToken', token, {
			httpOnly: true,
			path: '/',
			secure: false,
			sameSite: 'strict',
			maxAge: 60 * 60 * 24
		});

		return redirectNext(event);
	}
}

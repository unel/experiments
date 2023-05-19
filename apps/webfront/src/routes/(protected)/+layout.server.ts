import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '../$types';

export function load({ url, locals }: RequestEvent) {
	if (!locals.user) {
		throw redirect(303, `/login?redirectTo=${url.pathname}`);
	}
}

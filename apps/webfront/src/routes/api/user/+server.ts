import { json, type RequestEvent } from '@sveltejs/kit';

export function GET({ locals }: RequestEvent) {
    return json({
        user: locals.user || null,
    });
}

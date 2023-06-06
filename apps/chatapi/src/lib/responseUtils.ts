import { json } from '@sveltejs/kit';
import { Error as DBClientError } from '$lib/db';

export function replyErrorJSON(e: unknown, statusCode = 500) {
    let error;

    if (e instanceof DBClientError.KnownRequestError) {
        error = {
            code: e.code,
            cause: e.meta?.cause,
        };
    } else {
        error = {
            code: 'UNK',
            cause: String(e),
        };
    }

    return json({ error }, { status: statusCode })
}

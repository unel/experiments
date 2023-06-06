import { json } from '@sveltejs/kit';

import { db } from '$lib/db';
import { pickFields } from '$lib/collections';
import { replyErrorJSON } from '$lib/responseUtils';

export async function GET({ params }) {
    try {
        const chat = await db.chat.findUniqueOrThrow({
            where: {
                id: params.id
            }
        });

        return json(chat);
    } catch (e) {
        return replyErrorJSON(e);
    }
}

export async function POST({ params, request }) {
    const acceptableFields = ['title'];
    const bodyParams = await request.json();

    const updates = pickFields(bodyParams, acceptableFields);
    if (!updates) {
        return json({});
    }

    try {
        const chat = await db.chat.update({
            where: {
                id: params.id
            },
            data: updates,
        });

        return json(chat);
    } catch (e) {

        return replyErrorJSON(e);
    }
}

export async function DELETE({ params }) {
    try {
        await db.chat.delete({
            where: {
              id: params.id,
            },
        });

        return json({ ok: true });

    } catch (e) {
        return replyErrorJSON(e);
    }
}

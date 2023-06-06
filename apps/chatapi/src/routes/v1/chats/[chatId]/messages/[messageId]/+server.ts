import { json } from '@sveltejs/kit';

import { db } from '$lib/db';
import { pickFields } from '$lib/collections';
import { replyErrorJSON } from '$lib/responseUtils';

export async function GET({ params }) {
    try {
        const message = await db.chatMessage.findUniqueOrThrow({
            where: {
                id: params.messageId,
            }
        });

        return json(message);
    } catch (e) {
        return replyErrorJSON(e);
    }
}

export async function POST({ params, request }) {
    const acceptableFields = ['userId', 'chatId', 'language', 'text'];
    const bodyParams = await request.json();

    const updates = pickFields<string>(bodyParams, acceptableFields);
    if (!updates) {
        return json({});
    }

    try {
        const message = await db.chatMessage.update({
            where: {
                id: params.messageId,
            },
            data: updates,
        });

        return json(message);
    } catch (e) {

        return replyErrorJSON(e);
    }
}

export async function DELETE({ params }) {
    try {
        await db.chatMessage.delete({
            where: {
              id: params.messageId,
            },
        });

        return json({ ok: true });

    } catch (e) {
        return replyErrorJSON(e);
    }
}

import { json } from '@sveltejs/kit';

import { db } from '$lib/db';
import { pickFields } from '$lib/collections';
import { replyErrorJSON } from '$lib/responseUtils';

export async function GET({ params }) {
    try {
        const messages = await db.chatMessage.findMany({
            where: {
                chatId: params.chatId,
            }
        });

        return json(messages);
    } catch (e) {
        return replyErrorJSON(e);
    }
}

export async function POST({ params, request }) {
    const acceptableFields = ['userId', 'language', 'text'];
    const bodyParams = await request.json();

    const data = pickFields<string>(bodyParams, acceptableFields);
    if (!data?.text || !data.userId) {
        return json({});
    }

    try {
        const message = await db.chatMessage.create({
            data: {
                chatId: params.chatId,
                userId: data.userId,
                language: data.language || 'en',
                text: data.text,
            }
        });

        return json(message);
    } catch (e) {

        return replyErrorJSON(e);
    }
}

import { json } from '@sveltejs/kit';

import { db } from '$lib/db';

function safeJSONParse(strValue: string | undefined | null): number | string | boolean | undefined | null {
    if (typeof strValue === 'string') {
        try {
            return JSON.parse(strValue);
        } catch (_) {
            // just pass
        }
    }

    return strValue;
}

export async function GET({ url }) {
    const userId = url.searchParams.get('userId');
    const withMessages = Boolean(safeJSONParse(url.searchParams.get('withMessages')));
    const query = userId ? { userId } : {}
    const chats = await db.chat.findMany({
        where: query,
        orderBy: {
            createdAt: 'desc',
        },
        include: {
            messages: withMessages,
        }
    });

    return json(chats);
}

export async function POST({ request }) {
    const bodyParams = await request.json();

    const newChat = await db.chat.create({
        data: {
            title: bodyParams.title || '',
            userId: bodyParams.userId || '',
        }
    });

    return json(newChat);
}

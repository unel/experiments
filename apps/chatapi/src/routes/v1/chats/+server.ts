import { json } from '@sveltejs/kit';

import { db } from '$lib/db';

export async function GET({ request, url }) {
    const userId = url.searchParams.get('userId');
    const query = userId ? { userId } : {}
    const chats = await db.chat.findMany({
        where: query,
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

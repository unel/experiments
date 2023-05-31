import { json } from '@sveltejs/kit';

import { db } from '$lib/db';

export async function GET() {
    const chats = await db.chat.findMany();

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

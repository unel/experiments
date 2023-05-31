import { json } from '@sveltejs/kit';

import { db } from '$lib/db';

export async function GET({ params}) {
    const chat = await db.chat.findMany({
        where: {
            id: params.id
        }
    });

    return json(chat);
}

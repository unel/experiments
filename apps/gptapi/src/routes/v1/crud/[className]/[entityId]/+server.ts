import { json } from '@sveltejs/kit';

import { db } from '$lib/db';
import { getTableName } from '../utils';

// get entity by id or name
export async function GET({ params }) {
    const tableName = getTableName(params);

    // TODO: maybe use custom checks?
    if (!tableName || !db[tableName]) {
        console.log('misskey', params, tableName, Object.keys(db));
        return new Response();
    }

    const entity = await db[tableName].findUniqueOrThrow({
        where: {
            id: params.entityId,
        }
    });

    return json(entity);
}

// update entity by id or name
export async function POST() {
    const tableName = getTableName(params);
    if (!tableName || !db[tableName]) {
        console.log('misskey', params, tableName, Object.keys(db));
        return new Response();
    }

    const payload = await request.json();
    const result = await db[tableName].update({
        where: {
            id: params.entityId,
        },
        data: payload,
    });
}

// delete entity by id or name
export async function DELETE() {
    const tableName = getTableName(params);
    if (!tableName || !db[tableName]) {
        console.log('misskey', params, tableName, Object.keys(db));
        return new Response();
    }

    await db.chat.delete({
        where: {
          id: params.entityId,
        },
    });

    return json({ ok: true });
}

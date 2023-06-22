import { json } from '@sveltejs/kit';

import { db } from '$lib/db';
import { getTableName } from './utils';

// get list of entitites
export async function GET({ params }) {
	const tableName = getTableName(params);
	if (!tableName || !db[tableName]) {
		console.log('misskey', params, tableName, Object.keys(db));
		return new Response();
	}

	const result = await db[tableName].findMany();

	return json(result);
}

// create new entity
export async function POST({ request, params }) {
	const tableName = getTableName(params);
	if (!tableName || !db[tableName]) {
		console.log('misskey', params, tableName);
		return new Response();
	}

	const payload = await request.json();
	const result = await db[tableName].create({ data: payload });

	return json(result);
}

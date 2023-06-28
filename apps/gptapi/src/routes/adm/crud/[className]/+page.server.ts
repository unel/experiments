import { BASEPATH } from '$env/static/private';
import { db } from '$lib/db';

import { getTableName } from '../utils';

export async function load({ params }) {
	const tableName = getTableName(params);
	console.log('tableName', tableName);
	const entities = await db[tableName].findMany({});

	return {
		basePath: BASEPATH,
		entityName: tableName,
		entities,
	};
}

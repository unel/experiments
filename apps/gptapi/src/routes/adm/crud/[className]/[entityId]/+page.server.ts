import { db } from '$lib/db';

import { getTableName } from '../../utils';

export async function load({ params }) {
	const tableName = getTableName(params);
	const entity = await db[tableName].findUnique({
		where: { id: params.entityId },
	});

	return {
		entityName: tableName,
		entityId: params.entityId,
		entity,
	};
}

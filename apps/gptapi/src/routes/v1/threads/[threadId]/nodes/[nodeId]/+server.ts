// imports
import { json } from '@sveltejs/kit';

import { db } from '$lib/db';
import { acceptWay } from '$lib/threads';

// --

export async function GET({ params, request }) {
	const { threadId, nodeId } = params;

	const node = await db.threadNode.findUniqueOrThrow({ where: { id: nodeId } });

	node.childNodes = await db.threadNode.findMany({
		where: {
			parentNodeId: node.id,
		},
	});

	return json(node);
}

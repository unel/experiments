// imports
import { json } from '@sveltejs/kit';

import { db } from '$lib/db';
import { acceptWay } from '$lib/threads';

// --

export async function POST({ params, request }) {
	const payload = await request.json();
	const { wayId, threadParams = {} } = payload;
	const { threadId, nodeId } = params;

	const [thread, parentNode, threadWay] = await Promise.all([
		db.thread.findUniqueOrThrow({ where: { id: threadId } }),
		db.threadNode.findUniqueOrThrow({ where: { id: nodeId } }),
		db.threadTemplateWay.findUniqueOrThrow({
			where: { id: wayId },
			include: { promptTemplate: true },
		}),
	]);

	const newNode = await acceptWay({
		thread,
		parentNode,

		threadWay,
		threadParams,
	});

	return json(newNode);
}

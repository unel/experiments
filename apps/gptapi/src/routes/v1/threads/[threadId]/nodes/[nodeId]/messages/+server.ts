// imports
import { json } from '@sveltejs/kit';
import { getThreadNodeMessages } from '$lib/threads';

export async function GET({ params }) {
	const messages = await getThreadNodeMessages({
		threadId: params.threadId,
		nodeId: params.nodeId,
	});

	return json(messages);
}

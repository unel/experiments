// imports
import { json } from '@sveltejs/kit';

import { db } from '$lib/db';
import { mergeObjects } from '$lib/collections-utils';
import { formTemplateCommand, fillTemplates, execCommand } from '$lib/prompts';
import { renderTemplate } from '$lib/tmpl';

import { expandThread } from '$lib/threads';

// --

export async function GET({ request, params, url }) {
	const thread = await db.thread.findUniqueOrThrow({ where: { id: params.threadId } });

	await expandThread(thread);

	return json(thread);
}

export async function POST({ request, params }) {
	// const payload = await request.json();
	// const thread = await createThread(payload);
	// return json(thread);
}

// imports
import { json } from '@sveltejs/kit';

import { db } from '$lib/db';
import { mergeObjects } from '$lib/collections-utils';
import { formTemplateCommand, fillTemplates, execCommand } from '$lib/prompts';
import { renderTemplate } from '$lib/tmpl';

import { createThread, expandThread } from '$lib/threads';

// --

export async function GET({ request, params, url }) {
	const threads = await db.thread.findMany();

	return json(threads);
}

export async function POST({ request, params }) {
	const payload = await request.json();

	if (payload.id) {
		const thread = await db.thread.findUnique({ where: { id: payload.id } });

		if (thread) {
			await expandThread(thread);

			return json(thread);
		}
	}

	const thread = await createThread(payload);

	return json(thread);
}

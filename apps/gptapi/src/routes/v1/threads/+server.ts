// imports
import { json } from '@sveltejs/kit';

import { db } from '$lib/db';
import { mergeObjects } from '$lib/collections-utils';
import { formTemplateCommand, fillTemplates, execCommand } from '$lib/prompts';
import { renderTemplate } from '$lib/tmpl';

// --

async function getPossibleNodeWays(threadNode) {
	return db.threadTemplateWay.findMany({
		where: {
			parentWayId: threadNode.threadWayId,
		},
	});
}

async function getNodeAncestors(parentNode = null, oldsFirst = true) {
	const ancestors = [];
	let target = parentNode;

	while (target) {
		ancestors.push(target);

		if (!taget.parentNodeId) {
			break;
		}

		target = await db.threadNode.findUnique({ where: { id: taget.parentNodeId } });
	}

	if (oldsFirst) {
		ancestors.reverse();
	}

	return ancestors;
}

async function acceptWay({
	thread,
	parentNode = null,

	threadWay,

	threadParams = {},
}) {
	const alreadyExist = await db.threadNode.findMany({
		where: {
			threadId: thread.id,
			threadWayId: threadWay.id,
		},
	});

	if (alreadyExist.length) {
		return json({ ok: false, alreadyExist });
	}

	const nodeAncestors = await getNodeAncestors(parentNode);
	const threadNodeRQData = { threadId: thread.id, threadWayId: threadWay.id, threadParams };
	const threadNodeRPData = { threadId: thread.id, threadWayId: threadWay.id };

	const baseParams = mergeObjects([
		thread.threadParams,

		...nodeAncestors.map(a => a.threadParams),

		threadParams,

		{
			threadMessages: [
				...(thread.threadParams['+threadMessages'] || []),

				...nodeAncestors.flatMap(a => [
					a.threadParams['+threadMessages'] || [],
					{
						date: a.messageTimestamp,
						user: a.messageUser,
						message: a.messageText,
					},
				]),

				...(threadParams['+threadMessages'] || []),
			],
		},
	]);
	const wayParams = fillTemplates(threadWay.threadParams, baseParams);
	if (typeof wayParams.message === 'string') {
		wayParams.message = {
			user: 'user',
			text: wayParams.message,
		};
	}

	threadNodeRQData.messageText = wayParams.message.text;
	threadNodeRQData.messageUser = wayParams.message.user;

	if (!parentNode) {
		threadNodeRQData.threadId = thread.id;
	}

	if (threadWay.promptTemplate) {
		const templateCommand = formTemplateCommand(
			threadWay.promptTemplate,
			mergeObjects([baseParams, wayParams]),
		);
		const commandResult = await execCommand(templateCommand);

		// threadNodeRQData.templateCommand = templateCommand;
		// threadNodeRPData.commandResult = commandResult;

		threadNodeRPData.messageUser = commandResult.role;
		threadNodeRPData.messageText = commandResult.content;
	}

	return [
		['ThreadNode', threadNodeRQData],
		['ThreadNode', threadNodeRPData],
	];
}

async function joinThreadWays(rootWay, where = {}) {
	const nextWays = await db.threadTemplateWay.findMany({
		where: { parentWayId: rootWay.id, ...where },
		include: { promptTemplate: true },
	});

	rootWay.nextWays = nextWays;

	if (nextWays.length) {
		await Promise.all(nextWays.map(nextWay => joinThreadWays(nextWay, where)));
	}

	return rootWay;
}

export async function GET({ request, params, url }) {
	const payload = Object.fromEntries(url.searchParams.entries());
	const { title, templateId, sentence, threadParams = {} } = payload;

	const threadTemplate = await db.threadTemplate.findUniqueOrThrow({
		where: { id: templateId },
		include: {
			rootWay: {
				include: { promptTemplate: true },
			},
		},
	});

	await joinThreadWays(threadTemplate.rootWay, { autoExpand: true });

	const threadData = {
		id: 'thread-id',
		title,
		threadParams: mergeObjects([threadTemplate.initialParams, threadParams, { sentence }]),
	};

	const acceptRootWayData = await acceptWay({
		thread: threadData,
		parentNode: null,

		threadTemplate: threadTemplate,
		threadWay: threadTemplate.rootWay,

		threadParams,
	});

	return json([['Thread', threadData], ...acceptRootWayData]);

	return json({
		threadTemplate,
		ttId: threadTemplate.rootWayId || '???',
		threadData,
		acceptRootWayData,
	});
}

export async function POST({ request, params }) {
	const payload = await request.json();
	const { title, templateId, threadParams = {} } = payload;

	const threadTemplate = await db.threadTemplate.findUniqueOrThrow({
		where: { id: templateId },
		include: { rootWay: true },
	});

	Object.assign(threadParams, threadTemplate.initialParams);

	const threadData = {
		title,
		threadParams,
	};

	const thread = await db.thread.create({
		data: threadData,
	});

	return json(thread);
}

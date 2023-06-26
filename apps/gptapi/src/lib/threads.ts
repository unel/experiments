// imports
import { json } from '@sveltejs/kit';

import { db } from '$lib/db';
import { connectEntity } from '$lib/db-utils';
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
	const threadNodeRQData = {
		thread: connectEntity(thread.id),
		threadWayId: threadWay.id,
		threadParams,
	};

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

	const threadNodeRQ = await db.threadNode.create({ data: threadNodeRQData });

	if (threadWay.promptTemplate) {
		const threadNodeRPData = {
			thread: connectEntity(thread.id),
			threadWayId: threadWay.id,
			parentNode: connectEntity(threadNodeRQ.id),
			threadParams: {},
		};

		const templateCommand = formTemplateCommand(
			threadWay.promptTemplate,
			mergeObjects([baseParams, wayParams]),
		);
		const commandResult = await execCommand(templateCommand);

		threadNodeRPData.messageUser = commandResult.role;
		threadNodeRPData.messageText = commandResult.content;

		await db.threadNode.create({ data: threadNodeRPData });
	}

	return threadNodeRQ;
}

async function joinThreadTemplateWays(rootWay, where = {}) {
	const nextWays = await db.threadTemplateWay.findMany({
		where: { parentWayId: rootWay.id, ...where },
		include: { promptTemplate: true },
	});

	rootWay.nextWays = nextWays;

	if (nextWays.length) {
		await Promise.all(nextWays.map(nextWay => joinThreadTemplateWays(nextWay, where)));
	}

	return rootWay;
}

async function joinThreadNodes(thread, rootNode = null, where = {}) {
	const childNodes = await db.threadNode.findMany({
		where: {
			...where,
			threadId: thread.id,
			parentNode: rootNode,
		},
	});

	if (rootNode) {
		rootNode.childNodes = childNodes;
	} else {
		thread.rootNode = childNodes[0];
	}

	if (childNodes.length) {
		await Promise.all(childNodes.map(childNode => joinThreadNodes(thread, childNode, where)));
	}

	return rootNode;
}

async function joinPossibleNodeWays(threadNode) {
	threadNode.possibleWays = await getPossibleNodeWays(threadNode);
}

async function expandThreadWays(thread) {
	const queue = [thread.rootNode];

	while (queue.length) {
		const target = queue.shift();
		if (!target) {
			continue;
		}

		await joinPossibleNodeWays(target);
		if (target.childNodes.length) {
			queue.push(...taget.childNodes);
		}
	}
}

export async function expandThread(thread) {
	await joinThreadNodes(thread);
	await expandThreadWays(thread);
}

async function acceptRootWay(thread) {}

async function acceptAutoexpandableWays(thread) {}

export async function createThread(params) {
	const { title, templateId, sentence, threadParams = {} } = params;

	const threadTemplate = await db.threadTemplate.findUniqueOrThrow({
		where: { id: templateId },
		include: {
			rootWay: {
				include: { promptTemplate: true },
			},
		},
	});

	const threadData = {
		title,
		threadParams: mergeObjects([threadTemplate.initialParams, threadParams, { sentence }]),
	};

	const thread = await db.thread.create({
		data: threadData,
	});

	const acceptRootWayData = await acceptWay({
		thread,
		parentNode: null,

		threadTemplate: threadTemplate,
		threadWay: threadTemplate.rootWay,

		threadParams,
	});

	await expandThread(thread);

	return thread;
}

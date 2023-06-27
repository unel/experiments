// imports
import { db } from '$lib/db';
import { connectEntity } from '$lib/db-utils';
import { mergeObjects } from '$lib/collections-utils';
import { formTemplateCommand, fillTemplates, execCommand } from '$lib/prompts';
import { renderTemplate } from '$lib/tmpl';

// --

async function getPossibleNodeWays(threadNode) {
	if (!threadNode.childNodes) {
		threadNode.childNodes = await db.threadNode.findMany({
			parentNodeId: threadNode.id,
		});
	}

	return db.threadTemplateWay.findMany({
		where: {
			parentWayId: threadNode.threadWayId,
			id: {
				notIn: threadNode.childNodes.map(child => child.excludeThreadWayId).filter(Boolean),
			},
		},
	});
}

async function getNodeAncestors(parentNode = null, oldsFirst = true) {
	const ancestors = [];
	let target = parentNode;

	while (target) {
		ancestors.push(target);

		if (!target.parentNodeId) {
			break;
		}

		target = await db.threadNode.findUnique({ where: { id: target.parentNodeId } });
	}

	if (oldsFirst) {
		ancestors.reverse();
	}

	return ancestors;
}

export async function acceptWay({
	thread,
	parentNode = null,

	threadWay,
	threadParams = {},
}) {
	console.log('acceptWay', threadWay);

	const alreadyExist = await db.threadNode.findMany({
		where: {
			threadId: thread.id,
			threadWayId: threadWay.id,
		},
	});

	if (alreadyExist.length) {
		console.log('already exists');

		return { ok: false, alreadyExist };
	}

	const nodeAncestors = await getNodeAncestors(parentNode);
	const threadNodeRQData = {
		parentNode: parentNode ? connectEntity(parentNode.id) : undefined,
		thread: connectEntity(thread.id),
		excludeThreadWayId: threadWay.id,
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
					...(a.threadParams['+threadMessages'] || []),
					{
						date: a.messageTimestamp,
						user: a.messageUser,
						text: a.messageText,
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
	console.log('acceptWay/request message created', threadNodeRQ);

	if (threadWay.promptTemplate) {
		console.log('acceptWay/promptTemplate exist');
		const templateCommand = formTemplateCommand(
			threadWay.promptTemplate,
			mergeObjects([baseParams, wayParams]),
		);
		console.log('acceptWay/command', templateCommand);
		const commandResult = await execCommand(templateCommand);
		console.log('acceptWay/command result', commandResult);

		const threadNodeRPData = {
			thread: connectEntity(thread.id),
			threadWayId: threadWay.id,
			parentNode: connectEntity(threadNodeRQ.id),
			threadParams: {},
			messageUser: commandResult.role,
			messageText: commandResult.content,
		};

		const threadNodeRP = await db.threadNode.create({ data: threadNodeRPData });
		console.log('acceptWay/reply node created', threadNodeRP);
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
	const childWhere = {
		...where,
		threadId: thread.id,
	};

	if (rootNode) {
		childWhere.parentNodeId = rootNode.id;
	} else {
		childWhere.parentNode = null;
	}

	const childNodes = await db.threadNode.findMany({ where: childWhere });

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
		if (target.childNodes?.length) {
			queue.push(...target.childNodes);
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
	const { id, title, templateId, threadParams = {} } = params;

	const threadTemplate = await db.threadTemplate.findUniqueOrThrow({
		where: { id: templateId },
		include: {
			rootWay: {
				include: { promptTemplate: true },
			},
		},
	});

	const threadData = {
		id,
		title,
		threadParams: mergeObjects([threadTemplate.initialParams, threadParams]),
	};

	const thread = await db.thread.create({
		data: threadData,
	});

	const acceptRootWayData = await acceptWay({
		thread,
		parentNode: null,

		threadWay: threadTemplate.rootWay,
		threadParams,
	});

	await expandThread(thread);

	return thread;
}

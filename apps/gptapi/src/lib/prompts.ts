import { type PromptTemplate, GptRequestType } from '@prisma/client';

import { aiApi } from '$lib/aiapi';
import { db } from '$lib/db';
import { hash, recMap } from '$lib/collections-utils';
import { renderTemplate } from '$lib/tmpl';
import { TEMPLATES_BY_ID } from '$lib/data/prompt-templates';

type TemplateValue = number | boolean | string | Array<TemplateValue>;

const apiMethodNamesByRequestType = {
	[GptRequestType.COMPLETION]: 'createCompletion',
	[GptRequestType.CHAT_COMPLETION]: 'createChatCompletion',
	[GptRequestType.EDIT]: 'createEdit',
};

const requestTypeByApiMethodName = {
	createCompletion: GptRequestType.COMPLETION,
	createChatCompletion: GptRequestType.CHAT_COMPLETION,
	createEdit: GptRequestType.EDIT,
};

function formAiPromptFromTemplate(
	template: PromptTemplate,
	data: Record<string, TemplateValue> = {},
) {
	let methodName = apiMethodNamesByRequestType[template.requestType];

	const paramsFromTemplate =
		typeof template.requestParamsTemplate === 'string'
			? fillTemplate(template.requestParamsTemplate, data)
			: fillTemplates(template.requestParamsTemplate, data);

	const methodParams = {
		...paramsFromTemplate,
		model: template.modelId,
	};

	return {
		methodName,
		methodParams,
	};
}

export function fillTemplate(
	template: TemplateValue,
	data: Record<string, TemplateValue>,
): TemplateValue {
	if (typeof template !== 'string') {
		return template;
	}

	const rawStr = renderTemplate(template, data);
	try {
		return JSON.parse(rawStr);
	} catch (e) {
		return rawStr;
	}
}

export function fillTemplates(
	templates: Record<string, unknown>,
	data: Record<string, TemplateValue>,
) {
	return recMap(templates, ({ value }) => {
		const newValue = fillTemplate(value, data);

		return { value: newValue };
	});
}

export async function acquireTemplate(templateId) {
	if (TEMPLATES_BY_ID[templateId]) {
		return TEMPLATES_BY_ID[templateId];
	}

	return db.promptTemplate.findUniqueOrThrow({ where: { id: templateId } });
}

export function formTemplateCommand(template, payload) {
	return {
		aiApi: formAiPromptFromTemplate(template, payload),
		templateInfo: {
			id: template.id,
			data: payload,
		},
	};
}

function extractMessage(gptResponseData) {
	return gptResponseData.choices[0].message;
}
export async function execCommand(cmd) {
	console.log('execCommand', cmd);
	const cmdHash = hash(cmd.aiApi);
	console.log('execCommand/hash', cmdHash);
	const cachedRequest = await db.gptRequest.findUnique({
		where: {
			id: cmdHash,
		},
		include: {
			response: true,
		},
	});
	console.log('execCommand/cache', cachedRequest);

	if (cachedRequest) {
		console.log('execCommand/cache exists', cachedRequest.response);
		return extractMessage(cachedRequest.response.payload);
	}

	console.log('execCommand/call api..');
	const { methodName, methodParams } = cmd.aiApi;
	const response = await aiApi[methodName].call(aiApi, methodParams);
	console.log('execCommand/api result', response.data);

	try {
		console.log('execCommand/updating cache..');
		const newCache = await db.gptRequest.create({
			data: {
				id: cmdHash,
				model: { connect: { id: methodParams.model } },
				type: requestTypeByApiMethodName[methodName],
				payload: cmd,
				response: {
					create: {
						payload: response.data,
					},
				},
			},
		});
	} catch (e) {
		console.error('execCommand/caching error', e);
	}

	return extractMessage(response.data);
}

export async function execTemplateCommand(templateOrId, payload) {
	const template =
		typeof templateOrId === 'string' ? await acquireTemplate(templateOrId) : templateOrId;

	console.log('execTemplateCommand/template', templateOrId, template);

	const cmd = formTemplateCommand(template, payload);
	const result = await execCommand(cmd);

	return {
		template,
		cmd,
		result,
	};
}

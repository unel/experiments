import { GptRequestType } from '@prisma/client';
import { stripIndent } from 'common-tags';

export const TEMPLATES_LIST = [
	{
		id: 'cmd-check',
		name: 'check command',
		modelId: 'text-davinci-003',

		requestType: GptRequestType.COMPLETION,
		requestParamsTemplate: {
			max_tokens: 3,
			prompt: stripIndent`
				Is sentence "{text}" one of a commands?
				Name this command, or just say "no".
				Commands:{commands}

				Command:
			`,
		},
	},

	{
		id: 'q',
		name: 'simple question',
		modelId: 'gpt-3.5-turbo',

		requestType: GptRequestType.CHAT_COMPLETION,
		requestParamsTemplate: {
			max_tokens: 200,
			messages: [
				{
					role: 'system',
					content: 'You are a supportive, but laconic assistant, not an ai.',
				},
				{ role: 'user', content: '{text}' },
			],
		},
	},

	{
		id: 'code',
		name: 'code assist',
		modelId: 'gpt-3.5-turbo',

		requestType: GptRequestType.CHAT_COMPLETION,
		requestParamsTemplate: {
			max_tokens: 512, // kappa
			messages: [
				{
					role: 'system',
					content: `You are code assistant, but instead answers you should ask claryfiying questions.`,
				},
				{ role: 'user', content: '{text}' },
			],
		},
	},

	{
		id: 'direct-chat',
		name: 'direct chat',
		description: 'just forward data to gpt3.5',
		modelId: 'gpt-3.5-turbo',

		requestType: GptRequestType.CHAT_COMPLETION,
		requestParamsTemplate: {
			max_tokens: '{maxTokens}',
			messages: [
				{ role: 'system', content: '{systemText}'},
				{ role: 'user', content: '{userText}'},
			],
		},
	},

	{
		id: 'raw-chat',
		name: 'direct chat',
		description: 'just forward data to gpt3.5',
		modelId: 'gpt-3.5-turbo',

		requestType: GptRequestType.CHAT_COMPLETION,
		requestParamsTemplate: '{$payloadJSON}',
	},

	{
		id: 'direct-prompt',
		name: 'direct prompt',
		description: 'just forward data to text-davinci',
		modelId: 'text-davinci-003',

		requestType: GptRequestType.COMPLETION,
		requestParamsTemplate: {
			max_tokens: '{maxTokens}',
			prompt: '{prompt}'
		},
	},

	{
		id: 'gr-fix',
		name: 'fix grammar',
		modelId: 'text-davinci-edit-001',

		requestType: GptRequestType.EDIT,
		requestParamsTemplate: {
			instruction: 'Fix all grammar and spelling mistakes',
			input: '{text}',
		},
	},
];

export const TEMPLATES_BY_ID = {};
for (const template of TEMPLATES_LIST) {
	TEMPLATES_BY_ID[template.id] = template;
}

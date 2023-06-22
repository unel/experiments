import { GptRequestType } from '@prisma/client';
import { stripIndent } from 'common-tags';

export const TEMPLATES_LIST = [
	{
		id: 'cmd-check',
		name: 'check command',
		model: 'text-davinci-003',

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
		model: 'gpt-3.5-turbo',

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
		id: 'gr-fix',
		name: 'fix grammar',
		model: 'text-davinci-edit-001',

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

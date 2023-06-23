import { GptRequestType } from '@prisma/client';
import { stripIndent } from 'common-tags';

const ptIdTM = 'pt-gpt-discuss';
export const PROMPT_TEMPLATES_LIST = [
	{
		id: ptIdTM,
		name: 'prompt for discuss',
		modelId: 'gpt-3.5-turbo',

		requestType: GptRequestType.CHAT_COMPLETION,
		requestParamsTemplate: stripIndent`{
			"max_tokens": {{maxTokens}},
			"messages": [
				{%each threadMessages as msg%}
				{"role": "{{msg.user}}", "content": "{{msg.text}}"},
				{%endeach%}
				{"role": "{{message.user}}", "content": "{{message.text}}"}
			]
		}`,
	},
];

const twIdSQ = 'tw-ts/sentence-quality';

const ASPECTS = [
	'grammar accuracy',
	'conciseness and clear expression',
	'appropriate style',
	'contextual suitability',
];

export const THREAD_WAYS_LIST = [
	{
		id: twIdSQ,
		name: 'sequence quality',

		promptTemplateId: ptIdTM,
		autoExpand: true,
		threadParams: {
			maxTokens: 3,
			message:
				"Estimate sentence quality in range 0 - 1. Provide number only. Sentence: '{{sentence}}'",
		},
	},

	...ASPECTS.flatMap(aspect => [
		{
			id: `tw-sentence-aspect/${aspect}-etimate`,
			name: `${aspect} sentence aspect estimation`,

			parentWayId: twIdSQ,

			promptTemplateId: ptIdTM,

			threadParams: {
				maxTokens: 3,
				sentenceAspect: aspect,
				message: `Estimate ${aspect} of this sentence in range 0 - 1. Provide only number, nothing else`,
			},
		},

		{
			id: `tw-sentence-aspect/${aspect}-explain`,
			name: `${aspect} sentence aspect explain`,

			parentWayId: `tw-sentence-aspect/${aspect}-etimate`,

			promptTemplateId: ptIdTM,

			threadParams: {
				message: 'Provide 10 puncts that negatively affect this estimation',
			},
		},

		{
			name: `clarify ${aspect} errors`,
			parentWayId: `tw-sentence-aspect/${aspect}-explain`,

			promptTemplateId: ptIdTM,

			requestParams: [
				{ name: 'expainingPunctNumber', type: 'number', from: 1, to: 10, step: 1 },
			],

			threadParams: {
				message:
					'Clarify errors from punct №{{threadParams.expainingPunctNumber}} regarding the sentence under consideration',
			},
		},
	]),
];

const ttIdTS = 'tt-teacher/sentence';
export const THREAD_TEMPLATES_LIST = [
	{
		id: ttIdTS,
		name: 'Sentence examination',
		initialParams: {
			'maxTokens': 5,
			'+threadMessages': [{ user: 'system', text: "You're kind english teacher" }],
		},
		rootWayId: twIdSQ,
	},
];

import { GptRequestType } from '@prisma/client';
import { stripIndent } from 'common-tags';

const ttIdTS = 'tt-teacher/sentence';

export const THREAD_TEMPLATES_LIST = [
    {
        id: ttIdTS,
        name: 'Sentence examination',
        initialParams: {
            chars: 'kind, attentive and thoughtful',
            introMessages: []
        }
    }
];

const ptIdTM = '';
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
                {"role": "user", "content": "{{message.text}}"}
            ]
        }`,
    }
];

const twIntro = 'tw-ts/intro';
const twIdSQ = 'tw-ts/sentence-quality';

const ASPECTS = [
    'grammar accuracy',
    'conciseness and clear expression',
    'appropriate style',
    'contextual suitability',
];

export const THREAD_WAYS_LIST = [
    {
        id: twIntro,
        name: 'into',

        promptTemplateId: ptIdTM,
        autoExpand: true,
        expandParams: {
            message: { user: "system", text: "You're {chars} english teacher" }
        }
    },

    {
        id: twIdSQ,
        name: 'sequence quality',

        parentWayId: twIntro,

        promptTemplateId: ptIdTM,
        autoExpand: true,
        expandParams: {
            message: {
                user: "user",
                text: `Estimate sentence quality in range 0 - 1. Provide number only.\nSentence: '{threadParams.sentence}'`,
            },
        }
    },

    ...(ASPECTS.flatMap(aspect => ([
        {
            id: `tw-sentence-aspect/${aspect}`,
            name: `${aspect} sentence aspect`,

            parentWayId: twIdSQ,

            promptTemplateId: ptIdTM,

            threadParams: {
                sentenceAspect: aspect,
                message: 'Provide 10 puncts that negatively affect this estimation',
            }
        },

        {
            name: 'clarify errors',
            parentWayId: `tw-sentence-aspect/${aspect}`,

            promptTemplateId: ptIdTM,

            requestParams: [
                { name: "expainingPunctNumber", type: "number", "from": 1, "to": 10, "step": 1 },
            ],

            threadParams: {
                message: "Clarify errors from punct №{{threadParams.expainingPunctNumber}} regarding the sentence under consideration",
            }
        }
    ])))
];

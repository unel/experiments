import { MODELS_LIST } from '../src/lib/data/gpt-models-list.js';
import { TEMPLATES_LIST } from '../src/lib/data/prompt-templates.js';
import {
	THREAD_TEMPLATES_LIST,
	PROMPT_TEMPLATES_LIST,
	THREAD_WAYS_LIST,
} from '../src/lib/data/thread-templates.js';

export const DATA = [
	['GptModel', MODELS_LIST],
	['PromptTemplate', TEMPLATES_LIST.concat(PROMPT_TEMPLATES_LIST)],
	['ThreadTemplate', THREAD_TEMPLATES_LIST],
	['ThreadTemplateWay', THREAD_WAYS_LIST],
];

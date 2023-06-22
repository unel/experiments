import { GptRequestType } from '@prisma/client';

// source: https://platform.openai.com/docs/models/model-endpoint-compatibility
export const MODELS_LIST = [
    { id: 'text-davinci-edit-001', family: '', name: 'davinci / text-edit / 001', description: '', capabilities: [GptRequestType.EDIT]},
    { id: 'code-davinci-edit-001', family: '', name: 'davinci / code-edit / 001', description: '', capabilities: [GptRequestType.EDIT]},

    { id: 'text-ada-001', family: 'gpt-3', name: 'ada / text-completion / 001', description: 'simple, faster, cheaper', capabilities: [GptRequestType.COMPLETION] },
    { id: 'text-babbage-001', family: 'gpt-3', name: 'babbage / text-completion / 001', description: '', capabilities: [GptRequestType.COMPLETION] },
    { id: 'text-curie-001', family: 'gpt-3', name: 'curie / text-completion / 001', description: '', capabilities: [GptRequestType.COMPLETION] },
    { id: 'code-davinci-002', family: 'gpt-3.5', name: 'davinci / code-completion / 003', description: 'Optimized for code-completion tasks', capabilities: [GptRequestType.COMPLETION] },
    { id: 'text-davinci-002', family: 'gpt-3.5', name: 'davinci / text-completion / 002', description: 'trained with supervised fine-tuning', capabilities: [GptRequestType.COMPLETION] },
    { id: 'text-davinci-003', family: 'gpt-3.5', name: 'davinci / text-completion / 003', description: 'trained with reinforcement learning', capabilities: [GptRequestType.COMPLETION] },

    { id: 'gpt-3.5-turbo', family: 'gpt-3.5', name: 'gpt / chat-completion / 3.5-turbo', description: 'use this, it is cheaper', capabilities: [GptRequestType.CHAT_COMPLETION] },
    { id: 'gpt-4', family: 'gpt-4', name: 'gpt / chat-completion / 4', description: 'use this', capabilities: [], capabilities: [GptRequestType.CHAT_COMPLETION] },
].map((model, idx) => ({
    number: idx + 1,
    ...model,
}));

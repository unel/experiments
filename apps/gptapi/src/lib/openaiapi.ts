// see this docs:
// - examples: https://platform.openai.com/docs/guides/gpt/chat-completions-api
// - Nodejs client: https://github.com/openai/openai-node
// - HTTP-api: https://platform.openai.com/docs/api-reference

import { Configuration, OpenAIApi } from 'openai';

import { env } from '$env';

const config = new Configuration({
    apiKey: env.OPENAI_API_KEY,
    organization: env.OPENAI_API_ORGID,
});

const aiApi = new OpenAIApi(config);



export { aiApi }

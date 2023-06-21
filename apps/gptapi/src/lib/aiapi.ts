// see this docs:
// - examples: https://platform.openai.com/docs/guides/gpt/chat-completions-api
// - Nodejs client: https://github.com/openai/openai-node
// - HTTP-api: https://platform.openai.com/docs/api-reference

import { Configuration, OpenAIApi } from 'openai';

import { OPENAI_API_KEY, OPENAI_API_ORGID} from '$env/static/private';


const config = new Configuration({
    apiKey: OPENAI_API_KEY,
    organization: OPENAI_API_ORGID,
});

const aiApi = new OpenAIApi(config);


export { aiApi }

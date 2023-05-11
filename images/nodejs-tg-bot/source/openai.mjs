import { ENV } from './env.mjs';
import { Configuration, OpenAIApi } from 'openai';

const config = new Configuration({
    apiKey: ENV.OPENAI_API_KEY,
    organization: ENV.OPENAI_API_ORGID,
});

const aiApi = new OpenAIApi(config);


export { aiApi }

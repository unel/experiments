import { json } from '@sveltejs/kit';

import { OPENAI_API_KEY, OPENAI_API_ORGID } from '$env/static/private';
import { makeProxyFunction, makeUrlGenerator } from '$lib/proxy';

const proxyFunction = makeProxyFunction({
	makeUrl: makeUrlGenerator({ baseUrl: 'https://api.openai.com/v1', pathParam: 'path' }),
	updateRequestParams: requestParams => {
		requestParams.headers.append('Authorization', `Bearer ${OPENAI_API_KEY}`);
		requestParams.headers.append('OpenAI-Organization', OPENAI_API_ORGID);
		return requestParams;
	},
});

export async function GET(...args) {
	const response = await proxyFunction(...args);

	return json(await response.json());
}

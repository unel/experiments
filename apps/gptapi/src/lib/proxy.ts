import type { RequestEvent, RequestHandler } from '@sveltejs/kit';

type RequestMethod = 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE'
type FetchFn = typeof fetch;
type FetchParams = Parameters<FetchFn>;
type FetchOptions = FetchParams[1];

type MakeProxyFunctionParams = {
    makeUrl: (event: RequestEvent) => string;
    updateRequestParams?: (requestParams: FetchOptions) => FetchOptions;
};

export function makeProxyFunction({ makeUrl, updateRequestParams }: MakeProxyFunctionParams): RequestHandler {
    return async function(event: RequestEvent) {
        const requestUrl = makeUrl(event);

        let requestParams: FetchOptions = {
            method: event.request.method,
        };

        if (event.request.bodyUsed) {
            requestParams.body = await event.request.text();
        }

        if (event.request.headers) {
            const copyHeaders = ['Accept', 'Content-Type', 'X-request-id'];
            requestParams.headers = new Headers();
            for (const headerName of copyHeaders) {
                if (event.request.headers.has(headerName)) {
                    requestParams.headers.append(headerName, event.request.headers.get(headerName));
                }
            }
        }

        if (updateRequestParams) {
            requestParams = updateRequestParams(requestParams);
        }

        console.log('fetching', requestUrl, requestParams);
        return event.fetch(requestUrl, requestParams);
    };
}

export function makeUrlGenerator({ baseUrl, pathParam }: Record<string, string>): (event: RequestEvent) => string {
    return function urlGenerator (event: RequestEvent) {
        return `${baseUrl}/${event.params[pathParam]}?${new URLSearchParams(event.request.query)}`;
    }
}

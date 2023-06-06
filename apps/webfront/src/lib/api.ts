import { build } from "vite";

const BASE_URL = 'https://experiments.unl'

type FetchFN = typeof fetch;
type FetchArgs = Parameters<FetchFN>;

function buildUrl(path: string, query = {}): string {
    const searchParams = new URLSearchParams(query);
    return `${BASE_URL}${path}${searchParams.toString()}`;
}

async function fetchJSON(fetchFn: FetchFN, ...args: FetchArgs) {
    const response = await fetchFn(...args);

    return response.json();
}

const api = {
    loadChats: async (fetchFn: typeof fetch, params: Record<string, string> = {}) => {
        return fetchJSON(fetchFn, buildUrl('/api/chat/v1/chats', params));
    },
}


export { api };

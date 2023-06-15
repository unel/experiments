const BASE_URL = 'https://local.experiments.unl';
const BASE_API_URL = '/api/chat/v1';

type FetchFN = typeof fetch;
type FetchArgs = Parameters<FetchFN>;

type ScalarRecord = Record<string, number | string | boolean>;

type ServerChat = {
    id: string,
    userId: string,
    createdAt: string,
    title: string,
    messages?: Array<ChatMessage>,
};

type ServerChatMessage = {
    id: string,
    chatId: string,
    userId: string,
    createdAt: string,
    language: string,
    text: string,
};

export type Chat = ServerChat & {
    createdAt: Date;
}

export type ChatMessage = ServerChatMessage & {
    createdAt: Date;
}

function buildUrl(methodPath: string, query = {}): string {
    const searchParams = new URLSearchParams(query);
    return `${BASE_URL}${BASE_API_URL}${methodPath}?${searchParams.toString()}`;
}

async function fetchJSON(fetchFn: FetchFN, ...args: FetchArgs) {
    try {
        const response = await fetchFn(...args);
        const json = await response.json();
        return json;

    } catch (e) {
        console.error('failed to fetch', e);
        throw ({
            error: e
        })
    }

}

const defaultHeaders = {
    'Content-Type': 'application/json',
};

function mapChat(chat: ServerChat): Chat {
    if (chat.createdAt) {
        chat.createdAt = new Date(chat.createdAt);
    }

    if (chat.messages) {
        chat.messages = chat.messages.map(message => mapChatMessage(message));
    }

    return chat;
}

function mapChatMessage(message: ServerChatMessage): ChatMessage {
    if (message.createdAt) {
        message.createdAt = new Date(message.createdAt);
    }

    return message;
}

const api = {
    loadChats: async (fetchFn: FetchFN, params: ScalarRecord = {}): Promise<Array<Chat>> => {
        const sChats = await fetchJSON(fetchFn, buildUrl('/chats', params));

        return sChats.map(chat => mapChat(chat));
    },

    createChat: async (fetchFn: FetchFN, { userId, title }): Promise<Chat> => {
        const sChat = await fetchJSON(fetchFn, buildUrl('/chats'), {
            method: 'POST',
            headers: defaultHeaders,
            body: JSON.stringify({
                title,
                userId,
            }),
        });

        return mapChat(sChat);
    },

    createMessage: async (fetchFn: FetchFN, { userId, language, chatId, text }): Promise<ChatMessage> => {
        const sMessage = await fetchJSON(fetchFn, buildUrl(`/chats/${chatId}/messages`), {
            method: 'POST',
            headers: defaultHeaders,
            body: JSON.stringify({
                userId,
                language,
                text,
            })
        });

        return mapChatMessage(sMessage);
    },

    removeMessage: async (fetchFn: FetchFN, { chatId, messageId }): Promise<{ ok: boolean }> => {
        return fetchJSON(fetchFn, buildUrl(`/chats/${chatId}/messages/${messageId}`), {
            method: 'DELETE',
            headers: defaultHeaders,
        });
    }
}


export { api };

import { api } from '$lib/api';


export async function load({ fetch }) {
    const chats = await api.loadChats(fetch, { withMessages: true });

    return {
        chats,
    }
}

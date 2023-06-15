import { api } from '$lib/api';


export async function load({ fetch, locals }) {
    const chats = await api.loadChats(fetch, { withMessages: true, userId: locals.user.id });

    return {
        chats,
    };
}

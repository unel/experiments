export function createChatControls({ api, fetchFn, chats, user, notifyUpdate }) {
	async function removeChat(id: string) {
		const idx = (chats || []).findIndex((chat) => chat.id === id);
		const chat = idx !== -1 ? chats[idx] : null;

		if (!chat) {
			return;
		}

		const result = await api.removeChat(fetchFn, { chatId: chat.id });
		if (!result?.ok) {
			return;
		}

		chats.splice(idx, 1);
		notifyUpdate('removed', { id, idx });
	}

	async function createChat() {
		const result = await api.createChat(fetchFn, {
			title: 'new chat',
			userId: user?.id || '-'
		});

		chats.unshift({
			...result,
			messages: []
		});

		notifyUpdate('created', { id: result.id, idx: 0 });
	}

	async function updateChat(chatId, updates = {}) {
		if (!chatId) {
			return;
		}

		await api.updateChat(fetchFn, { chatId, ...updates });
		notifyUpdate('updated', { id: chatId });
	}

	return {
		createChat,
		updateChat,
		removeChat
	};
}

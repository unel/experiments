export function createChatMessagesControls({ getActiveChat, api, fetchFn, user, notifyUpdate }) {
	async function addNewMessage(
		mode: CreatigMode,
		{ text = ' ', language = 'en', userId = user?.id || '' } = {}
	) {
		if (mode === 'default') {
			return createMessage({ language, text, userId });
		}

		if (mode === 'aireply') {
			const systemUsers = new Set(['system', 'assistant', 'user']);

			const messages = (getActiveChat().messages || []).map((chatMessage) => ({
				role: systemUsers.has(chatMessage.userId) ? chatMessage.userId : 'user',
				content: chatMessage.text
			}));

			const reply = await api.getChatReply(fetchFn, { messages });
			return createMessage({ language, text: reply, userId: 'assistant' });
		}
	}

	async function createMessage({
		language,
		text,
		userId = user?.id || ''
	}: Record<string, string>) {
		const activeChat = getActiveChat();
		if (!activeChat?.id || !userId) {
			return;
		}

		const result = await api.createMessage(fetchFn, {
			chatId: activeChat.id,
			userId,
			language,
			text
		});

		activeChat.messages = activeChat.messages || [];
		activeChat.messages.push(result);

		notifyUpdate('created', { id: result.id });

		return result;
	}

	async function saveChatMessage(chatMessage: ChatMessage) {
		const { chatId, text, id, userId } = chatMessage || {};

		if (!id || !chatId) {
			return;
		}

		await api.updateMessage(fetchFn, { messageId: id, chatId, text, userId });
		notifyUpdate('updated', { id: chatMessage.id });
	}

	async function removeMessage(id: string) {
		const activeChat = getActiveChat();

		if (!activeChat?.messages) {
			return;
		}

		const idx = activeChat.messages.findIndex((message) => message.id === id);
		if (idx === -1) {
			return;
		}

		const result = await api.removeMessage(fetchFn, {
			chatId: activeChat.id,
			messageId: id
		});

		if (!result.ok) {
			return;
		}

		activeChat.messages.splice(idx, 1);
		notifyUpdate('removed', { id, idx });
	}

	return {
		addNewMessage,
		removeMessage,
		saveChatMessage
	};
}

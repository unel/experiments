import { findIndexById } from '$lib/collections';

export function createChatControls({ api, fetchFn, chats, user, notifyUpdate }) {
	const DEFAULT_SETTINGS = Object.freeze({
		language: 'en',
		createMode: 'aireply',
		speakMode: 'no',
		voiceId: 'bWljcm9zb2Z0Z3V5b25saW5lKG5hdHVyYWwpLWVuZ2xpc2godW5pdGVkc3RhdGVzKQ=='
	});
	function genChatKey(chatId, suffix = 'settings') {
		return `e.chats.${chatId}.${suffix}`;
	}

	function loadChatSettings(id) {
		const key = genChatKey(id, 'settings');

		try {
			const data = localStorage.getItem(key);

			return data ? JSON.parse(data) : DEFAULT_SETTINGS;
		} catch (e) {
			return DEFAULT_SETTINGS;
		}
	}

	function writeChatSettings(id: string, settings = {}) {
		const key = genChatKey(id, 'settings');

		localStorage.setItem(key, JSON.stringify(settings));
	}

	function updateChatSettings(id: string, updates = {}) {
		const chatSettings = { ...loadChatSettings(id) };

		const newChatSettings = Object.assign(chatSettings, updates);

		writeChatSettings(id, newChatSettings);
	}

	async function removeChat(id: string) {
		const idx = findIndexById(chats || [], id);
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

		chats.unshift(result);

		notifyUpdate('created', { id: result.id, idx: 0 });
		return result;
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
		removeChat,

		loadChatSettings,
		updateChatSettings
	};
}

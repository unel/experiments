export function createNavigationControls({ getPageUrl, goto }) {
	function navigateToChat(chatId: string) {
		const url = getPageUrl();

		goto(`${url.origin}${url.pathname}#chats:${chatId}`);
	}

	function navigateToDefaultState() {
		goto(`${url.origin}${url.pathname}`);
	}

	return { navigateToChat, navigateToDefaultState };
}

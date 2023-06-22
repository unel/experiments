const TABLE_NAME_BY_SLUG = {
	gptmodel: 'gptModel',
	gptrequest: 'gptRequest',
	gptresponse: 'gptResponse',
	prompttemplate: 'promptTemplate',
	threadtemplate: 'threadTemplate',
	threadtemplateway: 'threadTemplateWay',
	thread: 'thread',
	threadnode: 'threadNode',
};

export function getTableName(params): string | undefined {
	return TABLE_NAME_BY_SLUG[String(params.className || '').toLowerCase()];
}

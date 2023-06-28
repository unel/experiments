<script lang="ts">
	import { page } from '$app/stores';

	const models = [
		'GptModel',

		'GptRequest',
		'GptResponse',

		'PromptTemplate',

		'ThreadTemplate',
		'ThreadTemplateWay',

		'Thread',
		'ThreadNode',
	];
</script>

{#each models as modelName}
	<ul>
		<li>
			<a href="{$page.url}/{String(modelName).toLowerCase()}">{modelName}</a>
		</li>
	</ul>
{/each}

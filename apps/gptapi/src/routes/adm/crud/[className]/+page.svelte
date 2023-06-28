<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';

	export let data;

	const fields = Object.keys(data.entities[0]);

	async function removeEntity(id: string) {
		await fetch(`${data.basePath}/v1/crud/${data.entityName}/${id}`, { method: 'DELETE' });
		await invalidateAll();
	}
</script>

<main>
	<head>
		<h1>{data.entityName}</h1>
	</head>

	<table class="table">
		<thead>
			<tr>
				{#each fields as fieldName}<th>{fieldName}</th>{/each}

				<th> <!-- controls column --> </th>
			</tr>
		</thead>

		<tbody>
			{#each data.entities as entity}
				<tr>
					{#each fields as fieldName}
						<td>
							{entity[fieldName]}
						</td>
					{/each}

					<td class="column-controls">
						<a href="{$page.url}/{entity.id}" title="{data.entityName}/{entity.id}">
							[lookup]
						</a>

						<button on:click={() => removeEntity(entity.id)}> rm </button>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</main>

<style>
	.table {
		border: 1px solid silver;
		border-collapse: collapse;
		width: 100%;
		max-width: 100%;
	}

	.table th {
		box-sizing: border-box;
		padding: 16px 8px;
		border: 1px solid silver;
	}

	.table td {
		border: 1px solid silver;
		box-sizing: border-box;
		padding: 16px 8px;
	}

	.table td.column-controls {
		white-space: nowrap;
	}
</style>

import { json } from '@sveltejs/kit';

import { execTemplateCommand } from '$lib/prompts';

export async function GET({ url, params }) {
    const payload = Object.fromEntries(url.searchParams.entries());

    const data = await execTemplateCommand(params.templateId, payload);

    return json(data);
}


export async function POST({ params, request }) {
    const payload = await request.json();
    const data = await execTemplateCommand(params.templateId, payload);

    return json(data);
}

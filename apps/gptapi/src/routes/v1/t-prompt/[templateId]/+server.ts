import { json } from '@sveltejs/kit';

import { execTemplateCommand, formTemplateCommand, acquireTemplate } from '$lib/prompts';

export async function GET({ url, params }) {
    const payload = Object.fromEntries(url.searchParams.entries());
    const template = await acquireTemplate(params.templateId);
    const data = await formTemplateCommand(template, payload);

    return json({
        template,
        ...data,
    });
}


export async function POST({ params, request }) {
    const payload = await request.json();
    const data = await execTemplateCommand(params.templateId, payload);

    return json(data);
}

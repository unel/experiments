import { json } from '@sveltejs/kit';

export function GET() {
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

    return json({
        models: models.map(modelName => ({
            name: modelName,
            url: `https://local.experiments.unl/api/gpt/v1/crud/${modelName.toLowerCase()}`
        }))
    });
}

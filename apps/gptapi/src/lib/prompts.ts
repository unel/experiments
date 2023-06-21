import { type PromptTemplate, GptRequestType } from '@prisma/client'

import { aiApi } from '$lib/aiapi';
import { db } from '$lib/db';
import { hash } from '$lib/collections-utils';


type TemplateValue = number | boolean | string | Array<TemplateValue>;


const apiMethodNamesByRequestType = {
    [GptRequestType.COMPLETION]: 'createCompletion',
    [GptRequestType.CHAT_COMPLETION]: 'createChatCompletion',
    [GptRequestType.EDIT]: 'createEdit',
};

const requestTypeByApiMethodName = {
    createCompletion: GptRequestType.COMPLETION,
    createChatCompletion: GptRequestType.CHAT_COMPLETION,
    createEdit: GptRequestType.EDIT,
};

function formAiPromptFromTemplate(template: PromptTemplate, data: Record<string, TemplateValue> = {}) {
    let methodName = apiMethodNamesByRequestType[template.requestType];

    const methodParams = {
        ...fillTemplates(template.requestParamsTemplate, data),
        model: template.modelId,
    };

    return {
        methodName,
        methodParams,
    };
}

function fillTemplate(template: TemplateValue , data: Record<string, TemplateValue>): TemplateValue {
    if (typeof template !== 'string') {
        return template;
    }

    const rawStr = template.replace(/{(\w+)}/g, (m, varName) => {
        return data[varName];
    });

    try {
        return JSON.parse(rawStr);
    } catch (e) {
        return rawStr;
    }
}

function fillTemplates(templates: Record<string, string>, data: Record<string, TemplateValue>) {
    return Object.fromEntries(
        Object.entries(templates).map(([name, value]) => {
            return [name, fillTemplate(value, data)];
        }),
    );
}

async function formCheckCommand(prompt: string): string {
    const template = await db.promptTemplate.findUniqueOrThrow({
        where: {
            id: 'cmd-check'
        }
    });

    const templateData = {
        commands: ['repeat', 'explain'],
        text: prompt,
    };

    const aiApi = formAiPromptFromTemplate(template, templateData);
    const templateInfo = { id: template.id, data: templateData };

    return { aiApi, templateInfo };
}

async function formTemplateCommand(templateId, payload) {
    const template = await db.promptTemplate.findUniqueOrThrow({where: { id: templateId }});
    const templateData = payload;

    return {
        aiApi: formAiPromptFromTemplate(template, templateData),
        templateInfo: {
            id: templateId,
            data: templateData
        },
    };
}

export async function execCommand(cmd) {
    console.log('execCommand', cmd);
    const cmdHash = hash(cmd.aiApi);
    console.log('execCommand/hash', cmdHash);
    const cachedRequest = await db.gptRequest.findUnique({
        where: {
            id: cmdHash
        },
        include: {
            response: true,
        }
    });
    console.log('execCommand/cache', cachedRequest);

    if (cachedRequest) {
        console.log('execCommand/cache exists', cachedRequest.response);
        return cachedRequest.response.payload;
    }

    console.log('execCommand/call api..');
    const { methodName, methodParams } = cmd.aiApi;
    const response = await aiApi[methodName].call(aiApi, methodParams);
    console.log('execCommand/api result', response.data);

    try {
        console.log('execCommand/updating cache..');
        const newCache = await db.gptRequest.create({
            data: {
                id: cmdHash,
                model: { connect: { id: methodParams.model } },
                type: requestTypeByApiMethodName[methodName],
                payload: cmd,
                response: {
                    create: {
                        payload: response.data,
                    }
                }
            }
        });
    } catch (e) {
        console.error('execCommand/caching error', e);
    }

    return response.data;
}


export async function execTemplateCommand(templateId, payload) {
    const cmd = await formTemplateCommand(templateId, payload);
    const result = await execCommand(cmd);

    return {
        cmd,
        result,
    };
}

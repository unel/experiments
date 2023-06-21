import bcrypt from 'bcryptjs';
import { PrismaClient, GptRequestType } from '@prisma/client'
import { stripIndent } from 'common-tags';

const prisma = new PrismaClient();

async function main() {
  // source: https://platform.openai.com/docs/models/model-endpoint-compatibility

  const gptModels = [
    { id: 'text-davinci-edit-001', family: '', name: 'davinci / text-edit / 001', description: '', capabilities: [GptRequestType.EDIT]},
    { id: 'code-davinci-edit-001', family: '', name: 'davinci / code-edit / 001', description: '', capabilities: [GptRequestType.EDIT]},

    { id: 'text-ada-001', family: 'gpt-3', name: 'ada / text-completion / 001', description: 'simple, faster, cheaper', capabilities: [GptRequestType.COMPLETION] },
    { id: 'text-babbage-001', family: 'gpt-3', name: 'babbage / text-completion / 001', description: '', capabilities: [GptRequestType.COMPLETION] },
    { id: 'text-curie-001', family: 'gpt-3', name: 'curie / text-completion / 001', description: '', capabilities: [GptRequestType.COMPLETION] },
    { id: 'code-davinci-002', family: 'gpt-3.5', name: 'davinci / code-completion / 003', description: 'Optimized for code-completion tasks', capabilities: [GptRequestType.COMPLETION] },
    { id: 'text-davinci-002', family: 'gpt-3.5', name: 'davinci / text-completion / 002', description: 'trained with supervised fine-tuning', capabilities: [GptRequestType.COMPLETION] },
    { id: 'text-davinci-003', family: 'gpt-3.5', name: 'davinci / text-completion / 003', description: 'trained with reinforcement learning', capabilities: [GptRequestType.COMPLETION] },

    { id: 'gpt-3.5-turbo', family: 'gpt-3.5', name: 'gpt / chat-completion / 3.5-turbo', description: 'use this, it is cheaper', capabilities: [GptRequestType.CHAT_COMPLETION] },
    { id: 'gpt-4', family: 'gpt-4', name: 'gpt / chat-completion / 4', description: 'use this', capabilities: [], capabilities: [GptRequestType.CHAT_COMPLETION] },
  ];

  await Promise.all(gptModels.map((model, number) => {
    const { id, ...modelInfo } = model;

    return prisma.gptModel.upsert({
      where: { id },
      update: { ...modelInfo, number },
      create: { ...model, number },
    });
  }));


  const promptTemplates = [
    {
      id: 'cmd-check',
      name: 'check command',
      model: {connect: {id: 'text-davinci-003'}},

      requestType: GptRequestType.COMPLETION,
      requestParamsTemplate: {
        max_tokens: 3,
        prompt: stripIndent`
          Is sentence '{text}' one of a commands?
          Name this command, or just say 'no'.
          Commands:{commands}

          Command:
        `
      }
    },

    {
      id: 'q',
      name: 'simple question',
      model: {connect: {id: 'gpt-3.5-turbo'}},

      requestType: GptRequestType.CHAT_COMPLETION,
      requestParamsTemplate: {
        max_tokens: 200,
        messages: `[
          {"role": "system", "content": "You are a supportive, but laconic assistant, not an ai."},
          {"role": "user", "content": "{text}"}
        ]`
      }
    },

    {
      id: 'gr-fix',
      name: 'fix grammar',
      model: {connect: {id: 'text-davinci-edit-001'}},

      requestType: GptRequestType.EDIT,
      requestParamsTemplate: {
        instruction: "Fix all grammar and spelling mistakes",
        input: "{text}"
      }
    }
  ];

  await Promise.all(promptTemplates.map((promptTemplate) => {
    const { id, ...info } = promptTemplate;

    return prisma.promptTemplate.upsert({
      where: { id },
      update: info,
      create: promptTemplate,
      include: {
        model: true,
      }
    });
  }));
}


main()
  .then(async () => {
    console.log('synced. disconnecting..');
    await prisma.$disconnect();
    console.log('done.');
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })

import { PrismaClient } from '@prisma/client'

import { MODELS_LIST } from '../src/lib/data/gpt-models-list.js';
import { TEMPLATES_LIST } from '../src/lib/data/prompt-templates.js';
import { THREAD_TEMPLATES_LIST, PROMPT_TEMPLATES_LIST, THREAD_WAYS_LIST } from '../src/lib/data/thread-templates.js';

const prisma = new PrismaClient();

async function main() {
  const DATA = [
    ['GptModel', MODELS_LIST],
    ['PromptTemplate', TEMPLATES_LIST.concat(PROMPT_TEMPLATES_LIST)],
    ['ThreadTemplate', THREAD_TEMPLATES_LIST],
    ['ThreadTemplateWay', THREAD_WAYS_LIST],
  ];

  await Promise.all(
    DATA.flatMap(
      ([className, items]) => items.map(
        data => ensureData(className, data)
      )
    )
  );
}


function lcFirst(str) {
  return str[0].toLowerCase() + str.slice(1);
}

async function ensureData(className, data) {
  const createData = structuredClone(data);

  for (const [key, value] of Object.entries(createData)) {
    if (key.endsWith('id') && key.length > 2) {
      const newKey = key.slice(0, -2);
      const newValue = { conntect: { id: value }};

      createData[newKey] = newValue;
      delete createData[key];
    }
  }

  const { id, ...updateData } = createData;

  let query = id ? { id } : { name: createData.name };
  const entityName = lcFirst(className);

  // console.log('ensure', className, data);

  return prisma[entityName].upsert({
    where: query,
    update: updateData,
    create: createData,
  });
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

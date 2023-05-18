import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client'


async function main() {
  const id = process.env.USER_ID;
  const password = process.env.USER_PASSWORD;
  console.log('trying to create user', { id, password })

  if (!id || !password) {
    throw new Error('no data');
  }

  const prisma = new PrismaClient();
  const me = await prisma.user.upsert({
    where: { id: 'unel' },
    update: {},
    create: {
      id,
      password: await bcrypt.hash(password, 10)
    },
  })

  console.log({ me })
}


main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

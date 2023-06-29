import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	const id = process.env.USER_ID;
	const password = process.env.USER_PASSWORD;

	if (!id || !password) {
		throw new Error('no env data (USER_ID, USER_PASSWORD)');
	}

	const me = await prisma.user.upsert({
		where: { id: 'unel' },
		update: {},
		create: {
			id,
			password: await bcrypt.hash(password, 10)
		}
	});
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});

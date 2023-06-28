import { PrismaClient, Prisma } from '@prisma/client';

const db = new PrismaClient();

const Error = {
	KnownRequestError: Prisma.PrismaClientKnownRequestError,
};

export { db, Error };

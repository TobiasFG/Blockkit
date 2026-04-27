import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../generated/prisma/client';
import { env } from '$env/dynamic/private';

const DATABASE_URL = env.DATABASE_URL;

if (!DATABASE_URL) {
	throw new Error(
		'Missing DATABASE_URL. Create a local `.env` (gitignored) with values from `supabase status`.'
	);
}

const globalForPrisma = globalThis as unknown as {
	prisma?: PrismaClient;
};

const adapter = new PrismaPg({ connectionString: DATABASE_URL });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (env.NODE_ENV !== 'production') {
	globalForPrisma.prisma = prisma;
}

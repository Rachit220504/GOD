import { PrismaClient, PlantStage, AchievementType, RewardType } from '@prisma/client';
import { logger } from './logger';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Prevent multiple Prisma instances in dev (hot-reload)
const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    log: ['warn', 'error'],
    errorFormat: 'colorless',
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('✅ PostgreSQL connected via Prisma');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}

/**
 * Emergency: Reset all connections
 */
export async function resetConnections(): Promise<void> {
  await prisma.$disconnect();
  await prisma.$connect();
  logger.info('Database connections reset');
}

export { prisma, PlantStage, AchievementType, RewardType };

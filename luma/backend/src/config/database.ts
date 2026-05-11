import { PrismaClient, PlantStage, AchievementType, RewardType, Prisma } from '@prisma/client';
import { logger } from './logger';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// ─── Retry Config ─────────────────────────────────────────────────────────────
// Neon serverless PostgreSQL closes idle connections aggressively.
// These error codes indicate a lost/reset TCP connection that is safe to retry.
const RETRYABLE_ERROR_CODES = new Set([
  'P1001', // Can't reach database server
  'P1008', // Operations timed out
  'P1017', // Server has closed the connection
  'P2024', // Timed out fetching a new connection from the connection pool
]);

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 200;

/**
 * Sleep helper for exponential backoff.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Determine whether a Prisma error is a transient connectivity error
 * that is safe to retry (not a data/logic error).
 */
function isRetryableError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return RETRYABLE_ERROR_CODES.has(err.code);
  }
  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    const msg = err.message.toLowerCase();
    // OS error 10054 = ConnectionReset on Windows (Neon closing idle socket)
    return msg.includes('connection') || msg.includes('10054') || msg.includes('server has closed');
  }
  return false;
}

// ─── Prisma Client (singleton) ────────────────────────────────────────────────

function buildPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: ['warn', 'error'],
    errorFormat: 'colorless',
    datasources: {
      db: {
        // Append connection-pool tuning params that work with Neon's pgBouncer.
        // DATABASE_URL should already point to the pooler endpoint (:6543).
        // These params prevent long-idle connections from being reused after
        // Neon has already killed them on the server side.
        url:
          process.env['DATABASE_URL'] +
          (process.env['DATABASE_URL']?.includes('?') ? '&' : '?') +
          'connect_timeout=30&pool_timeout=30&connection_limit=5&socket_timeout=30',
      },
    },
  });

  // ── Retry Middleware ─────────────────────────────────────────────────────────
  // Transparently retries any query that fails due to a dropped connection.
  // Uses exponential backoff: 200ms, 400ms, 800ms.
  client.$use(async (params, next) => {
    let attempt = 0;
    while (true) {
      try {
        return await next(params);
      } catch (err: unknown) {
        attempt++;
        if (attempt >= MAX_RETRIES || !isRetryableError(err)) {
          throw err;
        }
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
        logger.warn(
          `[Prisma] Connection error on attempt ${attempt}/${MAX_RETRIES} for ` +
          `${params.model}.${params.action} — retrying in ${delay}ms…`,
        );
        await sleep(delay);
        // Force Prisma to re-establish its connection pool before retrying.
        try { await client.$disconnect(); } catch { /* ignore */ }
        try { await client.$connect(); } catch { /* ignore */ }
      }
    }
  });

  return client;
}

// Prevent multiple Prisma instances in dev (hot-reload)
const prisma: PrismaClient =
  global.__prisma ?? buildPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

// ─── Lifecycle Helpers ────────────────────────────────────────────────────────

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
 * Emergency: Reset all connections (e.g. after a fatal connectivity event).
 */
export async function resetConnections(): Promise<void> {
  await prisma.$disconnect();
  await prisma.$connect();
  logger.info('Database connections reset');
}

export { prisma, PlantStage, AchievementType, RewardType };

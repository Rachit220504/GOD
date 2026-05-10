import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import os from 'os';

import { connectDatabase, disconnectDatabase } from './config/database';
import { logger } from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

import authRoutes from './modules/auth/auth.routes';
import profileRoutes from './modules/profile/profile.routes';
import contentRoutes from './modules/content/content.routes';
import progressRoutes from './modules/progress/progress.routes';
import { analyticsRouter } from './modules/analytics/analytics.routes';
import phonicsRoutes from './modules/phonics/phonics.routes';
import { gamificationRoutes } from './routes/gamification.routes';
import { phonicsService } from './modules/phonics/phonics.service';
import { gamificationService } from './modules/gamification/gamification.service';

// ─── App Setup ────────────────────────────────────────────────────────────────

const app = express();
const PORT = parseInt(process.env['PORT'] ?? '4000', 10);
const API_PREFIX = process.env['API_PREFIX'] ?? '/api';

// ─── Security & Parsing Middleware ────────────────────────────────────────────

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

// CORS - Allow all origins for mobile development
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Compression
app.use(compression());

// JSON body parsing (max 10kb to prevent payload attacks)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// HTTP logging
app.use(
  morgan('combined', {
    stream: { write: (msg: string) => logger.info(msg.trim()) },
  }),
);

// Debug: Log all API requests for troubleshooting
app.use((req, res, next) => {
  logger.debug(`→ ${req.method} ${req.path} - User: ${req.user?.id ?? 'none'}`);
  next();
});

// ─── Rate Limiting ────────────────────────────────────────────────────────────

const globalLimiter = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] ?? '900000', 10), // 15 min
  max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] ?? '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many requests. Please wait a moment and try again.',
      code: 429,
    },
  },
});

// Stricter limit on AI generation (avoid abuse)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,     // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'AI generation rate limit reached. Please wait 1 minute.',
      code: 429,
    },
  },
});

app.use(globalLimiter);
app.use(`${API_PREFIX}/content/generate-story`, aiLimiter);
app.use(`${API_PREFIX}/content/syllabify`, aiLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get(`${API_PREFIX}/health`, async (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      service: 'LUMA API',
      version: '1.0.0',
      environment: process.env['NODE_ENV'] ?? 'development',
      timestamp: new Date().toISOString(),
    },
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/profile`, profileRoutes);
app.use(`${API_PREFIX}/content`, contentRoutes);
app.use(`${API_PREFIX}/progress`, progressRoutes);
app.use(`${API_PREFIX}/analytics`, analyticsRouter);
app.use(`${API_PREFIX}/phonics`, phonicsRoutes);
app.use(`${API_PREFIX}/gamification`, gamificationRoutes);

// ─── 404 & Error Handling ─────────────────────────────────────────────────────

app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────

async function bootstrap(): Promise<void> {
  await connectDatabase();

  // Auto-seed phonics lessons on startup
  try {
    await phonicsService.seedLessons();
  } catch (err) {
    logger.warn('Auto-seed failed:', err);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    // Get network interfaces for mobile device connection
    const interfaces = os.networkInterfaces();
    const addresses: string[] = [];
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] ?? []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          addresses.push(iface.address);
        }
      }
    }

    logger.info(`
╔══════════════════════════════════════════════════════╗
║           LUMA API — A Brighter Way to Read          ║
╠══════════════════════════════════════════════════════╣
║  Local   : http://localhost:${PORT}                     ║
║  Network : ${addresses.map(a => `http://${a}:${PORT}`).join(', ')}║
║  Mode    : ${(process.env['NODE_ENV'] ?? 'development').padEnd(42)}║
║  Prefix  : ${API_PREFIX.padEnd(43)}║
╚══════════════════════════════════════════════════════╝
    `.trim());
  });

  // ─── Graceful Shutdown ──────────────────────────────────────────────────────

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await disconnectDatabase();
      logger.info('Server closed. Goodbye.');
      process.exit(0);
    });

    // Force exit if server doesn't close in 10s
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Promise Rejection:', reason);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    void shutdown('uncaughtException');
  });
}

bootstrap().catch((err: unknown) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});

export default app;

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

const createPrismaClient = () => {
  // Reuse pool if it exists, otherwise create with optimized pool size
  if (!globalForPrisma.pool) {
    // Optimized connection pool settings for Supabase
    const isDevelopment = process.env.NODE_ENV !== 'production';

    globalForPrisma.pool = new Pool({
      connectionString: process.env.DATABASE_URL,

      // Connection pool sizing - CRITICAL for serverless (Vercel)
      // Each serverless function gets its own pool, so keep it minimal
      max: isDevelopment ? 5 : 1, // Dev: 5, Prod (serverless): 1 connection per function
      min: isDevelopment ? 2 : 0, // Serverless: no idle connections

      // Timing settings
      idleTimeoutMillis: 10000, // Close idle connections quickly (10s)
      connectionTimeoutMillis: 10000, // Timeout if can't connect in 10s

      // Query timeout - prevent long-running queries from hanging
      statement_timeout: 30000, // 30 seconds max query time

      // Error handling
      allowExitOnIdle: !isDevelopment, // Allow serverless functions to exit when idle
    });

    // Log pool errors
    globalForPrisma.pool.on('error', (err) => {
      console.error('Unexpected pool error:', err);
    });

    // Optional: Log pool metrics in development
    if (isDevelopment) {
      globalForPrisma.pool.on('connect', () => {
        console.log('New database connection established');
      });
      globalForPrisma.pool.on('remove', () => {
        console.log('Database connection removed from pool');
      });
    }
  }

  const adapter = new PrismaPg(globalForPrisma.pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

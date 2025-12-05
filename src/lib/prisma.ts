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
      
      // Connection pool sizing
      max: isDevelopment ? 5 : 10, // Dev: 5 connections, Prod: 10 connections
      min: 2, // Maintain minimum 2 idle connections
      
      // Timing settings
      idleTimeoutMillis: 30000, // Close idle connections after 30s
      connectionTimeoutMillis: 10000, // Timeout if can't connect in 10s
      
      // Error handling
      allowExitOnIdle: false, // Keep process alive
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

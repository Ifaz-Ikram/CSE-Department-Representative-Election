import path from 'node:path'
import { defineConfig } from 'prisma/config'
import { config } from 'dotenv'

// Load environment variables
config()

// Auto-detect if we're running migrations/push (use DIRECT_URL) or normal operations (use DATABASE_URL)
const isMigrationCommand = process.argv.some(arg =>
    arg.includes('migrate') || arg.includes('db') || arg.includes('push')
);
const databaseUrl = isMigrationCommand ? process.env.DIRECT_URL : process.env.DATABASE_URL;

export default defineConfig({
    earlyAccess: true,
    schema: path.join(__dirname, 'prisma', 'schema.prisma'),
    datasource: {
        url: databaseUrl!,
    },
    migrate: {
        adapter: async () => {
            const { PrismaPg } = await import('@prisma/adapter-pg')
            const { Pool } = await import('pg')
            const pool = new Pool({ connectionString: process.env.DIRECT_URL })
            return new PrismaPg(pool)
        },
    },
})

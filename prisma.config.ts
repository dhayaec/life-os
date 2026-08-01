import { defineConfig, env } from 'prisma/config';

// Prisma 7 no longer auto-loads .env; load it explicitly (Node 20.12+).
process.loadEnvFile?.();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    path: 'prisma/migrations',
  },
});

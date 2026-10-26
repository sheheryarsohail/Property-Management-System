import 'dotenv/config';

function req(name: string, def?: string) {
  const v = process.env[name] ?? def;
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const ENV = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  REDIS_URL: req('REDIS_URL', 'redis://localhost:6379'),
  CONCURRENCY_PDF: Number(process.env.CONCURRENCY_PDF ?? '4'),
  QUEUE_PREFIX: process.env.QUEUE_PREFIX ?? 'pms',
  LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
};

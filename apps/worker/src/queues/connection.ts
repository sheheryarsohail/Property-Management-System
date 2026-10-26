import IORedis, { RedisOptions } from 'ioredis';
import type { QueueOptions, WorkerOptions } from 'bullmq';

const {
  REDIS_URL,
  REDIS_HOST = 'redis',
  REDIS_PORT = '6379',
  REDIS_PASSWORD,
  REDIS_DB,
  REDIS_TLS
} = process.env as Record<string, string | undefined>;

export const bullConnection = (() => {
  if (REDIS_URL && REDIS_URL.trim()) {
    return new IORedis(REDIS_URL); // supports redis:// and rediss://
  }
  const opts: RedisOptions = {
    host: REDIS_HOST,
    port: Number(REDIS_PORT),
    password: REDIS_PASSWORD || undefined,
    db: REDIS_DB ? Number(REDIS_DB) : undefined,
    tls: REDIS_TLS === 'true' ? {} : undefined
  };
  return new IORedis(opts);
})();

export const queueOpts: QueueOptions = { connection: bullConnection };
export const workerOpts: WorkerOptions = { connection: bullConnection };

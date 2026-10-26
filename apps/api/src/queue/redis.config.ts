import { ConnectionOptions } from 'bullmq';

export function redisConnection(): ConnectionOptions {
  return {
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: Number(process.env.REDIS_PORT ?? 6379),
    username: process.env.REDIS_USERNAME || undefined,
    password: process.env.REDIS_PASSWORD || undefined,
    // tls: {} // enable if needed
  };
}

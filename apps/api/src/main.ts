// apps/api/src/main.ts
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import rateLimit from '@fastify/rate-limit';
import requestLoggingPlugin from './common/plugins/request-logging.plugin';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ProblemDetailsFilter } from './common/filters/problem-details.filter';
import { PrismaAuthContextInterceptor } from './common/interceptors/prisma-auth-context.interceptor';
import { PrismaService } from './prisma/prisma.service';

console.log('REDIS ENV CONFIG:', {
  REDIS_URL: process.env.REDIS_URL,
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT,
  REDIS_DB: process.env.REDIS_DB,
});

async function bootstrap() {
  // ── Create Fastify app
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  // ── Optional global prefix (e.g. "api")
  const GLOBAL_PREFIX = (process.env.API_PREFIX || '').replace(/^\/+|\/+$/g, '');
  if (GLOBAL_PREFIX) app.setGlobalPrefix(GLOBAL_PREFIX);

  // ── CORS
  app.enableCors({ origin: true, credentials: true });

  // ── Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Prisma shutdown hooks (graceful)
  const prisma = app.get(PrismaService);
  await prisma.enableShutdownHooks(app);

  // ── Propagate req.auth → PrismaService.requestAuth
  app.useGlobalInterceptors(new PrismaAuthContextInterceptor(prisma));

  // ── RFC7807 Problem+JSON errors
  app.useGlobalFilters(new ProblemDetailsFilter());

  // ── Fastify instance (for plugins and lightweight routes)
  const fastify = app.getHttpAdapter().getInstance() as any;


  // lightweight health (unprefixed; you already have proper health elsewhere)
  fastify.get('/healthz', async (_req: any, reply: any) => {
    reply.send({ ok: true });
  });

  // 1) Request logging (requestId + latency + tenant/user)
  await fastify.register(requestLoggingPlugin);

  // 2) Global rate limit (+ allow probes & optional API key bypass)
  await fastify.register(rateLimit as any, {
    global: true,
    max: 200,
    timeWindow: '1 minute',
    allowList: (req: any) => {
      const path: string = String(req?.url || '');

      // Never rate-limit health endpoints (with or without prefix)
      const bare = new Set(['/live', '/ready', '/health', '/healthz']);
      if (bare.has(path)) return true;
      if (GLOBAL_PREFIX) {
        const pref = `/${GLOBAL_PREFIX}`;
        const unprefixed = path.startsWith(pref) ? path.slice(pref.length) : path;
        if (bare.has(unprefixed)) return true;
      }

      // Optional: dev bypass for a raw key (separate from your hashed guard)
      return req?.headers?.['x-api-key'] === process.env.API_KEY;
    },
  } as any);

  // ── Swagger (Fastify-compatible) - TEMPORARILY DISABLED
  // TODO: Fix circular dependency in DTOs before re-enabling
  /*
  const cfg = new DocumentBuilder()
    .setTitle('PMS API')
    .setDescription('Property Management System — PDFs, Storage, Jobs, etc.')
    .setVersion('1.0.0')
    .addApiKey(
      { type: 'apiKey', name: 'x-api-key', in: 'header', description: 'Tenant/API key' },
      'x-api-key',
    )
    .addApiKey(
      { type: 'apiKey', name: 'Idempotency-Key', in: 'header', description: 'Required for PDF endpoints' },
      'Idempotency-Key',
    )
    .build();

  const doc = SwaggerModule.createDocument(app, cfg, {
    deepScanRoutes: true,
    extraModels: [],
  });

  SwaggerModule.setup('docs', app, doc, {
    jsonDocumentUrl: 'docs-json',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'PMS API Docs',
  });
  */

  // ── Start server
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '0.0.0.0'; // 0.0.0.0 so it works in containers, too
  await app.listen(port, host);

  // ── Log URLs
  const rawUrl = await app.getUrl(); // e.g. http://0.0.0.0:3000
  const friendly = rawUrl.replace('0.0.0.0', '127.0.0.1');
  const withPrefix = (p: string) =>
    GLOBAL_PREFIX ? `${friendly}/${GLOBAL_PREFIX}/${p}` : `${friendly}/${p}`;

  (fastify.log ?? console).info?.(
    { url: friendly, docs: withPrefix('docs'), docsJson: withPrefix('docs-json') },
    'Server listening',
  );

  // trust proxy if you're behind nginx/ingress (optional)
  if (process.env.TRUST_PROXY === '1') {
    fastify.setTrustProxy(true);
  }

  // graceful shutdown signals
  const shutdown = async (sig: string) => {
    try {
      (fastify.log ?? console).info?.({ sig }, 'Shutting down');
      await app.close();
      process.exit(0);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap();

import type {
  FastifyPluginCallback,
  FastifyRequest,
  FastifyReply,
  FastifyInstance,
} from 'fastify';
import { randomUUID } from 'crypto';

declare module 'fastify' {
  interface FastifyRequest {
    requestId?: string;
    _startTimeNs?: bigint;
  }
}

const requestLoggingPlugin: FastifyPluginCallback = (
  fastify: FastifyInstance,
  _opts,
  done
) => {
  fastify.addHook('onRequest', async (req: FastifyRequest, reply: FastifyReply) => {
    const hdr = (req.headers['x-request-id'] ?? req.headers['x-requestid'] ?? '') as string;
    const rid = (typeof hdr === 'string' && hdr.trim().length > 0) ? hdr : randomUUID();
    (req as any).requestId = rid;
    (req as any)._startTimeNs = process.hrtime.bigint();
    reply.header('x-request-id', rid);
  });

  fastify.addHook('onResponse', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const end = process.hrtime.bigint();
      const start = ((req as any)._startTimeNs as bigint) ?? end;
      const latencyMs = Number((end - start) / BigInt(1_000_000));

      const anyReq: any = req as any;
      const auth = anyReq.auth ?? anyReq.raw?.auth ?? null;

      const log = {
        ts: new Date().toISOString(),
        level: 'info',
        requestId: (req as any).requestId,
        method: req.method,
        path: req.url,
        status: reply.statusCode,
        latencyMs,
        tenantId: auth?.tenantId ?? null,
        userId: auth?.userId ?? null,
        ip: req.ip,
      };

      if ((fastify as any).log) (fastify as any).log.info(log);
      else console.log(JSON.stringify(log));
    } catch {
      /* ignore logging errors */
    }
  });

  done();
};

export default requestLoggingPlugin;

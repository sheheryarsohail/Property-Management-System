import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import type { FastifyRequest, FastifyReply } from 'fastify';

@Injectable()
export class IdemHeaderMiddleware implements NestMiddleware {
  use(req: FastifyRequest, _res: FastifyReply, next: () => void) {
    // Allow quick bypass in dev if needed
    if (process.env.DISABLE_PDF_IDEM === '1' || process.env.DISABLE_PDF_IDEM === 'true') return next();

    const key = req.headers['idempotency-key'];
    if (!key || (Array.isArray(key) && key.length === 0)) {
      throw new BadRequestException('Idempotency-Key required');
    }
    next();
  }
}

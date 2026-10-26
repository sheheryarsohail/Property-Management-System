// src/statements/statements.property.controller.ts
import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { StatementsService } from './statements.service';
import { StorageService } from '../storage/storage.service';
import { ApiKeyProtected } from '../auth/api-key.decorator';

function isTrue(v?: string) {
  return v === '1' || v === 'true';
}

// Small helper to make a human scope label (optional)
function humanRange(fromISO: string, toISO: string) {
  try {
    const fromDate = new Date(fromISO);
    const toDate = new Date(toISO);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    const f = fromDate.toLocaleDateString('en-US', opts);
    const t = toDate.toLocaleDateString('en-US', opts);
    return `${f}-${t}`;
  } catch {
    return `${fromISO}-${toISO}`;
  }
}

@ApiKeyProtected()
@Controller('statements')
export class StatementsPropertyController {
  constructor(
    private readonly statements: StatementsService,
    private readonly storage: StorageService,
  ) {}

  /**
   * Replacement for the legacy "property.pdf" endpoint.
   * Idempotent, no Prisma "data:{}" anywhere.
   *
   * GET /statements/property.pdf?tenantId=T&propertyId=P&from=YYYY-MM-DD&to=YYYY-MM-DD
   * Headers:
   *  - Idempotency-Key: <uuid>
   *  - (optional) Accept: application/pdf
   *
   * Query flags:
   *  - download=true to force attachment
   *  - presign=true to 302 redirect to presigned URL (S3 mode)
   */
  // @Get('property-report.pdf')
  async propertyStatementPdf(
    @Query('tenantId') tenantId: string | undefined,
    @Query('propertyId') propertyId: string | undefined,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('download') download: string | undefined,
    @Query('presign') presign: string | undefined,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    // ── Guard inputs
    const idemKey = (req.headers['idempotency-key'] as string | undefined) ?? '';
    if (!idemKey) throw new BadRequestException('Idempotency-Key required');
    if (!tenantId) throw new BadRequestException('tenantId required');
    if (!propertyId) throw new BadRequestException('propertyId required');
    if (!from || !to) throw new BadRequestException('from and to required (YYYY-MM-DD)');

    // Generate the PDF bytes (your service should implement this signature)
    // If yours takes a combined id, adjust accordingly.
    const pdf = await this.statements.generatePropertyStatementPdf(propertyId, from, to);
    if (!pdf) throw new BadRequestException('Unable to generate statement');

    // Build a friendly key suffix; StorageService will prefix tenant/sha256
    const range = humanRange(from, to).replace(/[, ]/g, '_').replace(/__/g, '_');
    const keyHint = `statements_${propertyId}-${range}.pdf`;

    // Persist idempotently (this both stores the blob and writes the idem row)
    const put = await this.storage.putPdfIdempotent(pdf, {
      tenantId,                 // <— string (we already validated)
      idempotencyKey: idemKey,  // <— string (we already validated)
      keyHint,                  // <— e.g. statements_PROP_SEED_1-Sep_14_2025-Oct_14_2025.pdf
    });

    // presign=true? (S3 or local with STORAGE_PUBLIC_BASE_URL)
    if (isTrue(presign)) {
      const url = await this.storage.presignGet(put.key, 300);
      return res.redirect(url, 302);
    }

    // Stream the stored object (sets Content-Type and ETag)
    const inline = !isTrue(download);
    res.header('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="${keyHint}"`);
    res.header('X-Idempotency-Key', idemKey);
    await this.storage.stream(put.key, res);
    return;
  }
}

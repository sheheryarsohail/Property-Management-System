// src/statements/statements.controller.ts
import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { StatementsService } from './statements.service';
import { StorageService } from '../storage/storage.service';
import { MailerService } from '../mailer/mailer.service';
import { PdfQueueProducerService as PdfQueueService } from '../queue/pdf-queue.producer';
import { etagOf } from '../common/utils/etag';
import { ApiKeyProtected } from '../auth/api-key.decorator';

function isTrue(v?: string) {
  return v === '1' || v === 'true';
}

@ApiKeyProtected()
@Controller('statements')
export class StatementsController {
  constructor(
    private readonly statementsService: StatementsService,
    private readonly storage: StorageService,
    private readonly mailer: MailerService,
    private readonly pdfQueue: PdfQueueService,
  ) {}

  /**
   * GET /statements/:id/pdf
   *
   * Query / headers:
   *  - tenantId (required) or header: X-Tenant-Id
   *  - Idempotency-Key (required, header)
   *  - enqueue=true  : enqueue to worker; returns 202
   *  - store=true    : (direct path already persists idempotently)
   *  - presign=true  : 302 redirect to presigned GET
   *  - email=<addr>  : email the PDF (also persists)
   *  - download=true : set Content-Disposition=attachment
   *  - dryRun=true   : health probe (no side effects)
   */
  @Get(':id/pdf')
  async getStatementPdf(
    @Param('id') id: string,
    @Query('tenantId') tenantIdQuery: string | undefined,
    @Query('dryRun') dryRun: string | undefined,
    @Query('dryrun') dryrun: string | undefined,
    @Query('download') download: string | undefined,
    @Query('store') store: string | undefined,
    @Query('presign') presign: string | undefined,
    @Query('email') email: string | undefined,
    @Query('enqueue') enqueue: string | undefined,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    // Parse flags
    const wantDry = isTrue(dryRun) || isTrue(dryrun);
    const inline = !isTrue(download);

    // Resolve tenantId (query > header)
    const tenantIdHeader = (req.headers['x-tenant-id'] as string | undefined) ?? undefined;
    const tenantId = tenantIdQuery ?? tenantIdHeader;

    // Idempotency key (always from header)
    const idemKey = (req.headers['idempotency-key'] as string | undefined) ?? '';

    // ── DRY RUN: no side effects, just health probes ────────────────────
    if (wantDry) {
      let exists = false;
      try {
        exists = !!(await this.statementsService.get(id));
      } catch {}

      let canGenerate = false;
      try {
        canGenerate = !!(await this.statementsService.generateStatementPdf(id));
      } catch {}

      const storageHealth =
        typeof (this.storage as any).health === 'function'
          ? await (this.storage as any).health()
          : { ok: true };

      const smtpHealth =
        typeof (this.mailer as any).verify === 'function'
          ? await (this.mailer as any).verify()
          : { ok: true };

      return res.status(200).send({
        dryRun: true,
        id,
        exists,
        canGenerate,
        storage: storageHealth,
        smtp: smtpHealth,
      });
    }

    // ── Guards (non-dry path) ───────────────────────────────────────────
    if (!idemKey) throw new BadRequestException('Idempotency-Key required');
    if (!tenantId) throw new BadRequestException('tenantId required');

    // Friendly filename suffix (StorageService prefixes with tenant/sha256)
    const keyHint = `statements_${id}.pdf`;

    // Stable idempotency "resource scope" for queue/worker & idem service
    // If your :id already includes propertyId and date range, this is sufficient.
    // Example: "statement:PROP_SEED_1:2025-09-14_to_2025-10-14:pdf"
    const scope = `statement:${id}:pdf`;

    // ── Enqueue path (preferred for heavy PDFs) ─────────────────────────
    if (isTrue(enqueue)) {
      try {
        const { jobId, existing, state } = await this.pdfQueue.enqueueStatement(id, {
          tenantId,              // pass through to worker
          idemKey,               // let worker store idempotently per request
          scope,                 // stable mapping for idem replay
          store: isTrue(store),
          presign: isTrue(presign),
          email: email || null,
          // job: { priority: 7 }, // optional BullMQ tuning
        });

        return res.status(202).send({
          enqueued: true,
          jobId,
          existing: !!existing,
          state: state || 'waiting',
          statusUrl: `/jobs/${jobId}`,
          scope,
          keyHint,
        });
      } catch {
        // Graceful fallback—drop to direct render below.
      }
    }

    // ── Direct render → idempotent persist → respond ────────────────────
    const pdf = await this.statementsService.generateStatementPdf(id);
    if (!pdf) throw new NotFoundException('Statement not found');

    // Persist via idempotent storage (records/replays safely)
    const put = await this.storage.putPdfIdempotent(pdf, {
      tenantId,                // string (guarded above)
      idempotencyKey: idemKey, // string (guarded above)
      keyHint,                 // "<tenant>/<sha>/statements_<id>.pdf"
    });

    // Optional actions after persist
    if (email) {
      try {
        await this.mailer.sendPdf(
          email,
          `Statement ${id}`,
          `Please find attached Statement ${id}.`,
          `statement-${id}.pdf`,
          pdf,
        );
        return res.status(200).send({ sent: true, to: email, storedKey: put.key });
      } catch (e: any) {
        return res
          .status(200)
          .send({ sent: false, to: email, storedKey: put.key, error: e?.message || String(e) });
      }
    }

    if (isTrue(presign)) {
      const url = await this.storage.presignGet(put.key, 300);
      return res.redirect(url, 302);
    }

    // Already stored—stream from storage (correct headers & ETag management inside)
    res.header(
      'Content-Disposition',
      `${inline ? 'inline' : 'attachment'}; filename="statement-${id}.pdf"`,
    );
    res.header('X-Idempotency-Key', idemKey);
    await this.storage.stream(put.key, res);
    return;
  }

  /**
   * GET /statements/:id/raw.pdf
   * Always render & stream directly (no idempotency, no storage).
   */
  @Get(':id/raw.pdf')
  async streamStatementPdfRaw(
    @Param('id') id: string,
    @Query('download') download: string | undefined,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    const pdf = await this.statementsService.generateStatementPdf(id);
    if (!pdf) throw new NotFoundException('Statement not found');

    const etag = etagOf(pdf);
    const inm = (req.headers['if-none-match'] as string | undefined) ?? '';
    if (inm && inm === etag) return res.status(304).send();

    const inline = !isTrue(download);
    return res
      .type('application/pdf')
      .header('Content-Length', String(pdf.length))
      .header(
        'Content-Disposition',
        `${inline ? 'inline' : 'attachment'}; filename="statement-${id}.pdf"`,
      )
      .header('ETag', etag)
      .header('Cache-Control', 'private, max-age=300')
      .header('Vary', 'If-None-Match')
      .header('X-Render-Path', 'raw')
      .send(pdf);
  }
}

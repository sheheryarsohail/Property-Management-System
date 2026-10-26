import { BadRequestException, Controller, Get, NotFoundException, Param, Query, Req, Res } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { InvoicesService } from './invoices.service';
import { StorageService } from '../storage/storage.service';
import { MailerService } from '../mailer/mailer.service';
import { PdfQueueProducerService as PdfQueueService } from '../queue/pdf-queue.producer';
import { etagOf } from '../common/utils/etag';
import { ApiKeyProtected } from '../auth/api-key.decorator';
import { IdemService } from '../common/idem/idem.service';

function isTrue(v?: string) { return v === '1' || v === 'true'; }
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
function parseTtl(s?: string) {
  const n = Number.parseInt(String(s ?? ''), 10);
  if (!Number.isFinite(n)) return 300;
  return clamp(n, 60, 604800); // 1 min .. 7 days
}
function safeFileName(name: string) {
  return name.replace(/[^\w.\-+@]/g, '_').replace(/_+/g, '_');
}

@ApiKeyProtected()
@Controller('invoices')
export class InvoicesController {
  constructor(
    private readonly idem: IdemService,
    private readonly invoicesService: InvoicesService,
    private readonly storage: StorageService,
    private readonly mailer: MailerService,
    private readonly pdfQueue: PdfQueueService,
  ) {}

  /* =========================
   *  LIST + GET (new routes)
   * ========================= */
  @Get()
  async list(
    @Req() req: FastifyRequest,
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
    @Query('propertyId') propertyId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    if ((from && Number.isNaN(fromDate?.getTime())) || (to && Number.isNaN(toDate?.getTime()))) {
      throw new BadRequestException('Invalid date format');
    }
    return this.invoicesService.list(tenantId, {
      status: status as any,
      customerId,
      propertyId,
      from: fromDate,
      to: toDate,
      q,
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
    });
  }

  @Get(':id')
  async getOne(@Param('id') id: string, @Req() req: FastifyRequest) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    const inv = await this.invoicesService.getBasic(tenantId, id);
    if (!inv) throw new NotFoundException('Invoice not found');
    return inv;
  }

  /* =========================
   *  PDF ROUTES
   * ========================= */
  @Get(':id/pdf')
  async getInvoicePdf(
    @Param('id') id: string,
    @Query('dryRun') dryRun: string | undefined,
    @Query('dryrun') dryrun: string | undefined,
    @Query('download') download: string | undefined,
    @Query('store') store: string | undefined,
    @Query('presign') presign: string | undefined,
    @Query('email') email: string | undefined,
    @Query('enqueue') enqueue: string | undefined,
    @Query('json') json: string | undefined,
    @Query('filename') filename: string | undefined,
    @Query('ttl') ttlStr: string | undefined,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';

    // 🔹 DRY RUN (no side effects)
    const wantDry = isTrue(dryRun) || isTrue(dryrun);
    if (wantDry) {
      const inv = await this.invoicesService.get(tenantId, id).catch(() => null);
      let canGenerate = false;
      try { const buf = await this.invoicesService.generateInvoicePdf(tenantId, id); canGenerate = !!buf; } catch {}
      const storage = await this.storage.health();
      const smtp = await this.mailer.verify();
      return res.status(200).send({ dryRun: true, id, exists: !!inv, canGenerate, storage, smtp });
    }

    const name = safeFileName(filename || `invoice-${id}.pdf`);
    const key = `invoices/${id}.pdf`;
    const ttl = parseTtl(ttlStr);
    const wantJson = isTrue(json);

    // 1) Require Idempotency-Key
    const idemKey = (req.headers['idempotency-key'] as string) || '';
    if (!idemKey) throw new BadRequestException('Idempotency-Key required');

    // 2) Scope (tenant aware)
    const scope = `invoice:${tenantId}:${id}:pdf`;

    // 3) Short-circuit if already generated
    const hit = await this.idem.guard(idemKey, scope);
    const storedKey = (hit?.response as any)?.key as string | undefined;
    if (storedKey) {
      await this.storage.stream(storedKey, res, {}); // 3+ args per your StorageService
      return;
    }

    // Enqueue first (optional), with graceful fallback
    if (isTrue(enqueue)) {
      try {
        const { jobId } = await this.pdfQueue.enqueueInvoice(id, {
          store: isTrue(store),
          presign: isTrue(presign),
          email: email ?? null,
          tenantId,
        });
        return res.status(202).send({ enqueued: true, jobId, statusUrl: `/jobs/${jobId}` });
      } catch (err: any) {
        const fallbackReason = err?.message || 'queue unavailable';
        const pdf = await this.invoicesService.generateInvoicePdf(tenantId, id);
        if (!pdf) throw new NotFoundException('Invoice not found');

        const result: any = { enqueued: false, fallbackReason };

        if (isTrue(store)) {
          try { await this.storage.putPdf(key, pdf); result.store = { ok: true, key }; }
          catch (e: any) { result.store = { ok: false, error: e?.message || String(e) }; }
        }

        if (isTrue(presign)) {
          if (!result.store?.ok) {
            try { await this.storage.putPdf(key, pdf); result.store = { ok: true, key }; }
            catch (e: any) { result.store = { ok: false, error: e?.message || String(e) }; }
          }
          try {
            const url = await this.storage.presignGet(key, ttl);
            if (wantJson) return res.status(200).send({ ...result, presign: { ok: true, url, key, ttl } });
            return res.redirect(url, 302);
          } catch (e: any) {
            const msg = e?.message || 'presign failed';
            if (wantJson) return res.status(400).send({ ...result, presign: { ok: false, error: msg } });
            return res.status(400).send({ error: msg });
          }
        }

        if (email) {
          try {
            await this.mailer.sendPdf(email, `Invoice ${id}`, `Please find attached Invoice ${id}.`, name, pdf);
            return res.status(200).send({ ...result, sent: true, to: email });
          } catch (e: any) {
            return res.status(200).send({ ...result, sent: false, to: email, emailError: e?.message || String(e) });
          }
        }

        const etag = etagOf(pdf);
        const inm = (req.headers['if-none-match'] as string | undefined) ?? '';
        if (inm && inm === etag) return res.status(304).send();

        const inline = !isTrue(download);
        return res
          .type('application/pdf')
          .header('Content-Length', String(pdf.length))
          .header('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="${name}"`)
          .header('ETag', etag)
          .header('Cache-Control', 'private, max-age=300')
          .header('Vary', 'If-None-Match')
          .header('X-Render-Path', 'enqueue-fallback')
          .send(pdf);
      }
    }

    // Direct path (no enqueue)
    const pdf = await this.invoicesService.generateInvoicePdf(tenantId, id);
    if (!pdf) throw new NotFoundException('Invoice not found');

    if (isTrue(store)) await this.storage.putPdf(key, pdf);
    if (isTrue(presign)) {
      if (!isTrue(store)) await this.storage.putPdf(key, pdf);
      try {
        const url = await this.storage.presignGet(key, ttl);
        if (wantJson) return res.status(200).send({ presign: { ok: true, url, key, ttl } });
        return res.redirect(url, 302);
      } catch (e: any) {
        const msg = e?.message || 'presign failed';
        if (wantJson) return res.status(400).send({ presign: { ok: false, error: msg } });
        return res.status(400).send({ error: msg });
      }
    }

    if (email) {
      await this.mailer.sendPdf(email, `Invoice ${id}`, `Please find attached Invoice ${id}.`, name, pdf);
      return res.status(200).send({ sent: true, to: email });
    }

    const etag = etagOf(pdf);
    const inm = (req.headers['if-none-match'] as string | undefined) ?? '';
    if (inm && inm === etag) return res.status(304).send();

    const inline = !isTrue(download);
    return res
      .type('application/pdf')
      .header('Content-Length', String(pdf.length))
      .header('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="${name}"`)
      .header('ETag', etag)
      .header('Cache-Control', 'private, max-age=300')
      .header('Vary', 'If-None-Match')
      .header('X-Render-Path', 'direct')
      .send(pdf);
  }

  @Get(':id/raw.pdf')
  async streamInvoicePdfRaw(
    @Param('id') id: string,
    @Query('download') download: string | undefined,
    @Query('filename') filename: string | undefined,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    const pdf = await this.invoicesService.generateInvoicePdf(tenantId, id);
    if (!pdf) throw new NotFoundException('Invoice not found');

    const name = safeFileName(filename || `invoice-${id}.pdf`);
    const etag = etagOf(pdf);
    const inm = (req.headers['if-none-match'] as string | undefined) ?? '';
    if (inm && inm === etag) return res.status(304).send();

    const inline = !isTrue(download);
    return res
      .type('application/pdf')
      .header('Content-Length', String(pdf.length))
      .header('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="${name}"`)
      .header('ETag', etag)
      .header('Cache-Control', 'private, max-age=300')
      .header('Vary', 'If-None-Match')
      .header('X-Render-Path', 'raw')
      .send(pdf);
  }
}

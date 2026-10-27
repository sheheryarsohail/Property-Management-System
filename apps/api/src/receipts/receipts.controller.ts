import { BadRequestException, Controller, Get, NotFoundException, Param, Query, Req, Res, Post, Body, Put, ForbiddenException } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ReceiptsService } from './receipts.service';
import { StorageService } from '../storage/storage.service';
import { MailerService } from '../mailer/mailer.service';
import { PdfQueueProducerService as PdfQueueService } from '../queue/pdf-queue.producer';
import { etagOf } from '../common/utils/etag';
import { ApiKeyProtected } from '../auth/api-key.decorator';
import { IdemService } from '../common/idem/idem.service';
import { UpdateReceiptDto } from './dto/update-receipt.dto';
import { verifyJwtToken } from '../common/guards/api-key.guard';

function isTrue(v?: string) { return v === '1' || v === 'true'; }
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
function parseTtl(s?: string) {
  const n = Number.parseInt(String(s ?? ''), 10);
  if (!Number.isFinite(n)) return 300;
  return clamp(n, 60, 604800);
}
function safeFileName(name: string) {
  return name.replace(/[^\w.\-+@]/g, '_').replace(/_+/g, '_');
}

@ApiKeyProtected()
@Controller('receipts')
export class ReceiptsController {
  constructor(
    private readonly idem: IdemService,
    private readonly receiptsService: ReceiptsService,
    private readonly storage: StorageService,
    private readonly mailer: MailerService,
    private readonly pdfQueue: PdfQueueService,
  ) {}

  @Get()
  list(
    @Req() req: FastifyRequest,
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.receiptsService.list(tenantId, { 
      q,
      category, 
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Post()
  create(@Req() req: FastifyRequest, @Body() body: any) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.receiptsService.create(tenantId, body);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateReceiptDto,
    @Req() req: FastifyRequest,
  ) {
    let user = (req as any).user;
    if (!user) {
      const authz = (req.headers['authorization'] as string) || '';
      if (/^bearer\s+/i.test(authz)) {
        const token = authz.replace(/^bearer\s+/i, '').trim();
        const secret = process.env.JWT_SECRET || '02c69f4cc9d911c4b97ab30567b8b786dda00b8f2cead185b23ca01f892d62aa';
        const payload = verifyJwtToken(token, secret);
        if (payload?.sub) {
          user = await this.receiptsService.findUserById(payload.sub);
        }
      }
    }
    if (!user || user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only super admin can edit generated receipts');
    }
    const tenantId = (req.headers['x-tenant-id'] as string) || (user.tenantId) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.receiptsService.update(tenantId, id, body, user);
  }

  @Get(':id/pdf')
  async getReceiptPdf(
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
    const wantDry = isTrue(dryRun) || isTrue(dryrun);
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    if (wantDry) {
      const rc = await this.receiptsService.get(tenantId, id).catch(() => null);
      let canGenerate = false;
      try { const buf = await this.receiptsService.generateReceiptPdf(tenantId, id); canGenerate = !!buf; } catch {}
      const storage = await this.storage.health();
      const smtp = await this.mailer.verify();
      return res.status(200).send({
        dryRun: true,
        id,
        exists: !!rc,
        canGenerate,
        storage,
        smtp,
      });
    }

    const name = safeFileName(filename || `receipt-${id}.pdf`);
    const key = `receipts/${id}.pdf`;
    const ttl = parseTtl(ttlStr);
    const wantJson = isTrue(json);

    const idemKey = (req.headers['idempotency-key'] as string) || (req.headers['x-request-id'] as string) || `auto-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

    const scope = `receipt:${tenantId}:${id}:pdf`;

    const hit = await this.idem.guard(idemKey, scope, tenantId);
    const storedKey = (hit as any)?.resourceKey as string | undefined;
    if (storedKey) {
      await this.storage.stream(storedKey, res, { cacheControl: 'private, max-age=300' });
      return;
    }

    if (isTrue(enqueue)) {
      try {
        const { jobId } = await this.pdfQueue.enqueue({
          type: 'receipt',
          id,
          store: isTrue(store),
          presign: isTrue(presign),
          email: email || null,
        });
        return res.status(202).send({ enqueued: true, jobId, statusUrl: `/jobs/${jobId}` });
      } catch (err: any) {
        const fallbackReason = err?.message || 'queue unavailable';
        const pdf = await this.receiptsService.generateReceiptPdf(tenantId, id);
        if (!pdf) throw new NotFoundException('Receipt not found');

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
            await this.mailer.sendPdf(email, `Receipt ${id}`, `Please find attached Receipt ${id}.`, name, pdf);
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

    // Direct path
    const pdf = await this.receiptsService.generateReceiptPdf(tenantId, id);
    if (!pdf) throw new NotFoundException('Receipt not found');

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
      await this.mailer.sendPdf(email, `Receipt ${id}`, `Please find attached Receipt ${id}.`, name, pdf);
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
  async streamReceiptPdfRaw(
    @Param('id') id: string,
    @Query('download') download: string | undefined,
    @Query('filename') filename: string | undefined,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    const pdf = await this.receiptsService.generateReceiptPdf(tenantId, id);
    if (!pdf) throw new NotFoundException('Receipt not found');

    const name = safeFileName(filename || `receipt-${id}.pdf`);
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

  @Get(':id')
  async getReceipt(@Param('id') id: string, @Req() req: FastifyRequest) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    const rc = await this.receiptsService.get(tenantId, id);
    if (!rc) throw new NotFoundException('Receipt not found');
    return rc;
  }
}


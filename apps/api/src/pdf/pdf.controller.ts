// apps/api/src/pdf/pdf.controller.ts
import {
  BadRequestException,
  Controller,
  Get,
  Head,
  Query,
  Req,
  Res,
  Param,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { StatementsService } from '../statements/statements.service';
import { StorageService } from '../storage/storage.service';
import { PdfBuilder } from './pdf-builder';

import { formatDate } from '../common/utils/date';
import { formatMoney } from '../common/utils/money';
import { getTenantId } from '../common/utils/tenant';

import { ApiKeyProtected } from '../auth/api-key.decorator';
import { Scopes } from '../auth/scopes.decorator';
import {
  ApiSecurity,
  ApiTags,
  ApiOperation,
  ApiProduces,
  ApiOkResponse,
  ApiHeader,
} from '@nestjs/swagger';

import { InvoicePdfService } from './services/invoice-pdf.service';
import { ReceiptPdfService } from './services/receipt-pdf.service';
import { IdemService } from '../common/idem/idem.service';

/* ---------- helpers ---------- */
function isTrue(v?: string) { return v === '1' || v === 'true'; }
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
function parseTtl(s?: string) {
  const n = Number.parseInt(String(s ?? ''), 10);
  if (!Number.isFinite(n)) return 300;
  return clamp(n, 60, 604_800); // 1 min .. 7 days
}
function safeFileName(name: string) {
  return name.replace(/[^\w.\-+@]/g, '_').replace(/_+/g, '_');
}
function toNumber(v: any): number {
  try {
    if (v && typeof v === 'object') {
      if ('toNumber' in v && typeof (v as any).toNumber === 'function') return (v as any).toNumber();
      if ('toFixed' in v && typeof (v as any).toFixed === 'function') return Number((v as any).toFixed(8));
      if ('value' in v) return Number((v as any).value);
    }
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  } catch { return 0; }
}
function normalizeDrCr(row: any): { debit: number; credit: number } {
  if (row?.debit != null || row?.credit != null) {
    return { debit: toNumber(row.debit ?? 0), credit: toNumber(row.credit ?? 0) };
  }
  if (row?.amount != null) {
    const amt = toNumber(row.amount);
    const t = String(row?.type ?? '').toLowerCase();
    if (t === 'debit' || t === 'dr') return { debit: Math.abs(amt), credit: 0 };
    if (t === 'credit' || t === 'cr') return { debit: 0, credit: Math.abs(amt) };
    return amt >= 0 ? { debit: 0, credit: amt } : { debit: Math.abs(amt), credit: 0 };
  }
  return { debit: 0, credit: 0 };
}

// ---------- Idempotency helpers ----------
function requireIdemKey(req: FastifyRequest): string {
  const k = req.headers['idempotency-key'] as string | undefined;
  if (!k) throw new BadRequestException('Idempotency-Key required');
  return k;
}
function stmtPropScope(propertyId: string, fromStr: string, toStr: string) {
  return `statement:property:${propertyId}:${fromStr}-${toStr}:pdf`;
}
function invoiceScope(id: string) {
  return `invoice:${id}:pdf`;
}
function receiptScope(id: string) {
  return `receipt:${id}:pdf`;
}

@ApiTags('PDFs')
@ApiSecurity('x-api-key')
@ApiSecurity('Idempotency-Key')
@ApiHeader({
  name: 'Idempotency-Key',
  description: 'Stable key for idempotent PDF generation (same key → same stored file).',
  required: true,
})
@ApiKeyProtected()
@Controller()
export class PdfController {
  constructor(
    private readonly statements: StatementsService,
    private readonly storage: StorageService,
    private readonly invoices: InvoicePdfService,
    private readonly receipts: ReceiptPdfService,
    private readonly idem: IdemService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────
  // PROPERTY STATEMENT — HEAD (ETag discovery without body)
  // ─────────────────────────────────────────────────────────────────────
  @Head('statements/property-report.pdf')
  @Scopes('read:statements')
  async propertyStatementHead(
    @Query('propertyId') propertyId: string,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    if (!propertyId) throw new BadRequestException('propertyId is required');
    const tenantId = getTenantId(req);
    if (!tenantId) throw new BadRequestException('tenantId required');
    const idemKey = requireIdemKey(req);

    const fromLabel = from ? formatDate(from) : '—';
    const toLabel   = to ? formatDate(to)   : '—';
    const scope = stmtPropScope(propertyId, fromLabel, toLabel);

    const hit = await this.idem.guard(idemKey, scope);
    const key = (hit?.response as any)?.key as string | undefined;
    if (!key) return res.code(404).send();

    // Force reliable, DB-stable ETag (uses sha256 if backend ETag is absent)
    const { contentType, etag } = await this.storage.readStream(key);
    if (etag) {
      res.header('ETag', etag);
      res.header('X-ETag-Source', 'readStream');
    }
    if (contentType) res.type(contentType);
    return res.send();
  }

  // ─────────────────────────────────────────────────────────────────────
  // PROPERTY STATEMENT — GET
  // ─────────────────────────────────────────────────────────────────────
  @Get('statements/property-report.pdf')
  @Scopes('read:statements')
  @ApiOperation({ summary: 'Generate a Property Statement PDF (stream, store, or presign).' })
  @ApiProduces('application/pdf')
  @ApiOkResponse({ description: 'PDF streamed (or JSON when json=1 / presign=1)' })
  async propertyStatementPdf(
    @Query('propertyId') propertyId: string,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('download') download: string | undefined,
    @Query('presign') presign: string | undefined,
    @Query('json') json: string | undefined,
    @Query('filename') filename: string | undefined,
    @Query('ttl') ttlStr: string | undefined,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    if (!propertyId) throw new BadRequestException('propertyId is required');

    const tenantId = getTenantId(req);
    if (!tenantId) throw new BadRequestException('tenantId required');
    const idemKey  = requireIdemKey(req);

    const fromLabel = from ? formatDate(from) : '—';
    const toLabel   = to ? formatDate(to)   : '—';
    const earlyScope = stmtPropScope(propertyId, fromLabel, toLabel);
    const disposition = isTrue(download) ? 'attachment' : 'inline';
    const requestedEtag = (req.headers['if-none-match'] as string | undefined) || undefined;

    // Early replay (no build)
    const earlyHit = await this.idem.guard(idemKey, earlyScope);
    const earlyKey = (earlyHit?.response as any)?.key as string | undefined;
    if (earlyKey) {
      if (isTrue(presign)) {
        const ttl = parseTtl(ttlStr);
        const url = await this.storage.presignGet(earlyKey, ttl);
        return isTrue(json)
          ? res.status(200).send({ key: earlyKey, url, ttl })
          : res.redirect(url, 302);
      }
      const safeName = safeFileName(filename || `statement-${propertyId}-${fromLabel}-${toLabel}.pdf`);
      return this.storage.stream(earlyKey, res, {
        cacheControl: 'public, max-age=86400',
        disposition,
        filename: safeName,
        etagCheck: requestedEtag,
      });
    }

    // 1) Fetch statement
    const st = await this.statements.propertyStatement(propertyId, { from, to });

    // 2) Build PDF
    const brand = {
      orgName: process.env.BRAND_NAME || 'PMS',
      orgSubtitle: process.env.BRAND_SUBTITLE || '',
      orgAddress: process.env.BRAND_ADDRESS || '',
      logoPath: process.env.BRAND_LOGO_PATH || undefined,
    };
    const builder = new PdfBuilder(brand);
    const { doc, endToBuffer } = builder.createDoc();

    const fromStr = st.periodStart ? formatDate(st.periodStart) : '—';
    const toStr   = st.periodEnd   ? formatDate(st.periodEnd)   : '—';
    const finalScope = stmtPropScope(propertyId, fromStr, toStr);

    builder.header(doc, {
      title: `Property Statement — ${st.propertyId}`,
      idLabel: 'Property ID',
      idValue: st.propertyId,
      dateLabel: 'Period',
      dateValue: `${fromStr} → ${toStr}`,
    });

    builder.kv(doc, 'Property ID', st.propertyId);
    builder.kv(doc, 'Period Start', fromStr);
    builder.kv(doc, 'Period End', toStr);

    const opening = toNumber(st.openingBalance ?? 0);
    let balance = opening;
    let totalDebit = 0;
    let totalCredit = 0;

    const rows = (Array.isArray(st.lines) ? [...st.lines] : [])
      .sort((a, b) => new Date(a?.date || 0).getTime() - new Date(b?.date || 0).getTime())
      .map((r) => {
        const { debit, credit } = normalizeDrCr(r);
        totalDebit += debit;
        totalCredit += credit;
        balance = balance + credit - debit;
        return [
          r?.date ? formatDate(r.date as any) : '—',
          String(r?.description ?? r?.desc ?? r?.memo ?? '—'),
          debit ? formatMoney(debit) : '',
          credit ? formatMoney(credit) : '',
          formatMoney(balance),
        ];
      });

    builder.table(
      doc,
      ['Date', 'Description', 'Debit', 'Credit', 'Balance'],
      rows,
      [90, 230, 80, 80, 100],
    );

    builder.footer(doc);
    const pdf = await endToBuffer();

    // 3) Persist + idem map
    const ttl = parseTtl(ttlStr);
    const safeName = safeFileName(filename || `statement-${st.propertyId}-${fromStr}-${toStr}.pdf`);
    const meta = await this.storage.putPdfIdempotent(pdf, {
      tenantId,
      idempotencyKey: `pdf:statement:${st.id ?? st.propertyId}:${fromStr}-${toStr}:v1`,
      keyHint: `statements_${st.propertyId}-${fromStr}-${toStr}.pdf`,
    });

    await this.idem.save(idemKey, finalScope, { key: meta.key }, tenantId);

    if (isTrue(presign)) {
      const url = await this.storage.presignGet(meta.key, ttl);
      return isTrue(json)
        ? res.status(200).send({ id: meta.id, key: meta.key, url, ttl })
        : res.redirect(url, 302);
    }
    if (isTrue(json)) return res.status(200).send(meta);

    return this.storage.stream(meta.key, res, {
      cacheControl: 'public, max-age=86400',
      disposition,
      filename: safeName,
      etagCheck: requestedEtag,
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // INVOICE — HEAD
  // ─────────────────────────────────────────────────────────────────────
  @Head('invoices/:id.pdf')
  @Scopes('read:invoices')
  async invoiceHead(
    @Param('id') id: string,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    if (!id) throw new BadRequestException('id is required');
    const tenantId = getTenantId(req);
    if (!tenantId) throw new BadRequestException('tenantId required');
    const idemKey = requireIdemKey(req);
    const hit = await this.idem.guard(idemKey, invoiceScope(id));
    const key = (hit?.response as any)?.key as string | undefined;
    if (!key) return res.code(404).send();

    const { contentType, etag } = await this.storage.readStream(key);
    if (etag) {
      res.header('ETag', etag);
      res.header('X-ETag-Source', 'readStream');
    }
    if (contentType) res.type(contentType);
    return res.send();
  }

  // ─────────────────────────────────────────────────────────────────────
  // INVOICE — GET
  // ─────────────────────────────────────────────────────────────────────
  @Get('invoices/:id.pdf')
  @Scopes('read:invoices')
  @ApiOperation({ summary: 'Generate an Invoice PDF (stream, store, or presign).' })
  @ApiProduces('application/pdf')
  @ApiOkResponse({ description: 'PDF streamed (or JSON when json=1 / presign=1)' })
  async invoicePdf(
    @Param('id') id: string,
    @Query('download') download: string | undefined,
    @Query('presign') presign: string | undefined,
    @Query('json') json: string | undefined,
    @Query('filename') filename: string | undefined,
    @Query('ttl') ttlStr: string | undefined,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    if (!id) throw new BadRequestException('id is required');

    const tenantId = getTenantId(req);
    if (!tenantId) throw new BadRequestException('tenantId required');
    const idemKey = requireIdemKey(req);
    const scope = invoiceScope(id);
    const disposition = isTrue(download) ? 'attachment' : 'inline';
    const requestedEtag = (req.headers['if-none-match'] as string | undefined) || undefined;

    const hit = await this.idem.guard(idemKey, scope);
    const existingKey = (hit?.response as any)?.key as string | undefined;
    if (existingKey) {
      if (isTrue(presign)) {
        const ttl = parseTtl(ttlStr);
        const url = await this.storage.presignGet(existingKey, ttl);
        return isTrue(json)
          ? res.status(200).send({ key: existingKey, url, ttl })
          : res.redirect(url, 302);
      }
      const safeName = safeFileName(filename || `invoice-${id}.pdf`);
      return this.storage.stream(existingKey, res, {
        cacheControl: 'public, max-age=86400',
        disposition,
        filename: safeName,
        etagCheck: requestedEtag,
      });
    }

    const { buffer, fileName, keyHint } = await this.invoices.buildPdf(id);
    const ttl = parseTtl(ttlStr);
    const safeName = safeFileName(filename || fileName);

    const meta = await this.storage.putPdfIdempotent(buffer, {
      tenantId,
      keyHint,
      idempotencyKey: `pdf:invoice:${id}:v1`,
    });

    await this.idem.save(idemKey, scope, { key: meta.key }, tenantId);

    if (isTrue(presign)) {
      const url = await this.storage.presignGet(meta.key, ttl);
      return isTrue(json)
        ? res.status(200).send({ id: meta.id, key: meta.key, url, ttl })
        : res.redirect(url, 302);
    }
    if (isTrue(json)) return res.status(200).send(meta);

    return this.storage.stream(meta.key, res, {
      cacheControl: 'public, max-age=86400',
      disposition,
      filename: safeName,
      etagCheck: requestedEtag,
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // RECEIPT — HEAD
  // ─────────────────────────────────────────────────────────────────────
  @Head('receipts/:id.pdf')
  @Scopes('read:receipts')
  async receiptHead(
    @Param('id') id: string,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    if (!id) throw new BadRequestException('id is required');
    const tenantId = getTenantId(req);
    if (!tenantId) throw new BadRequestException('tenantId required');
    const idemKey = requireIdemKey(req);
    const hit = await this.idem.guard(idemKey, receiptScope(id));
    const key = (hit?.response as any)?.key as string | undefined;
    if (!key) return res.code(404).send();

    const { contentType, etag } = await this.storage.readStream(key);
    if (etag) {
      res.header('ETag', etag);
      res.header('X-ETag-Source', 'readStream');
    }
    if (contentType) res.type(contentType);
    return res.send();
  }

  // ─────────────────────────────────────────────────────────────────────
  // RECEIPT — GET
  // ─────────────────────────────────────────────────────────────────────
  @Get('receipts/:id.pdf')
  @Scopes('read:receipts')
  @ApiOperation({ summary: 'Generate a Receipt PDF (stream, store, or presign).' })
  @ApiProduces('application/pdf')
  @ApiOkResponse({ description: 'PDF streamed (or JSON when json=1 / presign=1)' })
  async receiptPdf(
    @Param('id') id: string,
    @Query('download') download: string | undefined,
    @Query('presign') presign: string | undefined,
    @Query('json') json: string | undefined,
    @Query('filename') filename: string | undefined,
    @Query('ttl') ttlStr: string | undefined,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    if (!id) throw new BadRequestException('id is required');

    const tenantId = getTenantId(req);
    if (!tenantId) throw new BadRequestException('tenantId required');
    const idemKey = requireIdemKey(req);
    const scope = receiptScope(id);
    const disposition = isTrue(download) ? 'attachment' : 'inline';
    const requestedEtag = (req.headers['if-none-match'] as string | undefined) || undefined;

    const hit = await this.idem.guard(idemKey, scope);
    const existingKey = (hit?.response as any)?.key as string | undefined;
    if (existingKey) {
      if (isTrue(presign)) {
        const ttl = parseTtl(ttlStr);
        const url = await this.storage.presignGet(existingKey, ttl);
        return isTrue(json)
          ? res.status(200).send({ key: existingKey, url, ttl })
          : res.redirect(url, 302);
      }
      const safeName = safeFileName(filename || `receipt-${id}.pdf`);
      return this.storage.stream(existingKey, res, {
        cacheControl: 'public, max-age=86400',
        disposition,
        filename: safeName,
        etagCheck: requestedEtag,
      });
    }

    const { buffer, fileName, keyHint } = await this.receipts.buildPdf(id);
    const ttl = parseTtl(ttlStr);
    const safeName = safeFileName(filename || fileName);

    const meta = await this.storage.putPdfIdempotent(buffer, {
      tenantId,
      keyHint,
      idempotencyKey: `pdf:receipt:${id}:v1`,
    });

    await this.idem.save(idemKey, scope, { key: meta.key }, tenantId);

    if (isTrue(presign)) {
      const url = await this.storage.presignGet(meta.key, ttl);
      return isTrue(json)
        ? res.status(200).send({ id: meta.id, key: meta.key, url, ttl })
        : res.redirect(url, 302);
    }
    if (isTrue(json)) return res.status(200).send(meta);

    return this.storage.stream(meta.key, res, {
      cacheControl: 'public, max-age=86400',
      disposition,
      filename: safeName,
      etagCheck: requestedEtag,
    });
  }
}

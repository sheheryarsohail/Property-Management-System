import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PdfBuilder } from '../pdf/pdf-builder';
import { formatMoney } from '../common/utils/money';
import { formatDate } from '../common/utils/date';
import { StorageService } from '../storage/storage.service';

type BrandOptions = {
  orgName?: string;
  orgSubtitle?: string;
  orgAddress?: string;
  logoPath?: string;
};

type Scope =
  | { kind: 'property'; id: string }
  | { kind: 'customer'; id: string }
  | { kind: 'consolidated'; customerId: string };

@Injectable()
export class StatementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /** Fetch by StatementRun id */
  async get(tenantId: string, id: string) {
    return this.prisma.statementRun.findFirst({ where: { tenantId, id } });
  }

  /** Preview shape for property statements (controller can call this) */
  async propertyStatementPreview(propertyId: string, range: { from?: string | Date; to?: string | Date }) {
    const periodStart = range?.from ? new Date(range.from) : null;
    const periodEnd = range?.to ? new Date(range.to) : null;

    return {
      id: `ST-${propertyId}-${periodStart?.toISOString() ?? 'open'}-${periodEnd?.toISOString() ?? 'open'}`,
      propertyId,
      customerId: null,
      status: 'DRAFT',
      periodStart,
      periodEnd,
      openingBalance: 0,
      lines: [] as Array<{ date?: string | Date; description?: string; debit?: number; credit?: number; amount?: number; type?: 'debit' | 'credit' | 'dr' | 'cr' }>,
    };
  }

  /** Create a StatementRun record (controller can call before generating PDF) */
  async startRun(tenantId: string, scope: Scope, from: Date, to: Date) {
    const scopeStr =
      scope.kind === 'property' ? `property:${scope.id}` :
      scope.kind === 'customer' ? `customer:${scope.id}` :
      `consolidated:${scope.customerId}`;

    const run = await this.prisma.statementRun.create({
      data: {
        tenantId,
        scope: scopeStr,
        fromDate: from,
        toDate: to,
        storageKey: null,
      },
    });
    return run;
  }

  /**
   * Generate a Statement PDF for a specific StatementRun id and persist
   */
  async generateStatementPdf(tenantId: string, id: string): Promise<Buffer | null> {
    const st = await this.get(tenantId, id);
    if (!st) return null;

    const brand: BrandOptions = {
      orgName: process.env.BRAND_NAME || 'PMS',
      orgSubtitle: process.env.BRAND_SUBTITLE || '',
      orgAddress: process.env.BRAND_ADDRESS || '',
      logoPath: process.env.BRAND_LOGO_PATH || undefined,
    };

    const builder = new PdfBuilder(brand);
    const { doc, endToBuffer } = builder.createDoc();

    builder.header(doc, {
      title: 'Statement',
      idLabel: 'Statement ID',
      idValue: st.id,
      dateLabel: 'Generated',
      dateValue: formatDate(Date.now()),
    });

    builder.kv(doc, 'Scope', st.scope);
    builder.kv(doc, 'Period Start', st.fromDate ? formatDate(st.fromDate) : '—');
    builder.kv(doc, 'Period End', st.toDate ? formatDate(st.toDate) : '—');

    // Build rows if your controller attaches lines/opening via some service; here we keep it minimal
    const { rows, opening, totalDebit, totalCredit, closing } = this.prepareStatementRows({
      openingBalance: 0,
      lines: [],
    });

    doc.moveDown();
    const headers = ['Date', 'Description', 'Debit', 'Credit', 'Balance'];
    const widths = [90, 230, 80, 80, 100];
    const yEnd = builder.table(doc, headers, rows, widths);

    doc
      .moveTo(48, yEnd + 8)
      .lineTo(doc.page.width - 48, yEnd + 8)
      .strokeColor('#eee')
      .stroke()
      .strokeColor('black');

    const rightColX = doc.page.width - 48 - 200;
    doc.fontSize(11);
    doc.text('Opening Balance', rightColX, yEnd + 16, { width: 110, align: 'right' });
    doc.text(formatMoney(opening), rightColX + 120, yEnd + 16, { width: 160, align: 'right' });

    doc.text('Total Debit', rightColX, yEnd + 32, { width: 110, align: 'right' });
    doc.text(formatMoney(totalDebit), rightColX + 120, yEnd + 32, { width: 160, align: 'right' });

    doc.text('Total Credit', rightColX, yEnd + 48, { width: 110, align: 'right' });
    doc.text(formatMoney(totalCredit), rightColX + 120, yEnd + 48, { width: 160, align: 'right' });

    doc.fontSize(12);
    doc.text('Closing Balance', rightColX, yEnd + 70, { width: 110, align: 'right' });
    doc.text(formatMoney(closing), rightColX + 120, yEnd + 70, { width: 160, align: 'right' });

    builder.footer(doc);
    const pdfBuffer = await endToBuffer();

    const keyHint = `statements/${st.scope}/${st.fromDate?.toISOString() ?? 'open'}_${st.toDate?.toISOString() ?? 'open'}.pdf`;

    // Persist idempotently
    await this.storage.putPdfIdempotent(pdfBuffer, {
      tenantId,
      keyHint,
      idempotencyKey: `statement:${st.id}:pdf:v1`,
      ttlDays: 365,
    });

    // Optionally backfill storageKey on the run (best-effort)
    try {
      await this.prisma.statementRun.update({
        where: { id: st.id },
        data: { storageKey: keyHint },
      });
    } catch {}

    return pdfBuffer;
  }

  /** Convert entity-like shape into rows and totals. */
  private prepareStatementRows(st: any) {
    const raw: any[] = Array.isArray(st?.lines) ? st.lines : [];
    const opening = toNumber(st?.openingBalance ?? 0);

    raw.sort((a, b) => {
      const da = a?.date ? new Date(a.date).getTime() : 0;
      const db = b?.date ? new Date(b.date).getTime() : 0;
      return da - db;
    });

    let balance = opening;
    let totalDebit = 0;
    let totalCredit = 0;

    const rows = raw.map((r) => {
      const { debit, credit } = normalizeDrCr(r);
      totalDebit += debit;
      totalCredit += credit;
      balance = balance + credit - debit;

      const dateStr = r?.date ? formatDate(r.date) : '—';
      const desc = String(r?.description ?? r?.desc ?? r?.memo ?? '—');

      return [
        dateStr,
        desc,
        debit ? formatMoney(debit) : '',
        credit ? formatMoney(credit) : '',
        formatMoney(balance),
      ];
    });

    const closing = balance;
    return { rows, opening, totalDebit, totalCredit, closing };
  }
}

/* ---------- local helpers ---------- */
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

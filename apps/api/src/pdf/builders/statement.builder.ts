// src/pdf/builders/statement.builder.ts
import { PdfBuilder } from '../pdf-builder';
import { formatDate } from '../../common/utils/date';
import { formatMoney } from '../../common/utils/money';

// Local, minimal brand type (kept decoupled from pdf-builder internals)
export type BrandConfig = {
  orgName: string;
  orgSubtitle?: string;
  orgAddress?: string;
  logoPath?: string;
};

// Input for rendering a statement PDF
export type PdfRenderInput = {
  id: string;                 // propertyId or statement identifier
  tenantId: string;           // used upstream for storage scoping
  title?: string;             // optional custom title
  fileName?: string;          // optional override for file name
  period?: { from?: Date | string; to?: Date | string };
  openingBalance?: number;
  lines?: Array<{
    date?: Date | string;
    description?: string;
    debit?: number;
    credit?: number;
  }>;
  brand?: BrandConfig;        // optional brand override for this render
};

function toNumberSafe(v: unknown): number {
  if (v == null) return 0;
  const n = Number(v as any);
  return Number.isFinite(n) ? n : 0;
}

function defaultBrand(): BrandConfig {
  return {
    orgName: process.env.BRAND_NAME || 'PMS',
    orgSubtitle: process.env.BRAND_SUBTITLE || '',
    orgAddress: process.env.BRAND_ADDRESS || '',
    logoPath: process.env.BRAND_LOGO_PATH || undefined,
  };
}

export class StatementPdfBuilder {
  constructor(private readonly brand?: BrandConfig) {}

  /**
   * Convenience for callers that only need a Buffer.
   * Your service currently calls this.
   */
  async renderToBuffer(input: PdfRenderInput): Promise<Buffer> {
    const { buffer } = await this.render(input);
    return buffer;
  }

  /**
   * Renders a statement PDF and returns buffer + naming hints.
   * If you also need fileName/keyHint, call this directly.
   */
  async render(input: PdfRenderInput): Promise<{ buffer: Buffer; fileName: string; keyHint: string }> {
    const { id } = input;
    const org = input.brand ?? this.brand ?? defaultBrand();

    const title = input.title ?? `Property Statement — ${id}`;
    const fromStr = input.period?.from ? formatDate(input.period.from) : '—';
    const toStr   = input.period?.to   ? formatDate(input.period.to)   : '—';

    // Use PdfBuilder helpers for consistent layout
    const builder = new PdfBuilder(org);
    const { doc, endToBuffer } = builder.createDoc();

    // Header
    builder.header(doc, {
      title,
      idLabel: 'Property ID',
      idValue: id,
      dateLabel: 'Period',
      dateValue: `${fromStr} → ${toStr}`,
    });

    // Key/Value intro
    builder.kv(doc, 'Property ID', id);
    builder.kv(doc, 'Period Start', fromStr);
    builder.kv(doc, 'Period End', toStr);

    // Ledger table
    const headers = ['Date', 'Description', 'Debit', 'Credit', 'Balance'];
    const widths = [90, 230, 80, 80, 100];

    const rows: string[][] = [];
    let balance = toNumberSafe(input.openingBalance);
    let totalDebit = 0;
    let totalCredit = 0;

    const lines = Array.isArray(input.lines) ? [...input.lines] : [];
    lines.sort((a, b) => {
      const da = a?.date ? new Date(a.date as any).getTime() : 0;
      const db = b?.date ? new Date(b.date as any).getTime() : 0;
      return da - db;
    });

    for (const r of lines) {
      const debit = Math.abs(toNumberSafe(r.debit));
      const credit = Math.abs(toNumberSafe(r.credit));
      totalDebit += debit;
      totalCredit += credit;
      balance = balance + credit - debit;

      rows.push([
        r?.date ? formatDate(r.date as any) : '—',
        String(r?.description ?? '—'),
        debit ? formatMoney(debit) : '',
        credit ? formatMoney(credit) : '',
        formatMoney(balance),
      ]);
    }

    doc.moveDown();
    const yEnd = builder.table(doc, headers, rows, widths);

    // Totals
    doc
      .moveTo(48, yEnd + 8)
      .lineTo(doc.page.width - 48, yEnd + 8)
      .strokeColor('#eee')
      .stroke()
      .strokeColor('black');

    const rightColX = doc.page.width - 48 - 200;
    doc.fontSize(11);
    doc.text('Opening Balance', rightColX, yEnd + 16, { width: 110, align: 'right' });
    doc.text(formatMoney(toNumberSafe(input.openingBalance)), rightColX + 120, yEnd + 16, { width: 160, align: 'right' });

    doc.text('Total Debit', rightColX, yEnd + 32, { width: 110, align: 'right' });
    doc.text(formatMoney(totalDebit), rightColX + 120, yEnd + 32, { width: 160, align: 'right' });

    doc.text('Total Credit', rightColX, yEnd + 48, { width: 110, align: 'right' });
    doc.text(formatMoney(totalCredit), rightColX + 120, yEnd + 48, { width: 160, align: 'right' });

    doc.fontSize(12);
    doc.text('Closing Balance', rightColX, yEnd + 70, { width: 110, align: 'right' });
    doc.text(formatMoney(balance), rightColX + 120, yEnd + 70, { width: 160, align: 'right' });

    builder.footer(doc);

    const buffer = await endToBuffer();

    // Naming hints
    const fromSafe = (fromStr || '').replace(/[^\w.\-+@]/g, '_');
    const toSafe = (toStr || '').replace(/[^\w.\-+@]/g, '_');
    const fileName = input.fileName ?? `statement-${id}-${fromSafe}-${toSafe}.pdf`;
    const keyHint  = `statements_${id}-${fromSafe}-${toSafe}.pdf`; // keep slash-free

    return { buffer, fileName, keyHint };
  }
}

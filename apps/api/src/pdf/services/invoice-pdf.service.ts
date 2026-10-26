import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PdfBuilder } from '../pdf-builder';
import { formatDate } from '../../common/utils/date';
import { formatMoney } from '../../common/utils/money';

function toNumber(v: any): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

@Injectable()
export class InvoicePdfService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Build the PDF bytes and a sensible filename/keyHint for an invoice.
   * We only rely on fields you actually have on the model.
   */
  async buildPdf(invoiceId: string) {
    const inv = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!inv) throw new NotFoundException('Invoice not found');

    const brand = {
      orgName: process.env.BRAND_NAME || 'PMS',
      orgSubtitle: process.env.BRAND_SUBTITLE || '',
      orgAddress: process.env.BRAND_ADDRESS || '',
      logoPath: process.env.BRAND_LOGO_PATH || undefined,
    };
    const builder = new PdfBuilder(brand);
    const { doc, endToBuffer } = builder.createDoc();

    const dateStr = inv.issueDate ? formatDate(inv.issueDate as any) : '—';
    const dueStr  = inv.dueDate  ? formatDate(inv.dueDate as any)  : '—';

    builder.header(doc, {
      title: `Invoice — ${inv.id}`,
      idLabel: 'Invoice ID',
      idValue: inv.id,
      dateLabel: 'Issue → Due',
      dateValue: `${dateStr} → ${dueStr}`,
    });

    builder.kv(doc, 'Customer', inv.customerId ?? '—');
    builder.kv(doc, 'Property', inv.propertyId ?? '—');
    builder.kv(doc, 'Status',   inv.status ?? '—');

    const subtotal = toNumber(inv.amount ?? 0);
    const tax = 0;
    const total = subtotal + tax;

    doc.moveDown();
    builder.kv(doc, 'Subtotal', formatMoney(subtotal));
    builder.kv(doc, 'Tax',      formatMoney(tax));
    builder.kv(doc, 'Total',    formatMoney(total));

    if (inv.notes) {
      doc.moveDown();
      builder.kv(doc, 'Notes', String(inv.notes));
    }

    builder.footer(doc);
    const buf = await endToBuffer();

    const safeId = inv.id.replace(/[^\w.\-+@]/g, '_');
    const fileName = `invoice-${safeId}.pdf`;
    const keyHint  = `invoices_${safeId}.pdf`;

    return { buffer: buf, fileName, keyHint };
  }
}

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
export class ReceiptPdfService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Build the PDF bytes and a sensible filename/keyHint for a receipt.
   * Uses conservative fields that exist on your model (createdAt/amount/etc.).
   */
  async buildPdf(receiptId: string) {
    const rcpt = await this.prisma.receipt.findUnique({ where: { id: receiptId } });
    if (!rcpt) throw new NotFoundException('Receipt not found');

    const brand = {
      orgName: process.env.BRAND_NAME || 'PMS',
      orgSubtitle: process.env.BRAND_SUBTITLE || '',
      orgAddress: process.env.BRAND_ADDRESS || '',
      logoPath: process.env.BRAND_LOGO_PATH || undefined,
    };
    const builder = new PdfBuilder(brand);
    const { doc, endToBuffer } = builder.createDoc();

    const dateStr = rcpt.createdAt ? formatDate(rcpt.createdAt as any) : '—';

    builder.header(doc, {
      title: `Receipt — ${rcpt.id}`,
      idLabel: 'Receipt ID',
      idValue: rcpt.id,
      dateLabel: 'Date',
      dateValue: dateStr,
    });

    builder.kv(doc, 'Customer', rcpt.customerId ?? '—');
    builder.kv(doc, 'Property', rcpt.propertyId ?? '—');
    builder.kv(doc, 'Status',   rcpt.status ?? '—');

    const amt = toNumber((rcpt as any).amount ?? 0);
    const currency = (rcpt as any).currency ?? '—';

    doc.moveDown();
    builder.kv(doc, 'Amount',   formatMoney(amt));
    builder.kv(doc, 'Currency', String(currency));

    // Optional: print some instrument fields if present (JSON)
    const instrument = (rcpt as any).instrument as any;
    if (instrument && typeof instrument === 'object') {
      doc.moveDown();
      if (instrument.type)   builder.kv(doc, 'Instrument', String(instrument.type));
      if (instrument.number) builder.kv(doc, 'Reference',  String(instrument.number));
      if (instrument.note)   builder.kv(doc, 'Note',       String(instrument.note));
    }

    builder.footer(doc);
    const buf = await endToBuffer();

    const safeId = rcpt.id.replace(/[^\w.\-+@]/g, '_');
    const fileName = `receipt-${safeId}.pdf`;
    const keyHint  = `receipts_${safeId}.pdf`;

    return { buffer: buf, fileName, keyHint };
  }
}

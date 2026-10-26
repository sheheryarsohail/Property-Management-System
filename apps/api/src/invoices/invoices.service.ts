import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument from 'pdfkit';
import { StorageService } from '../storage/storage.service';

type ListOpts = {
  status?: 'PENDING' | 'PARTIAL' | 'PAID' | 'VOID';
  customerId?: string;
  propertyId?: string;
  from?: Date;
  to?: Date;
  q?: string;
  page?: number;
  limit?: number;
};

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async list(tenantId: string, opts?: ListOpts) {
    const page = opts?.page || 1;
    const limit = opts?.limit || 50;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      status: opts?.status as any,
      customerId: opts?.customerId,
      propertyId: opts?.propertyId,
      ...(opts?.from || opts?.to ? { dueDate: { gte: opts?.from, lte: opts?.to } } : {}),
      ...(opts?.q ? {
        OR: [
          { code: { contains: opts.q, mode: 'insensitive' } },
          { customer: { fullName: { contains: opts.q, mode: 'insensitive' } } },
          { property: { code: { contains: opts.q, mode: 'insensitive' } } },
        ]
      } : {}),
    };

    const [total, data] = await Promise.all([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.findMany({
        where,
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        take: limit,
        skip,
        select: {
          id: true, code: true, issueDate: true, dueDate: true, type: true,
          subtotal: true, tax: true, total: true, paid: true, status: true,
          customer: { select: { id: true, fullName: true, code: true } },
          property: { select: { id: true, code: true, title: true } },
        },
      })
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** Slim getter for /invoices/:id */
  getBasic(tenantId: string, id: string) {
    return this.prisma.invoice.findFirst({
      where: { tenantId, id },
      select: {
        id: true, code: true, issueDate: true, dueDate: true,
        subtotal: true, tax: true, total: true, paid: true, status: true,
        customer: { select: { id: true, fullName: true, code: true, email: true, phone: true } },
        property: { select: { id: true, code: true, title: true, address: true } },
      },
    });
  }

  /** Rich getter (used by PDF) */
  async get(tenantId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { tenantId, id },
      include: {
        customer: { select: { fullName: true, email: true, phone: true, code: true } },
        property: { select: { code: true, title: true, address: true } },
      },
    });
    return invoice;
  }

  /**
   * Must return Buffer | null (unchanged API)
   * - Uses schema fields: issueDate, total, paid, status
   * - Persists via StorageService.putPdfIdempotent (idempotent)
   */
  async generateInvoicePdf(tenantId: string, id: string): Promise<Buffer | null> {
    const invoice = await this.get(tenantId, id);
    if (!invoice) return null;

    const doc = new PDFDocument({ size: 'A4', margin: 48 });

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c as Buffer));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(20).text('Invoice', { align: 'center' }).moveDown();
      doc.fontSize(12);

      doc.text(`Invoice Code: ${invoice.code}`);
      doc.text(`Invoice ID: ${invoice.id}`);
      doc.text(`Issue Date: ${new Date(invoice.issueDate).toDateString()}`);
      doc.text(`Due Date: ${new Date(invoice.dueDate).toDateString()}`);
      doc.text(`Status: ${invoice.status}`);
      doc.moveDown();

      doc.text(`Customer: ${invoice.customer?.fullName ?? '—'} (${invoice.customer?.code ?? '—'})`);
      doc.text(`Property: ${invoice.property?.title ?? '—'} [${invoice.property?.code ?? '—'}]`);
      if (invoice.property?.address) doc.text(`Address: ${invoice.property.address}`);
      doc.moveDown();

      doc.text(`Subtotal: ${String(invoice.subtotal)}`);
      doc.text(`Tax: ${String(invoice.tax)}`);
      doc.text(`Total: ${String(invoice.total)}`);
      doc.text(`Paid: ${String(invoice.paid)}`);
      doc.text(`Balance: ${String((Number(invoice.total) - Number(invoice.paid)).toFixed(2))}`);

      doc.end();
    });

    await this.storage.putPdfIdempotent(pdfBuffer, {
      tenantId,
      keyHint: `invoices/${id}.pdf`,
      idempotencyKey: `invoice:${id}:pdf:v1`,
      ttlDays: 365,
    });

    return pdfBuffer;
  }

  /** Convenience to ensure invoice exists before heavy work */
  async mustExist(tenantId: string, id: string) {
    const inv = await this.get(tenantId, id);
    if (!inv) throw new NotFoundException('Invoice not found');
    return inv;
  }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PdcStatus, ReceiptMethod } from '@prisma/client';
import { PaymentPlansService } from '../payment-plans/payment-plans.service';

type CreatePdcInput = {
  tenantId: string;
  customerId: string;
  bank?: string;
  chequeNo?: string;
  amount: number;
  dueDate: string | Date;
  notes?: string;
  invoiceId?: string;
  code?: string; // Optional manual receipt number
};

@Injectable()
export class PdcService {
  constructor(private prisma: PrismaService, private paymentPlansService: PaymentPlansService) {}

  list(tenantId: string, opts?: { status?: string; search?: string; from?: string; to?: string }) {
    const where: any = { tenantId };
    
    if (opts?.status && opts.status !== 'all') {
      where.status = opts.status as PdcStatus;
    }

    if (opts?.search) {
      where.OR = [
        { chequeNo: { contains: opts.search, mode: 'insensitive' } },
        { bank: { contains: opts.search, mode: 'insensitive' } },
        { customer: { fullName: { contains: opts.search, mode: 'insensitive' } } },
      ];
    }

    if (opts?.from || opts?.to) {
      where.dueDate = {};
      if (opts.from) where.dueDate.gte = new Date(opts.from);
      if (opts.to) {
        const toDate = new Date(opts.to);
        toDate.setUTCHours(23, 59, 59, 999);
        where.dueDate.lte = toDate;
      }
    }

    return this.prisma.postDatedCheque.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            code: true,
            ownerships: {
              select: {
                property: { select: { title: true, code: true } },
              },
              take: 1,
            },
          },
        },
        invoice: { select: { id: true, code: true, property: { select: { title: true, code: true } } } },
      },
    });
  }

  listBounced(tenantId: string) {
    return this.prisma.postDatedCheque.findMany({
      where: { tenantId, status: 'BOUNCED' },
      orderBy: { dueDate: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            code: true,
            ownerships: {
              select: {
                property: { select: { title: true, code: true } },
              },
              take: 1,
            },
          },
        },
        invoice: { select: { id: true, code: true, property: { select: { title: true, code: true } } } },
      },
    });
  }

  listByCustomer(tenantId: string, customerId: string) {
    return this.prisma.postDatedCheque.findMany({
      where: { tenantId, customerId },
      orderBy: { dueDate: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            code: true,
            ownerships: {
              select: {
                property: { select: { title: true, code: true } },
              },
              take: 1,
            },
          },
        },
        invoice: { select: { id: true, code: true, property: { select: { title: true, code: true } } } },
      },
    });
  }

  async create(input: CreatePdcInput) {
    const { tenantId, customerId, amount } = input;
    const cust = await this.prisma.customer.findFirst({ where: { tenantId, id: customerId } });
    if (!cust) throw new NotFoundException('Customer not found');

    const rawDate = input.dueDate || (input as any).chequeDate;
    const dt = new Date(rawDate);
    if (Number.isNaN(dt.getTime())) throw new BadRequestException('Invalid dueDate');
    if (Number(amount) <= 0) throw new BadRequestException('Amount must be > 0');

    if (input.invoiceId) {
      const inv = await this.prisma.invoice.findFirst({ where: { tenantId, id: input.invoiceId } });
      if (!inv) throw new NotFoundException('Invoice not found');
    }

    return this.prisma.$transaction(async (tx) => {
      let receiptCode = input.code;
      if (receiptCode) {
        // Check if exists in receipt or pdc
        const existingReceipt = await tx.receipt.findUnique({ where: { tenantId_code: { tenantId, code: receiptCode } } });
        if (existingReceipt) throw new BadRequestException(`Receipt number ${receiptCode} already exists.`);
        
        const existingPdc = await tx.postDatedCheque.findFirst({ where: { tenantId, receiptCode } });
        if (existingPdc) throw new BadRequestException(`Receipt number ${receiptCode} already exists for another PDC.`);
      } else {
        const count = await tx.receipt.count({ where: { tenantId } });
        let candidateCode = `REC-${count + 1}`;
        let counter = 1;
        while (
          (await tx.receipt.findUnique({ where: { tenantId_code: { tenantId, code: candidateCode } } })) ||
          (await tx.postDatedCheque.findFirst({ where: { tenantId, receiptCode: candidateCode } }))
        ) {
          candidateCode = `REC-${count + 1 + counter}`;
          counter++;
        }
        receiptCode = candidateCode;
      }

      const pdc = await tx.postDatedCheque.create({
        data: {
          tenantId,
          customerId,
          bank: input.bank ?? null,
          chequeNo: input.chequeNo ?? null,
          amount: input.amount as any,
          dueDate: dt,
          status: 'RECEIVED',
          notes: input.notes ?? null,
          invoiceId: input.invoiceId ?? null,
          receiptCode,
        },
      });

      if (input.invoiceId) {
        await tx.invoice.update({
          where: { id: input.invoiceId },
          data: { status: 'PDC' },
        });
      }

      return pdc;
    });
  }

  async deposit(tenantId: string, pdcId: string) {
    const pdc = await this.prisma.postDatedCheque.findFirst({ where: { tenantId, id: pdcId } });
    if (!pdc) throw new NotFoundException('PDC not found');
    if (pdc.status !== 'RECEIVED') throw new BadRequestException('Only RECEIVED PDCs can be deposited');

    return this.prisma.postDatedCheque.update({
      where: { id: pdcId },
      data: { status: 'DEPOSITED' },
    });
  }

  /**
   * Clear a PDC -> creates a Receipt against an Invoice and updates Invoice.paid/status
   */
  async clear(tenantId: string, pdcId: string, opts?: { invoiceId?: string; reference?: string }) {
    return this.prisma.$transaction(async (tx) => {
      const pdc = await tx.postDatedCheque.findFirst({ where: { tenantId, id: pdcId } });
      if (!pdc) throw new NotFoundException('PDC not found');
      if (!['DEPOSITED', 'RECEIVED'].includes(pdc.status)) {
        throw new BadRequestException('Only RECEIVED or DEPOSITED PDCs can be cleared');
      }

      let finalInvoiceId = opts?.invoiceId || pdc.invoiceId;
      let inv: any = null;
      if (finalInvoiceId) {
        inv = await tx.invoice.findFirst({ where: { tenantId, id: finalInvoiceId } });
      }

      // If targeted invoice is already fully paid or not provided, fallback to oldest unpaid invoice for this customer
      if (!inv || Number(inv.paid) >= Number(inv.total)) {
        const nextInv = await tx.invoice.findFirst({
          where: {
            tenantId,
            customerId: pdc.customerId,
            status: { in: ['PENDING', 'PARTIAL', 'OVERDUE', 'PDC', 'BOUNCED'] },
          },
          orderBy: { dueDate: 'asc' },
        });
        if (nextInv) {
          inv = nextInv;
        }
      }

      let receiptCode = pdc.receiptCode;
      if (!receiptCode || (await tx.receipt.findUnique({ where: { tenantId_code: { tenantId, code: receiptCode } } }))) {
        const count = await tx.receipt.count({ where: { tenantId } });
        let candidateCode = `REC-${count + 1}`;
        let counter = 1;
        while (
          (await tx.receipt.findUnique({ where: { tenantId_code: { tenantId, code: candidateCode } } })) ||
          (await tx.postDatedCheque.findFirst({ where: { tenantId, receiptCode: candidateCode, id: { not: pdc.id } } }))
        ) {
          candidateCode = `REC-${count + 1 + counter}`;
          counter++;
        }
        receiptCode = candidateCode;
      }

      let remainingAmount = Number(pdc.amount);
      const allocations: Array<{ invoiceId: string; invoiceCode: string; amount: number }> = [];

      if (inv) {
        const balance = Math.max(Number(inv.total) - Number(inv.paid), 0);
        const allocate = Math.min(remainingAmount, balance);
        if (allocate > 0) {
          remainingAmount -= allocate;
          const newPaid = Number(inv.paid) + allocate;
          const isPaid = newPaid >= Number(inv.total);
          allocations.push({ invoiceId: inv.id, invoiceCode: inv.code, amount: allocate });
          await tx.invoice.update({
            where: { id: inv.id },
            data: {
              paid: newPaid,
              status: isPaid ? 'PAID' : 'PARTIAL',
            },
          });
          if (isPaid && inv.propertyId) {
            await this.paymentPlansService.checkAndGenerateInstallments(tenantId, inv.propertyId, tx);
          }
        }
      }

      // Waterfall allocate remaining surplus to other unpaid invoices for this customer
      if (remainingAmount > 0) {
        const moreInvoices = await tx.invoice.findMany({
          where: {
            tenantId,
            customerId: pdc.customerId,
            ...(inv?.id ? { id: { not: inv.id } } : {}),
            status: { in: ['PENDING', 'PARTIAL', 'OVERDUE', 'PDC', 'BOUNCED'] },
          },
          orderBy: { dueDate: 'asc' },
        });

        for (const nextInv of moreInvoices) {
          if (remainingAmount <= 0) break;
          const bal = Math.max(Number(nextInv.total) - Number(nextInv.paid), 0);
          if (bal <= 0) continue;
          const alloc = Math.min(remainingAmount, bal);
          remainingAmount -= alloc;
          const nextPaid = Number(nextInv.paid) + alloc;
          const nextIsPaid = nextPaid >= Number(nextInv.total);
          allocations.push({ invoiceId: nextInv.id, invoiceCode: nextInv.code, amount: alloc });
          await tx.invoice.update({
            where: { id: nextInv.id },
            data: {
              paid: nextPaid,
              status: nextIsPaid ? 'PAID' : 'PARTIAL',
            },
          });
          if (nextIsPaid && nextInv.propertyId) {
            await this.paymentPlansService.checkAndGenerateInstallments(tenantId, nextInv.propertyId, tx);
          }
        }
      }

      // Create receipt
      await tx.receipt.create({
        data: {
          tenantId,
          code: receiptCode,
          invoiceId: inv ? inv.id : null,
          customerId: pdc.customerId,
          propertyId: inv ? inv.propertyId : null,
          method: ReceiptMethod.PDC,
          amount: pdc.amount as any,
          receivedAt: new Date(),
          bankName: pdc.bank,
          chequeNumber: pdc.chequeNo,
          chequeDate: pdc.dueDate,
          reference: opts?.reference ?? `PDC-${pdc.chequeNo ?? pdc.id}`,
          notes: 'Auto-created on PDC CLEARED',
          allocations: allocations.length > 0 ? (allocations as any) : undefined,
        },
      });

      // Update PDC status
      return tx.postDatedCheque.update({
        where: { id: pdc.id },
        data: {
          status: 'CLEARED',
          invoiceId: inv ? inv.id : pdc.invoiceId,
          receiptCode,
        },
      });
    });
  }

  async bounce(tenantId: string, pdcId: string, notes?: string) {
    const pdc = await this.prisma.postDatedCheque.findFirst({ where: { tenantId, id: pdcId } });
    if (!pdc) throw new NotFoundException('PDC not found');
    if (pdc.status === 'CLEARED') throw new BadRequestException('Cannot bounce a cleared PDC');

    return this.prisma.$transaction(async (tx) => {
      const updatedPdc = await tx.postDatedCheque.update({
        where: { id: pdcId },
        data: { status: 'BOUNCED', notes: notes ?? pdc.notes },
      });

      if (pdc.invoiceId) {
        await tx.invoice.update({
          where: { id: pdc.invoiceId },
          data: { status: 'BOUNCED' },
        });
      }

      return updatedPdc;
    });
  }

  async transition(tenantId: string, pdcId: string, to: PdcStatus, opts?: { invoiceId?: string; reference?: string }) {
    if (to === 'DEPOSITED') return this.deposit(tenantId, pdcId);
    if (to === 'CLEARED') {
      return this.clear(tenantId, pdcId, { invoiceId: opts?.invoiceId, reference: opts?.reference });
    }
    if (to === 'BOUNCED') return this.bounce(tenantId, pdcId, opts?.reference);
    if (to === 'RETURNED' || to === 'CANCELLED') {
      return this.prisma.$transaction(async (tx) => {
        const updated = await tx.postDatedCheque.update({
          where: { id: pdcId },
          data: { status: to },
        });
        if (updated.invoiceId) {
          const inv = await tx.invoice.findUnique({ where: { id: updated.invoiceId } });
          if (inv && (inv.status === 'PDC' || inv.status === 'BOUNCED')) {
            const paid = Number(inv.paid);
            await tx.invoice.update({
              where: { id: inv.id },
              data: { status: paid > 0 ? 'PARTIAL' : 'PENDING' },
            });
          }
        }
        return updated;
      });
    }
    // RECEIVED is initial; no-op
    return this.prisma.postDatedCheque.findFirst({ where: { tenantId, id: pdcId } });
  }

  async delete(tenantId: string, pdcId: string) {
    const pdc = await this.prisma.postDatedCheque.findFirst({ where: { tenantId, id: pdcId } });
    if (!pdc) throw new NotFoundException('PDC not found');
    if (pdc.status === 'CLEARED') {
      throw new BadRequestException('Cannot delete a CLEARED PDC. Please reverse or void the corresponding receipt first.');
    }

    return this.prisma.$transaction(async (tx) => {
      // Revert linked invoice if it's in PDC or BOUNCED status
      if (pdc.invoiceId) {
        const inv = await tx.invoice.findUnique({ where: { id: pdc.invoiceId } });
        if (inv && (inv.status === 'PDC' || inv.status === 'BOUNCED')) {
          const paid = Number(inv.paid);
          await tx.invoice.update({
            where: { id: inv.id },
            data: { status: paid > 0 ? 'PARTIAL' : 'PENDING' },
          });
        }
      }

      return tx.postDatedCheque.delete({
        where: { id: pdcId },
      });
    });
  }
}

import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PdfBuilder } from '../pdf/pdf-builder';
import { StorageService } from '../storage/storage.service';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { UpdateReceiptDto } from './dto/update-receipt.dto';
import { PaymentPlansService } from '../payment-plans/payment-plans.service';

@Injectable()
export class ReceiptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly paymentPlansService: PaymentPlansService,
  ) {}

  async list(
    tenantId: string,
    opts?: { q?: string; category?: string; page?: number; limit?: number; from?: Date; to?: Date },
  ) {
    const page = opts?.page || 1;
    const limit = opts?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      ...(opts?.from || opts?.to ? { receivedAt: { gte: opts?.from, lte: opts?.to } } : {}),
      ...(opts?.category === 'DEVELOPMENT'
        ? { OR: [{ category: 'DEVELOPMENT' }, { code: { startsWith: 'DEV-' } }, { invoice: { type: 'DEVELOPMENT_CHARGE' } }] }
        : opts?.category === 'TRANSFER'
        ? { OR: [{ category: { in: ['TRANSFER', 'TRANSFER_FEE'] } }, { code: { startsWith: 'TRF-' } }, { OwnershipTransfer: { isNot: null } }] }
        : opts?.category === 'REFUND'
        ? { OR: [{ category: { in: ['REFUND', 'CANCELLATION'] } }, { code: { startsWith: 'REF-' } }, { PlotCancellation: { isNot: null } }] }
        : opts?.category === 'MERGE'
        ? { OR: [{ category: { in: ['MERGE', 'MERGE_ADJUSTMENT'] } }, { code: { startsWith: 'MRG-' } }, { PlotMerge: { isNot: null } }] }
        : opts?.category === 'INSTALLMENT'
        ? {
            AND: [
              { NOT: { code: { startsWith: 'DEV-' } } },
              { NOT: { code: { startsWith: 'TRF-' } } },
              { NOT: { code: { startsWith: 'REF-' } } },
              { NOT: { code: { startsWith: 'MRG-' } } },
              { category: { notIn: ['DEVELOPMENT', 'TRANSFER', 'TRANSFER_FEE', 'REFUND', 'CANCELLATION', 'MERGE', 'MERGE_ADJUSTMENT'] } },
              { OwnershipTransfer: null },
              { PlotCancellation: null },
              { PlotMerge: null },
            ],
          }
        : {}),
      ...(opts?.q
        ? {
            OR: [
              { code: { contains: opts.q, mode: 'insensitive' as any } },
              { customer: { fullName: { contains: opts.q, mode: 'insensitive' as any } } },
              { invoice: { code: { contains: opts.q, mode: 'insensitive' as any } } },
              { property: { code: { contains: opts.q, mode: 'insensitive' as any } } },
              { reference: { contains: opts.q, mode: 'insensitive' as any } },
              { chequeNumber: { contains: opts.q, mode: 'insensitive' as any } },
            ],
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      this.prisma.receipt.count({ where }),
      this.prisma.receipt.findMany({
        where,
        orderBy: [{ receivedAt: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        skip,
        include: {
          customer: { select: { fullName: true, code: true } },
          invoice: { select: { code: true, type: true } },
          property: { select: { code: true } },
          OwnershipTransfer: { select: { id: true } },
          PlotCancellation: { select: { id: true } },
          PlotMerge: { select: { id: true } },
        },
      }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(tenantId: string, input: CreateReceiptDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Determine category
      let category = input.category || 'INSTALLMENT';
      if (input.invoiceId && category !== 'DEVELOPMENT') {
        const inv = await tx.invoice.findUnique({ where: { id: input.invoiceId } });
        if (inv?.type === 'DEVELOPMENT_CHARGE') {
          category = 'DEVELOPMENT';
        }
      }

      let receiptCode = input.code ? input.code.trim() : '';

      // 2. Receipt Code Generation with Differentiator (auto & manual)
      if (category === 'DEVELOPMENT') {
        if (receiptCode) {
          // User entered a manual code for dev receipt (e.g. "1052" or "DEV-1052")
          // Enforce differentiator prefix "DEV-" so manual dev receipt never collides with installment receipt
          const rawCode = receiptCode.replace(/^DEV-?(REC-?)?/i, '').trim();
          receiptCode = `DEV-${rawCode}`;
        } else {
          // Auto-generate DEV-REC-X (ensure no collision)
          const devCount = await tx.receipt.count({
            where: {
              tenantId,
              OR: [
                { category: 'DEVELOPMENT' },
                { code: { startsWith: 'DEV-' } },
              ],
            },
          });
          let seq = devCount + 1;
          while (
            (await tx.receipt.findUnique({ where: { tenantId_code: { tenantId, code: `DEV-REC-${seq}` } } })) ||
            (await tx.postDatedCheque.findFirst({ where: { tenantId, receiptCode: `DEV-REC-${seq}` } }))
          ) {
            seq++;
          }
          receiptCode = `DEV-REC-${seq}`;
        }
      } else {
        if (!receiptCode) {
          const count = await tx.receipt.count({
            where: {
              tenantId,
              NOT: { code: { startsWith: 'DEV-' } },
            },
          });
          let seq = count + 1;
          while (
            (await tx.receipt.findUnique({ where: { tenantId_code: { tenantId, code: `REC-${seq}` } } })) ||
            (await tx.postDatedCheque.findFirst({ where: { tenantId, receiptCode: `REC-${seq}` } }))
          ) {
            seq++;
          }
          receiptCode = `REC-${seq}`;
        }
      }

      const existing = await tx.receipt.findUnique({
        where: { tenantId_code: { tenantId, code: receiptCode } },
      });
      if (existing) {
        if (existing.status === 'VOID') {
          throw new BadRequestException(`Receipt number ${receiptCode} was VOIDED and cannot be reused.`);
        }
        throw new BadRequestException(`Receipt number ${receiptCode} already exists.`);
      }

      const existingPdc = await tx.postDatedCheque.findFirst({
        where: { tenantId, receiptCode },
      });
      if (existingPdc) {
        throw new BadRequestException(`Receipt number ${receiptCode} already exists for another PDC.`);
      }

      let propertyId: string | null = input.propertyId || null;
      if (!propertyId && input.invoiceId) {
        const invoice = await tx.invoice.findUnique({ where: { id: input.invoiceId } });
        if (invoice?.propertyId) {
          propertyId = invoice.propertyId;
        }
      }
      if (!propertyId && input.customerId) {
        const ownership = await tx.ownership.findFirst({
          where: { tenantId, customerId: input.customerId, status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
        });
        if (ownership?.propertyId) {
          propertyId = ownership.propertyId;
        }
      }

      // If method is PDC, record as PostDatedCheque and mark invoice as PDC
      if (input.method === 'PDC') {
        const dueDate = input.chequeDate
          ? new Date(input.chequeDate)
          : (input.receivedAt ? new Date(input.receivedAt) : new Date());

        const pdc = await tx.postDatedCheque.create({
          data: {
            tenantId,
            customerId: input.customerId,
            bank: input.bankName ?? null,
            chequeNo: input.chequeNumber ?? null,
            amount: input.amount as any,
            dueDate,
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

        return {
          id: pdc.id,
          code: receiptCode,
          amount: input.amount,
          method: 'PDC',
          isPdc: true,
          status: 'RECEIVED',
          customer: { id: input.customerId },
          invoice: input.invoiceId ? { id: input.invoiceId } : null,
          property: propertyId ? { id: propertyId } : null,
        };
      }

      const receipt = await tx.receipt.create({
        data: {
          tenantId,
          code: receiptCode,
          category,
          invoiceId: input.invoiceId,
          customerId: input.customerId,
          propertyId,
          amount: input.amount,
          method: input.method,
          reference: input.reference,
          notes: input.notes,
          receivedAt: input.receivedAt ?? new Date(),
          bankName: input.bankName,
          chequeNumber: input.chequeNumber,
          chequeDate: input.chequeDate,
          slipNumber: input.slipNumber,
        },
      });

      let remainingAmount = Number(input.amount);
      const allocations: Array<{ invoiceId: string; invoiceCode: string; amount: number }> = [];

      // 1. Target specific invoice if provided
      if (input.invoiceId) {
        const targetInvoice = await tx.invoice.findUnique({ where: { id: input.invoiceId } });
        if (targetInvoice) {
          if (targetInvoice.status === 'VOID') {
            throw new BadRequestException(`Cannot apply payment to a VOID invoice (${targetInvoice.code})`);
          }
          const targetBalance = Number(targetInvoice.total) - Number(targetInvoice.paid);
          if (targetBalance > 0) {
            const allocate = Math.min(remainingAmount, targetBalance);
            remainingAmount -= allocate;
            const newPaid = Number(targetInvoice.paid) + allocate;
            const isPaid = newPaid >= Number(targetInvoice.total);
            
            allocations.push({ invoiceId: targetInvoice.id, invoiceCode: targetInvoice.code, amount: allocate });

            await tx.invoice.update({
              where: { id: targetInvoice.id },
              data: { paid: newPaid, status: isPaid ? 'PAID' : 'PARTIAL' },
            });
          }
        }
      }

      // 2. Waterfall auto-allocate any remaining surplus to other unpaid invoices for the same property
      if (remainingAmount > 0 && propertyId) {
        const invoiceTypeFilter = category === 'DEVELOPMENT'
          ? { type: 'DEVELOPMENT_CHARGE' as const }
          : { type: { not: 'DEVELOPMENT_CHARGE' as const } };

        const unpaidInvoices = await tx.invoice.findMany({
          where: {
            tenantId,
            propertyId,
            ...invoiceTypeFilter,
            status: { in: ['PENDING', 'PARTIAL', 'OVERDUE', 'BOUNCED'] },
          },
          orderBy: { dueDate: 'asc' }, // Oldest first
        });

        for (const inv of unpaidInvoices) {
          if (remainingAmount <= 0) break;
          if (inv.id === input.invoiceId) continue; // Already processed above

          const balance = Number(inv.total) - Number(inv.paid);
          if (balance > 0) {
            const allocate = Math.min(remainingAmount, balance);
            remainingAmount -= allocate;
            const newPaid = Number(inv.paid) + allocate;
            const isPaid = newPaid >= Number(inv.total);
            
            allocations.push({ invoiceId: inv.id, invoiceCode: inv.code, amount: allocate });

            await tx.invoice.update({
              where: { id: inv.id },
              data: { paid: newPaid, status: isPaid ? 'PAID' : 'PARTIAL' },
            });
          }
        }
      }

      // 3. If preliminary invoices (Booking / Confirmation) are now paid, generate any pending installments!
      if (propertyId && category !== 'DEVELOPMENT') {
        const generatedInvoices = await this.paymentPlansService.checkAndGenerateInstallments(tenantId, propertyId, tx);

        // If new installment invoices were generated and there is surplus cash, waterfall into them
        if (generatedInvoices.length > 0 && remainingAmount > 0) {
          for (const inv of generatedInvoices) {
            if (remainingAmount <= 0) break;

            const balance = Number(inv.total) - Number(inv.paid);
            if (balance > 0) {
              const allocate = Math.min(remainingAmount, balance);
              remainingAmount -= allocate;
              const newPaid = Number(inv.paid) + allocate;
              const isPaid = newPaid >= Number(inv.total);

              allocations.push({ invoiceId: inv.id, invoiceCode: inv.code, amount: allocate });

              await tx.invoice.update({
                where: { id: inv.id },
                data: { paid: newPaid, status: isPaid ? 'PAID' : 'PARTIAL' },
              });
            }
          }
        }
      }

      if (allocations.length > 0) {
        await tx.receipt.update({
          where: { id: receipt.id },
          data: { allocations },
        });
        (receipt as any).allocations = allocations;
      }

      return receipt;
    });
  }

  async update(tenantId: string, id: string, input: UpdateReceiptDto, user: any) {
    if (!user || user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only SUPER_ADMIN can edit generated receipts');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Locate receipt
      const receipt = await tx.receipt.findFirst({
        where: {
          id,
          ...(tenantId && tenantId !== 'all' ? { tenantId } : {}),
        },
        include: {
          invoice: true,
          property: true,
          customer: true,
        },
      });

      if (!receipt) {
        throw new NotFoundException(`Receipt ${id} not found`);
      }

      const receiptTenantId = receipt.tenantId;

      // 2. Validate Code if changed
      let newCode = receipt.code;
      if (input.code && input.code.trim() !== receipt.code) {
        const trimmedCode = input.code.trim();
        const existing = await tx.receipt.findUnique({
          where: { tenantId_code: { tenantId: receiptTenantId, code: trimmedCode } },
        });
        if (existing && existing.id !== receipt.id) {
          throw new BadRequestException(`Receipt number ${trimmedCode} already exists.`);
        }
        newCode = trimmedCode;
      }

      const oldAmount = Number(receipt.amount);
      const newAmount = input.amount !== undefined ? Number(input.amount) : oldAmount;
      if (isNaN(newAmount) || newAmount <= 0) {
        throw new BadRequestException('Receipt amount must be a positive number');
      }

      // 3. Revert previous allocations from invoices
      if (receipt.allocations && Array.isArray(receipt.allocations)) {
        for (const alloc of receipt.allocations as any[]) {
          if (alloc.invoiceId && alloc.amount) {
            const inv = await tx.invoice.findUnique({ where: { id: alloc.invoiceId } });
            if (inv) {
              const restoredPaid = Math.max(0, Number(inv.paid) - Number(alloc.amount));
              const isPaid = restoredPaid >= Number(inv.total);
              const isPartial = restoredPaid > 0 && !isPaid;
              const newStatus = isPaid ? 'PAID' : (isPartial ? 'PARTIAL' : (new Date(inv.dueDate) < new Date() ? 'OVERDUE' : 'PENDING'));
              await tx.invoice.update({
                where: { id: inv.id },
                data: {
                  paid: restoredPaid,
                  status: newStatus,
                },
              });
            }
          }
        }
      }

      // 4. Re-allocate the new amount
      let remainingAmount = newAmount;
      const newAllocations: Array<{ invoiceId: string; invoiceCode: string; amount: number }> = [];
      const propertyId = receipt.propertyId;
      const category = receipt.category || 'INSTALLMENT';

      // 4a. Target invoice if originally linked
      if (receipt.invoiceId) {
        const targetInvoice = await tx.invoice.findUnique({ where: { id: receipt.invoiceId } });
        if (targetInvoice && targetInvoice.status !== 'VOID') {
          const targetBalance = Number(targetInvoice.total) - Number(targetInvoice.paid);
          if (targetBalance > 0) {
            const allocate = Math.min(remainingAmount, targetBalance);
            remainingAmount -= allocate;
            const newPaid = Number(targetInvoice.paid) + allocate;
            const isPaid = newPaid >= Number(targetInvoice.total);

            newAllocations.push({ invoiceId: targetInvoice.id, invoiceCode: targetInvoice.code, amount: allocate });

            await tx.invoice.update({
              where: { id: targetInvoice.id },
              data: { paid: newPaid, status: isPaid ? 'PAID' : 'PARTIAL' },
            });
          }
        }
      }

      // 4b. Waterfall surplus to other unpaid invoices for this property
      if (remainingAmount > 0 && propertyId) {
        const invoiceTypeFilter = category === 'DEVELOPMENT'
          ? { type: 'DEVELOPMENT_CHARGE' as const }
          : { type: { not: 'DEVELOPMENT_CHARGE' as const } };

        const unpaidInvoices = await tx.invoice.findMany({
          where: {
            tenantId: receiptTenantId,
            propertyId,
            ...invoiceTypeFilter,
            status: { in: ['PENDING', 'PARTIAL', 'OVERDUE', 'BOUNCED'] },
          },
          orderBy: { dueDate: 'asc' },
        });

        for (const inv of unpaidInvoices) {
          if (remainingAmount <= 0) break;
          if (inv.id === receipt.invoiceId) continue;

          const balance = Number(inv.total) - Number(inv.paid);
          if (balance > 0) {
            const allocate = Math.min(remainingAmount, balance);
            remainingAmount -= allocate;
            const newPaid = Number(inv.paid) + allocate;
            const isPaid = newPaid >= Number(inv.total);

            newAllocations.push({ invoiceId: inv.id, invoiceCode: inv.code, amount: allocate });

            await tx.invoice.update({
              where: { id: inv.id },
              data: { paid: newPaid, status: isPaid ? 'PAID' : 'PARTIAL' },
            });
          }
        }
      }

      // 4c. Check if preliminary milestones (Booking / Confirmation) were satisfied to unlock installments
      if (propertyId && category !== 'DEVELOPMENT') {
        const generatedInvoices = await this.paymentPlansService.checkAndGenerateInstallments(receiptTenantId, propertyId, tx);
        if (generatedInvoices.length > 0 && remainingAmount > 0) {
          for (const inv of generatedInvoices) {
            if (remainingAmount <= 0) break;
            const balance = Number(inv.total) - Number(inv.paid);
            if (balance > 0) {
              const allocate = Math.min(remainingAmount, balance);
              remainingAmount -= allocate;
              const newPaid = Number(inv.paid) + allocate;
              const isPaid = newPaid >= Number(inv.total);

              newAllocations.push({ invoiceId: inv.id, invoiceCode: inv.code, amount: allocate });

              await tx.invoice.update({
                where: { id: inv.id },
                data: { paid: newPaid, status: isPaid ? 'PAID' : 'PARTIAL' },
              });
            }
          }
        }
      }

      // 5. Update PDC if linked
      if (receipt.method === 'PDC' || receipt.method === 'CHEQUE') {
        await tx.postDatedCheque.updateMany({
          where: { tenantId: receiptTenantId, receiptCode: receipt.code },
          data: {
            ...(input.amount !== undefined && { amount: newAmount as any }),
            ...(input.bankName !== undefined && { bank: input.bankName }),
            ...(input.chequeNumber !== undefined && { chequeNo: input.chequeNumber }),
            ...(input.chequeDate !== undefined && { dueDate: input.chequeDate ? new Date(input.chequeDate) : null }),
            ...(newCode !== receipt.code && { receiptCode: newCode }),
          },
        });
      }

      // 6. Update the Receipt
      const updatedReceipt = await tx.receipt.update({
        where: { id: receipt.id },
        data: {
          code: newCode,
          amount: newAmount,
          ...(input.receivedAt !== undefined && { receivedAt: new Date(input.receivedAt) }),
          ...(input.method !== undefined && { method: input.method }),
          ...(input.reference !== undefined && { reference: input.reference }),
          ...(input.bankName !== undefined && { bankName: input.bankName }),
          ...(input.chequeNumber !== undefined && { chequeNumber: input.chequeNumber }),
          ...(input.chequeDate !== undefined && { chequeDate: input.chequeDate ? new Date(input.chequeDate) : null }),
          ...(input.slipNumber !== undefined && { slipNumber: input.slipNumber }),
          ...(input.notes !== undefined && { notes: input.notes }),
          allocations: newAllocations,
        },
        include: {
          customer: { select: { fullName: true, code: true, email: true, phone: true } },
          invoice: { select: { code: true, total: true, paid: true, status: true, type: true } },
          property: { select: { code: true, type: true, sizeSqYd: true, block: true } },
        },
      });

      // 7. Audit Log
      try {
        await tx.auditLog.create({
          data: {
            tenantId: receiptTenantId,
            userId: user.id,
            action: 'UPDATE_RECEIPT',
            entity: 'Receipt',
            entityId: receipt.id,
            changes: {
              oldCode: receipt.code,
              newCode,
              oldAmount,
              newAmount,
              oldDate: receipt.receivedAt,
              newDate: input.receivedAt,
              oldMethod: receipt.method,
              newMethod: input.method,
              previousAllocations: receipt.allocations,
              newAllocations,
            },
          },
        });
      } catch {}

      // 8. Invalidate cached PDF in storage
      try {
        await this.storage.delete(`receipts/${receipt.id}.pdf`);
        await this.storage.delete(`receipts/${receipt.code}.pdf`);
        if (newCode !== receipt.code) {
          await this.storage.delete(`receipts/${newCode}.pdf`);
        }
      } catch {}

      return updatedReceipt;
    });
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { customer: true, tenantAccess: true },
    });
  }

  async get(tenantId: string, id: string) {
    let rc = await this.prisma.receipt.findFirst({
      where: {
        ...(tenantId && tenantId !== 'all' ? { tenantId } : {}),
        OR: [{ id }, { code: id }],
      },
      include: {
        customer: { select: { fullName: true, code: true, email: true, nationalId: true, phone: true, mobile: true, fatherName: true, address: true } },
        invoice:  { select: { code: true, total: true, paid: true, status: true, type: true } },
        property: { select: { code: true, type: true, sizeSqYd: true, block: true } },
        PlotCancellation: true,
        PlotMerge: true,
        OwnershipTransfer: {
          include: {
            from: { select: { fullName: true, code: true } },
            to: { select: { fullName: true, code: true } },
            property: { select: { code: true, type: true } },
          },
        },
      },
    });

    if (!rc) {
      rc = await this.prisma.receipt.findFirst({
        where: {
          OR: [{ id }, { code: id }],
        },
        include: {
          customer: { select: { fullName: true, code: true, email: true, nationalId: true, phone: true, mobile: true, fatherName: true, address: true } },
          invoice:  { select: { code: true, total: true, paid: true, status: true, type: true } },
          property: { select: { code: true, type: true, sizeSqYd: true, block: true } },
          PlotCancellation: true,
          PlotMerge: true,
          OwnershipTransfer: {
            include: {
              from: { select: { fullName: true, code: true } },
              to: { select: { fullName: true, code: true } },
              property: { select: { code: true, type: true } },
            },
          },
        },
      });
    }

    return rc;
  }


  /** Generate a Receipt PDF from the schema fields and persist idempotently */
  async generateReceiptPdf(tenantId: string, id: string): Promise<Buffer | null> {
    const receipt = await this.get(tenantId, id);
    if (!receipt) return null;

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });

    const brand = {
      orgName: process.env.BRAND_NAME || tenant?.name || 'Gulshan e Fatima',
      orgSubtitle: process.env.BRAND_SUBTITLE || '',
      orgAddress: process.env.BRAND_ADDRESS || '',
    };

    const builder = new PdfBuilder(brand);
    const { doc, endToBuffer } = builder.createDoc();

    // 1 inch = 72 pt; 2.0 inch header blank = 144 pt; 0.5 inch footer blank = 36 pt
    const HEADER_BLANK_PT = 144; // 2.0 inches for letterhead header (top spacing 2in, bottom spacing 0.5in)

    const drawHalf = (offsetY: number, copyType: string) => {
      const rightX = doc.page.width - 48;
      const isRefund = receipt.category === 'REFUND' || receipt.category === 'CANCELLATION' || receipt.code.startsWith('REF-') || !!(receipt as any).PlotCancellation;
      const isMerge = receipt.category === 'MERGE_ADJUSTMENT' || receipt.category === 'MERGE' || receipt.code.startsWith('MRG-') || !!(receipt as any).PlotMerge;
      const isDev = receipt.category === 'DEVELOPMENT' || receipt.code.startsWith('DEV-') || receipt.invoice?.type === 'DEVELOPMENT_CHARGE';
      const isTransfer = receipt.category === 'TRANSFER_FEE' || receipt.category === 'TRANSFER' || receipt.code.startsWith('TRF-') || !!(receipt as any).OwnershipTransfer;
      const receiptTitle = isRefund ? 'CANCELLATION & REFUND VOUCHER' : (isMerge ? 'PLOT MERGE & ADJUSTMENT VOUCHER' : (isDev ? 'DEVELOPMENT RECEIPT' : (isTransfer ? 'TRANSFER FEE RECEIPT' : 'RECEIPT')));
      const isVoid = receipt.status === 'VOID';
      const displayStatus = isVoid ? 'VOID' : (receipt.status === 'POSTED' ? 'PAID' : receipt.status);
      const statusColor = isVoid ? '#dc2626' : '#15803d';

      // Content starts strictly after 1.5 inch header blank space
      const contentTop = offsetY + HEADER_BLANK_PT;

      if (isVoid) {
        doc.save();
        doc.fontSize(36).font('Helvetica-Bold').fillColor('#dc2626', 0.25).text('VOID / CANCELLED', 48, contentTop + 45, { align: 'center', width: doc.page.width - 96 });
        doc.restore();
      }

      // 1. Heading in center and small
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#000').text(receiptTitle, 48, contentTop + 4, { align: 'center', width: doc.page.width - 96 });

      // 2. Symmetrical Boxes on Left and Right
      const boxW = 155;
      const boxH = 38;
      const leftX = 48;
      const rightBoxX = rightX - boxW;
      const boxY = contentTop + 22;

      // Left Box: Serial No & Date
      doc.rect(leftX, boxY, boxW, boxH).strokeColor('#333').lineWidth(0.85).stroke();
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#000').text('Serial No:', leftX + 8, boxY + 7);
      doc.font('Helvetica').fillColor('#000').text(receipt.code, leftX + 58, boxY + 7);
      doc.font('Helvetica-Bold').fillColor('#000').text('Date:', leftX + 8, boxY + 21);
      doc.font('Helvetica').fillColor('#000').text(new Date(receipt.receivedAt).toLocaleDateString('en-GB'), leftX + 58, boxY + 21);

      // Right Box: Copy Type & Status (same in a box)
      doc.rect(rightBoxX, boxY, boxW, boxH).strokeColor('#333').lineWidth(0.85).stroke();
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#111').text(copyType, rightBoxX, boxY + 6, { width: boxW, align: 'center' });
      doc.fontSize(8).font('Helvetica-Bold').fillColor(statusColor).text(`Status: ${displayStatus}`, rightBoxX, boxY + 21, { width: boxW, align: 'center' });

      // 3. Body Grid
      const startY = contentTop + 68;
      const rowH = 19;
      const totalTableH = 6 * rowH; // 114 pt
      doc.rect(48, startY, doc.page.width - 96, totalTableH).strokeColor('#333').lineWidth(0.85).stroke();

      const drawRow = (label: string, val: string, rowIndex: number, isLast = false) => {
        const yPos = startY + (rowIndex * rowH) + 5;
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#333').text(label, 58, yPos);
        doc.font('Helvetica').fontSize(8.5).fillColor('#000').text(val, 200, yPos, { width: rightX - 210, ellipsis: true });
        if (!isLast) {
          const lineY = startY + ((rowIndex + 1) * rowH);
          doc.moveTo(48, lineY).lineTo(rightX, lineY).strokeColor('#e5e5e5').lineWidth(0.75).stroke();
        }
      };

      const customerLabel = isRefund ? 'Paid / Refunded To:' : (isTransfer ? 'Received From (Buyer):' : 'Received With Thanks From:');
      let customerName = receipt.customer?.fullName ?? '—';
      if (isTransfer && (receipt as any).OwnershipTransfer) {
        const transfer = (receipt as any).OwnershipTransfer;
        const buyerName = transfer.to?.fullName || receipt.customer?.fullName || '—';
        const sellerName = transfer.from?.fullName || '';
        customerName = sellerName ? `${buyerName} (Transferred from: ${sellerName.trim()})` : buyerName;
      }
      drawRow(customerLabel, customerName, 0);

      const plotCode = receipt.property?.code ?? (receipt as any).OwnershipTransfer?.property?.code ?? 'N/A';
      drawRow('Property / Plot:', plotCode, 1);

      const amountFmt = 'Rs. ' + Number(receipt.amount).toLocaleString('en-US', { minimumFractionDigits: 2 });
      drawRow('Amount:', amountFmt, 2);

      const amountWords = numberToWords(Math.floor(Number(receipt.amount))) + ' Rupees Only';
      drawRow('Amount in Words:', amountWords, 3);

      const isCheque = receipt.method === 'PDC' || receipt.method === 'CHEQUE';
      const paymentDetails = isCheque
        ? `${receipt.method} (No: ${receipt.chequeNumber || '-'}, Date: ${receipt.chequeDate ? new Date(receipt.chequeDate).toLocaleDateString('en-GB') : '-'})`
        : (receipt.bankName ? `${receipt.method} (${receipt.bankName})` : receipt.method);
      drawRow('Payment Method:', paymentDetails, 4);

      // Row 5: Notes - for refund voucher, strictly only the reason; for others, reference or notes
      let notesText = '—';
      if (isRefund || isMerge) {
        let reason = receipt.notes || (receipt as any).PlotCancellation?.reason || (receipt as any).PlotMerge?.reason || (receipt as any).cancellation?.reason || (receipt as any).merge?.reason || '';
        if (reason.includes('Reason:')) {
          reason = reason.split('Reason:')[1].trim();
        }
        notesText = reason || '—';
      } else if (isTransfer) {
        notesText = receipt.reference || receipt.notes || `Transfer fee for Plot ${plotCode}`;
      } else {
        notesText = receipt.reference || receipt.notes || '—';
      }
      drawRow('Notes:', notesText, 5, true);

      // 4. Signatures
      const sigY = startY + totalTableH + 28;
      doc.moveTo(80, sigY).lineTo(210, sigY).strokeColor('#000').lineWidth(0.85).stroke();
      doc.font('Helvetica').fontSize(8.5).fillColor('#000').text('Accountant Signature', 80, sigY + 4, { width: 130, align: 'center' });

      doc.moveTo(rightX - 130, sigY).lineTo(rightX, sigY).strokeColor('#000').lineWidth(0.85).stroke();
      const rightSigLabel = isRefund ? 'Receiver Signature' : 'Authorized Signature';
      doc.text(rightSigLabel, rightX - 130, sigY + 4, { width: 130, align: 'center' });
    };

    const midY = doc.page.height / 2;

    // Draw Office Copy (0 to midY, with 2in top header blank and 0.5in bottom footer blank)
    drawHalf(0, 'Office Copy');

    // Dashed divider line between halves
    doc.moveTo(20, midY).lineTo(doc.page.width - 20, midY).dash(4, { space: 4 }).strokeColor('#aaa').lineWidth(0.75).stroke().undash();

    // Draw Customer Copy (midY to height, with 2in top header blank and 0.5in bottom footer blank)
    drawHalf(midY, 'Customer Copy');

    const pdfBuffer = await endToBuffer();

    try {
      await this.storage.putPdfIdempotent(pdfBuffer, {
        tenantId,
        keyHint: `receipts/${id}.pdf`,
        idempotencyKey: `receipt:${id}:pdf:v11`,
        ttlDays: 365,
      });
    } catch (err: any) {
      // Storage failure must never prevent receipt PDF from returning to user
      // eslint-disable-next-line no-console
      console.warn(`[receipts] could not store pdf in storage: ${err?.message || err}`);
    }

    return pdfBuffer;
  }
  async healthz() {
    return { ok: true, module: 'receipts', ts: Date.now() };
  }
}

function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const format = (n: number): string => {
    if (n < 20) return a[n];
    const digit = n % 10;
    return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : ' ');
  };
  
  let str = '';
  
  if (num >= 10000000) {
    str += format(Math.floor(num / 10000000)) + 'Crore ';
    num %= 10000000;
  }
  if (num >= 100000) {
    str += format(Math.floor(num / 100000)) + 'Lakh ';
    num %= 100000;
  }
  if (num >= 1000) {
    str += format(Math.floor(num / 1000)) + 'Thousand ';
    num %= 1000;
  }
  if (num >= 100) {
    str += format(Math.floor(num / 100)) + 'Hundred ';
    num %= 100;
  }
  if (num > 0) {
    str += format(Math.floor(num));
  }
  return str.trim();
}

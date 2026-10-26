import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ExecuteCancellationDto {
  propertyId: string;
  totalPaid: number;
  totalDues: number;
  deductionPercent: number;
  deductionAmount: number;
  refundAmount: number;
  refundMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'ONLINE' | 'PDC';
  refundReference?: string;
  refundReceiptCode?: string;
  bankName?: string;
  chequeNumber?: string;
  chequeDate?: string;
  reason?: string;
  notes?: string;
  refundDate?: string;
}

@Injectable()
export class CancellationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List plots with dues / defaulters with summary metrics
   */
  async listPlotsWithDues(
    tenantId: string,
    opts?: { filter?: string; q?: string; page?: number; limit?: number },
  ) {
    const now = new Date();
    const page = opts?.page || 1;
    const limit = opts?.limit || 50;

    // Fetch all properties that have an active owner (endDate: null)
    const activeProperties = await this.prisma.property.findMany({
      where: {
        tenantId,
        ownerships: {
          some: { endDate: null },
        },
      },
      include: {
        ownerships: {
          where: { endDate: null },
          include: {
            customer: {
              select: {
                id: true,
                code: true,
                fullName: true,
                phone: true,
                mobile: true,
                nationalId: true,
                email: true,
              },
            },
          },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
        invoices: {
          where: {
            status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
          },
          select: {
            id: true,
            code: true,
            type: true,
            dueDate: true,
            total: true,
            paid: true,
            status: true,
            customerId: true,
          },
          orderBy: { dueDate: 'asc' },
        },
        receipts: {
          where: {
            status: 'POSTED',
            category: { not: 'REFUND' },
          },
          select: {
            id: true,
            amount: true,
            category: true,
            receivedAt: true,
            customerId: true,
          },
          orderBy: { receivedAt: 'desc' },
        },
      },
      orderBy: { code: 'asc' },
    });

    const list: any[] = [];
    let totalOverdueAmount = 0;
    let criticalDefaultersCount = 0;
    let totalPlotsWithDuesCount = 0;

    for (const prop of activeProperties) {
      const activeOwnership = prop.ownerships[0];
      if (!activeOwnership || !activeOwnership.customer) continue;

      const customer = activeOwnership.customer;

      // Filter invoices for current active customer
      const customerInvoices = prop.invoices.filter((inv) => inv.customerId === customer.id);
      
      // Calculate unpaid invoices and overdue invoices
      let totalDues = 0;
      let overdueDues = 0;
      let oldestOverdueDate: Date | null = null;
      let overdueCount = 0;

      for (const inv of customerInvoices) {
        const balance = Math.max(0, Number(inv.total) - Number(inv.paid));
        if (balance > 0) {
          totalDues += balance;
          if (new Date(inv.dueDate) <= now) {
            overdueDues += balance;
            overdueCount++;
            if (!oldestOverdueDate || new Date(inv.dueDate) < oldestOverdueDate) {
              oldestOverdueDate = new Date(inv.dueDate);
            }
          }
        }
      }

      // Calculate days overdue
      let daysOverdue = 0;
      if (oldestOverdueDate) {
        daysOverdue = Math.max(0, Math.floor((now.getTime() - oldestOverdueDate.getTime()) / (1000 * 60 * 60 * 24)));
      }

      // Total Paid receipts (all categories: installments + dev charges for this customer & property)
      const customerReceipts = prop.receipts.filter((r) => r.customerId === customer.id);
      const totalPaid = customerReceipts.reduce((sum, r) => sum + Number(r.amount), 0);
      const lastPaymentDate = customerReceipts.length > 0 ? customerReceipts[0].receivedAt : null;

      const isDefaulter = daysOverdue >= 20; // Official 20-day Gulshan-e-Fatima default condition
      if (isDefaulter) criticalDefaultersCount++;
      if (totalDues > 0) totalPlotsWithDuesCount++;
      totalOverdueAmount += overdueDues;

      const item = {
        propertyId: prop.id,
        propertyCode: prop.code,
        propertyTitle: prop.title,
        propertyType: prop.type,
        block: prop.block,
        sizeSqYd: prop.sizeSqYd ? Number(prop.sizeSqYd) : null,
        totalPrice: prop.totalPrice ? Number(prop.totalPrice) : 0,
        status: prop.status,
        customer: {
          id: customer.id,
          code: customer.code,
          fullName: customer.fullName,
          phone: customer.phone || customer.mobile || '',
          nationalId: customer.nationalId || '',
          email: customer.email || '',
        },
        totalPaid,
        totalDues,
        overdueDues,
        overdueInvoicesCount: overdueCount,
        unpaidInvoicesCount: customerInvoices.length,
        daysOverdue,
        isDefaulter,
        lastPaymentDate,
      };

      // Filter logic
      const filter = opts?.filter || 'all_dues';
      let passesFilter = true;

      if (filter === 'overdue') {
        passesFilter = overdueDues > 0;
      } else if (filter === 'defaulters') {
        passesFilter = isDefaulter;
      } else if (filter === 'all_dues') {
        passesFilter = totalDues > 0;
      } else if (filter === 'all_active') {
        passesFilter = true;
      }

      // Search query filter (matches plot code, customer name, phone, CNIC)
      if (passesFilter && opts?.q) {
        const query = opts.q.toLowerCase().trim();
        const matchesCode = prop.code.toLowerCase().includes(query);
        const matchesName = (customer.fullName || '').toLowerCase().includes(query);
        const matchesPhone = (customer.phone || customer.mobile || '').includes(query);
        const matchesCnic = (customer.nationalId || '').includes(query);
        passesFilter = matchesCode || matchesName || matchesPhone || matchesCnic;
      }

      if (passesFilter) {
        list.push(item);
      }
    }

    // Sort by days overdue descending (defaulters first), then by overdue dues descending
    list.sort((a, b) => {
      if (b.daysOverdue !== a.daysOverdue) return b.daysOverdue - a.daysOverdue;
      return b.overdueDues - a.overdueDues;
    });

    const totalCancellationsCount = await this.prisma.plotCancellation.count({ where: { tenantId } });

    // Pagination
    const total = list.length;
    const startIndex = (page - 1) * limit;
    const paginatedList = list.slice(startIndex, startIndex + limit);

    return {
      data: paginatedList,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      metrics: {
        totalPlotsWithDues: totalPlotsWithDuesCount,
        totalOverdueAmount,
        criticalDefaultersCount,
        totalCancellationsCount,
      },
    };
  }

  /**
   * Search active booked/sold properties (for voluntary/mutual cancellation of ANY plot)
   */
  async searchActiveProperties(tenantId: string, q?: string) {
    const where: any = {
      tenantId,
      ownerships: {
        some: { endDate: null },
      },
    };

    if (q && q.trim()) {
      const term = q.trim();
      where.OR = [
        { code: { contains: term, mode: 'insensitive' } },
        { title: { contains: term, mode: 'insensitive' } },
        { ownerships: { some: { endDate: null, customer: { fullName: { contains: term, mode: 'insensitive' } } } } },
        { ownerships: { some: { endDate: null, customer: { nationalId: { contains: term, mode: 'insensitive' } } } } },
      ];
    }

    const properties = await this.prisma.property.findMany({
      where,
      take: 20,
      include: {
        ownerships: {
          where: { endDate: null },
          include: {
            customer: { select: { id: true, code: true, fullName: true, nationalId: true, phone: true } },
          },
          take: 1,
        },
      },
      orderBy: { code: 'asc' },
    });

    return properties.map((p) => ({
      id: p.id,
      code: p.code,
      title: p.title,
      type: p.type,
      totalPrice: Number(p.totalPrice || 0),
      status: p.status,
      customer: p.ownerships[0]?.customer || null,
    }));
  }

  /**
   * Preview cancellation calculation for a property
   */
  async previewCancellation(tenantId: string, propertyId: string) {
    const property = await this.prisma.property.findFirst({
      where: { tenantId, id: propertyId },
      include: {
        ownerships: {
          where: { endDate: null },
          include: {
            customer: true,
          },
          take: 1,
        },
        invoices: {
          orderBy: { dueDate: 'asc' },
        },
        receipts: {
          where: {
            status: 'POSTED',
            category: { not: 'REFUND' },
          },
          orderBy: { receivedAt: 'desc' },
        },
      },
    });

    if (!property) throw new NotFoundException('Property not found');
    const activeOwnership = property.ownerships[0];
    if (!activeOwnership || !activeOwnership.customer) {
      throw new BadRequestException('Property has no active owner');
    }

    const customer = activeOwnership.customer;
    const now = new Date();

    // Property receipts (installments + dev charges for all previous and current allottees)
    const allPropertyReceipts = property.receipts;
    const totalPaid = allPropertyReceipts.reduce((sum, r) => sum + Number(r.amount), 0);

    // Customer invoices
    const customerInvoices = property.invoices.filter((inv) => inv.customerId === customer.id);
    let totalDues = 0;
    let overdueDues = 0;
    let oldestDueDate: Date | null = null;

    const unpaidInvoices = customerInvoices
      .map((inv) => {
        const balance = Math.max(0, Number(inv.total) - Number(inv.paid));
        const isPastDue = new Date(inv.dueDate) <= now;
        if (balance > 0) {
          totalDues += balance;
          if (isPastDue) {
            overdueDues += balance;
            if (!oldestDueDate || new Date(inv.dueDate) < oldestDueDate) {
              oldestDueDate = new Date(inv.dueDate);
            }
          }
        }
        return {
          id: inv.id,
          code: inv.code,
          type: inv.type,
          dueDate: inv.dueDate,
          total: Number(inv.total),
          paid: Number(inv.paid),
          balance,
          status: inv.status,
          isPastDue,
        };
      })
      .filter((inv) => inv.balance > 0);

    let daysOverdue = 0;
    if (oldestDueDate) {
      daysOverdue = Math.max(0, Math.floor((now.getTime() - (oldestDueDate as any).getTime()) / (1000 * 60 * 60 * 24)));
    }

    // Default 20% deduction calculation
    const defaultDeductionPercent = 20;
    const defaultDeductionAmount = Math.round(totalPaid * (defaultDeductionPercent / 100));
    const defaultRefundAmount = Math.max(0, totalPaid - defaultDeductionAmount);

    // Next refund voucher number
    const cancellationCount = await this.prisma.plotCancellation.count({ where: { tenantId } });
    const suggestedVoucherCode = 'REF-' + String(cancellationCount + 1).padStart(4, '0');

    return {
      property: {
        id: property.id,
        code: property.code,
        title: property.title,
        type: property.type,
        block: property.block,
        sizeSqYd: property.sizeSqYd ? Number(property.sizeSqYd) : null,
        totalPrice: Number(property.totalPrice || 0),
        status: property.status,
      },
      customer: {
        id: customer.id,
        code: customer.code,
        fullName: customer.fullName,
        nationalId: customer.nationalId,
        phone: customer.phone || customer.mobile,
        address: customer.address,
      },
      allotmentDate: activeOwnership.startDate,
      financials: {
        totalPrice: Number(property.totalPrice || 0),
        totalPaid,
        totalDues,
        overdueDues,
        daysOverdue,
        isDefaulter: daysOverdue >= 20,
        defaultDeductionPercent,
        defaultDeductionAmount,
        defaultRefundAmount,
        suggestedVoucherCode,
      },
      unpaidInvoices,
      receipts: allPropertyReceipts.map((r) => ({
        id: r.id,
        code: r.code,
        amount: Number(r.amount),
        category: r.category,
        method: r.method,
        receivedAt: r.receivedAt,
      })),
    };
  }

  /**
   * Execute Plot Cancellation & Issue Refund (Atomic Transaction)
   */
  async executeCancellation(tenantId: string, input: ExecuteCancellationDto, user?: any) {
    const property = await this.prisma.property.findFirst({
      where: { tenantId, id: input.propertyId },
      include: {
        ownerships: {
          where: { endDate: null },
          include: { customer: true },
          take: 1,
        },
      },
    });

    if (!property) throw new NotFoundException('Property not found');
    const activeOwnership = property.ownerships[0];
    if (!activeOwnership || !activeOwnership.customer) {
      throw new BadRequestException('Property has no active owner to cancel');
    }

    const customer = activeOwnership.customer;
    const cancellationDate = input.refundDate ? new Date(input.refundDate) : new Date();

    // Determine refund receipt code
    let receiptCode = (input.refundReceiptCode || '').trim();
    if (!receiptCode) {
      const count = await this.prisma.plotCancellation.count({ where: { tenantId } });
      receiptCode = 'REF-' + String(count + 1).padStart(4, '0');
    }

    // Check if receiptCode already exists and safely increment
    let existingReceipt = await this.prisma.receipt.findUnique({
      where: { tenantId_code: { tenantId, code: receiptCode } },
    });
    while (existingReceipt) {
      const numMatch = receiptCode.match(/\d+$/);
      if (numMatch) {
        const nextNum = parseInt(numMatch[0], 10) + 1;
        receiptCode = receiptCode.replace(/\d+$/, String(nextNum).padStart(numMatch[0].length, '0'));
      } else {
        receiptCode = `${receiptCode}-${Date.now().toString().slice(-4)}`;
      }
      existingReceipt = await this.prisma.receipt.findUnique({
        where: { tenantId_code: { tenantId, code: receiptCode } },
      });
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Terminate current active ownership
      await tx.ownership.update({
        where: { id: activeOwnership.id },
        data: { endDate: cancellationDate },
      });

      // 2. Set property status to AVAILABLE (ready for immediate re-allocation)
      await tx.property.update({
        where: { id: property.id },
        data: { status: 'AVAILABLE' },
      });

      // 3. Mark ALL invoices for ALL current and previous owners on this property as VOID
      await tx.invoice.updateMany({
        where: {
          tenantId,
          propertyId: property.id,
        },
        data: {
          status: 'VOID',
          notes: 'Voided upon plot cancellation on ' + cancellationDate.toLocaleDateString('en-GB'),
        },
      });

      // 3b. Mark ALL prior receipts for ALL current and previous owners on this property as VOID
      // (Receipt records remain intact in DB so their numbers cannot be reused)
      await tx.receipt.updateMany({
        where: {
          tenantId,
          propertyId: property.id,
          category: { not: 'REFUND' },
        },
        data: {
          status: 'VOID',
          notes: 'Voided upon plot cancellation on ' + cancellationDate.toLocaleDateString('en-GB'),
        },
      });

      // 4. Generate Refund Receipt / Payment Voucher
      const refundReceipt = await tx.receipt.create({
        data: {
          tenantId,
          code: receiptCode,
          category: 'REFUND',
          propertyId: property.id,
          customerId: customer.id,
          amount: input.refundAmount,
          method: input.refundMethod,
          bankName: input.bankName || null,
          chequeNumber: input.chequeNumber || null,
          chequeDate: input.chequeDate ? new Date(input.chequeDate) : null,
          reference: input.refundReference || null,
          receivedAt: cancellationDate,
          status: 'POSTED',
          notes: input.reason || '',
        },
      });

      // 5. Create PlotCancellation record
      const plotCancellation = await tx.plotCancellation.create({
        data: {
          tenantId,
          propertyId: property.id,
          customerId: customer.id,
          receiptId: refundReceipt.id,
          totalPrice: input.totalPaid + input.totalDues,
          totalPaid: input.totalPaid,
          totalDues: input.totalDues,
          deductionPercent: input.deductionPercent,
          deductionAmount: input.deductionAmount,
          refundAmount: input.refundAmount,
          refundMethod: input.refundMethod,
          refundReference: input.refundReference || null,
          bankName: input.bankName || null,
          chequeNumber: input.chequeNumber || null,
          chequeDate: input.chequeDate ? new Date(input.chequeDate) : null,
          cancelledAt: cancellationDate,
          reason: input.reason || 'Plot Cancellation & Refund',
          notes: input.notes || null,
          cancelledBy: user?.name || user?.email || 'Admin',
        },
      });

      // 6. Write AuditLog
      await tx.auditLog.create({
        data: {
          tenantId,
          userId: user?.id || null,
          action: 'CANCEL_ALLOTMENT',
          entity: 'Property',
          entityId: property.id,
          reason: input.reason || 'Plot Cancellation & Refund',
          changes: {
            propertyCode: property.code,
            previousOwner: { id: customer.id, name: customer.fullName },
            totalPaid: input.totalPaid,
            deductionPercent: input.deductionPercent,
            deductionAmount: input.deductionAmount,
            refundAmount: input.refundAmount,
            refundReceiptCode: refundReceipt.code,
            newPropertyStatus: 'AVAILABLE',
          },
        },
      });

      return {
        success: true,
        cancellationId: plotCancellation.id,
        receiptId: refundReceipt.id,
        receiptCode: refundReceipt.code,
        propertyId: property.id,
        propertyCode: property.code,
        refundAmount: input.refundAmount,
        customerName: customer.fullName,
      };
    });
  }

  /**
   * List cancellation history
   */
  async listHistory(
    tenantId: string,
    opts?: { q?: string; page?: number; limit?: number },
  ) {
    const page = opts?.page || 1;
    const limit = opts?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (opts?.q) {
      const q = opts.q.trim();
      where.OR = [
        { Property: { code: { contains: q, mode: 'insensitive' } } },
        { Customer: { fullName: { contains: q, mode: 'insensitive' } } },
        { Customer: { nationalId: { contains: q, mode: 'insensitive' } } },
        { refundReference: { contains: q, mode: 'insensitive' } },
        { chequeNumber: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.plotCancellation.count({ where }),
      this.prisma.plotCancellation.findMany({
        where,
        orderBy: { cancelledAt: 'desc' },
        skip,
        take: limit,
        include: {
          Property: {
            select: { id: true, code: true, title: true, type: true, status: true },
          },
          Customer: {
            select: { id: true, code: true, fullName: true, nationalId: true, phone: true },
          },
          Receipt: {
            select: { id: true, code: true, amount: true, method: true, status: true },
          },
        },
      }),
    ]);

    const formattedData = data.map((item: any) => ({
      ...item,
      property: item.Property || item.property,
      customer: item.Customer || item.customer,
      receipt: item.Receipt || item.receipt,
    }));

    return {
      data: formattedData,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single cancellation record by ID, propertyId, or plot code (with previous and new allottee)
   */
  async getCancellation(tenantId: string, id: string) {
    let record = await this.prisma.plotCancellation.findFirst({
      where: {
        ...(tenantId && tenantId !== 'all' ? { tenantId } : {}),
        OR: [
          { id },
          { propertyId: id },
          { Property: { code: { equals: id, mode: 'insensitive' } } },
        ],
      },
      orderBy: { cancelledAt: 'desc' },
      include: {
        Property: {
          include: {
            ownerships: {
              orderBy: { startDate: 'asc' },
              include: { customer: true },
            },
          },
        },
        Customer: true,
        Receipt: true,
      },
    });

    if (!record) {
      record = await this.prisma.plotCancellation.findFirst({
        where: {
          OR: [
            { id },
            { propertyId: id },
            { Property: { code: { equals: id, mode: 'insensitive' } } },
          ],
        },
        orderBy: { cancelledAt: 'desc' },
        include: {
          Property: {
            include: {
              ownerships: {
                orderBy: { startDate: 'asc' },
                include: { customer: true },
              },
            },
          },
          Customer: true,
          Receipt: true,
        },
      });
    }

    if (!record) throw new NotFoundException('Cancellation record not found');

    const property = (record as any).Property || (record as any).property;
    const customer = (record as any).Customer || (record as any).customer;
    const receipt = (record as any).Receipt || (record as any).receipt;

    let newAllottee = null;
    if (property && property.ownerships) {
      const subsequentOwnerships = property.ownerships.filter(
        (o: any) =>
          o.customerId !== record.customerId &&
          (new Date(o.startDate) >= new Date(record.cancelledAt) || !o.endDate),
      );
      if (subsequentOwnerships.length > 0) {
        newAllottee = subsequentOwnerships[0].customer;
      }
    }

    return {
      ...record,
      property,
      customer,
      receipt,
      newAllottee,
    };
  }
}

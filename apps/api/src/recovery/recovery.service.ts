import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AllocationMethod } from '../dto/recovery.dto';
import { InvoiceType } from '@prisma/client';

@Injectable()
export class RecoveryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Allocate expenses from a pool to properties
   */
  async allocateExpensePool(
    tenantId: string,
    poolId: string,
    method: AllocationMethod,
    options?: {
      propertyIds?: string[];
      fixedAllocations?: Record<string, number>;
      chargeTitle?: string;
      chargeDate?: Date;
    },
  ) {
    // Get pool with expenses
    const pool = await this.prisma.expensePool.findFirst({
      where: { tenantId, id: poolId },
      include: {
        expenses: {
          where: { status: 'POSTED' }, // Only allocate posted expenses
        },
      },
    });

    if (!pool) throw new NotFoundException('Expense pool not found');

    // Calculate total expenses
    const totalExpenses = pool.expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

    if (totalExpenses === 0) {
      throw new BadRequestException('No posted expenses in pool to allocate');
    }

    // Get properties to allocate to
    const properties = await this.getPropertiesForAllocation(tenantId, options?.propertyIds);

    if (properties.length === 0) {
      throw new BadRequestException('No properties found for allocation');
    }

    // Calculate allocations based on method
    const allocations = this.calculateAllocations(
      totalExpenses,
      properties,
      method,
      options?.fixedAllocations,
    );

    // Create recovery charges
    const chargeDate = options?.chargeDate || new Date();
    const chargeTitle = options?.chargeTitle || `Development Charges - ${pool.title}`;

    return this.prisma.$transaction(async (tx) => {
      const charges = [];

      for (const allocation of allocations) {
        const charge = await tx.recoveryCharge.create({
          data: {
            tenantId,
            poolId: pool.id,
            propertyId: allocation.propertyId,
            title: chargeTitle,
            description: `Allocated from ${pool.title}`,
            amount: allocation.amount,
            chargeDate,
            allocationMethod: method,
            allocationShare: allocation.share,
          },
          include: {
            property: { select: { id: true, code: true, title: true } },
          },
        });

        charges.push(charge);
      }

      return {
        poolId: pool.id,
        poolTitle: pool.title,
        totalExpenses,
        totalAllocated: allocations.reduce((sum, a) => sum + a.amount, 0),
        allocationMethod: method,
        charges,
      };
    });
  }

  /**
   * Generate invoices from recovery charges
   */
  async generateRecoveryInvoices(
    tenantId: string,
    poolId: string,
    options?: {
      propertyIds?: string[];
      issueDate?: Date;
      dueDate?: Date;
    },
  ) {
    // Get recovery charges that don't have invoices yet
    const charges = await this.prisma.recoveryCharge.findMany({
      where: {
        tenantId,
        poolId,
        invoiceId: null,
        ...(options?.propertyIds ? { propertyId: { in: options.propertyIds } } : {}),
      },
      include: {
        property: true,
      },
    });

    if (charges.length === 0) {
      throw new BadRequestException('No uninvoiced recovery charges found');
    }

    const issueDate = options?.issueDate || new Date();
    const dueDate = options?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    return this.prisma.$transaction(async (tx) => {
      const invoices = [];

      for (const charge of charges) {
        // Get current owner
        const ownership = await tx.ownership.findFirst({
          where: {
            tenantId,
            propertyId: charge.propertyId,
            endDate: null,
          },
          orderBy: { startDate: 'desc' },
        });

        if (!ownership) {
          console.warn(`No active owner for property ${charge.property.code}, skipping invoice`);
          continue;
        }

        // Generate invoice code
        const invoiceCount = await tx.invoice.count({ where: { tenantId } });
        const invoiceCode = `INV-DEV-${String(invoiceCount + 1).padStart(6, '0')}`;

        // Create invoice
        const invoice = await tx.invoice.create({
          data: {
            tenantId,
            propertyId: charge.propertyId,
            customerId: ownership.customerId,
            code: invoiceCode,
            type: InvoiceType.DEVELOPMENT_CHARGE,
            issueDate,
            dueDate,
            currency: 'PKR',
            subtotal: charge.amount,
            tax: 0,
            total: charge.amount,
            paid: 0,
            status: 'PENDING',
            notes: `Development charges from ${charge.title}`,
          },
          include: {
            customer: { select: { id: true, code: true, fullName: true } },
            property: { select: { id: true, code: true, title: true } },
          },
        });

        // Link invoice to recovery charge
        await tx.recoveryCharge.update({
          where: { id: charge.id },
          data: { invoiceId: invoice.id },
        });

        invoices.push(invoice);
      }

      return {
        generated: invoices.length,
        invoices,
      };
    });
  }

  /**
   * Get allocation summary for a pool
   */
  async getAllocationSummary(tenantId: string, poolId: string) {
    const pool = await this.prisma.expensePool.findFirst({
      where: { tenantId, id: poolId },
      include: {
        expenses: {
          where: { status: 'POSTED' },
        },
        recoveries: {
          include: {
            property: { select: { id: true, code: true, title: true } },
          },
        },
      },
    });

    if (!pool) throw new NotFoundException('Expense pool not found');

    const totalExpenses = pool.expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const totalAllocated = pool.recoveries.reduce((sum, rec) => sum + Number(rec.amount), 0);

    // Get current owners for each property
    const allocations = await Promise.all(
      pool.recoveries.map(async (rec) => {
        const ownership = await this.prisma.ownership.findFirst({
          where: {
            tenantId,
            propertyId: rec.propertyId,
            endDate: null,
          },
          include: {
            customer: { select: { id: true, fullName: true } },
          },
          orderBy: { startDate: 'desc' },
        });

        return {
          propertyId: rec.property.id,
          propertyCode: rec.property.code,
          propertyTitle: rec.property.title,
          amount: Number(rec.amount),
          share: Number(rec.allocationShare || 0),
          customerId: ownership?.customer.id,
          customerName: ownership?.customer.fullName,
          invoiceId: rec.invoiceId,
        };
      }),
    );

    return {
      poolId: pool.id,
      poolTitle: pool.title,
      totalExpenses,
      totalAllocated,
      allocationMethod: pool.recoveries[0]?.allocationMethod || 'N/A',
      allocations,
    };
  }

  /**
   * Delete recovery charges (only if no invoices generated)
   */
  async deleteAllocations(tenantId: string, poolId: string) {
    const charges = await this.prisma.recoveryCharge.findMany({
      where: { tenantId, poolId },
    });

    const hasInvoices = charges.some((c) => c.invoiceId !== null);

    if (hasInvoices) {
      throw new BadRequestException('Cannot delete allocations with generated invoices');
    }

    await this.prisma.recoveryCharge.deleteMany({
      where: { tenantId, poolId },
    });

    return { deleted: charges.length, poolId };
  }

  // ========== Private Helper Methods ==========

  private async getPropertiesForAllocation(tenantId: string, propertyIds?: string[]) {
    return this.prisma.property.findMany({
      where: {
        tenantId,
        ...(propertyIds ? { id: { in: propertyIds } } : {}),
        status: { in: ['RESERVED', 'BOOKED', 'SOLD'] }, // Only allocate to booked/sold/reserved properties
      },
      select: {
        id: true,
        code: true,
        title: true,
        sizeSqYd: true,
      },
    });
  }

  private calculateAllocations(
    totalAmount: number,
    properties: Array<{ id: string; code: string; title: string; sizeSqYd: any }>,
    method: AllocationMethod,
    fixedAllocations?: Record<string, number>,
  ) {
    switch (method) {
      case AllocationMethod.BY_COUNT:
        return this.allocateByCount(totalAmount, properties);

      case AllocationMethod.BY_SIZE:
        return this.allocateBySize(totalAmount, properties);

      case AllocationMethod.FIXED:
        if (!fixedAllocations) {
          throw new BadRequestException('Fixed allocations required for FIXED method');
        }
        return this.allocateFixed(properties, fixedAllocations);

      default:
        throw new BadRequestException('Invalid allocation method');
    }
  }

  private allocateByCount(
    totalAmount: number,
    properties: Array<{ id: string; code: string; title: string }>,
  ) {
    const perProperty = totalAmount / properties.length;
    const share = 1 / properties.length;

    return properties.map((prop) => ({
      propertyId: prop.id,
      amount: perProperty,
      share,
    }));
  }

  private allocateBySize(
    totalAmount: number,
    properties: Array<{ id: string; code: string; title: string; sizeSqYd: any }>,
  ) {
    const totalSize = properties.reduce((sum, p) => sum + Number(p.sizeSqYd || 0), 0);

    if (totalSize === 0) {
      throw new BadRequestException('Cannot allocate by size: total size is zero');
    }

    return properties.map((prop) => {
      const size = Number(prop.sizeSqYd || 0);
      const share = size / totalSize;
      const amount = totalAmount * share;

      return {
        propertyId: prop.id,
        amount,
        share,
      };
    });
  }

  private allocateFixed(
    properties: Array<{ id: string; code: string; title: string }>,
    fixedAllocations: Record<string, number>,
  ) {
    const allocations = [];

    for (const prop of properties) {
      const amount = fixedAllocations[prop.id];

      if (amount === undefined) {
        throw new BadRequestException(`No fixed allocation specified for property ${prop.code}`);
      }

      allocations.push({
        propertyId: prop.id,
        amount,
        share: 0, // Not applicable for fixed
      });
    }

    return allocations;
  }
}

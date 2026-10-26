import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentPlanDto, PlanComponentType } from '../dto/payment-plans.dto';
import { addMonths } from 'date-fns';
import { InvoiceType } from '@prisma/client';

const TYPE_MAP: Record<PlanComponentType, InvoiceType> = {
  [PlanComponentType.BOOKING]: InvoiceType.BOOKING,
  [PlanComponentType.CONFIRMATION]: InvoiceType.CONFIRMATION,
  [PlanComponentType.INSTALLMENT]: InvoiceType.INSTALLMENT,
  [PlanComponentType.HALF_YEARLY]: InvoiceType.HALF_YEARLY,
  [PlanComponentType.YEARLY]: InvoiceType.YEARLY,
};

@Injectable()
export class PaymentPlansService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all payment plans for a property
   */
  async listByProperty(tenantId: string, propertyId: string) {
    return this.prisma.paymentPlan.findMany({
      where: { tenantId, propertyId },
      include: {
        property: { select: { id: true, code: true, title: true } },
        installments: { orderBy: { seq: 'asc' }, take: 5 },
        _count: { select: { installments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single payment plan with all installments
   */
  async get(tenantId: string, planId: string) {
    const plan = await this.prisma.paymentPlan.findFirst({
      where: { tenantId, id: planId },
      include: {
        property: { select: { id: true, code: true, title: true } },
        installments: {
          orderBy: { seq: 'asc' },
          include: {
            invoice: { select: { id: true, code: true, status: true, paid: true, total: true } },
          },
        },
      },
    });

    if (!plan) throw new NotFoundException('Payment plan not found');
    return plan;
  }

  /**
   * Create a payment plan with components and optionally generate invoices
   */
  async create(tenantId: string, dto: CreatePaymentPlanDto, txParam?: any) {
    const db = txParam || this.prisma;

    // Validate property exists
    const property = await db.property.findFirst({
      where: { tenantId, id: dto.propertyId },
    });
    if (!property) throw new NotFoundException('Property not found');

    // Get current owner
    const ownership = await db.ownership.findFirst({
      where: { tenantId, propertyId: dto.propertyId, endDate: null },
      orderBy: { startDate: 'desc' },
    });
    if (!ownership) throw new BadRequestException('Property has no active owner');

    const customerId = ownership.customerId;

    // Calculate total expected terms
    const totalTerms = dto.components.reduce((sum, c) => sum + c.terms, 0);

    const executePlan = async (tx: any) => {
      // Create the plan
      const plan = await tx.paymentPlan.create({
        data: {
          tenantId,
          propertyId: dto.propertyId,
          title: dto.title,
          totalAmount: dto.totalAmount,
          currency: dto.currency || 'PKR',
          startDate: new Date(dto.startDate),
          expectedTerms: totalTerms,
        },
      });

      // Generate installments for each component
      let seq = 1;
      let currentDate = new Date(dto.startDate);

      for (const component of dto.components) {
        const componentStartDate = component.startDate ? new Date(component.startDate) : currentDate;
        const amountPerTerm = component.amount / component.terms;
        const invoiceType = TYPE_MAP[component.type] || InvoiceType.INSTALLMENT;

        for (let i = 0; i < component.terms; i++) {
          const dueDate = addMonths(componentStartDate, i);

          await tx.planInstallment.create({
            data: {
              tenantId,
              planId: plan.id,
              seq,
              dueDate,
              amount: amountPerTerm,
              type: invoiceType,
            },
          });

          seq++;
        }

        // Move current date forward for next component
        currentDate = addMonths(componentStartDate, component.terms);
      }

      // Auto-generate invoices if requested
      if (dto.autoGenerateInvoices !== false) {
        await this.generateInvoices(tenantId, plan.id, customerId, dto.components, tx);
      }

      // Check if plan has preliminary components (Booking / Confirmation / Half-Yearly)
      const hasPreliminary = dto.components.some(
        (c) =>
          c.type === PlanComponentType.BOOKING ||
          c.type === PlanComponentType.CONFIRMATION ||
          c.type === PlanComponentType.HALF_YEARLY,
      );

      // If preliminary components exist, ensure property status is RESERVED
      if (hasPreliminary) {
        await tx.property.update({
          where: { id: dto.propertyId },
          data: { status: 'RESERVED' },
        });
      }

      return plan;
    };

    if (txParam) {
      return executePlan(txParam);
    } else {
      return this.prisma.$transaction(executePlan);
    }
  }

  /**
   * Generate initial invoices from plan installments.
   * If the plan contains preliminary components (BOOKING or HALF_YEARLY/Confirmation),
   * only those invoices are generated upfront.
   * Installments are only generated once booking & confirmation are paid.
   */
  async generateInvoices(
    tenantId: string,
    planId: string,
    customerId: string,
    components: CreatePaymentPlanDto['components'],
    tx?: any,
  ) {
    const db = tx || this.prisma;

    const plan = await db.paymentPlan.findFirst({
      where: { tenantId, id: planId },
      include: { installments: { orderBy: { seq: 'asc' } } },
    });

    if (!plan) throw new NotFoundException('Payment plan not found');

    const hasPreliminary = components.some(
      (c) =>
        c.type === PlanComponentType.BOOKING ||
        c.type === PlanComponentType.CONFIRMATION ||
        c.type === PlanComponentType.HALF_YEARLY,
    );

    let installmentIndex = 0;

    for (const component of components) {
      const invoiceType = TYPE_MAP[component.type];

      const shouldGenerateUpfront =
        !hasPreliminary ||
        component.type === PlanComponentType.BOOKING ||
        component.type === PlanComponentType.CONFIRMATION ||
        component.type === PlanComponentType.HALF_YEARLY;

      if (!shouldGenerateUpfront) {
        installmentIndex += component.terms;
        continue;
      }

      for (let i = 0; i < component.terms; i++) {
        const installment = plan.installments[installmentIndex];
        if (!installment) break;

        // Check if invoice already exists
        const existing = await db.invoice.findFirst({
          where: { tenantId, installmentId: installment.id },
        });

        if (!existing) {
          const invoiceCode = await this.generateInvoiceCode(tenantId, db);

          await db.invoice.create({
            data: {
              tenantId,
              propertyId: plan.propertyId,
              customerId,
              installmentId: installment.id,
              code: invoiceCode,
              type: invoiceType,
              issueDate: new Date(),
              dueDate: installment.dueDate,
              currency: plan.currency,
              subtotal: installment.amount,
              tax: 0,
              total: installment.amount,
              paid: 0,
              status: 'PENDING',
            },
          });
        }

        installmentIndex++;
      }
    }
  }

  /**
   * Check if preliminary milestone invoices (BOOKING and Confirmation/HALF_YEARLY) are PAID,
   * and if so, update property status to SOLD and generate the remaining installment invoices for the property payment plan.
   */
  async checkAndGenerateInstallments(tenantId: string, propertyId: string, txParam?: any): Promise<any[]> {
    const db = txParam || this.prisma;

    // 1. Find prerequisite invoices for this property (BOOKING and CONFIRMATION / HALF_YEARLY)
    const prereqInvoices = await db.invoice.findMany({
      where: {
        tenantId,
        propertyId,
        type: { in: [InvoiceType.BOOKING, InvoiceType.CONFIRMATION, InvoiceType.HALF_YEARLY] },
        status: { not: 'VOID' },
      },
    });

    // If there are prerequisite invoices, ALL of them must be PAID.
    // If there are none, prerequisites are considered satisfied.
    const hasPrereqs = prereqInvoices.length > 0;
    const allPrereqsPaid = hasPrereqs
      ? prereqInvoices.every((inv: any) => inv.status === 'PAID')
      : true;

    // If prerequisite invoices exist and NOT all are paid:
    // Property status MUST be RESERVED (not SOLD)
    if (hasPrereqs && !allPrereqsPaid) {
      const prop = await db.property.findUnique({
        where: { id: propertyId },
        select: { status: true },
      });
      if (prop && prop.status !== 'RESERVED' && prop.status !== 'CANCELLED' && prop.status !== 'IN_TRANSFER') {
        await db.property.update({
          where: { id: propertyId },
          data: { status: 'RESERVED' },
        });
      }
      return []; // Do not generate installments yet
    }

    // Both booking and confirmation (and any preliminary components) are PAID!
    // Update property status to SOLD
    const currentProp = await db.property.findUnique({
      where: { id: propertyId },
      select: { status: true },
    });
    if (currentProp && currentProp.status !== 'SOLD' && currentProp.status !== 'CANCELLED' && currentProp.status !== 'IN_TRANSFER') {
      await db.property.update({
        where: { id: propertyId },
        data: { status: 'SOLD' },
      });
    }

    // 2. Find the active payment plan for this property
    const plan = await db.paymentPlan.findFirst({
      where: { tenantId, propertyId },
      orderBy: { createdAt: 'desc' },
      include: {
        installments: {
          orderBy: { seq: 'asc' },
          include: { invoice: true },
        },
      },
    });

    if (!plan) return [];

    // 3. Find ungenerated installments (installments without an invoice)
    const ungenerated = plan.installments.filter((inst: any) => !inst.invoice);
    if (ungenerated.length === 0) {
      return []; // All installments already have invoices
    }

    // 4. Prerequisites are satisfied! Get current owner customerId
    const ownership = await db.ownership.findFirst({
      where: { tenantId, propertyId, endDate: null },
      orderBy: { startDate: 'desc' },
    });
    const customerId = ownership?.customerId || prereqInvoices[0]?.customerId;
    if (!customerId) return [];

    // 5. Generate invoices for the ungenerated installments
    const generatedInvoices: any[] = [];

    for (const installment of ungenerated) {
      const invoiceCode = await this.generateInvoiceCode(tenantId, db);
      const invoiceType = installment.type || InvoiceType.INSTALLMENT;

      const newInvoice = await db.invoice.create({
        data: {
          tenantId,
          propertyId: plan.propertyId,
          customerId,
          installmentId: installment.id,
          code: invoiceCode,
          type: invoiceType,
          issueDate: new Date(),
          dueDate: installment.dueDate,
          currency: plan.currency,
          subtotal: installment.amount,
          tax: 0,
          total: installment.amount,
          paid: 0,
          status: 'PENDING',
        },
      });

      generatedInvoices.push(newInvoice);
    }

    return generatedInvoices;
  }

  /**
   * Generate unique invoice code safely without collision
   */
  private async generateInvoiceCode(tenantId: string, db: any): Promise<string> {
    const lastInvoice = await db.invoice.findFirst({
      where: { tenantId, code: { startsWith: 'INV-' } },
      orderBy: { code: 'desc' },
      select: { code: true },
    });

    let nextNum = 1;
    if (lastInvoice?.code) {
      const match = lastInvoice.code.match(/^INV-(\d+)$/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }

    while (
      await db.invoice.findUnique({
        where: { tenantId_code: { tenantId, code: `INV-${String(nextNum).padStart(6, '0')}` } },
      })
    ) {
      nextNum++;
    }

    return `INV-${String(nextNum).padStart(6, '0')}`;
  }

  /**
   * Delete a payment plan (only if no invoices are paid)
   */
  async delete(tenantId: string, planId: string) {
    const plan = await this.prisma.paymentPlan.findFirst({
      where: { tenantId, id: planId },
      include: {
        installments: {
          include: { invoice: true },
        },
      },
    });

    if (!plan) throw new NotFoundException('Payment plan not found');

    // Check if any invoices are paid
    const hasPaidInvoices = plan.installments.some(
      (inst) => inst.invoice && Number(inst.invoice.paid) > 0,
    );

    if (hasPaidInvoices) {
      throw new BadRequestException('Cannot delete plan with paid invoices');
    }

    return this.prisma.$transaction(async (tx) => {
      // Delete invoices first
      const invoiceIds = plan.installments
        .filter((inst) => inst.invoice)
        .map((inst) => inst.invoice!.id);

      if (invoiceIds.length > 0) {
        await tx.invoice.deleteMany({
          where: { id: { in: invoiceIds } },
        });
      }

      // Delete installments
      await tx.planInstallment.deleteMany({
        where: { planId: plan.id },
      });

      // Delete plan
      await tx.paymentPlan.delete({
        where: { id: plan.id },
      });

      return { deleted: true, planId: plan.id };
    });
  }
}

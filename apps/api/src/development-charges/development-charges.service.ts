import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

function findInvoiceForPhase(devInvoices: any[], phase: number) {
  if (phase === 1) {
    const p1 = devInvoices.find((inv) => {
      if (inv.code && inv.code.includes("-P1-")) return true;
      if (inv.notes && /(?:Development Charges|Phase)\s*1(?!\d)/i.test(inv.notes)) return true;
      return false;
    });
    if (p1) return p1;

    const legacy = devInvoices.find((inv) => {
      if (inv.code && /-P([2-9]|\d{2,})-/i.test(inv.code)) return false;
      if (inv.notes && /(?:Development Charges|Phase)\s*([2-9]|\d{2,})/i.test(inv.notes)) return false;
      return true;
    });
    return legacy || null;
  }

  return devInvoices.find((inv) => {
    if (inv.code && inv.code.includes(`-P${phase}-`)) return true;
    if (inv.notes) {
      const match = inv.notes.match(/(?:Development Charges|Phase)\s*(\d+)/i);
      if (match && parseInt(match[1], 10) === phase) return true;
    }
    return false;
  }) || null;
}

@Injectable()
export class DevelopmentChargesService {
  constructor(private readonly prisma: PrismaService) {}

  async getProperties(tenantId: string, search?: string, phase: number = 1) {
    const properties = await this.prisma.property.findMany({
      where: {
        tenantId,
        ...(search
          ? {
              OR: [
                { code: { contains: search, mode: "insensitive" as any } },
                { title: { contains: search, mode: "insensitive" as any } },
                { block: { contains: search, mode: "insensitive" as any } },
                {
                  ownerships: {
                    some: {
                      endDate: null,
                      customer: {
                        fullName: { contains: search, mode: "insensitive" as any },
                      },
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        ownerships: {
          where: { endDate: null },
          include: { customer: true },
        },
        invoices: {
          where: { type: "DEVELOPMENT_CHARGE" },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { code: "asc" },
    });

    // Discover existing phases across all development charge invoices
    const allDevInvoices = await this.prisma.invoice.findMany({
      where: { tenantId, type: "DEVELOPMENT_CHARGE" },
      select: { notes: true, code: true },
    });
    const phasesSet = new Set<number>([1]);
    for (const inv of allDevInvoices) {
      const matchNotes = inv.notes?.match(/(?:Development Charges|Phase)\s*(\d+)/i);
      const matchCode = inv.code?.match(/DEV-INV-P(\d+)-/i);
      if (matchNotes && matchNotes[1]) {
        phasesSet.add(parseInt(matchNotes[1], 10));
      } else if (matchCode && matchCode[1]) {
        phasesSet.add(parseInt(matchCode[1], 10));
      }
    }
    const availablePhases = Array.from(phasesSet).sort((a, b) => a - b);

    const items = properties.map((prop) => {
      const activeOwnership = prop.ownerships[0];
      const customer = activeOwnership?.customer || null;
      const devInvoices = prop.invoices;

      const phaseInvoice = findInvoiceForPhase(devInvoices, phase);

      let devChargeCost = 0;
      let status = "NOT_SET";
      let balance = 0;
      let paidAmount = 0;
      let invoicedAmount = 0;

      if (phaseInvoice) {
        devChargeCost = Number(phaseInvoice.total);
        invoicedAmount = Number(phaseInvoice.total);
        paidAmount = Number(phaseInvoice.paid);
        balance = Math.max(0, Number(phaseInvoice.total) - Number(phaseInvoice.paid));
        status = phaseInvoice.status;
      } else if (phase === 1 && Number(prop.developmentCharges || 0) > 0) {
        devChargeCost = Number(prop.developmentCharges);
        balance = devChargeCost;
        status = "PENDING";
      }

      return {
        id: prop.id,
        code: prop.code,
        title: prop.title,
        block: prop.block,
        sizeSqYd: prop.sizeSqYd ? Number(prop.sizeSqYd) : null,
        type: prop.type,
        phase,
        developmentCharges: devChargeCost,
        invoicedAmount,
        paidAmount,
        balance,
        status,
        customer: customer
          ? {
              id: customer.id,
              fullName: customer.fullName,
              code: customer.code,
              phone: customer.phone || customer.mobile,
            }
          : null,
        invoice: phaseInvoice
          ? {
              id: phaseInvoice.id,
              code: phaseInvoice.code,
              total: Number(phaseInvoice.total),
              paid: Number(phaseInvoice.paid),
              status: phaseInvoice.status,
              dueDate: phaseInvoice.dueDate,
            }
          : null,
      };
    });

    // Summary stats
    const totalProperties = items.length;
    const configuredProperties = items.filter((i) => i.developmentCharges > 0).length;
    const totalDevValue = items.reduce((sum, i) => sum + i.developmentCharges, 0);
    const totalCollected = items.reduce((sum, i) => sum + i.paidAmount, 0);
    const totalRemaining = items.reduce((sum, i) => sum + i.balance, 0);

    return {
      properties: items,
      phases: availablePhases,
      phase,
      summary: {
        totalProperties,
        configuredProperties,
        totalDevValue,
        totalCollected,
        totalRemaining,
      },
    };
  }

  async setPropertyCharge(
    tenantId: string,
    propertyId: string,
    input: { amount: number; dueDate?: string | Date; phase?: number },
  ) {
    const phase = Number(input.phase || 1);
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, tenantId },
      include: {
        ownerships: {
          where: { endDate: null },
          include: { customer: true },
        },
        invoices: {
          where: { type: "DEVELOPMENT_CHARGE" },
        },
      },
    });

    if (!property) {
      throw new NotFoundException("Property not found");
    }

    const amount = Number(input.amount);
    if (isNaN(amount) || amount < 0) {
      throw new BadRequestException("Invalid development charges amount");
    }

    // If phase 1, update property.developmentCharges for backwards compatibility
    if (phase === 1) {
      await this.prisma.property.update({
        where: { id: propertyId },
        data: { developmentCharges: amount },
      });
    }

    // Sync or create Development Charge invoice for this phase
    const activeOwnership = property.ownerships[0];
    const existingInvoice = findInvoiceForPhase(property.invoices, phase);

    let invoice = null;

    if (existingInvoice) {
      const paid = Number(existingInvoice.paid);
      const isPaid = paid >= amount && amount > 0;
      const isPartial = paid > 0 && paid < amount;
      const status = isPaid ? "PAID" : isPartial ? "PARTIAL" : "PENDING";

      invoice = await this.prisma.invoice.update({
        where: { id: existingInvoice.id },
        data: {
          subtotal: amount,
          total: amount,
          status: status as any,
          notes: `Development Charges ${phase}`,
          ...(input.dueDate ? { dueDate: new Date(input.dueDate) } : {}),
        },
      });
    } else if (activeOwnership && amount > 0) {
      const invoiceCode = phase === 1 ? `DEV-INV-${property.code}` : `DEV-INV-P${phase}-${property.code}`;
      const existingCode = await this.prisma.invoice.findUnique({
        where: { tenantId_code: { tenantId, code: invoiceCode } },
      });
      const finalCode = existingCode ? `${invoiceCode}-${Date.now().toString().slice(-4)}` : invoiceCode;

      const dueDate = input.dueDate
        ? new Date(input.dueDate)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      invoice = await this.prisma.invoice.create({
        data: {
          tenantId,
          propertyId,
          customerId: activeOwnership.customerId,
          code: finalCode,
          type: "DEVELOPMENT_CHARGE",
          issueDate: new Date(),
          dueDate,
          subtotal: amount,
          total: amount,
          paid: 0,
          status: "PENDING",
          notes: `Development Charges ${phase}`,
        },
      });
    }

    return {
      success: true,
      propertyId,
      phase,
      developmentCharges: amount,
      invoice,
    };
  }

  async bulkSetCharges(
    tenantId: string,
    input: { propertyIds: string[]; amount: number; dueDate?: string | Date; phase?: number },
  ) {
    if (!Array.isArray(input.propertyIds) || input.propertyIds.length === 0) {
      throw new BadRequestException("propertyIds must be a non-empty array");
    }

    const CHUNK_SIZE = 10;
    let count = 0;
    for (let i = 0; i < input.propertyIds.length; i += CHUNK_SIZE) {
      const chunk = input.propertyIds.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (pid) => {
          await this.setPropertyCharge(tenantId, pid, {
            amount: input.amount,
            dueDate: input.dueDate,
            phase: input.phase,
          });
          count++;
        }),
      );
    }

    return { success: true, updatedCount: count };
  }

  async getInvoices(
    tenantId: string,
    opts?: { status?: string; search?: string; page?: number; limit?: number },
  ) {
    const page = Number(opts?.page || 1);
    const limit = Number(opts?.limit || 50);
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      type: "DEVELOPMENT_CHARGE",
      ...(opts?.status && opts.status !== "ALL"
        ? { status: opts.status }
        : {}),
      ...(opts?.search
        ? {
            OR: [
              { code: { contains: opts.search, mode: "insensitive" as any } },
              { customer: { fullName: { contains: opts.search, mode: "insensitive" as any } } },
              { property: { code: { contains: opts.search, mode: "insensitive" as any } } },
            ],
          }
        : {}),
    };

    const [total, data, devSummaryAgg, statusGroupBy] = await Promise.all([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.findMany({
        where,
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        take: limit,
        skip,
        include: {
          customer: { select: { id: true, fullName: true, code: true } },
          property: { select: { id: true, code: true, title: true, block: true } },
        },
      }),
      this.prisma.invoice.aggregate({
        where: { tenantId, type: "DEVELOPMENT_CHARGE" },
        _sum: { total: true, paid: true },
        _count: { id: true },
      }),
      this.prisma.invoice.groupBy({
        by: ["status"],
        where: { tenantId, type: "DEVELOPMENT_CHARGE" },
        _count: { id: true },
      }),
    ]);

    const totalInvoices = devSummaryAgg._count.id ?? 0;
    const totalInvoiced = Number(devSummaryAgg._sum.total ?? 0);
    const totalPaid = Number(devSummaryAgg._sum.paid ?? 0);
    const totalBalance = Math.max(0, totalInvoiced - totalPaid);

    const statusCounts: Record<string, number> = {};
    for (const g of statusGroupBy) {
      statusCounts[g.status] = g._count.id;
    }

    return {
      data: data.map((inv) => ({
        id: inv.id,
        code: inv.code,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        total: Number(inv.total),
        paid: Number(inv.paid),
        balance: Math.max(0, Number(inv.total) - Number(inv.paid)),
        status: inv.status,
        notes: inv.notes,
        customer: inv.customer,
        property: inv.property,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      summary: {
        totalInvoices,
        totalInvoiced,
        totalPaid,
        totalBalance,
        pendingCount: statusCounts["PENDING"] || 0,
        partialCount: statusCounts["PARTIAL"] || 0,
        paidCount: statusCounts["PAID"] || 0,
      },
    };
  }

  async generateCharges(tenantId: string, input: { pricePerSqYd: number; title: string; dueDate: Date; phase?: number }) {
    const properties = await this.prisma.property.findMany({
      where: { tenantId },
      include: { ownerships: { where: { endDate: null } } },
    });

    const eligibleProperties = properties.filter((p) => p.sizeSqYd && p.ownerships?.[0]);
    const CHUNK_SIZE = 10;
    let count = 0;

    for (let i = 0; i < eligibleProperties.length; i += CHUNK_SIZE) {
      const chunk = eligibleProperties.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (property) => {
          const size = Number(property.sizeSqYd);
          const totalAmount = size * input.pricePerSqYd;
          await this.setPropertyCharge(tenantId, property.id, {
            amount: totalAmount,
            dueDate: input.dueDate,
            phase: input.phase,
          });
          count++;
        }),
      );
    }

    return { success: true, count };
  }
}

import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { PaymentPlansService } from "../payment-plans/payment-plans.service";
import { PreviewMergeDto } from "./dto/preview-merge.dto";
import { ExecuteMergeDto } from "./dto/execute-merge.dto";

@Injectable()
export class MergesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentPlansService: PaymentPlansService,
  ) {}

  /**
   * List customers who have more than 1 active plot (eligible for plot merge)
   */
  async getCandidates(tenantId: string, q?: string) {
    const customers = await this.prisma.customer.findMany({
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
            property: {
              include: {
                receipts: {
                  where: {
                    status: "POSTED",
                    category: { not: "REFUND" },
                  },
                },
                invoices: {
                  where: {
                    status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { fullName: "asc" },
    });

    const now = new Date();

    // Filter customers who own more than 1 active property
    const eligible = customers
      .filter((c) => c.ownerships.length > 1)
      .map((c) => {
        const properties = c.ownerships.map((o) => {
          const prop = o.property;
          const propReceipts = prop.receipts.filter((r) => r.customerId === c.id);
          const totalPaid = propReceipts.reduce((sum, r) => sum + Number(r.amount), 0);

          const propInvoices = prop.invoices.filter((inv) => inv.customerId === c.id);
          let totalDues = 0;
          let overdueDues = 0;

          for (const inv of propInvoices) {
            const bal = Math.max(0, Number(inv.total) - Number(inv.paid));
            totalDues += bal;
            if (new Date(inv.dueDate) <= now) {
              overdueDues += bal;
            }
          }

          return {
            id: prop.id,
            code: prop.code,
            title: prop.title,
            type: prop.type,
            block: prop.block,
            sizeSqYd: prop.sizeSqYd ? Number(prop.sizeSqYd) : null,
            totalPrice: prop.totalPrice ? Number(prop.totalPrice) : 0,
            status: prop.status,
            allotmentDate: o.startDate,
            totalPaid,
            totalDues,
            overdueDues,
            unpaidInvoicesCount: propInvoices.length,
          };
        });

        const grandTotalPaid = properties.reduce((sum, p) => sum + p.totalPaid, 0);
        const grandTotalDues = properties.reduce((sum, p) => sum + p.totalDues, 0);

        return {
          id: c.id,
          code: c.code,
          fullName: c.fullName,
          phone: c.phone || c.mobile || "",
          nationalId: c.nationalId || "",
          email: c.email || "",
          activePlotsCount: properties.length,
          grandTotalPaid,
          grandTotalDues,
          properties,
        };
      });

    if (!q || !q.trim()) {
      return eligible;
    }

    const term = q.toLowerCase().trim();
    return eligible.filter(
      (c) =>
        c.fullName.toLowerCase().includes(term) ||
        c.phone.includes(term) ||
        c.nationalId.includes(term) ||
        c.properties.some((p) => p.code.toLowerCase().includes(term))
    );
  }

  /**
   * Preview a merge transaction before executing
   */
  async previewMerge(tenantId: string, dto: PreviewMergeDto) {
    if (!dto.sourcePropertyIds || dto.sourcePropertyIds.length === 0) {
      throw new BadRequestException("At least one source plot must be selected for merge");
    }

    if (dto.sourcePropertyIds.includes(dto.targetPropertyId)) {
      throw new BadRequestException("Target plot cannot also be selected as a source plot");
    }

    const customer = await this.prisma.customer.findFirst({
      where: { tenantId, id: dto.customerId },
    });
    if (!customer) throw new NotFoundException("Customer not found");

    // Target Property
    const targetProperty = await this.prisma.property.findFirst({
      where: { tenantId, id: dto.targetPropertyId },
      include: {
        ownerships: {
          where: { customerId: dto.customerId, endDate: null },
        },
        invoices: {
          where: {
            customerId: dto.customerId,
            status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
          },
          orderBy: { dueDate: "asc" },
        },
        receipts: {
          where: {
            customerId: dto.customerId,
            status: "POSTED",
            category: { not: "REFUND" },
          },
        },
      },
    });

    if (!targetProperty || targetProperty.ownerships.length === 0) {
      throw new BadRequestException("Target plot is not actively owned by this customer");
    }

    const targetPaid = targetProperty.receipts.reduce((sum, r) => sum + Number(r.amount), 0);
    let targetDues = 0;
    const targetUnpaidInvoices = targetProperty.invoices.map((inv) => {
      const balance = Math.max(0, Number(inv.total) - Number(inv.paid));
      targetDues += balance;
      return {
        id: inv.id,
        code: inv.code,
        type: inv.type,
        dueDate: inv.dueDate,
        total: Number(inv.total),
        paid: Number(inv.paid),
        balance,
      };
    });

    // Source Properties
    const sourceProperties: any[] = [];
    let totalMergedAmount = 0;

    for (const sourceId of dto.sourcePropertyIds) {
      const prop = await this.prisma.property.findFirst({
        where: { tenantId, id: sourceId },
        include: {
          ownerships: {
            where: { customerId: dto.customerId, endDate: null },
          },
          receipts: {
            where: {
              customerId: dto.customerId,
              status: "POSTED",
              category: { not: "REFUND" },
            },
          },
          invoices: {
            where: {
              customerId: dto.customerId,
              status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
            },
          },
        },
      });

      if (!prop || prop.ownerships.length === 0) {
        throw new BadRequestException(`Source plot ${sourceId} is not actively owned by this customer`);
      }

      const paid = prop.receipts.reduce((sum, r) => sum + Number(r.amount), 0);
      const dues = prop.invoices.reduce((sum, i) => sum + Math.max(0, Number(i.total) - Number(i.paid)), 0);

      totalMergedAmount += paid;

      sourceProperties.push({
        id: prop.id,
        code: prop.code,
        title: prop.title,
        type: prop.type,
        totalPrice: Number(prop.totalPrice || 0),
        totalPaid: paid,
        totalDues: dues,
        receiptsCount: prop.receipts.length,
        invoicesCount: prop.invoices.length,
      });
    }

    const newTargetDues = Math.max(0, targetDues - totalMergedAmount);

    // Generate suggested receipt code
    const mergeCount = await this.prisma.plotMerge.count({ where: { tenantId } });
    const suggestedReceiptCode = "MRG-" + String(mergeCount + 1).padStart(4, "0");

    return {
      customer: {
        id: customer.id,
        code: customer.code,
        fullName: customer.fullName,
        nationalId: customer.nationalId,
        phone: customer.phone || customer.mobile,
      },
      targetProperty: {
        id: targetProperty.id,
        code: targetProperty.code,
        title: targetProperty.title,
        type: targetProperty.type,
        totalPrice: Number(targetProperty.totalPrice || 0),
        currentPaid: targetPaid,
        currentDues: targetDues,
        newDuesAfterMerge: newTargetDues,
        unpaidInvoices: targetUnpaidInvoices,
      },
      sourceProperties,
      financials: {
        totalMergedAmount,
        sourcePlotsCount: sourceProperties.length,
        suggestedReceiptCode,
      },
    };
  }

  /**
   * Execute Plot Merge & Consolidation (Atomic Transaction)
   */
  async executeMerge(tenantId: string, dto: ExecuteMergeDto, user?: any) {
    if (!dto.sourcePropertyIds || dto.sourcePropertyIds.length === 0) {
      throw new BadRequestException("At least one source plot must be selected for merge");
    }

    if (dto.sourcePropertyIds.includes(dto.targetPropertyId)) {
      throw new BadRequestException("Target plot cannot also be selected as a source plot");
    }

    const customer = await this.prisma.customer.findFirst({
      where: { tenantId, id: dto.customerId },
    });
    if (!customer) throw new NotFoundException("Customer not found");

    const targetProperty = await this.prisma.property.findFirst({
      where: { tenantId, id: dto.targetPropertyId },
      include: {
        ownerships: {
          where: { customerId: dto.customerId, endDate: null },
          take: 1,
        },
      },
    });

    if (!targetProperty || targetProperty.ownerships.length === 0) {
      throw new BadRequestException("Target plot is not actively owned by this customer");
    }

    const mergeDate = dto.receiptDate ? new Date(dto.receiptDate) : new Date();

    // Determine adjustment receipt code
    let receiptCode = (dto.receiptCode || "").trim();
    if (!receiptCode) {
      const count = await this.prisma.plotMerge.count({ where: { tenantId } });
      receiptCode = "MRG-" + String(count + 1).padStart(4, "0");
    }

    const existingReceipt = await this.prisma.receipt.findUnique({
      where: { tenantId_code: { tenantId, code: receiptCode } },
    });
    if (existingReceipt) {
      receiptCode = receiptCode + "-" + Date.now().toString().slice(-4);
    }

    return this.prisma.$transaction(async (tx) => {
      let totalMergedAmount = 0;
      const sourceDetails: any[] = [];
      const sourcePlotCodes: string[] = [];

      // 1. Process each source property
      for (const sourceId of dto.sourcePropertyIds) {
        const prop = await tx.property.findFirst({
          where: { tenantId, id: sourceId },
          include: {
            ownerships: {
              where: { customerId: dto.customerId, endDate: null },
              take: 1,
            },
          },
        });

        if (!prop || prop.ownerships.length === 0) {
          throw new BadRequestException(`Source plot ${sourceId} is not actively owned by this customer`);
        }

        sourcePlotCodes.push(prop.code);

        // Terminate ownership
        await tx.ownership.update({
          where: { id: prop.ownerships[0].id },
          data: { endDate: mergeDate },
        });

        // Set property status to AVAILABLE
        await tx.property.update({
          where: { id: prop.id },
          data: { status: "AVAILABLE" },
        });

        // Void all posted receipts on source property for this customer
        const sourceReceipts = await tx.receipt.findMany({
          where: {
            tenantId,
            propertyId: prop.id,
            customerId: dto.customerId,
            status: "POSTED",
            category: { not: "REFUND" },
          },
        });

        const paid = sourceReceipts.reduce((sum, r) => sum + Number(r.amount), 0);
        totalMergedAmount += paid;

        if (sourceReceipts.length > 0) {
          await tx.receipt.updateMany({
            where: { id: { in: sourceReceipts.map((r) => r.id) } },
            data: {
              status: "VOID",
              notes: `Voided upon merge into Plot ${targetProperty.code} on ${mergeDate.toLocaleDateString("en-GB")}`,
            },
          });
        }

        // Void all unpaid invoices on source property
        const sourceInvoices = await tx.invoice.findMany({
          where: {
            tenantId,
            propertyId: prop.id,
            customerId: dto.customerId,
            status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
          },
        });

        if (sourceInvoices.length > 0) {
          await tx.invoice.updateMany({
            where: { id: { in: sourceInvoices.map((i) => i.id) } },
            data: {
              status: "VOID",
              notes: `Voided upon merge into Plot ${targetProperty.code} on ${mergeDate.toLocaleDateString("en-GB")}`,
            },
          });
        }

        sourceDetails.push({
          propertyId: prop.id,
          propertyCode: prop.code,
          totalPaid: paid,
          voidedReceiptIds: sourceReceipts.map((r) => r.id),
          voidedReceiptCodes: sourceReceipts.map((r) => r.code),
          voidedInvoiceIds: sourceInvoices.map((i) => i.id),
        });
      }

      // 2. Create Adjustment Receipt on Target Property
      // Critical Rule: Notes contains ONLY the reason, nothing else!
      const receiptReason = (dto.reason || `Merged from Plot ${sourcePlotCodes.join(", ")}`).trim();

      const adjustmentReceipt = await tx.receipt.create({
        data: {
          tenantId,
          code: receiptCode,
          category: "MERGE_ADJUSTMENT",
          propertyId: targetProperty.id,
          customerId: dto.customerId,
          amount: totalMergedAmount,
          method: "CASH",
          reference: `Merged from ${sourcePlotCodes.join(", ")}`,
          receivedAt: mergeDate,
          status: "POSTED",
          notes: receiptReason, // ONLY REASON IN NOTES
        },
      });

      // 3. Waterfall Auto-Allocate into Target Property Invoices
      let remainingAmount = totalMergedAmount;
      const allocations: Array<{ invoiceId: string; invoiceCode: string; amount: number }> = [];

      const unpaidTargetInvoices = await tx.invoice.findMany({
        where: {
          tenantId,
          propertyId: targetProperty.id,
          customerId: dto.customerId,
          type: { not: "DEVELOPMENT_CHARGE" },
          status: { in: ["PENDING", "PARTIAL", "OVERDUE", "BOUNCED"] },
        },
        orderBy: { dueDate: "asc" },
      });

      for (const inv of unpaidTargetInvoices) {
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
            data: { paid: newPaid, status: isPaid ? "PAID" : "PARTIAL" },
          });
        }
      }

      // 4. If preliminary invoices are paid, check and generate installment plan invoices
      const generatedInvoices = await this.paymentPlansService.checkAndGenerateInstallments(
        tenantId,
        targetProperty.id
      );

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
              data: { paid: newPaid, status: isPaid ? "PAID" : "PARTIAL" },
            });
          }
        }
      }

      if (allocations.length > 0) {
        await tx.receipt.update({
          where: { id: adjustmentReceipt.id },
          data: { allocations },
        });
      }

      // 5. Create PlotMerge record
      const plotMerge = await tx.plotMerge.create({
        data: {
          tenantId,
          customerId: dto.customerId,
          targetPropertyId: targetProperty.id,
          receiptId: adjustmentReceipt.id,
          totalMergedAmount,
          sourcePropertiesCount: dto.sourcePropertyIds.length,
          sourceDetails,
          reason: receiptReason,
          notes: dto.notes ? dto.notes.trim() : null,
          mergedAt: mergeDate,
          mergedBy: user?.name || user?.email || "Admin",
        },
      });

      // 6. Write AuditLog
      await tx.auditLog.create({
        data: {
          tenantId,
          userId: user?.id || null,
          action: "MERGE_PLOTS",
          entity: "Property",
          entityId: targetProperty.id,
          reason: receiptReason,
          changes: {
            targetPropertyCode: targetProperty.code,
            sourceProperties: sourcePlotCodes,
            totalMergedAmount,
            receiptCode: adjustmentReceipt.code,
          },
        },
      });

      return {
        success: true,
        mergeId: plotMerge.id,
        receiptId: adjustmentReceipt.id,
        receiptCode: adjustmentReceipt.code,
        targetPropertyId: targetProperty.id,
        targetPropertyCode: targetProperty.code,
        totalMergedAmount,
        customerName: customer.fullName,
      };
    });
  }

  /**
   * List merge history
   */
  async listHistory(
    tenantId: string,
    opts?: { q?: string; page?: number; limit?: number }
  ) {
    const page = opts?.page || 1;
    const limit = opts?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (opts?.q) {
      const q = opts.q.trim();
      where.OR = [
        { Customer: { fullName: { contains: q, mode: "insensitive" } } },
        { Customer: { nationalId: { contains: q, mode: "insensitive" } } },
        { Property: { code: { contains: q, mode: "insensitive" } } },
        { Receipt: { code: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.plotMerge.count({ where }),
      this.prisma.plotMerge.findMany({
        where,
        orderBy: { mergedAt: "desc" },
        skip,
        take: limit,
        include: {
          Customer: {
            select: { id: true, code: true, fullName: true, nationalId: true, phone: true },
          },
          Property: {
            select: { id: true, code: true, title: true, type: true, status: true },
          },
          Receipt: {
            select: { id: true, code: true, amount: true, method: true, status: true },
          },
        },
      }),
    ]);

    const formattedData = data.map((item: any) => ({
      ...item,
      customer: item.Customer || item.customer,
      targetProperty: item.Property || item.targetProperty,
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
   * Get single merge record by ID
   */
  async getMerge(tenantId: string, id: string) {
    const record = await this.prisma.plotMerge.findFirst({
      where: { tenantId, id },
      include: {
        Customer: true,
        Property: true,
        Receipt: true,
      },
    });

    if (!record) throw new NotFoundException("Merge record not found");
    return {
      ...record,
      customer: (record as any).Customer || (record as any).customer,
      targetProperty: (record as any).Property || (record as any).targetProperty,
      receipt: (record as any).Receipt || (record as any).receipt,
    };
  }
}

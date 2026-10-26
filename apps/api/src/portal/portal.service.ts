import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PortalService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Customer Login with credentials (CNIC, Phone, Customer Code, or Portal Code)
   * and optional PIN/Password.
   */
  async customerLogin(input: { identifier: string; pin?: string; password?: string }) {
    const rawId = (input.identifier || '').trim();
    if (!rawId) {
      throw new UnauthorizedException('Please enter your Customer ID, CNIC, or Phone Number');
    }

    const cleanDigits = rawId.replace(/[^\w]/g, '');
    const cleanId = rawId.toLowerCase();

    // Search for customer by Code, National ID (CNIC), Phone, Mobile, or direct portalAccessId
    const customer = await this.prisma.customer.findFirst({
      where: {
        OR: [
          { code: { equals: rawId, mode: 'insensitive' } },
          { nationalId: { equals: rawId, mode: 'insensitive' } },
          { phone: { equals: rawId, mode: 'insensitive' } },
          { mobile: { equals: rawId, mode: 'insensitive' } },
          { portalAccessId: rawId },
          // Flexible search without dashes
          { nationalId: { contains: cleanDigits.length >= 5 ? cleanDigits : undefined } },
          { phone: { contains: cleanDigits.length >= 7 ? cleanDigits : undefined } },
        ]
      }
    });

    if (!customer) {
      throw new UnauthorizedException('No customer account found with these credentials');
    }

    if (!customer.isPortalActive) {
      throw new UnauthorizedException('Customer portal access is currently disabled. Please contact administration.');
    }

    // Verify PIN / Password if customer has one configured
    const submittedSecret = (input.pin || input.password || (input as any).pinOrPassword || '').trim();
    if (customer.portalPassword) {
      if (!submittedSecret) {
        throw new UnauthorizedException('Please enter your Portal PIN / Password');
      }
      if (customer.portalPassword !== submittedSecret) {
        throw new UnauthorizedException('Incorrect PIN or Password');
      }
    }

    // Ensure customer has a portalAccessId
    let accessId = customer.portalAccessId;
    if (!accessId) {
      accessId = crypto.randomUUID();
      await this.prisma.customer.update({
        where: { id: customer.id },
        data: { portalAccessId: accessId }
      });
    }

    return {
      success: true,
      accessId,
      portalAccessId: accessId,
      customerName: customer.fullName,
      customerCode: customer.code,
    };
  }

  /**
   * Get all verified Customer Portal data for a specific access ID
   */
  async getCustomerPortalData(portalAccessId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { portalAccessId },
      include: {
        ownerships: {
          include: {
            property: {
              include: {
                plans: {
                  include: {
                    installments: {
                      orderBy: { dueDate: 'asc' }
                    }
                  }
                },
                invoices: {
                  where: { status: { not: 'VOID' } },
                  orderBy: { dueDate: 'asc' }
                },
                receipts: {
                  where: { status: { not: 'VOID' }, category: { not: 'REFUND' } },
                  orderBy: { receivedAt: 'desc' }
                }
              }
            }
          }
        }
      }
    });

    if (!customer) {
      throw new NotFoundException('Portal not found');
    }

    if (!customer.isPortalActive) {
      throw new UnauthorizedException('Portal access has been disabled by the administrator');
    }

    let totalPaidAll = 0;
    let totalPlotPaidAll = 0;
    let totalDevPaidAll = 0;
    let totalValueAll = 0;
    let totalOutstandingAll = 0;
    let totalArrearsAll = 0;
    let totalProperties = customer.ownerships.length;

    const now = new Date();

    const properties = await Promise.all(
      customer.ownerships.map(async (own) => {
        const property = own.property;
        const paymentPlan = property.plans?.[0];
        const installments = paymentPlan?.installments || [];
        const allReceipts = property.receipts || [];
        const activeInvoices = property.invoices || [];

        // Check if property was transferred (query verified OwnershipTransfer)
        let previousOwner: { name: string; previousOwnerName: string; transferDate: string } | null = null;
        const transfer = await this.prisma.ownershipTransfer.findFirst({
          where: {
            propertyId: property.id,
            toCustomer: customer.id,
            status: { not: 'REJECTED' }
          },
          include: {
            from: { select: { fullName: true } }
          },
          orderBy: { transferDate: 'desc' }
        });

        if (transfer) {
          const snap = transfer.previousOwnerSnapshot as any;
          const ownerName = snap?.fullName || transfer.from?.fullName || 'Previous Allottee';
          previousOwner = {
            name: ownerName,
            previousOwnerName: ownerName,
            transferDate: transfer.transferDate.toISOString()
          };
        }

        // Categorize Receipts
        const devInvoiceIds = new Set(
          activeInvoices
            .filter((inv) => inv.type === 'DEVELOPMENT_CHARGE')
            .map((inv) => inv.id)
        );

        const devReceipts = allReceipts.filter(
          (r) =>
            r.category === 'DEVELOPMENT' ||
            r.code?.startsWith('DEV-') ||
            (r.invoiceId && devInvoiceIds.has(r.invoiceId))
        );
        const installmentReceipts = allReceipts.filter(
          (r) => !devReceipts.includes(r)
        );

        // Plot Base Price & Dev Charges separation
        const plotPrice = paymentPlan?.totalAmount
          ? Number(paymentPlan.totalAmount)
          : Number(property.totalPrice || 0);

        const devInvoiceTotal = activeInvoices
          .filter((inv) => inv.type === 'DEVELOPMENT_CHARGE')
          .reduce((sum, inv) => sum + Number(inv.total), 0);
        const devCharges = Math.max(Number(property.developmentCharges || 0), devInvoiceTotal);

        const paidInstallments = installmentReceipts.reduce((sum, r) => sum + Number(r.amount), 0);
        const paidDev = devReceipts.reduce((sum, r) => sum + Number(r.amount), 0);

        const remainingInstallments = Math.max(0, plotPrice - paidInstallments);
        const remainingDev = Math.max(0, devCharges - paidDev);

        const totalValue = plotPrice + devCharges;
        const totalPaid = paidInstallments + paidDev;
        const remainingTotal = remainingInstallments + remainingDev;

        const plotPaidPercentage = plotPrice > 0 ? Math.min(100, Math.round((paidInstallments / plotPrice) * 100)) : 100;
        const devPaidPercentage = devCharges > 0 ? Math.min(100, Math.round((paidDev / devCharges) * 100)) : 0;

        // Arrears Calculation:
        // 1. Installments past due vs paid installments
        const pastDueInstallmentSum = installments
          .filter((i) => new Date(i.dueDate) <= now)
          .reduce((sum, i) => sum + Number(i.amount), 0);
        const installmentArrears = Math.max(0, pastDueInstallmentSum - paidInstallments);

        // 2. Dev Invoices past due vs paid dev charges
        const pastDueDevInvoices = activeInvoices
          .filter((inv) => inv.type === 'DEVELOPMENT_CHARGE' && new Date(inv.dueDate) <= now)
          .reduce((sum, inv) => sum + Math.max(0, Number(inv.total) - Number(inv.paid)), 0);

        const totalArrears = installmentArrears + pastDueDevInvoices;

        totalValueAll += totalValue;
        totalPaidAll += totalPaid;
        totalPlotPaidAll += paidInstallments;
        totalDevPaidAll += paidDev;
        totalOutstandingAll += remainingTotal;
        totalArrearsAll += totalArrears;

        // Status Determination
        let status = 'ACTIVE';
        if (own.endDate) {
          status = 'TRANSFERRED';
        } else if (remainingInstallments <= 0 && remainingDev <= 0) {
          status = 'FULLY PAID';
        } else if (remainingInstallments <= 0) {
          status = 'PLOT COST FULLY PAID';
        }

        return {
          id: own.id,
          status,
          property: {
            code: property.code,
            title: property.title,
            sizeSqYd: property.sizeSqYd ? Number(property.sizeSqYd) : null,
            type: property.type,
            developmentCharges: devCharges,
            plotPrice,
          },
          previousOwner, // Only Previous Owner Name and Transfer Date
          financials: {
            totalValue,
            paid: totalPaid,
            remaining: remainingTotal,
            arrears: totalArrears,
            // Granular breakdown (with dual aliases for compatibility)
            plotPrice,
            paidInstallments,
            plotPaid: paidInstallments,
            remainingInstallments,
            plotRemaining: remainingInstallments,
            plotPaidPercentage,
            isPlotPaid: remainingInstallments <= 0,
            devCharges,
            devTotal: devCharges,
            paidDev,
            devPaid: paidDev,
            remainingDev,
            devRemaining: remainingDev,
            devPaidPercentage,
            isDevPaid: devCharges > 0 ? remainingDev <= 0 : true,
          },
          installments: installments.map((i) => ({
            id: i.id,
            title: i.title,
            amount: Number(i.amount),
            dueDate: i.dueDate,
            status: i.status
          })),
          receipts: allReceipts.map((r) => ({
            id: r.id,
            receiptNo: r.code,
            amount: Number(r.amount),
            receiptDate: r.receivedAt,
            method: r.method,
            status: r.status === 'POSTED' ? 'PAID' : r.status,
            category: r.category === 'DEVELOPMENT' || r.code?.startsWith('DEV-') || (r.invoiceId && devInvoiceIds.has(r.invoiceId)) ? 'DEVELOPMENT' : 'INSTALLMENT'
          }))
        };
      })
    );

    return {
      customer: {
        fullName: customer.fullName,
        code: customer.code,
        nationalId: customer.nationalId,
        phone: customer.phone,
        mobile: customer.mobile,
        email: customer.email,
        address: customer.address
      },
      summary: {
        totalValue: totalValueAll,
        totalPaid: totalPaidAll,
        totalPlotPaid: totalPlotPaidAll,
        totalDevPaid: totalDevPaidAll,
        totalOutstanding: totalOutstandingAll,
        totalArrears: totalArrearsAll,
        totalProperties
      },
      properties,
    };
  }
}

import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PortalService {
  constructor(private prisma: PrismaService) {}

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

    let totalPaid = 0;
    let totalOutstanding = 0;
    let totalArrears = 0;
    let totalProperties = customer.ownerships.length;

    const now = new Date();

    const properties = customer.ownerships.map(own => {
      const property = own.property;
      const paymentPlan = property.plans?.[0]; // 1 active plan if defined
      const installments = paymentPlan?.installments || [];
      const allReceipts = property.receipts || [];
      const activeInvoices = property.invoices || [];

      // Filter active, non-void and non-refund receipts
      const activeReceipts = allReceipts.filter(r => r.status !== 'VOID' && r.category !== 'REFUND');
      const paid = activeReceipts.reduce((sum, r) => sum + Number(r.amount), 0);

      // Financial total value: plot base price + development charges
      const basePrice = paymentPlan?.totalPrice ? Number(paymentPlan.totalPrice) : Number(property.totalPrice || 0);
      const devCharges = Number(property.developmentCharges || 0);
      const totalValue = basePrice + devCharges;
      const remaining = Math.max(0, totalValue - paid);

      // Arrears calculation: sum past-due unpaid invoice balances if available, else fallback to installment schedule
      let arrears = 0;
      if (activeInvoices.length > 0) {
        arrears = activeInvoices
          .filter(inv => new Date(inv.dueDate) <= now)
          .reduce((sum, inv) => sum + Math.max(0, Number(inv.total) - Number(inv.paid)), 0);
      } else {
        const pastDueInstallmentSum = installments
          .filter(i => new Date(i.dueDate) <= now)
          .reduce((sum, i) => sum + Number(i.amount), 0);
        arrears = Math.max(0, pastDueInstallmentSum - paid);
      }

      totalPaid += paid;
      totalOutstanding += remaining;
      totalArrears += arrears;

      let status = 'ACTIVE';
      if (own.endDate) {
        status = 'TRANSFERRED';
      } else if (remaining < 1) {
        status = 'FULLY PAID';
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
        },
        financials: {
          paid,
          totalValue,
          remaining,
          arrears
        },
        installments: installments.map(i => ({
          id: i.id,
          title: i.title,
          amount: Number(i.amount),
          dueDate: i.dueDate,
          status: i.status
        })),
        receipts: allReceipts.map(r => ({
          id: r.id,
          receiptNo: r.code,
          amount: Number(r.amount),
          receiptDate: r.receivedAt,
          method: r.method,
          status: r.status,
          category: r.category
        }))
      };
    });

    return {
      customer: {
        fullName: customer.fullName,
        code: customer.code,
        nationalId: customer.nationalId,
        phone: customer.phone,
        email: customer.email,
        address: customer.address
      },
      summary: {
        totalPaid,
        totalOutstanding,
        totalArrears,
        totalProperties
      },
      properties,
    };
  }
}

import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(tenantId: string, user?: any) {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    // Construct tenant filter
    let tenantFilter: any = {};
    if (user?.role !== 'SUPER_ADMIN') {
      const allowedTenants = user?.tenantAccess?.map((ta: any) => ta.tenantId) || [];
      if (user?.tenantId && !allowedTenants.includes(user.tenantId)) {
        allowedTenants.push(user.tenantId);
      }
      if (tenantId === 'all' || !allowedTenants.includes(tenantId)) {
        tenantFilter = allowedTenants.length > 0 ? { tenantId: { in: allowedTenants } } : { tenantId: 't_local' };
      } else {
        tenantFilter = { tenantId };
      }
    } else {
      if (tenantId !== 'all') {
        tenantFilter = { tenantId };
      }
    }

    const [
      invoiceAgg,
      overdueInvoiceAgg,
      totalReceiptAgg,
      monthReceiptAgg,
      totalExpenseAgg,
      monthExpenseAgg,
      invoiceRows,
      pdcRows,
      propertyStatusCounts,
      totalProperties,
      customerCount,
      pdcPendingAgg,
      devInvoiceAgg,
      instInvoiceAgg,
      devReceiptAgg,
    ] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: { ...tenantFilter },
        _sum: { total: true, paid: true },
      }),
      this.prisma.invoice.aggregate({
        where: { ...tenantFilter, status: 'OVERDUE' },
        _sum: { total: true, paid: true },
      }),
      this.prisma.receipt.aggregate({
        where: {
          ...tenantFilter,
          status: { not: 'VOID' },
          category: { not: 'REFUND' },
          code: { not: { startsWith: 'REF-' } },
        },
        _sum: { amount: true },
      }),
      this.prisma.receipt.aggregate({
        where: {
          ...tenantFilter,
          status: { not: 'VOID' },
          category: { not: 'REFUND' },
          code: { not: { startsWith: 'REF-' } },
          receivedAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: { ...tenantFilter },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: { ...tenantFilter, incurredAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      this.prisma.invoice.findMany({
        where: { ...tenantFilter },
        orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
        take: 6,
        select: {
          id: true,
          code: true,
          type: true,
          total: true,
          paid: true,
          dueDate: true,
          status: true,
          customer: { select: { id: true, fullName: true } },
          installment: { select: { seq: true } },
        },
      }),
      this.prisma.postDatedCheque.findMany({
        where: {
          ...tenantFilter,
          status: 'RECEIVED',
          dueDate: { gte: startOfDay },
        },
        orderBy: [{ dueDate: 'asc' }],
        take: 6,
        select: {
          id: true,
          amount: true,
          dueDate: true,
          chequeNo: true,
          bank: true,
          customer: { select: { id: true, fullName: true } },
        },
      }),
      this.prisma.property.groupBy({
        by: ['status'],
        where: { ...tenantFilter },
        _count: true,
      }),
      this.prisma.property.count({
        where: { ...tenantFilter },
      }),
      this.prisma.customer.count({
        where: { ...tenantFilter },
      }),
      this.prisma.postDatedCheque.aggregate({
        where: { ...tenantFilter, status: 'RECEIVED' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.invoice.aggregate({
        where: { ...tenantFilter, type: 'DEVELOPMENT_CHARGE' },
        _sum: { total: true, paid: true },
      }),
      this.prisma.invoice.aggregate({
        where: { ...tenantFilter, type: { not: 'DEVELOPMENT_CHARGE' } },
        _sum: { total: true, paid: true },
      }),
      this.prisma.receipt.aggregate({
        where: {
          ...tenantFilter,
          status: { not: 'VOID' },
          OR: [{ category: 'DEVELOPMENT' }, { code: { startsWith: 'DEV-' } }],
        },
        _sum: { amount: true },
      }),
    ])

    const totalInvoiced = Number(invoiceAgg?._sum?.total ?? 0)
    const totalInvoicedPaid = Number(invoiceAgg?._sum?.paid ?? 0)
    const outstandingBalance = totalInvoiced - totalInvoicedPaid
    const outstandingArrears = Number(overdueInvoiceAgg?._sum?.total ?? 0) - Number(overdueInvoiceAgg?._sum?.paid ?? 0)
    const monthCollections = Number(monthReceiptAgg?._sum?.amount ?? 0)
    const totalRecovered = Number(totalReceiptAgg?._sum?.amount ?? 0)
    const totalExpenses = Number(totalExpenseAgg?._sum?.amount ?? 0)
    const monthExpenses = Number(monthExpenseAgg?._sum?.amount ?? 0)
    const netCashFlow = totalRecovered - totalExpenses
    const monthNetCashFlow = monthCollections - monthExpenses

    const devInvoiced = Number(devInvoiceAgg?._sum?.total ?? 0)
    const devInvoicedPaid = Number(devInvoiceAgg?._sum?.paid ?? 0)
    const devRecovered = Number(devReceiptAgg?._sum?.amount ?? 0)

    const installmentInvoiced = Number(instInvoiceAgg?._sum?.total ?? 0)
    const installmentInvoicedPaid = Number(instInvoiceAgg?._sum?.paid ?? 0)
    const installmentRecovered = totalRecovered - devRecovered

    const cancelledAvailableCount = await this.prisma.property.count({
      where: {
        tenantId,
        status: { in: ['AVAILABLE', 'CANCELLED'] },
        PlotCancellation: { some: {} },
        ownerships: { none: { endDate: null } },
      },
    });

    const propertyStatus: Record<string, number> = {
      AVAILABLE: 0,
      SOLD: 0,
      RESERVED: 0,
      CANCELLED: 0,
      CANCELLED_AVAILABLE: cancelledAvailableCount,
    }
    for (const g of propertyStatusCounts) {
      if (g.status) propertyStatus[g.status] = g._count
    }

    const recentInvoices = invoiceRows.map((invoice) => ({
      ...invoice,
      total: Number(invoice.total),
      paid: Number(invoice.paid),
    }))

    const upcomingPdcs = pdcRows.map((pdc) => ({
      ...pdc,
      amount: Number(pdc.amount),
    }))

    return {
      outstandingBalance,
      outstandingArrears,
      monthCollections,
      totalRecovered,
      totalExpenses,
      monthExpenses,
      netCashFlow,
      monthNetCashFlow,
      totalInvoiced,
      recentInvoices,
      upcomingPdcs,
      inventory: {
        totalProperties,
        statusBreakdown: propertyStatus,
        occupancyRate: totalProperties > 0 ? Math.round((((propertyStatus.SOLD || 0) + (propertyStatus.RESERVED || 0)) / totalProperties) * 100) : 0,
      },
      customers: {
        total: customerCount,
      },
      pdcPortfolio: {
        totalAmount: Number(pdcPendingAgg?._sum?.amount ?? 0),
        count: pdcPendingAgg?._count ?? 0,
      },
      streams: {
        installment: {
          invoiced: installmentInvoiced,
          paid: installmentInvoicedPaid,
          recovered: installmentRecovered,
        },
        development: {
          invoiced: devInvoiced,
          paid: devInvoicedPaid,
          recovered: devRecovered,
        },
      },
    }
  }
}

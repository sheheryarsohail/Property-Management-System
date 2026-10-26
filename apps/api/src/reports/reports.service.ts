import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Property Ledger - All transactions for a property
   */
  async propertyLedger(tenantId: string, propertyId: string, from?: Date, to?: Date) {
    const property = await this.prisma.property.findFirst({
      where: { tenantId, id: propertyId },
      include: {
        ownerships: {
          orderBy: { startDate: 'desc' },
          include: {
            customer: { select: { id: true, fullName: true, code: true } },
          },
        },
      },
    });

    if (!property) return null;

    const where: any = { tenantId, propertyId };
    if (from || to) {
      const dateFilter: any = {};
      if (from) dateFilter.gte = from;
      if (to) dateFilter.lte = to;
      where.OR = [{ issueDate: dateFilter }, { createdAt: dateFilter }];
    }

    const [invoices, receipts, recoveryCharges] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { ...where, OR: undefined, issueDate: where.OR?.[0]?.issueDate },
        include: {
          customer: { select: { fullName: true } },
        },
        orderBy: { issueDate: 'asc' },
      }),
      this.prisma.receipt.findMany({
        where: { 
          tenantId, 
          propertyId, 
          ...(from || to ? { receivedAt: where.OR?.[0]?.issueDate } : {}) 
        },
        include: {
          customer: { select: { fullName: true } },
        },
        orderBy: { receivedAt: 'asc' },
      }),
      this.prisma.recoveryCharge.findMany({
        where: { tenantId, propertyId, ...(from || to ? { chargeDate: where.OR?.[0]?.issueDate } : {}) },
        orderBy: { chargeDate: 'asc' },
      }),
    ]);

    // Active records filter
    const activeInvoices = invoices.filter(inv => inv.status !== 'VOID');
    const activeInstallmentInvoices = activeInvoices.filter(inv => inv.type !== 'DEVELOPMENT_CHARGE');
    const activeDevInvoices = activeInvoices.filter(inv => inv.type === 'DEVELOPMENT_CHARGE');

    const activeReceipts = receipts.filter(rcp => rcp.status !== 'VOID' && rcp.category !== 'REFUND');
    const devReceipts = activeReceipts.filter(rcp => rcp.category === 'DEVELOPMENT' || rcp.code?.startsWith('DEV-'));
    const installmentReceipts = activeReceipts.filter(rcp => rcp.category !== 'DEVELOPMENT' && !rcp.code?.startsWith('DEV-'));

    const totalPrice = Number(property.totalPrice || 0);

    const entries: any[] = [];

    // If no non-void installment invoices exist for the plot, add Base Plot Cost as the opening debit
    // so running balance accurately reflects plot price minus payments!
    if (activeInstallmentInvoices.length === 0 && totalPrice > 0) {
      const activeOwnership = property.ownerships.find(o => !o.endDate);
      const bookingDate = activeOwnership?.startDate || property.createdAt;
      entries.push({
        id: `plot-cost-${property.id}`,
        date: bookingDate,
        type: 'Plot Cost',
        category: 'INSTALLMENT',
        description: `Base Plot Cost — ${property.code}`,
        debit: totalPrice,
        credit: 0,
        status: 'POSTED',
      });
    }

    invoices.forEach(inv => {
      const isDev = inv.type === 'DEVELOPMENT_CHARGE';
      const isVoid = inv.status === 'VOID';
      let typeLabel = isDev ? 'Dev Charges' : (inv.type === 'INSTALLMENT' ? 'Installment' : 'Invoice');
      if (isVoid) typeLabel += ' (VOID)';
      entries.push({
        id: inv.id,
        date: inv.issueDate,
        type: typeLabel,
        category: isDev ? 'DEVELOPMENT' : 'INSTALLMENT',
        description: isVoid ? `${isDev ? 'Dev Invoice' : 'Invoice'} ${inv.code} [VOID]` : `${isDev ? 'Dev Invoice' : 'Invoice'} ${inv.code}`,
        debit: isVoid ? 0 : Number(inv.total),
        credit: 0,
        status: inv.status,
      });
    });

    receipts.forEach(rcp => {
      const isDev = rcp.category === 'DEVELOPMENT' || rcp.code?.startsWith('DEV-');
      const isRefund = rcp.category === 'REFUND' || rcp.code?.startsWith('REF-');
      const isVoid = rcp.status === 'VOID';

      let type = '';
      let desc = '';
      let debit = 0;
      let credit = 0;

      if (isRefund) {
        type = 'Refund Voucher';
        desc = `Refund Voucher ${rcp.code} (${rcp.method})${rcp.customer?.fullName ? ` - Paid to: ${rcp.customer.fullName}` : ''}${rcp.notes ? ` - ${rcp.notes}` : ''}`;
        debit = 0;
        credit = 0; // Refund voucher to cancelled owner does not debit or credit the property collection!
      } else if (isVoid) {
        type = isDev ? 'Dev Receipt (VOID)' : 'Receipt (VOID)';
        desc = `${isDev ? 'Dev Receipt' : 'Receipt'} ${rcp.code} (${rcp.method})${rcp.customer?.fullName ? ` - ${rcp.customer.fullName}` : ''} [VOID]`;
        debit = 0;
        credit = 0; // Voided receipts have zero credit effect
      } else {
        type = isDev ? 'Dev Receipt' : 'Receipt';
        desc = isDev ? `Dev Receipt ${rcp.code} (${rcp.method})` : `Receipt ${rcp.code} (${rcp.method})`;
        if (rcp.customer?.fullName) desc += ` - ${rcp.customer.fullName}`;
        if (rcp.allocations && Array.isArray(rcp.allocations)) {
          const allocs = (rcp.allocations as any[]).map((a: any) => a.invoiceCode);
          if (allocs.length > 0) desc += ` - Applied to: ${allocs.join(', ')}`;
        }
        debit = 0;
        credit = Number(rcp.amount);
      }

      entries.push({
        id: rcp.id,
        date: rcp.receivedAt,
        type,
        category: isDev ? 'DEVELOPMENT' : (isRefund ? 'REFUND' : (rcp.category === 'TRANSFER' || rcp.category === 'TRANSFER_FEE' ? 'TRANSFER' : (rcp.category === 'MERGE_ADJUSTMENT' || rcp.category === 'MERGE' ? 'MERGE_ADJUSTMENT' : 'INSTALLMENT'))),
        description: desc,
        debit,
        credit,
        status: rcp.status,
      });
    });

    recoveryCharges.forEach(rc => entries.push({
      id: rc.id,
      date: rc.chargeDate,
      type: 'Recovery Charge',
      category: 'RECOVERY',
      description: rc.title,
      debit: Number(rc.amount),
      credit: 0,
      status: 'POSTED',
    }));

    entries.sort((a, b) => {
      const timeDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (timeDiff !== 0) return timeDiff;
      if (a.debit > 0 && b.credit > 0) return -1;
      if (a.credit > 0 && b.debit > 0) return 1;
      return 0;
    });

    let runningBalance = 0;
    for (const entry of entries) {
      runningBalance += entry.debit - entry.credit;
      entry.balance = runningBalance;
    }

    // 1. Base Plot Financials
    const installmentInvoiced = activeInstallmentInvoices.length > 0
      ? activeInstallmentInvoices.reduce((sum, inv) => sum + Number(inv.total), 0)
      : totalPrice;
    const installmentPaid = installmentReceipts.reduce((sum, rcp) => sum + Number(rcp.amount), 0);
    const installmentRemaining = Math.max(0, totalPrice - installmentPaid);
    const installmentOutstanding = activeInstallmentInvoices
      .filter(inv => ['OVERDUE', 'PARTIAL', 'PDC'].includes(inv.status))
      .reduce((sum, inv) => sum + Math.max(0, Number(inv.total) - Number(inv.paid)), 0);

    // 2. Development Charges Financials
    const devChargesConfigured = Number(property.developmentCharges || 0);
    const devChargesInvoiced = activeDevInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
    const devChargesPaid = devReceipts.reduce((sum, rcp) => sum + Number(rcp.amount), 0);
    const devChargesTotal = Math.max(devChargesConfigured, devChargesInvoiced);
    const devChargesRemaining = Math.max(0, devChargesTotal - devChargesPaid);
    const devChargesOutstanding = activeDevInvoices
      .filter(inv => ['OVERDUE', 'PARTIAL', 'PDC'].includes(inv.status))
      .reduce((sum, inv) => sum + Math.max(0, Number(inv.total) - Number(inv.paid)), 0);

    let devChargesStatus = 'NOT_SET';
    if (devChargesTotal > 0) {
      if (devChargesPaid >= devChargesTotal) devChargesStatus = 'PAID';
      else if (devChargesPaid > 0) devChargesStatus = 'PARTIAL';
      else if (devChargesInvoiced > 0) devChargesStatus = 'PENDING';
      else devChargesStatus = 'NOT_INVOICED';
    }

    // 3. Combined Grand Totals
    const grandTotalPrice = totalPrice + devChargesTotal;
    const grandTotalPaid = installmentPaid + devChargesPaid;
    const grandRemainingBalance = Math.max(0, grandTotalPrice - grandTotalPaid);
    const grandTotalOutstanding = installmentOutstanding + devChargesOutstanding;

    const totalInvoiced = activeInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
    const totalRecovery = recoveryCharges.reduce((sum, rc) => sum + Number(rc.amount), 0);

    return {
      property: {
        id: property.id,
        code: property.code,
        title: property.title,
        type: property.type,
        sizeSqYd: property.sizeSqYd,
        totalPrice,
        developmentCharges: devChargesConfigured,
      },
      currentOwner: property.ownerships.find((o) => !o.endDate),
      entries,
      invoices: invoices.map((inv) => ({
        id: inv.id,
        code: inv.code,
        type: inv.type,
        date: inv.issueDate,
        dueDate: inv.dueDate,
        amount: Number(inv.total),
        paid: Number(inv.paid),
        balance: Number(inv.total) - Number(inv.paid),
        status: inv.status,
        customer: inv.customer.fullName,
      })),
      receipts: receipts.map((rcp) => ({
        id: rcp.id,
        code: rcp.code,
        date: rcp.receivedAt,
        amount: Number(rcp.amount),
        method: rcp.method,
        reference: rcp.reference,
        category: rcp.category,
      })),
      recoveryCharges: recoveryCharges.map((rc) => ({
        id: rc.id,
        title: rc.title,
        date: rc.chargeDate,
        amount: Number(rc.amount),
        method: rc.allocationMethod,
      })),
      summary: {
        // Base / Installment metrics
        totalPrice,
        installmentInvoiced,
        installmentPaid,
        installmentRemaining,
        installmentOutstanding,
        remainingBalance: installmentRemaining,

        // Development Charges metrics
        developmentCharges: {
          total: devChargesTotal,
          configured: devChargesConfigured,
          invoiced: devChargesInvoiced,
          paid: devChargesPaid,
          remaining: devChargesRemaining,
          outstanding: devChargesOutstanding,
          status: devChargesStatus,
        },
        devChargesTotal,
        devChargesConfigured,
        devChargesInvoiced,
        devChargesPaid,
        devChargesRemaining,
        devChargesOutstanding,
        devChargesStatus,

        // Overall / Grand totals
        grandTotalPrice,
        grandTotalPaid,
        grandRemainingBalance,
        grandTotalOutstanding,

        // Standard accounting totals (backwards compatible)
        totalInvoiced,
        totalPaid: grandTotalPaid,
        totalReceived: grandTotalPaid,
        totalRecovery,
        balance: invoices.reduce((sum, inv) => sum + (Number(inv.total) - Number(inv.paid)), 0),
        outstanding: grandTotalOutstanding,
      },
    };
  }

  /**
   * Customer Ledger - All transactions for a customer (multi-plot)
   */
  async customerLedger(tenantId: string, customerId: string, from?: Date, to?: Date) {
    const customer = await this.prisma.customer.findFirst({
      where: { tenantId, id: customerId },
      include: {
        ownerships: {
          include: {
            property: { select: { id: true, code: true, title: true, totalPrice: true, developmentCharges: true } },
          },
        },
      },
    });

    if (!customer) return null;

    const where: any = { tenantId, customerId };
    if (from || to) {
      const dateFilter: any = {};
      if (from) dateFilter.gte = from;
      if (to) dateFilter.lte = to;
      where.OR = [{ issueDate: dateFilter }, { createdAt: dateFilter }];
    }

    const [invoices, receipts] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { ...where, OR: undefined, issueDate: where.OR?.[0]?.issueDate },
        include: {
          property: { select: { id: true, code: true, title: true, totalPrice: true, developmentCharges: true } },
        },
        orderBy: { issueDate: 'asc' },
      }),
      this.prisma.receipt.findMany({
        where: { 
          tenantId, 
          customerId, 
          status: { not: 'VOID' as any },
          ...(from || to ? { receivedAt: where.OR?.[0]?.issueDate } : {}) 
        },
        include: {
          property: { select: { id: true, code: true, title: true, totalPrice: true, developmentCharges: true } },
        },
        orderBy: { receivedAt: 'asc' },
      }),
    ]);

    // Group by property
    const byProperty = new Map();
    
    // First initialize with all owned properties
    if (customer.ownerships) {
      for (const own of customer.ownerships) {
        if (own.property) {
          byProperty.set(own.property.id, {
            property: own.property,
            invoices: [],
            receipts: [],
            isCurrentOwner: !own.endDate,
            startDate: own.startDate,
            endDate: own.endDate,
          });
        }
      }
    }
    
    for (const inv of invoices) {
      if (!byProperty.has(inv.propertyId)) {
        byProperty.set(inv.propertyId, {
          property: inv.property,
          invoices: [],
          receipts: [],
        });
      }
      byProperty.get(inv.propertyId).invoices.push(inv);
    }

    for (const rcp of receipts) {
      if (rcp.propertyId && byProperty.has(rcp.propertyId)) {
        byProperty.get(rcp.propertyId).receipts.push(rcp);
      }
    }

    const entries = [];
    invoices.forEach(inv => {
      const isDev = inv.type === 'DEVELOPMENT_CHARGE';
      const isVoid = inv.status === 'VOID';
      let typeLabel = isDev ? 'Dev Charges' : (inv.type === 'INSTALLMENT' ? 'Installment' : 'Invoice');
      if (isVoid) typeLabel += ' (VOID)';
      entries.push({
        id: inv.id,
        date: inv.issueDate,
        type: typeLabel,
        category: isDev ? 'DEVELOPMENT' : 'INSTALLMENT',
        description: isVoid
          ? `${isDev ? 'Dev Invoice' : 'Invoice'} ${inv.code} - ${inv.property?.code || 'No Plot'} [VOID]`
          : (isDev ? `Dev Invoice ${inv.code} - ${inv.property?.code || 'No Plot'}` : `Invoice ${inv.code} - ${inv.property?.code || 'No Plot'}`),
        debit: isVoid ? 0 : Number(inv.total),
        credit: 0,
        propertyId: inv.propertyId,
        status: inv.status,
      });
    });
    receipts.forEach(rcp => {
      const isDev = rcp.category === 'DEVELOPMENT' || rcp.code?.startsWith('DEV-');
      const isRefund = rcp.category === 'REFUND' || rcp.code?.startsWith('REF-');
      const isVoid = rcp.status === 'VOID';

      let type = '';
      let desc = '';
      let credit = 0;

      if (isRefund) {
        type = 'Refund Voucher';
        desc = `Refund Voucher ${rcp.code} (${rcp.method})${rcp.notes ? ` - ${rcp.notes}` : ''}`;
        credit = 0;
      } else if (isVoid) {
        type = isDev ? 'Dev Receipt (VOID)' : 'Receipt (VOID)';
        desc = `${isDev ? 'Dev Receipt' : 'Receipt'} ${rcp.code} (${rcp.method}) [VOID]`;
        credit = 0;
      } else {
        type = isDev ? 'Dev Receipt' : 'Receipt';
        desc = isDev ? `Dev Receipt ${rcp.code} (${rcp.method})` : `Receipt ${rcp.code} (${rcp.method})`;
        if (rcp.allocations && Array.isArray(rcp.allocations)) {
          const allocs = (rcp.allocations as any[]).map((a: any) => a.invoiceCode);
          if (allocs.length > 0) desc += ` - Applied to: ${allocs.join(', ')}`;
        }
        credit = Number(rcp.amount);
      }

      entries.push({
        id: rcp.id,
        date: rcp.receivedAt,
        type,
        category: isDev ? 'DEVELOPMENT' : (isRefund ? 'REFUND' : (rcp.category === 'TRANSFER' || rcp.category === 'TRANSFER_FEE' ? 'TRANSFER' : (rcp.category === 'MERGE_ADJUSTMENT' || rcp.category === 'MERGE' ? 'MERGE_ADJUSTMENT' : 'INSTALLMENT'))),
        description: desc,
        debit: 0,
        credit,
        propertyId: rcp.propertyId,
        status: rcp.status,
      });
    });

    entries.sort((a, b) => {
      const timeDiff = a.date.getTime() - b.date.getTime();
      if (timeDiff !== 0) return timeDiff;
      if (a.credit > 0 && b.debit > 0) return -1;
      if (a.debit > 0 && b.credit > 0) return 1;
      return 0;
    });

    let runningBalance = 0;
    for (const entry of entries) {
      runningBalance += entry.debit - entry.credit;
      entry.balance = runningBalance;
    }

    const propertiesList = Array.from(byProperty.values()).map((prop) => {
      const isCurrentOwner = prop.isCurrentOwner ?? true;
      const propTotalPrice = isCurrentOwner ? Number(prop.property?.totalPrice || 0) : 0;
      const propDevConfigured = isCurrentOwner ? Number(prop.property?.developmentCharges || 0) : 0;
      
      const propDevInvoices = prop.invoices.filter((inv: any) => inv.type === 'DEVELOPMENT_CHARGE' && inv.status !== 'VOID');
      const propInstInvoices = prop.invoices.filter((inv: any) => inv.type !== 'DEVELOPMENT_CHARGE' && inv.status !== 'VOID');
      
      const propDevReceipts = prop.receipts.filter((rcp: any) => (rcp.category === 'DEVELOPMENT' || rcp.code?.startsWith('DEV-')) && rcp.status !== 'VOID' && rcp.category !== 'REFUND');
      const propInstReceipts = prop.receipts.filter((rcp: any) => rcp.category !== 'DEVELOPMENT' && !rcp.code?.startsWith('DEV-') && rcp.status !== 'VOID' && rcp.category !== 'REFUND');
      
      const propDevInvoiced = propDevInvoices.reduce((sum: number, inv: any) => sum + Number(inv.total), 0);
      const propDevPaid = propDevReceipts.reduce((sum: number, rcp: any) => sum + Number(rcp.amount), 0);
      const propDevTotal = Math.max(propDevConfigured, propDevInvoiced);
      const propDevRemaining = isCurrentOwner ? Math.max(0, propDevTotal - propDevPaid) : 0;
      
      const propInstInvoiced = propInstInvoices.reduce((sum: number, inv: any) => sum + Number(inv.total), 0);
      const propInstPaid = propInstReceipts.reduce((sum: number, rcp: any) => sum + Number(rcp.amount), 0);
      const propInstRemaining = isCurrentOwner ? Math.max(0, propTotalPrice - propInstPaid) : 0;
      
      const propTotalPaid = propInstPaid + propDevPaid;
      const propGrandTotal = propTotalPrice + propDevTotal;
      const propRemainingBalance = isCurrentOwner ? Math.max(0, propGrandTotal - propTotalPaid) : 0;
      const propArrears = isCurrentOwner ? prop.invoices
        .filter((inv: any) => ['OVERDUE', 'PARTIAL', 'PDC'].includes(inv.status) && inv.status !== 'VOID')
        .reduce((sum: number, inv: any) => sum + Math.max(0, Number(inv.total) - Number(inv.paid)), 0) : 0;

      return {
        property: prop.property,
        isCurrentOwner,
        startDate: prop.startDate,
        endDate: prop.endDate,
        ownershipStatus: isCurrentOwner ? 'ACTIVE' : 'ENDED',
        invoices: prop.invoices.map((inv: any) => ({
          id: inv.id,
          code: inv.code,
          type: inv.type,
          date: inv.issueDate,
          amount: Number(inv.total),
          paid: Number(inv.paid),
          balance: Number(inv.total) - Number(inv.paid),
          status: inv.status,
        })),
        receipts: prop.receipts.map((rcp: any) => ({
          id: rcp.id,
          code: rcp.code,
          date: rcp.receivedAt,
          amount: Number(rcp.amount),
          method: rcp.method,
          category: rcp.category,
          status: rcp.status,
        })),
        summary: {
          totalPrice: propTotalPrice,
          originalPlotPrice: Number(prop.property?.totalPrice || 0),
          isCurrentOwner,
          installmentInvoiced: propInstInvoiced,
          installmentPaid: propInstPaid,
          installmentRemaining: propInstRemaining,
          devChargesTotal: propDevTotal,
          devChargesConfigured: propDevConfigured,
          devChargesInvoiced: propDevInvoiced,
          devChargesPaid: propDevPaid,
          devChargesRemaining: propDevRemaining,
          grandTotal: propGrandTotal,
          totalInvoiced: prop.invoices.filter((inv: any) => inv.status !== 'VOID').reduce((sum: number, inv: any) => sum + Number(inv.total), 0),
          totalPaid: propTotalPaid,
          remainingBalance: propRemainingBalance,
          outstandingArrears: propArrears,
          balance: isCurrentOwner ? prop.invoices.filter((inv: any) => inv.status !== 'VOID').reduce((sum: number, inv: any) => sum + (Number(inv.total) - Number(inv.paid)), 0) : 0,
        },
      };
    });

    const totalPlotValue = propertiesList.reduce((sum, p) => sum + p.summary.totalPrice, 0);
    const totalDevCharges = propertiesList.reduce((sum, p) => sum + p.summary.devChargesTotal, 0);
    const grandTotalPlotPrice = totalPlotValue + totalDevCharges;
    const activeCustReceipts = receipts.filter(rcp => rcp.status !== 'VOID' && rcp.category !== 'REFUND');
    const totalPaidAll = activeCustReceipts.reduce((sum, rcp) => sum + Number(rcp.amount), 0);
    const totalRemainingAll = Math.max(0, grandTotalPlotPrice - totalPaidAll);
    const totalOutstandingArrears = propertiesList.reduce((sum, p) => sum + p.summary.outstandingArrears, 0);
    const activeCustInvoices = invoices.filter(inv => inv.status !== 'VOID');
    const totalCustInvoiced = activeCustInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
    const totalCustBalance = activeCustInvoices.reduce((sum, inv) => sum + (Number(inv.total) - Number(inv.paid)), 0);

    return {
      customer: {
        id: customer.id,
        code: customer.code,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
      },
      entries,
      properties: propertiesList,
      grandTotal: {
        totalPlotValue,
        totalDevCharges,
        grandTotalPlotPrice,
        totalInvoiced: totalCustInvoiced,
        totalPaid: totalPaidAll,
        balance: totalCustBalance,
        remainingBalance: totalRemainingAll,
        outstandingArrears: totalOutstandingArrears,
      },
      summary: {
        totalPlotValue,
        totalDevCharges,
        grandTotalPlotPrice,
        totalInvoiced: totalCustInvoiced,
        outstanding: totalOutstandingArrears,
        totalReceived: totalPaidAll,
        totalPaid: totalPaidAll,
        remainingBalance: totalRemainingAll,
        balance: totalCustBalance,
      }
    };
  }

  async agingReport(
    tenantId: string,
    query: {
      from?: string;
      to?: string;
      customerId?: string;
      propertyId?: string;
      status?: string;
      includeExpenses?: boolean;
    }
  ) {
    const now = new Date();
    
    const where: any = { tenantId };
    
    const isValid = (val: any) => val && val !== 'undefined' && val !== 'null' && val !== '';

    // We will filter by status in-memory after dynamic allocation to be accurate
    // if (isValid(query.status)) {
    //   where.status = query.status;
    // }

    if (isValid(query.customerId)) where.customerId = query.customerId;
    if (isValid(query.propertyId)) where.propertyId = query.propertyId;
    
    if (isValid(query.from) || isValid(query.to)) {
      where.dueDate = {};
      if (isValid(query.from)) where.dueDate.gte = new Date(query.from!);
      if (isValid(query.to)) where.dueDate.lte = new Date(query.to!);
    }

    const invoices = await this.prisma.invoice.findMany({
      where,
      include: {
        customer: { select: { id: true, fullName: true, code: true } },
        property: { select: { id: true, code: true, title: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const receiptsWhere: any = {
      tenantId,
      status: { not: 'VOID' },
      category: { not: 'REFUND' },
      code: { not: { startsWith: 'REF-' } },
    };
    if (isValid(query.customerId)) receiptsWhere.customerId = query.customerId;
    if (isValid(query.propertyId)) receiptsWhere.propertyId = query.propertyId;
    // Note: We don't filter receipts by from/to dates here because unallocated cash from ANY date should apply to pending balances.

    const receipts = await this.prisma.receipt.findMany({
      where: receiptsWhere,
      select: { amount: true, allocations: true, propertyId: true, customerId: true }
    });

    const unallocatedCredits: Record<string, number> = {};
    for (const r of receipts) {
      let allocated = 0;
      if (r.allocations && Array.isArray(r.allocations as any)) {
        allocated = (r.allocations as any).reduce((sum: number, a: any) => sum + (Number(a.amount) || 0), 0);
      }
      const unallocated = Number(r.amount) - allocated;
      if (unallocated > 0) {
        const key = r.propertyId || r.customerId;
        if (key) {
          unallocatedCredits[key] = (unallocatedCredits[key] || 0) + unallocated;
        }
      }
    }

    let flatList = invoices.map(inv => {
      let balance = Number(inv.total) - Number(inv.paid);
      let paid = Number(inv.paid);
      let status = inv.status;

      const key = inv.property?.id || inv.customer?.id;
      if (key && unallocatedCredits[key] > 0 && balance > 0) {
        const apply = Math.min(balance, unallocatedCredits[key]);
        unallocatedCredits[key] -= apply;
        balance -= apply;
        paid += apply;
        if (balance <= 0) {
          status = 'PAID';
        } else if (paid > 0) {
          status = 'PARTIAL';
        }
      }

      const daysOverdue = Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: inv.id,
        code: inv.code,
        type: inv.type,
        status,
        customer: inv.customer,
        property: inv.property,
        dueDate: inv.dueDate,
        total: Number(inv.total),
        paid,
        balance,
        daysOverdue: Math.max(0, daysOverdue),
      };
    });

    if (isValid(query.status)) {
      flatList = flatList.filter(inv => inv.status === query.status);
    }

    const totalInvoiced = flatList.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = flatList.reduce((sum, inv) => sum + inv.paid, 0);
    const totalOutstanding = flatList.reduce((sum, inv) => sum + inv.balance, 0);

    let totalExpenses = 0;
    if (query.includeExpenses) {
      const expenseWhere: any = {};
      if (query.from || query.to) {
        expenseWhere.incurredAt = {};
        if (query.from) expenseWhere.incurredAt.gte = new Date(query.from);
        if (query.to) expenseWhere.incurredAt.lte = new Date(query.to);
      }
      const expenses = await this.prisma.expense.aggregate({
        where: expenseWhere,
        _sum: { amount: true }
      });
      totalExpenses = Number(expenses._sum.amount ?? 0);
    }

    return {
      invoices: flatList,
      summary: {
        totalInvoiced,
        totalPaid,
        totalOutstanding,
        totalExpenses,
        totalInvoices: flatList.length,
      },
    };
  }

  /**
   * Comprehensive Financial Summary (P&L style)
   */
  async financialSummary(tenantId: string, from?: Date, to?: Date, user?: any) {
    const whereDate: any = {};
    if (from) whereDate.gte = from;
    if (to) whereDate.lte = to;

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

    const receiptWhere = { ...tenantFilter, ...(from || to ? { receivedAt: whereDate } : {}) };
    const invoiceWhere = { ...tenantFilter, ...(from || to ? { issueDate: whereDate } : {}) };
    const expenseWhere = { ...tenantFilter, ...(from || to ? { incurredAt: whereDate } : {}) };

    const validReceiptWhere = {
      ...receiptWhere,
      status: { not: 'VOID' as const },
      category: { not: 'REFUND' },
      code: { not: { startsWith: 'REF-' } },
    };

    const refundReceiptWhere = {
      ...receiptWhere,
      status: { not: 'VOID' as const },
      OR: [{ category: 'REFUND' }, { code: { startsWith: 'REF-' } }],
    };

    const [
      devInvAgg,
      instInvAgg,
      uninvRcpAgg,
      devRcpAgg,
      allRcpAgg,
      refundRcpAgg,
      expAgg,
      expensesByCategoryAgg,
      expenses,
    ] = await Promise.all([
      this.prisma.invoice.aggregate({ where: { ...invoiceWhere, type: 'DEVELOPMENT_CHARGE' }, _sum: { total: true } }),
      this.prisma.invoice.aggregate({ where: { ...invoiceWhere, type: { not: 'DEVELOPMENT_CHARGE' } }, _sum: { total: true } }),
      this.prisma.receipt.aggregate({ where: { ...validReceiptWhere, invoiceId: null }, _sum: { amount: true } }),
      this.prisma.receipt.aggregate({
        where: {
          ...validReceiptWhere,
          OR: [{ category: 'DEVELOPMENT' }, { code: { startsWith: 'DEV-' } }],
        },
        _sum: { amount: true },
      }),
      this.prisma.receipt.aggregate({ where: validReceiptWhere, _sum: { amount: true } }),
      this.prisma.receipt.aggregate({ where: refundReceiptWhere, _sum: { amount: true } }),
      this.prisma.expense.aggregate({ where: expenseWhere, _sum: { amount: true } }),
      this.prisma.expense.groupBy({ by: ['category'], where: expenseWhere, _sum: { amount: true } }),
      this.prisma.expense.findMany({
        where: expenseWhere,
        select: { id: true, incurredAt: true, amount: true, category: true, type: true, notes: true },
        take: 500,
        orderBy: { incurredAt: 'desc' },
      }),
    ]);

    const devInvoiced = Number(devInvAgg._sum.total ?? 0);
    const installmentInvoiced = Number(instInvAgg._sum.total ?? 0);
    const baseInvoiced = devInvoiced + installmentInvoiced;
    const unInvoicedReceipts = Number(uninvRcpAgg._sum.amount ?? 0);
    const totalInvoiced = baseInvoiced + unInvoicedReceipts;
    const totalRecovered = Number(allRcpAgg._sum.amount ?? 0);
    const totalRefunded = Number(refundRcpAgg._sum.amount ?? 0);
    const devRecovered = Number(devRcpAgg._sum.amount ?? 0);
    const installmentRecovered = totalRecovered - devRecovered;
    const totalExpenses = Number(expAgg._sum.amount ?? 0);

    const byCategory = expensesByCategoryAgg.map((g) => ({
      category: g.category || 'UNCATEGORIZED',
      amount: Number(g._sum.amount ?? 0),
    }));

    return {
      revenue: {
        totalInvoiced,
        installmentInvoiced,
        devInvoiced,
        totalRecovered,
        totalRefunded,
        installmentRecovered,
        devRecovered,
        pendingReceivables: Math.max(0, totalInvoiced - totalRecovered),
      },
      expenses: {
        total: totalExpenses,
        byCategory,
        details: expenses.map(e => ({
          id: e.id,
          date: e.incurredAt,
          amount: Number(e.amount),
          category: e.category,
          type: e.type,
          notes: e.notes,
        })),
      },
      netCashFlow: totalRecovered - totalExpenses - totalRefunded,
    };
  }

  /**
   * PDC Register - All post-dated cheques
   */
  async pdcRegister(tenantId: string, status?: string, from?: Date, to?: Date) {
    const where: any = { tenantId };
    if (status && status !== 'all') {
      where.status = status as any;
    }
    if (from || to) {
      where.dueDate = {};
      if (from) where.dueDate.gte = from;
      if (to) {
        const toDate = new Date(to);
        toDate.setUTCHours(23, 59, 59, 999);
        where.dueDate.lte = toDate;
      }
    }

    const pdcs = await this.prisma.postDatedCheque.findMany({
      where,
      include: {
        customer: { select: { id: true, fullName: true, code: true } },
        invoice: { select: { code: true, property: { select: { title: true, code: true } } } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const allItems = pdcs.map((pdc) => ({
      id: pdc.id,
      customer: pdc.customer,
      bank: pdc.bank,
      chequeNo: pdc.chequeNo,
      amount: Number(pdc.amount),
      dueDate: pdc.dueDate,
      status: pdc.status,
      notes: pdc.notes,
      invoice: pdc.invoice,
    }));

    const grouped = {
      received: [] as any[],
      deposited: [] as any[],
      cleared: [] as any[],
      bounced: [] as any[],
      returned: [] as any[],
      cancelled: [] as any[],
    };

    for (const item of allItems) {
      const key = item.status.toLowerCase() as keyof typeof grouped;
      if (grouped[key]) {
        grouped[key].push(item);
      }
    }

    return {
      items: allItems,
      grouped,
      summary: {
        totalCount: allItems.length,
        totalAmount: allItems.reduce((sum, item) => sum + item.amount, 0),
        total: allItems.length,
        received: grouped.received.reduce((sum, item) => sum + item.amount, 0),
        deposited: grouped.deposited.reduce((sum, item) => sum + item.amount, 0),
        cleared: grouped.cleared.reduce((sum, item) => sum + item.amount, 0),
        bounced: grouped.bounced.reduce((sum, item) => sum + item.amount, 0),
        returned: grouped.returned.reduce((sum, item) => sum + item.amount, 0),
        cancelled: grouped.cancelled.reduce((sum, item) => sum + item.amount, 0),
      },
    };
  }

  /**
   * Expense Register - All expenses
   */
  async expenseRegister(tenantId: string, from?: Date, to?: Date, category?: string) {
    const where: any = { tenantId };
    if (from || to) {
      where.incurredAt = {};
      if (from) where.incurredAt.gte = from;
      if (to) where.incurredAt.lte = to;
    }
    if (category) {
      where.category = category;
    }

    const expenses = await this.prisma.expense.findMany({
      where,
      include: {
        property: { select: { code: true, title: true } },
        pool: { select: { code: true, title: true } },
      },
      orderBy: { incurredAt: 'desc' },
    });

    const byCategory = {
      OFFICE: [] as any[],
      DEVELOPMENT: [] as any[],
    };

    for (const exp of expenses) {
      const item = {
        id: exp.id,
        title: exp.title,
        category: exp.category,
        subcategory: exp.subcategory,
        type: exp.type,
        vendorName: exp.vendorName,
        amount: Number(exp.amount),
        tax: Number(exp.tax || 0),
        netAmount: Number(exp.netAmount || exp.amount),
        incurredAt: exp.incurredAt,
        status: exp.status,
        property: exp.property,
        pool: exp.pool,
        costCenter: exp.costCenter,
        project: exp.project,
      };

      byCategory[exp.category].push(item);
    }

    return {
      byCategory,
      summary: {
        office: byCategory.OFFICE.reduce((sum, item) => sum + item.amount, 0),
        development: byCategory.DEVELOPMENT.reduce((sum, item) => sum + item.amount, 0),
        total: expenses.reduce((sum, exp) => sum + Number(exp.amount), 0),
      },
    };
  }

  /**
   * Recovery Report - All recovery charges and their status
   */
  async recoveryReport(tenantId: string, poolId?: string) {
    const where: any = { tenantId };
    if (poolId) {
      where.poolId = poolId;
    }

    const recoveries = await this.prisma.recoveryCharge.findMany({
      where,
      include: {
        property: { select: { code: true, title: true } },
        pool: { select: { code: true, title: true } },
      },
      orderBy: { chargeDate: 'desc' },
    });

    const invoiced = recoveries.filter((r) => r.invoiceId !== null);
    const uninvoiced = recoveries.filter((r) => r.invoiceId === null);

    return {
      recoveries: recoveries.map((rc) => ({
        id: rc.id,
        title: rc.title,
        property: rc.property,
        pool: rc.pool,
        amount: Number(rc.amount),
        chargeDate: rc.chargeDate,
        allocationMethod: rc.allocationMethod,
        allocationShare: Number(rc.allocationShare || 0),
        invoiced: rc.invoiceId !== null,
        invoiceId: rc.invoiceId,
      })),
      summary: {
        totalAllocated: recoveries.reduce((sum, rc) => sum + Number(rc.amount), 0),
        totalInvoiced: invoiced.reduce((sum, rc) => sum + Number(rc.amount), 0),
        totalUninvoiced: uninvoiced.reduce((sum, rc) => sum + Number(rc.amount), 0),
        invoicedCount: invoiced.length,
        uninvoicedCount: uninvoiced.length,
      },
    };
  }

  /**
   * Cash Flow Report - Income (Receipts) vs Expenses
   */
  async cashFlow(tenantId: string, from?: Date, to?: Date) {
    const tenantFilter = (tenantId && tenantId !== 'all') ? { tenantId } : {};

    const receiptWhere: any = {
      ...tenantFilter,
      status: 'POSTED',
    };

    const expenseWhere: any = {
      ...tenantFilter,
      status: { not: 'CANCELLED' },
    };

    if (from || to) {
      receiptWhere.receivedAt = {};
      expenseWhere.incurredAt = {};

      if (from && !isNaN(from.getTime())) {
        const start = new Date(from);
        start.setHours(0, 0, 0, 0);
        receiptWhere.receivedAt.gte = start;
        expenseWhere.incurredAt.gte = start;
      }

      if (to && !isNaN(to.getTime())) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        receiptWhere.receivedAt.lte = end;
        expenseWhere.incurredAt.lte = end;
      }
    }

    const [receipts, expenses] = await Promise.all([
      this.prisma.receipt.findMany({
        where: receiptWhere,
        include: {
          property: { select: { code: true, title: true } },
          customer: { select: { fullName: true } },
          PlotCancellation: { select: { id: true, reason: true } },
        },
        orderBy: { receivedAt: 'desc' },
      }),
      this.prisma.expense.findMany({
        where: expenseWhere,
        include: {
          property: { select: { code: true, title: true } },
        },
        orderBy: { incurredAt: 'desc' },
      }),
    ]);

    const regularReceipts: any[] = [];
    const refundVouchers: any[] = [];

    for (const r of receipts) {
      const isRefund = r.category === 'REFUND' || r.category === 'CANCELLATION' || r.code?.startsWith('REF-') || !!(r as any).PlotCancellation;

      const descParts = [];
      if (r.notes) descParts.push(r.notes);
      if (r.reference) descParts.push(`Ref: ${r.reference}`);
      if (!descParts.length && r.customer?.fullName) {
        descParts.push(isRefund ? `Refund paid to ${r.customer.fullName}` : `Received from ${r.customer.fullName}`);
      }
      if (!descParts.length) {
        descParts.push(isRefund ? `Refund paid via ${r.method}` : `Payment received via ${r.method}`);
      }

      const item = {
        id: r.id,
        code: r.code,
        date: r.receivedAt,
        property: r.property?.code || r.property?.title || '',
        description: descParts.join(' - '),
        amount: Number(r.amount),
        method: r.method,
        customerName: r.customer?.fullName,
        isRefund,
      };

      if (isRefund) {
        refundVouchers.push(item);
      } else {
        regularReceipts.push(item);
      }
    }

    const formattedExpenses = expenses.map((e) => ({
      id: e.id,
      code: e.id.slice(-6).toUpperCase(),
      date: e.incurredAt,
      property: e.property?.code || e.property?.title || '',
      description: e.title + (e.description ? ` - ${e.description}` : ''),
      amount: Number(e.amount),
      category: e.category,
      vendorName: e.vendorName,
    }));

    const totalReceived = regularReceipts.reduce((sum, r) => sum + r.amount, 0);
    const totalRefunded = refundVouchers.reduce((sum, r) => sum + r.amount, 0);
    const totalSpent = formattedExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalOutflow = totalSpent + totalRefunded;
    const netCashFlow = totalReceived - totalSpent - totalRefunded;

    return {
      receipts: regularReceipts,
      refunds: refundVouchers,
      expenses: formattedExpenses,
      totalReceived,
      totalRefunded,
      totalSpent,
      totalOutflow,
      netCashFlow,
    };
  }

}

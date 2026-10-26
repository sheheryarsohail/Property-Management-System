import os
import re

TEST_DIR = "/home/sheheryar-sohail/Downloads/Property-Management-System-test"

# 1. Update cancellations.service.ts
cancellations_path = os.path.join(TEST_DIR, "apps/api/src/cancellations/cancellations.service.ts")
with open(cancellations_path, "r", encoding="utf-8") as f:
    canc_content = f.read()

target_canc = """    // Check if receiptCode already exists
    const existingReceipt = await this.prisma.receipt.findUnique({
      where: { tenantId_code: { tenantId, code: receiptCode } },
    });
    if (existingReceipt) {
      receiptCode = receiptCode + '-' + Date.now().toString().slice(-4);
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

      // 3. Mark pending, partial, and overdue invoices for this customer as VOID
      // (Paid invoices and receipts remain intact for historical ledger accuracy)
      await tx.invoice.updateMany({
        where: {
          tenantId,
          propertyId: property.id,
          customerId: customer.id,
          status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
        },
        data: {
          status: 'VOID',
          notes: 'Voided upon plot cancellation on ' + cancellationDate.toLocaleDateString('en-GB'),
        },
      });"""

replacement_canc = """    // Check if receiptCode already exists and safely increment
    let existingReceipt = await this.prisma.receipt.findUnique({
      where: { tenantId_code: { tenantId, code: receiptCode } },
    });
    while (existingReceipt) {
      const numMatch = receiptCode.match(/\\d+$/);
      if (numMatch) {
        const nextNum = parseInt(numMatch[0], 10) + 1;
        receiptCode = receiptCode.replace(/\\d+$/, String(nextNum).padStart(numMatch[0].length, '0'));
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

      // 3. Mark ALL invoices for this cancelled customer on this property as VOID
      await tx.invoice.updateMany({
        where: {
          tenantId,
          propertyId: property.id,
          customerId: customer.id,
        },
        data: {
          status: 'VOID',
          notes: 'Voided upon plot cancellation on ' + cancellationDate.toLocaleDateString('en-GB'),
        },
      });

      // 3b. Mark ALL prior receipts for this cancelled customer on this property as VOID
      // (Receipt records remain intact in DB so their numbers cannot be reused)
      await tx.receipt.updateMany({
        where: {
          tenantId,
          propertyId: property.id,
          customerId: customer.id,
          category: { not: 'REFUND' },
        },
        data: {
          status: 'VOID',
          notes: 'Voided upon plot cancellation on ' + cancellationDate.toLocaleDateString('en-GB'),
        },
      });"""

if target_canc in canc_content:
    canc_content = canc_content.replace(target_canc, replacement_canc)
    with open(cancellations_path, "w", encoding="utf-8") as f:
        f.write(canc_content)
    print("Updated cancellations.service.ts successfully.")
else:
    print("Could not find target_canc in cancellations.service.ts!")

# 2. Update receipts.service.ts
receipts_path = os.path.join(TEST_DIR, "apps/api/src/receipts/receipts.service.ts")
with open(receipts_path, "r", encoding="utf-8") as f:
    rcp_content = f.read()

target_rcp_code = """    // 2. Receipt Code Generation with Differentiator (auto & manual)
    if (category === 'DEVELOPMENT') {
      if (receiptCode) {
        // User entered a manual code for dev receipt (e.g. "1052" or "DEV-1052")
        // Enforce differentiator prefix "DEV-" so manual dev receipt never collides with installment receipt
        const rawCode = receiptCode.replace(/^DEV-?(REC-?)?/i, '').trim();
        receiptCode = `DEV-${rawCode}`;
      } else {
        // Auto-generate DEV-REC-X
        const devCount = await this.prisma.receipt.count({
          where: {
            tenantId,
            OR: [
              { category: 'DEVELOPMENT' },
              { code: { startsWith: 'DEV-' } },
            ],
          },
        });
        receiptCode = `DEV-REC-${devCount + 1}`;
      }
    } else {
      if (!receiptCode) {
        const count = await this.prisma.receipt.count({
          where: {
            tenantId,
            NOT: { code: { startsWith: 'DEV-' } },
          },
        });
        receiptCode = `REC-${count + 1}`;
      }
    }

    const existing = await this.prisma.receipt.findUnique({
      where: { tenantId_code: { tenantId, code: receiptCode } },
    });
    if (existing) {
      throw new BadRequestException(`Receipt number ${receiptCode} already exists.`);
    }"""

replacement_rcp_code = """    // 2. Receipt Code Generation with Differentiator (auto & manual)
    if (category === 'DEVELOPMENT') {
      if (receiptCode) {
        // User entered a manual code for dev receipt (e.g. "1052" or "DEV-1052")
        // Enforce differentiator prefix "DEV-" so manual dev receipt never collides with installment receipt
        const rawCode = receiptCode.replace(/^DEV-?(REC-?)?/i, '').trim();
        receiptCode = `DEV-${rawCode}`;
      } else {
        // Auto-generate DEV-REC-X (ensure no collision)
        const devCount = await this.prisma.receipt.count({
          where: {
            tenantId,
            OR: [
              { category: 'DEVELOPMENT' },
              { code: { startsWith: 'DEV-' } },
            ],
          },
        });
        let seq = devCount + 1;
        while (await this.prisma.receipt.findUnique({ where: { tenantId_code: { tenantId, code: `DEV-REC-${seq}` } } })) {
          seq++;
        }
        receiptCode = `DEV-REC-${seq}`;
      }
    } else {
      if (!receiptCode) {
        const count = await this.prisma.receipt.count({
          where: {
            tenantId,
            NOT: { code: { startsWith: 'DEV-' } },
          },
        });
        let seq = count + 1;
        while (await this.prisma.receipt.findUnique({ where: { tenantId_code: { tenantId, code: `REC-${seq}` } } })) {
          seq++;
        }
        receiptCode = `REC-${seq}`;
      }
    }

    const existing = await this.prisma.receipt.findUnique({
      where: { tenantId_code: { tenantId, code: receiptCode } },
    });
    if (existing) {
      if (existing.status === 'VOID') {
        throw new BadRequestException(`Receipt number ${receiptCode} was VOIDED and cannot be reused.`);
      }
      throw new BadRequestException(`Receipt number ${receiptCode} already exists.`);
    }"""

if target_rcp_code in rcp_content:
    rcp_content = rcp_content.replace(target_rcp_code, replacement_rcp_code)
    print("Replaced receipt code generation successfully.")
else:
    print("Could not find target_rcp_code in receipts.service.ts!")

# Update PDF status for VOID in generateReceiptPdf
target_pdf_status = """      const displayStatus = receipt.status === 'POSTED' ? 'PAID' : receipt.status;"""
replacement_pdf_status = """      const isVoid = receipt.status === 'VOID';
      const displayStatus = isVoid ? 'VOID' : (receipt.status === 'POSTED' ? 'PAID' : receipt.status);
      const statusColor = isVoid ? '#dc2626' : '#15803d';"""

if target_pdf_status in rcp_content:
    rcp_content = rcp_content.replace(target_pdf_status, replacement_pdf_status)
    rcp_content = rcp_content.replace(
        "doc.fontSize(8).font('Helvetica-Bold').fillColor('#15803d').text(`Status: ${displayStatus}`",
        "doc.fontSize(8).font('Helvetica-Bold').fillColor(statusColor).text(`Status: ${displayStatus}`"
    )
    # Add watermark if VOID
    watermark_target = """      // Content starts strictly after 1.5 inch header blank space
      const contentTop = offsetY + HEADER_BLANK_PT;"""
    watermark_replacement = """      // Content starts strictly after 1.5 inch header blank space
      const contentTop = offsetY + HEADER_BLANK_PT;

      if (isVoid) {
        doc.save();
        doc.fontSize(36).font('Helvetica-Bold').fillColor('#dc2626', 0.25).text('VOID / CANCELLED', 48, contentTop + 45, { align: 'center', width: doc.page.width - 96 });
        doc.restore();
      }"""
    rcp_content = rcp_content.replace(watermark_target, watermark_replacement)
    with open(receipts_path, "w", encoding="utf-8") as f:
        f.write(rcp_content)
    print("Updated receipts.service.ts PDF status successfully.")
else:
    print("Could not find target_pdf_status in receipts.service.ts!")

# 3. Update reports.service.ts
reports_path = os.path.join(TEST_DIR, "apps/api/src/reports/reports.service.ts")
with open(reports_path, "r", encoding="utf-8") as f:
    rep_content = f.read()

# Replace propertyLedger implementation
target_prop_ledger = """    const [invoices, receipts, recoveryCharges] = await Promise.all([
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
          status: { not: 'VOID' as any },
          ...(from || to ? { receivedAt: where.OR?.[0]?.issueDate } : {}) 
        },
        orderBy: { receivedAt: 'asc' },
      }),
      this.prisma.recoveryCharge.findMany({
        where: { tenantId, propertyId, ...(from || to ? { chargeDate: where.OR?.[0]?.issueDate } : {}) },
        orderBy: { chargeDate: 'asc' },
      }),
    ]);

    const entries = [];
    invoices.forEach(inv => {
      const isDev = inv.type === 'DEVELOPMENT_CHARGE';
      entries.push({
        id: inv.id,
        date: inv.issueDate,
        type: isDev ? 'Dev Charges' : (inv.type === 'INSTALLMENT' ? 'Installment' : 'Invoice'),
        category: isDev ? 'DEVELOPMENT' : 'INSTALLMENT',
        description: isDev ? `Dev Invoice ${inv.code}` : `Invoice ${inv.code}`,
        debit: Number(inv.total),
        credit: 0,
      });
    });

    receipts.forEach(rcp => {
      const isDev = rcp.category === 'DEVELOPMENT' || rcp.code?.startsWith('DEV-');
      let desc = isDev ? `Dev Receipt ${rcp.code} (${rcp.method})` : `Receipt ${rcp.code} (${rcp.method})`;
      if (rcp.allocations && Array.isArray(rcp.allocations)) {
        const allocs = (rcp.allocations as any[]).map((a: any) => a.invoiceCode);
        if (allocs.length > 0) desc += ` - Applied to: ${allocs.join(', ')}`;
      }
      entries.push({
        id: rcp.id,
        date: rcp.receivedAt,
        type: isDev ? 'Dev Receipt' : 'Receipt',
        category: isDev ? 'DEVELOPMENT' : 'INSTALLMENT',
        description: desc,
        debit: 0,
        credit: Number(rcp.amount),
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
    }));

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

    // Split invoices and receipts into Installments vs Development Charges
    const devInvoices = invoices.filter(inv => inv.type === 'DEVELOPMENT_CHARGE');
    const installmentInvoices = invoices.filter(inv => inv.type !== 'DEVELOPMENT_CHARGE');

    const devReceipts = receipts.filter(rcp => rcp.category === 'DEVELOPMENT' || rcp.code?.startsWith('DEV-'));
    const installmentReceipts = receipts.filter(rcp => rcp.category !== 'DEVELOPMENT' && !rcp.code?.startsWith('DEV-'));

    // 1. Base Plot Financials
    const totalPrice = Number(property.totalPrice || 0);
    const installmentInvoiced = installmentInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
    const installmentPaid = installmentReceipts.reduce((sum, rcp) => sum + Number(rcp.amount), 0);
    const installmentRemaining = Math.max(0, totalPrice - installmentPaid);
    const installmentOutstanding = installmentInvoices
      .filter(inv => ['OVERDUE', 'PARTIAL', 'PDC'].includes(inv.status))
      .reduce((sum, inv) => sum + Math.max(0, Number(inv.total) - Number(inv.paid)), 0);

    // 2. Development Charges Financials
    const devChargesConfigured = Number(property.developmentCharges || 0);
    const devChargesInvoiced = devInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
    const devChargesPaid = devReceipts.reduce((sum, rcp) => sum + Number(rcp.amount), 0);
    const devChargesTotal = Math.max(devChargesConfigured, devChargesInvoiced);
    const devChargesRemaining = Math.max(0, devChargesTotal - devChargesPaid);
    const devChargesOutstanding = devInvoices
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

    const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
    const totalRecovery = recoveryCharges.reduce((sum, rc) => sum + Number(rc.amount), 0);"""

replacement_prop_ledger = """    const [invoices, receipts, recoveryCharges] = await Promise.all([
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
        category: isDev ? 'DEVELOPMENT' : (isRefund ? 'REFUND' : 'INSTALLMENT'),
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
    const totalRecovery = recoveryCharges.reduce((sum, rc) => sum + Number(rc.amount), 0);"""

if target_prop_ledger in rep_content:
    rep_content = rep_content.replace(target_prop_ledger, replacement_prop_ledger)
    print("Replaced propertyLedger in reports.service.ts successfully.")
else:
    print("Could not find target_prop_ledger in reports.service.ts!")

# Update customerLedger in reports.service.ts
target_cust_ledger_splits = """      const propDevReceipts = prop.receipts.filter((rcp: any) => rcp.category === 'DEVELOPMENT' || rcp.code?.startsWith('DEV-'));
      const propInstReceipts = prop.receipts.filter((rcp: any) => rcp.category !== 'DEVELOPMENT' && !rcp.code?.startsWith('DEV-'));"""

replacement_cust_ledger_splits = """      const propDevReceipts = prop.receipts.filter((rcp: any) => (rcp.category === 'DEVELOPMENT' || rcp.code?.startsWith('DEV-')) && rcp.status !== 'VOID' && rcp.category !== 'REFUND');
      const propInstReceipts = prop.receipts.filter((rcp: any) => rcp.category !== 'DEVELOPMENT' && !rcp.code?.startsWith('DEV-') && rcp.status !== 'VOID' && rcp.category !== 'REFUND');"""

if target_cust_ledger_splits in rep_content:
    rep_content = rep_content.replace(target_cust_ledger_splits, replacement_cust_ledger_splits)
    print("Replaced customerLedger splits in reports.service.ts successfully.")

target_cust_ledger_total_paid = """    const totalPaidAll = receipts.reduce((sum, rcp) => sum + Number(rcp.amount), 0);"""
replacement_cust_ledger_total_paid = """    const activeCustReceipts = receipts.filter(rcp => rcp.status !== 'VOID' && rcp.category !== 'REFUND');
    const totalPaidAll = activeCustReceipts.reduce((sum, rcp) => sum + Number(rcp.amount), 0);"""

if target_cust_ledger_total_paid in rep_content:
    rep_content = rep_content.replace(target_cust_ledger_total_paid, replacement_cust_ledger_total_paid)
    print("Replaced customerLedger totalPaidAll in reports.service.ts successfully.")

# Also in customerLedger entries: handle VOID and REFUND
target_cust_ledger_entries = """    receipts.forEach(rcp => {
      const isDev = rcp.category === 'DEVELOPMENT' || rcp.code?.startsWith('DEV-');
      let desc = isDev ? `Dev Receipt ${rcp.code} (${rcp.method})` : `Receipt ${rcp.code} (${rcp.method})`;
      if (rcp.allocations && Array.isArray(rcp.allocations)) {
        const allocs = (rcp.allocations as any[]).map((a: any) => a.invoiceCode);
        if (allocs.length > 0) desc += ` - Applied to: ${allocs.join(', ')}`;
      }
      entries.push({
        id: rcp.id,
        date: rcp.receivedAt,
        type: isDev ? 'Dev Receipt' : 'Receipt',
        category: isDev ? 'DEVELOPMENT' : 'INSTALLMENT',
        description: desc,
        debit: 0,
        credit: Number(rcp.amount),
        propertyId: rcp.propertyId,
      });
    });"""

replacement_cust_ledger_entries = """    receipts.forEach(rcp => {
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
        category: isDev ? 'DEVELOPMENT' : (isRefund ? 'REFUND' : 'INSTALLMENT'),
        description: desc,
        debit: 0,
        credit,
        propertyId: rcp.propertyId,
        status: rcp.status,
      });
    });"""

if target_cust_ledger_entries in rep_content:
    rep_content = rep_content.replace(target_cust_ledger_entries, replacement_cust_ledger_entries)
    print("Replaced customerLedger entries in reports.service.ts successfully.")

with open(reports_path, "w", encoding="utf-8") as f:
    f.write(rep_content)
print("Updated reports.service.ts successfully.")

# 4. Update apps/web/src/app/(dashboard)/reports/property-ledger/page.tsx
web_ledger_path = os.path.join(TEST_DIR, "apps/web/src/app/(dashboard)/reports/property-ledger/page.tsx")
with open(web_ledger_path, "r", encoding="utf-8") as f:
    web_content = f.read()

target_web_badge = """  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'Dev Charges':
        return <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800">Dev Charges</span>
      case 'Dev Receipt':
        return <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800">Dev Receipt</span>
      case 'Installment':
        return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">Installment</span>
      case 'Receipt':
        return <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">Receipt</span>
      case 'Recovery Charge':
        return <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">Recovery</span>
      default:
        return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">{type || 'N/A'}</span>
    }
  }"""

replacement_web_badge = """  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'Plot Cost':
        return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">Plot Cost</span>
      case 'Dev Charges':
        return <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800">Dev Charges</span>
      case 'Dev Receipt':
        return <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800">Dev Receipt</span>
      case 'Installment':
        return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">Installment</span>
      case 'Receipt':
        return <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">Receipt</span>
      case 'Recovery Charge':
        return <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">Recovery</span>
      case 'Refund Voucher':
        return <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-300">Refund Voucher</span>
      case 'Receipt (VOID)':
      case 'Dev Receipt (VOID)':
      case 'Invoice (VOID)':
      case 'Dev Charges (VOID)':
      case 'Installment (VOID)':
        return <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800 border border-rose-200">VOID</span>
      default:
        return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">{type || 'N/A'}</span>
    }
  }"""

if target_web_badge in web_content:
    web_content = web_content.replace(target_web_badge, replacement_web_badge)
    with open(web_ledger_path, "w", encoding="utf-8") as f:
        f.write(web_content)
    print("Updated property-ledger/page.tsx badges successfully.")
else:
    print("Could not find target_web_badge in property-ledger/page.tsx!")

print("All updates applied!")

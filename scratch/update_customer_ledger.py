path = '/home/sheheryar-sohail/Downloads/Property-Management-System-test/apps/api/src/reports/reports.service.ts'
with open(path, 'r') as f:
    content = f.read()

# 1. Update byProperty initialization if not already updated
old_by_prop = """    // Group by property
    const byProperty = new Map();
    
    // First initialize with all owned properties
    if (customer.ownerships) {
      for (const own of customer.ownerships) {
        if (own.property) {
          byProperty.set(own.property.id, {
            property: own.property,
            invoices: [],
            receipts: [],
          });
        }
      }
    }"""

new_by_prop = """    // Group by property
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
    }"""

if old_by_prop in content:
    content = content.replace(old_by_prop, new_by_prop)
    print("Replaced byProperty")

# 2. Update invoice loop in entries
old_inv_loop = """    const entries = [];
    invoices.forEach(inv => {
      const isDev = inv.type === 'DEVELOPMENT_CHARGE';
      entries.push({
        id: inv.id,
        date: inv.issueDate,
        type: isDev ? 'Dev Charges' : (inv.type === 'INSTALLMENT' ? 'Installment' : 'Invoice'),
        category: isDev ? 'DEVELOPMENT' : 'INSTALLMENT',
        description: isDev ? `Dev Invoice ${inv.code} - ${inv.property?.code || 'No Plot'}` : `Invoice ${inv.code} - ${inv.property?.code || 'No Plot'}`,
        debit: Number(inv.total),
        credit: 0,
        propertyId: inv.propertyId,
      });
    });"""

new_inv_loop = """    const entries = [];
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
    });"""

if old_inv_loop in content:
    content = content.replace(old_inv_loop, new_inv_loop)
    print("Replaced inv loop")

# 3. Update propertiesList mapping & grand total
old_prop_block = """    const propertiesList = Array.from(byProperty.values()).map((prop) => {
      const propTotalPrice = Number(prop.property?.totalPrice || 0);
      const propDevConfigured = Number(prop.property?.developmentCharges || 0);
      
      const propDevInvoices = prop.invoices.filter((inv: any) => inv.type === 'DEVELOPMENT_CHARGE');
      const propInstInvoices = prop.invoices.filter((inv: any) => inv.type !== 'DEVELOPMENT_CHARGE');
      
      const propDevReceipts = prop.receipts.filter((rcp: any) => (rcp.category === 'DEVELOPMENT' || rcp.code?.startsWith('DEV-')) && rcp.status !== 'VOID' && rcp.category !== 'REFUND');
      const propInstReceipts = prop.receipts.filter((rcp: any) => rcp.category !== 'DEVELOPMENT' && !rcp.code?.startsWith('DEV-') && rcp.status !== 'VOID' && rcp.category !== 'REFUND');
      
      const propDevInvoiced = propDevInvoices.reduce((sum: number, inv: any) => sum + Number(inv.total), 0);
      const propDevPaid = propDevReceipts.reduce((sum: number, rcp: any) => sum + Number(rcp.amount), 0);
      const propDevTotal = Math.max(propDevConfigured, propDevInvoiced);
      const propDevRemaining = Math.max(0, propDevTotal - propDevPaid);
      
      const propInstInvoiced = propInstInvoices.reduce((sum: number, inv: any) => sum + Number(inv.total), 0);
      const propInstPaid = propInstReceipts.reduce((sum: number, rcp: any) => sum + Number(rcp.amount), 0);
      const propInstRemaining = Math.max(0, propTotalPrice - propInstPaid);
      
      const propTotalPaid = propInstPaid + propDevPaid;
      const propGrandTotal = propTotalPrice + propDevTotal;
      const propRemainingBalance = Math.max(0, propGrandTotal - propTotalPaid);
      const propArrears = prop.invoices
        .filter((inv: any) => ['OVERDUE', 'PARTIAL', 'PDC'].includes(inv.status))
        .reduce((sum: number, inv: any) => sum + Math.max(0, Number(inv.total) - Number(inv.paid)), 0);

      return {
        property: prop.property,
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
        })),
        summary: {
          totalPrice: propTotalPrice,
          installmentInvoiced: propInstInvoiced,
          installmentPaid: propInstPaid,
          installmentRemaining: propInstRemaining,
          devChargesTotal: propDevTotal,
          devChargesConfigured: propDevConfigured,
          devChargesInvoiced: propDevInvoiced,
          devChargesPaid: propDevPaid,
          devChargesRemaining: propDevRemaining,
          grandTotal: propGrandTotal,
          totalInvoiced: prop.invoices.reduce((sum: number, inv: any) => sum + Number(inv.total), 0),
          totalPaid: propTotalPaid,
          remainingBalance: propRemainingBalance,
          outstandingArrears: propArrears,
          balance: prop.invoices.reduce((sum: number, inv: any) => sum + (Number(inv.total) - Number(inv.paid)), 0),
        },
      };
    });

    const totalPlotValue = propertiesList.reduce((sum, p) => sum + p.summary.totalPrice, 0);
    const totalDevCharges = propertiesList.reduce((sum, p) => sum + p.summary.devChargesTotal, 0);
    const grandTotalPlotPrice = totalPlotValue + totalDevCharges;
    const activeCustReceipts = receipts.filter(rcp => rcp.status !== 'VOID' && rcp.category !== 'REFUND');
    const totalPaidAll = activeCustReceipts.reduce((sum, rcp) => sum + Number(rcp.amount), 0);
    const totalRemainingAll = Math.max(0, grandTotalPlotPrice - totalPaidAll);
    const totalOutstandingArrears = propertiesList.reduce((sum, p) => sum + p.summary.outstandingArrears, 0);"""

new_prop_block = """    const propertiesList = Array.from(byProperty.values()).map((prop) => {
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
    const totalCustBalance = activeCustInvoices.reduce((sum, inv) => sum + (Number(inv.total) - Number(inv.paid)), 0);"""

assert old_prop_block in content, 'old_prop_block not found'
content = content.replace(old_prop_block, new_prop_block)
print("Replaced prop_block")

# 4. Update return blocks in customerLedger
old_return_block = """      grandTotal: {
        totalPlotValue,
        totalDevCharges,
        grandTotalPlotPrice,
        totalInvoiced: invoices.reduce((sum, inv) => sum + Number(inv.total), 0),
        totalPaid: totalPaidAll,
        balance: invoices.reduce((sum, inv) => sum + (Number(inv.total) - Number(inv.paid)), 0),
        remainingBalance: totalRemainingAll,
        outstandingArrears: totalOutstandingArrears,
      },
      summary: {
        totalPlotValue,
        totalDevCharges,
        grandTotalPlotPrice,
        totalInvoiced: invoices.reduce((sum, inv) => sum + Number(inv.total), 0),
        outstanding: totalOutstandingArrears,
        totalReceived: totalPaidAll,
        totalPaid: totalPaidAll,
        remainingBalance: totalRemainingAll,
        balance: invoices.reduce((sum, inv) => sum + (Number(inv.total) - Number(inv.paid)), 0),
      }"""

new_return_block = """      grandTotal: {
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
      }"""

assert old_return_block in content, 'old_return_block not found'
content = content.replace(old_return_block, new_return_block)
print("Replaced return block")

with open(path, 'w') as f:
    f.write(content)

print('Successfully updated customerLedger in reports.service.ts')

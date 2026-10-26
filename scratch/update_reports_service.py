import os

target_path = '/home/sheheryar-sohail/Downloads/Property-Management-System-test/apps/api/src/reports/reports.service.ts'

with open(target_path, 'r', encoding='utf-8') as f:
    text = f.read()

old_block = '''    const [receipts, invoices, expenses] = await Promise.all([
      this.prisma.receipt.findMany({ where: receiptWhere }),
      this.prisma.invoice.findMany({ where: invoiceWhere }),
      this.prisma.expense.findMany({ where: expenseWhere }),
    ]);

    const validReceipts = receipts.filter(r => r.status !== 'VOID');
    const baseInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
    const unInvoicedReceipts = validReceipts.filter(r => !r.invoiceId).reduce((sum, rcp) => sum + Number(rcp.amount), 0);
    const totalInvoiced = baseInvoiced + unInvoicedReceipts;
    const totalRecovered = validReceipts.reduce((sum, rcp) => sum + Number(rcp.amount), 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

    const devInvoiced = invoices.filter(i => i.type === 'DEVELOPMENT_CHARGE').reduce((sum, i) => sum + Number(i.total), 0);
    const installmentInvoiced = invoices.filter(i => i.type !== 'DEVELOPMENT_CHARGE').reduce((sum, i) => sum + Number(i.total), 0);
    const devRecovered = validReceipts.filter(r => r.category === 'DEVELOPMENT' || r.code?.startsWith('DEV-')).reduce((sum, r) => sum + Number(r.amount), 0);
    const installmentRecovered = validReceipts.filter(r => r.category !== 'DEVELOPMENT' && !r.code?.startsWith('DEV-')).reduce((sum, r) => sum + Number(r.amount), 0);
    
    const expensesByCategory = expenses.reduce((acc, exp) => {
      const cat = exp.category || 'UNCATEGORIZED';
      if (!acc[cat]) acc[cat] = 0;
      acc[cat] += Number(exp.amount);
      return acc;
    }, {} as Record<string, number>);

    return {
      revenue: {
        totalInvoiced,
        installmentInvoiced,
        devInvoiced,
        totalRecovered,
        installmentRecovered,
        devRecovered,
        pendingReceivables: Math.max(0, totalInvoiced - totalRecovered),
      },
      expenses: {
        total: totalExpenses,
        byCategory: Object.entries(expensesByCategory).map(([category, amount]) => ({
          category,
          amount,
        })),
        details: expenses.map(e => ({
          id: e.id,
          date: e.date,
          amount: Number(e.amount),
          category: e.category,
          type: e.type,
          notes: e.notes,
        })),
      },
      netCashFlow: totalRecovered - totalExpenses,
    };'''

new_block = '''    const validReceiptWhere = { ...receiptWhere, status: { not: 'VOID' as const } };

    const [
      devInvAgg,
      instInvAgg,
      uninvRcpAgg,
      devRcpAgg,
      allRcpAgg,
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
      this.prisma.expense.aggregate({ where: expenseWhere, _sum: { amount: true } }),
      this.prisma.expense.groupBy({ by: ['category'], where: expenseWhere, _sum: { amount: true } }),
      this.prisma.expense.findMany({
        where: expenseWhere,
        select: { id: true, date: true, amount: true, category: true, type: true, notes: true },
        take: 500,
        orderBy: { date: 'desc' },
      }),
    ]);

    const devInvoiced = Number(devInvAgg._sum.total ?? 0);
    const installmentInvoiced = Number(instInvAgg._sum.total ?? 0);
    const baseInvoiced = devInvoiced + installmentInvoiced;
    const unInvoicedReceipts = Number(uninvRcpAgg._sum.amount ?? 0);
    const totalInvoiced = baseInvoiced + unInvoicedReceipts;
    const totalRecovered = Number(allRcpAgg._sum.amount ?? 0);
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
        installmentRecovered,
        devRecovered,
        pendingReceivables: Math.max(0, totalInvoiced - totalRecovered),
      },
      expenses: {
        total: totalExpenses,
        byCategory,
        details: expenses.map(e => ({
          id: e.id,
          date: e.date,
          amount: Number(e.amount),
          category: e.category,
          type: e.type,
          notes: e.notes,
        })),
      },
      netCashFlow: totalRecovered - totalExpenses,
    };'''

assert old_block in text, "Could not find old_block in reports.service.ts"
updated_text = text.replace(old_block, new_block)

with open(target_path, 'w', encoding='utf-8') as f:
    f.write(updated_text)

print("SUCCESS: Successfully optimized financialSummary with PostgreSQL query aggregation!")

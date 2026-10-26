import os

test_base = "/home/sheheryar-sohail/Downloads/Property-Management-System-test"

# 1. Update apps/web/src/app/(dashboard)/invoices/page.tsx
invoices_page_path = os.path.join(test_base, "apps/web/src/app/(dashboard)/invoices/page.tsx")
with open(invoices_page_path, "r", encoding="utf-8") as f:
    inv_content = f.read()

# Fix CSV export
old_csv_balance = "Balance: Number(inv.total) - Number(inv.paid),"
new_csv_balance = "Balance: inv.status === 'VOID' ? 0 : Math.max(Number(inv.total) - Number(inv.paid), 0),"
inv_content = inv_content.replace(old_csv_balance, new_csv_balance)

# Fix Table Row
old_table_row = """                      {filteredInvoices.map((invoice: any) => {
                        const balance = Number(invoice.total) - Number(invoice.paid)
                        let typeName = 'Installment'
                        if (invoice.type === 'BOOKING') typeName = 'Booking'
                        else if (invoice.type === 'CONFIRMATION' || invoice.type === 'HALF_YEARLY') typeName = 'Confirmation'
                        else if (invoice.type === 'INSTALLMENT') typeName = `Installment`
                        else if (invoice.type === 'YEARLY') typeName = `Yearly`

                        return (
                          <tr key={invoice.id} className="transition hover:bg-muted/50">"""

new_table_row = """                      {filteredInvoices.map((invoice: any) => {
                        const isVoid = invoice.status === 'VOID'
                        const isPaid = invoice.status === 'PAID'
                        const balance = isVoid ? 0 : Math.max(Number(invoice.total) - Number(invoice.paid), 0)
                        let typeName = 'Installment'
                        if (invoice.type === 'BOOKING') typeName = 'Booking'
                        else if (invoice.type === 'CONFIRMATION' || invoice.type === 'HALF_YEARLY') typeName = 'Confirmation'
                        else if (invoice.type === 'INSTALLMENT') typeName = `Installment`
                        else if (invoice.type === 'YEARLY') typeName = `Yearly`

                        return (
                          <tr key={invoice.id} className={`transition hover:bg-muted/50 ${isVoid ? 'opacity-60 bg-slate-50/60 dark:bg-slate-900/40' : ''}`}>"""

inv_content = inv_content.replace(old_table_row, new_table_row)

# Fix Table Balance and Pay columns
old_table_cols = """                          <td className="px-4 py-3 text-right font-semibold">
                            {invoice.status === 'PAID' ? (
                              <span className="text-emerald-600">PAID</span>
                            ) : (
                              formatCurrency(balance)
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(invoice.status)}`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {invoice.status !== 'PAID' && balance > 0 ? (
                              <Link
                                href={`/receipts/new?propertyId=${invoice.property?.id || ''}&customerId=${invoice.customer?.id || ''}&invoiceId=${invoice.id}&category=INSTALLMENT`}
                                className="rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-xs font-medium hover:bg-emerald-100 transition inline-block"
                              >
                                Pay
                              </Link>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>"""

new_table_cols = """                          <td className="px-4 py-3 text-right font-semibold">
                            {invoice.status === 'PAID' ? (
                              <span className="text-emerald-600">PAID</span>
                            ) : isVoid ? (
                              <span className="text-muted-foreground line-through">—</span>
                            ) : (
                              formatCurrency(balance)
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(invoice.status)}`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {!isPaid && !isVoid && balance > 0 ? (
                              <Link
                                href={`/receipts/new?propertyId=${invoice.property?.id || ''}&customerId=${invoice.customer?.id || ''}&invoiceId=${invoice.id}&category=INSTALLMENT`}
                                className="rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-xs font-medium hover:bg-emerald-100 transition inline-block"
                              >
                                Pay
                              </Link>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>"""

inv_content = inv_content.replace(old_table_cols, new_table_cols)

# Fix Mobile Cards
old_mobile_card = """            {/* Mobile cards */}
            <div className="space-y-3 sm:hidden">
              {filteredInvoices.map((invoice: any) => {
                const balance = Number(invoice.total) - Number(invoice.paid)
                let typeName = 'Installment'
                if (invoice.type === 'BOOKING') typeName = 'Booking'
                else if (invoice.type === 'CONFIRMATION' || invoice.type === 'HALF_YEARLY') typeName = 'Confirmation'
                else if (invoice.type === 'INSTALLMENT') typeName = `Installment`
                else if (invoice.type === 'YEARLY') typeName = `Yearly`

                return (
                  <div
                    key={invoice.id}
                    className="rounded-xl border bg-card p-4 transition shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{typeName}</p>
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                          {invoice.customer?.fullName || 'N/A'} • {invoice.property?.code || 'N/A'}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Due {formatDate(invoice.dueDate)}</span>
                      <div className="text-right">
                        {invoice.status === 'PAID' ? (
                          <p className="font-semibold text-emerald-600">PAID</p>
                        ) : (
                          <p className="font-semibold">{formatCurrency(balance)}</p>
                        )}
                        <p className="text-xs text-muted-foreground">of {formatCurrency(Number(invoice.total))}</p>
                      </div>
                    </div>
                    {invoice.status !== 'PAID' && balance > 0 && (
                      <div className="mt-3 flex justify-end border-t pt-2.5">
                        <Link
                          href={`/receipts/new?propertyId=${invoice.property?.id || ''}&customerId=${invoice.customer?.id || ''}&invoiceId=${invoice.id}&category=INSTALLMENT`}
                          className="rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-medium hover:bg-emerald-100 transition inline-block"
                        >
                          Pay
                        </Link>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>"""

new_mobile_card = """            {/* Mobile cards */}
            <div className="space-y-3 sm:hidden">
              {filteredInvoices.map((invoice: any) => {
                const isVoid = invoice.status === 'VOID'
                const isPaid = invoice.status === 'PAID'
                const balance = isVoid ? 0 : Math.max(Number(invoice.total) - Number(invoice.paid), 0)
                let typeName = 'Installment'
                if (invoice.type === 'BOOKING') typeName = 'Booking'
                else if (invoice.type === 'CONFIRMATION' || invoice.type === 'HALF_YEARLY') typeName = 'Confirmation'
                else if (invoice.type === 'INSTALLMENT') typeName = `Installment`
                else if (invoice.type === 'YEARLY') typeName = `Yearly`

                return (
                  <div
                    key={invoice.id}
                    className={`rounded-xl border bg-card p-4 transition shadow-sm ${isVoid ? 'opacity-60 bg-slate-50/60 dark:bg-slate-900/40' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{typeName}</p>
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                          {invoice.customer?.fullName || 'N/A'} • {invoice.property?.code || 'N/A'}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Due {formatDate(invoice.dueDate)}</span>
                      <div className="text-right">
                        {isPaid ? (
                          <p className="font-semibold text-emerald-600">PAID</p>
                        ) : isVoid ? (
                          <p className="font-semibold text-muted-foreground line-through">VOID</p>
                        ) : (
                          <p className="font-semibold">{formatCurrency(balance)}</p>
                        )}
                        <p className="text-xs text-muted-foreground">of {formatCurrency(Number(invoice.total))}</p>
                      </div>
                    </div>
                    {!isPaid && !isVoid && balance > 0 && (
                      <div className="mt-3 flex justify-end border-t pt-2.5">
                        <Link
                          href={`/receipts/new?propertyId=${invoice.property?.id || ''}&customerId=${invoice.customer?.id || ''}&invoiceId=${invoice.id}&category=INSTALLMENT`}
                          className="rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-medium hover:bg-emerald-100 transition inline-block"
                        >
                          Pay
                        </Link>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>"""

inv_content = inv_content.replace(old_mobile_card, new_mobile_card)

with open(invoices_page_path, "w", encoding="utf-8") as f:
    f.write(inv_content)
print("Updated invoices/page.tsx")

# 2. Update apps/web/src/app/(dashboard)/development-charges/page.tsx
dev_page_path = os.path.join(test_base, "apps/web/src/app/(dashboard)/development-charges/page.tsx")
with open(dev_page_path, "r", encoding="utf-8") as f:
    dev_content = f.read()

old_dev_pay = """                            {p.customer && p.balance > 0 && (
                              <Link
                                href={`/receipts/new?propertyId=${p.id}&customerId=${p.customer.id}&invoiceId=${p.invoice?.id || ''}&category=DEVELOPMENT`}
                                className="rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-xs font-medium hover:bg-emerald-100 transition"
                              >
                                Pay
                              </Link>
                            )}"""

new_dev_pay = """                            {p.customer && p.balance > 0 && p.status !== 'VOID' && p.invoice?.status !== 'VOID' && (
                              <Link
                                href={`/receipts/new?propertyId=${p.id}&customerId=${p.customer.id}&invoiceId=${p.invoice?.id || ''}&category=DEVELOPMENT`}
                                className="rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-xs font-medium hover:bg-emerald-100 transition"
                              >
                                Pay
                              </Link>
                            )}"""

dev_content = dev_content.replace(old_dev_pay, new_dev_pay)

with open(dev_page_path, "w", encoding="utf-8") as f:
    f.write(dev_content)
print("Updated development-charges/page.tsx")

# 3. Update apps/web/src/app/(dashboard)/receipts/new/page.tsx
receipts_new_path = os.path.join(test_base, "apps/web/src/app/(dashboard)/receipts/new/page.tsx")
with open(receipts_new_path, "r", encoding="utf-8") as f:
    rec_content = f.read()

old_filter = """  // Filter invoices according to selected category (INSTALLMENT vs DEVELOPMENT)
  const filteredInvoiceOptions = invoiceOptions.filter((inv) => {
    if (category === 'DEVELOPMENT') {
      return inv.type === 'DEVELOPMENT_CHARGE'
    } else {
      return inv.type !== 'DEVELOPMENT_CHARGE'
    }
  })"""

new_filter = """  // Filter invoices according to selected category (INSTALLMENT vs DEVELOPMENT)
  const filteredInvoiceOptions = invoiceOptions.filter((inv) => {
    if (inv.status === 'VOID' || inv.status === 'PAID') return false
    if (inv.balance <= 0) return false
    if (category === 'DEVELOPMENT') {
      return inv.type === 'DEVELOPMENT_CHARGE'
    } else {
      return inv.type !== 'DEVELOPMENT_CHARGE'
    }
  })"""

rec_content = rec_content.replace(old_filter, new_filter)

# Warn if preselected singleInvoice is VOID
old_single_inv = """  const { data: singleInvoice } = useQuery({
    queryKey: ['invoice', preselectedInvoiceId],
    queryFn: () => invoicesApi.get(preselectedInvoiceId),
    enabled: !!preselectedInvoiceId && !invoiceOptions.some((i) => i.id === preselectedInvoiceId),
  })"""

new_single_inv = """  const { data: singleInvoice } = useQuery({
    queryKey: ['invoice', preselectedInvoiceId],
    queryFn: () => invoicesApi.get(preselectedInvoiceId),
    enabled: !!preselectedInvoiceId && !invoiceOptions.some((i) => i.id === preselectedInvoiceId),
  })

  useEffect(() => {
    if (singleInvoice && (singleInvoice.status === 'VOID' || singleInvoice.status === 'PAID')) {
      toast.error(`Invoice ${singleInvoice.code} is ${singleInvoice.status} and cannot receive payments.`)
      form.setValue('invoiceId', '')
    }
  }, [singleInvoice, form])"""

rec_content = rec_content.replace(old_single_inv, new_single_inv)

with open(receipts_new_path, "w", encoding="utf-8") as f:
    f.write(rec_content)
print("Updated receipts/new/page.tsx")

# 4. Update apps/web/src/app/(dashboard)/payment-plans/[id]/page.tsx
plan_detail_path = os.path.join(test_base, "apps/web/src/app/(dashboard)/payment-plans/[id]/page.tsx")
with open(plan_detail_path, "r", encoding="utf-8") as f:
    plan_content = f.read()

old_plan_calc = """  const totalPaid = installments.reduce((sum, installment) => {
    const paid = installment.invoice?.paid ?? 0
    return sum + Number(paid)
  }, 0)

  const totalGeneratedAmount = installments.reduce((sum, installment) => {
    return sum + (installment.invoice ? Number(installment.invoice.total) : 0)
  }, 0)"""

new_plan_calc = """  const totalPaid = installments.reduce((sum, installment) => {
    if (installment.invoice?.status === 'VOID') return sum
    const paid = installment.invoice?.paid ?? 0
    return sum + Number(paid)
  }, 0)

  const totalGeneratedAmount = installments.reduce((sum, installment) => {
    if (installment.invoice?.status === 'VOID') return sum
    return sum + (installment.invoice ? Number(installment.invoice.total) : 0)
  }, 0)"""

plan_content = plan_content.replace(old_plan_calc, new_plan_calc)

old_badge = """                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium uppercase ${
                            invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                            invoice.status === 'PARTIAL' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>"""

new_badge = """                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium uppercase ${
                            invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                            invoice.status === 'PARTIAL' ? 'bg-amber-100 text-amber-700' :
                            invoice.status === 'VOID' ? 'bg-slate-100 text-slate-500 line-through' :
                            'bg-slate-100 text-slate-700'
                          }`}>"""

plan_content = plan_content.replace(old_badge, new_badge)

with open(plan_detail_path, "w", encoding="utf-8") as f:
    f.write(plan_content)
print("Updated payment-plans/[id]/page.tsx")

# 5. Update apps/api/src/receipts/receipts.service.ts to reject payments to VOID invoices
rec_service_path = os.path.join(test_base, "apps/api/src/receipts/receipts.service.ts")
with open(rec_service_path, "r", encoding="utf-8") as f:
    rec_srv = f.read()

old_target = """    // 1. Target specific invoice if provided
    if (input.invoiceId) {
      const targetInvoice = await this.prisma.invoice.findUnique({ where: { id: input.invoiceId } });
      if (targetInvoice) {"""

new_target = """    // 1. Target specific invoice if provided
    if (input.invoiceId) {
      const targetInvoice = await this.prisma.invoice.findUnique({ where: { id: input.invoiceId } });
      if (targetInvoice) {
        if (targetInvoice.status === 'VOID') {
          throw new BadRequestException(`Cannot apply payment to a VOID invoice (${targetInvoice.code})`);
        }"""

rec_srv = rec_srv.replace(old_target, new_target)

with open(rec_service_path, "w", encoding="utf-8") as f:
    f.write(rec_srv)
print("Updated receipts.service.ts with VOID invoice payment rejection")

print("All files updated successfully!")

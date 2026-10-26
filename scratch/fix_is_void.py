import os

test_base = "/home/sheheryar-sohail/Downloads/Property-Management-System-test"
invoices_page_path = os.path.join(test_base, "apps/web/src/app/(dashboard)/invoices/page.tsx")

with open(invoices_page_path, "r", encoding="utf-8") as f:
    content = f.read()

target = """                  <tbody className="divide-y">
                    {filteredInvoices.map((invoice: any) => {
                      const balance = Number(invoice.total) - Number(invoice.paid)
                      
                      let typeName = 'Installment'
                      if (invoice.type === 'BOOKING') typeName = 'Booking'
                      else if (invoice.type === 'CONFIRMATION' || invoice.type === 'HALF_YEARLY') typeName = 'Confirmation'
                      else if (invoice.type === 'INSTALLMENT') typeName = `Installment`
                      else if (invoice.type === 'YEARLY') typeName = `Yearly`

                      return (
                        <tr key={invoice.id} className="hover:bg-muted/30 transition">"""

replacement = """                  <tbody className="divide-y">
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
                        <tr key={invoice.id} className={`hover:bg-muted/30 transition ${isVoid ? 'opacity-60 bg-slate-50/60 dark:bg-slate-900/40' : ''}`}>"""

if target in content:
    content = content.replace(target, replacement)
    with open(invoices_page_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Fixed isVoid in invoices/page.tsx")
else:
    print("Target not found in invoices/page.tsx!")

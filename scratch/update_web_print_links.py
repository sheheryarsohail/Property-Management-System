import os

# 1. Update apps/web/src/app/print/page.tsx
print_page_path = "/home/sheheryar-sohail/Downloads/Property-Management-System-test/apps/web/src/app/print/page.tsx"
with open(print_page_path, "r", encoding="utf-8") as f:
    print_content = f.read()

target_tpl = """    {
      title: 'Transfer Letter',
      description: 'Official Transfer Letter for allottee with 5 key terms & conditions, plot specs, allottee photo box, and Managing Director signature.',
      filledUrl: `/print/transfer-letter/${targetId}`,
      blankUrl: '/print/transfer-letter/blank',
      features: ['Allottee photograph box', '90-day payment & 20% cancellation terms', 'Complete plot dimension details', 'Managing Director & Allottee signatures'],
    },
  ];"""

cancellation_tpl = """    {
      title: 'Transfer Letter',
      description: 'Official Transfer Letter for allottee with 5 key terms & conditions, plot specs, allottee photo box, and Managing Director signature.',
      filledUrl: `/print/transfer-letter/${targetId}`,
      blankUrl: '/print/transfer-letter/blank',
      features: ['Allottee photograph box', '90-day payment & 20% cancellation terms', 'Complete plot dimension details', 'Managing Director & Allottee signatures'],
    },
    {
      title: 'Cancellation Letter',
      description: 'Official record note for plot cancellation and re-allotment with previous owner details, new allottee specifications, and society stamp.',
      filledUrl: `/print/cancellation-letter/${targetId}`,
      blankUrl: '/print/cancellation-letter/blank',
      features: ['Previous allottee & CNIC details', 'New allottee specifications', 'Legal cancellation & transfer clauses', 'Gulshan-e-Fatima official stamp area'],
    },
  ];"""

if target_tpl in print_content:
    print_content = print_content.replace(target_tpl, cancellation_tpl)
    with open(print_page_path, "w", encoding="utf-8") as f:
        f.write(print_content)
    print("SUCCESS: Updated apps/web/src/app/print/page.tsx")
else:
    print("WARNING: target_tpl not found in print/page.tsx")

# 2. Update apps/web/src/app/(dashboard)/cancellations/page.tsx
cancellations_page_path = "/home/sheheryar-sohail/Downloads/Property-Management-System-test/apps/web/src/app/(dashboard)/cancellations/page.tsx"
with open(cancellations_page_path, "r", encoding="utf-8") as f:
    canc_content = f.read()

if "Printer," not in canc_content:
    canc_content = canc_content.replace("Download,\n  X,", "Download,\n  Printer,\n  X,")

target_actions = """                      <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-1.5">
                        {c.receipt?.id && ("""

new_actions = """                      <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-1.5">
                        <Link
                          href={`/print/cancellation-letter/${c.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 p-1.5 rounded-lg border text-muted-foreground hover:text-foreground hover:bg-muted transition"
                          title="Print Cancellation Letter"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </Link>

                        {c.receipt?.id && ("""

if target_actions in canc_content:
    canc_content = canc_content.replace(target_actions, new_actions)
    with open(cancellations_page_path, "w", encoding="utf-8") as f:
        f.write(canc_content)
    print("SUCCESS: Updated apps/web/src/app/(dashboard)/cancellations/page.tsx")
else:
    print("WARNING: target_actions not found in cancellations/page.tsx")

# 3. Update apps/web/src/app/(dashboard)/cancellations/CancellationSuccessDialog.tsx
dialog_path = "/home/sheheryar-sohail/Downloads/Property-Management-System-test/apps/web/src/app/(dashboard)/cancellations/CancellationSuccessDialog.tsx"
with open(dialog_path, "r", encoding="utf-8") as f:
    dialog_content = f.read()

if "Printer," not in dialog_content:
    dialog_content = dialog_content.replace("UserPlus, ArrowRight, X", "UserPlus, ArrowRight, Printer, X")

target_dialog_buttons = """          <button
            onClick={() => {
              receiptsApi.downloadPdf(data.receiptId).catch((err: any) =>
                toast.error(err.message || "Download failed")
              );
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold shadow hover:opacity-95 transition"
          >
            <Download className="w-4 h-4" />
            Download Refund Voucher
          </button>"""

new_dialog_buttons = """          <button
            onClick={() => {
              receiptsApi.downloadPdf(data.receiptId).catch((err: any) =>
                toast.error(err.message || "Download failed")
              );
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold shadow hover:opacity-95 transition"
          >
            <Download className="w-4 h-4" />
            Download Refund Voucher
          </button>

          <Link
            href={`/print/cancellation-letter/${data.cancellationId}`}
            target="_blank"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-neutral-900 text-white font-semibold shadow hover:bg-black transition"
          >
            <Printer className="w-4 h-4" />
            Print Cancellation Letter
          </Link>"""

if target_dialog_buttons in dialog_content:
    dialog_content = dialog_content.replace(target_dialog_buttons, new_dialog_buttons)
    with open(dialog_path, "w", encoding="utf-8") as f:
        f.write(dialog_content)
    print("SUCCESS: Updated CancellationSuccessDialog.tsx")
else:
    print("WARNING: target_dialog_buttons not found in CancellationSuccessDialog.tsx")

# 4. Update apps/web/src/app/(dashboard)/properties/[id]/page.tsx
prop_path = "/home/sheheryar-sohail/Downloads/Property-Management-System-test/apps/web/src/app/(dashboard)/properties/[id]/page.tsx"
with open(prop_path, "r", encoding="utf-8") as f:
    prop_content = f.read()

target_prop_links = """            <Link
              href={`/print/site-plan/${id}`}
              target="_blank"
              className="flex items-center gap-3 rounded-xl border p-3 transition hover:bg-accent sm:p-4"
            >
              <MapPin className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Site Plan</p>
                <p className="hidden text-xs text-muted-foreground sm:block">Print property map</p>
              </div>
            </Link>
          </div>"""

new_prop_links = """            <Link
              href={`/print/site-plan/${id}`}
              target="_blank"
              className="flex items-center gap-3 rounded-xl border p-3 transition hover:bg-accent sm:p-4"
            >
              <MapPin className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Site Plan</p>
                <p className="hidden text-xs text-muted-foreground sm:block">Print property map</p>
              </div>
            </Link>
            <Link
              href={`/print/transfer-form/${id}`}
              target="_blank"
              className="flex items-center gap-3 rounded-xl border p-3 transition hover:bg-accent sm:p-4"
            >
              <FileText className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Transfer Form</p>
                <p className="hidden text-xs text-muted-foreground sm:block">Print transfer agreement</p>
              </div>
            </Link>
            <Link
              href={`/print/transfer-letter/${id}`}
              target="_blank"
              className="flex items-center gap-3 rounded-xl border p-3 transition hover:bg-accent sm:p-4"
            >
              <FileText className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Transfer Letter</p>
                <p className="hidden text-xs text-muted-foreground sm:block">Print official transfer letter</p>
              </div>
            </Link>
            <Link
              href={`/print/cancellation-letter/${id}`}
              target="_blank"
              className="flex items-center gap-3 rounded-xl border p-3 transition hover:bg-accent sm:p-4"
            >
              <FileText className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Cancellation Letter</p>
                <p className="hidden text-xs text-muted-foreground sm:block">Print cancellation & re-allotment</p>
              </div>
            </Link>
          </div>"""

if target_prop_links in prop_content:
    prop_content = prop_content.replace(target_prop_links, new_prop_links)
    with open(prop_path, "w", encoding="utf-8") as f:
        f.write(prop_content)
    print("SUCCESS: Updated properties/[id]/page.tsx")
else:
    print("WARNING: target_prop_links not found in properties/[id]/page.tsx")

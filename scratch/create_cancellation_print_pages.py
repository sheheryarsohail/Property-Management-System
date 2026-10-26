import os

target_dir = "/home/sheheryar-sohail/Downloads/Property-Management-System-test/apps/web/src/app/print/cancellation-letter/[id]"
os.makedirs(target_dir, exist_ok=True)
target_file = os.path.join(target_dir, "page.tsx")

content = """'use client';

import React from 'react';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';
import { usePrintCancellation } from '@/lib/usePrintCancellation';

export default function CancellationLetterPrintPage() {
  const { data, isBlank, isLoading, router } = usePrintCancellation();

  if (isLoading && !isBlank) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-neutral-800 font-sans">
        <Loader2 className="w-7 h-7 animate-spin text-neutral-600 mr-2" />
        <span className="text-sm font-medium">Loading cancellation letter...</span>
      </div>
    );
  }

  const plotNo = data.plotNo || '________';
  const cancellationDate = data.cancellationDate || '____/____/________';
  const reasonText = data.reason || 'non-payment of the required installments, despite multiple reminders';

  return (
    <>
      {/* Floating Action Controls (Hidden on Print) */}
      <div className="no-print fixed top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-300 px-3 py-1.5 rounded-md shadow-sm transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-black px-4 py-1.5 rounded-md shadow-sm transition"
        >
          <Printer className="w-3.5 h-3.5" /> Print
        </button>
      </div>

      {/* A4 Sheet Container */}
      <div className="a4-print-sheet text-neutral-900 font-sans text-xs flex flex-col justify-between h-full">
        <div>
          {/* Date Row */}
          <div className="mb-5 text-[12px] font-semibold text-neutral-900">
            <span className="font-bold">Date:</span> {cancellationDate}
          </div>

          {/* Subject 1 */}
          <div className="mb-3 text-[13px] font-bold text-neutral-950 tracking-tight">
            Subject: Allotment of Plot No. <span className="underline underline-offset-2">{plotNo}</span> to New Allottee
          </div>

          {/* Internal Office Note & Subject 2 */}
          <div className="mb-4">
            <div className="text-[13px] font-bold text-neutral-950 tracking-tight">
              Internal Office Note
            </div>
            <div className="text-[13px] font-bold text-neutral-950 tracking-tight">
              Subject: Internal Record – Re-Allotment of Plot No. <span className="underline underline-offset-2">{plotNo}</span>
            </div>
          </div>

          {/* Paragraph 1 */}
          <p className="mb-4 text-[12px] leading-relaxed text-neutral-900">
            This note is prepared for <strong className="font-bold text-neutral-950">official record purposes only</strong>.
          </p>

          {/* Paragraph 2: Cancellation Record */}
          <p className="mb-4 text-[12px] leading-relaxed text-neutral-900 text-justify">
            It is hereby recorded that <strong className="font-bold text-neutral-950">Plot No. <span className="underline underline-offset-2">{plotNo}</span></strong> previously allotted to{' '}
            <strong className="font-bold text-[13px] uppercase text-neutral-950 tracking-wide">
              {data.previousOwnerName || (isBlank ? '________________________' : '—')}
            </strong>{' '}
            (<strong className="font-bold text-neutral-950">CNIC No.{' '}
              <span className="underline underline-offset-2 font-mono">
                {data.previousOwnerCnic || (isBlank ? '_____________________' : '—')}
              </span>
            </strong>), has been <strong className="font-bold text-neutral-950">cancelled</strong> due to {reasonText}. In accordance with the Society&apos;s rules, the allotment stood cancelled and the plot was declared available for re-allotment.
          </p>

          {/* Paragraph 3: Re-allotment Notice */}
          <p className="mb-3 text-[12px] leading-relaxed text-neutral-900">
            {data.isReallotted || isBlank ? (
              <>The said plot has now been <strong className="font-bold text-neutral-950">re-allotted</strong> to the following.</>
            ) : (
              <>The said plot has been declared available for <strong className="font-bold text-neutral-950">re-allotment</strong> in accordance with Society rules.</>
            )}
          </p>

          {/* Subheading: New Allotment Details */}
          <div className="text-center my-3">
            <span className="font-bold text-[13px] uppercase text-neutral-950 tracking-wider underline underline-offset-4">
              New Allotment Details
            </span>
          </div>

          {/* New Allotment Details Box (Piped Format matching official template) */}
          <div className="my-4 border-l-2 border-neutral-800 pl-4 py-1 space-y-2 text-[12px] bg-neutral-50/40 rounded-r">
            <div className="flex items-center">
              <span className="w-36 font-bold text-neutral-700 shrink-0">Name</span>
              <span className="text-neutral-500 mr-2.5">:</span>
              <span className="font-bold text-[13px] uppercase text-neutral-950 tracking-wide">
                {data.newAllotteeName || (isBlank ? '________________________________________________' : '—')}
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-36 font-bold text-neutral-700 shrink-0">Father&apos;s Name</span>
              <span className="text-neutral-500 mr-2.5">:</span>
              <span className="font-bold text-[12.5px] uppercase text-neutral-950">
                {data.newAllotteeFatherHusband || (isBlank ? '________________________________________________' : '—')}
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-36 font-bold text-neutral-700 shrink-0">CNIC No.</span>
              <span className="text-neutral-500 mr-2.5">:</span>
              <span className="font-mono font-bold text-[12.5px] text-neutral-950">
                {data.newAllotteeCnic || (isBlank ? '________________________________________________' : '—')}
              </span>
            </div>
            <div className="flex items-start">
              <span className="w-36 font-bold text-neutral-700 shrink-0 pt-0.5">Address</span>
              <span className="text-neutral-500 mr-2.5 pt-0.5">:</span>
              <span className="font-bold text-[12px] uppercase text-neutral-950 leading-snug">
                {data.newAllotteeAddress || (isBlank ? '________________________________________________' : '—')}
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-36 font-bold text-neutral-700 shrink-0">Contact No.</span>
              <span className="text-neutral-500 mr-2.5">:</span>
              <span className="font-mono font-bold text-[12px] text-neutral-950">
                {data.newAllotteePhone || (isBlank ? '________________________________________________' : '—')}
              </span>
            </div>
          </div>

          {/* Paragraph 4: Legal Transfer Clause */}
          <p className="mb-3 text-[11.5px] leading-relaxed text-neutral-900 text-justify">
            The new allotment has been made in accordance with the society&apos;s rules and regulations. All rights, responsibilities, and ownership privileges pertaining to Plot No. <strong className="font-bold text-neutral-950">{plotNo}</strong> are now transferred to the new allottee, with effect from the date of this letter.
          </p>

          {/* Paragraph 5: No Claim Clause */}
          <p className="mb-3 text-[11.5px] leading-relaxed text-neutral-900 text-justify">
            Please note that the previous allottee no longer holds any claim or rights over the said plot.
          </p>

          {/* Paragraph 6: Confidentiality / Record Maintenance */}
          <p className="mb-4 text-[11.5px] leading-relaxed text-neutral-900 text-justify">
            This entry is for <strong className="font-bold text-neutral-950">record maintenance only</strong> and is <strong className="font-bold text-neutral-950">not to be issued or communicated</strong> to the new allottee.
          </p>
        </div>

        {/* Section 4: Signatures & Stamp (Gulshan-e-Fatima Society) */}
        <div className="pt-6 pb-2 flex justify-end">
          <div className="w-64 text-center">
            <div className="font-bold text-[12.5px] text-neutral-950 uppercase tracking-wide">
              Gulshan-e-Fatima Society
            </div>
            <div className="h-16 flex items-center justify-center">
              {/* Official Stamp & Signature Area */}
            </div>
            <div className="border-t border-neutral-800 pt-1.5 font-bold text-[11px] text-neutral-800 uppercase tracking-wider">
              Official Stamp & Signature
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
"""

with open(target_file, "w", encoding="utf-8") as f:
    f.write(content)

print(f"SUCCESS: Created {target_file}")

# Create page.tsx (index) for blank or sample
index_file = "/home/sheheryar-sohail/Downloads/Property-Management-System-test/apps/web/src/app/print/cancellation-letter/page.tsx"
index_content = """import CancellationLetterPrintPage from './[id]/page';

export default function CancellationLetterPage() {
  return <CancellationLetterPrintPage />;
}
"""

with open(index_file, "w", encoding="utf-8") as f:
    f.write(index_content)

print(f"SUCCESS: Created {index_file}")

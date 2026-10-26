'use client';

import React from 'react';
import { ArrowLeft, Printer, Loader2, AlertCircle } from 'lucide-react';
import { usePrintCancellation } from '@/lib/usePrintCancellation';

export default function CancellationLetterPrintPage() {
  const { data, isBlank, isLoading, isNotFound, router } = usePrintCancellation();

  if (isLoading && !isBlank) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-neutral-800 font-sans">
        <Loader2 className="w-7 h-7 animate-spin text-neutral-600 mr-2" />
        <span className="text-sm font-medium">Loading cancellation letter...</span>
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 text-neutral-800 font-sans p-6">
        <div className="max-w-md w-full bg-white rounded-xl border border-neutral-200 p-6 text-center shadow-sm">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-neutral-900 mb-1">Record Not Found</h2>
          <p className="text-xs text-neutral-600 mb-5 leading-relaxed">
            The requested cancellation record could not be found or has not been recorded yet in the system.
          </p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-black px-4 py-2 rounded-lg transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Cancellations
          </button>
        </div>
      </div>
    );
  }

  const plotNo = data.plotNo || '________';
  const cancellationDate = data.cancellationDate || '____/____/________';
  const reasonText = data.reason || 'non-payment of the required installments, despite multiple reminders';
  const isReallotted = Boolean(data.isReallotted);

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

          {/* DYNAMIC TEMPLATE: RE-ALLOTTED vs NOT RE-ALLOTTED */}
          {isReallotted ? (
            /* ============================================================== */
            /* 1. RE-ALLOTTED TEMPLATE (Dynamic Ilyas & Shakeel Format)       */
            /* ============================================================== */
            <>
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
                The said plot has now been <strong className="font-bold text-neutral-950">re-allotted</strong> to the following.
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
            </>
          ) : (
            /* ============================================================== */
            /* 2. FORMAL CANCELLATION TEMPLATE (When Plot Not Reallocated)   */
            /* ============================================================== */
            <>
              {/* Subject 1 */}
              <div className="mb-3 text-[13px] font-bold text-neutral-950 tracking-tight">
                Subject: Cancellation of Allotment – Plot No. <span className="underline underline-offset-2">{plotNo}</span>
              </div>

              {/* Internal Office Note & Subject 2 */}
              <div className="mb-4">
                <div className="text-[13px] font-bold text-neutral-950 tracking-tight">
                  Internal Office Note
                </div>
                <div className="text-[13px] font-bold text-neutral-950 tracking-tight">
                  Subject: Internal Record – Formal Cancellation of Allotment for Plot No. <span className="underline underline-offset-2">{plotNo}</span>
                </div>
              </div>

              {/* Paragraph 1 */}
              <p className="mb-4 text-[12px] leading-relaxed text-neutral-900">
                This note is prepared for <strong className="font-bold text-neutral-950">official record purposes only</strong>.
              </p>

              {/* Paragraph 2: Formal Cancellation Declaration Paragraph */}
              <p className="mb-3.5 text-[12px] leading-relaxed text-neutral-900 text-justify">
                It is hereby recorded and confirmed that <strong className="font-bold text-neutral-950">Plot No.{' '}
                <span className="underline underline-offset-2">{plotNo}</span></strong>{' '}
                {data.measuring ? `(measuring ${data.measuring} Sq. Yds., Category: ${data.category || 'RESIDENTIAL'}${data.block ? `, Block: ${data.block}` : ''})` : ''}, previously allotted to{' '}
                <strong className="font-bold text-[13px] uppercase text-neutral-950 tracking-wide">
                  {data.previousOwnerName || (isBlank ? '________________________' : '—')}
                </strong>{' '}
                (<strong className="font-bold text-neutral-950">CNIC No.{' '}
                  <span className="underline underline-offset-2 font-mono">
                    {data.previousOwnerCnic || (isBlank ? '_____________________' : '—')}
                  </span>
                </strong>), has been <strong className="font-bold text-neutral-950">formally and properly cancelled</strong> in accordance with the Society&apos;s rules and regulations due to {reasonText}.
              </p>

              {/* Paragraph 3: Termination of Rights & Reversion to Society Inventory */}
              <p className="mb-3.5 text-[12px] leading-relaxed text-neutral-900 text-justify">
                Consequently, the said allotment stands cancelled in all official Society records. All rights, claims, title, interests, and ownership privileges previously held by the former allottee over Plot No.{' '}
                <strong className="font-bold text-neutral-950">{plotNo}</strong> have ceased, determined, and terminated in their entirety. The former allottee holds no further claim, right, or interest whatsoever over the said plot.
              </p>

              {/* Paragraph 4: Availability for Re-Allotment */}
              <p className="mb-4 text-[12px] leading-relaxed text-neutral-900 text-justify">
                The subject plot has formally reverted to the Society&apos;s property inventory and is hereby declared <strong className="font-bold text-neutral-950">open and available for re-allotment</strong> in accordance with Society rules, policies, and standard allocation procedures.
              </p>

              {/* Subheading: Cancelled Allotment Summary */}
              <div className="text-center my-3">
                <span className="font-bold text-[13px] uppercase text-neutral-950 tracking-wider underline underline-offset-4">
                  Cancelled Allotment Record
                </span>
              </div>

              {/* Cancelled Allotment Details Box */}
              <div className="my-4 border-l-2 border-neutral-800 pl-4 py-1 space-y-2 text-[12px] bg-neutral-50/40 rounded-r">
                <div className="flex items-center">
                  <span className="w-36 font-bold text-neutral-700 shrink-0">Plot No.</span>
                  <span className="text-neutral-500 mr-2.5">:</span>
                  <span className="font-bold text-[13px] text-neutral-950 tracking-wide">
                    {plotNo} {data.measuring ? `(${data.measuring} Sq. Yds. - ${data.category || 'RESIDENTIAL'})` : ''}
                  </span>
                </div>
                {data.block && (
                  <div className="flex items-center">
                    <span className="w-36 font-bold text-neutral-700 shrink-0">Block</span>
                    <span className="text-neutral-500 mr-2.5">:</span>
                    <span className="font-bold text-[12.5px] uppercase text-neutral-950">
                      {data.block}
                    </span>
                  </div>
                )}
                <div className="flex items-center">
                  <span className="w-36 font-bold text-neutral-700 shrink-0">Previous Allottee</span>
                  <span className="text-neutral-500 mr-2.5">:</span>
                  <span className="font-bold text-[13px] uppercase text-neutral-950 tracking-wide">
                    {data.previousOwnerName || (isBlank ? '________________________________________________' : '—')}
                  </span>
                </div>
                {data.previousOwnerFatherHusband && (
                  <div className="flex items-center">
                    <span className="w-36 font-bold text-neutral-700 shrink-0">Father / Husband</span>
                    <span className="text-neutral-500 mr-2.5">:</span>
                    <span className="font-bold text-[12.5px] uppercase text-neutral-950">
                      {data.previousOwnerFatherHusband}
                    </span>
                  </div>
                )}
                <div className="flex items-center">
                  <span className="w-36 font-bold text-neutral-700 shrink-0">CNIC No.</span>
                  <span className="text-neutral-500 mr-2.5">:</span>
                  <span className="font-mono font-bold text-[12.5px] text-neutral-950">
                    {data.previousOwnerCnic || (isBlank ? '________________________________________________' : '—')}
                  </span>
                </div>
                {data.previousOwnerPhone && (
                  <div className="flex items-center">
                    <span className="w-36 font-bold text-neutral-700 shrink-0">Contact No.</span>
                    <span className="text-neutral-500 mr-2.5">:</span>
                    <span className="font-mono font-bold text-[12px] text-neutral-950">
                      {data.previousOwnerPhone}
                    </span>
                  </div>
                )}
                {data.previousOwnerAddress && (
                  <div className="flex items-start">
                    <span className="w-36 font-bold text-neutral-700 shrink-0 pt-0.5">Address</span>
                    <span className="text-neutral-500 mr-2.5 pt-0.5">:</span>
                    <span className="font-bold text-[12px] uppercase text-neutral-950 leading-snug">
                      {data.previousOwnerAddress}
                    </span>
                  </div>
                )}
                <div className="flex items-center">
                  <span className="w-36 font-bold text-neutral-700 shrink-0">Cancellation Reason</span>
                  <span className="text-neutral-500 mr-2.5">:</span>
                  <span className="font-semibold text-[12px] text-neutral-900">
                    {reasonText}
                  </span>
                </div>
              </div>

              {/* Record Maintenance Notice */}
              <p className="mb-4 text-[11.5px] leading-relaxed text-neutral-900 text-justify">
                This record is executed and maintained in the Society&apos;s central register for <strong className="font-bold text-neutral-950">formal record and auditing purposes</strong>.
              </p>
            </>
          )}
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

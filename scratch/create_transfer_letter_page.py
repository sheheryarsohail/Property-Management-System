import os

path = '/home/sheheryar-sohail/Downloads/Property-Management-System-test/apps/web/src/app/print/transfer-letter/[id]/page.tsx'
content = """'use client';

import React from 'react';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';
import { usePrintTransfer } from '@/lib/usePrintTransfer';

export default function TransferLetterPrintPage() {
  const { data, isBlank, isLoading, router } = usePrintTransfer();

  if (isLoading && !isBlank) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-neutral-800 font-sans">
        <Loader2 className="w-7 h-7 animate-spin text-neutral-600 mr-2" />
        <span className="text-sm font-medium">Loading transfer letter...</span>
      </div>
    );
  }

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
      <div className="a4-print-sheet text-neutral-900 font-sans text-xs">
        <div>
          {/* Header & Date Row */}
          <div className="relative mb-4 flex items-center justify-between">
            <div className="w-24"></div>
            {/* Title Box - Strictly TRANSFER LETTER */}
            <div className="border-2 border-neutral-900 bg-white text-neutral-900 px-8 py-1.5 font-bold text-sm tracking-widest uppercase shadow-sm">
              TRANSFER LETTER
            </div>
            {/* Date Box */}
            <div className="text-right text-[11px] font-semibold text-neutral-800">
              <span className="font-bold">Date:</span> {data.transferDate || '____/____/________'}
            </div>
          </div>

          {/* Section 1: ALLOTTEE DETAILS */}
          <div className="mb-3 border border-neutral-800 rounded bg-white overflow-hidden">
            {/* Title row ONLY */}
            <div className="bg-neutral-100 border-b border-neutral-800 px-3 py-1 font-bold text-center uppercase text-[11px] tracking-wider text-neutral-900">
              ALLOTTEE DETAILS
            </div>
            <div className="flex">
              {/* Fields */}
              <div className="flex-1 divide-y divide-neutral-200 text-[11px]">
                <div className="flex items-center px-3 py-1.5">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">NAME:</span>
                  <span className="font-medium text-neutral-900">{data.buyerName || '—'}</span>
                </div>
                <div className="flex items-center px-3 py-1.5">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">S/O, D/O, W/O:</span>
                  <span className="font-medium text-neutral-900">{data.buyerFatherHusband || '—'}</span>
                </div>
                <div className="flex items-center px-3 py-1.5">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">CNIC:</span>
                  <span className="font-mono font-medium text-neutral-900">{data.buyerCnic || '—'}</span>
                  <span className="ml-auto font-bold text-neutral-700 shrink-0 mr-2">MOBILE NO:</span>
                  <span className="font-mono font-medium text-neutral-900">{data.buyerPhone || '—'}</span>
                </div>
                <div className="flex items-start px-3 py-1.5">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">ADDRESS:</span>
                  <span className="font-medium text-neutral-900 leading-tight">{data.buyerAddress || '—'}</span>
                </div>
              </div>
              {/* Photo Box */}
              <div className="w-28 shrink-0 border-l border-neutral-800 flex flex-col items-center justify-center p-1.5 bg-neutral-50/50">
                <div className="w-22 h-28 border border-dashed border-neutral-400 rounded flex items-center justify-center text-center p-2">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider leading-tight">
                    PHOTO
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: PLOT DETAILS */}
          <div className="mb-3 border border-neutral-800 rounded bg-white overflow-hidden">
            {/* Title row ONLY */}
            <div className="bg-neutral-100 border-b border-neutral-800 px-3 py-1 font-bold text-center uppercase text-[11px] tracking-wider text-neutral-900">
              PLOT DETAILS
            </div>
            <div className="grid grid-cols-2 divide-x divide-neutral-800 text-[11px]">
              {/* Left Column */}
              <div className="divide-y divide-neutral-200">
                <div className="flex justify-between px-3 py-1.5">
                  <span className="font-bold text-neutral-700">PLOT NO:</span>
                  <span className="font-bold text-neutral-900">{data.plotNo || '—'}</span>
                </div>
                <div className="flex justify-between px-3 py-1.5">
                  <span className="font-bold text-neutral-700">CATEGORY:</span>
                  <span className="font-semibold text-neutral-900">{data.category || 'RESIDENTIAL'}</span>
                </div>
                <div className="flex justify-between px-3 py-1.5">
                  <span className="font-bold text-neutral-700">WEST OPEN:</span>
                  <span className="font-medium text-neutral-900">{data.isWestOpen ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between px-3 py-1.5">
                  <span className="font-bold text-neutral-700">PARK FACING:</span>
                  <span className="font-medium text-neutral-900">{data.isParkFacing ? 'Yes' : 'No'}</span>
                </div>
              </div>
              {/* Right Column */}
              <div className="divide-y divide-neutral-200">
                <div className="flex justify-between px-3 py-1.5">
                  <span className="font-bold text-neutral-700">MEASURING:</span>
                  <span className="font-bold text-neutral-900">{data.measuring ? `${data.measuring} Sq. Yds.` : '—'}</span>
                </div>
                <div className="flex justify-between px-3 py-1.5">
                  <span className="font-bold text-neutral-700">CORNER:</span>
                  <span className="font-medium text-neutral-900">{data.isCorner ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between px-3 py-1.5">
                  <span className="font-bold text-neutral-700">EAST OPEN:</span>
                  <span className="font-medium text-neutral-900">{data.isEastOpen ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between px-3 py-1.5">
                  <span className="font-bold text-neutral-700">ROAD FACING:</span>
                  <span className="font-medium text-neutral-900">{data.isRoadFacing ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Terms and Conditions */}
          <div className="border border-neutral-800 rounded bg-white p-3 mb-4">
            <h4 className="font-bold text-[11px] text-neutral-900 uppercase tracking-wide border-b border-neutral-300 pb-1 mb-2">
              Terms and Conditions:
            </h4>
            <div className="space-y-2 text-[10.5px] leading-relaxed text-neutral-800 text-justify">
              <p>
                • <strong className="text-neutral-900">Payment Terms:</strong> All dues related to the plot must be paid within 90 days of the due date. Failure to do so will result in cancellation of the plot.
              </p>
              <p>
                • <strong className="text-neutral-900">Additional Charges:</strong> The allottee is responsible for payment of additional charges including but not limited to K-Electric, Sui Gas, water, and other development charges as demanded by the company.
              </p>
              <p>
                • <strong className="text-neutral-900">Cancellation Policy:</strong> If the allottee fails to pay the dues within the specified time, the company reserves the right to cancel the plot. In such cases, 20 percent will be deducted from the file paid amount as cancellation charges.
              </p>
              <p>
                • <strong className="text-neutral-900">Transfer Restrictions:</strong> The transfer of rights and ownership of the plot&apos;s file will not be allowed if any dues remain outstanding. All outstanding dues must be fully cleared by the allottee before any transfer of the file can be initiated.
              </p>
              <p>
                • <strong className="text-neutral-900">Amendment of Terms:</strong> The company reserves the right to amend these terms and conditions at any time, with or without prior notice to the allottee.
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Signatures (MANAGING DIRECTOR & Allottee Signature) */}
        <div className="pt-6 pb-2 grid grid-cols-2 gap-16 text-center text-[11px]">
          <div>
            <div className="h-12 flex items-end">
              <div className="w-full border-b border-neutral-800"></div>
            </div>
            <div className="font-bold text-neutral-800 pt-2 uppercase tracking-wide">
              MANAGING DIRECTOR
            </div>
          </div>

          <div>
            <div className="h-12 flex items-end">
              <div className="w-full border-b border-neutral-800"></div>
            </div>
            <div className="font-bold text-neutral-800 pt-2 uppercase tracking-wide">
              Allottee Signature
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
"""

with open(path, 'w') as f:
    f.write(content)
print("Updated transfer letter page:", path)

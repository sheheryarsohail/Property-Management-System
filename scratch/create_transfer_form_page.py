import os

path = '/home/sheheryar-sohail/Downloads/Property-Management-System-test/apps/web/src/app/print/transfer-form/[id]/page.tsx'
content = """'use client';

import React from 'react';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';
import { usePrintTransfer } from '@/lib/usePrintTransfer';

export default function TransferFormPrintPage() {
  const { data, isBlank, isLoading, router } = usePrintTransfer();

  if (isLoading && !isBlank) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-neutral-800 font-sans">
        <Loader2 className="w-7 h-7 animate-spin text-neutral-600 mr-2" />
        <span className="text-sm font-medium">Loading transfer form...</span>
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
          <div className="relative mb-3 flex items-center justify-between">
            <div className="w-24"></div>
            {/* Title Box */}
            <div className="border-2 border-neutral-900 bg-white text-neutral-900 px-8 py-1 font-bold text-sm tracking-widest uppercase shadow-sm">
              TRANSFER FORM
            </div>
            {/* Date Box */}
            <div className="text-right text-[11px] font-semibold text-neutral-800">
              <span className="font-bold">Date:</span> {data.transferDate || '____/____/________'}
            </div>
          </div>

          {/* Section 1: SELLER DETAILS */}
          <div className="mb-2.5 border border-neutral-800 rounded bg-white overflow-hidden">
            {/* Title row ONLY */}
            <div className="bg-neutral-100 border-b border-neutral-800 px-3 py-1 font-bold text-center uppercase text-[11px] tracking-wider text-neutral-900">
              SELLER DETAILS
            </div>
            <div className="flex">
              {/* Fields */}
              <div className="flex-1 divide-y divide-neutral-200 text-[11px]">
                <div className="flex items-center px-3 py-1">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">NAME:</span>
                  <span className="font-medium text-neutral-900">{data.sellerName || '—'}</span>
                </div>
                <div className="flex items-center px-3 py-1">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">S/O, D/O, W/O:</span>
                  <span className="font-medium text-neutral-900">{data.sellerFatherHusband || '—'}</span>
                </div>
                <div className="flex items-center px-3 py-1">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">CNIC:</span>
                  <span className="font-mono font-medium text-neutral-900">{data.sellerCnic || '—'}</span>
                  <span className="ml-auto font-bold text-neutral-700 shrink-0 mr-2">MOBILE NO:</span>
                  <span className="font-mono font-medium text-neutral-900">{data.sellerPhone || '—'}</span>
                </div>
                <div className="flex items-start px-3 py-1">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">ADDRESS:</span>
                  <span className="font-medium text-neutral-900 leading-tight">{data.sellerAddress || '—'}</span>
                </div>
              </div>
              {/* Photo Box */}
              <div className="w-24 shrink-0 border-l border-neutral-800 flex flex-col items-center justify-center p-1 bg-neutral-50/50">
                <div className="w-20 h-24 border border-dashed border-neutral-400 rounded flex items-center justify-center text-center p-1">
                  <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider">
                    PHOTO
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: PLOT DETAILS */}
          <div className="mb-2.5 border border-neutral-800 rounded bg-white overflow-hidden">
            {/* Title row ONLY */}
            <div className="bg-neutral-100 border-b border-neutral-800 px-3 py-1 font-bold text-center uppercase text-[11px] tracking-wider text-neutral-900">
              PLOT DETAILS
            </div>
            <div className="grid grid-cols-2 divide-x divide-neutral-800 text-[11px]">
              {/* Left Column */}
              <div className="divide-y divide-neutral-200">
                <div className="flex justify-between px-3 py-1">
                  <span className="font-bold text-neutral-700">PLOT NO:</span>
                  <span className="font-bold text-neutral-900">{data.plotNo || '—'}</span>
                </div>
                <div className="flex justify-between px-3 py-1">
                  <span className="font-bold text-neutral-700">CATEGORY:</span>
                  <span className="font-semibold text-neutral-900">{data.category || 'RESIDENTIAL'}</span>
                </div>
                <div className="flex justify-between px-3 py-1">
                  <span className="font-bold text-neutral-700">WEST OPEN:</span>
                  <span className="font-medium text-neutral-900">{data.isWestOpen ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between px-3 py-1">
                  <span className="font-bold text-neutral-700">PARK FACING:</span>
                  <span className="font-medium text-neutral-900">{data.isParkFacing ? 'Yes' : 'No'}</span>
                </div>
              </div>
              {/* Right Column */}
              <div className="divide-y divide-neutral-200">
                <div className="flex justify-between px-3 py-1">
                  <span className="font-bold text-neutral-700">MEASURING:</span>
                  <span className="font-bold text-neutral-900">{data.measuring ? `${data.measuring} Sq. Yds.` : '—'}</span>
                </div>
                <div className="flex justify-between px-3 py-1">
                  <span className="font-bold text-neutral-700">CORNER:</span>
                  <span className="font-medium text-neutral-900">{data.isCorner ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between px-3 py-1">
                  <span className="font-bold text-neutral-700">EAST OPEN:</span>
                  <span className="font-medium text-neutral-900">{data.isEastOpen ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between px-3 py-1">
                  <span className="font-bold text-neutral-700">ROAD FACING:</span>
                  <span className="font-medium text-neutral-900">{data.isRoadFacing ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: BUYER DETAILS */}
          <div className="mb-2.5 border border-neutral-800 rounded bg-white overflow-hidden">
            {/* Title row ONLY */}
            <div className="bg-neutral-100 border-b border-neutral-800 px-3 py-1 font-bold text-center uppercase text-[11px] tracking-wider text-neutral-900">
              BUYER DETAILS
            </div>
            <div className="flex">
              {/* Fields */}
              <div className="flex-1 divide-y divide-neutral-200 text-[11px]">
                <div className="flex items-center px-3 py-1">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">NAME:</span>
                  <span className="font-medium text-neutral-900">{data.buyerName || '—'}</span>
                </div>
                <div className="flex items-center px-3 py-1">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">S/O, D/O, W/O:</span>
                  <span className="font-medium text-neutral-900">{data.buyerFatherHusband || '—'}</span>
                </div>
                <div className="flex items-center px-3 py-1">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">CNIC:</span>
                  <span className="font-mono font-medium text-neutral-900">{data.buyerCnic || '—'}</span>
                  <span className="ml-auto font-bold text-neutral-700 shrink-0 mr-2">MOBILE NO:</span>
                  <span className="font-mono font-medium text-neutral-900">{data.buyerPhone || '—'}</span>
                </div>
                <div className="flex items-start px-3 py-1">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">ADDRESS:</span>
                  <span className="font-medium text-neutral-900 leading-tight">{data.buyerAddress || '—'}</span>
                </div>
              </div>
              {/* Photo Box */}
              <div className="w-24 shrink-0 border-l border-neutral-800 flex flex-col items-center justify-center p-1 bg-neutral-50/50">
                <div className="w-20 h-24 border border-dashed border-neutral-400 rounded flex items-center justify-center text-center p-1">
                  <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider">
                    PHOTO
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Terms and Conditions for Plot Transfer */}
          <div className="border border-neutral-800 rounded bg-white p-2.5 mb-3">
            <h4 className="font-bold text-[11px] text-neutral-900 uppercase tracking-wide border-b border-neutral-300 pb-1 mb-1.5">
              Terms and Conditions for Plot Transfer Between Buyer and Seller:
            </h4>
            <div className="space-y-1 text-[10px] leading-relaxed text-neutral-800 text-justify">
              <p>
                <strong className="text-neutral-900">Identification of Parties:</strong> The buyer, identified as{' '}
                <span className="font-bold underline">{data.buyerName || '____________________'}</span> agrees to purchase and the seller, identified as{' '}
                <span className="font-bold underline">{data.sellerName || '____________________'}</span> agrees to sell the plot.
              </p>
              <p>
                <strong className="text-neutral-900">Transfer of Title:</strong> Buyer agreed purchase Plot, the seller agrees to transfer the title and ownership of the plot to the buyer.
              </p>
              <p>
                <strong className="text-neutral-900">Cancellation Due to Buyer&apos;s Default:</strong> If a buyer fails to pay dues according to the agreed payment schedule, the company reserves the right to cancel the plot transfer agreement.
              </p>
              <p>
                <strong className="text-neutral-900">Refund Policy:</strong> In case of cancellation due to buyer&apos;s default, only the amount paid by the buyer up to the cancellation date will be refunded, after deducting any applicable penalties or fees.
              </p>
            </div>
          </div>
        </div>

        {/* Section 5: Signatures (Aligned Leveled at the Bottom) */}
        <div className="pt-4 pb-1 grid grid-cols-3 gap-6 text-center text-[10px]">
          <div>
            <div className="h-10 flex items-end">
              <div className="w-full border-b border-neutral-800"></div>
            </div>
            <div className="font-bold text-neutral-800 pt-1.5 uppercase tracking-wide">
              Seller Signature
            </div>
          </div>

          <div>
            <div className="h-10 flex items-end">
              <div className="w-full border-b border-neutral-800"></div>
            </div>
            <div className="font-bold text-neutral-800 pt-1.5 uppercase tracking-wide">
              Buyer Signature
            </div>
          </div>

          <div>
            <div className="h-10 flex items-end">
              <div className="w-full border-b border-neutral-800"></div>
            </div>
            <div className="font-bold text-neutral-800 pt-1.5 uppercase tracking-wide">
              Managing Director
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
print("Updated transfer form page:", path)

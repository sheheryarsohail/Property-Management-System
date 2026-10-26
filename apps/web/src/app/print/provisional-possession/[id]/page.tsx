'use client';

import React from 'react';
import { ArrowLeft, Printer, AlertCircle, Loader2 } from 'lucide-react';
import { usePrintProperty } from '@/lib/usePrintProperty';

interface ProvisionalPossessionData {
  srNo?: string;
  date?: string;
  plotNo?: string;
  measuring?: string;
  applicantName?: string;
  relationName?: string;
  cnic?: string;
  address?: string;
}

export default function ProvisionalPossessionPrintPage() {
  const {
    property,
    customer,
    activeOwnership,
    isBlank,
    isOtherProject,
    isLoading,
    router,
  } = usePrintProperty();

  const sampleData: ProvisionalPossessionData = {
    srNo: '726',
    date: '04-12-2018',
    plotNo: 'R-726',
    measuring: '1080',
    applicantName: 'Sawera Sameer',
    relationName: 'Sameer Khan',
    cnic: '42201-4431694-8',
    address: 'Plot FT 3/9 Flat No. A-706, Freer Town Clifton Karachi',
  };

  const rawSqYd = property?.sizeSqYd ? Number(property.sizeSqYd) : null;
  const calculatedSqFeet = rawSqYd
    ? (rawSqYd < 500 ? String(Math.round(rawSqYd * 9)) : String(Math.round(rawSqYd)))
    : '';

  const realData: ProvisionalPossessionData = {
    srNo: activeOwnership?.id ? activeOwnership.id.slice(-6).toUpperCase() : '',
    date: activeOwnership?.startDate
      ? new Date(activeOwnership.startDate).toLocaleDateString('en-GB')
      : new Date().toLocaleDateString('en-GB'),
    plotNo: property?.code?.trim() || '',
    measuring: calculatedSqFeet,
    applicantName: customer?.fullName?.trim() || '',
    relationName: (customer?.husbandName?.trim() || customer?.fatherName?.trim() || ''),
    cnic: customer?.nationalId?.trim() || '',
    address: customer?.address?.trim() || '',
  };

  const activeData: ProvisionalPossessionData = isBlank
    ? {}
    : (customer || property ? realData : sampleData);

  if (isLoading && !property && !isBlank) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-neutral-800 font-sans">
        <Loader2 className="w-7 h-7 animate-spin text-neutral-600 mr-2" />
        <span className="text-sm font-medium">Loading provisional possession details...</span>
      </div>
    );
  }

  if (isOtherProject) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center bg-neutral-50 text-center font-sans">
        <div className="max-w-md bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
          <AlertCircle className="w-10 h-10 text-amber-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-neutral-900 mb-2">Restricted Template</h2>
          <p className="text-sm text-neutral-600 mb-4">
            This Provisional Possession template is exclusively designated for <strong>Gulshan-e-Fatima</strong> properties and cannot be printed for other projects.
          </p>
          <button
            onClick={() => router.back()}
            className="text-xs font-semibold bg-neutral-900 text-white px-4 py-2 rounded hover:bg-neutral-800"
          >
            Go Back
          </button>
        </div>
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

      {/* A4 Sheet Container formatted for pre-printed Gulshan-e-Fatima letterhead */}
      <div className="a4-print-sheet text-neutral-900 font-sans flex flex-col justify-between h-full">
        <div>
          {/* Title Box (Clean border box in center, matching application form & allocation letter) */}
          <div className="flex justify-center mb-8">
            <div className="border border-neutral-800 bg-white text-neutral-900 px-8 py-1.5 font-bold text-base tracking-widest uppercase shadow-sm">
              PROVISIONAL POSSESSION
            </div>
          </div>

          {/* Sr. No and Date Row */}
          <div className="flex items-end justify-between text-sm mb-7 px-1">
            <div className="flex items-end w-72">
              <span className="font-bold text-neutral-900 whitespace-nowrap mr-2">Sr. No:</span>
              <div
                contentEditable
                suppressContentEditableWarning
                className="flex-1 border-b border-dotted border-neutral-600 px-2 font-bold text-sm min-h-[22px] text-center text-neutral-950 outline-none"
              >
                {activeData.srNo}
              </div>
            </div>
            <div className="flex items-end w-72">
              <span className="font-bold text-neutral-900 whitespace-nowrap mr-2">Date:</span>
              <div
                contentEditable
                suppressContentEditableWarning
                className="flex-1 border-b border-dotted border-neutral-600 px-2 font-bold text-sm min-h-[22px] text-center text-neutral-950 outline-none"
              >
                {activeData.date}
              </div>
            </div>
          </div>

          {/* Body Lines with authentic spacing matching scanned document */}
          <div className="space-y-6 text-sm font-normal text-neutral-900 px-1">
            {/* Certification Statement */}
            <p className="font-medium text-neutral-800 text-[15px]">
              It is certified that the possession of
            </p>

            {/* Plot No. Line */}
            <div className="flex items-end text-sm">
              <span className="font-bold text-neutral-900 whitespace-nowrap mr-2">Plot No.:</span>
              <div
                contentEditable
                suppressContentEditableWarning
                className="w-80 border-b border-dotted border-neutral-600 px-2 font-bold text-base min-h-[24px] text-center text-neutral-950 outline-none"
              >
                {activeData.plotNo}
              </div>
            </div>

            {/* Measuring Line */}
            <div className="flex items-end text-sm">
              <span className="font-bold text-neutral-900 whitespace-nowrap mr-2">Measuring:</span>
              <div
                contentEditable
                suppressContentEditableWarning
                className="flex-1 border-b border-dotted border-neutral-600 px-2 font-bold text-base min-h-[24px] text-center text-neutral-950 outline-none"
              >
                {activeData.measuring}
              </div>
              <span className="font-bold text-neutral-900 whitespace-nowrap ml-2">Sq. Feet</span>
            </div>

            {/* Survey / Project Location Details */}
            <div className="text-[14px] text-neutral-800 leading-relaxed font-normal pt-1">
              <p>Survey No. 105, 107, 108, Deh Manghopir, Tappo Manghopir, Opposite Naya</p>
              <p>Nazimabad, Gate 02, Near Ijtima Gah Road, Karachi.</p>
            </div>

            {/* Applicant Name Line */}
            <div className="flex items-end text-sm pt-2">
              <span className="font-bold text-neutral-900 whitespace-nowrap mr-2">Mr./ Miss./ Mrs.</span>
              <div
                contentEditable
                suppressContentEditableWarning
                className="flex-1 border-b border-dotted border-neutral-600 px-2 font-bold text-base min-h-[24px] text-center text-neutral-950 tracking-wide outline-none"
              >
                {activeData.applicantName}
              </div>
            </div>

            {/* Relation Line */}
            <div className="flex items-end text-sm pt-1">
              <span className="font-bold text-neutral-900 whitespace-nowrap mr-2">S/o, D/o, W/o.</span>
              <div
                contentEditable
                suppressContentEditableWarning
                className="flex-1 border-b border-dotted border-neutral-600 px-2 font-bold text-base min-h-[24px] text-center text-neutral-950 outline-none"
              >
                {activeData.relationName}
              </div>
            </div>

            {/* CNIC Line */}
            <div className="flex items-end text-sm pt-1">
              <span className="font-bold text-neutral-900 whitespace-nowrap mr-2">C.N.I.C # :</span>
              <div
                contentEditable
                suppressContentEditableWarning
                className="flex-1 border-b border-dotted border-neutral-600 px-2 font-mono font-bold text-base min-h-[24px] text-center text-neutral-950 outline-none"
              >
                {activeData.cnic}
              </div>
            </div>

            {/* Address Line */}
            <div className="flex items-end text-sm pt-1">
              <span className="font-bold text-neutral-900 whitespace-nowrap mr-2">Address</span>
              <div
                contentEditable
                suppressContentEditableWarning
                className="flex-1 border-b border-dotted border-neutral-600 px-2 font-bold text-sm min-h-[24px] text-center text-neutral-950 outline-none"
              >
                {activeData.address}
              </div>
            </div>
          </div>
        </div>

        {/* Leveled Signatures at Bottom */}
        <div className="pt-16 pb-4 flex justify-between items-end px-4">
          <div className="w-64 text-center">
            <div className="border-b-2 border-neutral-800 w-full mb-2"></div>
            <div className="font-bold text-sm text-[#1e293b] tracking-wide">
              Managing Director
            </div>
          </div>

          <div className="w-64 text-center">
            <div className="border-b-2 border-neutral-800 w-full mb-2"></div>
            <div className="font-bold text-sm text-[#1e293b] tracking-wide">
              Applicant
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

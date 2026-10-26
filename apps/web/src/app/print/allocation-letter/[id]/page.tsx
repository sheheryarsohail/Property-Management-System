'use client';

import React from 'react';
import { ArrowLeft, Printer, AlertCircle, Loader2 } from 'lucide-react';
import { usePrintProperty } from '@/lib/usePrintProperty';

interface AllocationLetterData {
  plotNo?: string;
  measuring?: string;
  applicantName?: string;
  relationName?: string;
  date?: string;
}

export default function AllocationLetterPrintPage() {
  const {
    property,
    customer,
    activeOwnership,
    isBlank,
    isOtherProject,
    isLoading,
    router,
  } = usePrintProperty();

  const sampleData: AllocationLetterData = {
    plotNo: 'R-726',
    measuring: '120',
    applicantName: 'Sawera Sameer',
    relationName: 'Sameer Khan',
    date: '4-12-2018',
  };

  const realData: AllocationLetterData = {
    plotNo: property?.code?.trim() || '',
    measuring: property?.sizeSqYd ? String(property.sizeSqYd).trim() : '',
    applicantName: customer?.fullName?.trim() || '',
    relationName: (customer?.husbandName?.trim() || customer?.fatherName?.trim() || ''),
    date: activeOwnership?.startDate ? new Date(activeOwnership.startDate).toLocaleDateString('en-GB') : '',
  };

  const activeData: AllocationLetterData = isBlank
    ? {}
    : (customer || property ? realData : sampleData);

  if (isLoading && !property && !isBlank) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-neutral-800 font-sans">
        <Loader2 className="w-7 h-7 animate-spin text-neutral-600 mr-2" />
        <span className="text-sm font-medium">Loading allocation details...</span>
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
            This Allocation Letter template is exclusively designated for <strong>Gulshan-e-Fatima</strong> properties and cannot be printed for other projects.
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

      {/* A4 Sheet Container */}
      <div className="a4-print-sheet text-neutral-900 font-sans">
        <div>
          {/* Title Box (Clean border box in center, matching original scan format) */}
          <div className="flex justify-center mb-8">
            <div className="border border-neutral-800 bg-white text-neutral-900 px-8 py-1.5 font-bold text-base tracking-widest uppercase shadow-sm">
              ALLOCATION LETTER
            </div>
          </div>

          {/* Body Content */}
          <div className="space-y-6 text-base font-normal leading-relaxed text-neutral-900 px-2">
            <p className="font-medium text-neutral-800">We are pleased to allocate you the</p>

            {/* Plot No & Measuring with Sq. Yds. on the same line */}
            <div className="flex items-end gap-3 flex-wrap text-sm">
              <span className="font-bold text-neutral-800 whitespace-nowrap">Plot no.</span>
              <div className="w-44 border-b-2 border-dotted border-neutral-400 font-bold px-2 text-base min-h-[24px] text-center">
                {activeData.plotNo}
              </div>
              <span className="font-bold text-neutral-800 whitespace-nowrap ml-4">Measuring</span>
              <div className="w-32 border-b-2 border-dotted border-neutral-400 font-bold px-2 text-base min-h-[24px] text-center">
                {activeData.measuring}
              </div>
              <span className="font-bold text-neutral-800 whitespace-nowrap">Sq. Yds.</span>
            </div>

            {/* Project description paragraph (sq yards removed from here) */}
            <p className="text-justify leading-relaxed text-sm pt-2">
              in our project <span className="font-bold">Gulshan-e-Fatima</span> situated at Survey No. 105, 107, 108, Deh Manghopir, Tappo Manghopir. Opposite Naya Nazimabad Gate 02, Near Ijtima Gah Road, Karachi. In the name of
            </p>

            {/* Name Line */}
            <div className="flex items-end text-sm pt-2">
              <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">Mr. / Mrs. / Miss.</span>
              <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-bold text-base min-h-[24px] text-center text-neutral-950 tracking-wide">
                {activeData.applicantName}
              </div>
            </div>

            {/* Relation Line */}
            <div className="flex items-end text-sm pt-2">
              <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">S/o. W/o. D/o.</span>
              <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-bold text-base min-h-[24px] text-center text-neutral-950">
                {activeData.relationName}
              </div>
            </div>

            {/* Terms closing */}
            <p className="text-sm pt-2 font-medium text-neutral-800">
              as per terms and condition of booking.
            </p>
          </div>
        </div>

        {/* Signatures Section at Bottom: S/o line on left and Partner line on right align horizontally */}
        <div className="pt-20 pb-4 flex justify-between items-end px-2">
          {/* Left Column: Signature of Allottee Details */}
          <div className="w-80 space-y-3.5">
            <div className="font-bold text-sm text-neutral-900 mb-5">
              Signature of Allottee
            </div>

            <div className="flex items-end text-sm">
              <span className="font-bold text-neutral-800 mr-2 whitespace-nowrap">Date.</span>
              <div className="flex-1 border-b border-neutral-800 px-2 min-h-[20px] text-center">
                {activeData.date}
              </div>
            </div>

            <div className="flex items-end text-sm">
              <span className="font-bold text-neutral-800 mr-2 whitespace-nowrap">Mr. / Mrs. / Miss.</span>
              <div className="flex-1 border-b border-neutral-800 px-2 min-h-[20px] text-center font-bold text-sm text-neutral-950">
                {activeData.applicantName}
              </div>
            </div>

            <div className="flex items-end text-sm">
              <span className="font-bold text-neutral-800 mr-2 whitespace-nowrap">S/o. W/o. D/o.</span>
              <div className="flex-1 border-b border-neutral-800 px-2 min-h-[20px] text-center font-bold text-sm text-neutral-950">
                {activeData.relationName}
              </div>
            </div>
          </div>

          {/* Right Column: For Gulshan-e-Fatima & Nominee */}
          <div className="w-64 text-center">
            <div className="font-bold text-sm text-[#8b0000] tracking-wide mb-12">
              For GULSHAN-E-FATIMA
            </div>

            <div>
              <div className="border-b border-neutral-800 w-52 mx-auto"></div>
              <div className="font-bold text-sm text-neutral-900 pt-1">Nominee</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

'use client';

import React from 'react';
import { ArrowLeft, Printer, AlertCircle, Loader2 } from 'lucide-react';
import { usePrintProperty, splitAddressLines } from '@/lib/usePrintProperty';

interface ApplicationFormData {
  applicantName?: string;
  fatherHusbandName?: string;
  cnic?: string;
  addressLine1?: string;
  addressLine2?: string;
  phone?: string;
  cell?: string;
  nomineeName?: string;
  nomineeCnic?: string;
  nomineeRelation?: string;
  nomineeAddress?: string;
  plotNo?: string;
  totalCost?: string;
}

export default function ApplicationFormPrintPage() {
  const {
    property,
    customer,
    isBlank,
    isOtherProject,
    isLoading,
    router,
  } = usePrintProperty();

  const addressLines = splitAddressLines(customer?.address);

  const sampleData: ApplicationFormData = {
    applicantName: 'Sawera Sameer',
    fatherHusbandName: 'Sameer',
    cnic: '42201-4431694-8',
    addressLine1: 'Plot FT 3/9 Flat No. A-706, Locality',
    addressLine2: 'Freer Town Clifton Karachi',
    phone: '021-35678901',
    cell: '0300-1234567',
    nomineeName: 'Sameer Khan',
    nomineeCnic: '42201-1234567-1',
    nomineeRelation: 'Husband',
    nomineeAddress: 'Freer Town Clifton Karachi',
    plotNo: 'R-726',
    totalCost: '700000/-',
  };

  const realData: ApplicationFormData = {
    applicantName: customer?.fullName?.trim() || '',
    fatherHusbandName: (customer?.husbandName?.trim() || customer?.fatherName?.trim() || ''),
    cnic: customer?.nationalId?.trim() || '',
    addressLine1: addressLines[0] || '',
    addressLine2: addressLines[1] || '',
    phone: customer?.phone?.trim() || customer?.mobile?.trim() || '',
    cell: customer?.mobile?.trim() || customer?.phone?.trim() || '',
    nomineeName: customer?.nomineeName?.trim() || '',
    nomineeCnic: customer?.nomineeNIC?.trim() || '',
    nomineeRelation: customer?.nomineeRelation?.trim() || '',
    nomineeAddress: customer?.nomineeAddress?.trim() || '',
    plotNo: property?.code?.trim() || '',
    totalCost: property?.totalPrice ? `${Number(property.totalPrice).toLocaleString()}/-` : '',
  };

  const activeData: ApplicationFormData = isBlank
    ? {}
    : (customer || property ? realData : sampleData);

  if (isLoading && !property && !isBlank) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-neutral-800 font-sans">
        <Loader2 className="w-7 h-7 animate-spin text-neutral-600 mr-2" />
        <span className="text-sm font-medium">Loading application details...</span>
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
            This Application Form template is exclusively designated for <strong>Gulshan-e-Fatima</strong> properties and cannot be printed for other projects.
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
          {/* Title Box (Clean border box in center, matching receipt info box style) */}
          <div className="flex justify-center mb-5">
            <div className="border border-neutral-800 bg-white text-neutral-900 px-8 py-1.5 font-bold text-base tracking-widest uppercase shadow-sm">
              APPLICATION FORM
            </div>
          </div>

          {/* Content Section: Form fields on left, Photo + Plot/Cost boxes on right */}
          <div className="flex gap-6 items-start">
            {/* Left: Input Fields */}
            <div className="flex-1 space-y-3">
              {/* Field: Name */}
              <div className="flex items-end text-sm">
                <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">Name of Applicant.</span>
                <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-bold text-base min-h-[22px] text-center text-neutral-950 tracking-wide">
                  {activeData.applicantName}
                </div>
              </div>

              {/* Field: Father's / Husband Name */}
              <div className="flex items-end text-sm">
                <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">Father's / Husband's Name.</span>
                <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-bold text-base min-h-[22px] text-center text-neutral-950">
                  {activeData.fatherHusbandName}
                </div>
              </div>

              {/* Field: N.I.C. No */}
              <div className="flex items-end text-sm">
                <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">N.I.C. No.:</span>
                <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-mono font-bold text-base min-h-[22px] text-center text-neutral-950">
                  {activeData.cnic}
                </div>
              </div>

              {/* Field: Address line 1 */}
              <div className="flex items-end text-sm">
                <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">Address.</span>
                <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-bold text-sm min-h-[22px] text-center text-neutral-950">
                  {activeData.addressLine1}
                </div>
              </div>

              {/* Field: Address line 2 */}
              <div className="flex items-end text-sm">
                <div className="w-full border-b-2 border-dotted border-neutral-400 px-2 font-bold text-sm min-h-[22px] text-center text-neutral-950">
                  {activeData.addressLine2}
                </div>
              </div>

              {/* Field: Ph & Cell */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-end">
                  <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">Ph.</span>
                  <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-mono font-bold text-sm min-h-[22px] text-center text-neutral-950">
                    {activeData.phone}
                  </div>
                </div>
                <div className="flex items-end">
                  <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">Cell.</span>
                  <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-mono font-bold text-sm min-h-[22px] text-center text-neutral-950">
                    {activeData.cell}
                  </div>
                </div>
              </div>

              {/* Field: Nominee */}
              <div className="flex items-end text-sm pt-0.5">
                <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">Nominee.</span>
                <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-bold text-base min-h-[22px] text-center text-neutral-950">
                  {activeData.nomineeName}
                </div>
              </div>

              {/* Field: Nominee N.I.C. */}
              <div className="flex items-end text-sm">
                <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">N.I.C. No.:</span>
                <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-mono font-bold text-base min-h-[22px] text-center text-neutral-950">
                  {activeData.nomineeCnic}
                </div>
              </div>

              {/* Field: Relation */}
              <div className="flex items-end text-sm">
                <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">Relation.</span>
                <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-bold text-sm min-h-[22px] text-center text-neutral-950">
                  {activeData.nomineeRelation}
                </div>
              </div>

              {/* Field: Nominee Address */}
              <div className="flex items-end text-sm">
                <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">Address.</span>
                <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-bold text-sm min-h-[22px] text-center text-neutral-950">
                  {activeData.nomineeAddress}
                </div>
              </div>
            </div>

            {/* Right Column: Photo Box + Plot No Box + Total Cost Box */}
            <div className="w-32 flex flex-col items-center flex-shrink-0">
              {/* Photo Box */}
              <div className="w-32 h-36 border border-neutral-800 rounded p-1 flex items-center justify-center relative bg-white">
                <div className="w-full h-full border border-dashed border-neutral-400 rounded flex items-center justify-center text-center p-2">
                  <span className="text-xs text-neutral-500 font-sans leading-tight">
                    Passport Size<br />Photograph
                  </span>
                </div>
              </div>

              {/* Plot No Box */}
              <div className="w-full mt-3 text-center">
                <div className="text-xs font-bold text-neutral-800 mb-1">Plot No.</div>
                <div className="w-full h-9 border border-neutral-800 rounded flex items-center justify-center font-bold text-base bg-white">
                  {activeData.plotNo}
                </div>
              </div>

              {/* Total Cost Box */}
              <div className="w-full mt-2.5 text-center">
                <div className="text-xs font-bold text-neutral-800 mb-1">Total Cost</div>
                <div className="w-full h-9 border border-neutral-800 rounded flex items-center justify-center font-bold text-base bg-white">
                  {activeData.totalCost}
                </div>
              </div>
            </div>
          </div>

          {/* NOTE Section with verified correct spelling */}
          <div className="mt-6">
            <div className="text-center font-bold text-sm tracking-widest text-[#8b0000] mb-2 underline decoration-1">
              NOTE
            </div>
            <div className="space-y-1 text-xs leading-relaxed text-neutral-800 font-medium px-2">
              <p>1. In case of cancellation 20% of paid amount will be deducted.</p>
              <p>2. In case of late payment (20 days), company reserves the right to cancel the plot with 20% deduction of the total paid amount.</p>
              <p>3. Company will issue currency note with allotment letter to prevent any bogus file or any dispute in future.</p>
            </div>
          </div>
        </div>

        {/* Signatures Section: Perfectly aligned on the exact same horizontal baseline */}
        <div className="pt-8 pb-4 grid grid-cols-2 gap-12 px-2 items-start">
          {/* Left: Read understood */}
          <div>
            <div className="flex items-end h-8">
              <span className="text-sm font-bold text-neutral-800 mr-2 whitespace-nowrap">Read understood.</span>
              <div className="flex-1 border-b border-neutral-800"></div>
            </div>
            {/* Matching spacer matching the Signature label height below the right line */}
            <div className="h-6"></div>
          </div>

          {/* Right: Signature */}
          <div className="flex justify-end">
            <div className="w-56 text-center">
              <div className="flex items-end h-8">
                <div className="w-full border-b border-neutral-800"></div>
              </div>
              <div className="text-sm font-bold text-neutral-800 pt-1 h-6">Signature</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

'use client';

import React from 'react';
import { ArrowLeft, Printer, AlertCircle, Loader2 } from 'lucide-react';
import { usePrintProperty } from '@/lib/usePrintProperty';

interface SitePlanData {
  applicantName?: string;
  date?: string;
  plotNo?: string;
  type?: string;
  area?: string;
  category?: string;
  residential?: string;
  allotmentNo?: string;
  north?: string;
  south?: string;
  east?: string;
  west?: string;
}

export default function SitePlanPrintPage() {
  const {
    property,
    customer,
    activeOwnership,
    isBlank,
    isOtherProject,
    isLoading,
    router,
  } = usePrintProperty();

  const sampleData: SitePlanData = {
    applicantName: 'Sawera Sameer',
    date: '4-12-2018',
    plotNo: 'R-726',
    type: '—',
    area: '120',
    category: 'R',
    residential: '—',
    allotmentNo: '—',
    north: '',
    south: '',
    east: '',
    west: '',
  };

  const realData: SitePlanData = {
    applicantName: customer?.fullName?.trim() || '',
    date: activeOwnership?.startDate ? new Date(activeOwnership.startDate).toLocaleDateString('en-GB') : '',
    plotNo: property?.code?.trim() || '',
    type: property?.type || '—',
    area: property?.sizeSqYd ? String(property.sizeSqYd).trim() : '',
    category: property?.type === 'COMMERCIAL' ? 'Commercial' : 'R',
    residential: property?.type === 'RESIDENTIAL' ? 'Yes' : '—',
    allotmentNo: activeOwnership?.id ? activeOwnership.id.slice(-6).toUpperCase() : '—',
    north: '',
    south: '',
    east: '',
    west: '',
  };

  const activeData: SitePlanData = isBlank
    ? {}
    : (customer || property ? realData : sampleData);

  if (isLoading && !property && !isBlank) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-neutral-800 font-sans">
        <Loader2 className="w-7 h-7 animate-spin text-neutral-600 mr-2" />
        <span className="text-sm font-medium">Loading site plan details...</span>
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
            This Site Plan template is exclusively designated for <strong>Gulshan-e-Fatima</strong> properties and cannot be printed for other projects.
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
              SITE PLAN
            </div>
          </div>

          {/* Meta Fields: Name & Date */}
          <div className="flex justify-between items-end gap-6 text-sm mb-3.5 px-1">
            <div className="flex-1 flex items-end">
              <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">Name Mr. /Miss /Mrs.:</span>
              <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-bold text-base min-h-[22px] text-center text-neutral-950 tracking-wide">
                {activeData.applicantName}
              </div>
            </div>
            <div className="w-52 flex items-end">
              <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">Date:</span>
              <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-medium min-h-[22px] text-center">
                {activeData.date}
              </div>
            </div>
          </div>

          {/* Two distinct rounded pill boxes matching the original scanned document */}
          <div className="space-y-2 mb-6">
            {/* Box 1: Site Plan of Plot No., Type, Area */}
            <div className="border border-neutral-800 rounded-lg px-4 py-2 bg-white">
              <div className="grid grid-cols-3 gap-4 text-sm items-center">
                <div className="flex items-end">
                  <span className="font-bold text-neutral-800 whitespace-nowrap mr-1.5 text-xs">Site Plan of Plot No.:</span>
                  <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-1 font-bold min-h-[20px] text-center">
                    {activeData.plotNo}
                  </div>
                </div>
                <div className="flex items-end">
                  <span className="font-bold text-neutral-800 whitespace-nowrap mr-1.5 text-xs">Type:</span>
                  <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-1 font-medium min-h-[20px] text-center">
                    {activeData.type}
                  </div>
                </div>
                <div className="flex items-end">
                  <span className="font-bold text-neutral-800 whitespace-nowrap mr-1.5 text-xs">Area:</span>
                  <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-1 font-medium min-h-[20px] text-center">
                    {activeData.area ? `${activeData.area} Sq.Yds.` : ''}
                  </div>
                </div>
              </div>
            </div>

            {/* Box 2: Category, Residential, Allotment No */}
            <div className="border border-neutral-800 rounded-lg px-4 py-2 bg-white">
              <div className="grid grid-cols-3 gap-4 text-sm items-center">
                <div className="flex items-end">
                  <span className="font-bold text-neutral-800 whitespace-nowrap mr-1.5 text-xs">Category:</span>
                  <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-1 font-medium min-h-[20px] text-center">
                    {activeData.category}
                  </div>
                </div>
                <div className="flex items-end">
                  <span className="font-bold text-neutral-800 whitespace-nowrap mr-1.5 text-xs">Residential:</span>
                  <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-1 font-medium min-h-[20px] text-center">
                    {activeData.residential}
                  </div>
                </div>
                <div className="flex items-end">
                  <span className="font-bold text-neutral-800 whitespace-nowrap mr-1.5 text-xs">Allotment No.:</span>
                  <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-1 font-medium min-h-[20px] text-center">
                    {activeData.allotmentNo}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Center Section: Surveyor Plot Square on Left, Compass & Boundaries on Right */}
          <div className="grid grid-cols-2 gap-8 items-center my-4 px-4">
            {/* Left: Authentic Surveyor Plot Diagram with crossed line tic frame */}
            <div className="flex justify-center items-center">
              <div className="relative w-52 h-52 flex items-center justify-center">
                <svg width="210" height="210" viewBox="0 0 210 210" className="overflow-visible">
                  {/* 4 Intersecting thin black surveyor lines with 16px corner overshoots */}
                  <line x1="16" y1="32" x2="194" y2="32" stroke="#111827" strokeWidth="1.5" />
                  <line x1="16" y1="178" x2="194" y2="178" stroke="#111827" strokeWidth="1.5" />
                  <line x1="32" y1="16" x2="32" y2="194" stroke="#111827" strokeWidth="1.5" />
                  <line x1="178" y1="16" x2="178" y2="194" stroke="#111827" strokeWidth="1.5" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-bold text-xl tracking-wider text-neutral-900">
                    {activeData.plotNo}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Compass Rose & Cardinal Boundaries */}
            <div className="space-y-4">
              {/* Compass Rose SVG with clear N, S, E, W labels */}
              <div className="flex justify-center">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg viewBox="0 0 140 140" className="w-full h-full overflow-visible">
                    {/* Compass Cross Lines */}
                    <line x1="70" y1="34" x2="70" y2="106" stroke="#854d0e" strokeWidth="2" />
                    <line x1="34" y1="70" x2="106" y2="70" stroke="#854d0e" strokeWidth="2" />

                    {/* North Pointer Arrow (Gold with dark border) */}
                    <polygon points="70,22 62,38 78,38" fill="#eab308" stroke="#854d0e" strokeWidth="1.5" />
                    {/* South Pointer Arrow */}
                    <polygon points="70,118 62,102 78,102" fill="#eab308" stroke="#854d0e" strokeWidth="1.5" />
                    {/* East Pointer Arrow */}
                    <polygon points="118,70 102,62 102,78" fill="#eab308" stroke="#854d0e" strokeWidth="1.5" />
                    {/* West Pointer Arrow */}
                    <polygon points="22,70 38,62 38,78" fill="#eab308" stroke="#854d0e" strokeWidth="1.5" />

                    {/* Center Circle (Red) */}
                    <circle cx="70" cy="70" r="8" fill="#991b1b" stroke="#7f1d1d" strokeWidth="1.5" />

                    {/* Cardinal Direction Labels */}
                    <text x="70" y="14" textAnchor="middle" fill="#111827" fontSize="13" fontWeight="bold" fontFamily="sans-serif">N</text>
                    <text x="70" y="136" textAnchor="middle" fill="#111827" fontSize="13" fontWeight="bold" fontFamily="sans-serif">S</text>
                    <text x="134" y="74" textAnchor="middle" fill="#111827" fontSize="13" fontWeight="bold" fontFamily="sans-serif">E</text>
                    <text x="6" y="74" textAnchor="middle" fill="#111827" fontSize="13" fontWeight="bold" fontFamily="sans-serif">W</text>
                  </svg>
                </div>
              </div>

              {/* Boundary Dimensions Table */}
              <div className="space-y-1.5 text-xs px-2">
                <div className="flex items-end">
                  <span className="font-bold text-neutral-800 whitespace-nowrap mr-2 w-24">(1) NORTH</span>
                  <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-medium min-h-[18px] text-center">
                    {activeData.north}
                  </div>
                </div>
                <div className="flex items-end">
                  <span className="font-bold text-neutral-800 whitespace-nowrap mr-2 w-24">(2) SOUTH</span>
                  <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-medium min-h-[18px] text-center">
                    {activeData.south}
                  </div>
                </div>
                <div className="flex items-end">
                  <span className="font-bold text-neutral-800 whitespace-nowrap mr-2 w-24">(3) EAST</span>
                  <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-medium min-h-[18px] text-center">
                    {activeData.east}
                  </div>
                </div>
                <div className="flex items-end">
                  <span className="font-bold text-neutral-800 whitespace-nowrap mr-2 w-24">(4) WEST</span>
                  <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-medium min-h-[18px] text-center">
                    {activeData.west}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Signatures Section: Perfectly aligned on the exact same horizontal baseline */}
        <div className="pt-8 pb-4 grid grid-cols-2 gap-12 px-2 items-end">
          {/* Left: Managing Director */}
          <div>
            <div className="flex items-end h-8">
              <div className="w-56 border-b border-neutral-800"></div>
            </div>
            <div className="text-sm font-bold text-neutral-800 pt-1">Managing Director</div>
          </div>

          {/* Right: Applicant */}
          <div className="flex flex-col items-end">
            <div className="flex items-end h-8">
              <div className="w-56 border-b border-neutral-800"></div>
            </div>
            <div className="text-sm font-bold text-neutral-800 pt-1 w-56 text-center">Applicant</div>
          </div>
        </div>
      </div>
    </>
  );
}

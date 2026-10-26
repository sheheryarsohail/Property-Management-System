'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { FileText, Printer, ArrowRight, CheckCircle2, ShieldCheck, UserCheck, MapPin, Building } from 'lucide-react';
import { propertiesApi } from '@/lib/api';

export default function PrintTemplatesHub() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

  const { data: rawProperties = [], isLoading } = useQuery({
    queryKey: ['properties', 'print-hub'],
    queryFn: () => propertiesApi.list(),
  });

  // Gulshan-e-Fatima properties with customers
  const assignedProperties = useMemo(() => {
    return (rawProperties || [])
      .filter((p: any) => (!p.tenantId || p.tenantId === 't_local') && p.ownerships && p.ownerships.length > 0)
      .sort((a: any, b: any) => (a.code || '').localeCompare(b.code || ''));
  }, [rawProperties]);

  // Default to first assigned property
  const activeProperty = useMemo(() => {
    if (assignedProperties.length === 0) return null;
    return assignedProperties.find((p: any) => p.id === selectedPropertyId) || assignedProperties[0];
  }, [selectedPropertyId, assignedProperties]);

  const activeOwner = activeProperty?.ownerships?.[0]?.customer;
  const targetId = activeProperty?.id || 'sample';

  const templates = [
    {
      title: 'Application Form',
      description: 'Official Gulshan-e-Fatima application layout with photo box, plot no & cost box, nominee details, centered inputs, and aligned signature lines.',
      filledUrl: `/print/application-form/${targetId}`,
      blankUrl: '/print/application-form/blank',
      features: ['Passport size photo box', 'Plot No. & Total Cost boxes', 'Nominee & Applicant details', 'Leveled signature lines'],
    },
    {
      title: 'Allocation Letter',
      description: 'Formal plot allocation letter for Gulshan-e-Fatima with Survey No. 105, 107, 108 Deh Manghopir, centered plot details, and nominee signature.',
      filledUrl: `/print/allocation-letter/${targetId}`,
      blankUrl: '/print/allocation-letter/blank',
      features: ['Centered border box heading', 'Centered applicant & plot details', 'Signature of Allottee & Nominee leveled', '1.5" top / 1.0" bottom letterhead margins'],
    },
    {
      title: 'Site Plan',
      description: 'Surveyor plot plan with boundary dimension table, cardinal compass rose (N/S/E/W labels), extended corner ticks, and Managing Director signature.',
      filledUrl: `/print/site-plan/${targetId}`,
      blankUrl: '/print/site-plan/blank',
      features: ['Surveyor square with corner tics (#)', 'North/South/East/West boundary table', 'Full Cardinal Compass Rose (N, S, E, W)', 'Managing Director & Applicant signatures'],
    },
    {
      title: 'Provisional Possession',
      description: 'Official Provisional Possession certificate for Gulshan-e-Fatima with plot number, measuring in Sq. Feet, survey details, applicant details, and Managing Director signature.',
      filledUrl: `/print/provisional-possession/${targetId}`,
      blankUrl: '/print/provisional-possession/blank',
      features: ['Centered border box heading', 'Plot No. & Sq. Feet dimensions', 'Applicant & CNIC details', 'Managing Director & Applicant signatures'],
    },
    {
      title: 'Transfer Form',
      description: 'Official Plot Transfer Agreement between Buyer and Seller with complete plot specifications, terms & conditions, seller & buyer photo boxes, and leveled signatures.',
      filledUrl: `/print/transfer-form/${targetId}`,
      blankUrl: '/print/transfer-form/blank',
      features: ['Seller & Buyer photo boxes', 'Corner/West Open/Facing specs', 'Legal transfer terms & clauses', 'Seller, Buyer & MD signatures'],
    },
    {
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
  ];

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mb-3">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Exclusive to Gulshan-e-Fatima
        </div>
        <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Printable Document Templates</h1>
        <p className="mt-2 text-neutral-600 max-w-2xl mx-auto text-sm">
          Official PMS printable templates. Formatted with 1.5" header and 1.0" footer blank margins for official pre-printed letterhead stationery.
        </p>
      </div>

      {/* Dynamic Plot & Customer Selector Bar */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-5 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Select Plot & Customer to Print</h3>
              <p className="text-xs text-neutral-500">Select any booked or sold plot to preview and print its forms</p>
            </div>
          </div>

          <div className="w-full sm:w-auto">
            <select
              value={activeProperty?.id || ''}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="w-full sm:w-80 text-sm font-semibold bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              {assignedProperties.map((p: any) => {
                const c = p.ownerships?.[0]?.customer;
                return (
                  <option key={p.id} value={p.id}>
                    Plot {p.code} — {c?.fullName?.trim() || 'No Customer'} ({c?.nationalId || 'No CNIC'})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {activeProperty && (
          <div className="mt-4 pt-4 border-t border-neutral-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-neutral-50 rounded-lg p-3">
            <div>
              <span className="text-neutral-500 block">Plot No.</span>
              <span className="font-bold text-neutral-900">{activeProperty.code}</span>
            </div>
            <div>
              <span className="text-neutral-500 block">Allottee / Customer</span>
              <span className="font-bold text-neutral-900">{activeOwner?.fullName?.trim() || '—'}</span>
            </div>
            <div>
              <span className="text-neutral-500 block">CNIC / N.I.C.</span>
              <span className="font-bold text-neutral-900">{activeOwner?.nationalId || '—'}</span>
            </div>
            <div>
              <span className="text-neutral-500 block">Plot Size & Cost</span>
              <span className="font-bold text-neutral-900">
                {activeProperty.sizeSqYd} Sq.Yds. — {Number(activeProperty.totalPrice || 0).toLocaleString()}/-
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Templates Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((tpl) => (
          <div key={tpl.title} className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition">
            <div>
              <div className="w-10 h-10 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-900 mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-neutral-900 mb-2">{tpl.title}</h2>
              <p className="text-xs text-neutral-600 mb-4 leading-relaxed">{tpl.description}</p>

              <div className="space-y-1.5 mb-6">
                {tpl.features.map((feat) => (
                  <div key={feat} className="flex items-center text-xs text-neutral-700 gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-100 flex flex-col gap-2">
              <Link
                href={tpl.filledUrl}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 px-3 rounded-lg bg-neutral-900 text-white hover:bg-black transition text-center shadow-sm"
              >
                Print Filled ({activeProperty?.code || 'Selected'}) <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href={tpl.blankUrl}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg bg-neutral-100 text-neutral-800 hover:bg-neutral-200 transition text-center"
              >
                <Printer className="w-3.5 h-3.5" /> Print Blank Form
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

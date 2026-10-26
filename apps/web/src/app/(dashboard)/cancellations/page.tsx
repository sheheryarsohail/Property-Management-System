'use client';

import { Header } from '@/components/layout/header';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  AlertTriangle,
  Search,
  UserX,
  UserPlus,
  Clock,
  DollarSign,
  Building,
  CheckCircle2,
  Download,
  Printer,
  X,
  SlidersHorizontal,
  Check,
  Tag,
} from 'lucide-react';
import { FilterDrawer } from '@/components/FilterDrawer';
import { cn } from '@/lib/utils';
import { cancellationsApi, receiptsApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CancellationModal } from './CancellationModal';
import { CancellationSuccessDialog } from './CancellationSuccessDialog';
import { toast } from 'sonner';

export default function CancellationsPage() {
  const [activeTab, setActiveTab] = useState<'defaulters' | 'history'>('defaulters');
  const [filter, setFilter] = useState<string>('defaulters');
  const [search, setSearch] = useState<string>('');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [page, setPage] = useState<number>(1);

  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  const [anyPlotSearch, setAnyPlotSearch] = useState<string>('');
  const [showAnyPlotPicker, setShowAnyPlotPicker] = useState<boolean>(false);

  const { data: defaultersData, isLoading: isLoadingDefaulters } = useQuery({
    queryKey: ['cancellations', 'defaulters', filter, search, page],
    queryFn: () => cancellationsApi.defaulters({ filter, q: search, page, limit: 50 }),
  });

  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['cancellations', 'history', search, page],
    queryFn: () => cancellationsApi.history({ q: search, page, limit: 50 }),
    enabled: activeTab === 'history',
  });

  const { data: activeProperties = [] } = useQuery({
    queryKey: ['cancellations', 'search-active', anyPlotSearch],
    queryFn: () => cancellationsApi.searchActive(anyPlotSearch),
    enabled: showAnyPlotPicker,
  });

  const metrics = defaultersData?.metrics || {
    totalPlotsWithDues: 0,
    totalOverdueAmount: 0,
    criticalDefaultersCount: 0,
    totalCancellationsCount: 0,
  };

  const handleCancelSuccess = (data: any) => {
    setSelectedPropertyId(null);
    setSuccessData(data);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <Header
        title="Cancellations"
        actions={
          <div className="relative">
            <button
              onClick={() => setShowAnyPlotPicker(!showAnyPlotPicker)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-slate-200/80 shadow-2xs text-xs font-semibold text-foreground hover:bg-slate-50 transition"
            >
              <UserX className="w-3.5 h-3.5 text-destructive" />
              Cancel Plot
            </button>

            {showAnyPlotPicker && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border bg-card shadow-2xl p-4 z-40 space-y-3 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-bold text-foreground">Select Plot</span>
                  <button onClick={() => setShowAnyPlotPicker(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={anyPlotSearch}
                  onChange={(e) => setAnyPlotSearch(e.target.value)}
                  placeholder="Search plot code, customer..."
                  className="w-full text-xs bg-muted/50 border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary"
                  autoFocus
                />
                <div className="max-h-56 overflow-y-auto space-y-1.5">
                  {activeProperties.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No active plots found</p>
                  ) : (
                    activeProperties.map((p: any) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setShowAnyPlotPicker(false);
                          setSelectedPropertyId(p.id);
                        }}
                        className="p-2 rounded-lg hover:bg-muted cursor-pointer flex justify-between items-center text-xs"
                      >
                        <span className="font-semibold">{p.code}</span>
                        <span className="text-muted-foreground">{p.customer?.fullName}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Critical Defaulters</span>
            <div className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-destructive">{metrics.criticalDefaultersCount}</span>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Overdue</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-foreground">
              {formatCurrency(metrics.totalOverdueAmount)}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Plots With Dues</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-foreground">{metrics.totalPlotsWithDues}</span>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Cancelled Plots</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-foreground">{metrics.totalCancellationsCount}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b">
        <button
          onClick={() => setActiveTab('defaulters')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'defaulters'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Plots with Dues
          {metrics.criticalDefaultersCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-destructive text-destructive-foreground">
              {metrics.criticalDefaultersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Cancellation History
        </button>
      </div>

      {/* Controls Bar: Filter icon beside search bar */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2 sm:gap-3 w-full">
          {/* Filter Trigger Button for Defaulters */}
          {activeTab === 'defaulters' && (
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(true)}
              className={cn(
                "relative flex items-center justify-center gap-2 h-10 px-3 sm:px-4 rounded-xl border text-sm font-medium transition shadow-2xs shrink-0 active:scale-95",
                filter !== 'defaulters'
                  ? "border-primary/50 bg-primary/10 text-primary font-semibold hover:bg-primary/15 ring-1 ring-primary/20"
                  : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              )}
              title="Filter"
              aria-label="Open filter drawer"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden md:inline font-medium">Filters</span>
              {filter !== 'defaulters' && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white shadow-2xs">
                  1
                </span>
              )}
            </button>
          )}

          {/* Search Input with clean placeholder padding */}
          <div className="flex items-center h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 gap-2 shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition">
            <Search className="h-4 w-4 text-slate-400 shrink-0 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeTab === 'history'
                  ? "Search cancelled plot, customer, refund ref, cheque..."
                  : "Search plot, customer, CNIC, phone..."
              }
              className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none border-none p-0"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Status Filters for desktop */}
          {activeTab === 'defaulters' && (
            <div className="hidden lg:flex items-center gap-1.5 shrink-0">
              {[
                { id: 'defaulters', label: 'Defaulters (>20d)' },
                { id: 'overdue', label: 'Overdue' },
                { id: 'all_dues', label: 'All with Dues' },
                { id: 'all_active', label: 'All Plots' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-xs font-semibold transition shrink-0 border",
                    filter === tab.id
                      ? "border-primary bg-primary text-white shadow-2xs"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Active Filter Pills Bar */}
        {activeTab === 'defaulters' && filter !== 'defaulters' && (
          <div className="flex items-center gap-2 pt-1 text-xs">
            <span className="text-slate-500 font-medium">Active filter:</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 font-semibold text-primary">
              {filter === 'overdue' ? 'Overdue' : filter === 'all_dues' ? 'All with Dues' : 'All Plots'}
              <button
                type="button"
                onClick={() => setFilter('defaulters')}
                className="hover:text-primary/70"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
            <button
              type="button"
              onClick={() => setFilter('defaulters')}
              className="text-slate-500 hover:text-slate-800 underline text-xs ml-1"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        title="Filter"
        activeCount={filter !== 'defaulters' ? 1 : 0}
        onReset={() => setFilter('defaulters')}
        onApply={() => setIsFilterDrawerOpen(false)}
      >
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Tag className="h-3.5 w-3.5 text-primary" />
            Plot Dues Status
          </div>
          <div className="grid grid-cols-1 gap-2">
            {[
              { value: 'defaulters', label: 'Defaulters (>20d Overdue)' },
              { value: 'overdue', label: 'All Overdue Plots' },
              { value: 'all_dues', label: 'All Plots with Any Dues' },
              { value: 'all_active', label: 'All Active Plots' },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={cn(
                  "flex items-center justify-between rounded-xl border px-3.5 py-3 text-left transition",
                  filter === item.value
                    ? "border-primary bg-primary/5 text-primary ring-1 ring-primary font-semibold"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                <span className="text-xs sm:text-sm text-slate-900">{item.label}</span>
                {filter === item.value && <Check className="h-4 w-4 text-primary shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      </FilterDrawer>

      {activeTab === 'defaulters' && (
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 border-b text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                <tr>
                  <th className="px-4 py-3">Plot</th>
                  <th className="px-4 py-3">Allottee</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Overdue</th>
                  <th className="px-4 py-3 text-center">Days</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {isLoadingDefaulters ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading...
                    </td>
                  </tr>
                ) : defaultersData?.data?.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      <p className="font-semibold text-foreground text-sm">No plots found</p>
                    </td>
                  </tr>
                ) : (
                  defaultersData?.data?.map((item: any) => (
                    <tr key={item.propertyId} className="hover:bg-muted/30 transition">
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/properties/${item.propertyId}`}
                          className="font-bold text-foreground hover:text-primary transition"
                        >
                          Plot {item.propertyCode}
                        </Link>
                        <span className="text-[10px] text-muted-foreground block">
                          {item.propertyType || 'Residential'}, {item.sizeSqYd || 120} Sq. Yds
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-foreground block">{item.customer.fullName}</span>
                        <span className="text-[11px] text-muted-foreground block">
                          {item.customer.phone || item.customer.mobile || item.customer.nationalId || '—'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right font-medium">
                        {formatCurrency(item.totalPrice)}
                      </td>

                      <td className="px-4 py-3.5 text-right font-semibold text-emerald-600">
                        {formatCurrency(item.totalPaid)}
                      </td>

                      <td className="px-4 py-3.5 text-right font-bold text-destructive">
                        {formatCurrency(item.overdueDues)}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {item.daysOverdue > 0 ? (
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.isDefaulter
                                ? 'bg-destructive text-destructive-foreground'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.daysOverdue}d
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">Current</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {item.isDefaulter ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20">
                            Defaulter
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                            Active
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedPropertyId(item.propertyId)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 hover:bg-destructive hover:text-white text-destructive font-bold text-xs transition"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          Cancel Allotment
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 border-b text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Plot</th>
                  <th className="px-4 py-3">Allottee</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Deduction</th>
                  <th className="px-4 py-3 text-right">Refund</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {isLoadingHistory ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading...
                    </td>
                  </tr>
                ) : historyData?.data?.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      No cancellations recorded.
                    </td>
                  </tr>
                ) : (
                  historyData?.data?.map((c: any) => {
                    const prop = c.property || c.Property;
                    const cust = c.customer || c.Customer;
                    const rec = c.receipt || c.Receipt;

                    return (
                      <tr key={c.id} className="hover:bg-muted/30 transition">
                        <td className="px-4 py-3.5 whitespace-nowrap text-muted-foreground">
                          {formatDate(c.cancelledAt)}
                        </td>

                        <td className="px-4 py-3.5">
                          {prop?.id ? (
                            <Link
                              href={`/properties/${prop.id}`}
                              className="font-bold text-foreground hover:text-primary transition"
                            >
                              Plot {prop.code}
                            </Link>
                          ) : (
                            <span className="font-bold text-foreground">Plot —</span>
                          )}
                          {prop?.type && (
                            <span className="text-[10px] text-muted-foreground block">
                              {prop.type}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-foreground block">{cust?.fullName || '—'}</span>
                          {(cust?.phone || cust?.mobile || cust?.nationalId) && (
                            <span className="text-[11px] text-muted-foreground block">
                              {cust.phone || cust.mobile || cust.nationalId}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right font-medium">
                          {formatCurrency(Number(c.totalPaid))}
                        </td>

                        <td className="px-4 py-3.5 text-right text-destructive font-semibold">
                          -{formatCurrency(Number(c.deductionAmount))}
                        </td>

                        <td className="px-4 py-3.5 text-right font-black text-emerald-600 text-sm">
                          {formatCurrency(Number(c.refundAmount))}
                        </td>

                        <td className="px-4 py-3.5 max-w-xs truncate" title={c.reason}>
                          <span className="text-foreground">{c.reason || '—'}</span>
                        </td>

                        <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-1.5">
                          <Link
                            href={`/print/cancellation-letter/${c.id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 p-1.5 rounded-lg border text-muted-foreground hover:text-foreground hover:bg-muted transition"
                            title="Print Cancellation Letter"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </Link>

                          {rec?.id && (
                            <button
                              onClick={() => {
                                receiptsApi.downloadPdf(rec.id).catch((err: any) =>
                                  toast.error(err.message || 'Download failed')
                                );
                              }}
                              className="inline-flex items-center gap-1 p-1.5 rounded-lg border text-muted-foreground hover:text-foreground hover:bg-muted transition"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {(prop?.status === 'AVAILABLE' || prop?.status === 'CANCELLED' || prop?.isCancelledAvailable) && prop?.id && (
                            <Link
                              href={`/properties/${prop.id}/assign`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition"
                              title="Re-allocate"
                            >
                              <UserPlus className="w-3 h-3" />
                              Re-allocate
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedPropertyId && (
        <CancellationModal
          propertyId={selectedPropertyId}
          onClose={() => setSelectedPropertyId(null)}
          onSuccess={handleCancelSuccess}
        />
      )}

      {successData && (
        <CancellationSuccessDialog
          open={!!successData}
          data={successData}
          onClose={() => setSuccessData(null)}
        />
      )}
    </div>
  );
}

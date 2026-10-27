'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { receiptsApi, exportCsv } from '@/lib/api'
import { formatCurrency, formatDate, getStatusColor, cn } from '@/lib/utils'
import { 
  Receipt, 
  Search, 
  Plus, 
  Download, 
  FileSpreadsheet, 
  Hammer, 
  CreditCard,
  SlidersHorizontal,
  X,
  RotateCcw,
  Check,
  Calendar,
  Layers,
  ArrowRightLeft,
  GitMerge,
  Pencil,
} from 'lucide-react'
import { FilterDrawer } from '@/components/FilterDrawer'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
import { EditReceiptDialog } from './edit-receipt-dialog'

export default function ReceiptsPage() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const [editingReceipt, setEditingReceipt] = useState<any | null>(null)

  const [search, setSearch] = useState('')
  const [timeFilter, setTimeFilter] = useState<string>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const [page, setPage] = useState(1)
  const limit = 50

  let from: string | undefined
  let to: string | undefined

  if (timeFilter === 'current_month') {
    const now = new Date()
    from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()
  } else if (timeFilter === 'prev_90_days') {
    const now = new Date()
    to = new Date(now.setHours(23, 59, 59, 999)).toISOString()
    const prev = new Date(now)
    prev.setDate(now.getDate() - 90)
    prev.setHours(0, 0, 0, 0)
    from = prev.toISOString()
  } else if (timeFilter === 'custom') {
    if (customFrom) {
      from = new Date(customFrom).toISOString()
    }
    if (customTo) {
      const toDate = new Date(customTo)
      toDate.setHours(23, 59, 59, 999)
      to = toDate.toISOString()
    }
  }

  const { data: response, isLoading } = useQuery({
    queryKey: ['receipts', search, timeFilter, customFrom, customTo, categoryFilter, page],
    queryFn: () => receiptsApi.list({ 
      q: search || undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      from,
      to,
      page,
      limit,
    }),
  })

  const rawReceipts = response?.data || []
  const totalPages = response?.totalPages || 1

  const getReceiptCategoryInfo = (r: any) => {
    if (
      r.category === 'TRANSFER' ||
      r.category === 'TRANSFER_FEE' ||
      (typeof r.code === 'string' && r.code.startsWith('TRF-')) ||
      r.OwnershipTransfer != null
    ) {
      return {
        label: 'Transfer',
        icon: ArrowRightLeft,
        badgeClass: 'bg-sky-50 border border-sky-200/80 text-sky-700',
        textColor: 'text-sky-700',
      }
    }
    if (
      r.category === 'DEVELOPMENT' || 
      (typeof r.code === 'string' && r.code.startsWith('DEV-')) ||
      r.invoice?.type === 'DEVELOPMENT_CHARGE'
    ) {
      return {
        label: 'Development',
        icon: Hammer,
        badgeClass: 'bg-indigo-50 border border-indigo-200/80 text-indigo-700',
        textColor: 'text-indigo-700',
      }
    }
    if (
      r.category === 'REFUND' ||
      r.category === 'CANCELLATION' ||
      (typeof r.code === 'string' && r.code.startsWith('REF-')) ||
      r.PlotCancellation != null
    ) {
      return {
        label: 'Refund',
        icon: RotateCcw,
        badgeClass: 'bg-rose-50 border border-rose-200/80 text-rose-700',
        textColor: 'text-rose-700',
      }
    }
    if (
      r.category === 'MERGE_ADJUSTMENT' ||
      r.category === 'MERGE' ||
      (typeof r.code === 'string' && r.code.startsWith('MRG-')) ||
      r.PlotMerge != null
    ) {
      return {
        label: 'Merge',
        icon: GitMerge,
        badgeClass: 'bg-purple-50 border border-purple-200/80 text-purple-700',
        textColor: 'text-purple-700',
      }
    }
    return {
      label: 'Installment',
      icon: CreditCard,
      badgeClass: 'bg-slate-100 border border-slate-200/80 text-slate-700',
      textColor: 'text-slate-900',
    }
  }

  const isDevReceipt = (r: any) => getReceiptCategoryInfo(r).label === 'Development'

  // Client-side filtering for payment method
  const filteredReceipts = rawReceipts.filter((r: any) => {
    if (methodFilter !== 'all' && r.method !== methodFilter) {
      return false
    }
    return true
  })

  // Calculate active filters count
  let activeFilterCount = 0
  if (categoryFilter !== 'all') activeFilterCount++
  if (timeFilter !== 'all') activeFilterCount++
  if (methodFilter !== 'all') activeFilterCount++

  const resetFilters = () => {
    setCategoryFilter('all')
    setTimeFilter('all')
    setCustomFrom('')
    setCustomTo('')
    setMethodFilter('all')
  }

  return (
    <div className="flex flex-col">
      <Header
        title="Receipts"
        actions={
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {filteredReceipts.length > 0 && (
              <button
                onClick={() => {
                  const csvData = filteredReceipts.map((r: any) => ({
                    'Receipt Code': r.code || '',
                    'Category': getReceiptCategoryInfo(r).label,
                    'Customer': r.customer?.fullName || '',
                    'Property': r.property?.code || '',
                    'Method': r.method || '',
                    'Date': r.receivedAt || '',
                    'Amount': r.amount || '',
                    'Status': r.status || '',
                    'Reference': r.reference || '',
                  }))
                  exportCsv(csvData, 'receipts.csv')
                  toast.success('CSV exported')
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white/90 p-2 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-2xs shrink-0"
                title="Export CSV"
                aria-label="Export CSV"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <span className="hidden sm:inline font-medium">Export CSV</span>
              </button>
            )}
            <Link
              href="/receipts/new"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-2xs shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Record Receipt</span>
              <span className="sm:hidden font-medium">Receipt</span>
            </Link>
          </div>
        }
      />
      
      <div className="flex-1 space-y-4 p-4 sm:space-y-6 sm:p-6">
        {/* Controls Bar: Filter Icon Button beside Search Bar */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 sm:gap-3 w-full">
            {/* Filter Trigger Button beside Search Bar */}
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(true)}
              className={cn(
                "relative flex items-center justify-center gap-2 h-10 px-3 sm:px-4 rounded-xl border text-sm font-medium transition shadow-2xs shrink-0 active:scale-95",
                activeFilterCount > 0
                  ? "border-primary/50 bg-primary/10 text-primary font-semibold hover:bg-primary/15 ring-1 ring-primary/20"
                  : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              )}
              title="Filter Receipts"
              aria-label="Open receipt filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden md:inline font-medium">Filters</span>
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white shadow-2xs">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Search Input */}
            <div className="flex items-center h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 gap-2 shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition">
              <Search className="h-4 w-4 text-slate-400 shrink-0 pointer-events-none" />
              <input
                type="text"
                placeholder="Search receipts, customer, plot..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none border-none p-0"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Desktop Quick Category Switcher (hidden on mobile/tablet) */}
            <div className="hidden lg:flex items-center gap-1.5 border-l border-slate-200/80 pl-3 shrink-0">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={cn(
                  "h-9 px-3 rounded-lg text-xs font-semibold transition shadow-2xs",
                  categoryFilter === 'all'
                    ? "bg-slate-900 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('INSTALLMENT')}
                className={cn(
                  "h-9 px-3 rounded-lg text-xs font-semibold transition shadow-2xs",
                  categoryFilter === 'INSTALLMENT'
                    ? "bg-primary text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                Installments
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('DEVELOPMENT')}
                className={cn(
                  "h-9 px-3 rounded-lg text-xs font-semibold transition shadow-2xs",
                  categoryFilter === 'DEVELOPMENT'
                    ? "bg-indigo-600 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                Development
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('TRANSFER')}
                className={cn(
                  "h-9 px-3 rounded-lg text-xs font-semibold transition shadow-2xs",
                  categoryFilter === 'TRANSFER'
                    ? "bg-sky-600 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                Transfers
              </button>
            </div>
          </div>

          {/* Active Filter Chips / Pills */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 animate-in fade-in duration-200">
              <span className="text-xs font-medium text-slate-500 mr-1">Active filters:</span>
              {categoryFilter !== 'all' && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-medium text-primary">
                  <span>
                    Category: {
                      categoryFilter === 'DEVELOPMENT' ? 'Development' : 
                      categoryFilter === 'TRANSFER' ? 'Transfer' : 
                      categoryFilter === 'REFUND' ? 'Refund' : 
                      categoryFilter === 'MERGE' ? 'Merge' : 'Installments'
                    }
                  </span>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('all')}
                    className="hover:bg-primary/20 rounded p-0.5 transition"
                    aria-label="Remove category filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {timeFilter !== 'all' && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-medium text-primary">
                  <span>
                    Time: {timeFilter === 'current_month' ? 'Current Month' : timeFilter === 'prev_90_days' ? 'Past 90 Days' : 'Custom Range'}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setTimeFilter('all'); setCustomFrom(''); setCustomTo(''); }}
                    className="hover:bg-primary/20 rounded p-0.5 transition"
                    aria-label="Remove time filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {methodFilter !== 'all' && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-medium text-primary">
                  <span>Method: {methodFilter}</span>
                  <button
                    type="button"
                    onClick={() => setMethodFilter('all')}
                    className="hover:bg-primary/20 rounded p-0.5 transition"
                    aria-label="Remove method filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 underline ml-1 cursor-pointer transition"
              >
                <RotateCcw className="h-3 w-3" />
                Reset all
              </button>
            </div>
          )}
        </div>

        {/* Filter Drawer */}
        <FilterDrawer
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          title="Filter"
          activeCount={activeFilterCount}
          onReset={resetFilters}
          onApply={() => setIsFilterDrawerOpen(false)}
        >
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Layers className="h-3.5 w-3.5 text-primary" />
              Category
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { value: 'all', label: 'All Categories', icon: Layers },
                { value: 'INSTALLMENT', label: 'Installments / Booking', icon: CreditCard },
                { value: 'DEVELOPMENT', label: 'Development Charges', icon: Hammer },
                { value: 'TRANSFER', label: 'Property Transfers', icon: ArrowRightLeft },
                { value: 'REFUND', label: 'Refunds / Cancellations', icon: RotateCcw },
                { value: 'MERGE', label: 'Plot Merges', icon: GitMerge },
              ].map((cat) => {
                const Icon = cat.icon;
                const isSelected = categoryFilter === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategoryFilter(cat.value)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary font-semibold"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition",
                      isSelected ? "bg-primary text-white shadow-2xs" : "bg-slate-100 text-slate-500"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="flex-1 text-xs sm:text-sm text-slate-900 leading-tight">{cat.label}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2.5 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Date & Time Range
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'all', label: 'All Time' },
                { value: 'current_month', label: 'Current Month' },
                { value: 'prev_90_days', label: 'Past 90 Days' },
                { value: 'custom', label: 'Custom Range' },
              ].map((tf) => (
                <button
                  key={tf.value}
                  type="button"
                  onClick={() => setTimeFilter(tf.value)}
                  className={cn(
                    "flex items-center justify-center rounded-xl border py-2.5 px-3 text-xs font-medium transition",
                    timeFilter === tf.value
                      ? "border-primary bg-primary text-white shadow-2xs font-semibold"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {timeFilter === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 animate-in fade-in duration-200">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">From Date</label>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">To Date</label>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2.5 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <CreditCard className="h-3.5 w-3.5 text-primary" />
              Payment Method
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'all', label: 'All Methods' },
                { value: 'CASH', label: 'Cash' },
                { value: 'CHEQUE', label: 'Cheque / PDC' },
                { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
                { value: 'ONLINE', label: 'Online / Card' },
              ].map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethodFilter(m.value)}
                  className={cn(
                    "flex items-center justify-center rounded-xl border py-2 px-2.5 text-xs font-medium transition",
                    methodFilter === m.value
                      ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </FilterDrawer>

        {/* Receipts Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border bg-card" />
            ))}
          </div>
        ) : filteredReceipts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-16 bg-white/40 text-center px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-4">
              <Receipt className="h-7 w-7" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">No receipts found</h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-sm">
              No receipts matched your search or filter criteria. Try adjusting filters or clear them.
            </p>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Clear Filters
              </button>
            )}
            <div className="mt-5 flex flex-wrap gap-2.5 justify-center">
              <Link
                href="/receipts/new?category=INSTALLMENT"
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition shadow-2xs"
              >
                <Plus className="h-4 w-4" />
                Record Installment Receipt
              </Link>
              <Link
                href="/receipts/new?category=DEVELOPMENT"
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition shadow-2xs"
              >
                <Hammer className="h-4 w-4" />
                Record Development Receipt
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50/75">
                    <tr>
                      <th className="px-4 py-3.5 text-left font-semibold text-slate-600">Receipt No.</th>
                      <th className="px-4 py-3.5 text-center font-semibold text-slate-600">Category</th>
                      <th className="px-4 py-3.5 text-left font-semibold text-slate-600">Customer</th>
                      <th className="px-4 py-3.5 text-left font-semibold text-slate-600">Property / Plot</th>
                      <th className="px-4 py-3.5 text-left font-semibold text-slate-600">Method</th>
                      <th className="px-4 py-3.5 text-left font-semibold text-slate-600">Date</th>
                      <th className="px-4 py-3.5 text-right font-semibold text-slate-600">Amount</th>
                      <th className="px-4 py-3.5 text-center font-semibold text-slate-600">Status</th>
                      <th className="px-4 py-3.5 text-center font-semibold text-slate-600">PDF</th>
                      {isSuperAdmin && (
                        <th className="px-4 py-3.5 text-center font-semibold text-slate-600">Edit</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredReceipts.map((receipt: any) => {
                      const isDev = isDevReceipt(receipt)
                      return (
                        <tr key={receipt.id} className="transition hover:bg-slate-50/60">
                          <td className="px-4 py-3.5 font-bold">
                            <span className={getReceiptCategoryInfo(receipt).textColor}>
                              {receipt.code}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {(() => {
                              const cat = getReceiptCategoryInfo(receipt);
                              const CatIcon = cat.icon;
                              return (
                                <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold", cat.badgeClass)}>
                                  <CatIcon className="h-3 w-3" />
                                  {cat.label}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-3.5 font-medium text-slate-800">{receipt.customer?.fullName || 'N/A'}</td>
                          <td className="px-4 py-3.5 font-semibold text-slate-700">{receipt.property?.code || 'N/A'}</td>
                          <td className="px-4 py-3.5 text-slate-500 font-medium">{receipt.method}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-slate-500">{formatDate(receipt.receivedAt)}</td>
                          <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                            {formatCurrency(Number(receipt.amount))}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(receipt.status)}`}>
                              {receipt.status === 'POSTED' ? 'PAID' : receipt.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                receiptsApi.downloadPdf(receipt.id).catch((err: any) =>
                                  toast.error(err.message || 'Download failed')
                                )
                              }}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                              title="Download PDF"
                              aria-label="Download PDF"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </td>
                          {isSuperAdmin && (
                            <td className="px-4 py-3.5 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingReceipt(receipt)
                                }}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition"
                                title="Edit Receipt (Super Admin Only)"
                                aria-label="Edit Receipt"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile View Cards */}
            <div className="space-y-3 sm:hidden">
              {filteredReceipts.map((receipt: any) => {
                const isDev = isDevReceipt(receipt)
                return (
                  <div key={receipt.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-sm ${getReceiptCategoryInfo(receipt).textColor}`}>
                        {receipt.code}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {(() => {
                          const cat = getReceiptCategoryInfo(receipt);
                          const CatIcon = cat.icon;
                          return (
                            <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold", cat.badgeClass)}>
                              <CatIcon className="h-3 w-3" />
                              {cat.label}
                            </span>
                          );
                        })()}
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${getStatusColor(receipt.status)}`}>
                          {receipt.status === 'POSTED' ? 'PAID' : receipt.status}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Customer</span>
                        <span className="font-semibold text-slate-900">{receipt.customer?.fullName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Plot</span>
                        <span className="font-bold text-slate-800">{receipt.property?.code || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Method</span>
                        <span className="text-slate-700 font-medium">{receipt.method}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Date</span>
                        <span className="text-slate-700">{formatDate(receipt.receivedAt)}</span>
                      </div>
                      {receipt.reference && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Reference</span>
                          <span className="text-slate-700 font-mono">{receipt.reference}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                      <div>
                        <div className="text-[11px] text-slate-500">Amount Paid</div>
                        <div className="text-base font-black text-slate-900">
                          {formatCurrency(Number(receipt.amount))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            receiptsApi.downloadPdf(receipt.id).catch((err: any) =>
                              toast.error(err.message || 'Download failed')
                            )
                          }}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                        >
                          <Download className="h-3.5 w-3.5" />
                          PDF
                        </button>
                        {isSuperAdmin && (
                          <button
                            onClick={() => setEditingReceipt(receipt)}
                            className="inline-flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50/80 px-2.5 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition shadow-2xs"
                            title="Edit Receipt (Super Admin Only)"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition shadow-2xs"
                >
                  Previous
                </button>
                <span className="text-xs font-medium text-slate-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition shadow-2xs"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <EditReceiptDialog
        receipt={editingReceipt}
        open={!!editingReceipt}
        onOpenChange={(open) => {
          if (!open) setEditingReceipt(null)
        }}
      />
    </div>
  )
}

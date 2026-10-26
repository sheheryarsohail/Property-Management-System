'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { invoicesApi, exportCsv } from '@/lib/api'
import { formatCurrency, formatDate, getStatusColor, cn } from '@/lib/utils'
import { 
  FileText, 
  Search, 
  FileSpreadsheet, 
  SlidersHorizontal, 
  X, 
  RotateCcw, 
  Check, 
  Calendar, 
  Tag 
} from 'lucide-react'
import { FilterDrawer } from '@/components/FilterDrawer'
import Link from 'next/link'
import { toast } from 'sonner'

export default function InvoicesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [timeFilter, setTimeFilter] = useState<string>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const [page, setPage] = useState(1)
  const limit = 50

  let from: string | undefined
  let to: string | undefined

  if (timeFilter === 'current_month') {
    const now = new Date()
    from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()
  } else if (timeFilter === 'next_90_days') {
    const now = new Date()
    from = new Date(now.setHours(0, 0, 0, 0)).toISOString()
    const ninety = new Date(now)
    ninety.setDate(now.getDate() + 90)
    to = ninety.toISOString()
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
    queryKey: ['invoices', search, statusFilter, timeFilter, customFrom, customTo, page],
    queryFn: () => invoicesApi.list({ 
      q: search || undefined, 
      status: statusFilter !== 'all' ? statusFilter : undefined,
      from,
      to,
      page,
      limit,
    }),
  })

  const filteredInvoices = response?.data || []
  const totalPages = response?.totalPages || 1

  // Active filters count
  let activeFilterCount = 0
  if (statusFilter !== 'all') activeFilterCount++
  if (timeFilter !== 'all') activeFilterCount++

  const resetFilters = () => {
    setStatusFilter('all')
    setTimeFilter('all')
    setCustomFrom('')
    setCustomTo('')
  }

  return (
    <div className="flex flex-col">
      <Header
        title="Installments"
        actions={
          filteredInvoices.length > 0 ? (
            <button
              onClick={() => {
                const csvData = filteredInvoices.map((inv: any) => ({
                  Code: inv.code || '',
                  Type: inv.type || '',
                  Customer: inv.customer?.fullName || '',
                  Property: inv.property?.code || '',
                  DueDate: inv.dueDate || '',
                  Total: inv.total || '',
                  Paid: inv.paid || '',
                  Balance: inv.status === 'VOID' ? 0 : Math.max(Number(inv.total) - Number(inv.paid), 0),
                  Status: inv.status || '',
                }))
                exportCsv(csvData, 'installments.csv')
                toast.success('CSV exported')
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white/90 p-2 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-2xs shrink-0"
              title="Export CSV"
              aria-label="Export CSV"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span className="hidden sm:inline font-medium">Export CSV</span>
            </button>
          ) : undefined
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
              title="Filter"
              aria-label="Open installment filters"
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
                placeholder="Search installments, customer, plot..."
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

            {/* Desktop Quick Status Switcher (hidden on mobile/tablet) */}
            <div className="hidden lg:flex items-center gap-1.5 border-l border-slate-200/80 pl-3 shrink-0">
              {[
                { label: 'All', value: 'all' },
                { label: 'Pending', value: 'PENDING' },
                { label: 'Overdue', value: 'OVERDUE' },
                { label: 'Paid', value: 'PAID' },
              ].map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatusFilter(s.value)}
                  className={cn(
                    "h-9 px-3 rounded-lg text-xs font-semibold transition shadow-2xs",
                    statusFilter === s.value
                      ? "bg-slate-900 text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Filter Chips / Pills */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 animate-in fade-in duration-200">
              <span className="text-xs font-medium text-slate-500 mr-1">Active filters:</span>
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-medium text-primary">
                  <span>Status: {statusFilter}</span>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className="hover:bg-primary/20 rounded p-0.5 transition"
                    aria-label="Remove status filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {timeFilter !== 'all' && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-medium text-primary">
                  <span>
                    Time: {timeFilter === 'current_month' ? 'Current Month' : timeFilter === 'next_90_days' ? 'Next 90 Days' : timeFilter === 'prev_90_days' ? 'Past 90 Days' : 'Custom Range'}
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
              <Tag className="h-3.5 w-3.5 text-primary" />
              Status
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'all', label: 'All Status' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'PARTIAL', label: 'Partial' },
                { value: 'PAID', label: 'Paid' },
                { value: 'OVERDUE', label: 'Overdue' },
                { value: 'PDC', label: 'PDC' },
                { value: 'VOID', label: 'Void' },
              ].map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatusFilter(s.value)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border py-2.5 px-3 text-xs font-medium transition text-left",
                    statusFilter === s.value
                      ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <span>{s.label}</span>
                  {statusFilter === s.value && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Due Date & Timeline
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'all', label: 'All Time' },
                { value: 'current_month', label: 'Current Month' },
                { value: 'next_90_days', label: 'Next 90 Days' },
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
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">From Due Date</label>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">To Due Date</label>
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
        </FilterDrawer>

        {/* Invoices List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border bg-card" />
            ))}
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-16 bg-white/40 text-center px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-4">
              <FileText className="h-7 w-7" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">No installments found</h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-sm">
              No installment invoices match your search or filter settings.
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
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50/75">
                    <tr>
                      <th className="px-4 py-3.5 text-left font-semibold text-slate-600">Type</th>
                      <th className="px-4 py-3.5 text-left font-semibold text-slate-600">Customer</th>
                      <th className="px-4 py-3.5 text-left font-semibold text-slate-600">Property</th>
                      <th className="px-4 py-3.5 text-left font-semibold text-slate-600">Due Date</th>
                      <th className="px-4 py-3.5 text-right font-semibold text-slate-600">Amount</th>
                      <th className="px-4 py-3.5 text-right font-semibold text-slate-600">Balance</th>
                      <th className="px-4 py-3.5 text-center font-semibold text-slate-600">Status</th>
                      <th className="px-4 py-3.5 text-center font-semibold text-slate-600">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInvoices.map((invoice: any) => {
                      const isVoid = invoice.status === 'VOID'
                      const isPaid = invoice.status === 'PAID'
                      const balance = isVoid ? 0 : Math.max(Number(invoice.total) - Number(invoice.paid), 0)
                      
                      let typeName = 'Installment'
                      if (invoice.type === 'BOOKING') typeName = 'Booking'
                      else if (invoice.type === 'CONFIRMATION' || invoice.type === 'HALF_YEARLY') typeName = 'Confirmation'
                      else if (invoice.type === 'INSTALLMENT') typeName = 'Installment'
                      else if (invoice.type === 'YEARLY') typeName = 'Yearly'

                      return (
                        <tr key={invoice.id} className={`hover:bg-slate-50/60 transition ${isVoid ? 'opacity-60 bg-slate-50/60' : ''}`}>
                          <td className="px-4 py-3.5">
                            <span className="font-semibold text-slate-900">
                              {typeName}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-medium text-slate-800">{invoice.customer?.fullName || 'N/A'}</td>
                          <td className="px-4 py-3.5 font-semibold text-slate-700">{invoice.property?.code || 'N/A'}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-slate-500">{formatDate(invoice.dueDate)}</td>
                          <td className="px-4 py-3.5 text-right font-medium text-slate-800">
                            {formatCurrency(Number(invoice.total))}
                          </td>
                          <td className="px-4 py-3.5 text-right font-bold">
                            {invoice.status === 'PAID' ? (
                              <span className="text-emerald-600 font-semibold">PAID</span>
                            ) : isVoid ? (
                              <span className="text-slate-400 line-through">—</span>
                            ) : (
                              <span className="text-slate-900">{formatCurrency(balance)}</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {!isPaid && !isVoid && balance > 0 ? (
                              <Link
                                href={`/receipts/new?propertyId=${invoice.property?.id || ''}&customerId=${invoice.customer?.id || ''}&invoiceId=${invoice.id}&category=INSTALLMENT`}
                                className="rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-semibold hover:bg-emerald-100 transition inline-block shadow-2xs"
                              >
                                Pay
                              </Link>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-3 sm:hidden">
              {filteredInvoices.map((invoice: any) => {
                const isVoid = invoice.status === 'VOID'
                const isPaid = invoice.status === 'PAID'
                const balance = isVoid ? 0 : Math.max(Number(invoice.total) - Number(invoice.paid), 0)
                let typeName = 'Installment'
                if (invoice.type === 'BOOKING') typeName = 'Booking'
                else if (invoice.type === 'CONFIRMATION' || invoice.type === 'HALF_YEARLY') typeName = 'Confirmation'
                else if (invoice.type === 'INSTALLMENT') typeName = 'Installment'
                else if (invoice.type === 'YEARLY') typeName = 'Yearly'

                return (
                  <div
                    key={invoice.id}
                    className={`rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3 shadow-2xs ${isVoid ? 'opacity-60 bg-slate-50/50' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">{typeName}</span>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Customer</span>
                        <span className="font-semibold text-slate-900">{invoice.customer?.fullName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Property</span>
                        <span className="font-bold text-slate-800">{invoice.property?.code || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Due Date</span>
                        <span className="text-slate-700">{formatDate(invoice.dueDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total Amount</span>
                        <span className="text-slate-700 font-medium">{formatCurrency(Number(invoice.total))}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                      <div>
                        <div className="text-[11px] text-slate-500">Balance Due</div>
                        <div className="text-base font-black text-slate-900">
                          {isVoid ? (
                            <span className="text-slate-400 line-through text-xs font-normal">Void</span>
                          ) : (
                            formatCurrency(balance)
                          )}
                        </div>
                      </div>
                      {!isPaid && !isVoid && balance > 0 && (
                        <Link
                          href={`/receipts/new?propertyId=${invoice.property?.id || ''}&customerId=${invoice.customer?.id || ''}&invoiceId=${invoice.id}&category=INSTALLMENT`}
                          className="rounded-xl bg-emerald-600 text-white px-3.5 py-1.5 text-xs font-semibold hover:bg-emerald-700 transition shadow-2xs"
                        >
                          Record Payment
                        </Link>
                      )}
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
    </div>
  )
}

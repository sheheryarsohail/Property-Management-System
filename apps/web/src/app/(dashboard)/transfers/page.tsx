'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { transfersApi, receiptsApi } from '@/lib/api'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { ArrowLeftRight, Search, Plus, FileText, Receipt, Printer, ExternalLink, SlidersHorizontal, X, RotateCcw, Check, Tag } from 'lucide-react'
import { FilterDrawer } from '@/components/FilterDrawer'
import { cn } from '@/lib/utils'
import { SearchableSelect } from '@/components/SearchableSelect'
import { toast } from 'sonner'
import Link from 'next/link'

type TransferListItem = {
  id: string
  property?: { code?: string | null; title?: string | null } | null
  fromCustomer?: { fullName?: string | null } | null
  toCustomer?: { fullName?: string | null } | null
  status: string
  transferDate: string
  transferFee?: number | null
  receiptId?: string | null
  receipt?: { id: string; code?: string | null; amount?: number | null } | null
  approvedAt?: string | null
  notes?: string | null
}

export default function TransfersPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)

  const { data: transfers = [], isLoading } = useQuery<TransferListItem[]>({
    queryKey: ['transfers', search, statusFilter],
    queryFn: () => transfersApi.list({ search, status: statusFilter !== 'all' ? statusFilter : undefined }),
  })

  const filteredTransfers = transfers

  return (
    <div className="flex flex-col">
      <Header title="Transfers" />

      <div className="flex-1 space-y-4 p-4 sm:space-y-6 sm:p-6">
        {/* Controls Bar: Filter icon beside search bar */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 sm:gap-3 w-full">
            {/* Filter Trigger Button */}
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(true)}
              className={cn(
                "relative flex items-center justify-center gap-2 h-10 px-3 sm:px-4 rounded-xl border text-sm font-medium transition shadow-2xs shrink-0 active:scale-95",
                statusFilter !== 'all'
                  ? "border-primary/50 bg-primary/10 text-primary font-semibold hover:bg-primary/15 ring-1 ring-primary/20"
                  : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              )}
              title="Filter Transfers"
              aria-label="Open transfer filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden md:inline font-medium">Filters</span>
              {statusFilter !== 'all' && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white shadow-2xs">
                  1
                </span>
              )}
            </button>

            {/* Search Input with clean placeholder padding */}
            <div className="flex items-center h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 gap-2 shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition">
              <Search className="h-4 w-4 text-slate-400 shrink-0 pointer-events-none" />
              <input
                type="text"
                placeholder="Search transfers by plot, buyer, seller..."
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
                { label: 'Submitted', value: 'SUBMITTED' },
                { label: 'Approved', value: 'APPROVED' },
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

            {/* New Transfer Button */}
            <Link
              href="/transfers/new"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-primary/90 transition shadow-2xs shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">New Transfer</span>
              <span className="sm:hidden font-medium">New</span>
            </Link>
          </div>

          {/* Active Filter Chips */}
          {statusFilter !== 'all' && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 animate-in fade-in duration-200">
              <span className="text-xs font-medium text-slate-500 mr-1">Active filters:</span>
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
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
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
          activeCount={statusFilter !== 'all' ? 1 : 0}
          onReset={() => setStatusFilter('all')}
          onApply={() => setIsFilterDrawerOpen(false)}
        >
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Tag className="h-3.5 w-3.5 text-primary" />
              Transfer Status
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { value: 'all', label: 'All Transfers' },
                { value: 'SUBMITTED', label: 'Submitted' },
                { value: 'APPROVED', label: 'Approved' },
                { value: 'DRAFT', label: 'Draft' },
                { value: 'REJECTED', label: 'Rejected' },
              ].map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatusFilter(s.value)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-3.5 py-3 text-left transition",
                    statusFilter === s.value
                      ? "border-primary bg-primary/5 text-primary ring-1 ring-primary font-semibold"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <span className="text-xs sm:text-sm text-slate-900">{s.label}</span>
                  {statusFilter === s.value && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </FilterDrawer>

        {/* Transfers List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl border bg-card sm:h-32" />
            ))}
          </div>
        ) : filteredTransfers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
            <ArrowLeftRight className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No transfers found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              No transfer records found.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransfers.map((transfer) => {
              const feeAmount = transfer.transferFee && Number(transfer.transferFee) > 0 ? Number(transfer.transferFee) : null
              const receiptId = transfer.receipt?.id || transfer.receiptId

              return (
                <div
                  key={transfer.id}
                  className="rounded-xl border bg-card p-4 transition-shadow hover:shadow-md sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/transfers/${transfer.id}`}
                          className="font-bold text-base hover:underline text-foreground"
                        >
                          {transfer.property?.code}
                        </Link>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusColor(transfer.status)}`}>
                          {transfer.status}
                        </span>
                        {feePaidBadge(feeAmount, transfer.receipt?.code)}
                      </div>

                      {transfer.property?.title && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {transfer.property.title}
                        </p>
                      )}

                      <div className="mt-2.5 flex flex-col gap-1.5 text-sm sm:flex-row sm:items-center sm:gap-4">
                        <span className="text-muted-foreground">
                          Seller: <span className="font-semibold text-foreground">{(transfer as any).from?.fullName || transfer.fromCustomer?.fullName || 'N/A'}</span>
                        </span>
                        <ArrowLeftRight className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
                        <span className="text-muted-foreground">
                          Buyer: <span className="font-semibold text-foreground">{(transfer as any).to?.fullName || transfer.toCustomer?.fullName || 'N/A'}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end justify-between text-xs sm:text-right">
                      <span className="text-muted-foreground">Date: {formatDate(transfer.transferDate)}</span>
                      {transfer.approvedAt && (
                        <span className="text-muted-foreground text-[11px] mt-0.5">
                          Approved: {formatDate(transfer.approvedAt)}
                        </span>
                      )}

                      {/* Quick Document Links */}
                      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                        <Link
                          href={`/print/transfer-form/${transfer.id}`}
                          title="Print Transfer Form"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border bg-white text-[11px] font-semibold text-neutral-800 hover:bg-neutral-100 shadow-xs"
                        >
                          <FileText className="w-3 h-3 text-neutral-600" />
                          Form
                        </Link>

                        <Link
                          href={`/print/transfer-letter/${transfer.id}`}
                          title="Print Transfer Letter"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border bg-white text-[11px] font-semibold text-neutral-800 hover:bg-neutral-100 shadow-xs"
                        >
                          <FileText className="w-3 h-3 text-neutral-600" />
                          Letter
                        </Link>

                        {receiptId && (
                          <button
                            type="button"
                            title="Download Transfer Fee Receipt"
                            onClick={() => {
                              receiptsApi.downloadPdf(receiptId).catch((err: any) =>
                                toast.error(err.message || 'Download failed')
                              )
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 shadow-xs"
                          >
                            <Receipt className="w-3 h-3 text-emerald-600" />
                            Receipt
                          </button>
                        )}

                        <Link
                          href={`/transfers/${transfer.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-900 text-white text-[11px] font-semibold hover:bg-black"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </div>

                  {transfer.notes && (
                    <p className="mt-2.5 truncate text-xs text-muted-foreground">{transfer.notes}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {!isLoading && filteredTransfers.length > 0 && (
          <div className="flex items-center justify-between rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredTransfers.length} transfers
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function feePaidBadge(feeAmount: number | null, receiptCode?: string | null) {
  if (!feeAmount) return null
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800">
      <Receipt className="w-3 h-3 text-emerald-700" />
      PKR {feeAmount.toLocaleString()}
      {receiptCode ? ` • ${receiptCode}` : ''}
    </span>
  )
}

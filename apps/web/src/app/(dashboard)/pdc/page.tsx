'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { pdcApi } from '@/lib/api'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { Wallet, Search, Plus, Loader2, SlidersHorizontal, X, RotateCcw, Check, Calendar, Tag } from 'lucide-react'
import { FilterDrawer } from '@/components/FilterDrawer'
import { cn } from '@/lib/utils'
import { SearchableSelect } from '@/components/SearchableSelect'
import Link from 'next/link'
import { toast } from 'sonner'
import { DatePicker } from '@/components/DatePicker'

type PdcListItem = {
  id: string
  customer?: { fullName?: string | null } | null
  bank: string
  chequeNo: string
  dueDate: string
  amount: string
  status: string
}

export default function PDCPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)

  const queryClient = useQueryClient()

  const { data: pdcs = [], isLoading } = useQuery<PdcListItem[]>({
    queryKey: ['pdc', search, statusFilter, fromDate, toDate],
    queryFn: () => pdcApi.list({ 
      search, 
      status: statusFilter !== 'all' ? statusFilter : undefined,
      from: fromDate || undefined,
      to: toDate || undefined
    }),
  })

  const depositMutation = useMutation({
    mutationFn: (id: string) => pdcApi.deposit(id),
    onSuccess: () => {
      toast.success('PDC marked as deposited')
      queryClient.invalidateQueries({ queryKey: ['pdc'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to deposit PDC')
    },
  })

  const clearMutation = useMutation({
    mutationFn: (id: string) => pdcApi.clear(id),
    onSuccess: () => {
      toast.success('PDC marked as cleared & receipt recorded')
      queryClient.invalidateQueries({ queryKey: ['pdc'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['receipts'] })
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to clear PDC')
    },
  })

  const bounceMutation = useMutation({
    mutationFn: (id: string) => pdcApi.bounce(id, { notes: 'Bounced from PDC Tab' }),
    onSuccess: () => {
      toast.success('PDC marked as bounced')
      queryClient.invalidateQueries({ queryKey: ['pdc'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to bounce PDC')
    },
  })

  const returnMutation = useMutation({
    mutationFn: (id: string) => pdcApi.return(id),
    onSuccess: () => {
      toast.success('PDC marked as returned to customer')
      queryClient.invalidateQueries({ queryKey: ['pdc'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to return PDC')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => pdcApi.delete(id),
    onSuccess: () => {
      toast.success('PDC deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['pdc'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete PDC')
    },
  })

  const filteredPDCs = pdcs

  return (
    <div className="flex flex-col">
      <Header title="Post-Dated Cheques" />
      
      <div className="flex-1 space-y-4 p-4 sm:space-y-6 sm:p-6">
        {/* Controls Bar: Filter beside search bar and Add PDC in one line */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 sm:gap-3 w-full">
            {/* Filter Trigger Button */}
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(true)}
              className={cn(
                "relative flex items-center justify-center gap-2 h-10 px-3 sm:px-4 rounded-xl border text-sm font-medium transition shadow-2xs shrink-0 active:scale-95",
                (statusFilter !== 'all' || fromDate || toDate)
                  ? "border-primary/50 bg-primary/10 text-primary font-semibold hover:bg-primary/15 ring-1 ring-primary/20"
                  : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              )}
              title="Filter"
              aria-label="Open PDC filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden md:inline font-medium">Filters</span>
              {(statusFilter !== 'all' || fromDate || toDate) && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white shadow-2xs">
                  {(statusFilter !== 'all' ? 1 : 0) + (fromDate || toDate ? 1 : 0)}
                </span>
              )}
            </button>

            {/* Search Input with snug placeholder spacing */}
            <div className="flex items-center h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 gap-2 shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition">
              <Search className="h-4 w-4 text-slate-400 shrink-0 pointer-events-none" />
              <input
                type="text"
                placeholder="Search PDCs by cheque no, customer, bank..."
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
                { label: 'Received', value: 'RECEIVED' },
                { label: 'Deposited', value: 'DEPOSITED' },
                { label: 'Cleared', value: 'CLEARED' },
                { label: 'Bounced', value: 'BOUNCED' },
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

            {/* Add PDC Button */}
            <Link
              href="/pdc/new"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-primary/90 transition shadow-2xs shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Add PDC</span>
              <span className="sm:hidden font-medium">Add</span>
            </Link>
          </div>

          {/* Active Filter Chips */}
          {(statusFilter !== 'all' || fromDate || toDate) && (
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
              {(fromDate || toDate) && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-medium text-primary">
                  <span>Due Date: {fromDate || 'Start'} to {toDate || 'End'}</span>
                  <button
                    type="button"
                    onClick={() => { setFromDate(''); setToDate(''); }}
                    className="hover:bg-primary/20 rounded p-0.5 transition"
                    aria-label="Remove date filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={() => { setStatusFilter('all'); setFromDate(''); setToDate(''); }}
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
          activeCount={(statusFilter !== 'all' ? 1 : 0) + (fromDate || toDate ? 1 : 0)}
          onReset={() => { setStatusFilter('all'); setFromDate(''); setToDate(''); }}
          onApply={() => setIsFilterDrawerOpen(false)}
        >
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Tag className="h-3.5 w-3.5 text-primary" />
              Cheque Status
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'all', label: 'All Status' },
                { value: 'RECEIVED', label: 'Received' },
                { value: 'DEPOSITED', label: 'Deposited' },
                { value: 'CLEARED', label: 'Cleared' },
                { value: 'BOUNCED', label: 'Bounced' },
                { value: 'RETURNED', label: 'Returned' },
                { value: 'CANCELLED', label: 'Cancelled' },
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
              Due Date Range
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 mb-1 block">From Date</label>
                <DatePicker
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 mb-1 block">To Date</label>
                <DatePicker
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs"
                />
              </div>
            </div>
          </div>
        </FilterDrawer>

        {/* PDC List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border bg-card" />
            ))}
          </div>
        ) : filteredPDCs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
            <Wallet className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No PDCs found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Add your first post-dated cheque
            </p>
            <Link
              href="/pdc/new"
              className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add PDC
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-xl border bg-card sm:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plot No</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Invoice</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Bank</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cheque No</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Due Date</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredPDCs.map((pdc: any) => {
                      const isRowDepositing = depositMutation.isPending && depositMutation.variables === pdc.id
                      const isRowClearing = clearMutation.isPending && clearMutation.variables === pdc.id
                      const isRowBouncing = bounceMutation.isPending && bounceMutation.variables === pdc.id
                      const isRowReturning = returnMutation.isPending && returnMutation.variables === pdc.id
                      const isRowDeleting = deleteMutation.isPending && deleteMutation.variables === pdc.id
                      const isRowBusy = isRowDepositing || isRowClearing || isRowBouncing || isRowReturning || isRowDeleting

                      const plotDisplay = pdc.invoice?.property?.title || pdc.invoice?.property?.code || pdc.customer?.ownerships?.[0]?.property?.code || pdc.customer?.ownerships?.[0]?.property?.title || '—'

                      return (
                        <tr key={pdc.id} className="transition hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">
                            <div>
                              <span>{pdc.customer?.fullName || 'N/A'}</span>
                              {pdc.customer?.code && (
                                <span className="ml-1.5 text-xs text-muted-foreground font-mono">({pdc.customer.code})</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground font-medium">{plotDisplay}</td>
                          <td className="px-4 py-3 text-muted-foreground font-mono">{pdc.invoice?.code || '—'}</td>
                          <td className="px-4 py-3 font-medium">{pdc.bank}</td>
                          <td className="px-4 py-3 font-mono font-medium">{pdc.chequeNo}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{formatDate(pdc.dueDate)}</td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {formatCurrency(Number(pdc.amount))}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(pdc.status)}`}>
                              {pdc.status}
                            </span>
                            {pdc.status === 'CLEARED' && pdc.receiptCode && (
                              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{pdc.receiptCode}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {pdc.status === 'RECEIVED' && (
                                <>
                                  <button
                                    type="button"
                                    disabled={isRowBusy}
                                    onClick={() => depositMutation.mutate(pdc.id)}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                                  >
                                    {isRowDepositing ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                                    Deposit
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isRowBusy}
                                    onClick={() => clearMutation.mutate(pdc.id)}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline disabled:opacity-50"
                                  >
                                    {isRowClearing ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                                    Clear
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isRowBusy}
                                    onClick={() => bounceMutation.mutate(pdc.id)}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:underline disabled:opacity-50"
                                  >
                                    {isRowBouncing ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                                    Bounce
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isRowBusy}
                                    onClick={() => {
                                      if (confirm(`Delete PDC #${pdc.chequeNo}?`)) {
                                        deleteMutation.mutate(pdc.id)
                                      }
                                    }}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-rose-600 disabled:opacity-50"
                                    title="Delete PDC"
                                  >
                                    {isRowDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                                  </button>
                                </>
                              )}
                              {pdc.status === 'DEPOSITED' && (
                                <>
                                  <button
                                    type="button"
                                    disabled={isRowBusy}
                                    onClick={() => clearMutation.mutate(pdc.id)}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline disabled:opacity-50"
                                  >
                                    {isRowClearing ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                                    Mark Cleared
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isRowBusy}
                                    onClick={() => bounceMutation.mutate(pdc.id)}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:underline disabled:opacity-50"
                                  >
                                    {isRowBouncing ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                                    Mark Bounced
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isRowBusy}
                                    onClick={() => returnMutation.mutate(pdc.id)}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:underline disabled:opacity-50"
                                  >
                                    {isRowReturning ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                                    Return
                                  </button>
                                </>
                              )}
                              {pdc.status !== 'RECEIVED' && pdc.status !== 'DEPOSITED' && (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 sm:hidden">
              {filteredPDCs.map((pdc: any) => {
                const isRowDepositing = depositMutation.isPending && depositMutation.variables === pdc.id
                const isRowClearing = clearMutation.isPending && clearMutation.variables === pdc.id
                const isRowBouncing = bounceMutation.isPending && bounceMutation.variables === pdc.id
                const isRowReturning = returnMutation.isPending && returnMutation.variables === pdc.id
                const isRowDeleting = deleteMutation.isPending && deleteMutation.variables === pdc.id
                const isRowBusy = isRowDepositing || isRowClearing || isRowBouncing || isRowReturning || isRowDeleting
                const plotDisplay = pdc.invoice?.property?.title || pdc.invoice?.property?.code || pdc.customer?.ownerships?.[0]?.property?.code || pdc.customer?.ownerships?.[0]?.property?.title || '—'

                return (
                  <div key={pdc.id} className="rounded-xl border bg-card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold">{pdc.customer?.fullName || 'N/A'}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          Plot: {plotDisplay} {pdc.invoice?.code ? `• ${pdc.invoice.code}` : ''}
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">{pdc.bank} • #{pdc.chequeNo}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(pdc.status)}`}>
                          {pdc.status}
                        </span>
                        {pdc.status === 'CLEARED' && pdc.receiptCode && (
                          <span className="text-[10px] text-muted-foreground font-mono">{pdc.receiptCode}</span>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Due {formatDate(pdc.dueDate)}</span>
                      <span className="text-lg font-bold">{formatCurrency(Number(pdc.amount))}</span>
                    </div>
                    {(pdc.status === 'RECEIVED' || pdc.status === 'DEPOSITED') && (
                      <div className="mt-3 flex items-center justify-end gap-2 border-t pt-3">
                        {pdc.status === 'RECEIVED' && (
                          <>
                            <button
                              type="button"
                              disabled={isRowBusy}
                              onClick={() => {
                                if (confirm(`Delete PDC #${pdc.chequeNo}?`)) {
                                  deleteMutation.mutate(pdc.id)
                                }
                              }}
                              className="rounded-lg border px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 disabled:opacity-50"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              disabled={isRowBusy}
                              onClick={() => clearMutation.mutate(pdc.id)}
                              className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 disabled:opacity-50 hover:bg-emerald-100"
                            >
                              {isRowClearing && <Loader2 className="h-3 w-3 animate-spin mr-1 inline" />}
                              Clear
                            </button>
                            <button
                              type="button"
                              disabled={isRowBusy}
                              onClick={() => depositMutation.mutate(pdc.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
                            >
                              {isRowDepositing && <Loader2 className="h-3 w-3 animate-spin" />}
                              Deposit
                            </button>
                          </>
                        )}
                        {pdc.status === 'DEPOSITED' && (
                          <>
                            <button
                              type="button"
                              disabled={isRowBusy}
                              onClick={() => bounceMutation.mutate(pdc.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-medium text-rose-700 disabled:opacity-50 hover:bg-rose-200"
                            >
                              {isRowBouncing && <Loader2 className="h-3 w-3 animate-spin" />}
                              Mark Bounced
                            </button>
                            <button
                              type="button"
                              disabled={isRowBusy}
                              onClick={() => clearMutation.mutate(pdc.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
                            >
                              {isRowClearing && <Loader2 className="h-3 w-3 animate-spin" />}
                              Mark Cleared
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {!isLoading && filteredPDCs.length > 0 && (
          <div className="flex flex-col gap-1 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredPDCs.length} PDCs
            </p>
            <p className="text-sm font-medium">
              Total: {formatCurrency(filteredPDCs.reduce((sum: number, p: any) => sum + Number(p.amount), 0))}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { reportsApi, propertiesApi, statementsApi, exportCsv } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, Building2, Loader2, Download, FileSpreadsheet, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'
import { SearchableSelect } from '@/components/SearchableSelect'
import { DatePicker } from '@/components/DatePicker'

export default function PropertyLedgerPage() {
  const searchParams = useSearchParams()
  const urlPropertyId = searchParams.get('propertyId')
  const [propertyId, setPropertyId] = useState(urlPropertyId || '')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  useEffect(() => {
    if (urlPropertyId && urlPropertyId !== propertyId) {
      setPropertyId(urlPropertyId)
    }
  }, [urlPropertyId, propertyId])

  const { data: properties = [] } = useQuery({
    queryKey: ['properties-options'],
    queryFn: () => propertiesApi.list({}),
  })

  const { data: ledger, isLoading, isFetching } = useQuery({
    queryKey: ['property-ledger', propertyId, fromDate, toDate],
    queryFn: () => reportsApi.propertyLedger(propertyId, { from: fromDate || undefined, to: toDate || undefined }),
    enabled: !!propertyId,
  })

  const entries = Array.isArray(ledger?.entries) ? ledger.entries : Array.isArray(ledger) ? ledger : []

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'Plot Cost':
        return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">Plot Cost</span>
      case 'Dev Charges':
        return <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800">Dev Charges</span>
      case 'Dev Receipt':
        return <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800">Dev Receipt</span>
      case 'Installment':
        return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">Installment</span>
      case 'Receipt':
        return <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">Receipt</span>
      case 'Recovery Charge':
        return <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">Recovery</span>
      case 'Refund Voucher':
        return <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-300">Refund Voucher</span>
      case 'Receipt (VOID)':
      case 'Dev Receipt (VOID)':
      case 'Invoice (VOID)':
      case 'Dev Charges (VOID)':
      case 'Installment (VOID)':
        return <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800 border border-rose-200">VOID</span>
      default:
        return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">{type || 'N/A'}</span>
    }
  }

  return (
    <div className="flex flex-col">
      <Header
        title="Property Ledger"
        actions={
          propertyId && entries.length > 0 ? (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const csvData = entries.map((e: any) => ({
                    Date: e.date || e.createdAt || '',
                    Description: e.description || e.code || '',
                    Type: e.type || '',
                    Debit: e.debit || '',
                    Credit: e.credit || '',
                    Balance: e.balance || '',
                  }))
                  exportCsv(csvData, `property-ledger-${propertyId}.csv`)
                  toast.success('CSV exported')
                }}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export CSV
              </button>
              <button
                onClick={async () => {
                  try {
                    await statementsApi.downloadPropertyReport(propertyId, fromDate, toDate)
                    toast.success('PDF downloaded')
                  } catch (err: any) {
                    toast.error(err.message || 'Failed to download PDF')
                  }
                }}
                className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
            </div>
          ) : undefined
        }
      />

      <div className="flex-1 space-y-6 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <Link
            href="/reports"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Reports
          </Link>
        </div>

        {/* Filters */}
        <div className="rounded-xl border bg-card p-4 sm:p-6">
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium">Property</label>
              <SearchableSelect
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                options={properties?.map((p: any) => ({
                  label: `${p.code} — ${p.title}`,
                  value: p.id,
                })) || []}
                placeholder="Select property..."
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">From Date</label>
              <DatePicker
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">To Date</label>
              <DatePicker
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Property Summary */}
        {propertyId && ledger && !isLoading && !isFetching && (
          <div className="rounded-xl border bg-card p-4 sm:p-6 mb-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b">
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Ledger Overview
                </h2>
                {ledger.property?.code && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Plot: <span className="font-semibold text-foreground">{ledger.property.code}</span> — {ledger.property.title || 'Untitled'}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Plot status */}
                {(ledger.summary.installmentRemaining ?? ledger.summary.remainingBalance) <= 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Plot Cost Paid
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 uppercase tracking-wider">
                    <Clock className="h-3.5 w-3.5" />
                    Plot Active
                  </span>
                )}

                {/* Development Charges status */}
                {ledger.summary.devChargesTotal > 0 ? (
                  ledger.summary.devChargesStatus === 'PAID' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Dev Charges Paid
                    </span>
                  ) : ledger.summary.devChargesStatus === 'PARTIAL' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 uppercase tracking-wider">
                      <Clock className="h-3.5 w-3.5" />
                      Dev Charges Partial
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-800 uppercase tracking-wider">
                      <Clock className="h-3.5 w-3.5" />
                      Dev Charges Pending
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Dev Charges Not Configured
                  </span>
                )}
              </div>
            </div>
            
            {/* Summary Cards Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {/* Card 1: Plot Base Price */}
              <div className="rounded-xl border bg-slate-50/70 p-4 shadow-sm">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Base Plot Cost</p>
                <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">{formatCurrency(ledger.summary.totalPrice)}</p>
                <div className="mt-2 space-y-0.5 border-t pt-1.5 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Paid:</span>
                    <span className="font-semibold text-emerald-600">{formatCurrency(ledger.summary.installmentPaid ?? ledger.summary.totalPaid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Balance:</span>
                    <span className="font-semibold text-slate-700">{formatCurrency(ledger.summary.installmentRemaining ?? ledger.summary.remainingBalance)}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Development Charges */}
              <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-purple-900 uppercase tracking-wide">Development Charges</p>
                  {ledger.summary.devChargesTotal > 0 && (
                    <span className="text-[10px] font-bold uppercase rounded bg-purple-200/80 px-1.5 py-0.5 text-purple-900">
                      {ledger.summary.devChargesStatus}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-2xl font-bold tracking-tight text-purple-950">
                  {formatCurrency(ledger.summary.devChargesTotal || 0)}
                </p>
                <div className="mt-2 space-y-0.5 border-t border-purple-200/60 pt-1.5 text-xs text-purple-900">
                  <div className="flex justify-between">
                    <span>Paid:</span>
                    <span className="font-semibold text-indigo-700">{formatCurrency(ledger.summary.devChargesPaid || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Balance:</span>
                    <span className="font-semibold text-purple-900">{formatCurrency(ledger.summary.devChargesRemaining || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Total Collections */}
              <div className="rounded-xl border bg-emerald-50/60 p-4 shadow-sm">
                <p className="text-xs font-semibold text-emerald-900 uppercase tracking-wide">Total Collections</p>
                <p className="mt-1.5 text-2xl font-bold tracking-tight text-emerald-700">
                  {formatCurrency(ledger.summary.grandTotalPaid ?? ledger.summary.totalReceived)}
                </p>
                <div className="mt-2 space-y-0.5 border-t border-emerald-200/60 pt-1.5 text-xs text-emerald-800">
                  <div className="flex justify-between">
                    <span>Plot Collections:</span>
                    <span className="font-medium">{formatCurrency(ledger.summary.installmentPaid || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dev Collections:</span>
                    <span className="font-medium">{formatCurrency(ledger.summary.devChargesPaid || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Net Remaining Balance */}
              <div className="rounded-xl border bg-slate-900 text-white p-4 shadow-sm">
                <p className="text-xs font-medium text-slate-300 uppercase tracking-wide">Grand Remaining Bal</p>
                <p className="mt-1.5 text-2xl font-bold tracking-tight text-white">
                  {formatCurrency(ledger.summary.grandRemainingBalance ?? ledger.summary.remainingBalance)}
                </p>
                <div className="mt-2 space-y-0.5 border-t border-slate-700 pt-1.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span>Grand Plot Price:</span>
                    <span className="font-semibold text-slate-100">{formatCurrency(ledger.summary.grandTotalPrice ?? ledger.summary.totalPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Net Balance Due:</span>
                    <span className="font-semibold text-emerald-400">{formatCurrency(ledger.summary.grandRemainingBalance ?? ledger.summary.remainingBalance)}</span>
                  </div>
                </div>
              </div>

              {/* Card 5: Overdue Arrears */}
              <div className="rounded-xl border bg-rose-50/60 p-4 shadow-sm">
                <p className="text-xs font-semibold text-rose-900 uppercase tracking-wide">Overdue Arrears</p>
                <p className={`mt-1.5 text-2xl font-bold tracking-tight ${ledger.summary.outstanding > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                  {formatCurrency(ledger.summary.outstanding)}
                </p>
                <div className="mt-2 space-y-0.5 border-t border-rose-200/60 pt-1.5 text-xs text-rose-800">
                  <div className="flex justify-between">
                    <span>Billed Arrears:</span>
                    <span className="font-semibold">{formatCurrency(ledger.summary.outstanding)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={`font-semibold ${ledger.summary.outstanding > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {ledger.summary.outstanding > 0 ? 'Action Required' : 'Up to Date'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {!propertyId ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
            <Building2 className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Select a Property</h3>
            <p className="mt-2 text-sm text-muted-foreground">Choose a property above to view its transaction ledger</p>
          </div>
        ) : isLoading || isFetching ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
            <Building2 className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Transactions Found</h3>
            <p className="mt-2 text-sm text-muted-foreground">This property has no recorded transactions for the selected period</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto rounded-xl border bg-card sm:block shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Debit</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Credit</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry: any, idx: number) => (
                    <tr key={entry.id || idx} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-700">
                        {formatDate(entry.date || entry.issueDate || entry.receivedAt || entry.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {getTypeBadge(entry.type || entry.entryType || 'N/A')}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{entry.description || entry.code || entry.notes || '—'}</td>
                      <td className="px-4 py-3 text-right font-medium text-rose-600">
                        {entry.debit ? formatCurrency(Number(entry.debit)) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-600">
                        {entry.credit ? formatCurrency(Number(entry.credit)) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">
                        {entry.balance !== undefined ? formatCurrency(Number(entry.balance)) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card view */}
            <div className="space-y-3 sm:hidden">
              {entries.map((entry: any, idx: number) => (
                <div key={entry.id || idx} className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      {getTypeBadge(entry.type || entry.entryType || 'N/A')}
                      <p className="mt-1.5 text-sm text-muted-foreground">{entry.description || entry.code || '—'}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(entry.date || entry.issueDate || entry.receivedAt || entry.createdAt)}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center border-t pt-2.5">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Debit</p>
                      <p className="text-sm font-medium text-rose-600">{entry.debit ? formatCurrency(Number(entry.debit)) : '—'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Credit</p>
                      <p className="text-sm font-medium text-emerald-600">{entry.credit ? formatCurrency(Number(entry.credit)) : '—'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Balance</p>
                      <p className="text-sm font-semibold">{entry.balance !== undefined ? formatCurrency(Number(entry.balance)) : '—'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

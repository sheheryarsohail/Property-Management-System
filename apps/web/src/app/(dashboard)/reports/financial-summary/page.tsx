'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { ArrowLeft, TrendingUp, TrendingDown, Wallet, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { reportsApi } from '@/lib/api'
import { DatePicker } from '@/components/DatePicker'

export default function FinancialSummaryPage() {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const { data: report, isLoading, isFetching } = useQuery({
    queryKey: ['financial-summary', fromDate, toDate],
    queryFn: () => reportsApi.financialSummary({ from: fromDate, to: toDate }),
  })

  return (
    <div className="flex flex-col bg-transparent min-h-full">
      <Header
        title="Financial Summary"
        actions={
          <Link
            href="/reports"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs ring-1 ring-inset ring-slate-200 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-slate-500" />
            Back to Reports
          </Link>
        }
      />

      <div className="flex-1 space-y-6 overflow-x-hidden w-full">
        {/* Date Filter Bar - Single line layout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-700">Date Range Filter</span>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap shrink-0 overflow-x-auto py-0.5">
            <div className="w-28 sm:w-36 shrink-0">
              <DatePicker
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-8 sm:h-9 w-full rounded-lg border border-slate-200 bg-white px-2 sm:px-3 text-xs shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="From Date"
              />
            </div>
            <span className="text-slate-400 text-xs font-semibold shrink-0 px-0.5">to</span>
            <div className="w-28 sm:w-36 shrink-0">
              <DatePicker
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-8 sm:h-9 w-full rounded-lg border border-slate-200 bg-white px-2 sm:px-3 text-xs shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="To Date"
              />
            </div>
            {(fromDate || toDate) && (
              <button
                onClick={() => {
                  setFromDate('')
                  setToDate('')
                }}
                className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition shrink-0"
              >
                Clear
              </button>
            )}
            {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !report ? (
          <div className="text-center py-12 text-slate-500 text-xs">Failed to load financial report</div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Revenue Column */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <h2 className="text-sm font-bold text-slate-900">Inflow (Revenue)</h2>
                </div>
                
                <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
                  <div className="p-5 bg-emerald-50/60 border-b border-emerald-100">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">Total Recovered</p>
                    <p className="mt-1 text-3xl font-bold text-emerald-600 tracking-tight">
                      {formatCurrency(report.revenue?.totalRecovered || 0)}
                    </p>
                    <div className="mt-2.5 flex items-center gap-3 pt-2.5 border-t border-emerald-200/50 text-xs">
                      <div>
                        <span className="text-slate-600">Installments: </span>
                        <span className="font-semibold text-slate-900">{formatCurrency(report.revenue?.installmentRecovered || 0)}</span>
                      </div>
                      <span className="text-slate-300">•</span>
                      <div>
                        <span className="text-slate-600">Dev Charges: </span>
                        <span className="font-semibold text-slate-900">{formatCurrency(report.revenue?.devRecovered || 0)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 space-y-3 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Total Invoiced (Billed)</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(report.revenue?.totalInvoiced || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 font-medium">Pending Receivables</span>
                      <span className="font-semibold text-amber-600">{formatCurrency(report.revenue?.pendingReceivables || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expenses Column */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-rose-600" />
                  <h2 className="text-sm font-bold text-slate-900">Outflow (Expenses)</h2>
                </div>
                
                <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
                  <div className="p-5 bg-rose-50/60 border-b border-rose-100">
                    <p className="text-xs font-semibold text-rose-800 uppercase tracking-wide">Total Expenses</p>
                    <p className="mt-1 text-3xl font-bold text-rose-600 tracking-tight">
                      {formatCurrency(report.expenses?.total || 0)}
                    </p>
                  </div>
                  <div className="p-5 space-y-2.5 text-xs">
                    <h3 className="text-xs font-semibold text-slate-700">By Category</h3>
                    {report.expenses?.byCategory?.length > 0 ? (
                      report.expenses.byCategory.map((cat: any) => (
                        <div key={cat.category} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                          <span className="text-slate-600">{cat.category}</span>
                          <span className="font-medium text-slate-900">{formatCurrency(cat.amount)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 py-1 italic">No expenses recorded for this period.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Net Cash Flow Banner (Clean, no verbose paragraphs) */}
            <div className={`rounded-2xl border p-6 shadow-2xs flex flex-col items-center justify-center text-center ${
              report.netCashFlow >= 0 ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'
            }`}>
              <Wallet className={`h-8 w-8 mb-2 ${report.netCashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
              <h3 className="text-sm font-semibold text-slate-700">Net Cash Flow (Period)</h3>
              <p className={`mt-1 text-4xl font-bold tracking-tight ${
                report.netCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {formatCurrency(report.netCashFlow || 0)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

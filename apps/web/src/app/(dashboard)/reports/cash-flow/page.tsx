'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { reportsApi } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, TrendingUp, Loader2, FileSpreadsheet, ArrowDownCircle, ArrowUpCircle, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { DatePicker } from '@/components/DatePicker'
import { subDays, startOfWeek, startOfMonth, startOfYear, format } from 'date-fns'

export default function CashFlowReportPage() {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const { data: report, isLoading } = useQuery({
    queryKey: ['cash-flow', fromDate, toDate],
    queryFn: () => reportsApi.cashFlow({
      from: fromDate || undefined,
      to: toDate || undefined,
    }),
  })

  const receipts = report?.receipts || []
  const expenses = report?.expenses || []
  const refunds = report?.refunds || []
  const totalReceived = report?.totalReceived || 0
  const totalSpent = report?.totalSpent || 0
  const totalRefunded = report?.totalRefunded || 0
  const netCashFlow = report?.netCashFlow || 0

  const handleQuickFilter = (type: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    const today = new Date()
    let start = today
    
    switch (type) {
      case 'daily':
        start = today
        break
      case 'weekly':
        start = startOfWeek(today)
        break
      case 'monthly':
        start = startOfMonth(today)
        break
      case 'yearly':
        start = startOfYear(today)
        break
    }
    
    setFromDate(format(start, 'yyyy-MM-dd'))
    setToDate(format(today, 'yyyy-MM-dd'))
  }

  const handleExport = () => {
    const formatDateSafe = (d: any) => {
      if (!d) return ''
      try {
        const dt = new Date(d)
        if (isNaN(dt.getTime())) return String(d)
        return format(dt, 'dd/MM/yyyy')
      } catch {
        return String(d)
      }
    }

    const formatFilterDate = (d?: string) => {
      if (!d) return 'All Time'
      try {
        const dt = new Date(d)
        if (isNaN(dt.getTime())) return d
        return format(dt, 'dd/MM/yyyy')
      } catch {
        return d
      }
    }

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""'
      const str = String(val)
      return `"${str.replace(/"/g, '""')}"`
    }

    // 1. Prepare receipt rows (Inflow)
    const receiptRows = receipts.map((r: any) => ({
      date: formatDateSafe(r.date),
      type: 'Collection Receipt',
      property: r.property || '',
      method: r.method || 'CASH',
      inflow: Number(r.amount) || 0,
      outflow: 0,
      net: Number(r.amount) || 0,
      rawDate: r.date ? new Date(r.date).getTime() : 0,
    }))

    // 2. Prepare expense rows (Outflow)
    const expenseRows = expenses.map((e: any) => ({
      date: formatDateSafe(e.date),
      type: 'Expense Voucher',
      property: e.property || '',
      method: e.category || 'EXPENSE',
      inflow: 0,
      outflow: Number(e.amount) || 0,
      net: -1 * (Number(e.amount) || 0),
      rawDate: e.date ? new Date(e.date).getTime() : 0,
    }))

    // 3. Prepare refund rows (Outflow)
    const refundRows = refunds.map((rf: any) => ({
      date: formatDateSafe(rf.date),
      type: 'Refund Voucher',
      property: rf.property || '',
      method: rf.method || 'CASH',
      inflow: 0,
      outflow: Number(rf.amount) || 0,
      net: -1 * (Number(rf.amount) || 0),
      rawDate: rf.date ? new Date(rf.date).getTime() : 0,
    }))

    // 4. Combined transactions sorted newest first
    const allTransactions = [...receiptRows, ...refundRows, ...expenseRows].sort(
      (a, b) => b.rawDate - a.rawDate
    )

    const totalOutflow = totalSpent + totalRefunded

    const lines: string[] = [
      // Report Title & Period
      [escapeCsv('Cash Flow Report')].join(','),
      [escapeCsv('Date Range'), escapeCsv(`From: ${formatFilterDate(fromDate)} To: ${formatFilterDate(toDate)}`)].join(','),
      [escapeCsv('Generated At'), escapeCsv(format(new Date(), 'dd/MM/yyyy HH:mm:ss'))].join(','),
      '',
      // Executive Totals Summary
      [
        escapeCsv('Summary'),
        escapeCsv('Inflow (PKR)'),
        escapeCsv('Outflow (PKR)'),
        escapeCsv('Net Cash Flow (PKR)'),
      ].join(','),
      [
        escapeCsv('Total Collections (Inflow)'),
        totalReceived,
        0,
        totalReceived,
      ].join(','),
      [
        escapeCsv('Total Expenses (Outflow)'),
        0,
        totalSpent,
        -totalSpent,
      ].join(','),
      [
        escapeCsv('Total Customer Refunds (Outflow)'),
        0,
        totalRefunded,
        -totalRefunded,
      ].join(','),
      [
        escapeCsv('Net Cash Flow'),
        totalReceived,
        totalOutflow,
        netCashFlow,
      ].join(','),
      '',
      // Detailed Transaction Breakup Table
      [
        escapeCsv('Date'),
        escapeCsv('Type'),
        escapeCsv('Property'),
        escapeCsv('Payment Method'),
        escapeCsv('Inflow (PKR)'),
        escapeCsv('Outflow (PKR)'),
        escapeCsv('Net (PKR)'),
      ].join(','),
      ...allTransactions.map((t) =>
        [
          escapeCsv(t.date),
          escapeCsv(t.type),
          escapeCsv(t.property),
          escapeCsv(t.method),
          t.inflow,
          t.outflow,
          t.net,
        ].join(',')
      ),
    ]

    const csvContent = '\uFEFF' + lines.join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cash-flow-report${fromDate ? `-from-${fromDate}` : ''}${toDate ? `-to-${toDate}` : ''}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    toast.success('Cash Flow Report CSV exported')
  }

  return (
    <div className="flex flex-col">
      <Header
        title="Cash Flow Report"
        actions={
          (receipts.length > 0 || expenses.length > 0 || refunds.length > 0) ? (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export CSV
            </button>
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
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="grid gap-4 sm:grid-cols-2 flex-1">
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
            
            <div className="flex flex-wrap gap-2 md:pb-1">
              <button onClick={() => handleQuickFilter('daily')} className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Today</button>
              <button onClick={() => handleQuickFilter('weekly')} className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">This Week</button>
              <button onClick={() => handleQuickFilter('monthly')} className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">This Month</button>
              <button onClick={() => handleQuickFilter('yearly')} className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">This Year</button>
              <button onClick={() => { setFromDate(''); setToDate('') }} className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Clear</button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-green-200 bg-green-50/50 p-5">
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-green-600" />
              <h3 className="text-sm font-medium text-green-800">Total Received (Inflow)</h3>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-green-700">{formatCurrency(totalReceived)}</p>
            <p className="mt-1 text-xs text-green-700/80">{receipts.length} collection receipts</p>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50/50 p-5">
            <div className="flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5 text-red-600" />
              <h3 className="text-sm font-medium text-red-800">Total Expenses (Outflow)</h3>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-red-700">{formatCurrency(totalSpent)}</p>
            <p className="mt-1 text-xs text-red-700/80">{expenses.length} expense vouchers</p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-amber-600" />
              <h3 className="text-sm font-medium text-amber-800">Refund Vouchers (Outflow)</h3>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-amber-700">{formatCurrency(totalRefunded)}</p>
            <p className="mt-1 text-xs text-amber-700/80">{refunds.length} customer refunds</p>
          </div>

          <div className={`rounded-xl border p-5 ${netCashFlow >= 0 ? 'border-blue-200 bg-blue-50/50' : 'border-orange-200 bg-orange-50/50'}`}>
            <div className="flex items-center gap-2">
              <TrendingUp className={`h-5 w-5 ${netCashFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
              <h3 className={`text-sm font-medium ${netCashFlow >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>Net Cash Flow</h3>
            </div>
            <p className={`mt-2 text-2xl sm:text-3xl font-bold ${netCashFlow >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
              {formatCurrency(netCashFlow)}
            </p>
            <p className={`mt-1 text-xs ${netCashFlow >= 0 ? 'text-blue-700/80' : 'text-orange-700/80'}`}>Inflow − Expenses − Refunds</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : ( receipts.length === 0 && expenses.length === 0 && refunds.length === 0 ) ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
            <TrendingUp className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Cash Flow Data</h3>
            <p className="mt-2 text-sm text-muted-foreground">No receipts, refunds, or expenses found for this date range.</p>
          </div>
        ) : (
          <div className={`grid gap-6 ${refunds.length > 0 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
            {/* Receipts Column */}
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="bg-green-50/50 px-4 py-3 border-b border-green-100 flex justify-between items-center">
                <h3 className="font-semibold text-green-800">Income (Receipts)</h3>
                <span className="text-sm font-medium text-green-700">{receipts.length} items</span>
              </div>
              <div className="divide-y overflow-y-auto max-h-[600px]">
                {receipts.map((r: any) => (
                  <div key={r.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <span className="font-medium">{r.code}</span>
                        {r.property && <span className="ml-2 text-xs bg-slate-100 px-2 py-0.5 rounded-full">{r.property}</span>}
                      </div>
                      <span className="font-bold text-green-600">+{formatCurrency(r.amount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span className="truncate pr-4">{r.description}</span>
                      <span className="whitespace-nowrap">{formatDate(r.date)}</span>
                    </div>
                  </div>
                ))}
                {receipts.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground text-sm">No income in this period</div>
                )}
              </div>
            </div>

            {/* Expenses Column */}
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="bg-red-50/50 px-4 py-3 border-b border-red-100 flex justify-between items-center">
                <h3 className="font-semibold text-red-800">Expenses</h3>
                <span className="text-sm font-medium text-red-700">{expenses.length} items</span>
              </div>
              <div className="divide-y overflow-y-auto max-h-[600px]">
                {expenses.map((e: any) => (
                  <div key={e.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <span className="font-medium">{e.code || e.title || 'Expense'}</span>
                        {e.property && <span className="ml-2 text-xs bg-slate-100 px-2 py-0.5 rounded-full">{e.property}</span>}
                      </div>
                      <span className="font-bold text-red-600">-{formatCurrency(e.amount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground mt-1">
                      <span className="truncate pr-4">{e.description || e.notes || '—'}</span>
                      <span className="whitespace-nowrap shrink-0">{formatDate(e.date)}</span>
                    </div>
                  </div>
                ))}
                {expenses.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground text-sm">No expenses in this period</div>
                )}
              </div>
            </div>

            {/* Refund Vouchers Column */}
            {refunds.length > 0 && (
              <div className="rounded-xl border bg-card overflow-hidden">
                <div className="bg-amber-50/50 px-4 py-3 border-b border-amber-100 flex justify-between items-center">
                  <h3 className="font-semibold text-amber-800">Refund Vouchers (Outflow)</h3>
                  <span className="text-sm font-medium text-amber-700">{refunds.length} items</span>
                </div>
                <div className="divide-y overflow-y-auto max-h-[600px]">
                  {refunds.map((rf: any) => (
                    <div key={rf.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <span className="font-medium">{rf.code}</span>
                          {rf.property && <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">{rf.property}</span>}
                          <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Refund</span>
                        </div>
                        <span className="font-bold text-amber-700">-{formatCurrency(rf.amount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-muted-foreground mt-1">
                        <span className="truncate pr-4">{rf.description}</span>
                        <span className="whitespace-nowrap shrink-0">{formatDate(rf.date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

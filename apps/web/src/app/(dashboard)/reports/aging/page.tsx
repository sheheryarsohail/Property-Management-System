'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { reportsApi, customersApi, propertiesApi } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, FileSpreadsheet, Loader2, Download } from 'lucide-react'
import { SearchableSelect } from '@/components/SearchableSelect'
import { toast } from 'sonner'
import Link from 'next/link'
import { DatePicker } from '@/components/DatePicker'

export default function AgingReportPage() {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [propertyId, setPropertyId] = useState('')
  const [status, setStatus] = useState('')
  const [includeExpenses, setIncludeExpenses] = useState(false)

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-options'],
    queryFn: () => customersApi.list({}),
  })

  const { data: properties = [] } = useQuery({
    queryKey: ['properties-options'],
    queryFn: () => propertiesApi.list({}),
  })

  const { data: report, isLoading, isFetching } = useQuery({
    queryKey: ['aging-report', fromDate, toDate, customerId, propertyId, status, includeExpenses],
    queryFn: () => reportsApi.aging({ from: fromDate, to: toDate, customer: customerId, property: propertyId, status, includeExpenses: includeExpenses.toString() }),
  })

  const exportCsv = () => {
    if (!report?.invoices?.length) {
      toast.error('No data to export')
      return
    }
    const csvData = report.invoices.map((inv: any) => ({
      'Invoice #': inv.code,
      Type: inv.type === 'DEVELOPMENT_CHARGE' ? 'Development Charge' : 'Installment',
      Customer: inv.customer?.fullName,
      Property: inv.property?.title,
      'Due Date': formatDate(inv.dueDate),
      'Days Overdue': inv.daysOverdue,
      Status: inv.status,
      Total: inv.total,
      Paid: inv.paid,
      Balance: inv.balance,
    }))
    
    const headers = Object.keys(csvData[0])
    const csvRows = [
      headers.join(','),
      ...csvData.map((row: any) =>
        headers.map((h) => `"${String(row[h]).replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvRows], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aging-report-${formatDate(new Date())}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('CSV Exported')
  }

  return (
    <div className="flex flex-col bg-white min-h-full">
      <Header
        title="Receivables / Aging Report"
        actions={
          <button
            onClick={exportCsv}
            disabled={!report?.invoices?.length}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        }
      />

      <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-10">
        <div className="flex items-center justify-between">
          <Link
            href="/reports"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Reports
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 rounded-xl border bg-slate-50 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">From Date</label>
            <DatePicker
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">To Date</label>
            <DatePicker
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Customer</label>
            <SearchableSelect
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              options={customers?.map((c: any) => ({
                label: c.fullName || c.code || 'Unnamed Customer',
                value: c.id,
              })) || []}
              placeholder="All Customers"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Property</label>
            <SearchableSelect
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              options={properties?.map((p: any) => ({
                label: `${p.code} - ${p.title || 'Untitled'}`,
                value: p.id,
              })) || []}
              placeholder="All Properties"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
            <SearchableSelect
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              isSearchable={false}
              options={[
                { label: 'All Invoices', value: '' },
                { label: 'Overdue Only', value: 'OVERDUE' },
                { label: 'Pending Only', value: 'PENDING' },
                { label: 'Paid', value: 'PAID' }
              ]}
            />
          </div>
          <div className="md:col-span-2 lg:col-span-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="includeExpenses"
              checked={includeExpenses}
              onChange={(e) => setIncludeExpenses(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <label htmlFor="includeExpenses" className="text-sm font-medium text-slate-700">
              Include Expenses in Summary
            </label>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500">Total Invoiced</h3>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {formatCurrency(report?.summary?.totalInvoiced || 0)}
            </p>
          </div>
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500">Total Paid</h3>
            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {formatCurrency(report?.summary?.totalPaid || 0)}
            </p>
          </div>
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-medium text-slate-500">Remaining Balance</h3>
              {isFetching && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            </div>
            <p className="mt-2 text-2xl font-bold text-rose-600">
              {formatCurrency(report?.summary?.totalOutstanding || 0)}
            </p>
          </div>
          {includeExpenses && (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="text-sm font-medium text-slate-500">Total Expenses</h3>
              <p className="mt-2 text-2xl font-bold text-orange-600">
                {formatCurrency(report?.summary?.totalExpenses || 0)}
              </p>
            </div>
          )}
        </div>

        {/* Flat Table */}
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-600">Invoice #</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Type</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Customer</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Property</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Due Date</th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">Age (Days)</th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">Total</th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">Paid</th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">Balance</th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      Loading data...
                    </td>
                  </tr>
                ) : !report?.invoices?.length ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      No invoices found matching the filters.
                    </td>
                  </tr>
                ) : (
                  report.invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">
                        <Link href={`/invoices`} className="text-primary hover:underline">
                          {inv.code}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {inv.type === 'DEVELOPMENT_CHARGE' ? (
                          <span className="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            Dev Charge
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            Installment
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{inv.customer?.fullName}</div>
                        {!inv.customer?.fullName && <div className="text-xs text-slate-500">{inv.customer?.code}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{inv.property?.title}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(inv.dueDate)}</td>
                      <td className="px-4 py-3 text-right">
                        {inv.daysOverdue > 0 ? (
                          <span className="text-rose-600 font-medium">{inv.daysOverdue} days</span>
                        ) : (
                          <span className="text-slate-400">Current</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(inv.total)}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(inv.paid)}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">{formatCurrency(inv.balance)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                          inv.status === 'OVERDUE' ? 'bg-rose-100 text-rose-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

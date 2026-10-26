'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { reportsApi, exportCsv } from '@/lib/api'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { ArrowLeft, TrendingUp, Loader2, FileSpreadsheet, Printer } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { DatePicker } from '@/components/DatePicker'
import { SearchableSelect } from '@/components/SearchableSelect'

export default function ExpenseRegisterPage() {
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const { data: report, isLoading } = useQuery({
    queryKey: ['expense-register', categoryFilter, statusFilter, fromDate, toDate],
    queryFn: () => reportsApi.expenseRegister({
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      fromDate,
      toDate,
    }),
  })

  const expenses = Array.isArray(report?.items) ? report.items : Array.isArray(report) ? report : []

  const totalAmount = expenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0)

  return (
    <div className="flex flex-col">
      <Header
        title="Expense Register"
        actions={
          expenses.length > 0 ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                <Printer className="h-4 w-4" />
                Print Register
              </button>
              <button
                onClick={() => {
                  const csvData = expenses.map((e: any) => ({
                    Date: e.date || e.incurredAt || e.createdAt || '',
                    Title: e.title || '',
                    Category: e.category || '',
                    Type: e.type || '',
                    Amount: e.amount || '',
                    Status: e.status || '',
                    Vendor: e.vendorName || e.vendor || '',
                  }))
                  exportCsv(csvData, 'expense-register.csv')
                  toast.success('CSV exported')
                }}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export CSV
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
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Filters</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Category</label>
              <SearchableSelect
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                isSearchable={false}
                options={[
                  { label: 'All Categories', value: 'all' },
                  { label: 'Office', value: 'OFFICE' },
                  { label: 'Development', value: 'DEVELOPMENT' }
                ]}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Status</label>
              <SearchableSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                isSearchable={false}
                options={[
                  { label: 'All Status', value: 'all' },
                  { label: 'Draft', value: 'DRAFT' },
                  { label: 'Approved', value: 'APPROVED' },
                  { label: 'Posted', value: 'POSTED' },
                  { label: 'Cancelled', value: 'CANCELLED' }
                ]}
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

        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="mt-1 text-2xl font-bold">{expenses.length}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="mt-1 text-2xl font-bold">{formatCurrency(totalAmount)}</p>
          </div>
        </div>

        {/* Expense List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
            <TrendingUp className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Expenses Found</h3>
            <p className="mt-2 text-sm text-muted-foreground">No expenses match the selected filters</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto rounded-xl border bg-card sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vendor</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense: any) => (
                    <tr key={expense.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{expense.title}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{expense.type?.replace(/_/g, ' ') || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{expense.vendorName || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(expense.incurredAt || expense.createdAt)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(Number(expense.amount))}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(expense.status)}`}>
                          {expense.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {expense.id && (
                          <Link
                            href={`/print/expense-voucher/${expense.id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition"
                            title="Print Expense Voucher"
                          >
                            <Printer className="h-3.5 w-3.5 text-primary" />
                            Print
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 sm:hidden">
              {expenses.map((expense: any) => (
                <div key={expense.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{expense.title}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">{expense.category}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(expense.status)}`}>
                          {expense.status}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 text-lg font-bold">{formatCurrency(Number(expense.amount))}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t pt-2">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {expense.vendorName && <span>{expense.vendorName}</span>}
                      <span>{formatDate(expense.incurredAt || expense.createdAt)}</span>
                    </div>
                    {expense.id && (
                      <Link
                        href={`/print/expense-voucher/${expense.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                      >
                        <Printer className="h-3.5 w-3.5 text-primary" />
                        Print Voucher
                      </Link>
                    )}
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

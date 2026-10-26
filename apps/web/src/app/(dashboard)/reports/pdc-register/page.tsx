'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { reportsApi, exportCsv } from '@/lib/api'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { ArrowLeft, Wallet, Loader2, FileSpreadsheet } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { DatePicker } from '@/components/DatePicker'
import { SearchableSelect } from '@/components/SearchableSelect'

export default function PdcRegisterPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const { data: report, isLoading } = useQuery({
    queryKey: ['pdc-register', statusFilter, fromDate, toDate],
    queryFn: () => reportsApi.pdcRegister({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      fromDate,
      toDate,
    }),
  })

  const pdcs = Array.isArray(report?.items) ? report.items : Array.isArray(report) ? report : []

  const totalAmountCalc = pdcs.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)
  const summary = {
    total: report?.summary?.totalCount ?? report?.summary?.total ?? pdcs.length,
    totalAmount: report?.summary?.totalAmount ?? (typeof report?.summary?.total === 'number' && report?.summary?.total > pdcs.length ? report.summary.total : totalAmountCalc),
    received: report?.summary?.received ?? pdcs.filter((p: any) => p.status === 'RECEIVED').reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0),
    cleared: report?.summary?.cleared ?? pdcs.filter((p: any) => p.status === 'CLEARED').reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0),
  }

  return (
    <div className="flex flex-col">
      <Header
        title="PDC Register"
        actions={
          pdcs.length > 0 ? (
            <button
              onClick={() => {
                const csvData = pdcs.map((p: any) => ({
                  ChequeNo: p.chequeNo || '',
                  Bank: p.bank || '',
                  Customer: p.customer?.fullName || '',
                  Amount: p.amount || '',
                  DueDate: p.dueDate || '',
                  Status: p.status || '',
                }))
                exportCsv(csvData, 'pdc-register.csv')
                toast.success('CSV exported')
              }}
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
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Filters</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Status</label>
              <SearchableSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                isSearchable={false}
                options={[
                  { label: 'All Status', value: 'all' },
                  { label: 'Received', value: 'RECEIVED' },
                  { label: 'Deposited', value: 'DEPOSITED' },
                  { label: 'Cleared', value: 'CLEARED' },
                  { label: 'Bounced', value: 'BOUNCED' },
                  { label: 'Returned', value: 'RETURNED' },
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
            <p className="text-sm text-muted-foreground">Total PDCs</p>
            <p className="mt-1 text-2xl font-bold">{summary.total}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="mt-1 text-2xl font-bold">{formatCurrency(Number(summary.totalAmount || 0))}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Received / Pending</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{formatCurrency(Number(summary.received || 0))}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Cleared</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{formatCurrency(Number(summary.cleared || 0))}</p>
          </div>
        </div>

        {/* PDC List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : pdcs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
            <Wallet className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No PDCs Found</h3>
            <p className="mt-2 text-sm text-muted-foreground">No post-dated cheques match the selected filters</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto rounded-xl border bg-card sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Bank</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cheque No</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Due Date</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pdcs.map((pdc: any) => (
                    <tr key={pdc.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{pdc.customer?.fullName || 'N/A'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{pdc.bank || '—'}</td>
                      <td className="px-4 py-3">{pdc.chequeNo || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(pdc.dueDate)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(Number(pdc.amount))}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(pdc.status)}`}>
                          {pdc.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 sm:hidden">
              {pdcs.map((pdc: any) => (
                <div key={pdc.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{pdc.customer?.fullName || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">{pdc.bank || 'Unknown Bank'} • {pdc.chequeNo || '—'}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(pdc.status)}`}>
                      {pdc.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Due {formatDate(pdc.dueDate)}</span>
                    <span className="text-lg font-bold">{formatCurrency(Number(pdc.amount))}</span>
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

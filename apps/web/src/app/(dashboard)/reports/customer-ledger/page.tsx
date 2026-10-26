'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { reportsApi, customersApi, exportCsv } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, Users, Loader2, FileSpreadsheet, ExternalLink, Building2, CheckCircle2, Clock } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'
import { SearchableSelect } from '@/components/SearchableSelect'
import { DatePicker } from '@/components/DatePicker'

export default function CustomerLedgerPage() {
  const [customerId, setCustomerId] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-options'],
    queryFn: () => customersApi.list({}),
  })

  const { data: ledger, isLoading, isFetching } = useQuery({
    queryKey: ['customer-ledger', customerId, fromDate, toDate],
    queryFn: () => reportsApi.customerLedger(customerId, { fromDate, toDate }),
    enabled: !!customerId,
  })

  // The API may return { properties: [...] } grouped by property, or a flat array
  const properties = Array.isArray(ledger?.properties)
    ? ledger.properties
    : Array.isArray(ledger)
    ? [{ propertyCode: 'All', entries: ledger }]
    : []

  const totalBalance = ledger?.grandTotal?.remainingBalance ?? properties.reduce((sum: number, prop: any) => {
    return sum + Number(prop.summary?.remainingBalance || 0)
  }, 0)

  return (
    <div className="flex flex-col">
      <Header
        title="Customer Ledger"
        actions={
          customerId && properties.length > 0 ? (
            <button
              onClick={() => {
                const allEntries: any[] = []
                properties.forEach((prop: any) => {
                  (prop.entries || []).forEach((e: any) => {
                    allEntries.push({
                      Property: prop.propertyCode || prop.property?.code || '',
                      Date: e.date || e.createdAt || '',
                      Description: e.description || e.code || '',
                      Type: e.type || '',
                      Debit: e.debit || '',
                      Credit: e.credit || '',
                      Balance: e.balance || '',
                    })
                  })
                })
                exportCsv(allEntries, `customer-ledger-${customerId}.csv`)
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
        <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm">
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium">Customer</label>
              <SearchableSelect
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                options={customers?.map((c: any) => ({
                  label: c.fullName || c.code || 'Unnamed Customer',
                  value: c.id,
                })) || []}
                placeholder="-- Select Customer --"
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

        {/* Results */}
        {!customerId ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
            <Users className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Select a Customer</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Choose a customer above to view their consolidated ledger across all properties
            </p>
          </div>
        ) : isLoading || isFetching ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
            <Users className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Transactions Found</h3>
            <p className="mt-2 text-sm text-muted-foreground">This customer has no recorded transactions</p>
          </div>
        ) : (
          <>
            {/* Consolidated Summary */}
            <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b">
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    Portfolio Summary
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Customer: <span className="font-semibold text-foreground">{ledger?.customer?.fullName || ledger?.customer?.code}</span>
                  </p>
                </div>
                <div className="text-xs text-muted-foreground bg-slate-100 rounded-full px-3 py-1 font-medium">
                  {properties.length} {properties.length === 1 ? 'Plot Owned' : 'Plots Owned'}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-xl border bg-slate-50/70 p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Plot Value</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                    {formatCurrency(ledger?.grandTotal?.totalPlotValue || 0)}
                  </p>
                  
                </div>

                <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4">
                  <p className="text-xs font-semibold text-purple-900 uppercase tracking-wide">Development Charges</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-purple-950">
                    {formatCurrency(ledger?.grandTotal?.totalDevCharges || 0)}
                  </p>
                  
                </div>

                <div className="rounded-xl border bg-emerald-50/60 p-4">
                  <p className="text-xs font-semibold text-emerald-900 uppercase tracking-wide">Total Paid (All)</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-700">
                    {formatCurrency(ledger?.grandTotal?.totalPaid || ledger?.summary?.totalReceived || 0)}
                  </p>
                  
                </div>

                <div className="rounded-xl border bg-slate-900 text-white p-4">
                  <p className="text-xs font-medium text-slate-300 uppercase tracking-wide">Consolidated Balance</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-white">
                    {formatCurrency(totalBalance)}
                  </p>
                  
                </div>

                <div className="rounded-xl border bg-rose-50/60 p-4">
                  <p className="text-xs font-semibold text-rose-900 uppercase tracking-wide">Total Arrears</p>
                  <p className={`mt-1 text-2xl font-bold tracking-tight ${(ledger?.grandTotal?.outstandingArrears || 0) > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                    {formatCurrency(ledger?.grandTotal?.outstandingArrears || 0)}
                  </p>
                  
                </div>
              </div>
            </div>

            {/* Per-property sections */}
            {properties.map((prop: any, pIdx: number) => {
              const summary = prop.summary || {}
              return (
                <div key={prop.propertyId || prop.property?.id || pIdx} className="rounded-xl border bg-card shadow-sm overflow-hidden">
                  <div className="border-b bg-muted/40 px-4 py-3 sm:px-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <Link href={`/reports/property-ledger?propertyId=${prop.property?.id}`} className="font-bold text-base text-primary hover:underline flex items-center gap-1.5">
                          {prop.propertyCode || prop.property?.code || `Plot ${pIdx + 1}`}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                        {(prop.propertyTitle || prop.property?.title) && (
                          <span className="text-sm text-muted-foreground">— {prop.propertyTitle || prop.property?.title}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/reports/property-ledger?propertyId=${prop.property?.id}`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          View Full Property Ledger →
                        </Link>
                      </div>
                    </div>

                    {prop.property && (
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5 border-t pt-3">
                        <div className="rounded-lg bg-background p-2.5 border">
                          <p className="text-[11px] text-muted-foreground uppercase font-semibold">Plot Base Price</p>
                          <p className="text-sm font-bold text-slate-900 mt-0.5">
                            {formatCurrency(Number(prop.property.totalPrice || 0))}
                          </p>
                          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
                            Paid: {formatCurrency(summary.installmentPaid || 0)}
                          </p>
                        </div>

                        <div className="rounded-lg bg-purple-50/50 p-2.5 border border-purple-200/70">
                          <p className="text-[11px] text-purple-900 uppercase font-semibold">Development Charges</p>
                          <p className="text-sm font-bold text-purple-950 mt-0.5">
                            {formatCurrency(summary.devChargesTotal || 0)}
                          </p>
                          <p className="text-[10px] text-indigo-700 font-medium mt-0.5">
                            Paid: {formatCurrency(summary.devChargesPaid || 0)}
                          </p>
                        </div>

                        <div className="rounded-lg bg-emerald-50/50 p-2.5 border border-emerald-200/70">
                          <p className="text-[11px] text-emerald-900 uppercase font-semibold">Total Paid</p>
                          <p className="text-sm font-bold text-emerald-700 mt-0.5">
                            {formatCurrency(summary.totalPaid || 0)}
                          </p>
                          <p className="text-[10px] text-emerald-800 font-medium mt-0.5">Plot + Dev payments</p>
                        </div>

                        <div className="rounded-lg bg-slate-50 p-2.5 border">
                          <p className="text-[11px] text-slate-700 uppercase font-semibold">Remaining Balance</p>
                          <p className="text-sm font-bold text-slate-900 mt-0.5">
                            {formatCurrency(summary.remainingBalance ?? Math.max(0, (Number(prop.property.totalPrice || 0) + Number(summary.devChargesTotal || 0)) - Number(summary.totalPaid || 0)))}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">Grand Net Payable</p>
                        </div>

                        <div className="rounded-lg bg-rose-50/50 p-2.5 border border-rose-200/70">
                          <p className="text-[11px] text-rose-900 uppercase font-semibold">Outstanding Arrears</p>
                          <p className={`text-sm font-bold mt-0.5 ${(summary.outstandingArrears || 0) > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                            {formatCurrency(summary.outstandingArrears || 0)}
                          </p>
                          <p className="text-[10px] text-rose-800 font-medium mt-0.5">Overdue dues</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}

'use client'

import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { reportsApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, DollarSign, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function RecoveryReportPage() {
  const { data: report, isLoading } = useQuery({
    queryKey: ['recovery-report'],
    queryFn: () => reportsApi.recovery({}),
  })

  const items = Array.isArray(report?.items) ? report.items : Array.isArray(report) ? report : []

  return (
    <div className="flex flex-col">
      <Header title="Recovery" />

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

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
            <DollarSign className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Recovery Data</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              No development charge allocations have been made yet
            </p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border bg-card p-4">
                <p className="text-sm text-muted-foreground">Total Allocations</p>
                <p className="mt-1 text-2xl font-bold">{items.length}</p>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <p className="text-sm text-muted-foreground">Total Recovery Amount</p>
                <p className="mt-1 text-2xl font-bold">
                  {formatCurrency(items.reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0))}
                </p>
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto rounded-xl border bg-card sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Property</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Pool</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Method</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Share %</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Invoiced</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any) => (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{item.property?.code || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.title || '—'}</td>
                      <td className="px-4 py-3">{item.pool?.title || item.pool?.code || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">
                          {item.allocationMethod?.replace(/_/g, ' ') || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.allocationShare ? `${(Number(item.allocationShare) * 100).toFixed(2)}%` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(Number(item.amount))}</td>
                      <td className="px-4 py-3 text-center">
                        {item.invoiceId ? (
                          <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">Yes</span>
                        ) : (
                          <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-800">No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 sm:hidden">
              {items.map((item: any) => (
                <div key={item.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold">{item.property?.code || '—'}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{item.title || '—'}</p>
                    </div>
                    <span className="shrink-0 text-lg font-bold">{formatCurrency(Number(item.amount))}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">
                      {item.allocationMethod?.replace(/_/g, ' ') || 'N/A'}
                    </span>
                    {item.pool?.title && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">{item.pool.title}</span>
                    )}
                    {item.invoiceId ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Invoiced</span>
                    ) : (
                      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">Not Invoiced</span>
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

'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { customersApi, propertiesApi, statementsApi, exportCsv, reportsApi } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { SearchableSelect } from '@/components/SearchableSelect'
import { ScrollText, Loader2, Building2, Users, FileSpreadsheet, Download } from 'lucide-react'
import { toast } from 'sonner'
import { DatePicker } from '@/components/DatePicker'

type StatementType = 'property' | 'customer'

export default function StatementsPage() {
  const [stmtType, setStmtType] = useState<StatementType>('property')
  const [selectedId, setSelectedId] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const { data: properties = [] } = useQuery({
    queryKey: ['properties-options-stmt'],
    queryFn: () => propertiesApi.list({}),
  })

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-options-stmt'],
    queryFn: () => customersApi.list({}),
  })

  const { data: statement, isLoading, isFetching } = useQuery({
    queryKey: ['statement', stmtType, selectedId, fromDate, toDate],
    queryFn: () => {
      const params = { from: fromDate || undefined, to: toDate || undefined }
      return stmtType === 'property'
        ? reportsApi.propertyLedger(selectedId, params)
        : reportsApi.customerLedger(selectedId, params)
    },
    enabled: !!selectedId,
  })

  const entries = Array.isArray(statement?.entries)
    ? statement.entries
    : Array.isArray(statement?.transactions)
    ? statement.transactions
    : Array.isArray(statement)
    ? statement
    : []

  const summaryData = statement?.summary || statement?.totals || null

  const options = stmtType === 'property' ? properties : customers

  return (
    <div className="flex flex-col">
      <Header
        title="Statements"
        actions={
          selectedId && entries.length > 0 ? (
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
                  exportCsv(csvData, `statement-${stmtType}-${selectedId}.csv`)
                  toast.success('CSV exported')
                }}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export CSV
              </button>
              {stmtType === 'property' && (
                <button
                  onClick={async () => {
                    try {
                      await statementsApi.downloadPropertyReport(selectedId, fromDate, toDate)
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
              )}
            </div>
          ) : undefined
        }
      />

      <div className="flex-1 space-y-6 p-4 sm:p-6">
        {/* Statement Type Toggle */}
        <div className="rounded-xl border bg-card p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setStmtType('property'); setSelectedId('') }}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  stmtType === 'property'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'border bg-background text-muted-foreground hover:bg-muted'
                }`}
              >
                <Building2 className="h-4 w-4" />
                Property Statement
              </button>
              <button
                type="button"
                onClick={() => { setStmtType('customer'); setSelectedId('') }}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  stmtType === 'customer'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'border bg-background text-muted-foreground hover:bg-muted'
                }`}
              >
                <Users className="h-4 w-4" />
                Customer Statement
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium">
                  {stmtType === 'property' ? 'Property' : 'Customer'}
                </label>
                <SearchableSelect
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  placeholder={`Select ${stmtType === 'property' ? 'property' : 'customer'}`}
                  options={options.map((item: any) => ({
                    label: stmtType === 'property' ? `${item.code} — ${item.title || 'Untitled'}` : (item.fullName || item.code || 'Unnamed Customer'),
                    value: item.id
                  }))}
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
        </div>

        {/* Results */}
        {!selectedId ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
            <ScrollText className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Generate a Statement</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Select a {stmtType} and optionally set a date range to generate a financial statement
            </p>
          </div>
        ) : isLoading || isFetching ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Statement Summary */}
            {summaryData && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {summaryData.totalInvoiced !== undefined && (
                  <div className="rounded-xl border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Total Invoiced</p>
                    <p className="mt-1 text-xl font-bold">{formatCurrency(Number(summaryData.totalInvoiced))}</p>
                  </div>
                )}
                {summaryData.totalReceived !== undefined && (
                  <div className="rounded-xl border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Total Received</p>
                    <p className="mt-1 text-xl font-bold text-green-700">{formatCurrency(Number(summaryData.totalReceived))}</p>
                  </div>
                )}
                {summaryData.outstanding !== undefined && (
                  <div className="rounded-xl border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Outstanding</p>
                    <p className="mt-1 text-xl font-bold text-red-700">{formatCurrency(Number(summaryData.outstanding))}</p>
                  </div>
                )}
                {summaryData.balance !== undefined && (
                  <div className="rounded-xl border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Net Balance</p>
                    <p className="mt-1 text-xl font-bold">{formatCurrency(Number(summaryData.balance))}</p>
                  </div>
                )}
              </div>
            )}

            {/* Statement Entries */}
            {entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12">
                <ScrollText className="h-10 w-10 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">No transactions found for the selected period</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden overflow-x-auto rounded-xl border bg-card sm:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Debit</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Credit</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry: any, idx: number) => (
                        <tr key={entry.id || idx} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-3 whitespace-nowrap">{formatDate(entry.date || entry.createdAt)}</td>
                          <td className="px-4 py-3">{entry.description || entry.code || '—'}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">
                              {entry.type || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-red-600">
                            {entry.debit ? formatCurrency(Number(entry.debit)) : '—'}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-green-600">
                            {entry.credit ? formatCurrency(Number(entry.credit)) : '—'}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {entry.balance !== undefined ? formatCurrency(Number(entry.balance)) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="space-y-3 sm:hidden">
                  {entries.map((entry: any, idx: number) => (
                    <div key={entry.id || idx} className="rounded-xl border bg-card p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">
                            {entry.type || 'N/A'}
                          </span>
                          <p className="mt-1.5 text-sm text-muted-foreground">{entry.description || entry.code || '—'}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDate(entry.date || entry.createdAt)}</span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-[11px] text-muted-foreground">Debit</p>
                          <p className="text-sm font-medium text-red-600">{entry.debit ? formatCurrency(Number(entry.debit)) : '—'}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-muted-foreground">Credit</p>
                          <p className="text-sm font-medium text-green-600">{entry.credit ? formatCurrency(Number(entry.credit)) : '—'}</p>
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
          </>
        )}
      </div>
    </div>
  )
}

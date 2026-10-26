import os

path = '/home/sheheryar-sohail/Downloads/Property-Management-System-test/apps/web/src/app/(dashboard)/transfers/page.tsx'
content = """'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { transfersApi, receiptsApi } from '@/lib/api'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { ArrowLeftRight, Search, Plus, FileText, Receipt, Printer, ExternalLink } from 'lucide-react'
import { SearchableSelect } from '@/components/SearchableSelect'
import { toast } from 'sonner'
import Link from 'next/link'

type TransferListItem = {
  id: string
  property?: { code?: string | null; title?: string | null } | null
  fromCustomer?: { fullName?: string | null } | null
  toCustomer?: { fullName?: string | null } | null
  status: string
  transferDate: string
  transferFee?: number | null
  receiptId?: string | null
  receipt?: { id: string; code?: string | null; amount?: number | null } | null
  approvedAt?: string | null
  notes?: string | null
}

export default function TransfersPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data: transfers = [], isLoading } = useQuery<TransferListItem[]>({
    queryKey: ['transfers', search, statusFilter],
    queryFn: () => transfersApi.list({ search, status: statusFilter !== 'all' ? statusFilter : undefined }),
  })

  const filteredTransfers = transfers

  return (
    <div className="flex flex-col">
      <Header title="Property Transfers" />

      <div className="flex-1 space-y-4 p-4 sm:space-y-6 sm:p-6">
        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search transfers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-lg border bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <SearchableSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              isSearchable={false}
              className="w-40"
              options={[
                { label: 'All Status', value: 'all' },
                { label: 'Draft', value: 'DRAFT' },
                { label: 'Submitted', value: 'SUBMITTED' },
                { label: 'Approved', value: 'APPROVED' },
                { label: 'Rejected', value: 'REJECTED' },
              ]}
            />
          </div>

          <Link
            href="/transfers/new"
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Transfer
          </Link>
        </div>

        {/* Transfers List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl border bg-card sm:h-32" />
            ))}
          </div>
        ) : filteredTransfers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
            <ArrowLeftRight className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No transfers found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Execute a new transfer to transfer plot ownership and generate legal forms.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransfers.map((transfer) => {
              const feeAmount = transfer.transferFee && Number(transfer.transferFee) > 0 ? Number(transfer.transferFee) : null
              const receiptId = transfer.receipt?.id || transfer.receiptId

              return (
                <div
                  key={transfer.id}
                  className="rounded-xl border bg-card p-4 transition-shadow hover:shadow-md sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/transfers/${transfer.id}`}
                          className="font-bold text-base hover:underline text-foreground"
                        >
                          {transfer.property?.code}
                        </Link>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusColor(transfer.status)}`}>
                          {transfer.status}
                        </span>
                        {feePaidBadge(feeAmount, transfer.receipt?.code)}
                      </div>

                      {transfer.property?.title && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {transfer.property.title}
                        </p>
                      )}

                      <div className="mt-2.5 flex flex-col gap-1.5 text-sm sm:flex-row sm:items-center sm:gap-4">
                        <span className="text-muted-foreground">
                          Seller: <span className="font-semibold text-foreground">{(transfer as any).from?.fullName || transfer.fromCustomer?.fullName || 'N/A'}</span>
                        </span>
                        <ArrowLeftRight className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
                        <span className="text-muted-foreground">
                          Buyer: <span className="font-semibold text-foreground">{(transfer as any).to?.fullName || transfer.toCustomer?.fullName || 'N/A'}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end justify-between text-xs sm:text-right">
                      <span className="text-muted-foreground">Date: {formatDate(transfer.transferDate)}</span>
                      {transfer.approvedAt && (
                        <span className="text-muted-foreground text-[11px] mt-0.5">
                          Approved: {formatDate(transfer.approvedAt)}
                        </span>
                      )}

                      {/* Quick Document Links */}
                      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                        <Link
                          href={`/print/transfer-form/${transfer.id}`}
                          title="Print Transfer Form"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border bg-white text-[11px] font-semibold text-neutral-800 hover:bg-neutral-100 shadow-xs"
                        >
                          <FileText className="w-3 h-3 text-neutral-600" />
                          Form
                        </Link>

                        <Link
                          href={`/print/transfer-letter/${transfer.id}`}
                          title="Print Transfer Letter"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border bg-white text-[11px] font-semibold text-neutral-800 hover:bg-neutral-100 shadow-xs"
                        >
                          <FileText className="w-3 h-3 text-neutral-600" />
                          Letter
                        </Link>

                        {receiptId && (
                          <button
                            type="button"
                            title="Download Transfer Fee Receipt"
                            onClick={() => {
                              receiptsApi.downloadPdf(receiptId).catch((err: any) =>
                                toast.error(err.message || 'Download failed')
                              )
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 shadow-xs"
                          >
                            <Receipt className="w-3 h-3 text-emerald-600" />
                            Receipt
                          </button>
                        )}

                        <Link
                          href={`/transfers/${transfer.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-900 text-white text-[11px] font-semibold hover:bg-black"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </div>

                  {transfer.notes && (
                    <p className="mt-2.5 truncate text-xs text-muted-foreground">{transfer.notes}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {!isLoading && filteredTransfers.length > 0 && (
          <div className="flex items-center justify-between rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredTransfers.length} transfers
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function feePaidBadge(feeAmount: number | null, receiptCode?: string | null) {
  if (!feeAmount) return null
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800">
      <Receipt className="w-3 h-3 text-emerald-700" />
      PKR {feeAmount.toLocaleString()}
      {receiptCode ? ` • ${receiptCode}` : ''}
    </span>
  )
}
"""

with open(path, 'w') as f:
    f.write(content)
print("Updated", path)

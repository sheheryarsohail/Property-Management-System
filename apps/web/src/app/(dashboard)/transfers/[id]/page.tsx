'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowLeftRight, ClipboardList, Loader2, Printer, FileText, Receipt, CheckCircle2, Download } from 'lucide-react'
import { toast } from 'sonner'

import { Header } from '@/components/layout/header'
import { formatDate, formatCurrency } from '@/lib/utils'
import { transfersApi, receiptsApi } from '@/lib/api'

const statusBadgeColor: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
}

type TransferDetail = {
  id: string
  status: string
  transferType: string
  transferDate: string
  transferFee?: number | null
  receiptId?: string | null
  receipt?: {
    id: string
    code?: string | null
    amount?: number | null
    method?: string | null
    receivedAt?: string | null
  } | null
  notes?: string | null
  adminOverride?: boolean
  adminOverrideReason?: string | null
  duesCleared?: boolean
  property?: {
    id: string
    code?: string | null
    title?: string | null
    type?: string | null
    block?: string | null
    sizeSqYd?: number | null
  } | null
  from?: {
    id: string
    fullName?: string | null
    code?: string | null
    phone?: string | null
    mobile?: string | null
    email?: string | null
    nationalId?: string | null
    address?: string | null
  } | null
  to?: {
    id: string
    fullName?: string | null
    code?: string | null
    phone?: string | null
    mobile?: string | null
    email?: string | null
    nationalId?: string | null
    address?: string | null
  } | null
}

export default function TransferDetailPage() {
  const params = useParams<{ id: string }>()
  const transferId = params?.id ?? ''
  const router = useRouter()
  const queryClient = useQueryClient()

  const {
    data: transfer,
    isLoading,
    isError,
  } = useQuery<TransferDetail>({
    queryKey: ['transfer', transferId],
    enabled: Boolean(transferId),
    queryFn: () => transfersApi.get(transferId),
  })

  const approveMutation = useMutation({
    mutationFn: () => transfersApi.approve(transferId),
    onSuccess: () => {
      toast.success('Transfer approved and ownership updated!')
      queryClient.invalidateQueries({ queryKey: ['transfers'] })
      queryClient.invalidateQueries({ queryKey: ['transfer', transferId] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to approve transfer')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: () => transfersApi.reject(transferId),
    onSuccess: () => {
      toast.success('Transfer rejected')
      queryClient.invalidateQueries({ queryKey: ['transfers'] })
      queryClient.invalidateQueries({ queryKey: ['transfer', transferId] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to reject transfer')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => transfersApi.delete(transferId),
    onSuccess: () => {
      toast.success('Transfer deleted')
      queryClient.invalidateQueries({ queryKey: ['transfers'] })
      router.push('/transfers')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete transfer')
    },
  })

  const isApproving = approveMutation.isPending
  const isRejecting = rejectMutation.isPending
  const isDeleting = deleteMutation.isPending

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this transfer record?')) {
      deleteMutation.mutate()
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <Header title="Transfer Details" />
        <div className="flex-1 p-6">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center justify-center rounded-lg border bg-card p-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isError || !transfer) {
    return (
      <div className="flex flex-col">
        <Header title="Transfer Details" />
        <div className="flex-1 p-6">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-sm text-muted-foreground">Transfer not found.</p>
              <Link href="/transfers" className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline">
                <ArrowLeft className="h-4 w-4" />
                Back to Transfers
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const badgeStyles = statusBadgeColor[transfer.status] || 'bg-muted text-muted-foreground'
  const feePaid = transfer.transferFee && Number(transfer.transferFee) > 0
  const receiptId = transfer.receipt?.id || transfer.receiptId

  return (
    <div className="flex flex-col">
      <Header title={`Transfer ${transfer.property?.code ?? ''}`} />

      <div className="flex-1 space-y-6 p-6 max-w-5xl mx-auto w-full">
        {/* Navigation & Action Controls Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/transfers"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Transfers
          </Link>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Print Transfer Form */}
            <Link
              href={`/print/transfer-form/${transfer.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 shadow-sm transition"
            >
              <FileText className="h-3.5 w-3.5 text-neutral-600" />
              Print Transfer Form
            </Link>

            {/* 2. Print Transfer Letter */}
            <Link
              href={`/print/transfer-letter/${transfer.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 shadow-sm transition"
            >
              <FileText className="h-3.5 w-3.5 text-neutral-600" />
              Print Transfer Letter
            </Link>

            {/* 3. Transfer Fee Receipt */}
            {feePaid && receiptId && (
              <button
                type="button"
                onClick={() => {
                  receiptsApi.downloadPdf(receiptId).catch((err: any) =>
                    toast.error(err.message || 'Download failed')
                  )
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 shadow-sm transition"
              >
                <Download className="h-3.5 w-3.5 text-emerald-600" />
                Fee Receipt PDF
              </button>
            )}

            {/* If transfer is in DRAFT or SUBMITTED, direct 1-click execution */}
            {['DRAFT', 'SUBMITTED'].includes(transfer.status) && (
              <>
                <button
                  type="button"
                  disabled={isApproving}
                  onClick={() => approveMutation.mutate()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 shadow-sm"
                >
                  {isApproving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Approve & Complete Transfer
                </button>
                <button
                  type="button"
                  disabled={isRejecting}
                  onClick={() => rejectMutation.mutate()}
                  className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                >
                  {isRejecting && <Loader2 className="h-3 w-3 animate-spin" />}
                  Reject
                </button>
              </>
            )}

            {['DRAFT', 'REJECTED'].includes(transfer.status) && (
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/50 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="h-3 w-3 animate-spin" />}
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Section 1: Main Header & Property Overview */}
        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black">{transfer.property?.code}</h1>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${badgeStyles}`}>
                  {transfer.status}
                </span>
              </div>
              {transfer.property?.title && (
                <p className="mt-1 text-sm text-muted-foreground">{transfer.property?.title}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {transfer.property?.type} {transfer.property?.sizeSqYd ? `• ${transfer.property.sizeSqYd} Sq. Yds.` : ''}
              </p>
            </div>

            <div className="sm:text-right text-sm">
              <p className="text-muted-foreground">Transfer Date</p>
              <p className="font-bold text-base">{formatDate(transfer.transferDate)}</p>
              {transfer.status === 'APPROVED' && (
                <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ownership Handover Complete
                </span>
              )}
            </div>
          </div>

          {/* Seller & Buyer Grid */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-muted/20 p-5 text-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Seller (Previous Owner)</h2>
              <div className="mt-3 space-y-1.5">
                <p className="font-bold text-base text-foreground">{transfer.from?.fullName || 'N/A'}</p>
                {transfer.from?.code && <p className="text-xs text-muted-foreground font-mono">ID: {transfer.from.code}</p>}
                {transfer.from?.nationalId && <p className="text-xs text-muted-foreground">CNIC: {transfer.from.nationalId}</p>}
                {(transfer.from?.phone || transfer.from?.mobile) && <p className="text-xs text-muted-foreground">Contact: {transfer.from.phone || transfer.from.mobile}</p>}
                {transfer.from?.address && <p className="text-xs text-muted-foreground line-clamp-2">Address: {transfer.from.address}</p>}
              </div>
            </div>

            <div className="rounded-xl border bg-emerald-50/20 border-emerald-200/50 p-5 text-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Buyer (New Owner)</h2>
              <div className="mt-3 space-y-1.5">
                <p className="font-bold text-base text-foreground">{transfer.to?.fullName || 'N/A'}</p>
                {transfer.to?.code && <p className="text-xs text-muted-foreground font-mono">ID: {transfer.to.code}</p>}
                {transfer.to?.nationalId && <p className="text-xs text-muted-foreground">CNIC: {transfer.to.nationalId}</p>}
                {(transfer.to?.phone || transfer.to?.mobile) && <p className="text-xs text-muted-foreground">Contact: {transfer.to.phone || transfer.to.mobile}</p>}
                {transfer.to?.address && <p className="text-xs text-muted-foreground line-clamp-2">Address: {transfer.to.address}</p>}
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Transfer Fee & Financials */}
        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between border-b pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-neutral-700" />
              <h2 className="text-base font-bold">Transfer Fee & Receipt</h2>
            </div>
            {feePaid && receiptId && (
              <button
                onClick={() => {
                  receiptsApi.downloadPdf(receiptId).catch((err: any) =>
                    toast.error(err.message || 'Download failed')
                  )
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900"
              >
                <Download className="w-3.5 h-3.5" /> Download Receipt PDF
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground font-medium">Transfer Fee</dt>
              <dd className="font-bold text-lg text-foreground mt-0.5">
                {feePaid ? `PKR ${Number(transfer.transferFee).toLocaleString()}` : 'None (PKR 0)'}
              </dd>
            </div>

            <div>
              <dt className="text-xs text-muted-foreground font-medium">Receipt Code</dt>
              <dd className="font-mono font-bold text-foreground mt-0.5">
                {transfer.receipt?.code || (receiptId ? 'Generated' : 'No Receipt')}
              </dd>
            </div>

            <div>
              <dt className="text-xs text-muted-foreground font-medium">Payment Method</dt>
              <dd className="font-medium text-foreground mt-0.5">
                {transfer.receipt?.method || 'N/A'}
              </dd>
            </div>
          </div>
        </section>

        {/* Section 3: Supporting Details */}
        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between border-b pb-3 mb-4">
            <div>
              <h2 className="text-base font-bold">Transfer Specifications</h2>
              <p className="text-xs text-muted-foreground">
                Technical records and clearance status.
              </p>
            </div>
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
          </div>

          <dl className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Transfer Type</dt>
              <dd className="font-bold capitalize">{transfer.transferType?.toLowerCase()}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Dues Cleared</dt>
              <dd className="font-bold">{transfer.duesCleared ? 'Yes' : 'No'}</dd>
            </div>
          </dl>
        </section>

        {transfer.notes && (
          <section className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-base font-bold mb-2">Notes & Remarks</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{transfer.notes}</p>
          </section>
        )}
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Calendar, ClipboardList, Download, FileWarning, Loader2 } from 'lucide-react'

import { Header } from '@/components/layout/header'
import { paymentPlansApi } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'

type PlanInstallment = {
  id: string
  seq: number
  dueDate: string
  amount: number
  invoice?: {
    id: string
    code: string
    status: string
    paid: number
    total: number
  } | null
}

type PaymentPlanDetail = {
  id: string
  title: string
  propertyId: string
  totalAmount: number
  currency: string
  startDate: string
  expectedTerms: number
  createdAt: string
  property?: {
    id: string
    code?: string | null
    title?: string | null
  } | null
  installments: PlanInstallment[]
}

export default function PaymentPlanDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ''

  const {
    data: plan,
    isLoading,
    isError,
  } = useQuery<PaymentPlanDetail>({
    queryKey: ['payment-plan', id],
    enabled: Boolean(id),
    queryFn: () => paymentPlansApi.get(id),
  })

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <Header title="Payment Plan" />
        <div className="flex-1 p-6">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center justify-center rounded-lg border bg-card p-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isError || !plan) {
    return (
      <div className="flex flex-col">
        <Header title="Payment Plan" />
        <div className="flex-1 p-6">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-lg border border-dashed p-12 text-center">
              <FileWarning className="mx-auto h-12 w-12 text-muted-foreground" />
              <h2 className="mt-4 text-lg font-semibold">Payment plan not found</h2>
              <Link
                href="/payment-plans"
                className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Payment Plans
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const installments = plan.installments ?? []

  const totalPaid = installments.reduce((sum, installment) => {
    if (installment.invoice?.status === 'VOID') return sum
    const paid = installment.invoice?.paid ?? 0
    return sum + Number(paid)
  }, 0)

  const totalGeneratedAmount = installments.reduce((sum, installment) => {
    if (installment.invoice?.status === 'VOID') return sum
    return sum + (installment.invoice ? Number(installment.invoice.total) : 0)
  }, 0)

  const outstanding = totalGeneratedAmount - totalPaid

  return (
    <div className="flex flex-col">
      <Header title={plan.title} />

      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Link
            href="/payment-plans"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Payment Plans
          </Link>

        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold">Plan Details</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Property</p>
                <p className="font-medium">
                  {plan.property?.code || 'N/A'}{' '}
                  {plan.property?.title ? `— ${plan.property?.title}` : ''}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Start Date</p>
                <p className="font-medium">{formatDate(plan.startDate)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Expected Terms</p>
                <p className="font-medium">{plan.expectedTerms}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Amount</p>
                <p className="text-xl font-bold">{formatCurrency(Number(plan.totalAmount))}</p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold">Invoice Summary</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Generated Invoices Amount</p>
                <p className="font-medium">{formatCurrency(totalGeneratedAmount)}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Paid</p>
                <p className="font-medium text-green-600">{formatCurrency(totalPaid)}</p>
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <p className="font-semibold">Outstanding</p>
                <p className={`text-lg font-bold ${outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(outstanding)}
                </p>
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-lg border bg-card">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold">Installments</h2>
              <p className="text-sm text-muted-foreground">
                A total of {plan.installments.length} installments were generated for this plan.
              </p>
            </div>
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Due Date</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-left">Invoice</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {plan.installments.map((installment) => {
                  const invoice = installment.invoice
                  const typeLabel = (installment as any).type === 'BOOKING' || (invoice as any)?.type === 'BOOKING'
                    ? 'Booking'
                    : (installment as any).type === 'CONFIRMATION' || (invoice as any)?.type === 'CONFIRMATION' || (installment as any).type === 'HALF_YEARLY' || (invoice as any)?.type === 'HALF_YEARLY'
                    ? 'Confirmation'
                    : 'Installment'
                  const typeBadgeClass = typeLabel === 'Booking'
                    ? 'bg-blue-100 text-blue-700'
                    : typeLabel === 'Confirmation'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-slate-100 text-slate-700'

                  return (
                    <tr key={installment.id} className="hover:bg-muted/40">
                      <td className="px-4 py-3 font-medium">{installment.seq}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${typeBadgeClass}`}>
                          {typeLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(installment.dueDate)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(Number(installment.amount))}
                      </td>
                      <td className="px-4 py-3">
                        {invoice ? (
                          <span className="font-medium text-foreground">
                            {invoice.code}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Not generated (pending booking/confirmation)</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {invoice ? (
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium uppercase ${
                            invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                            invoice.status === 'PARTIAL' ? 'bg-amber-100 text-amber-700' :
                            invoice.status === 'VOID' ? 'bg-slate-100 text-slate-500 line-through' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {invoice.status}
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
                            Waiting
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {invoice ? formatCurrency(Number(invoice.paid ?? 0)) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

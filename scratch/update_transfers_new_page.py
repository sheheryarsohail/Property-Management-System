import os

path = '/home/sheheryar-sohail/Downloads/Property-Management-System-test/apps/web/src/app/(dashboard)/transfers/new/page.tsx'
content = """'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, CheckCircle2, Printer, FileText, Receipt, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

import { Header } from '@/components/layout/header'
import { SearchableSelect } from '@/components/SearchableSelect'
import { customersApi, propertiesApi, transfersApi, receiptsApi } from '@/lib/api'
import { DatePicker } from '@/components/DatePicker'

const transferSchema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  fromCustomerId: z.string().min(1, 'Current owner is required'),
  toCustomerId: z.string().min(1, 'New owner is required'),
  transferType: z.enum(['SALE', 'GIFT', 'INHERITANCE', 'INTERNAL'], {
    required_error: 'Transfer type is required',
  }),
  transferDate: z.string().min(1, 'Transfer date is required'),
  transferFee: z.coerce.number().optional().nullable(),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'ONLINE', 'PDC', 'CARD']).optional(),
  bankName: z.string().optional(),
  chequeNumber: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

type TransferFormValues = z.infer<typeof transferSchema>

type SelectOption = {
  id: string
  label: string
  value: string
  subtitle?: string
  currentOwnerId?: string
}

export default function NewTransferPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [createdTransfer, setCreatedTransfer] = useState<any>(null)

  const { data: properties = [] } = useQuery<SelectOption[]>({
    queryKey: ['properties', 'options', 'transfers', 'assigned'],
    queryFn: async () => {
      const data = await propertiesApi.list({ assigned: true })
      return (data || []).map((property: any) => {
        const activeOwnership =
          property.ownerships?.find((ownership: any) => !ownership.endDate) ||
          property.ownerships?.[0]
        const ownerName = activeOwnership?.customer?.fullName?.trim()
        const ownerCode = activeOwnership?.customer?.code?.trim()

        return {
          id: property.id,
          label: property.code,
          value: property.id,
          subtitle: ownerName ? `${ownerName}${ownerCode ? ` (${ownerCode})` : ''}` : 'No active owner',
          currentOwnerId: activeOwnership?.customerId,
        }
      })
    },
  })

  const { data: customers = [] } = useQuery<SelectOption[]>({
    queryKey: ['customers', 'options', 'transfers'],
    queryFn: async () => {
      const data = await customersApi.list()
      return (data || []).map((customer: any) => ({
        id: customer.id,
        label: customer.fullName?.trim() || 'Unnamed Customer',
        value: customer.id,
        subtitle: customer.code || customer.nationalId || undefined,
      }))
    },
  })

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      propertyId: '',
      fromCustomerId: '',
      toCustomerId: '',
      transferType: 'SALE',
      transferDate: new Date().toISOString().split('T')[0],
      transferFee: null,
      paymentMethod: 'CASH',
      bankName: '',
      chequeNumber: '',
      reference: '',
      notes: '',
    },
  })

  const selectedProperty = form.watch('propertyId')
  const fromCustomerId = form.watch('fromCustomerId')
  const toCustomerId = form.watch('toCustomerId')
  const transferFee = form.watch('transferFee')
  const paymentMethod = form.watch('paymentMethod')

  // Prevent selecting the same customer in both fields
  const customerOptions = useMemo(() => {
    return customers.map((customer) => ({
      ...customer,
      disabled: customer.id === fromCustomerId || customer.id === toCustomerId,
    }))
  }, [customers, fromCustomerId, toCustomerId])

  const createMutation = useMutation({
    mutationFn: (values: TransferFormValues) => {
      const payload: any = {
        ...values,
        autoExecute: true, // Seamless 1-step transfer execution
      }
      if (values.transferFee && Number(values.transferFee) > 0) {
        payload.transferFee = Number(values.transferFee)
      } else {
        delete payload.transferFee
      }
      return transfersApi.create(payload)
    },
    onSuccess: (created) => {
      toast.success('Property transferred successfully!')
      queryClient.invalidateQueries({ queryKey: ['transfers'] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      queryClient.invalidateQueries({ queryKey: ['receipts'] })
      setCreatedTransfer(created)
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to execute transfer')
    },
  })

  const onSubmit = (values: TransferFormValues) => {
    createMutation.mutate(values)
  }

  const isSubmitting = createMutation.isPending

  // SUCCESS COMPLETION SCREEN WITH IMMEDIATE DOCUMENT PRINT OPTIONS
  if (createdTransfer) {
    const feePaid = createdTransfer.transferFee && Number(createdTransfer.transferFee) > 0

    return (
      <div className="flex flex-col">
        <Header title="Transfer Completed" />

        <div className="flex-1 p-6">
          <div className="mx-auto max-w-2xl bg-card border rounded-2xl p-8 shadow-sm text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-5">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className="text-2xl font-black text-foreground">Transfer Executed Successfully</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              Ownership of <strong>{createdTransfer.property?.code}</strong> has been transferred from{' '}
              <strong>{createdTransfer.from?.fullName || 'Previous Owner'}</strong> to{' '}
              <strong>{createdTransfer.to?.fullName || 'New Owner'}</strong>.
            </p>

            {feePaid && (
              <div className="mt-4 p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl inline-flex items-center gap-2 text-xs font-semibold text-emerald-800">
                <Receipt className="w-4 h-4 text-emerald-600" />
                Transfer Fee of PKR {Number(createdTransfer.transferFee).toLocaleString()} recorded
                {createdTransfer.receipt?.code ? ` (${createdTransfer.receipt.code})` : ''}
              </div>
            )}

            {/* Document Generation & Print Section */}
            <div className="mt-8 border-t pt-6 text-left">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 text-center">
                Print Official Transfer Documents
              </h3>

              <div className="grid gap-3 sm:grid-cols-2">
                {/* 1. Transfer Form */}
                <Link
                  href={`/print/transfer-form/${createdTransfer.id}`}
                  className="flex items-center justify-between p-4 rounded-xl border bg-background hover:border-neutral-900 transition hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">Transfer Form</h4>
                      <p className="text-xs text-muted-foreground">Buyer & Seller Agreement</p>
                    </div>
                  </div>
                  <Printer className="w-4 h-4 text-muted-foreground" />
                </Link>

                {/* 2. Transfer Letter */}
                <Link
                  href={`/print/transfer-letter/${createdTransfer.id}`}
                  className="flex items-center justify-between p-4 rounded-xl border bg-background hover:border-neutral-900 transition hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">Transfer Letter</h4>
                      <p className="text-xs text-muted-foreground">Allottee Application Form</p>
                    </div>
                  </div>
                  <Printer className="w-4 h-4 text-muted-foreground" />
                </Link>

                {/* 3. Transfer Fee Receipt (if fee collected) */}
                {feePaid && createdTransfer.receipt?.id && (
                  <button
                    type="button"
                    onClick={() => {
                      receiptsApi.downloadPdf(createdTransfer.receipt.id).catch((err: any) =>
                        toast.error(err.message || 'Download failed')
                      )
                    }}
                    className="sm:col-span-2 flex items-center justify-between p-4 rounded-xl border bg-emerald-50/30 border-emerald-200 hover:border-emerald-600 transition hover:shadow-sm text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-emerald-950">Transfer Fee Receipt</h4>
                        <p className="text-xs text-emerald-700">
                          {createdTransfer.receipt?.code || 'Official Receipt'} — PKR {Number(createdTransfer.transferFee).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      Download PDF <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                )}
              </div>
            </div>

            <div className="mt-8 flex items-center justify-center gap-4">
              <Link
                href="/transfers"
                className="px-5 py-2.5 rounded-xl border text-sm font-medium hover:bg-accent"
              >
                Back to Transfers
              </Link>
              <Link
                href={`/transfers/${createdTransfer.id}`}
                className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-black shadow-sm"
              >
                View Transfer Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <Header title="New Property Transfer" />

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/transfers"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Transfers
          </Link>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Section 1: Property & Parties */}
            <section className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-bold">Transfer Details</h2>
              <p className="text-xs text-muted-foreground mt-0.5 mb-4">
                Select the property and ownership will be transferred immediately upon execution.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium">Property / Plot</label>
                  <SearchableSelect
                    options={properties}
                    value={selectedProperty}
                    onChange={(e) => {
                      const val = e.target.value
                      form.setValue('propertyId', val, { shouldValidate: true })
                      const prop = properties.find((p) => p.value === val)
                      if (prop?.currentOwnerId) {
                        form.setValue('fromCustomerId', prop.currentOwnerId, { shouldValidate: true })
                      }
                    }}
                    placeholder="Search and select property..."
                  />
                  {form.formState.errors.propertyId && (
                    <p className="mt-1 text-xs text-red-500">{form.formState.errors.propertyId.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">From (Seller / Current Owner)</label>
                  <SearchableSelect
                    {...form.register('fromCustomerId')}
                    value={form.watch('fromCustomerId')}
                    placeholder="Select customer"
                    options={customerOptions.map((customer) => ({
                      label: `${customer.label}${customer.subtitle ? ` — ${customer.subtitle}` : ''}`,
                      value: customer.id,
                      isDisabled: customer.disabled,
                    }))}
                  />
                  {form.formState.errors.fromCustomerId && (
                    <p className="mt-1 text-xs text-red-500">{form.formState.errors.fromCustomerId.message}</p>
                  )}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-sm font-medium">To (Buyer / New Owner)</label>
                    <Link href="/customers/new" className="text-xs text-primary hover:underline">
                      + Add new customer
                    </Link>
                  </div>
                  <SearchableSelect
                    {...form.register('toCustomerId')}
                    value={form.watch('toCustomerId')}
                    placeholder="Select customer"
                    options={customerOptions.map((customer) => ({
                      label: `${customer.label}${customer.subtitle ? ` — ${customer.subtitle}` : ''}`,
                      value: customer.id,
                      isDisabled: customer.disabled,
                    }))}
                  />
                  {form.formState.errors.toCustomerId && (
                    <p className="mt-1 text-xs text-red-500">{form.formState.errors.toCustomerId.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Transfer Type</label>
                  <SearchableSelect
                    {...form.register('transferType')}
                    value={form.watch('transferType')}
                    isSearchable={false}
                    options={[
                      { label: 'Sale', value: 'SALE' },
                      { label: 'Gift', value: 'GIFT' },
                      { label: 'Inheritance', value: 'INHERITANCE' },
                      { label: 'Internal', value: 'INTERNAL' },
                    ]}
                  />
                  {form.formState.errors.transferType && (
                    <p className="mt-1 text-xs text-red-500">{form.formState.errors.transferType.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Transfer Date</label>
                  <DatePicker
                    type="date"
                    {...form.register('transferDate')}
                    value={form.watch('transferDate')}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {form.formState.errors.transferDate && (
                    <p className="mt-1 text-xs text-red-500">{form.formState.errors.transferDate.message}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Section 2: Optional Transfer Fee */}
            <section className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold">Transfer Fee (Optional)</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    If a transfer fee is charged, entering it will automatically issue an official receipt.
                  </p>
                </div>
                <Receipt className="w-5 h-5 text-muted-foreground" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Transfer Fee (PKR)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 50000 (leave blank if none)"
                    {...form.register('transferFee')}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {transferFee && Number(transferFee) > 0 ? (
                  <div>
                    <label className="mb-2 block text-sm font-medium">Payment Mode</label>
                    <SearchableSelect
                      {...form.register('paymentMethod')}
                      value={form.watch('paymentMethod')}
                      isSearchable={false}
                      options={[
                        { label: 'Cash', value: 'CASH' },
                        { label: 'Bank Transfer', value: 'BANK_TRANSFER' },
                        { label: 'Online', value: 'ONLINE' },
                        { label: 'Cheque / PDC', value: 'PDC' },
                        { label: 'Card', value: 'CARD' },
                      ]}
                    />
                  </div>
                ) : (
                  <div className="flex items-center text-xs text-muted-foreground italic pt-8">
                    No transfer fee will be billed or receipted.
                  </div>
                )}

                {transferFee && Number(transferFee) > 0 && (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-medium">Bank Name (if applicable)</label>
                      <input
                        type="text"
                        placeholder="e.g. Meezan Bank, HBL"
                        {...form.register('bankName')}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">Cheque # / Slip # / Reference</label>
                      <input
                        type="text"
                        placeholder="e.g. CHQ-98124 or Ref #"
                        {...form.register('chequeNumber')}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Section 3: Notes */}
            <section className="rounded-xl border bg-card p-6 shadow-sm">
              <label className="mb-2 block text-sm font-medium">Notes & Remarks</label>
              <textarea
                rows={3}
                {...form.register('notes')}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Additional notes for transfer record..."
              />
            </section>

            <div className="flex items-center justify-end gap-3">
              <Link
                href="/transfers"
                className="rounded-xl border px-5 py-2.5 text-sm font-medium hover:bg-accent"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 shadow-sm"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Executing Transfer...' : 'Complete Transfer & Generate Documents'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
"""

with open(path, 'w') as f:
    f.write(content)
print("Updated", path)

'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Header } from '@/components/layout/header'
import { customersApi, invoicesApi, propertiesApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { DatePicker } from '@/components/DatePicker'
import { SearchableSelect } from '@/components/SearchableSelect'

const invoiceSchema = z.object({
  customerId: z.string({ required_error: 'Customer is required' }),
  propertyId: z.string({ required_error: 'Property is required' }),
  type: z.string().nonempty('Invoice type is required'),
  issueDate: z.string().nonempty('Issue date is required'),
  dueDate: z.string().nonempty('Due date is required'),
  subtotal: z
    .string()
    .min(1, 'Subtotal is required')
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount'),
  tax: z
    .string()
    .optional()
    .refine((value) => !value || /^\d+(\.\d{1,2})?$/.test(value), {
      message: 'Enter a valid amount',
    }),
  notes: z.string().optional(),
})

type InvoiceFormValues = z.infer<typeof invoiceSchema>

type SelectOption = {
  id: string
  label: string
  subtitle?: string
}

export default function NewInvoicePage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: customers = [] } = useQuery<SelectOption[]>({
    queryKey: ['customers', 'select-options'],
    queryFn: async () => {
      const list = await customersApi.list()
      return Array.isArray(list)
        ? list.map((customer: any) => ({
            id: customer.id,
            label: customer.fullName || customer.code || 'Unnamed Customer',
          }))
        : []
    },
  })

  const { data: properties = [] } = useQuery<SelectOption[]>({
    queryKey: ['properties', 'select-options'],
    queryFn: async () => {
      const list = await propertiesApi.list()
      return Array.isArray(list)
        ? list.map((property: any) => ({
            id: property.id,
            label: property.code,
            subtitle: property.title,
          }))
        : []
    },
  })

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: '',
      propertyId: '',
      type: 'INSTALLMENT',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      subtotal: '',
      tax: '0',
      notes: '',
    },
  })

  const [showPreview, setShowPreview] = useState(false)
  const [previewValues, setPreviewValues] = useState<InvoiceFormValues | null>(null)

  const subtotal = Number(form.watch('subtotal') || 0)
  const tax = Number(form.watch('tax') || 0)

  const total = useMemo(() => subtotal + tax, [subtotal, tax])

  const createMutation = useMutation({
    mutationFn: (values: InvoiceFormValues) =>
      invoicesApi.create({
        customerId: values.customerId,
        propertyId: values.propertyId,
        type: values.type,
        issueDate: values.issueDate,
        dueDate: values.dueDate,
        subtotal: Number(values.subtotal),
        tax: Number(values.tax || 0),
        notes: values.notes,
      }),
    onSuccess: (created) => {
      toast.success('Invoice created successfully')
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      if (created?.id) {
        router.push(`/invoices/${created.id}`)
      } else {
        router.push('/invoices')
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create invoice')
    },
  })

  const onSubmit = (values: InvoiceFormValues) => {
    setPreviewValues(values)
    setShowPreview(true)
  }

  const handleConfirmSubmit = () => {
    if (previewValues) {
      createMutation.mutate(previewValues)
    }
  }

  return (
    <div className="flex flex-col">
      <Header title="Create Invoice" />

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/invoices"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Invoices
          </Link>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <section className="rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">Details</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Customer</label>
                  <SearchableSelect
                    {...form.register('customerId')}
                    value={form.watch('customerId')}
                    placeholder="Select a customer"
                    options={customers.map((customer) => ({
                      label: `${customer.label}${customer.subtitle ? ` — ${customer.subtitle}` : ''}`,
                      value: customer.id
                    }))}
                  />
                  {form.formState.errors.customerId && (
                    <p className="mt-1 text-xs text-red-500">
                      {form.formState.errors.customerId.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Property</label>
                  <SearchableSelect
                    {...form.register('propertyId')}
                    value={form.watch('propertyId')}
                    placeholder="Select a property"
                    options={properties.map((property) => ({
                      label: `${property.label}${property.subtitle ? ` — ${property.subtitle}` : ''}`,
                      value: property.id
                    }))}
                  />
                  {form.formState.errors.propertyId && (
                    <p className="mt-1 text-xs text-red-500">
                      {form.formState.errors.propertyId.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Invoice Type</label>
                  <SearchableSelect
                    {...form.register('type')}
                    value={form.watch('type')}
                    isSearchable={false}
                    options={[
                      { label: 'Installment', value: 'INSTALLMENT' },
                      { label: 'Booking', value: 'BOOKING' },
                      { label: 'Confirmation', value: 'CONFIRMATION' },
                      { label: 'Half-Yearly', value: 'HALF_YEARLY' },
                      { label: 'Yearly', value: 'YEARLY' },
                      { label: 'Development Charge', value: 'DEVELOPMENT_CHARGE' },
                      { label: 'Adjustment', value: 'ADJUSTMENT' }
                    ]}
                  />
                  {form.formState.errors.type && (
                    <p className="mt-1 text-xs text-red-500">{form.formState.errors.type.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Issue Date</label>
                  <DatePicker
                    type="date"
                    {...form.register('issueDate')}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {form.formState.errors.issueDate && (
                    <p className="mt-1 text-xs text-red-500">{form.formState.errors.issueDate.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Due Date</label>
                  <DatePicker
                    type="date"
                    {...form.register('dueDate')}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {form.formState.errors.dueDate && (
                    <p className="mt-1 text-xs text-red-500">{form.formState.errors.dueDate.message}</p>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">Amounts</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Subtotal</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...form.register('subtotal')}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0.00"
                  />
                  {form.formState.errors.subtotal && (
                    <p className="mt-1 text-xs text-red-500">{form.formState.errors.subtotal.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Tax</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...form.register('tax')}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0.00"
                  />
                  {form.formState.errors.tax && (
                    <p className="mt-1 text-xs text-red-500">{form.formState.errors.tax.message}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 rounded-lg border bg-muted/30 p-4 text-sm">
                <p className="text-muted-foreground">Total (calculated)</p>
                <p className="text-2xl font-bold">{formatCurrency(total)}</p>
              </div>
            </section>

            <section className="rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">Installment No. / Notes</h2>
              <textarea
                rows={4}
                {...form.register('notes')}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., Installment #5 or additional information"
              />
            </section>

            <div className="flex items-center justify-end gap-3">
              <Link
                href="/invoices"
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {createMutation.isPending ? 'Creating...' : 'Create Invoice'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showPreview && previewValues && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in duration-200">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-slate-200 bg-[#fafafa] p-6 shadow-2xl">
            <h3 className="mb-4 text-xl font-bold">Review Invoice Details</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-white/20 pb-2">
                <span className="text-muted-foreground">Customer</span>
                <span className="font-medium text-right">{customers.find(c => c.id === previewValues.customerId)?.label || 'Unknown'}</span>
              </div>
              
              <div className="flex justify-between border-b border-white/20 pb-2">
                <span className="text-muted-foreground">Property</span>
                <span className="font-medium text-right">{properties.find(p => p.id === previewValues.propertyId)?.label || 'Unknown'}</span>
              </div>

              <div className="flex justify-between border-b border-white/20 pb-2">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">{previewValues.type}</span>
              </div>
              
              <div className="flex justify-between border-b border-white/20 pb-2">
                <span className="text-muted-foreground">Dates</span>
                <span className="font-medium text-right">{previewValues.issueDate} to {previewValues.dueDate}</span>
              </div>

              <div className="flex justify-between border-b border-white/20 pb-2 items-center">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(Number(previewValues.subtotal))}</span>
              </div>
              
              <div className="flex justify-between border-b border-white/20 pb-2 items-center">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium">{formatCurrency(Number(previewValues.tax || 0))}</span>
              </div>
              
              <div className="flex justify-between border-b border-white/20 pb-2 items-center">
                <span className="font-bold text-foreground">Total</span>
                <span className="font-bold text-lg text-primary">{formatCurrency(Number(previewValues.subtotal) + Number(previewValues.tax || 0))}</span>
              </div>

              {previewValues.notes && (
                <div className="flex justify-between border-b border-white/20 pb-2">
                  <span className="text-muted-foreground">Notes</span>
                  <span className="font-medium text-right">{previewValues.notes}</span>
                </div>
              )}
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-white/50 px-4 py-2 font-medium hover:bg-white/80 transition"
              >
                Go Back & Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={createMutation.isPending}
                className="flex-1 rounded-xl bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 transition"
              >
                {createMutation.isPending ? 'Creating...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

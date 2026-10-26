'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, CreditCard, Building2, Hammer } from 'lucide-react'
import { toast } from 'sonner'

import { Header } from '@/components/layout/header'
import { customersApi, invoicesApi, propertiesApi, receiptsApi, pdcApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { DatePicker } from '@/components/DatePicker'
import { SearchableSelect } from '@/components/SearchableSelect'

const receiptSchema = z.object({
  code: z.string().optional(), // Manual receipt number
  category: z.enum(['INSTALLMENT', 'DEVELOPMENT']).default('INSTALLMENT'),
  invoiceId: z.string().optional(),
  customerId: z.string().min(1, 'Customer is required'),
  propertyId: z.string().optional(),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount'),
  method: z.enum(['CASH', 'CHEQUE', 'BANK_TRANSFER', 'ONLINE', 'PDC']),
  reference: z.string().optional(),
  receivedAt: z.string().min(1, 'Received date is required'),
  notes: z.string().optional(),
  bankName: z.string().optional(),
  chequeNumber: z.string().optional(),
  chequeDate: z.string().optional(),
  slipNumber: z.string().optional(),
})

type ReceiptFormValues = z.infer<typeof receiptSchema>

type SelectOption = {
  id: string
  label: string
  subtitle?: string
}

type InvoiceOption = SelectOption & {
  customerId?: string
  propertyId?: string
  balance: number
  status?: string
  type?: string
}

export default function NewReceiptPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  const preselectedCategory = searchParams.get('category') === 'DEVELOPMENT' ? 'DEVELOPMENT' : 'INSTALLMENT'
  const preselectedInvoiceId = searchParams.get('invoiceId') ?? ''
  const preselectedPropertyId = searchParams.get('propertyId') ?? ''
  const preselectedCustomerId = searchParams.get('customerId') ?? ''

  const [category, setCategory] = useState<'INSTALLMENT' | 'DEVELOPMENT'>(preselectedCategory)

  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      code: '',
      category: preselectedCategory,
      invoiceId: preselectedInvoiceId,
      customerId: preselectedCustomerId,
      propertyId: preselectedPropertyId,
      amount: '',
      method: 'CASH',
      reference: '',
      receivedAt: new Date().toISOString().split('T')[0],
      notes: '',
      bankName: '',
      chequeNumber: '',
      chequeDate: '',
      slipNumber: '',
    },
  })

  const [showPreview, setShowPreview] = useState(false)
  const [previewValues, setPreviewValues] = useState<ReceiptFormValues | null>(null)

  const { data: customers = [] } = useQuery<SelectOption[]>({
    queryKey: ['customers', 'options'],
    queryFn: async () => {
      const list = await customersApi.list({})
      if (!Array.isArray(list)) return []
      return list.map((customer: any) => ({
        id: customer.id,
        label: customer.fullName || customer.code || 'Unnamed customer',
      }))
    },
  })

  const selectedCustomerId = form.watch('customerId')
  const selectedPropertyId = form.watch('propertyId')

  const { data: properties = [] } = useQuery<SelectOption[]>({
    queryKey: ['properties', 'options', selectedCustomerId],
    queryFn: async () => {
      const list = await propertiesApi.list({ customerId: selectedCustomerId || undefined })
      if (!Array.isArray(list)) return []
      return list.map((property: any) => ({
        id: property.id,
        label: property.code,
        subtitle: property.title,
      }))
    },
  })

  const { data: invoiceOptions = [] } = useQuery<InvoiceOption[]>({
    queryKey: ['invoices', 'receipt-options'],
    queryFn: async () => {
      const response = await invoicesApi.list({ limit: 500 })
      const list = response.data
      if (!Array.isArray(list)) return []
      return list.map((invoice: any) => {
        const total = Number(invoice.total ?? 0)
        const paid = Number(invoice.paid ?? 0)
        return {
          id: invoice.id,
          label: invoice.code,
          subtitle: `${invoice.property?.code || ''} • ${invoice.customer?.fullName || ''} (Bal: Rs. ${Math.max(total - paid, 0).toLocaleString()})`,
          customerId: invoice.customer?.id,
          propertyId: invoice.property?.id,
          balance: Math.max(total - paid, 0),
          status: invoice.status,
          type: invoice.type,
        }
      })
    },
  })

  // Filter invoices according to selected category (INSTALLMENT vs DEVELOPMENT)
  const filteredInvoiceOptions = invoiceOptions.filter((inv) => {
    if (inv.status === 'VOID' || inv.status === 'PAID') return false
    if (inv.balance <= 0) return false
    if (category === 'DEVELOPMENT') {
      return inv.type === 'DEVELOPMENT_CHARGE'
    } else {
      return inv.type !== 'DEVELOPMENT_CHARGE'
    }
  })

  const { data: singleInvoice } = useQuery({
    queryKey: ['invoice', preselectedInvoiceId],
    queryFn: () => invoicesApi.get(preselectedInvoiceId),
    enabled: !!preselectedInvoiceId && !invoiceOptions.some((i) => i.id === preselectedInvoiceId),
  })

  useEffect(() => {
    if (singleInvoice && (singleInvoice.status === 'VOID' || singleInvoice.status === 'PAID')) {
      toast.error(`Invoice ${singleInvoice.code} is ${singleInvoice.status} and cannot receive payments.`)
      form.setValue('invoiceId', '')
    }
  }, [singleInvoice, form])

  const selectedInvoiceId = form.watch('invoiceId')
  const selectedMethod = form.watch('method')

  // Handle switching category
  const handleCategoryChange = (newCategory: 'INSTALLMENT' | 'DEVELOPMENT') => {
    setCategory(newCategory)
    form.setValue('category', newCategory)
    form.setValue('invoiceId', '')
    form.setValue('amount', '')
  }

  // When invoice selection changes
  useEffect(() => {
    if (!selectedInvoiceId) return
    let selected = invoiceOptions.find((option) => option.id === selectedInvoiceId)
    
    if (!selected && singleInvoice && singleInvoice.id === selectedInvoiceId) {
      const total = Number(singleInvoice.total ?? 0)
      const paid = Number(singleInvoice.paid ?? 0)
      selected = {
        id: singleInvoice.id,
        label: singleInvoice.code,
        customerId: singleInvoice.customer?.id,
        propertyId: singleInvoice.property?.id,
        balance: Math.max(total - paid, 0),
        type: singleInvoice.type,
      }
    }

    if (!selected) return

    if (selected.type === 'DEVELOPMENT_CHARGE' && category !== 'DEVELOPMENT') {
      setCategory('DEVELOPMENT')
      form.setValue('category', 'DEVELOPMENT')
    }

    if (selected.customerId) {
      form.setValue('customerId', selected.customerId, { shouldDirty: false })
    }

    if (selected.propertyId) {
      form.setValue('propertyId', selected.propertyId, { shouldDirty: false })
    }

    if (selected.balance > 0 && form.getValues('amount') === '') {
      form.setValue('amount', String(selected.balance), { shouldDirty: false })
    }
  }, [selectedInvoiceId, invoiceOptions, singleInvoice, form, category])

  // When property is selected in DEVELOPMENT mode, try to auto-select pending dev invoice
  useEffect(() => {
    if (category === 'DEVELOPMENT' && selectedPropertyId && !form.getValues('invoiceId')) {
      const matchingDevInv = filteredInvoiceOptions.find(
        (inv) => inv.propertyId === selectedPropertyId && inv.balance > 0
      )
      if (matchingDevInv) {
        form.setValue('invoiceId', matchingDevInv.id)
        if (form.getValues('amount') === '') {
          form.setValue('amount', String(matchingDevInv.balance))
        }
      }
    }
  }, [category, selectedPropertyId, filteredInvoiceOptions, form])

  const createReceiptMutation = useMutation({
    mutationFn: (data: any) => receiptsApi.create(data),
    onSuccess: (res: any) => {
      if (res?.isPdc) {
        toast.success(`Post-Dated Cheque ${res.code || ''} recorded successfully. Installment marked as PDC.`)
        queryClient.invalidateQueries({ queryKey: ['pdc'] })
        queryClient.invalidateQueries({ queryKey: ['invoices'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        router.push('/pdc')
      } else {
        toast.success(`Receipt ${res?.code || ''} recorded successfully`)
        queryClient.invalidateQueries({ queryKey: ['receipts'] })
        queryClient.invalidateQueries({ queryKey: ['invoices'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        queryClient.invalidateQueries({ queryKey: ['dev-charges-properties'] })
        queryClient.invalidateQueries({ queryKey: ['dev-charges-invoices'] })
        router.push('/receipts')
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to record receipt')
    },
  })

  const onSubmit = (values: ReceiptFormValues) => {
    setPreviewValues(values)
    setShowPreview(true)
  }

  const handleConfirmSubmit = () => {
    if (!previewValues) return

    let finalCode = previewValues.code ? previewValues.code.trim() : undefined
    if (category === 'DEVELOPMENT' && finalCode) {
      // Enforce DEV- prefix on manual receipt code for development
      finalCode = finalCode.replace(/^DEV-?(REC-?)?/i, '').trim()
      finalCode = `DEV-${finalCode}`
    }

    const payload: any = {
      code: finalCode || undefined,
      category,
      invoiceId: previewValues.invoiceId || undefined,
      customerId: previewValues.customerId,
      propertyId: previewValues.propertyId || undefined,
      amount: Number(previewValues.amount),
      method: previewValues.method,
      reference: previewValues.reference || undefined,
      receivedAt: previewValues.receivedAt ? new Date(previewValues.receivedAt) : undefined,
      notes: previewValues.notes || undefined,
      bankName: previewValues.bankName || undefined,
      chequeNumber: previewValues.chequeNumber || undefined,
      chequeDate: previewValues.chequeDate ? new Date(previewValues.chequeDate) : undefined,
      slipNumber: previewValues.slipNumber || undefined,
    }

    setShowPreview(false)
    createReceiptMutation.mutate(payload)
  }

  const isSubmitting = createReceiptMutation.isPending

  return (
    <div className="flex flex-col">
      <Header title="Record Receipt" />

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <Link
            href="/receipts"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Receipts
          </Link>

          {/* Payment Purpose / Category Switcher */}
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Payment Category <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => handleCategoryChange('INSTALLMENT')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium border transition-all ${
                  category === 'INSTALLMENT'
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-background hover:bg-muted text-muted-foreground border-border'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                Installments / Booking
              </button>
              <button
                type="button"
                onClick={() => handleCategoryChange('DEVELOPMENT')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium border transition-all ${
                  category === 'DEVELOPMENT'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-background hover:bg-muted text-muted-foreground border-border'
                }`}
              >
                <Hammer className="h-4 w-4" />
                Development Charges
              </button>
            </div>
            
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Section 1: Payment Identification & Allocation */}
            <section className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Receipt Information</h2>
              <div className="grid gap-4 md:grid-cols-2">
                
                {/* Receipt Number with Differentiator */}
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium">
                    Receipt Number (Optional / Manual)
                  </label>
                  {category === 'DEVELOPMENT' ? (
                    <div>
                      <div className="flex">
                        <span className="inline-flex items-center px-3.5 rounded-l-lg border border-r-0 bg-indigo-50 font-bold text-indigo-700 text-sm">
                          DEV-
                        </span>
                        <input
                          type="text"
                          {...form.register('code')}
                          className="w-full rounded-r-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="e.g., 1052 (saved as DEV-1052) or leave blank for auto"
                        />
                      </div>
                      
                    </div>
                  ) : (
                    <div>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 bg-muted text-sm text-muted-foreground">
                          REC-
                        </span>
                        <input
                          type="text"
                          {...form.register('code')}
                          className="w-full rounded-r-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Leave blank for auto or enter manual book #"
                        />
                      </div>
                      
                    </div>
                  )}
                </div>

                {/* Customer */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Customer <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    options={customers.map((c) => ({ label: c.label, value: c.id }))}
                    value={form.watch('customerId')}
                    onChange={(e: any) => form.setValue('customerId', e.target.value)}
                    placeholder="Search and select customer..."
                  />
                  {form.formState.errors.customerId && (
                    <p className="mt-1 text-xs text-red-500">{form.formState.errors.customerId.message}</p>
                  )}
                </div>

                {/* Property */}
                <div>
                  <label className="mb-2 block text-sm font-medium">Property / Plot</label>
                  <SearchableSelect
                    options={properties.map((p) => ({ label: `${p.label} - ${p.subtitle || ''}`, value: p.id }))}
                    value={form.watch('propertyId') || ''}
                    onChange={(e: any) => form.setValue('propertyId', e.target.value)}
                    placeholder="Select property..."
                  />
                </div>

                {/* Linked Invoice Indicator (if preselected from installments or dev charges tab) */}
                {form.watch('invoiceId') && singleInvoice && (
                  <div className="md:col-span-2 text-xs bg-primary/5 border border-primary/20 rounded-lg p-2.5 flex items-center justify-between text-primary">
                    <span>Targeting Invoice: <strong className="font-semibold">{singleInvoice.code}</strong></span>
                    <button
                      type="button"
                      onClick={() => form.setValue('invoiceId', '')}
                      className="text-xs font-medium hover:underline text-muted-foreground hover:text-foreground"
                    >
                      Clear target
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Section 2: Payment Details */}
            <section className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Amount (PKR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...form.register('amount')}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-base font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0.00"
                  />
                  {form.formState.errors.amount && (
                    <p className="mt-1 text-xs text-red-500">{form.formState.errors.amount.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Payment Method <span className="text-red-500">*</span></label>
                  <select
                    {...form.register('method')}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                  >
                    <option value="CASH">Cash</option>
                    <option value="PDC">Post-Dated Cheque (PDC)</option>
                    <option value="BANK_TRANSFER">Bank Transfer / Pay Order</option>
                    <option value="ONLINE">Online Portal</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Received Date <span className="text-red-500">*</span></label>
                  <DatePicker
                    type="date"
                    {...form.register('receivedAt')}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {form.formState.errors.receivedAt && (
                    <p className="mt-1 text-xs text-red-500">{form.formState.errors.receivedAt.message}</p>
                  )}
                </div>

                {(selectedMethod === 'BANK_TRANSFER' || selectedMethod === 'PDC') && (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-medium">Bank Name</label>
                      <input
                        type="text"
                        {...form.register('bankName')}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g., Meezan Bank"
                      />
                    </div>
                    {selectedMethod === 'PDC' && (
                      <>
                        <div>
                          <label className="mb-2 block text-sm font-medium">Cheque Number <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            {...form.register('chequeNumber')}
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Cheque #"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium">
                            Cheque / Maturity Date <span className="text-red-500">*</span>
                          </label>
                          <DatePicker
                            type="date"
                            {...form.register('chequeDate')}
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </>
                    )}
                    {selectedMethod === 'BANK_TRANSFER' && (
                      <div>
                        <label className="mb-2 block text-sm font-medium">Slip / Reference No.</label>
                        <input
                          type="text"
                          {...form.register('slipNumber')}
                          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Slip #"
                        />
                      </div>
                    )}
                  </>
                )}

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium">Additional Reference / Notes</label>
                  <input
                    type="text"
                    {...form.register('reference')}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary mb-3"
                    placeholder="Short Reference..."
                  />
                  <textarea
                    rows={2}
                    {...form.register('notes')}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Additional details for this receipt"
                  />
                </div>
              </div>
            </section>

            <div className="flex items-center justify-end gap-3">
              <Link
                href="/receipts"
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow-sm transition disabled:opacity-50 ${
                  selectedMethod === 'PDC'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : category === 'DEVELOPMENT'
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : 'bg-primary hover:bg-primary/90'
                }`}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting
                  ? 'Recording...'
                  : selectedMethod === 'PDC'
                  ? 'Record Post-Dated Cheque (PDC)'
                  : category === 'DEVELOPMENT'
                  ? 'Record Development Receipt'
                  : 'Record Receipt'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showPreview && previewValues && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in duration-200">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-slate-200 bg-[#fafafa] p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold">
              {previewValues.method === 'PDC' ? 'Review Post-Dated Cheque (PDC)' : 'Review Receipt Details'}
            </h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Category</span>
                <span className={`font-semibold ${category === 'DEVELOPMENT' ? 'text-indigo-600' : 'text-primary'}`}>
                  {category === 'DEVELOPMENT' ? 'Development Charges' : 'Installment / Regular'}
                </span>
              </div>

              {previewValues.code && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Receipt Number</span>
                  <span className="font-bold">
                    {category === 'DEVELOPMENT' && !previewValues.code.startsWith('DEV-')
                      ? `DEV-${previewValues.code}`
                      : previewValues.code}
                  </span>
                </div>
              )}

              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Customer</span>
                <span className="font-medium text-right">
                  {customers.find((c) => c.id === previewValues.customerId)?.label || 'Unknown'}
                </span>
              </div>
              
              {previewValues.propertyId && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Property</span>
                  <span className="font-medium text-right">
                    {properties.find((p) => p.id === previewValues.propertyId)?.label || 'Unknown'}
                  </span>
                </div>
              )}

              <div className="flex justify-between border-b pb-2 items-center">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-lg text-primary">{formatCurrency(Number(previewValues.amount))}</span>
              </div>
              
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Method</span>
                <span className="font-medium">{previewValues.method === 'PDC' ? 'Post-Dated Cheque (PDC)' : previewValues.method}</span>
              </div>

              {previewValues.bankName && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Bank</span>
                  <span className="font-medium text-right">{previewValues.bankName}</span>
                </div>
              )}

              {previewValues.chequeNumber && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Cheque #</span>
                  <span className="font-medium font-mono text-right">{previewValues.chequeNumber}</span>
                </div>
              )}

              {previewValues.chequeDate && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Cheque / Maturity Date</span>
                  <span className="font-medium text-right">{previewValues.chequeDate}</span>
                </div>
              )}
              
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{previewValues.receivedAt}</span>
              </div>

              {previewValues.reference && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-medium text-right">{previewValues.reference}</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="flex-1 rounded-xl border px-4 py-2 font-medium hover:bg-muted transition"
              >
                Go Back & Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className={`flex-1 rounded-xl px-4 py-2 font-medium text-white transition ${
                  previewValues.method === 'PDC'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : category === 'DEVELOPMENT'
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : 'bg-primary hover:bg-primary/90'
                }`}
              >
                {isSubmitting
                  ? 'Recording...'
                  : previewValues.method === 'PDC'
                  ? 'Confirm & Record PDC'
                  : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

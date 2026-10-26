'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Header } from '@/components/layout/header'
import { paymentPlansApi, propertiesApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { DatePicker } from '@/components/DatePicker'
import { SearchableSelect } from '@/components/SearchableSelect'

const componentSchema = z.object({
  type: z.enum(['BOOKING', 'CONFIRMATION', 'INSTALLMENT', 'HALF_YEARLY', 'YEARLY'], {
    required_error: 'Component type is required',
  }),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount'),
  terms: z
    .string()
    .min(1, 'Terms are required')
    .regex(/^\d+$/, 'Enter whole number of terms')
    .transform((val) => Number(val))
    .refine((val) => val >= 1 && val <= 120, {
      message: 'Terms must be between 1 and 120',
    }),
  startDate: z.string().optional(),
})

const planSchema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  title: z.string().min(1, 'Title is required'),
  startDate: z.string().min(1, 'Start date is required'),
  currency: z.string().min(1, 'Currency is required').default('PKR'),
  autoGenerateInvoices: z.boolean().default(true),
  components: z
    .array(componentSchema)
    .min(1, 'Add at least one component to the plan'),
})

const defaultComponent = {
  type: 'INSTALLMENT' as const,
  amount: '',
  terms: 12,
  startDate: '',
}

export type PaymentPlanFormValues = z.infer<typeof planSchema>

type PropertyOption = {
  id: string
  code?: string | null
  title?: string | null
}

export default function NewPaymentPlanPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: properties = [] } = useQuery<PropertyOption[]>({
    queryKey: ['properties', 'options', 'payment-plans'],
    queryFn: async () => {
      const list = await propertiesApi.list({})
      if (!Array.isArray(list)) return []
      return list.map((property: any) => ({
        id: property.id,
        code: property.code,
        title: property.title,
      }))
    },
  })

  const form = useForm<PaymentPlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      propertyId: '',
      title: '',
      startDate: new Date().toISOString().split('T')[0],
      currency: 'PKR',
      autoGenerateInvoices: true,
      components: [defaultComponent],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'components',
  })

  const totalAmount = useMemo(() => {
    const components = form.getValues('components')
    return components.reduce((sum, component) => {
      const amount = Number(component.amount || 0)
      return sum + amount
    }, 0)
  }, [form])

  const createPlan = useMutation({
    mutationFn: async (values: PaymentPlanFormValues) => {
      const payload = {
        propertyId: values.propertyId,
        title: values.title,
        startDate: values.startDate,
        currency: values.currency,
        autoGenerateInvoices: values.autoGenerateInvoices,
        totalAmount: values.components.reduce((sum, component) => sum + Number(component.amount || 0), 0),
        components: values.components.map((component) => ({
          type: component.type,
          amount: Number(component.amount),
          terms: component.terms,
          startDate: component.startDate ? new Date(component.startDate).toISOString() : undefined,
        })),
      }
      return paymentPlansApi.create(payload)
    },
    onSuccess: (createdPlan) => {
      toast.success('Payment plan created successfully')
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] })
      if (createdPlan?.id) {
        queryClient.invalidateQueries({ queryKey: ['payment-plan', createdPlan.id] })
        router.push(`/payment-plans/${createdPlan.id}`)
      } else {
        router.push('/payment-plans')
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create payment plan')
    },
  })

  const onSubmit = (values: PaymentPlanFormValues) => {
    createPlan.mutate(values)
  }

  const isSubmitting = createPlan.isPending

  return (
    <div className="flex flex-col">
      <Header title="Create Payment Plan" />

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/payment-plans"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Payment Plans
          </Link>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <section className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold">Plan Details</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium">Property</label>
                  <SearchableSelect
                    {...form.register('propertyId')}
                    value={form.watch('propertyId')}
                    placeholder="Select property"
                    options={properties.map((property) => ({
                      label: `${property.code}${property.title ? ` — ${property.title}` : ''}`,
                      value: property.id
                    }))}
                  />
                  {form.formState.errors.propertyId && (
                    <p className="mt-1 text-xs text-red-500">{form.formState.errors.propertyId.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Plan Title</label>
                  <input
                    type="text"
                    {...form.register('title')}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Standard 3-Year Plan"
                  />
                  {form.formState.errors.title && (
                    <p className="mt-1 text-xs text-red-500">{form.formState.errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Start Date</label>
                  <DatePicker
                    type="date"
                    {...form.register('startDate')}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {form.formState.errors.startDate && (
                    <p className="mt-1 text-xs text-red-500">{form.formState.errors.startDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Currency</label>
                  <input
                    type="text"
                    {...form.register('currency')}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {form.formState.errors.currency && (
                    <p className="mt-1 text-xs text-red-500">{form.formState.errors.currency.message}</p>
                  )}
                </div>

                <div className="md:col-span-2 flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3 text-sm">
                  <input
                    id="autoGenerateInvoices"
                    type="checkbox"
                    {...form.register('autoGenerateInvoices')}
                    className="h-4 w-4 rounded border"
                  />
                  <label htmlFor="autoGenerateInvoices" className="flex-1 cursor-pointer">
                    Auto-generate invoices for each installment component
                  </label>
                </div>
              </div>
            </section>

            <section className="rounded-lg border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Components</h2>
                </div>
                <button
                  type="button"
                  onClick={() => append(defaultComponent)}
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent"
                >
                  <Plus className="h-4 w-4" />
                  Add Component
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {fields.map((field, index) => {
                  const componentErrors = form.formState.errors.components?.[index]
                  return (
                    <div key={field.id} className="rounded-lg border bg-background p-4">
                      <div className="grid gap-4 md:grid-cols-4">
                        <div>
                          <label className="mb-2 block text-xs font-medium uppercase text-muted-foreground">
                            Type
                          </label>
                          <SearchableSelect
                            {...form.register(`components.${index}.type`)}
                            value={form.watch(`components.${index}.type`)}
                            isSearchable={false}
                            options={[
                              { label: 'Booking', value: 'BOOKING' },
                              { label: 'Confirmation', value: 'CONFIRMATION' },
                              { label: 'Installment', value: 'INSTALLMENT' },
                              { label: 'Half-Yearly', value: 'HALF_YEARLY' },
                              { label: 'Yearly', value: 'YEARLY' }
                            ]}
                          />
                          {componentErrors?.type && (
                            <p className="mt-1 text-xs text-red-500">{componentErrors.type.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-medium uppercase text-muted-foreground">
                            Amount
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            {...form.register(`components.${index}.amount`)}
                            className="w-full rounded-lg border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="0.00"
                          />
                          {componentErrors?.amount && (
                            <p className="mt-1 text-xs text-red-500">{componentErrors.amount.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-medium uppercase text-muted-foreground">
                            Terms
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="120"
                            {...form.register(`components.${index}.terms`)}
                            className="w-full rounded-lg border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="12"
                          />
                          {componentErrors?.terms && (
                            <p className="mt-1 text-xs text-red-500">{componentErrors.terms.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-medium uppercase text-muted-foreground">
                            Start Date (optional)
                          </label>
                          <DatePicker
                            type="date"
                            {...form.register(`components.${index}.startDate`)}
                            className="w-full rounded-lg border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          {componentErrors?.startDate && (
                            <p className="mt-1 text-xs text-red-500">{componentErrors.startDate.message}</p>
                          )}
                        </div>
                      </div>

                      {fields.length > 1 && (
                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="inline-flex items-center gap-2 rounded-lg border border-destructive px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove Component
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {typeof form.formState.errors.components?.message === 'string' && (
                <p className="mt-4 text-xs text-red-500">
                  {form.formState.errors.components?.message}
                </p>
              )}
            </section>

            <section className="rounded-lg border bg-muted/30 p-4 text-sm">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Total amount</p>
                <p className="text-xl font-semibold">{formatCurrency(totalAmount)}</p>
              </div>
            </section>

            <div className="flex items-center justify-end gap-3">
              <Link
                href="/payment-plans"
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Creating...' : 'Create Plan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Header } from '@/components/layout/header'
import { expensesApi } from '@/lib/api'
import { DatePicker } from '@/components/DatePicker'
import { SearchableSelect } from '@/components/SearchableSelect'

const expenseSchema = z.object({
  date: z.string().min(1, 'Expense date is required'),
  type: z.enum(['PURCHASE_INVOICE', 'PETTY_CASH', 'ADVANCE_TO_VENDOR'], {
    required_error: 'Expense type is required',
  }),
  category: z.enum(['OFFICE', 'DEVELOPMENT'], {
    required_error: 'Category is required',
  }),
  subcategory: z.string().optional(),
  billNo: z.string().optional(),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount'),
  notes: z.string().optional(),
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

export default function NewExpensePage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      type: 'PURCHASE_INVOICE',
      category: 'OFFICE',
      subcategory: '',
      billNo: '',
      amount: '',
      notes: '',
    },
  })

  const createMutation = useMutation({
    mutationFn: (values: ExpenseFormValues) =>
      expensesApi.create({
        date: values.date,
        type: values.type,
        category: values.category,
        subcategory: values.subcategory || undefined,
        billNo: values.billNo || undefined,
        amount: Number(values.amount),
        notes: values.notes || undefined,
      }),
    onSuccess: (created) => {
      toast.success('Expense recorded successfully')
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      if (created?.id) {
        queryClient.invalidateQueries({ queryKey: ['expense', created.id] })
      }
      router.push('/expenses')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to record expense')
    },
  })

  const onSubmit = (values: ExpenseFormValues) => {
    createMutation.mutate(values)
  }

  const isSubmitting = createMutation.isPending

  return (
    <div className="flex flex-col">
      <Header title="Create Expense" />

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/expenses"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Expenses
          </Link>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <section className="rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">Expense Details</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Type</label>
                  <SearchableSelect
                    {...form.register('type')}
                    value={form.watch('type')}
                    onChange={(e) => form.setValue('type', e.target.value as any)}
                    options={[
                      { value: 'PURCHASE_INVOICE', label: 'Purchase Invoice' },
                      { value: 'PETTY_CASH', label: 'Petty Cash' },
                      { value: 'ADVANCE_TO_VENDOR', label: 'Advance to Vendor' },
                    ]}
                    placeholder="Select expense type"
                  />
                  {form.formState.errors.type && (
                    <p className="mt-1 text-xs text-red-500">{form.formState.errors.type.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Category</label>
                  <SearchableSelect
                    {...form.register('category')}
                    value={form.watch('category')}
                    onChange={(e) => form.setValue('category', e.target.value as any)}
                    options={[
                      { value: 'OFFICE', label: 'Office' },
                      { value: 'DEVELOPMENT', label: 'Development' },
                    ]}
                    placeholder="Select category"
                  />
                  {form.formState.errors.category && (
                    <p className="mt-1 text-xs text-red-500">{form.formState.errors.category.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Subcategory</label>
                  <input
                    type="text"
                    {...form.register('subcategory')}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Electricity, Internet, Site Supplies"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Bill / Reference No.</label>
                  <input
                    type="text"
                    {...form.register('billNo')}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Invoice or reference number"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Amount (PKR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...form.register('amount')}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0.00"
                  />
                  {form.formState.errors.amount && (
                    <p className="mt-1 text-xs text-red-500">{form.formState.errors.amount.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Expense Date <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    type="date"
                    {...form.register('date')}
                    value={form.watch('date')}
                    onChange={(e) => form.setValue('date', e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {form.formState.errors.date && (
                    <p className="mt-1 text-xs text-red-500">{form.formState.errors.date.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium">Notes</label>
                  <textarea
                    rows={3}
                    {...form.register('notes')}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Any additional information"
                  />
                </div>
              </div>
            </section>

            <div className="flex items-center justify-end gap-3">
              <Link
                href="/expenses"
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
                {isSubmitting ? 'Saving...' : 'Record Expense'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

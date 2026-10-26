'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { pdcApi, customersApi, invoicesApi } from '@/lib/api'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { DatePicker } from '@/components/DatePicker'
import { SearchableSelect } from '@/components/SearchableSelect'

export default function NewPDCPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState({
    customerId: '',
    invoiceId: '',
    bank: '',
    chequeNo: '',
    amount: '',
    dueDate: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', 'pdc-options'],
    queryFn: async () => {
      const res = await customersApi.list({})
      return Array.isArray(res) ? res : []
    },
  })

  const { data: customerInvoices = [] } = useQuery({
    queryKey: ['invoices', 'customer-pending', formData.customerId],
    queryFn: async () => {
      if (!formData.customerId) return []
      const res = await invoicesApi.list({ customerId: formData.customerId, limit: 100 })
      const list = res?.data || []
      return list.filter((inv: any) => inv.status !== 'PAID' && inv.status !== 'VOID')
    },
    enabled: !!formData.customerId,
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => pdcApi.create(data),
    onSuccess: () => {
      toast.success('PDC added successfully')
      queryClient.invalidateQueries({ queryKey: ['pdc'] })
      router.push('/pdc')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add PDC')
    },
  })

  const handleCustomerChange = (customerId: string) => {
    setFormData((prev) => ({
      ...prev,
      customerId,
      invoiceId: '',
    }))
  }

  const handleInvoiceChange = (invoiceId: string) => {
    const selectedInv = customerInvoices.find((i: any) => i.id === invoiceId)
    const balance = selectedInv ? Math.max(Number(selectedInv.total) - Number(selectedInv.paid), 0) : 0

    setFormData((prev) => ({
      ...prev,
      invoiceId,
      amount: balance > 0 && (!prev.amount || prev.amount === '0') ? String(balance) : prev.amount,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.customerId) {
      toast.error('Please select a customer')
      return
    }
    if (!formData.bank.trim()) {
      toast.error('Please enter the bank name')
      return
    }
    if (!formData.chequeNo.trim()) {
      toast.error('Please enter the cheque number')
      return
    }
    const parsedAmount = parseFloat(formData.amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    if (!formData.dueDate) {
      toast.error('Please select a due date')
      return
    }
    
    const data = {
      customerId: formData.customerId,
      invoiceId: formData.invoiceId || undefined,
      bank: formData.bank.trim(),
      chequeNo: formData.chequeNo.trim(),
      amount: parsedAmount,
      dueDate: formData.dueDate,
      notes: formData.notes.trim() || undefined,
    }
    
    createMutation.mutate(data)
  }

  return (
    <div className="flex flex-col">
      <Header title="Add Post-Dated Cheque" />
      
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/pdc"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to PDCs
          </Link>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PDC Details */}
            <div className="rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">Cheque Details</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Customer <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    required
                    value={formData.customerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    placeholder="Select Customer"
                    options={customers.map((c: any) => ({
                      label: `${c.fullName || 'Unnamed'} (${c.code || 'No Code'})`,
                      value: c.id
                    }))}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Linked Invoice / Plot <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                  </label>
                  <SearchableSelect
                    value={formData.invoiceId}
                    onChange={(e) => handleInvoiceChange(e.target.value)}
                    disabled={!formData.customerId}
                    placeholder={!formData.customerId ? 'Select a customer first' : customerInvoices.length === 0 ? 'No open invoices found' : 'Select Invoice / Plot'}
                    options={customerInvoices.map((inv: any) => {
                      const bal = Math.max(Number(inv.total) - Number(inv.paid), 0)
                      return {
                        label: `${inv.code} • ${inv.property?.code || inv.property?.title || 'General'} (Due: Rs. ${bal.toLocaleString()})`,
                        value: inv.id,
                      }
                    })}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.bank}
                    onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., HBL, UBL, MCB, Meezan"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Cheque Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.chequeNo}
                    onChange={(e) => setFormData({ ...formData, chequeNo: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                    placeholder="e.g., 02066311"
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
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Additional notes or remarks..."
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <Link
                href="/pdc"
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
                {createMutation.isPending ? 'Adding...' : 'Add PDC'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

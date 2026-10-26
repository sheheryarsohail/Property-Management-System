'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { customersApi } from '@/lib/api'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewCustomerPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    mobile: '',
    nationalId: '',
    fatherName: '',
    husbandName: '',
    address: '',
    nomineeName: '',
    nomineeRelation: '',
    nomineeNIC: '',
    nomineeAddress: '',
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => customersApi.create(data),
    onSuccess: () => {
      toast.success('Customer created successfully')
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      router.push('/customers')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create customer')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  return (
    <div className="flex flex-col">
      <Header title="Add New Customer" />
      
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/customers"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Customers
          </Link>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">Basic Information</h2>
              <div className="grid gap-4 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., John Doe"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Father's Name</label>
                  <input
                    type="text"
                    value={formData.fatherName}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Husband's Name</label>
                  <input
                    type="text"
                    value={formData.husbandName}
                    onChange={(e) => setFormData({ ...formData, husbandName: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">CNIC / National ID</label>
                  <input
                    type="text"
                    value={formData.nationalId}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="12345-1234567-1"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="+92 300 1234567"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Mobile</label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="+92 300 1234567"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Full address"
                  />
                </div>
              </div>
            </div>

            {/* Nominee Information */}
            <div className="rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">Nominee Information</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Nominee Name</label>
                  <input
                    type="text"
                    value={formData.nomineeName}
                    onChange={(e) => setFormData({ ...formData, nomineeName: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Relation</label>
                  <input
                    type="text"
                    value={formData.nomineeRelation}
                    onChange={(e) => setFormData({ ...formData, nomineeRelation: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Nominee CNIC</label>
                  <input
                    type="text"
                    value={formData.nomineeNIC}
                    onChange={(e) => setFormData({ ...formData, nomineeNIC: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="12345-1234567-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium">Nominee Address</label>
                  <textarea
                    value={formData.nomineeAddress}
                    onChange={(e) => setFormData({ ...formData, nomineeAddress: e.target.value })}
                    rows={2}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <Link
                href="/customers"
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Customer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


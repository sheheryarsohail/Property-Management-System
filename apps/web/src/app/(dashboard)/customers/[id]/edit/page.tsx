'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

import { Header } from '@/components/layout/header'
import { customersApi } from '@/lib/api'

export default function EditCustomerPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    code: '',
    fullName: '',
    email: '',
    phone: '',
    mobile: '',
    cnic: '',
    address: '',
    nomineeName: '',
    nomineeRelation: '',
    nomineeCnic: '',
  })

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.get(id),
  })

  useEffect(() => {
    if (customer) {
      setFormData({
        code: customer.code ?? '',
        fullName: customer.fullName ?? '',
        email: customer.email ?? '',
        phone: customer.phone ?? customer.mobile ?? '',
        mobile: customer.mobile ?? customer.phone ?? '',
        cnic: customer.cnic ?? customer.nationalId ?? '',
        address: customer.address ?? '',
        nomineeName: customer.nomineeName ?? '',
        nomineeRelation: customer.nomineeRelation ?? '',
        nomineeCnic: customer.nomineeCnic ?? customer.nomineeNIC ?? '',
      })
    }
  }, [customer])

  const updateMutation = useMutation({
    mutationFn: (data: any) => customersApi.update(id, data),
    onSuccess: () => {
      toast.success('Customer updated successfully')
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customer', id] })
      router.push(`/customers/${id}`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update customer')
    },
  })

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    updateMutation.mutate(formData)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <Header title="Edit Customer" />
        <div className="flex-1 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-32 rounded-lg bg-muted" />
            <div className="h-64 rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex flex-col">
        <Header title="Customer Not Found" />
        <div className="flex-1 p-6">
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-sm text-muted-foreground">We couldn't find that customer.</p>
            <Link href="/customers" className="mt-4 inline-block text-sm text-primary hover:underline">
              Back to Customers
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <Header title={`Edit ${customer.fullName ?? 'Customer'}`} />

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-3xl">
          <Link
            href={`/customers/${id}`}
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Customer
          </Link>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">Basic Information</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Customer Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., C-001"
                  />
                </div>
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
                <div>
                  <label className="mb-2 block text-sm font-medium">CNIC</label>
                  <input
                    type="text"
                    value={formData.cnic}
                    onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="12345-1234567-1"
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
                    placeholder="e.g., Jane Doe"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Relation</label>
                  <input
                    type="text"
                    value={formData.nomineeRelation}
                    onChange={(e) => setFormData({ ...formData, nomineeRelation: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Spouse, Son, Daughter"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Nominee CNIC</label>
                  <input
                    type="text"
                    value={formData.nomineeCnic}
                    onChange={(e) => setFormData({ ...formData, nomineeCnic: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="12345-1234567-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Link
                href={`/customers/${id}`}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

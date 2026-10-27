'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter, useParams } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { propertiesApi, customersApi, ownershipsApi } from '@/lib/api'
import { toast } from 'sonner'
import { ArrowLeft, Users, Building2, Calendar, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, getStatusColor } from '@/lib/utils'
import { DatePicker } from '@/components/DatePicker'
import { SearchableSelect } from '@/components/SearchableSelect'

export default function AssignPropertyPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const [customerId, setCustomerId] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [generatePlan, setGeneratePlan] = useState(true)

  const { data: property, isLoading: isPropertyLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => propertiesApi.get(id),
  })

  const [overrides, setOverrides] = useState({
    autoReceiptGeneration: true,
    bookingPrice: '',
    bookingMonths: '1',
    confirmationPrice: '',
    confirmationMonths: '1',
    installmentPrice: '',
    installmentMonths: '50',
    totalPrice: '',
    discount: '',
    ownMoney: '',
  })

  useEffect(() => {
    if (property) {
      setOverrides({
        autoReceiptGeneration: property.autoReceiptGeneration ?? true,
        bookingPrice: property.bookingPrice ? String(property.bookingPrice) : '',
        bookingMonths: property.bookingMonths ? String(property.bookingMonths) : '1',
        confirmationPrice: property.confirmationPrice ? String(property.confirmationPrice) : '',
        confirmationMonths: property.confirmationMonths ? String(property.confirmationMonths) : '1',
        installmentPrice: property.installmentPrice ? String(property.installmentPrice) : '',
        installmentMonths: property.installmentMonths ? String(property.installmentMonths) : '50',
        totalPrice: property.totalPrice ? String(property.totalPrice) : '',
        discount: '',
        ownMoney: '',
      })
    }
  }, [property])

  // Auto-calculate installment price based on overrides
  useEffect(() => {
    const baseTotal = parseFloat(property?.totalPrice || 0);
    const discount = parseFloat(overrides.discount) || 0;
    const ownMoney = parseFloat(overrides.ownMoney) || 0;
    const total = (baseTotal + ownMoney - discount) > 0 ? (baseTotal + ownMoney - discount) : 0;

    if (total > 0) {
      const booking = parseFloat(overrides.bookingPrice) || 0;
      const confirmation = parseFloat(overrides.confirmationPrice) || 0;
      const months = parseInt(overrides.installmentMonths) || 1;
      const installment = (total - booking - confirmation) / months;
      
      setOverrides(prev => {
        const updates: any = {};
        if (prev.totalPrice !== total.toString()) {
          updates.totalPrice = total.toString();
        }
        if (installment > 0 && prev.installmentPrice !== installment.toFixed(2)) {
          updates.installmentPrice = installment.toFixed(2);
        }
        return Object.keys(updates).length > 0 ? { ...prev, ...updates } : prev;
      });
    }
  }, [
    property?.totalPrice,
    overrides.discount,
    overrides.ownMoney,
    overrides.bookingPrice,
    overrides.confirmationPrice,
    overrides.installmentMonths
  ]);

  const { data: customers, isLoading: isCustomersLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.list(),
  })

  const assignMutation = useMutation({
    mutationFn: (data: any) => ownershipsApi.createActive(data),
    onSuccess: () => {
      toast.success('Property assigned successfully')
      queryClient.invalidateQueries({ queryKey: ['property', id] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      router.push(`/properties/${id}`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign property')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!customerId) {
      toast.error('Please select a customer')
      return
    }

    const payloadOverrides = generatePlan ? {
      autoReceiptGeneration: overrides.autoReceiptGeneration,
      bookingPrice: overrides.bookingPrice ? parseFloat(overrides.bookingPrice) : null,
      bookingMonths: overrides.bookingMonths ? parseInt(overrides.bookingMonths) : 1,
      confirmationPrice: overrides.confirmationPrice ? parseFloat(overrides.confirmationPrice) : null,
      confirmationMonths: overrides.confirmationMonths ? parseInt(overrides.confirmationMonths) : 1,
      installmentPrice: overrides.installmentPrice ? parseFloat(overrides.installmentPrice) : null,
      installmentMonths: overrides.installmentMonths ? parseInt(overrides.installmentMonths) : 50,
      totalPrice: overrides.totalPrice ? parseFloat(overrides.totalPrice) : null,
      discount: overrides.discount ? parseFloat(overrides.discount) : null,
      ownMoney: overrides.ownMoney ? parseFloat(overrides.ownMoney) : null,
    } : {
      autoReceiptGeneration: overrides.autoReceiptGeneration,
      bookingPrice: null,
      bookingMonths: null,
      confirmationPrice: null,
      confirmationMonths: null,
      installmentPrice: null,
      installmentMonths: null,
      totalPrice: overrides.totalPrice ? parseFloat(overrides.totalPrice) : null,
      discount: overrides.discount ? parseFloat(overrides.discount) : null,
      ownMoney: overrides.ownMoney ? parseFloat(overrides.ownMoney) : null,
    };

    assignMutation.mutate({
      propertyId: id,
      customerId,
      startDate: new Date(startDate).toISOString(),
      paymentPlanOverrides: payloadOverrides,
    })
  }

  if (isPropertyLoading || isCustomersLoading) {
    return (
      <div className="flex flex-col">
        <Header title="Assign Property" />
        <div className="p-6">Loading...</div>
      </div>
    )
  }

  const isAvailable = property?.status === 'AVAILABLE' || property?.status === 'CANCELLED' || property?.isCancelledAvailable

  return (
    <div className="flex flex-col">
      <Header title={property?.isCancelledAvailable ? `Re-Allot Plot: ${property?.code}` : `Assign Plot: ${property?.code}`} />
      
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-3xl">
          <Link
            href={`/properties/${id}`}
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Property Details
          </Link>

          {!isAvailable ? (
            <div className="rounded-xl border border-dashed border-red-200 bg-red-50 p-12 text-center text-red-800">
              <h3 className="text-lg font-semibold">Property Not Available</h3>
              <p className="mt-2 text-sm">This property is currently {property?.status} and cannot be assigned to a new customer.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Property Summary */}
              <div className="rounded-lg border bg-card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <Building2 className="h-5 w-5 text-primary" />
                  Property Overview
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
                  <div>
                    <p className="text-sm text-muted-foreground">Plot No.</p>
                    <p className="font-semibold">{property.code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <span className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusColor(property?.displayStatus || property?.status)}`}>
                      {property?.displayStatus || property?.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium">{property.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Size</p>
                    <p className="font-medium">{property.sizeSqYd || 'N/A'} sq.yd</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Original Total Price</p>
                    <p className="font-semibold text-primary">{formatCurrency(Number(property.totalPrice || 0))}</p>
                  </div>
                </div>
              </div>

              {/* Payment Plan Configuration */}
              <div className="rounded-lg border bg-card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Payment Plan Configuration
                </h2>
                
                <label className="mb-4 flex items-center gap-3 cursor-pointer p-4 border rounded-md hover:bg-accent/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={generatePlan}
                    onChange={(e) => setGeneratePlan(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-base font-semibold block">Generate Automated Payment Plan</span>
                    <span className="text-sm text-muted-foreground block">
                      Uncheck to handle payments manually via manual receipts. No installments will be generated.
                    </span>
                  </div>
                </label>

                {generatePlan && (
                  <div className="grid gap-4 md:grid-cols-2 p-4 border rounded-md">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium">Own Money</label>
                      <input
                        type="number"
                        step="0.01"
                        value={overrides.ownMoney}
                        onChange={(e) => setOverrides({ ...overrides, ownMoney: e.target.value })}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">Discount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={overrides.discount}
                        onChange={(e) => setOverrides({ ...overrides, discount: e.target.value })}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="0.00"
                      />
                    </div>
                    {(overrides.discount || overrides.ownMoney) && (
                      <div className="md:col-span-2">
                        <p className="mt-1 text-xs text-muted-foreground">
                          Adjusted Total Price: <span className="font-semibold text-primary">{formatCurrency(Number(overrides.totalPrice))}</span>
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium">Booking Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={overrides.bookingPrice}
                        onChange={(e) => setOverrides({ ...overrides, bookingPrice: e.target.value })}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">Booking Installments (Months)</label>
                      <input
                        type="number"
                        value={overrides.bookingMonths}
                        onChange={(e) => setOverrides({ ...overrides, bookingMonths: e.target.value })}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium">Confirmation Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={overrides.confirmationPrice}
                        onChange={(e) => setOverrides({ ...overrides, confirmationPrice: e.target.value })}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">Confirmation Installments (Months)</label>
                      <input
                        type="number"
                        value={overrides.confirmationMonths}
                        onChange={(e) => setOverrides({ ...overrides, confirmationMonths: e.target.value })}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 mt-4 space-y-4 border-t pt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium">Number of Monthly Installments</label>
                        <input
                          type="number"
                          value={overrides.installmentMonths}
                          onChange={(e) => setOverrides({ ...overrides, installmentMonths: e.target.value })}
                          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium">Monthly Installment Amount</label>
                        <input
                          type="number"
                          step="0.01"
                          readOnly
                          value={overrides.installmentPrice}
                          className="w-full rounded-lg border bg-muted px-3 py-2 text-sm font-semibold text-primary focus:outline-none cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                )}
              </div>

              {/* Assignment Details */}
              <div className="rounded-lg border bg-card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <Users className="h-5 w-5 text-primary" />
                  Assignment Details
                </h2>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Select Customer <span className="text-red-500">*</span></label>
                    <SearchableSelect
                      required
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      placeholder="-- Select a Customer --"
                      options={customers?.map((c: any) => ({
                        label: `${c.fullName} (${c.nationalId || c.code})`,
                        value: c.id
                      })) || []}
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Don't see the customer? <Link href="/customers/new" className="text-primary hover:underline">Add a new one</Link>.
                    </p>
                  </div>
                  
                  <div>
                    <label className="mb-2 block text-sm font-medium">Assignment Date</label>
                    <div className="flex rounded-lg border bg-background focus-within:ring-2 focus-within:ring-primary">
                      <span className="flex items-center px-3 border-r bg-muted text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                      </span>
                      <DatePicker
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-transparent px-3 py-2 text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3">
                <Link
                  href={`/properties/${id}`}
                  className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={assignMutation.isPending || !customerId}
                  className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {assignMutation.isPending ? 'Assigning...' : generatePlan ? 'Assign Property & Generate Plan' : 'Assign Property (No Plan)'}
                </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  )
}

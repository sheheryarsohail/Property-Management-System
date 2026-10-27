'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { propertiesApi, customersApi } from '@/lib/api'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { ArrowLeft, Building2, FileSpreadsheet, Edit, MapPin, Ruler, DollarSign, Calendar, FileText, FileCheck, Users, User, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { SearchableSelect } from '@/components/SearchableSelect'
import { toast } from 'sonner'

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  
  const [showEditCustomer, setShowEditCustomer] = useState(false)
  const [selectedNewCustomerId, setSelectedNewCustomerId] = useState('')

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.list(),
    enabled: showEditCustomer,
  })

  const correctCustomerMutation = useMutation({
    mutationFn: (newCustomerId: string) => propertiesApi.correctCustomer(id, newCustomerId),
    onSuccess: () => {
      toast.success('Assigned customer corrected successfully')
      queryClient.invalidateQueries({ queryKey: ['property', id] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      setShowEditCustomer(false)
      setSelectedNewCustomerId('')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to correct customer')
    }
  })

  const handleCorrectCustomer = () => {
    if (!selectedNewCustomerId) {
      toast.error('Please select a customer')
      return
    }
    correctCustomerMutation.mutate(selectedNewCustomerId)
  }
  
  const { data: property, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => propertiesApi.get(id),
  })

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <Header title="Property Details" />
        <div className="flex-1 p-4 sm:p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-28 rounded-xl bg-muted sm:h-32" />
            <div className="h-48 rounded-xl bg-muted sm:h-64" />
          </div>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="flex flex-col">
        <Header title="Property Not Found" />
        <div className="flex-1 p-4 sm:p-6">
          <div className="rounded-xl border border-dashed p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Property not found</h3>
            <Link href="/properties" className="mt-4 inline-block text-sm text-primary hover:underline">
              Back to Properties
            </Link>
          </div>
        </div>
      </div>
    )
  }

const prop: any = property
  const activeCustomerId = prop.ownerships?.find((o: any) => o.status === 'ACTIVE')?.customerId || prop.ownerships?.[0]?.customerId || ''
  const isGulshanEFatima = prop.tenantId === 't_local' || prop.tenant?.name?.toLowerCase().includes('fatima');

  return (
    <div className="flex flex-col">
      <Header title={prop.code} />
      
      <div className="flex-1 space-y-4 p-4 sm:space-y-6 sm:p-6">
        <div className="flex items-center justify-between">
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Properties
          </Link>
        </div>

        {/* Header Card */}
        <div className="rounded-xl border bg-card p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-xl font-bold sm:text-2xl">{prop.code}</h1>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold sm:text-sm ${getStatusColor(prop.displayStatus || prop.status)}`}>
                {prop.displayStatus || prop.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(prop.status === 'AVAILABLE' || prop.isCancelledAvailable || prop.status === 'CANCELLED') && (
                <Link
                  href={`/properties/${id}/assign`}
                  className="flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90"
                >
                  <Users className="h-4 w-4" />
                  {prop.isCancelledAvailable ? 'Re-Allot Plot' : 'Assign Customer'}
                </Link>
              )}
              {prop.status !== 'AVAILABLE' && !prop.isCancelledAvailable && prop.ownerships?.some((o: any) => !o.endDate) && (
                <button
                  onClick={() => setShowEditCustomer(true)}
                  className="flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90"
                >
                  <User className="h-4 w-4" />
                  Edit Customer
                </button>
              )}
              <Link
                href={`/reports/property-ledger?propertyId=${id}`}
                className="flex items-center justify-center gap-2 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 px-4 py-2.5 text-sm font-medium hover:bg-purple-100 transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Financial Ledger
              </Link>
              <Link
                href={`/properties/${id}/edit`}
                className="flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-accent"
              >
                <Edit className="h-4 w-4" />
                Edit Property
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <div className="rounded-xl border bg-card p-4 sm:p-6">
            <h2 className="mb-3 text-lg font-semibold sm:mb-4">Basic Information</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground sm:h-5 sm:w-5" />
                <div>
                  <p className="text-xs text-muted-foreground sm:text-sm">Type</p>
                  <p className="text-sm font-medium sm:text-base">{prop.type || 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground sm:h-5 sm:w-5" />
                <div>
                  <p className="text-xs text-muted-foreground sm:text-sm">Block</p>
                  <p className="text-sm font-medium sm:text-base">{prop.block || 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Ruler className="h-4 w-4 shrink-0 text-muted-foreground sm:h-5 sm:w-5" />
                <div>
                  <p className="text-xs text-muted-foreground sm:text-sm">Size</p>
                  <p className="text-sm font-medium sm:text-base">{prop.sizeSqYd ? `${prop.sizeSqYd} sq.yd` : 'Not specified'}</p>
                </div>
              </div>
              {prop.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground sm:h-5 sm:w-5" />
                  <div>
                    <p className="text-xs text-muted-foreground sm:text-sm">Address</p>
                    <p className="text-sm font-medium sm:text-base">{prop.address}</p>
                  </div>
                </div>
              )}
              {prop.ownerships && prop.ownerships.length > 0 && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 shrink-0 text-muted-foreground sm:h-5 sm:w-5" />
                  <div>
                    <p className="text-xs text-muted-foreground sm:text-sm">Sold Date</p>
                    <p className="text-sm font-medium sm:text-base">
                      {formatDate((prop.ownerships.find((o: any) => !o.endDate) || prop.ownerships[0]).startDate)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Customer */}
          <div className="rounded-xl border bg-card p-4 sm:p-6">
            <h2 className="mb-3 text-lg font-semibold sm:mb-4">Assigned Customers & Transfer History</h2>
            {prop.ownerships?.length > 0 ? (
              <div className="space-y-4">
                {prop.ownerships.map((own: any) => (
                  <div key={own.id} className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{own.customer?.fullName}</p>
                        {!own.customer?.fullName && <p className="text-sm text-muted-foreground">{own.customer?.code}</p>}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${!own.endDate ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                        {!own.endDate ? 'CURRENT OWNER' : 'PREVIOUS OWNER'}
                      </span>
                      {!own.endDate && (
                        <button
                          onClick={() => setShowEditCustomer(true)}
                          className="mt-1 flex items-center justify-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                        >
                          <Edit className="h-3 w-3" />
                          Edit Customer
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Transfer History details */}
                {prop.transfers && prop.transfers.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-dashed">
                    <h3 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">Transfer Records</h3>
                    <div className="space-y-3">
                      {prop.transfers.map((t: any) => (
                        <div key={t.id} className="text-sm rounded-md border border-slate-100 bg-slate-50/50 p-3">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-slate-700">Transferred via {t.transferType}</span>
                            <span className="text-xs text-slate-500">{formatDate(t.transferDate)}</span>
                          </div>
                          <p className="text-muted-foreground text-xs flex items-center gap-1.5">
                            From <span className="font-medium text-slate-700">{t.from?.fullName || t.from?.code}</span>
                            <span>→</span>
                            To <span className="font-medium text-slate-700">{t.to?.fullName || t.to?.code}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not assigned to any customer.</p>
            )}
          </div>

          {/* Pricing Information */}
          <div className="rounded-xl border bg-card p-4 sm:p-6">
            <h2 className="mb-3 text-lg font-semibold sm:mb-4">Pricing & Financials</h2>
            <div className="space-y-3">
              {prop.totalPrice && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Base Plot Price</span>
                  <span className="font-semibold">{formatCurrency(Number(prop.totalPrice))}</span>
                </div>
              )}
              {Number(prop.ownMoney || 0) > 0 && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Own Money</span>
                  <span className="font-semibold">{formatCurrency(Number(prop.ownMoney))}</span>
                </div>
              )}
              {Number(prop.discount || 0) > 0 && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-semibold">{formatCurrency(Number(prop.discount))}</span>
                </div>
              )}
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Development Charges</span>
                <span className="font-semibold">
                  {formatCurrency(Number(prop.developmentCharges || 0))}
                </span>
              </div>
              {(Number(prop.totalPrice || 0) > 0 || Number(prop.developmentCharges || 0) > 0) && (
                <div className="flex justify-between border-b pb-2 pt-1 bg-slate-50 dark:bg-slate-900/40 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="font-semibold text-foreground">Grand Total Price</span>
                  <span className="font-bold text-foreground text-base">
                    {formatCurrency(Number(prop.totalPrice || 0) + Number(prop.developmentCharges || 0))}
                  </span>
                </div>
              )}
              {Number(prop.bookingPrice || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Booking</span>
                  <span className="text-sm">{formatCurrency(Number(prop.bookingPrice))}</span>
                </div>
              )}
              {Number(prop.confirmationPrice || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Confirmation</span>
                  <span className="text-sm">{formatCurrency(Number(prop.confirmationPrice))}</span>
                </div>
              )}
              {Number(prop.installmentPrice || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Installment</span>
                  <span className="text-sm">{formatCurrency(Number(prop.installmentPrice))}</span>
                </div>
              )}
              {Number(prop.halfYearlyPrice || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Half-Yearly</span>
                  <span className="text-sm">{formatCurrency(Number(prop.halfYearlyPrice))}</span>
                </div>
              )}
              {Number(prop.yearlyPrice || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Yearly</span>
                  <span className="text-sm">{formatCurrency(Number(prop.yearlyPrice))}</span>
                </div>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="rounded-xl border bg-card p-4 sm:p-6">
            <h2 className="mb-3 text-lg font-semibold sm:mb-4">Features</h2>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className={`rounded-lg border p-2.5 sm:p-3 ${prop.isCorner ? 'border-green-500 bg-green-50' : ''}`}>
                <p className="text-sm font-medium">Corner Plot</p>
                <p className="text-xs text-muted-foreground">{prop.isCorner ? 'Yes' : 'No'}</p>
              </div>
              <div className={`rounded-lg border p-2.5 sm:p-3 ${prop.isWestOpen ? 'border-green-500 bg-green-50' : ''}`}>
                <p className="text-sm font-medium">West Open</p>
                <p className="text-xs text-muted-foreground">{prop.isWestOpen ? 'Yes' : 'No'}</p>
              </div>
              <div className={`rounded-lg border p-2.5 sm:p-3 ${prop.isRoadFacing ? 'border-green-500 bg-green-50' : ''}`}>
                <p className="text-sm font-medium">Road Facing</p>
                <p className="text-xs text-muted-foreground">{prop.isRoadFacing ? 'Yes' : 'No'}</p>
              </div>
              <div className={`rounded-lg border p-2.5 sm:p-3 ${prop.isParkingFacing ? 'border-green-500 bg-green-50' : ''}`}>
                <p className="text-sm font-medium">Parking Facing</p>
                <p className="text-xs text-muted-foreground">{prop.isParkingFacing ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border bg-card p-4 sm:p-6">
          <h2 className="mb-3 text-lg font-semibold sm:mb-4">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            <Link
              href={`/receipts/new?propertyId=${id}${activeCustomerId ? `&customerId=${activeCustomerId}` : ''}`}
              className="flex items-center gap-3 rounded-xl border p-3 transition hover:bg-accent sm:p-4"
            >
              <CreditCard className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Record Receipt</p>
                <p className="hidden text-xs text-muted-foreground sm:block">Record a new receipt</p>
              </div>
            </Link>
            <Link
              href={`/reports/property-ledger?propertyId=${id}`}
              className="flex items-center gap-3 rounded-xl border p-3 transition hover:bg-accent sm:p-4"
            >
              <Building2 className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Property Ledger</p>
                <p className="hidden text-xs text-muted-foreground sm:block">View transactions</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Print Actions (Gulshan-e-Fatima only) */}
        {isGulshanEFatima && (
          <div className="rounded-xl border bg-card p-4 sm:p-6">
            <h2 className="mb-3 text-lg font-semibold sm:mb-4">Print Forms (Gulshan-e-Fatima)</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href={`/print/application-form/${id}`}
                target="_blank"
                className="flex items-center gap-3 rounded-xl border p-3 transition hover:bg-accent sm:p-4"
              >
                <FileText className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">Application Form</p>
                  <p className="hidden text-xs text-muted-foreground sm:block">Print official application form</p>
                </div>
              </Link>
              <Link
                href={`/print/allocation-letter/${id}`}
                target="_blank"
                className="flex items-center gap-3 rounded-xl border p-3 transition hover:bg-accent sm:p-4"
              >
                <FileText className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">Allocation Letter</p>
                  <p className="hidden text-xs text-muted-foreground sm:block">Print official letter</p>
                </div>
              </Link>
              <Link
                href={`/print/site-plan/${id}`}
                target="_blank"
                className="flex items-center gap-3 rounded-xl border p-3 transition hover:bg-accent sm:p-4"
              >
                <MapPin className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">Site Plan</p>
                  <p className="hidden text-xs text-muted-foreground sm:block">Print property map</p>
                </div>
              </Link>
              <Link
                href={`/print/provisional-possession/${id}`}
                target="_blank"
                className="flex items-center gap-3 rounded-xl border p-3 transition hover:bg-accent sm:p-4"
              >
                <FileCheck className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">Provisional Possession</p>
                  <p className="hidden text-xs text-muted-foreground sm:block">Print possession letter</p>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Correct Customer Modal */}
      {showEditCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#fafafa] border border-slate-200 p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-bold">Correct Assigned Customer</h2>
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium">Select New Customer</label>
              <SearchableSelect
                value={selectedNewCustomerId}
                onChange={(e) => setSelectedNewCustomerId(e.target.value)}
                placeholder="-- Select a Customer --"
                options={customers?.map((c: any) => ({
                  label: `${c.fullName} (${c.nationalId || c.code})`,
                  value: c.id
                })) || []}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEditCustomer(false)}
                className="rounded-lg border border-slate-200 bg-white/50 px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCorrectCustomer}
                disabled={correctCustomerMutation.isPending || !selectedNewCustomerId}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-primary/90 disabled:opacity-50"
              >
                {correctCustomerMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { developmentChargesApi, exportCsv } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { 
  Building, 
  Search, 
  Plus,
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileSpreadsheet,
  X,
  CreditCard
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { DatePicker } from '@/components/DatePicker'

export default function DevelopmentChargesPage() {
  const queryClient = useQueryClient()

  // Phases state (defaults to Phase 1, can add Phase 2, 3, etc.)
  const [phases, setPhases] = useState<number[]>([1])
  const [activePhase, setActivePhase] = useState<number>(1)

  // Load saved phases from localStorage on initial render
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pms_dev_charges_phases')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPhases(parsed)
        }
      }
    } catch (e) {}
  }, [])

  // Properties tab state
  const [propSearch, setPropSearch] = useState('')
  const [propFilter, setPropFilter] = useState<'ALL' | 'CONFIGURED' | 'NOT_SET' | 'PENDING' | 'PARTIAL' | 'PAID'>('ALL')
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null)
  const [chargeAmount, setChargeAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [ratePerSqYd, setRatePerSqYd] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 1. Fetch properties dev charges for activePhase
  const { data: propResponse, isLoading: isPropsLoading } = useQuery({
    queryKey: ['dev-charges-properties', propSearch, activePhase],
    queryFn: () => developmentChargesApi.properties({ search: propSearch || undefined, phase: activePhase }),
  })

  // Sync available phases from backend if discovered
  useEffect(() => {
    if (propResponse?.phases && Array.isArray(propResponse.phases)) {
      setPhases((prev) => {
        const combined = Array.from(new Set([...prev, ...propResponse.phases])).sort((a: number, b: number) => a - b)
        if (JSON.stringify(combined) !== JSON.stringify(prev)) {
          try {
            localStorage.setItem('pms_dev_charges_phases', JSON.stringify(combined))
          } catch (e) {}
          return combined
        }
        return prev
      })
    }
  }, [propResponse?.phases])

  const handleAddPhase = () => {
    const nextPhase = (phases.length > 0 ? Math.max(...phases) : 1) + 1
    const updated = [...phases, nextPhase].sort((a, b) => a - b)
    setPhases(updated)
    setActivePhase(nextPhase)
    try {
      localStorage.setItem('pms_dev_charges_phases', JSON.stringify(updated))
    } catch (e) {}
    toast.success(`Development charges ${nextPhase} added`)
  }

  const properties = propResponse?.properties || []
  const propSummary = propResponse?.summary || {
    totalProperties: 0,
    configuredProperties: 0,
    totalDevValue: 0,
    totalCollected: 0,
    totalRemaining: 0,
  }

  // Filtered properties
  const filteredProperties = properties.filter((p: any) => {
    if (propFilter === 'CONFIGURED') return p.developmentCharges > 0
    if (propFilter === 'NOT_SET') return p.status === 'NOT_SET'
    if (propFilter === 'PENDING') return p.status === 'PENDING'
    if (propFilter === 'PARTIAL') return p.status === 'PARTIAL'
    if (propFilter === 'PAID') return p.status === 'PAID'
    return true
  })

  // Mutation to set single property charge
  const setChargeMutation = useMutation({
    mutationFn: ({ propertyId, amount, dueDate, phase }: { propertyId: string; amount: number; dueDate?: string; phase?: number }) =>
      developmentChargesApi.setPropertyCharge(propertyId, { amount, dueDate, phase }),
    onSuccess: () => {
      toast.success(`Development charges (Phase ${activePhase}) updated successfully`)
      setIsModalOpen(false)
      setSelectedProperty(null)
      setChargeAmount('')
      setDueDate('')
      setRatePerSqYd('')
      queryClient.invalidateQueries({ queryKey: ['dev-charges-properties'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update development charges')
    },
  })

  const openSetChargeModal = (property: any) => {
    setSelectedProperty(property)
    setChargeAmount(property.developmentCharges ? String(property.developmentCharges) : '')
    if (property.invoice?.dueDate) {
      setDueDate(new Date(property.invoice.dueDate).toISOString().split('T')[0])
    } else {
      const d = new Date()
      d.setDate(d.getDate() + 30)
      setDueDate(d.toISOString().split('T')[0])
    }
    setRatePerSqYd('')
    setIsModalOpen(true)
  }

  const handleRateChange = (rateStr: string) => {
    setRatePerSqYd(rateStr)
    const rate = parseFloat(rateStr) || 0
    const size = selectedProperty?.sizeSqYd ? Number(selectedProperty.sizeSqYd) : 0
    if (rate > 0 && size > 0) {
      setChargeAmount(String(Math.round(rate * size)))
    }
  }

  const handleSaveCharge = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProperty) return
    const amt = parseFloat(chargeAmount)
    if (isNaN(amt) || amt < 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setChargeMutation.mutate({
      propertyId: selectedProperty.id,
      amount: amt,
      dueDate: dueDate || undefined,
      phase: activePhase,
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200"><CheckCircle2 className="h-3 w-3" /> PAID</span>
      case 'PARTIAL':
        return <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200"><Clock className="h-3 w-3" /> PARTIAL</span>
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200"><AlertCircle className="h-3 w-3" /> PENDING</span>
      default:
        return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">NOT SET</span>
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Development Charges"
        actions={
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={() => {
                const csv = filteredProperties.map((p: any) => ({
                  'Property Code': p.code,
                  'Size (Sq.Yd)': p.sizeSqYd || '',
                  'Owner': p.customer?.fullName || 'Unassigned',
                  'Dev Charges Cost': p.developmentCharges,
                  'Invoiced': p.invoicedAmount,
                  'Paid': p.paidAmount,
                  'Balance': p.balance,
                  'Status': p.status,
                }))
                exportCsv(csv, `dev-charges-phase-${activePhase}.csv`)
                toast.success('CSV exported')
              }}
              className="flex items-center gap-1.5 rounded-lg border bg-white px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium hover:bg-slate-50 shadow-2xs"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">CSV</span>
            </button>
            <Link
              href="/receipts/new?category=DEVELOPMENT"
              className="flex items-center gap-1.5 rounded-lg bg-primary px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-primary-foreground hover:bg-primary/90 shadow-2xs"
            >
              <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Record Development Receipt</span>
              <span className="sm:hidden">Receipt</span>
            </Link>
          </div>
        }
      />

      <div className="flex-1 space-y-4 sm:space-y-6 p-3 sm:p-6">
        {/* Navigation Tabs (Phases) */}
        <div className="flex items-center border-b border-border gap-1 overflow-x-auto">
          {phases.map((phaseNum) => (
            <button
              key={phaseNum}
              onClick={() => setActivePhase(phaseNum)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activePhase === phaseNum
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Building className="h-4 w-4" />
              Phase {phaseNum}
            </button>
          ))}
          <button
            onClick={handleAddPhase}
            title="Add Development Charges Phase"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors ml-2 my-2 border border-dashed border-primary/40 whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Phase
          </button>
        </div>

        {/* Properties View for Active Phase */}
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">Total Plots</p>
              <p className="text-2xl font-bold mt-1">{propSummary.totalProperties}</p>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-medium text-primary">{propSummary.configuredProperties}</span> configured
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">Total Cost</p>
              <p className="text-xl font-bold mt-1 text-primary">{formatCurrency(propSummary.totalDevValue)}</p>
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">Collected</p>
              <p className="text-xl font-bold mt-1 text-emerald-600">{formatCurrency(propSummary.totalCollected)}</p>
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="text-xl font-bold mt-1 text-amber-600">{formatCurrency(propSummary.totalRemaining)}</p>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search plot code, owner..."
                  value={propSearch}
                  onChange={(e) => setPropSearch(e.target.value)}
                  className="h-9 w-full rounded-lg border bg-background pl-8 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <select
                value={propFilter}
                onChange={(e: any) => setPropFilter(e.target.value)}
                className="h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ALL">All Properties ({properties.length})</option>
                <option value="CONFIGURED">Configured with Dev Charges</option>
                <option value="NOT_SET">Cost Not Set</option>
                <option value="PENDING">Pending Payment</option>
                <option value="PARTIAL">Partial Payment</option>
                <option value="PAID">Fully Paid</option>
              </select>
            </div>
          </div>

          {/* Properties Table */}
          {isPropsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/40 border" />
              ))}
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
              <Building className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-3 text-base font-semibold">No properties found</h3>
              <p className="text-sm text-muted-foreground">Adjust your search or filter to see properties</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plot / Code</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">Size</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Owner / Customer</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Dev Charges (PKR)</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Paid (PKR)</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Balance (PKR)</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredProperties.map((p: any) => (
                      <tr key={p.id} className="transition hover:bg-muted/20">
                        <td className="px-4 py-3 font-semibold text-primary">{p.code}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground">
                          {p.sizeSqYd ? `${p.sizeSqYd} sq.yd` : '-'}
                        </td>
                        <td className="px-4 py-3">
                          {p.customer ? (
                            <Link 
                              href={`/customers/${p.customer.id}`}
                              className="font-medium hover:underline hover:text-primary"
                            >
                              {p.customer.fullName}
                            </Link>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Unassigned (Available)</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {p.developmentCharges > 0 ? (
                            formatCurrency(p.developmentCharges)
                          ) : (
                            <span className="text-xs text-muted-foreground">Not set</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                          {p.paidAmount > 0 ? formatCurrency(p.paidAmount) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-amber-600">
                          {p.balance > 0 ? formatCurrency(p.balance) : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {getStatusBadge(p.status)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openSetChargeModal(p)}
                              className="rounded-lg border bg-background px-2.5 py-1 text-xs font-medium hover:bg-accent transition"
                            >
                              {p.developmentCharges > 0 ? 'Edit Cost' : 'Set Cost'}
                            </button>
                            {p.customer && p.balance > 0 && p.status !== 'VOID' && p.invoice?.status !== 'VOID' && (
                              <Link
                                href={`/receipts/new?propertyId=${p.id}&customerId=${p.customer.id}&invoiceId=${p.invoice?.id || ''}&category=DEVELOPMENT`}
                                className="rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-xs font-medium hover:bg-emerald-100 transition"
                              >
                                Pay
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Set / Edit Development Charges for a Property */}
      {isModalOpen && selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-[#fafafa] p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-lg font-bold">Phase {activePhase} Charges</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Property <span className="font-semibold text-primary">{selectedProperty.code}</span>
                  {selectedProperty.sizeSqYd && ` • ${selectedProperty.sizeSqYd} sq.yd`}
                  {selectedProperty.customer && ` • Owner: ${selectedProperty.customer.fullName}`}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCharge} className="space-y-4">
              {/* Optional Rate Helper */}
              {selectedProperty.sizeSqYd && (
                <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Rate Calculator (Optional)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Rate (PKR / sq.yd)"
                      value={ratePerSqYd}
                      onChange={(e) => handleRateChange(e.target.value)}
                      className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      × {selectedProperty.sizeSqYd} sq.yd
                    </span>
                  </div>
                </div>
              )}

              {/* Development Charges Amount */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Phase {activePhase} Cost (PKR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-semibold text-primary text-base"
                  placeholder="e.g., 250000"
                />

              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Invoice Due Date
                </label>
                <DatePicker
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={setChargeMutation.isPending}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {setChargeMutation.isPending ? 'Saving...' : 'Save & Sync Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

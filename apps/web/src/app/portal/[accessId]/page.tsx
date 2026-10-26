'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { portalApi } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  Building2, 
  User, 
  CreditCard,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
  Lock,
  ShieldCheck,
  CheckCircle2,
  ArrowRightLeft,
  ChevronRight,
  Home,
  LogOut,
  Clock,
  Layers
} from 'lucide-react'

export default function CustomerPortalPage() {
  const { accessId } = useParams<{ accessId: string }>()
  const router = useRouter()

  const { data, isLoading, error } = useQuery({
    queryKey: ['portal', accessId],
    queryFn: () => portalApi.get(accessId),
    retry: false
  })

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900 p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-800">SU Developers</h2>
            <p className="text-xs text-slate-500">Loading customer portal...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-md">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 border border-rose-100 mb-5">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Access Denied</h1>
          <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
            This customer portal link is invalid, expired, or has been disabled by the administration.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/portal/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary/95 transition"
            >
              Sign In with PIN
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { customer, summary, properties = [] } = data

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans selection:bg-primary selection:text-white">
      {/* Top Header Bar */}
      <div className="relative sm:sticky sm:top-2 z-40 mx-auto max-w-6xl px-3 sm:px-6 pt-2 sm:pt-0">
        <header className="flex min-h-[3.75rem] items-center justify-between rounded-xl sm:rounded-2xl border border-white/60 bg-white/80 backdrop-blur-md px-4 sm:px-6 shadow-xs transition-all">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white font-extrabold text-base shadow-sm">
              SU
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-slate-900 block leading-tight">
                SU Developers
              </span>
              <p className="text-[11px] text-slate-500 leading-none mt-0.5">
                Marketed & Managed by <span className="font-semibold text-primary">SS Estate & Marketing</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition shadow-2xs"
            >
              <Home className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <Link
              href="/portal/login"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition shadow-2xs"
              title="Exit Portal"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Exit</span>
            </Link>
          </div>
        </header>
      </div>

      {/* Main Content Area */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8">
        
        {/* Customer Profile Card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold">
                <User className="h-8 w-8" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                    {customer.fullName || 'Valued Member'}
                  </h1>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-mono font-bold text-slate-700 border border-slate-200">
                    {customer.code}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Authenticated Customer Record
                </p>
              </div>
            </div>

            {/* Contact Details */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600">
              {customer.nationalId && (
                <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-primary" />
                  <span className="font-mono">{customer.nationalId}</span>
                </div>
              )}
              {(customer.phone || customer.mobile) && (
                <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  <span>{customer.phone || customer.mobile}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span className="max-w-[200px] truncate">{customer.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Portfolio Summary Stats */}
          <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Properties</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{properties.length}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Plot Value</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{formatCurrency(summary.totalValue || 0)}</p>
            </div>
            <div className="bg-emerald-50/60 rounded-xl p-3.5 border border-emerald-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Plot Cost Paid</p>
              <p className="text-xl font-black text-emerald-700 mt-0.5">{formatCurrency(summary.totalPlotPaid ?? summary.totalPaid ?? 0)}</p>
            </div>
            <div className="bg-blue-50/60 rounded-xl p-3.5 border border-blue-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-800">Dev Charges Paid</p>
              <p className="text-xl font-black text-blue-700 mt-0.5">{formatCurrency(summary.totalDevPaid || 0)}</p>
            </div>
          </div>
        </section>

        {/* Properties Breakdown */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Enrolled Plots & Properties
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              {properties.length} Active {properties.length === 1 ? 'Holding' : 'Holdings'}
            </span>
          </div>

          {properties.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-slate-400 mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Active Properties Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No active property files are currently associated with this customer ID.
              </p>
            </div>
          ) : (
            properties.map((item: any) => {
              const { property, status, previousOwner, financials, receipts = [] } = item
              const isPlotFullyPaid = status === 'FULLY PAID' || financials.plotRemaining <= 0

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-6"
                >
                  {/* Property Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                        <span className="text-2xl font-black tracking-tight text-slate-900">
                          Plot {property.code}
                        </span>
                        {property.title && property.title !== property.code && (
                          <span className="text-base font-bold text-slate-600">
                            • {property.title}
                          </span>
                        )}
                        {isPlotFullyPaid ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            PLOT COST FULLY PAID
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 border border-blue-200 px-3 py-1 text-xs font-bold text-blue-800">
                            INSTALLMENTS ACTIVE
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        {property.sizeSqYd && (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                            {property.sizeSqYd} Sq. Yards
                          </span>
                        )}
                        {property.type && (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                            {property.type}
                          </span>
                        )}
                        {property.block && <span>Block: {property.block}</span>}
                        {property.sector && <span>Sector: {property.sector}</span>}
                        {property.phase && <span>Phase: {property.phase}</span>}
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Official Value</p>
                      <p className="text-xl font-black text-slate-900">{formatCurrency(financials.plotPrice)}</p>
                    </div>
                  </div>

                  {/* Transfer Details Card (Name and Date ONLY) */}
                  {previousOwner && previousOwner.previousOwnerName && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-primary">
                          <ArrowRightLeft className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                            Ownership Transfer Record
                          </h4>
                          <p className="text-sm font-medium text-slate-800 mt-0.5">
                            Transferred from <span className="font-bold text-slate-900">{previousOwner.previousOwnerName}</span> on{' '}
                            <span className="font-semibold text-primary">
                              {formatDate(previousOwner.transferDate)}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Financials Split: Plot Installments vs Development Charges */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* 1. Plot Installments Card */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Plot Cost Installments
                          </h4>
                        </div>
                        {isPlotFullyPaid ? (
                          <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-xs font-bold">
                            100% Paid
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-200 text-slate-700 px-2 py-0.5 text-xs font-semibold">
                            {financials.plotPaidPercentage}% Complete
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center mb-4">
                        <div className="rounded-lg bg-white p-2 sm:p-3 border border-slate-200 shadow-2xs">
                          <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-500">Total Price</p>
                          <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 sm:mt-1 truncate">{formatCurrency(financials.plotPrice)}</p>
                        </div>
                        <div className="rounded-lg bg-white p-2 sm:p-3 border border-slate-200 shadow-2xs">
                          <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-500">Total Paid</p>
                          <p className="text-xs sm:text-sm font-bold text-emerald-600 mt-0.5 sm:mt-1 truncate">{formatCurrency(financials.plotPaid)}</p>
                        </div>
                        <div className="rounded-lg bg-white p-2 sm:p-3 border border-slate-200 shadow-2xs">
                          <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-500">Remaining</p>
                          <p className="text-xs sm:text-sm font-bold text-slate-700 mt-0.5 sm:mt-1 truncate">
                            {formatCurrency(Math.max(0, financials.plotRemaining))}
                          </p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, financials.plotPaidPercentage)}%` }}
                        />
                      </div>
                    </div>

                    {/* 2. Development Charges Card */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Development Charges
                          </h4>
                        </div>
                        <span className="rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 text-xs font-bold">
                          {financials.devPaidPercentage}% Paid
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center mb-4">
                        <div className="rounded-lg bg-white p-2 sm:p-3 border border-slate-200 shadow-2xs">
                          <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-500">Total Dev</p>
                          <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 sm:mt-1 truncate">{formatCurrency(financials.devTotal)}</p>
                        </div>
                        <div className="rounded-lg bg-white p-2 sm:p-3 border border-slate-200 shadow-2xs">
                          <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-500">Paid Dev</p>
                          <p className="text-xs sm:text-sm font-bold text-blue-600 mt-0.5 sm:mt-1 truncate">{formatCurrency(financials.devPaid)}</p>
                        </div>
                        <div className="rounded-lg bg-white p-2 sm:p-3 border border-slate-200 shadow-2xs">
                          <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-500">Remaining</p>
                          <p className="text-xs sm:text-sm font-bold text-slate-700 mt-0.5 sm:mt-1 truncate">
                            {formatCurrency(Math.max(0, financials.devRemaining))}
                          </p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, financials.devPaidPercentage)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Arrears notice if overdue */}
                  {financials.arrears > 0 && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 flex items-center justify-between text-xs">
                      <span className="text-rose-800 font-semibold">Current Outstanding Due/Arrears:</span>
                      <span className="font-bold text-rose-700 text-sm">{formatCurrency(financials.arrears)}</span>
                    </div>
                  )}

                  {/* Payment Ledger (Read-Only: Strictly no downloads) */}
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Payment Ledger ({receipts.length} Transactions)
                        </h5>
                      </div>
                      <span className="text-xs font-medium text-slate-500">
                        Official Receipts
                      </span>
                    </div>

                    {receipts.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-500">
                        No official payment receipts recorded yet for this property tenure.
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                        {receipts.map((r: any) => (
                          <div 
                            key={r.id} 
                            className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                                <CreditCard className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-slate-900">
                                    Receipt #{r.receiptNo}
                                  </span>
                                  {r.category && (
                                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                                      {r.category}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-slate-400" />
                                    {formatDate(r.receiptDate)}
                                  </span>
                                  {r.method && <span>• {r.method}</span>}
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-sm sm:text-base font-extrabold text-emerald-600">
                                +{formatCurrency(r.amount)}
                              </p>
                              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {r.status === 'POSTED' ? 'PAID' : r.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </section>

        {/* Customer Support Footer Card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center space-y-2 shadow-xs">
          <p className="text-xs uppercase font-bold tracking-widest text-primary">
            Customer Support & Assistance
          </p>
          <h3 className="text-base font-bold text-slate-900">
            Questions regarding your plot statement or payment schedule?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Please reach out to our client desk at SS Estate & Marketing for any balance reconciliations, receipt inquiries, or transfer documentation.
          </p>
          <div className="pt-2 text-xs text-slate-400">
            SU Developers • Marketed & Managed by SS Estate & Marketing
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} SU Developers. All rights reserved.</p>
        <p className="mt-1 text-[11px] text-slate-400">
          Marketed & Managed Exclusively by SS Estate & Marketing
        </p>
      </footer>
    </div>
  )
}

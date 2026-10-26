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
  Sparkles,
  Clock,
  Layers,
  ArrowUpRight
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
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100 p-6">
        <div className="relative flex flex-col items-center gap-4 text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
          <div className="space-y-1">
            <h2 className="text-lg font-bold tracking-tight text-white">SU Developers</h2>
            <p className="text-xs text-slate-400">Loading your verified customer portal...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-6">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">Access Denied</h1>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            This customer portal link is invalid, expired, or has been disabled by the administration.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/portal/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition"
            >
              Portal Login
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 transition"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { customer, summary, properties = [] } = data

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 antialiased selection:bg-emerald-500 selection:text-white">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-cyan-500/10 blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[130px]" />
      </div>

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 font-black text-slate-950 shadow-md shadow-emerald-500/20">
              SU
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-white">SU Developers</span>
                <span className="hidden sm:inline-flex rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  Verified Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Marketed & Managed by <span className="text-slate-300 font-medium">SS Estate & Marketing</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition"
            >
              <Home className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <Link
              href="/portal/login"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30 transition"
              title="Exit Portal"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Exit</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8">
        
        {/* Customer Profile Glass Card */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-white/[0.02] p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
                <User className="h-8 w-8 text-slate-950" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    {customer.fullName || 'Valued Member'}
                  </h1>
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-mono font-semibold text-emerald-400 border border-white/10">
                    {customer.code}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  Authenticated Customer Account
                </p>
              </div>
            </div>

            {/* Quick Contact Chips */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-300">
              {customer.nationalId && (
                <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="font-mono">{customer.nationalId}</span>
                </div>
              )}
              {(customer.phone || customer.mobile) && (
                <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5">
                  <Phone className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{customer.phone || customer.mobile}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="max-w-[200px] truncate">{customer.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Portfolio Highlights Bar */}
          <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Properties</p>
              <p className="text-xl font-black text-white mt-0.5">{properties.length}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Total Plot Value</p>
              <p className="text-xl font-black text-white mt-0.5">{formatCurrency(summary.totalValue || 0)}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Plot Cost Paid</p>
              <p className="text-xl font-black text-emerald-400 mt-0.5">{formatCurrency(summary.totalPaid || 0)}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Dev Charges Paid</p>
              <p className="text-xl font-black text-cyan-400 mt-0.5">{formatCurrency(summary.totalDevPaid || 0)}</p>
            </div>
          </div>
        </section>

        {/* Properties Breakdown */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Building2 className="h-5 w-5 text-emerald-400" />
              Enrolled Plots & Properties
            </h2>
            <span className="text-xs text-slate-400">
              {properties.length} Active {properties.length === 1 ? 'Holding' : 'Holdings'}
            </span>
          </div>

          {properties.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-md">
              <Building2 className="mx-auto h-12 w-12 text-slate-600 mb-3" />
              <h3 className="text-lg font-bold text-white">No Active Properties Found</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
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
                  className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/[0.04] to-transparent p-5 sm:p-7 backdrop-blur-xl shadow-2xl transition hover:border-white/20"
                >
                  {/* Property Header Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                        <span className="text-2xl font-black tracking-tight text-white">
                          Plot {property.code}
                        </span>
                        {property.title && property.title !== property.code && (
                          <span className="text-base font-semibold text-slate-300">
                            • {property.title}
                          </span>
                        )}
                        {isPlotFullyPaid ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-300 shadow-sm shadow-emerald-500/20">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            PLOT COST FULLY PAID
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 px-3 py-1 text-xs font-bold text-cyan-300">
                            INSTALLMENTS ACTIVE
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        {property.sizeSqYd && (
                          <span className="rounded-lg bg-white/5 border border-white/10 px-2 py-0.5 font-medium text-slate-300">
                            {property.sizeSqYd} Sq. Yards
                          </span>
                        )}
                        {property.type && (
                          <span className="rounded-lg bg-white/5 border border-white/10 px-2 py-0.5 font-medium text-slate-300">
                            {property.type}
                          </span>
                        )}
                        {property.block && <span>Block: {property.block}</span>}
                        {property.sector && <span>Sector: {property.sector}</span>}
                        {property.phase && <span>Phase: {property.phase}</span>}
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Official Value</p>
                      <p className="text-xl font-black text-white">{formatCurrency(financials.plotPrice)}</p>
                    </div>
                  </div>

                  {/* Transfer Details Card (Name and Date ONLY - strictly no cancellation info) */}
                  {previousOwner && previousOwner.previousOwnerName && (
                    <div className="my-5 rounded-2xl border border-cyan-500/30 bg-cyan-950/30 p-4 backdrop-blur-md">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          <ArrowRightLeft className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                            Verified Ownership Transfer Record
                          </h4>
                          <p className="text-sm font-medium text-slate-200 mt-0.5">
                            Transferred from <span className="font-bold text-white">{previousOwner.previousOwnerName}</span> on{' '}
                            <span className="font-semibold text-cyan-200">
                              {formatDate(previousOwner.transferDate)}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Financials Split Grid: Plot Installments vs Development Charges */}
                  <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 1. Plot Installments Card */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                            Plot Cost Installments
                          </h4>
                        </div>
                        {isPlotFullyPaid ? (
                          <span className="rounded-full bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[11px] font-bold">
                            100% Paid
                          </span>
                        ) : (
                          <span className="rounded-full bg-white/10 text-slate-300 px-2 py-0.5 text-[11px] font-medium">
                            {financials.plotPaidPercentage}% Complete
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center mb-4">
                        <div className="rounded-xl bg-black/20 p-3 border border-white/5">
                          <p className="text-[10px] uppercase font-medium text-slate-400">Total Price</p>
                          <p className="text-sm font-bold text-white mt-1">{formatCurrency(financials.plotPrice)}</p>
                        </div>
                        <div className="rounded-xl bg-black/20 p-3 border border-white/5">
                          <p className="text-[10px] uppercase font-medium text-slate-400">Total Paid</p>
                          <p className="text-sm font-bold text-emerald-400 mt-1">{formatCurrency(financials.plotPaid)}</p>
                        </div>
                        <div className="rounded-xl bg-black/20 p-3 border border-white/5">
                          <p className="text-[10px] uppercase font-medium text-slate-400">Remaining</p>
                          <p className="text-sm font-bold text-slate-300 mt-1">
                            {formatCurrency(Math.max(0, financials.plotRemaining))}
                          </p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, financials.plotPaidPercentage)}%` }}
                        />
                      </div>
                    </div>

                    {/* 2. Development Charges Card */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                            Development Charges
                          </h4>
                        </div>
                        <span className="rounded-full bg-cyan-500/10 text-cyan-300 px-2 py-0.5 text-[11px] font-medium">
                          {financials.devPaidPercentage}% Paid
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center mb-4">
                        <div className="rounded-xl bg-black/20 p-3 border border-white/5">
                          <p className="text-[10px] uppercase font-medium text-slate-400">Total Dev</p>
                          <p className="text-sm font-bold text-white mt-1">{formatCurrency(financials.devTotal)}</p>
                        </div>
                        <div className="rounded-xl bg-black/20 p-3 border border-white/5">
                          <p className="text-[10px] uppercase font-medium text-slate-400">Paid Dev</p>
                          <p className="text-sm font-bold text-cyan-400 mt-1">{formatCurrency(financials.devPaid)}</p>
                        </div>
                        <div className="rounded-xl bg-black/20 p-3 border border-white/5">
                          <p className="text-[10px] uppercase font-medium text-slate-400">Remaining</p>
                          <p className="text-sm font-bold text-slate-300 mt-1">
                            {formatCurrency(Math.max(0, financials.devRemaining))}
                          </p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, financials.devPaidPercentage)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Arrears notice if overdue */}
                  {financials.arrears > 0 && (
                    <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-950/20 p-3.5 flex items-center justify-between text-xs">
                      <span className="text-rose-300 font-medium">Current Outstanding Due/Arrears:</span>
                      <span className="font-bold text-rose-400 text-sm">{formatCurrency(financials.arrears)}</span>
                    </div>
                  )}

                  {/* Verified Payment Ledger (Read-Only: Strictly no downloads) */}
                  <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/[0.02]">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-emerald-400" />
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          Payment Ledger ({receipts.length} Transactions)
                        </h5>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Official Receipts Verified
                      </span>
                    </div>

                    {receipts.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-500">
                        No official payment receipts recorded yet for this property tenure.
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
                        {receipts.map((r: any) => (
                          <div 
                            key={r.id} 
                            className="flex items-center justify-between p-4 hover:bg-white/[0.03] transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CreditCard className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-white">
                                    Receipt #{r.receiptNo}
                                  </span>
                                  {r.type && (
                                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
                                      {r.type}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-slate-500" />
                                    {formatDate(r.receiptDate)}
                                  </span>
                                  {r.method && <span>• {r.method}</span>}
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-sm sm:text-base font-extrabold text-emerald-400">
                                +{formatCurrency(r.amount)}
                              </p>
                              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {r.status === 'POSTED' ? 'VERIFIED' : r.status}
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

        {/* Support & Contact Footer Card */}
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl text-center space-y-3">
          <p className="text-xs uppercase font-bold tracking-widest text-emerald-400">
            Customer Support & Inquiries
          </p>
          <h3 className="text-lg font-bold text-white">
            Have questions regarding your plot statement or payment schedule?
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Please reach out to our dedicated client assistance desk at SS Estate & Marketing for any ledger reconciliations, receipt verifications, or transfer documentation.
          </p>
          <div className="pt-2 text-xs text-slate-500">
            SU Developers • Marketed & Managed by SS Estate & Marketing
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-white/10 py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} SU Developers. All rights reserved.</p>
        <p className="mt-1 text-[11px] text-slate-600">
          Exclusive Real Estate Marketing & Management by SS Estate & Marketing
        </p>
      </footer>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

import { Header } from '@/components/layout/header'
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  FileText,
  ArrowLeftRight,
  Loader2,
  RefreshCcw,
  AlertCircle,
  Landmark,
  Layers,
  ArrowUpRight,
  Calendar,
  Receipt,
  CreditCard,
  ChevronRight,
  Clock,
} from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { dashboardApi, reportsApi } from '@/lib/api'
import { DatePicker } from '@/components/DatePicker'
import { useAuth } from '@/lib/auth-context'

export default function DashboardPage() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  const {
    data: summary,
    isLoading: isSummaryLoading,
    error: summaryError,
    refetch: refetchSummary,
    isRefetching: isSummaryRefetching,
  } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => dashboardApi.summary(),
    refetchInterval: 60000,
  })

  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const {
    data: report,
    isLoading: isReportLoading,
    isFetching: isReportFetching,
    error: reportError,
    refetch: refetchReport,
  } = useQuery({
    queryKey: ['financial-summary-dashboard', fromDate, toDate],
    queryFn: () => reportsApi.financialSummary({ from: fromDate, to: toDate }),
    refetchInterval: 60000,
  })

  const isRefreshing = isSummaryRefetching || (isReportFetching && !isReportLoading)

  const handleRefresh = () => {
    refetchSummary()
    refetchReport()
  }

  const invoices = Array.isArray(summary?.recentInvoices) ? summary.recentInvoices : []
  const pdcs = Array.isArray(summary?.upcomingPdcs) ? summary.upcomingPdcs : []

  // Clean, executive KPI cards
  const financialCards = [
    {
      title: 'Total Recovered',
      value: Number(summary?.totalRecovered ?? 0),
      icon: TrendingUp,
      iconBg: 'bg-emerald-500/10 text-emerald-600',
      indicator: null,
      indicatorColor: '',
    },
    {
      title: 'This Month (MTD)',
      value: Number(summary?.monthCollections ?? 0),
      icon: Calendar,
      iconBg: 'bg-sky-500/10 text-sky-600',
      indicator: null,
      indicatorColor: '',
    },
    {
      title: 'Net Cash Position',
      value: Number(summary?.netCashFlow ?? 0),
      icon: Wallet,
      iconBg:
        Number(summary?.netCashFlow ?? 0) >= 0
          ? 'bg-emerald-500/10 text-emerald-600'
          : 'bg-rose-500/10 text-rose-600',
      indicator: Number(summary?.netCashFlow ?? 0) >= 0 ? 'Surplus' : 'Deficit',
      indicatorColor: Number(summary?.netCashFlow ?? 0) >= 0 ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold',
    },
    {
      title: 'Month Net Margin',
      value: Number(summary?.monthNetCashFlow ?? 0),
      icon: DollarSign,
      iconBg:
        Number(summary?.monthNetCashFlow ?? 0) >= 0
          ? 'bg-teal-500/10 text-teal-600'
          : 'bg-rose-500/10 text-rose-600',
      indicator: Number(summary?.monthNetCashFlow ?? 0) >= 0 ? 'Surplus' : 'Deficit',
      indicatorColor: Number(summary?.monthNetCashFlow ?? 0) >= 0 ? 'text-teal-600 font-semibold' : 'text-rose-600 font-semibold',
    },
    {
      title: 'Total Invoiced',
      value: Number(summary?.totalInvoiced ?? 0),
      icon: Receipt,
      iconBg: 'bg-indigo-500/10 text-indigo-600',
      indicator: null,
      indicatorColor: '',
    },
    {
      title: 'Outstanding Arrears',
      value: Number(summary?.outstandingArrears ?? 0),
      icon: AlertCircle,
      iconBg:
        Number(summary?.outstandingArrears ?? 0) > 0
          ? 'bg-rose-500/10 text-rose-600'
          : 'bg-slate-100 text-slate-500',
      indicator: Number(summary?.outstandingArrears ?? 0) > 0 ? 'Overdue Dues' : 'Zero Arrears',
      indicatorColor: Number(summary?.outstandingArrears ?? 0) > 0 ? 'text-rose-600 font-semibold' : 'text-slate-500',
    },
  ]

  // Revenue streams
  const instRecovered = Number(summary?.streams?.installment?.recovered ?? 0)
  const instInvoiced = Number(summary?.streams?.installment?.invoiced ?? 0)
  const devRecovered = Number(summary?.streams?.development?.recovered ?? 0)
  const devInvoiced = Number(summary?.streams?.development?.invoiced ?? 0)

  return (
    <div className="flex flex-col bg-transparent min-h-full">
      <Header
        title="Financial Hub"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/reports"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs ring-1 ring-inset ring-slate-200 transition hover:bg-slate-50"
            >
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              Reports
            </Link>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs ring-1 ring-inset ring-slate-200 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        }
      />

      <div className="flex-1 space-y-6 overflow-x-hidden w-full">
        {/* Executive Financial KPI Matrix */}
        <section className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 sm:gap-4">
          {summaryError ? (
            <div className="col-span-full rounded-2xl border border-red-200 bg-red-50 p-4 text-red-600 font-medium text-xs">
              Error loading financial metrics: {(summaryError as Error).message}
            </div>
          ) : isSummaryLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`kpi-skel-${index}`}
                className="h-24 rounded-2xl border border-slate-200 bg-slate-100/60 animate-pulse"
              />
            ))
          ) : (
            financialCards.map((card) => {
              const Icon = card.icon
              const formattedValue = formatCurrency(card.value)

              return (
                <div
                  key={card.title}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs transition hover:shadow-xs hover:border-slate-300"
                >
                  <div className="flex items-center justify-between gap-1">
                    <p className="truncate text-xs font-medium text-slate-500" title={card.title}>
                      {card.title}
                    </p>
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${card.iconBg}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <div className="mt-2.5">
                    <h3 className="text-base font-bold text-slate-900 sm:text-lg tracking-tight break-words" title={formattedValue}>
                      {formattedValue}
                    </h3>
                    {card.indicator && (
                      <p className={`text-[11px] mt-0.5 ${card.indicatorColor}`}>
                        {card.indicator}
                      </p>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </section>

        {/* Secondary Strip: Inventory Occupancy, Customers & PDC Vault */}
        <section className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
          {/* Inventory & Occupancy */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition hover:shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold text-slate-900">Inventory</h4>
                </div>
                <Link
                  href="/properties"
                  className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-0.5"
                >
                  Manage <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mt-3.5 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-bold tracking-tight text-slate-900">
                    {summary?.inventory?.totalProperties || 0}
                  </span>
                  <span className="ml-1.5 text-xs text-slate-500 font-medium">Plots</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-emerald-600">
                    {summary?.inventory?.occupancyRate || 0}% Sold
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-2.5 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, summary?.inventory?.occupancyRate || 0))}%` }}
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-medium border border-emerald-200/50">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Sold: {summary?.inventory?.statusBreakdown?.SOLD || 0}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 font-medium border border-sky-200/50">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                Available: {summary?.inventory?.statusBreakdown?.AVAILABLE || 0}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-medium border border-amber-200/50">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Reserved: {summary?.inventory?.statusBreakdown?.RESERVED || 0}
              </span>
              {Number(summary?.inventory?.statusBreakdown?.CANCELLED_AVAILABLE || 0) > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 text-orange-800 font-medium border border-orange-200/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                  Cancelled & Available: {summary?.inventory?.statusBreakdown?.CANCELLED_AVAILABLE}
                </span>
              )}
            </div>
          </div>

          {/* Customers */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition hover:shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <h4 className="text-sm font-semibold text-slate-900">Customers</h4>
                </div>
                <Link
                  href="/customers"
                  className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-0.5"
                >
                  Directory <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mt-3.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-slate-900">
                    {summary?.customers?.total || 0}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Registered Allottees</span>
                </div>
              </div>
            </div>
          </div>

          {/* PDC Vault */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition hover:shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-amber-600" />
                  <h4 className="text-sm font-semibold text-slate-900">PDC Safe</h4>
                </div>
                <Link
                  href="/pdc"
                  className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-0.5"
                >
                  Manage <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mt-3.5">
                <div className="text-2xl font-bold tracking-tight text-slate-900">
                  {formatCurrency(summary?.pdcPortfolio?.totalAmount || 0)}
                </div>
                <p className="text-xs text-amber-700 font-medium mt-1">
                  {summary?.pdcPortfolio?.count || 0} Cheques in Safe
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Maturing Soon</span>
              <span className="font-semibold text-slate-700">
                {summary?.upcomingPdcs?.length || 0} Cheques
              </span>
            </div>
          </div>
        </section>

        {/* Financial Performance (P&L) with Locked Single-Line Date Selector */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-2xs">
          {/* Header & Single-Line Date Selector */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-indigo-600" />
              <h3 className="text-base font-semibold text-slate-900">
                Financial Performance (P&L)
              </h3>
            </div>

            {/* Date Selector: Strictly 1 line on desktop/tablets, responsive on phone */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap shrink-0 overflow-x-auto py-0.5">
              <div className="w-28 sm:w-36 shrink-0">
                <DatePicker
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-8 sm:h-9 w-full rounded-lg border border-slate-200 bg-white px-2 sm:px-3 text-xs shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="From Date"
                />
              </div>
              <span className="text-slate-400 text-xs font-semibold shrink-0 px-0.5">to</span>
              <div className="w-28 sm:w-36 shrink-0">
                <DatePicker
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-8 sm:h-9 w-full rounded-lg border border-slate-200 bg-white px-2 sm:px-3 text-xs shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="To Date"
                />
              </div>
              {(fromDate || toDate) && (
                <button
                  onClick={() => {
                    setFromDate('')
                    setToDate('')
                  }}
                  className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition shrink-0"
                  title="Clear filter"
                >
                  Clear
                </button>
              )}
              {isReportFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />}
            </div>
          </div>

          {reportError ? (
            <div className="text-center py-8 text-red-500 font-medium text-xs">
              Error loading financial report: {(reportError as Error).message}
            </div>
          ) : isReportLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : !report ? (
            <div className="text-center py-8 text-slate-500 text-xs">No financial report data available</div>
          ) : (
            <div className="mt-5 space-y-5">
              {/* 3 Main P&L Columns (Cleaned up, no redundant comments) */}
              <div className="grid gap-4 md:grid-cols-3">
                {/* Inflow */}
                <div className="rounded-xl border border-emerald-100 bg-white shadow-2xs overflow-hidden">
                  <div className="p-4 bg-emerald-50/60 border-b border-emerald-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">Inflow (Revenue)</p>
                      <p className="mt-1 text-2xl font-bold text-emerald-600 tracking-tight">
                        {formatCurrency(report.revenue?.totalRecovered || 0)}
                      </p>
                    </div>
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="p-3.5 space-y-2 text-xs">
                    <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                      <span className="text-slate-500">Total Invoiced</span>
                      <span className="font-semibold text-slate-800">
                        {formatCurrency(report.revenue?.totalInvoiced || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-500">Pending Receivables</span>
                      <span className="font-semibold text-amber-600">
                        {formatCurrency(report.revenue?.pendingReceivables || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Outflow */}
                <div className="rounded-xl border border-rose-100 bg-white shadow-2xs overflow-hidden">
                  <div className="p-4 bg-rose-50/60 border-b border-rose-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-rose-800 uppercase tracking-wide">Outflow (Expenses)</p>
                      <p className="mt-1 text-2xl font-bold text-rose-600 tracking-tight">
                        {formatCurrency(report.expenses?.total || 0)}
                      </p>
                    </div>
                    <div className="h-8 w-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700">
                      <TrendingDown className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="p-3.5 space-y-2 text-xs">
                    <div className="flex justify-between items-center pb-0.5 border-b border-slate-100">
                      <span className="text-[11px] font-semibold text-slate-700">Categories</span>
                      <Link href="/reports/expense-register" className="text-[11px] font-medium text-primary hover:underline">
                        Register →
                      </Link>
                    </div>
                    {report.expenses?.byCategory?.length > 0 ? (
                      report.expenses.byCategory.slice(0, 2).map((cat: any) => (
                        <div
                          key={cat.category}
                          className="flex justify-between items-center py-0.5"
                        >
                          <span className="text-slate-600 truncate mr-2">{cat.category}</span>
                          <span className="font-medium text-slate-800 shrink-0">{formatCurrency(cat.amount)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 py-1 text-center italic">
                        No expenses recorded for period.
                      </p>
                    )}
                  </div>
                </div>

                {/* Net Position */}
                <div className="rounded-xl border border-indigo-100 bg-white shadow-2xs overflow-hidden">
                  <div className="p-4 bg-indigo-50/60 border-b border-indigo-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-indigo-800 uppercase tracking-wide">Net Cash Flow</p>
                      <p
                        className={`mt-1 text-2xl font-bold tracking-tight ${
                          (report.netCashFlow || 0) >= 0 ? 'text-indigo-600' : 'text-rose-600'
                        }`}
                      >
                        {formatCurrency(report.netCashFlow || 0)}
                      </p>
                    </div>
                    <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
                      <Wallet className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="p-3.5 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-500">Margin Status</span>
                      <span className={`font-semibold ${(report.netCashFlow || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {(report.netCashFlow || 0) >= 0 ? 'Surplus' : 'Deficit'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue Streams (Installments vs Development Charges) */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="h-3.5 w-3.5 text-slate-600" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Revenue Breakdown
                  </h4>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-slate-200/80 bg-white p-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">Property Installments</span>
                      <span className="text-xs font-bold text-emerald-600">
                        {formatCurrency(instRecovered)}
                      </span>
                    </div>
                    <div className="mt-1.5 text-[11px] text-slate-500 flex justify-between">
                      <span>Invoiced: {formatCurrency(instInvoiced)}</span>
                      <span>Paid: {formatCurrency(Number(summary?.streams?.installment?.paid ?? 0))}</span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200/80 bg-white p-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">Development Charges</span>
                      <span className="text-xs font-bold text-indigo-600">
                        {formatCurrency(devRecovered)}
                      </span>
                    </div>
                    <div className="mt-1.5 text-[11px] text-slate-500 flex justify-between">
                      <span>Invoiced: {formatCurrency(devInvoiced)}</span>
                      <span>Paid: {formatCurrency(Number(summary?.streams?.development?.paid ?? 0))}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Operational Key Details: Recent Invoices & Upcoming PDCs */}
        <section className="grid gap-6 lg:grid-cols-2">
          {/* Recent Invoices */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-semibold text-slate-900">Recent Invoices</h3>
              </div>
              <Link href="/invoices" className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5">
                All Invoices <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-3">
              {isSummaryLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={`inv-skel-${index}`} className="h-11 rounded-lg bg-slate-100/70 animate-pulse" />
                  ))}
                </div>
              ) : invoices.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-xs text-center text-muted-foreground">
                  No recent invoices.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden text-xs">
                  {invoices.slice(0, 5).map((inv: any) => (
                    <div key={inv.id} className="flex items-center justify-between p-2.5 sm:p-3 hover:bg-slate-50/80 transition">
                      <div className="min-w-0 flex-1 mr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{inv.code}</span>
                          <span className={`px-2 py-0.2 rounded-full text-[10px] font-semibold ${getStatusColor(inv.status)}`}>
                            {inv.status}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] truncate mt-0.5">
                          {inv.customer?.fullName || 'General Customer'}
                          {inv.installment?.seq ? ` • Installment #${inv.installment.seq}` : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-slate-900 text-xs sm:text-sm">
                          {formatCurrency(Number(inv.total))}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Due {formatDate(inv.dueDate)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming PDCs */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-semibold text-slate-900">Upcoming PDCs</h3>
              </div>
              <Link href="/pdc" className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5">
                PDC Safe <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-3">
              {isSummaryLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={`pdc-skel-${index}`} className="h-11 rounded-lg bg-slate-100/70 animate-pulse" />
                  ))}
                </div>
              ) : pdcs.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-xs text-center text-muted-foreground">
                  No upcoming cheques in vault.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden text-xs">
                  {[...pdcs]
                    .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                    .slice(0, 5)
                    .map((pdc: any) => (
                      <div key={pdc.id} className="flex items-center justify-between p-2.5 sm:p-3 hover:bg-slate-50/80 transition">
                        <div className="min-w-0 flex-1 mr-3">
                          <p className="font-bold text-slate-900 truncate">
                            {pdc.customer?.fullName || 'Customer'}
                          </p>
                          <p className="text-slate-500 text-[11px] truncate mt-0.5">
                            {pdc.bank || 'Bank'} • Cheque #{pdc.chequeNo || '—'}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-slate-900 text-xs sm:text-sm">
                            {formatCurrency(Number(pdc.amount))}
                          </p>
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full mt-0.5">
                            <Clock className="h-3 w-3" /> Due {formatDate(pdc.dueDate)}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Quick Hub Navigation */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Quick Actions</h3>
          </div>

          <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            <Link
              href="/receipts/new"
              className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs transition hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
                <DollarSign className="h-3.5 w-3.5" />
              </div>
              <div className="mt-2.5">
                <p className="text-xs font-bold text-slate-900">Record Receipt</p>
                
              </div>
            </Link>

            <Link
              href="/reports/aging"
              className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs transition hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600 group-hover:scale-105 transition-transform">
                <FileText className="h-3.5 w-3.5" />
              </div>
              <div className="mt-2.5">
                <p className="text-xs font-bold text-slate-900">Aging Report</p>
                
              </div>
            </Link>

            <Link
              href="/reports/expense-register"
              className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs transition hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 group-hover:scale-105 transition-transform">
                <TrendingDown className="h-3.5 w-3.5" />
              </div>
              <div className="mt-2.5">
                <p className="text-xs font-bold text-slate-900">Expenses</p>
                
              </div>
            </Link>

            <Link
              href="/pdc"
              className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs transition hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
                <CreditCard className="h-3.5 w-3.5" />
              </div>
              <div className="mt-2.5">
                <p className="text-xs font-bold text-slate-900">PDC Safe</p>
                
              </div>
            </Link>

            <Link
              href="/transfers"
              className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs transition hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform">
                <ArrowLeftRight className="h-3.5 w-3.5" />
              </div>
              <div className="mt-2.5">
                <p className="text-xs font-bold text-slate-900">Transfers</p>
                
              </div>
            </Link>

            <Link
              href="/reports"
              className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs transition hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600 group-hover:scale-105 transition-transform">
                <Landmark className="h-3.5 w-3.5" />
              </div>
              <div className="mt-2.5">
                <p className="text-xs font-bold text-slate-900">Reports Hub</p>
                
              </div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { paymentPlansApi } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CreditCard, Search, Plus, Building2, X } from 'lucide-react'
import Link from 'next/link'

export default function PaymentPlansPage() {
  const [search, setSearch] = useState('')

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['payment-plans', search],
    queryFn: () => paymentPlansApi.list({ search }),
  })

  const filteredPlans = plans

  return (
    <div className="flex flex-col">
      <Header title="Payment Plans" />
      
      <div className="flex-1 space-y-4 p-4 sm:space-y-6 sm:p-6">
        {/* Actions Bar: Search and Create Plan in one line */}
        <div className="flex items-center gap-2 sm:gap-3 w-full">
          <div className="flex items-center h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 gap-2 shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition">
            <Search className="h-4 w-4 text-slate-400 shrink-0 pointer-events-none" />
            <input
              type="text"
              placeholder="Search payment plans by name, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none border-none p-0"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <Link
            href="/payment-plans/new"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-primary/90 transition shadow-2xs shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">Create Plan</span>
            <span className="sm:hidden font-medium">New</span>
          </Link>
        </div>

        {/* Plans List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl border bg-card sm:h-32" />
            ))}
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
            <CreditCard className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No payment plans found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create a payment plan to manage installments
            </p>
            <Link
              href="/payment-plans/new"
              className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Create Plan
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPlans.map((plan: any) => (
              <Link
                key={plan.id}
                href={`/payment-plans/${plan.id}`}
                className="block rounded-xl border bg-card p-4 transition-shadow hover:shadow-md sm:p-6"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:flex sm:h-12 sm:w-12">
                      <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{plan.property?.code || 'N/A'}</h3>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {plan.property?.title || 'Property'}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        <span className="text-muted-foreground">
                          Customer: <span className="font-medium text-foreground">{plan.customer?.fullName || 'N/A'}</span>
                        </span>
                        <span className="hidden text-muted-foreground sm:inline">
                          Created: <span className="font-medium text-foreground">{formatDate(plan.createdAt)}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:block sm:text-right">
                    <p className="text-sm text-muted-foreground">Components</p>
                    <p className="text-xl font-bold sm:text-2xl">{plan.components?.length || 0}</p>
                  </div>
                </div>

                {/* Components Preview */}
                {plan.components && plan.components.length > 0 && (
                  <div className="mt-3 grid gap-2 grid-cols-2 sm:mt-4 md:grid-cols-3">
                    {plan.components.slice(0, 3).map((comp: any, idx: number) => (
                      <div key={idx} className="rounded-lg border bg-muted/50 p-2.5 sm:p-3">
                        <p className="text-xs font-medium">{comp.type}</p>
                        <p className="mt-0.5 text-sm font-semibold">{formatCurrency(Number(comp.amount))}</p>
                        <p className="text-xs text-muted-foreground">
                          {comp.installments ? `${comp.installments} installments` : 'One-time'}
                        </p>
                      </div>
                    ))}
                    {plan.components.length > 3 && (
                      <div className="flex items-center justify-center rounded-lg border bg-muted/50 p-2.5 text-sm text-muted-foreground">
                        +{plan.components.length - 3} more
                      </div>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {!isLoading && filteredPlans.length > 0 && (
          <div className="flex items-center justify-between rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredPlans.length} payment plans
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

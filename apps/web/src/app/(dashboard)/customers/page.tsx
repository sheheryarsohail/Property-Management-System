'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { customersApi } from '@/lib/api'
import { Users, Plus, Search, Mail, Phone, CreditCard, Home, X } from 'lucide-react'
import Link from 'next/link'

export default function CustomersPage() {
  const [search, setSearch] = useState('')

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => customersApi.list({ search }),
  })

  const filteredCustomers = customers

  return (
    <div className="flex flex-col">
      <Header title="Customers" />
      
      <div className="flex-1 space-y-4 p-4 sm:space-y-6 sm:p-6">
        {/* Actions Bar: Search and Add Customer in one line */}
        <div className="flex items-center gap-2 sm:gap-3 w-full">
          <div className="flex items-center h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 gap-2 shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition">
            <Search className="h-4 w-4 text-slate-400 shrink-0 pointer-events-none" />
            <input
              type="text"
              placeholder="Search customers by name, phone, CNIC..."
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
            href="/customers/new"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-primary/90 transition shadow-2xs shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">Add Customer</span>
            <span className="sm:hidden font-medium">Add</span>
          </Link>
        </div>

        {/* Customers List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl border bg-card sm:h-24" />
            ))}
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
            <Users className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No customers found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get started by adding a new customer
            </p>
            <Link
              href="/customers/new"
              className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add Customer
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCustomers.map((customer: any) => (
              <Link
                key={customer.id}
                href={`/customers/${customer.id}`}
                className="flex flex-col gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary sm:h-12 sm:w-12">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{customer.fullName}</h3>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground sm:gap-6">
                  {customer.nationalId && (
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{customer.nationalId}</span>
                    </div>
                  )}
                  {(customer.phone || customer.mobile) && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {customer.phone && customer.mobile && customer.phone !== customer.mobile
                          ? `${customer.phone} / ${customer.mobile}`
                          : customer.phone || customer.mobile}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Home className="h-3.5 w-3.5 shrink-0" />
                    <span>{customer._count?.ownerships || 0} plot{customer._count?.ownerships === 1 ? '' : 's'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && filteredCustomers.length > 0 && (
          <div className="flex items-center justify-between rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredCustomers.length} customers
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

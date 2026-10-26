'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { propertiesApi } from '@/lib/api'
import { formatCurrency, getStatusColor } from '@/lib/utils'
import { Building2, Plus, Search, SlidersHorizontal, X, RotateCcw, Check, Tag } from 'lucide-react'
import { FilterDrawer } from '@/components/FilterDrawer'
import { cn } from '@/lib/utils'
import { SearchableSelect } from '@/components/SearchableSelect'
import Link from 'next/link'

type Property = {
  id: string
  code: string
  title?: string | null
  type?: string | null
  block?: string | null
  sizeSqYd?: number | null
  totalPrice?: number | string | null
  status?: string | null
  displayStatus?: string | null
  isCancelledAvailable?: boolean
}

const PAGE_SIZE = 24;

export default function PropertiesPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 250)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [debouncedSearch, statusFilter])

  const { data: properties = [], isLoading } = useQuery<Property[]>({
    queryKey: ['properties', debouncedSearch, statusFilter],
    queryFn: () =>
      propertiesApi.list({
        search: debouncedSearch || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
  })

  const filteredProperties: Property[] = (properties || []).filter((property) => {
    const q = search.trim().toLowerCase();
    const displayStatus = (property.displayStatus || property.status || '').toLowerCase();
    const matchesSearch =
      !q ||
      property.code?.toLowerCase().includes(q) ||
      (property.title && property.title.toLowerCase().includes(q)) ||
      (property.block && property.block.toLowerCase().includes(q)) ||
      (property.type && property.type.toLowerCase().includes(q)) ||
      displayStatus.includes(q) ||
      (property.isCancelledAvailable && (q.includes('re-allot') || q.includes('reallot') || q.includes('cancelled')));
    
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'CANCELLED_AVAILABLE'
        ? property.isCancelledAvailable
        : statusFilter === 'AVAILABLE'
        ? property.status === 'AVAILABLE' && !property.isCancelledAvailable
        : property.status === statusFilter || property.displayStatus === statusFilter);
    return matchesSearch && matchesStatus;
  });

  const displayedProperties = filteredProperties.slice(0, visibleCount);

  return (
    <div className="flex flex-col">
      <Header title="Properties" />
      
      <div className="flex-1 space-y-4 p-4 sm:space-y-6 sm:p-6">
        {/* Actions Bar */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 sm:gap-3 w-full">
            {/* Filter Trigger Button beside Search Bar */}
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(true)}
              className={cn(
                "relative flex items-center justify-center gap-2 h-10 px-3 sm:px-4 rounded-xl border text-sm font-medium transition shadow-2xs shrink-0 active:scale-95",
                statusFilter !== 'all'
                  ? "border-primary/50 bg-primary/10 text-primary font-semibold hover:bg-primary/15 ring-1 ring-primary/20"
                  : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              )}
              title="Filter Properties"
              aria-label="Open property filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden md:inline font-medium">Filters</span>
              {statusFilter !== 'all' && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white shadow-2xs">
                  1
                </span>
              )}
            </button>

            {/* Search Input */}
            <div className="flex items-center h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 gap-2 shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition">
              <Search className="h-4 w-4 text-slate-400 shrink-0 pointer-events-none" />
              <input
                type="text"
                placeholder="Search properties by code, block, phase..."
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

            {/* Desktop Quick Status Switcher (hidden on mobile/tablet) */}
            <div className="hidden lg:flex items-center gap-1.5 border-l border-slate-200/80 pl-3 shrink-0">
              {[
                { label: 'All', value: 'all' },
                { label: 'Available', value: 'AVAILABLE' },
                { label: 'Cancelled & Available', value: 'CANCELLED_AVAILABLE' },
                { label: 'Reserved', value: 'RESERVED' },
                { label: 'Sold', value: 'SOLD' },
              ].map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatusFilter(s.value)}
                  className={cn(
                    "h-9 px-3 rounded-lg text-xs font-semibold transition shadow-2xs",
                    statusFilter === s.value
                      ? "bg-slate-900 text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Add Button */}
            <Link
              href="/properties/new"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-primary/90 transition shadow-2xs shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Add Property</span>
              <span className="sm:hidden font-medium">Add</span>
            </Link>
          </div>

          {/* Active Filter Chips */}
          {statusFilter !== 'all' && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 animate-in fade-in duration-200">
              <span className="text-xs font-medium text-slate-500 mr-1">Active filters:</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-medium text-primary">
                <span>
                  Status:{' '}
                  {statusFilter === 'CANCELLED_AVAILABLE'
                    ? 'Cancelled & Available'
                    : statusFilter}
                </span>
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className="hover:bg-primary/20 rounded p-0.5 transition"
                  aria-label="Remove status filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 underline ml-1 cursor-pointer transition"
              >
                <RotateCcw className="h-3 w-3" />
                Reset all
              </button>
            </div>
          )}
        </div>

        {/* Filter Drawer */}
        <FilterDrawer
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          title="Filter"
          activeCount={statusFilter !== 'all' ? 1 : 0}
          onReset={() => setStatusFilter('all')}
          onApply={() => setIsFilterDrawerOpen(false)}
        >
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Tag className="h-3.5 w-3.5 text-primary" />
              Property Status
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { value: 'all', label: 'All Properties' },
                { value: 'AVAILABLE', label: 'Available (Fresh)' },
                { value: 'CANCELLED_AVAILABLE', label: 'Cancelled & Available (Re-Allotment)' },
                { value: 'RESERVED', label: 'Reserved' },
                { value: 'SOLD', label: 'Sold' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ].map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatusFilter(s.value)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-3.5 py-3 text-left transition",
                    statusFilter === s.value
                      ? "border-primary bg-primary/5 text-primary ring-1 ring-primary font-semibold"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <span className="text-xs sm:text-sm text-slate-900">{s.label}</span>
                  {statusFilter === s.value && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </FilterDrawer>

        {/* Properties Grid */}
        {isLoading ? (
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-52 animate-pulse rounded-xl border bg-card sm:h-64" />
            ))}
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
            <Building2 className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No properties found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get started by creating a new property
            </p>
            <Link
              href="/properties/new"
              className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add Property
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayedProperties.map((property: any) => (
              <Link
                key={property.id}
                href={`/properties/${property.id}`}
                className="group rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md sm:p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold group-hover:text-primary">
                      {property.code}
                    </h3>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(
                      property.displayStatus || property.status
                    )}`}
                  >
                    {property.displayStatus || property.status}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-sm sm:mt-4 sm:space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium">{property.type || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Block:</span>
                    <span className="font-medium">{property.block || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size:</span>
                    <span className="font-medium">
                      {property.sizeSqYd ? `${property.sizeSqYd} sq.yd` : 'N/A'}
                    </span>
                  </div>
                  {property.totalPrice && (
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-muted-foreground">Plot Price:</span>
                      <span className="font-semibold">
                        {formatCurrency(Number(property.totalPrice))}
                      </span>
                    </div>
                  )}
                  {Number(property.developmentCharges || 0) > 0 && (
                    <div className="flex justify-between text-xs text-purple-700 dark:text-purple-400 font-medium">
                      <span>Dev Charges:</span>
                      <span>{formatCurrency(Number(property.developmentCharges))}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Stats & Progressive Load More */}
        {!isLoading && filteredProperties.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              Showing {displayedProperties.length} of {filteredProperties.length} properties
            </p>
            {visibleCount < filteredProperties.length && (
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors shadow-sm"
              >
                Load More Properties ({filteredProperties.length - displayedProperties.length} remaining)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

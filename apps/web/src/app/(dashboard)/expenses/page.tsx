'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { expensesApi } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { TrendingUp, Search, Plus, SlidersHorizontal, X, RotateCcw, Check, Tag, Printer } from 'lucide-react'
import { FilterDrawer } from '@/components/FilterDrawer'
import { cn } from '@/lib/utils'
import { SearchableSelect } from '@/components/SearchableSelect'
import Link from 'next/link'

type ExpenseListItem = {
  id: string
  date: string
  type: string
  category?: string | null
  subcategory?: string | null
  billNo?: string | null
  amount: number
  notes?: string | null
}

export default function ExpensesPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)

  const { data: expenses = [], isLoading } = useQuery<ExpenseListItem[]>({
    queryKey: ['expenses', search, categoryFilter],
    queryFn: () => expensesApi.list({ search, category: categoryFilter !== 'all' ? categoryFilter : undefined }),
  })

  const filteredExpenses = expenses

  return (
    <div className="flex flex-col">
      <Header title="Expenses" />
      
      <div className="flex-1 space-y-4 p-4 sm:space-y-6 sm:p-6">
        {/* Controls Bar: Filter beside Search Bar */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 sm:gap-3 w-full">
            {/* Filter Trigger Button beside Search Bar */}
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(true)}
              className={cn(
                "relative flex items-center justify-center gap-2 h-10 px-3 sm:px-4 rounded-xl border text-sm font-medium transition shadow-2xs shrink-0 active:scale-95",
                categoryFilter !== 'all'
                  ? "border-primary/50 bg-primary/10 text-primary font-semibold hover:bg-primary/15 ring-1 ring-primary/20"
                  : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              )}
              title="Filter Expenses"
              aria-label="Open expense filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden md:inline font-medium">Filters</span>
              {categoryFilter !== 'all' && (
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
                placeholder="Search expenses by category, bill no, notes..."
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

            {/* Desktop Quick Category Switcher (hidden on mobile/tablet) */}
            <div className="hidden lg:flex items-center gap-1.5 border-l border-slate-200/80 pl-3 shrink-0">
              {[
                { label: 'All', value: 'all' },
                { label: 'Office', value: 'OFFICE' },
                { label: 'Development', value: 'DEVELOPMENT' },
              ].map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategoryFilter(c.value)}
                  className={cn(
                    "h-9 px-3 rounded-lg text-xs font-semibold transition shadow-2xs",
                    categoryFilter === c.value
                      ? "bg-slate-900 text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Add Button */}
            <Link
              href="/expenses/new"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-primary/90 transition shadow-2xs shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Add Expense</span>
              <span className="sm:hidden font-medium">Add</span>
            </Link>
          </div>

          {/* Active Filter Chips */}
          {categoryFilter !== 'all' && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 animate-in fade-in duration-200">
              <span className="text-xs font-medium text-slate-500 mr-1">Active filters:</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-medium text-primary">
                <span>Category: {categoryFilter}</span>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('all')}
                  className="hover:bg-primary/20 rounded p-0.5 transition"
                  aria-label="Remove category filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
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
          activeCount={categoryFilter !== 'all' ? 1 : 0}
          onReset={() => setCategoryFilter('all')}
          onApply={() => setIsFilterDrawerOpen(false)}
        >
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Tag className="h-3.5 w-3.5 text-primary" />
              Expense Category
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { value: 'all', label: 'All Categories' },
                { value: 'OFFICE', label: 'Office Expenses' },
                { value: 'DEVELOPMENT', label: 'Development / Site' },
              ].map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategoryFilter(c.value)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-3.5 py-3 text-left transition",
                    categoryFilter === c.value
                      ? "border-primary bg-primary/5 text-primary ring-1 ring-primary font-semibold"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <span className="text-xs sm:text-sm text-slate-900">{c.label}</span>
                  {categoryFilter === c.value && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </FilterDrawer>

        {/* Expenses */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border bg-card" />
            ))}
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
            <TrendingUp className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No expenses found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Expenses will appear here once recorded
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-xl border bg-card sm:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Subcategory / Bill No</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredExpenses.map((expense) => (
                      <tr key={expense.id} className="transition hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium capitalize">{expense.type.replace(/_/g, ' ').toLowerCase()}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">{expense.category || 'N/A'}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {expense.subcategory || expense.billNo || expense.notes || '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{formatDate(expense.date)}</td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {formatCurrency(Number(expense.amount))}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/print/expense-voucher/${expense.id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition"
                            title="Print Expense Voucher"
                          >
                            <Printer className="h-3.5 w-3.5 text-primary" />
                            Print
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 sm:hidden">
              {filteredExpenses.map((expense) => (
                <div key={expense.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold capitalize">{expense.type.replace(/_/g, ' ').toLowerCase()}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">{expense.category || 'N/A'}</span>
                        {(expense.subcategory || expense.billNo) && (
                          <span className="text-xs text-muted-foreground">{expense.subcategory || expense.billNo}</span>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 text-lg font-bold">{formatCurrency(Number(expense.amount))}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t pt-2">
                    <p className="text-xs text-muted-foreground">{formatDate(expense.date)}</p>
                    <Link
                      href={`/print/expense-voucher/${expense.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                    >
                      <Printer className="h-3.5 w-3.5 text-primary" />
                      Print Voucher
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!isLoading && filteredExpenses.length > 0 && (
          <div className="flex flex-col gap-1 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredExpenses.length} expenses
            </p>
            <p className="text-sm font-medium">
              Total: {formatCurrency(filteredExpenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0))}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { Bell, Search, Sun, User, X, Menu } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { UserMenu } from './user-menu'
import { useSidebar } from './sidebar'

import { cn } from '@/lib/utils'

interface HeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
}

export function Header({ title, description, actions }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const { setOpen, collapsed, toggleCollapsed } = useSidebar()


  return (
    <header className="relative sm:sticky sm:top-2 z-20 flex min-h-[3.5rem] sm:min-h-[3.75rem] shrink-0 items-center justify-between gap-x-2 sm:gap-x-4 border border-white/30 rounded-xl sm:rounded-2xl bg-white/70 backdrop-blur-md px-3 sm:px-6 shadow-2xs w-full mb-3 sm:mb-6 transition-all">
      <div className="flex flex-1 items-center justify-between gap-x-2 sm:gap-x-4 min-w-0">
        <div className="flex items-center gap-x-2 sm:gap-x-3 min-w-0 shrink-0 max-w-[60%] sm:max-w-none">
          <button
            type="button"
            className="-m-1.5 p-2 text-slate-700 lg:hidden hover:bg-slate-100 rounded-lg transition shrink-0"
            onClick={() => setOpen(true)}
            aria-label="Open sidebar navigation"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900 truncate">
              {title}
            </h1>
            {description && (
              <p className="hidden sm:block text-xs text-muted-foreground mt-0.5 truncate">{description}</p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-auto">
            {actions}
          </div>
        )}
      </div>

      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 animate-fade-in">
          <div className="mx-4 mt-16 w-full max-w-lg rounded-2xl border border-slate-200 bg-[#fafafa] p-5 shadow-2xl sm:mt-24 sm:rounded-3xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Quick Search</h2>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-muted-foreground transition hover:bg-slate-100"
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              type="search"
              placeholder="Search properties, customers, invoices..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base shadow-inner focus:outline-none focus:ring-2 focus:ring-primary sm:rounded-2xl"
              autoFocus
            />
            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
              <p>Quick actions</p>
              <div className="grid gap-2 rounded-xl border border-slate-100 bg-white p-3 text-sm shadow-sm sm:rounded-2xl sm:p-4">
                <Link href="/properties/new" className="hover:text-primary" onClick={() => setSearchOpen(false)}>
                  Create new property
                </Link>
                <Link href="/invoices" className="hover:text-primary" onClick={() => setSearchOpen(false)}>
                  Review pending invoices
                </Link>
                {/* <Link href="/communication" className="hover:text-primary" onClick={() => setSearchOpen(false)}>
                  Send reminders
                </Link> */}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { User } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

export function UserMenu({ collapsed = false }: { collapsed?: boolean }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const { user, logout } = useAuth()

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [userMenuOpen])

  return (
    <div className="relative" ref={userMenuRef}>
      <button
        type="button"
        onClick={() => setUserMenuOpen((prev) => !prev)}
        title={user?.name || 'User'}
        className={cn(
          "flex items-center rounded-xl border border-white/20 bg-white/90 backdrop-blur-md shadow-sm transition hover:bg-white/50 cursor-pointer",
          collapsed ? "h-10 w-10 justify-center p-0" : "w-full gap-3 p-2"
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <User className="h-4 w-4" />
        </div>
        {!collapsed && (
          <div className="flex-1 text-left truncate">
            <p className="text-sm font-semibold leading-tight truncate">{user?.name || 'User'}</p>
            <p className="text-[11px] text-muted-foreground capitalize truncate">{user?.role?.toLowerCase() || 'Role'}</p>
          </div>
        )}
      </button>

      {userMenuOpen && (
        <div className={cn(
          "absolute mb-2 rounded-xl border border-white/20 bg-white/95 backdrop-blur-xl p-2 text-sm shadow-xl animate-fade-in z-50",
          collapsed ? "left-full bottom-0 ml-3 w-56" : "bottom-full left-0 w-full min-w-[220px]"
        )}>
          <div className="rounded-lg bg-slate-50/50 p-3">
            <p className="text-sm font-semibold">{user?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground">{user?.email || 'email@example.com'}</p>
          </div>
          <div className="mt-2 space-y-1 text-sm">
            <button className="w-full rounded-lg px-3 py-2 text-left hover:bg-white/50 transition" type="button">
              View profile
            </button>
            <Link
              href="/settings"
              onClick={() => setUserMenuOpen(false)}
              className="block w-full rounded-lg px-3 py-2 text-left hover:bg-white/50 transition"
            >
              Settings
            </Link>
          </div>
          <div className="mt-2 border-t border-slate-200 pt-2">
            <button 
              onClick={() => {
                setUserMenuOpen(false)
                logout()
              }}
              className="w-full rounded-lg px-3 py-2 text-left text-red-500 hover:bg-red-50/50 transition" 
              type="button"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

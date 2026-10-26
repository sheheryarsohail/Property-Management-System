'use client'

import { Fragment, useEffect, useState, createContext, useContext } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { UserMenu } from './user-menu'
import { PropertySwitcher } from './property-switcher'
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Receipt,
  CreditCard,
  ArrowLeftRight,
  Wallet,
  TrendingUp,
  BarChart3,
  MessageSquare,
  Settings,
  Menu,
  X,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  Calendar,
  UserX,
  GitMerge,
  PanelLeftClose,
  PanelLeftOpen,
  Megaphone,
  Newspaper,
} from 'lucide-react'

// --- Navigation config ---
const navigation = [
  { id: 'dashboard', name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { id: 'properties', name: 'Properties', href: '/properties', icon: Building2 },
  { id: 'customers', name: 'Customers', href: '/customers', icon: Users },
  { id: 'invoices', name: 'Installments', href: '/invoices', icon: Calendar },
  { id: 'receipts', name: 'Receipts', href: '/receipts', icon: Receipt },
  { id: 'development_charges', name: 'Dev Charges', href: '/development-charges', icon: FileText },
  { id: 'transfers', name: 'Transfers', href: '/transfers', icon: ArrowLeftRight },
  { id: 'cancellations', name: 'Cancellations', href: '/cancellations', icon: UserX },
  { id: 'merges', name: 'Merges', href: '/merges', icon: GitMerge },
  { id: 'pdc', name: 'PDC', href: '/pdc', icon: Wallet },
  { id: 'expenses', name: 'Expenses', href: '/expenses', icon: TrendingUp },
  { id: 'reports', name: 'Reports', href: '/reports', icon: BarChart3 },
  { id: 'announcements', name: 'Announcements', href: '/announcements', icon: Megaphone, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { id: 'blogs', name: 'Blogs & News', href: '/blogs', icon: Newspaper, roles: ['SUPER_ADMIN', 'ADMIN'] },
  // { id: 'communication', name: 'Communication', href: '/communication', icon: MessageSquare, roles: ['ADMIN', 'SALES', 'CUSTOMER'] },
  { id: 'users', name: 'Users & Access', href: '/users', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { id: 'settings', name: 'Settings', href: '/settings', icon: Settings, roles: ['SUPER_ADMIN', 'ADMIN', 'SALES', 'ACCOUNTS', 'AUDITOR', 'CUSTOMER'] },
]

// --- Context for sidebar state (mobile drawer open & desktop collapse) ---
type SidebarContextType = {
  open: boolean
  setOpen: (v: boolean) => void
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  toggleCollapsed: () => void
}

const SidebarContext = createContext<SidebarContextType>({
  open: false,
  setOpen: () => {},
  collapsed: false,
  setCollapsed: () => {},
  toggleCollapsed: () => {},
})

export function useSidebar() {
  return useContext(SidebarContext)
}

// --- Sidebar nav links ---
function SidebarNav({ onNavigate, collapsed = false }: { onNavigate?: () => void; collapsed?: boolean }) {
  const pathname = usePathname()
  const { user } = useAuth()

  // Filter navigation items based on user role and granular allowedTabs scope
  const visibleNav = navigation.filter((item) => {
    // 1. Role-based check
    if (item.roles && (!user || !item.roles.includes(user.role))) {
      return false;
    }

    // 2. Super Admin has full unrestricted access
    if (user?.role === 'SUPER_ADMIN') {
      return true;
    }

    // 3. Granular access scope: check allowedTabs if configured
    if (user?.allowedTabs && Array.isArray(user.allowedTabs) && user.allowedTabs.length > 0) {
      return user.allowedTabs.includes(item.id);
    }

    // 4. Default: fallback to visible if allowedTabs not yet customized
    return true;
  })

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-2" aria-label="Main navigation">
      {visibleNav.map((item) => {
        const isActive =
          pathname === item.href || pathname?.startsWith(item.href + '/')
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.name : undefined}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'group relative flex items-center rounded-xl text-sm font-medium transition-all duration-150',
              collapsed ? 'justify-center p-2.5 mx-auto w-10 h-10' : 'gap-3 px-3 py-2.5',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
            )}
          >
            <item.icon
              className={cn(
                'h-[19px] w-[19px] shrink-0 transition-transform group-hover:scale-110',
                isActive && 'scale-110'
              )}
            />
            {!collapsed && <span className="truncate">{item.name}</span>}

            {/* Floating Tooltip when collapsed */}
            {collapsed && (
              <span className="pointer-events-none absolute left-full ml-3 z-50 hidden whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-xl group-hover:block animate-fade-in">
                {item.name}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

// --- Mobile trigger (renders as top bar on small screens) ---
export function MobileSidebarTrigger() {
  const { setOpen } = useSidebar()
  const { user } = useAuth()
  const [activePropertyId, setActivePropertyId] = useState('t_local')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActivePropertyId(localStorage.getItem('tenant_id') || 't_local')
    }
  }, [])

  const activeProperty = user?.authorizedTenants?.find((p: any) => p.id === activePropertyId) || { name: 'Default Property' }

  return (
    <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/20 bg-white/70 backdrop-blur-md px-3 sm:px-4 py-2.5 lg:hidden shadow-2xs shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open sidebar"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-700 transition hover:bg-slate-50 active:bg-slate-100 shadow-2xs"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-4 w-4" />
          </div>
          <p className="text-sm font-bold tracking-tight text-slate-900 truncate max-w-[200px] sm:max-w-xs">
            {activeProperty?.name || 'Default Property'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <UserMenu collapsed={true} />
      </div>
    </div>
  )
}

// --- Desktop sidebar (visible lg+) with minimize/expand support ---
function DesktopSidebar() {
  const { collapsed, toggleCollapsed } = useSidebar()

  return (
    <aside
      className={cn(
        "hidden lg:flex h-full shrink-0 flex-col border-r border-white/30 bg-white/40 backdrop-blur-md shadow-sm transition-all duration-300 ease-in-out relative",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Switcher & Minimize Toggle Header */}
      <div className={cn(
        "p-3 border-b border-white/30 flex items-center transition-all duration-300",
        collapsed ? "flex-col gap-2" : "justify-between"
      )}>
        <div className={cn(collapsed ? "w-full flex justify-center" : "flex-1 min-w-0")}>
          <PropertySwitcher collapsed={collapsed} />
        </div>
        <button
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? "Expand sidebar" : "Minimize sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Minimize sidebar"}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200/60 bg-white/70 text-slate-500 hover:text-slate-900 hover:bg-white transition shadow-sm cursor-pointer"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Nav links */}
      <SidebarNav collapsed={collapsed} />

      {/* Footer / User Profile */}
      <div className={cn("border-t border-white/30 p-3", collapsed && "flex justify-center")}>
        <UserMenu collapsed={collapsed} />
      </div>
    </aside>
  )
}

// --- Mobile sidebar overlay (drawer) ---
function MobileSidebar() {
  const { open, setOpen } = useSidebar()
  const pathname = usePathname()

  // Close on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname, setOpen])

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Sidebar navigation">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      {/* Drawer */}
      <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white/90 backdrop-blur-xl border-r border-white/40 shadow-2xl animate-slide-in-left">
        <div className="flex h-full flex-col overflow-y-auto py-2 pb-4">
          <div className="flex items-center justify-between px-2 pr-4 mt-2 mb-2">
            <div className="flex-1 min-w-0">
              <PropertySwitcher collapsed={false} />
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200/50 text-slate-700 transition hover:bg-slate-100 active:bg-slate-200 ml-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <SidebarNav onNavigate={() => setOpen(false)} collapsed={false} />
          </div>
          <div className="border-t border-white/30 p-4 mt-auto">
            <UserMenu collapsed={false} />
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Main Sidebar Provider export (combines all pieces) ---
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  // Hydrate collapsed state from localStorage on client
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pms_sidebar_collapsed')
      if (saved !== null) {
        setCollapsed(saved === 'true')
      }
    } catch (e) {
      // ignore
    }
  }, [])

  const handleToggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('pms_sidebar_collapsed', String(next))
      } catch (e) {
        // ignore
      }
      return next
    })
  }

  return (
    <SidebarContext.Provider
      value={{
        open,
        setOpen,
        collapsed,
        setCollapsed: (v) => {
          setCollapsed(v)
          try {
            localStorage.setItem('pms_sidebar_collapsed', String(v))
          } catch (e) {}
        },
        toggleCollapsed: handleToggleCollapsed,
      }}
    >
      {children}
      <MobileSidebar />
    </SidebarContext.Provider>
  )
}

export function Sidebar() {
  return <DesktopSidebar />
}

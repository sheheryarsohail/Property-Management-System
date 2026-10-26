'use client'

import { useEffect, useRef, useState } from 'react'
import { Building2, ChevronDown, Check, Plus } from 'lucide-react'
import { api } from '@/lib/axios'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'

interface Property {
  id: string
  name: string
}

export function PropertySwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newPropertyName, setNewPropertyName] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const [activePropertyId, setActivePropertyId] = useState<string>('t_local')

  useEffect(() => {
    // Read current property from localStorage on mount
    if (typeof window !== 'undefined') {
      setActivePropertyId(localStorage.getItem('tenant_id') || 't_local')
    }
  }, [])

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await api.get('/tenants')
        let data: Property[] = res.data || []
        
        // Strictly filter to authorized tenants if not SUPER_ADMIN
        if (user && user.role !== 'SUPER_ADMIN') {
          const authorizedIds = (user.authorizedTenants || []).map((t: any) => t.id)
          data = data.filter((t: any) => authorizedIds.includes(t.id))
        }

        if (data.length > 0) {
          setProperties(data)
        } else {
          fallback()
        }
      } catch (err) {
        fallback()
      }
    }

    const fallback = () => {
      if (user?.authorizedTenants && user.authorizedTenants.length > 0) {
        const list = user.role === 'SUPER_ADMIN' 
          ? user.authorizedTenants.filter((t: any) => t.id !== 'all')
          : user.authorizedTenants;
        setProperties(list)
      } else {
        setProperties([{ id: 't_local', name: 'Default Property' }])
      }
    }

    fetchProperties()
  }, [user])

  // Synchronize active property if activePropertyId is not in properties
  useEffect(() => {
    if (properties.length > 0 && !properties.some((p) => p.id === activePropertyId)) {
      const defaultId = properties[0].id
      setActivePropertyId(defaultId)
      if (typeof window !== 'undefined') {
        localStorage.setItem('tenant_id', defaultId)
      }
    }
  }, [properties, activePropertyId])

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
        setCreating(false)
        setNewPropertyName('')
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleSwitch = (id: string) => {
    localStorage.setItem('tenant_id', id)
    window.location.reload()
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPropertyName.trim()) return

    setLoading(true)
    try {
      const res = await api.post('/tenants', { name: newPropertyName })
      localStorage.setItem('tenant_id', res.data.id)
      window.location.reload()
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }

  // If user only has 1 property (and not super admin), switcher dropdown is disabled
  const isMultiProperty = properties.length > 1 || user?.role === 'SUPER_ADMIN';
  const activeProperty = properties.find((p) => p.id === activePropertyId) || properties[0] || { name: 'Loading...' }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => {
          if (isMultiProperty) setOpen(!open)
        }}
        title={activeProperty.name}
        className={cn(
          "flex items-center rounded-xl transition hover:bg-white/50",
          isMultiProperty ? "cursor-pointer" : "cursor-default",
          collapsed ? "h-10 w-10 justify-center p-0" : "w-full justify-between gap-2.5 px-3 py-3"
        )}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="text-left">
              <p className="text-sm font-bold tracking-tight text-slate-900 truncate w-36">
                {activeProperty.name}
              </p>
            </div>
          )}
        </div>
        {!collapsed && isMultiProperty && <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>

      {open && isMultiProperty && (
        <div className={cn(
          "absolute z-50 w-64 rounded-xl border border-white/20 bg-white/95 backdrop-blur-xl shadow-xl animate-fade-in",
          collapsed ? "left-full top-0 ml-3" : "left-4 top-[70px]"
        )}>
          {!creating ? (
            <div className="flex flex-col py-2">
              <div className="px-3 py-2 text-xs font-semibold text-slate-500">
                Switch Property
              </div>
              
              <div className="max-h-60 overflow-y-auto">
                {properties.map((prop) => (
                  <button
                    key={prop.id}
                    onClick={() => handleSwitch(prop.id)}
                    className={cn(
                      "flex w-full items-center justify-between px-4 py-2 text-sm transition hover:bg-white/50",
                      activePropertyId === prop.id ? "bg-white/50 font-medium text-primary" : "text-slate-700"
                    )}
                  >
                    <span className="truncate">{prop.name}</span>
                    {activePropertyId === prop.id && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>

              {user?.role === 'SUPER_ADMIN' && (
                <>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    onClick={() => setCreating(true)}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium text-primary transition hover:bg-white/50"
                  >
                    <Plus className="h-4 w-4" />
                    Create New Property
                  </button>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={handleCreate} className="p-4 flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Property Name</label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newPropertyName}
                  onChange={(e) => setNewPropertyName(e.target.value)}
                  placeholder="e.g. Phase 2 Project"
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  disabled={loading}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

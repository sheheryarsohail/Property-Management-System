'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

// Map URL segments to tab IDs
const ROUTE_TAB_MAP: Record<string, string> = {
  dashboard: 'dashboard',
  properties: 'properties',
  customers: 'customers',
  invoices: 'invoices',
  receipts: 'receipts',
  'development-charges': 'development_charges',
  transfers: 'transfers',
  cancellations: 'cancellations',
  merges: 'merges',
  pdc: 'pdc',
  expenses: 'expenses',
  reports: 'reports',
  users: 'users',
  settings: 'settings',
};

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && user.role !== 'SUPER_ADMIN' && user.allowedTabs && user.allowedTabs.length > 0 && pathname) {
      const topSegment = pathname.split('/')[1];
      const tabId = ROUTE_TAB_MAP[topSegment];
      
      // If navigating to a known tab route that is not in user's allowedTabs
      if (tabId && !user.allowedTabs.includes(tabId)) {
        toast.error('You do not have permission to access this module');
        
        // Find first route permitted for this user
        const firstPermitted = Object.entries(ROUTE_TAB_MAP).find(([_, id]) => user.allowedTabs?.includes(id));
        const destination = firstPermitted ? `/${firstPermitted[0]}` : '/login';
        router.push(destination);
      }
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}

'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { portalApi } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  Building2, 
  User, 
  CreditCard,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText
} from 'lucide-react'

export default function PortalPage() {
  const { accessId } = useParams<{ accessId: string }>()

  const { data, isLoading, error } = useQuery({
    queryKey: ['portal', accessId],
    queryFn: () => portalApi.get(accessId),
    retry: false
  })

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="animate-pulse space-y-4 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-slate-200" />
          <div className="h-4 w-32 rounded bg-slate-200 mx-auto" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm border border-slate-100">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500 mb-6">
            <LockIcon className="h-8 w-8" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-slate-900">Access Denied</h1>
          <p className="text-slate-500">
            This portal link is invalid or has been disabled. Please contact administration for assistance.
          </p>
        </div>
      </div>
    )
  }

  const { customer, summary, properties } = data

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header Profile Section */}
      <div className="bg-white border-b shadow-sm">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-10 w-10" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{customer.fullName}</h1>
            {!customer.fullName && <p className="text-sm font-medium text-muted-foreground">{customer.code}</p>}
            
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-slate-600">
              {(customer.phone || customer.mobile) && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4" />
                  {customer.phone && customer.mobile && customer.phone !== customer.mobile
                    ? `${customer.phone} / ${customer.mobile}`
                    : customer.phone || customer.mobile}
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4" />
                  {customer.email}
                </div>
              )}
              {customer.nationalId && (
                <div className="flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4" />
                  {customer.nationalId}
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {customer.address}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-8">
        
        {/* Properties List */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <Building2 className="h-6 w-6 text-primary" />
            Your Properties
          </h2>
          
          {properties.length === 0 ? (
            <div className="rounded-xl border bg-white p-8 text-center text-slate-500">
              No active properties found.
            </div>
          ) : (
            properties.map((prop: any) => (
              <div key={prop.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm mb-8">
                <div className="p-4 sm:p-6 pb-6">
                  {/* Property Info */}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-slate-900">{prop.property.code} - {prop.property.title}</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                      {prop.property.sizeSqYd} SqYd {prop.property.type ? `• ${prop.property.type}` : ''}
                    </p>
                  </div>

                  {/* 4-Box Layout */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 sm:p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">Property Summary</h4>
                      {prop.status === 'FULLY PAID' ? (
                         <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">FULLY PAID</span>
                      ) : (
                         <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">{prop.status}</span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-lg border border-slate-100 bg-white p-3 sm:p-4 shadow-sm">
                        <p className="text-xs font-medium text-slate-500 mb-1">Total Price</p>
                        <p className="text-[15px] sm:text-[17px] font-bold text-slate-900">{formatCurrency(prop.financials.totalValue)}</p>
                      </div>
                      <div className="rounded-lg border border-slate-100 bg-white p-3 sm:p-4 shadow-sm">
                        <p className="text-xs font-medium text-slate-500 mb-1">Total Paid</p>
                        <p className="text-[15px] sm:text-[17px] font-bold text-emerald-600">{formatCurrency(prop.financials.paid)}</p>
                      </div>
                      <div className="rounded-lg border border-slate-100 bg-white p-3 sm:p-4 shadow-sm">
                        <p className="text-xs font-medium text-slate-500 mb-1">Remaining Balance</p>
                        <p className="text-[15px] sm:text-[17px] font-bold text-slate-700">{formatCurrency(prop.financials.remaining)}</p>
                      </div>
                      <div className="rounded-lg border border-slate-100 bg-white p-3 sm:p-4 shadow-sm">
                        <p className="text-xs font-medium text-slate-500 mb-1">Outstanding Arrears</p>
                        <p className="text-[15px] sm:text-[17px] font-bold text-red-600">{formatCurrency(prop.financials.arrears || 0)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Property Ledger (Receipts) */}
                <div className="p-0 border-t border-slate-100">
                  <div className="bg-white px-4 sm:px-6 py-3 border-b flex justify-between items-center">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Payment History
                    </p>
                    <span className="text-xs font-medium text-slate-400">{prop.receipts.length} Payments</span>
                  </div>
                  {prop.receipts.length > 0 ? (
                    <div className="max-h-[400px] overflow-y-auto bg-slate-50/30">
                      <ul className="divide-y divide-slate-100">
                        {prop.receipts.map((r: any) => (
                          <li key={r.id} className="flex items-center justify-between p-4 sm:px-6 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                <CreditCard className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{r.receiptNo}</p>
                                <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mt-1">
                                  <Calendar className="h-3.5 w-3.5 opacity-70" />
                                  {formatDate(r.receiptDate)} • {r.method}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-4">
                              <p className="font-bold text-[15px] sm:text-base text-emerald-600">+{formatCurrency(r.amount)}</p>
                              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-0.5 inline-block">
                                {r.status === 'POSTED' ? 'PAID' : r.status}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-sm font-medium text-slate-500">
                      No payments recorded yet.
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
      </div>
    </div>
  )
}

function LockIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

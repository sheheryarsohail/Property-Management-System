'use client'

import { Header } from '@/components/layout/header'
import { BarChart3, FileText, Users, Building2, Wallet, TrendingUp, DollarSign } from 'lucide-react'
import Link from 'next/link'

export default function ReportsPage() {
  const reports = [
    {
      title: 'Property Ledger',
      description: 'Plot transaction ledger',
      icon: Building2,
      href: '/reports/property-ledger',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Customer Ledger',
      description: 'Allottee portfolio statement',
      icon: Users,
      href: '/reports/customer-ledger',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Aging Report',
      description: 'Receivables & arrears',
      icon: BarChart3,
      href: '/reports/aging',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'PDC Register',
      description: 'Cheque status register',
      icon: Wallet,
      href: '/reports/pdc-register',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Expense Register',
      description: 'Categorized expense log',
      icon: TrendingUp,
      href: '/reports/expense-register',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Recovery Report',
      description: 'Dev charge allocations',
      icon: DollarSign,
      href: '/reports/recovery',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      title: 'Financial Summary',
      description: 'Profit & loss breakdown',
      icon: DollarSign,
      href: '/reports/financial-summary',
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
    },
    {
      title: 'Cash Flow Report',
      description: 'Income vs expense cash flow',
      icon: TrendingUp,
      href: '/reports/cash-flow',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
  ]

  return (
    <div className="flex flex-col">
      <Header title="Reports" />
      
      <div className="flex-1 space-y-4 p-4 sm:space-y-6 sm:p-6">


        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Link
              key={report.title}
              href={report.href}
              className="group rounded-xl border bg-card p-4 transition-all hover:shadow-md sm:p-6"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className={`shrink-0 rounded-xl p-2.5 sm:p-3 ${report.bgColor}`}>
                  <report.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${report.color}`} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold group-hover:text-primary">
                    {report.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {report.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

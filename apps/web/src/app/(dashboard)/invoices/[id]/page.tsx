'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'

export default function InvoiceDetailPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/invoices')
  }, [router])

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Installments" />
      <div className="flex min-h-[300px] flex-col items-center justify-center space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  )
}

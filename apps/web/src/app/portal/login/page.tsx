'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { portalApi } from '@/lib/api'
import { toast } from 'sonner'
import { 
  Building2, 
  Lock, 
  User, 
  Key, 
  ArrowRight, 
  Home, 
  ShieldCheck, 
  QrCode,
  ArrowLeft
} from 'lucide-react'

export default function CustomerPortalLoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [pinOrPassword, setPinOrPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier.trim() || !pinOrPassword.trim()) {
      toast.error('Please enter your Customer ID / CNIC and Portal PIN')
      return
    }

    setIsLoading(true)
    try {
      const res = await portalApi.login({
        identifier: identifier.trim(),
        pinOrPassword: pinOrPassword.trim(),
      })

      const targetId = res.accessId || (res as any).portalAccessId
      if (targetId) {
        toast.success(`Welcome back, ${res.customerName || 'Customer'}!`)
        router.push(`/portal/${targetId}`)
      } else {
        toast.error('Unable to locate your portal access record')
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || 'Invalid credentials or portal access disabled'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-primary selection:text-white font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white shadow-2xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white font-black text-base shadow-sm">
              SU
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-slate-900 block">SU Developers</span>
              <span className="text-[10px] text-slate-500 block -mt-0.5">
                Marketed by SS Estate & Marketing
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Login Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-7 sm:p-9 shadow-md">
            <div className="text-center mb-7">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Customer Portal Login
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                Enter your registered Customer ID, CNIC, or Mobile along with your secure Portal PIN.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Customer ID / CNIC / Phone
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. CUST-0223 or 42101-..."
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Portal PIN / Password
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="Enter your Portal PIN"
                    value={pinOrPassword}
                    onChange={(e) => setPinOrPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-sm hover:bg-primary/90 active:scale-98 transition disabled:opacity-50"
                >
                  {isLoading ? 'Verifying...' : 'Access My Portal'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600 font-medium">
                <QrCode className="h-4 w-4 text-primary" />
                <span>Physical QR Code access</span>
              </div>
              <p className="text-[11px] text-slate-500">
                You can also scan your physical letter QR code directly with your phone camera to open your portal instantly.
              </p>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Need help accessing your portal? Contact{' '}
            <span className="font-semibold text-slate-700">SS Estate & Marketing</span> desk.
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        SU Developers • Marketed & Managed by SS Estate & Marketing
      </footer>
    </div>
  )
}

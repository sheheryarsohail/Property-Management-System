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
  Sparkles,
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

      if (res.accessId) {
        toast.success(`Welcome back, ${res.customerName || 'Customer'}!`)
        router.push(`/portal/${res.accessId}`)
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
    <div className="relative min-h-screen flex flex-col justify-between bg-[#070b14] text-slate-100 overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/3 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[130px]" />
        <div className="absolute top-1/2 -right-40 h-[600px] w-[600px] rounded-full bg-teal-500/10 blur-[150px]" />
        <div className="absolute -bottom-40 left-10 h-[500px] w-[500px] rounded-full bg-cyan-600/10 blur-[130px]" />
      </div>

      {/* Top Navbar */}
      <header className="relative z-10 mx-auto w-full max-w-6xl px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 font-black text-slate-950 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            SU
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-white block">SU Developers</span>
            <span className="text-[10px] text-slate-400 block -mt-0.5">
              Marketed by SS Estate & Marketing
            </span>
          </div>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition"
        >
          <Home className="h-3.5 w-3.5" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Login Card Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          {/* Glass Card */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-white/[0.02] p-7 sm:p-9 backdrop-blur-2xl shadow-2xl">
            {/* Header info */}
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                Customer Portal Login
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                Enter your registered Customer ID, CNIC, or Phone along with your secure Portal PIN to view your ledger and plot statements.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Customer ID / CNIC / Phone
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. CUST-001 or 42101-..."
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-black/40 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-black/40 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-300 active:scale-98 transition disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="h-4 w-4 border-2 border-slate-950 border-t-transparent animate-spin rounded-full" />
                  ) : (
                    <>
                      <span>Access Portal</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* QR Notice */}
            <div className="mt-6 pt-5 border-t border-white/10 text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <QrCode className="h-3.5 w-3.5 text-emerald-400" />
                <span>Have your official physical letter or QR code?</span>
              </div>
              <p className="text-[11px] text-slate-500">
                You can also scan your QR code directly using your phone camera for instant portal access without typing credentials.
              </p>
            </div>
          </div>

          {/* Help box */}
          <div className="mt-6 text-center text-xs text-slate-500">
            Forgot your Customer ID or PIN? Contact{' '}
            <span className="text-slate-400 font-medium">SS Estate & Marketing</span> desk.
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mx-auto w-full max-w-6xl px-4 py-4 text-center text-xs text-slate-600">
        SU Developers • Marketed & Managed by SS Estate & Marketing
      </footer>
    </div>
  )
}

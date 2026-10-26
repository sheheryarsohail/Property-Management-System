'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { contentApi, portalApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Building2,
  ShieldCheck,
  Megaphone,
  Newspaper,
  User,
  Key,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  Phone,
  Mail,
  MapPin,
  Menu,
  X,
  Search,
  ExternalLink,
  ChevronRight,
  FileText,
  Clock,
  BookOpen
} from 'lucide-react'

type Announcement = {
  id: string
  title: string
  content: string
  category: string
  priority: string
  publishedAt?: string | null
  createdAt: string
  expiresAt?: string | null
}

type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  content: string
  coverImage?: string | null
  category: string
  tags?: string[] | null
  publishedAt?: string | null
  createdAt: string
}

export default function HomePage() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Quick Portal Access state
  const [quickId, setQuickId] = useState('')
  const [quickPin, setQuickPin] = useState('')
  const [isQuickLoggingIn, setIsQuickLoggingIn] = useState(false)

  // Modals state for viewing announcement/blog detail
  const [activeAnnouncement, setActiveAnnouncement] = useState<Announcement | null>(null)
  const [activeBlog, setActiveBlog] = useState<BlogPost | null>(null)
  const [announcementFilter, setAnnouncementFilter] = useState('ALL')

  // Queries
  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ['public-announcements'],
    queryFn: () => contentApi.getAnnouncements(),
  })

  const { data: blogs = [] } = useQuery<BlogPost[]>({
    queryKey: ['public-blogs'],
    queryFn: () => contentApi.getBlogs(),
  })

  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickId.trim() || !quickPin.trim()) {
      toast.error('Please enter Customer ID and PIN')
      return
    }

    setIsQuickLoggingIn(true)
    try {
      const res = await portalApi.login({
        identifier: quickId.trim(),
        pinOrPassword: quickPin.trim(),
      })

      if (res.accessId) {
        toast.success(`Welcome, ${res.customerName || 'Customer'}!`)
        router.push(`/portal/${res.accessId}`)
      } else {
        toast.error('Could not find customer portal record')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid credentials or portal access disabled')
    } finally {
      setIsQuickLoggingIn(false)
    }
  }

  const filteredAnnouncements = announcements.filter((item) => {
    if (announcementFilter === 'ALL') return true
    return item.category === announcementFilter
  })

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 selection:bg-emerald-500 selection:text-white font-sans">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 left-1/4 h-[550px] w-[550px] rounded-full bg-emerald-500/10 blur-[130px]" />
        <div className="absolute top-1/3 -right-32 h-[600px] w-[600px] rounded-full bg-cyan-500/10 blur-[150px]" />
        <div className="absolute bottom-10 left-10 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[140px]" />
      </div>

      {/* Navigation Bar */}
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 font-black text-slate-950 text-lg shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              SU
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white">SU Developers</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-none mt-0.5">
                Marketed by <span className="text-slate-300 font-semibold">SS Estate & Marketing</span>
              </p>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <a href="#announcements" className="hover:text-emerald-400 transition-colors">
              Announcements
            </a>
            <a href="#updates" className="hover:text-emerald-400 transition-colors">
              News & Updates
            </a>
            <a href="#features" className="hover:text-emerald-400 transition-colors">
              About Project
            </a>
            <a href="#contact" className="hover:text-emerald-400 transition-colors">
              Contact
            </a>
          </div>

          {/* Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/portal/login"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-300 transition-all active:scale-98"
            >
              <User className="h-3.5 w-3.5" />
              Customer Portal
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
            >
              Staff Login
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex sm:hidden items-center gap-2">
            <Link
              href="/portal/login"
              className="rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950"
            >
              Portal Login
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl border border-white/10 p-2 text-slate-300 hover:bg-white/5"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-b border-white/10 bg-slate-950/95 px-4 py-4 space-y-3 backdrop-blur-2xl animate-in slide-in-from-top duration-200">
            <a
              href="#announcements"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-200 py-1"
            >
              Announcements
            </a>
            <a
              href="#updates"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-200 py-1"
            >
              News & Updates
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-200 py-1"
            >
              About Project
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-200 py-1"
            >
              Contact
            </a>
            <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
              <Link
                href="/portal/login"
                className="w-full text-center rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-slate-950"
              >
                Customer Portal Login
              </Link>
              <Link
                href="/login"
                className="w-full text-center rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-semibold text-slate-300"
              >
                Staff Admin Login
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 pt-12 pb-16 sm:px-6 sm:pt-20 sm:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Heading and Introduction */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Official Housing & Commercial Development</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">SU Developers</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Transforming modern living with world-class residential and commercial projects. Verified plot ledgers, transparent payment tracking, and real-time development progress at your fingertips.
            </p>

            {/* Managed by highlight badge */}
            <div className="inline-block rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md max-w-md mx-auto lg:mx-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/20 text-teal-300">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Project Management</p>
                  <p className="text-sm font-bold text-white">Marketed by SS Estate & Marketing</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <Link
                href="/portal/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-300 active:scale-98 transition"
              >
                <User className="h-4 w-4" />
                Customer Portal Login
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#announcements"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
              >
                View Latest Notices
              </a>
            </div>
          </div>

          {/* Right Column: Quick Portal Login Glass Card */}
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-white/[0.02] p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Customer Portal</h3>
                    <p className="text-[11px] text-slate-400">Quick plot lookup & statement</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  Instant
                </span>
              </div>

              <form onSubmit={handleQuickLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Customer ID or CNIC
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. CUST-001 or CNIC"
                      value={quickId}
                      onChange={(e) => setQuickId(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-white/10 bg-black/40 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Portal PIN
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="Enter Portal PIN"
                      value={quickPin}
                      onChange={(e) => setQuickPin(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-white/10 bg-black/40 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isQuickLoggingIn}
                  className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-xs sm:text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 active:scale-98 transition disabled:opacity-50"
                >
                  {isQuickLoggingIn ? 'Verifying...' : 'Sign In To Portal'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                <span>Have a physical QR code?</span>
                <span className="text-emerald-400 font-medium">Scan directly with camera</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Announcements & Notices Section */}
      <section id="announcements" className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
              <Megaphone className="h-4 w-4" />
              <span>Official Notices</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Announcements & Notices
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Stay updated with payment schedules, plot ballotings, and site updates.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10 self-start sm:self-auto">
            {['ALL', 'URGENT', 'PAYMENT', 'DEVELOPMENT', 'GENERAL'].map((cat) => (
              <button
                key={cat}
                onClick={() => setAnnouncementFilter(cat)}
                className={`rounded-xl px-3 py-1 text-xs font-semibold transition ${
                  announcementFilter === cat
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredAnnouncements.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-md">
            <Megaphone className="mx-auto h-10 w-10 text-slate-500 mb-3" />
            <h3 className="text-base font-bold text-white">No active notices in this category</h3>
            <p className="text-xs text-slate-400 mt-1">
              Check back soon or select 'ALL' to view all recent project updates.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAnnouncements.map((item) => {
              const isUrgent = item.priority === 'CRITICAL' || item.category === 'URGENT'
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveAnnouncement(item)}
                  className={`group relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl transition-all cursor-pointer hover:-translate-y-1 ${
                    isUrgent
                      ? 'border-rose-500/30 bg-gradient-to-b from-rose-950/30 to-white/5 hover:border-rose-500/50'
                      : 'border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        isUrgent
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {item.category}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(item.createdAt)}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                    {item.content}
                  </p>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-emerald-400">
                    <span>Read details</span>
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Blogs & News Section */}
      <section id="updates" className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
              <Newspaper className="h-4 w-4" />
              <span>Project Articles</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Development Updates & News
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Field reports, infrastructure milestones, and guidance for our members.
            </p>
          </div>
        </div>

        {blogs.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-md">
            <Newspaper className="mx-auto h-10 w-10 text-slate-500 mb-3" />
            <h3 className="text-base font-bold text-white">No articles published yet</h3>
            <p className="text-xs text-slate-400 mt-1">
              Super Admin will be publishing development milestones and progress photos here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveBlog(item)}
                className="group overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-white/[0.02] backdrop-blur-xl transition hover:border-white/20 hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {item.coverImage ? (
                    <div className="h-48 w-full overflow-hidden bg-slate-900 relative">
                      <img
                        src={item.coverImage}
                        alt={item.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="rounded-full bg-slate-950/80 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white border border-white/10">
                          {item.category.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-32 w-full bg-gradient-to-br from-emerald-950/40 to-slate-900 flex items-center justify-center text-slate-500">
                      <Building2 className="h-8 w-8 stroke-1" />
                    </div>
                  )}

                  <div className="p-5 space-y-2">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {formatDate(item.createdAt)}
                    </span>
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    {item.excerpt && (
                      <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                        {item.excerpt}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-cyan-400">
                    <span>Read full article</span>
                    <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Trust & Transparency Feature Grid */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
            Built for Transparency
          </p>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Modern Real Estate Governance
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Eliminating paperwork discrepancies with direct digital ledgers and verified transfer archives.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 mb-4">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">Decoupled Accounts</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Clear separation between Plot Installments and Development Charges for 100% accounting precision.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/20 text-teal-300 mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">Secure Portal PIN</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Every plot holder can sign in on phone or desktop using their registered ID and secure password.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300 mb-4">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">Verified Ownership</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Authenticated transfer history displaying previous owner names and transfer dates transparently.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-300 mb-4">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">SS Estate & Marketing</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Marketed with dedicated customer support, onsite office guidance, and prompt query resolution.
            </p>
          </div>
        </div>
      </section>

      {/* Contact & Footer Section */}
      <footer id="contact" className="relative z-10 border-t border-white/10 bg-slate-950/90 pt-16 pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-white/10">
            {/* Col 1: Brand Info */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 font-black text-slate-950 shadow-md">
                  SU
                </div>
                <div>
                  <span className="text-lg font-black tracking-tight text-white block">SU Developers</span>
                  <span className="text-[10px] text-slate-400 block -mt-0.5">
                    Marketed by SS Estate & Marketing
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                SU Developers is committed to delivering modern housing and commercial developments equipped with complete digital transparency and certified records.
              </p>
              <div className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3.5 py-1.5 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Authorized Development & Marketing
              </div>
            </div>

            {/* Col 2: Navigation Links */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Quick Navigation</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#announcements" className="hover:text-white transition">Public Notices</a></li>
                <li><a href="#updates" className="hover:text-white transition">Project News & Blogs</a></li>
                <li><Link href="/portal/login" className="hover:text-emerald-400 transition font-medium">Customer Portal Login</Link></li>
                <li><Link href="/login" className="hover:text-white transition">Staff Management System</Link></li>
              </ul>
            </div>

            {/* Col 3: Marketing & Assistance Desk */}
            <div className="md:col-span-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Marketing & Customer Desk
              </h4>
              <p className="text-xs text-slate-400">
                Exclusively marketed and managed by <span className="font-semibold text-white">SS Estate & Marketing</span>.
              </p>
              <div className="space-y-2 text-xs text-slate-400 pt-1">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Main Project Office, Site Development Zone</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Customer Support Desk (Mon - Sat)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} SU Developers. All rights reserved.</p>
            <p className="text-[11px] text-slate-600">
              Marketed & Managed by SS Estate & Marketing
            </p>
          </div>
        </div>
      </footer>

      {/* Announcement Detail Reader Modal */}
      {activeAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold">
                  {activeAnnouncement.category}
                </span>
                <span className="text-xs text-slate-400">{formatDate(activeAnnouncement.createdAt)}</span>
              </div>
              <button
                onClick={() => setActiveAnnouncement(null)}
                className="rounded-xl border border-white/10 p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <h3 className="text-xl font-bold text-white mb-4 leading-snug">
              {activeAnnouncement.title}
            </h3>

            <div className="max-h-[60vh] overflow-y-auto text-sm text-slate-300 leading-relaxed whitespace-pre-line space-y-3 pr-2">
              {activeAnnouncement.content}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setActiveAnnouncement(null)}
                className="rounded-xl bg-white/10 px-5 py-2 text-xs font-semibold text-white hover:bg-white/20 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blog Article Reader Modal */}
      {activeBlog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {activeBlog.coverImage && (
              <div className="relative h-56 w-full shrink-0 bg-slate-950">
                <img
                  src={activeBlog.coverImage}
                  alt={activeBlog.title}
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => setActiveBlog(null)}
                  className="absolute top-4 right-4 rounded-xl bg-black/60 p-2 text-white backdrop-blur-md hover:bg-black/80"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-4">
              {!activeBlog.coverImage && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setActiveBlog(null)}
                    className="rounded-xl border border-white/10 p-2 text-slate-400 hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="rounded-full bg-cyan-500/20 text-cyan-300 px-2.5 py-0.5 font-bold">
                  {activeBlog.category.replace('_', ' ')}
                </span>
                <span>•</span>
                <span>{formatDate(activeBlog.createdAt)}</span>
              </div>

              <h2 className="text-2xl font-bold text-white leading-tight">
                {activeBlog.title}
              </h2>

              {activeBlog.excerpt && (
                <p className="text-sm font-medium text-emerald-400 border-l-2 border-emerald-400 pl-3 italic">
                  {activeBlog.excerpt}
                </p>
              )}

              <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line pt-2">
                {activeBlog.content}
              </div>

              {activeBlog.tags && activeBlog.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-4 border-t border-white/10">
                  {activeBlog.tags.map((tag, i) => (
                    <span key={i} className="rounded-lg bg-white/5 border border-white/10 px-2 py-0.5 text-xs text-slate-400">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/10 bg-slate-950/50 flex justify-end">
              <button
                onClick={() => setActiveBlog(null)}
                className="rounded-xl bg-emerald-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
              >
                Close Article
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

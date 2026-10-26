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
  CheckCircle2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Menu,
  X,
  ChevronRight,
  FileText,
  Clock,
  Layers,
  Lock,
  Sparkles
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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  // Quick Portal Access state
  const [quickId, setQuickId] = useState('')
  const [quickPin, setQuickPin] = useState('')
  const [isQuickLoggingIn, setIsQuickLoggingIn] = useState(false)

  // Modals state for viewing announcement / blog detail
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

      const targetId = res.accessId || (res as any).portalAccessId
      if (targetId) {
        toast.success(`Welcome, ${res.customerName || 'Valued Member'}!`)
        router.push(`/portal/${targetId}`)
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

  const urgentAnnouncement = announcements.find(
    (a) => a.priority === 'CRITICAL' || a.category === 'URGENT'
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-primary selection:text-white">
      {/* Top Urgent Alert Bar (if critical announcement exists) */}
      {urgentAnnouncement && (
        <div className="bg-rose-600 text-white px-4 py-2 text-xs sm:text-sm font-medium">
          <div className="mx-auto max-w-7xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 truncate">
              <span className="rounded bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                Urgent Notice
              </span>
              <span className="truncate">{urgentAnnouncement.title}</span>
            </div>
            <button
              onClick={() => setActiveAnnouncement(urgentAnnouncement)}
              className="underline text-xs font-semibold shrink-0 hover:text-white/80"
            >
              Read Details
            </button>
          </div>
        </div>
      )}

      {/* HEADER:
          - Non-sticky on mobile (relative)
          - Sticky glassmorphism on desktop (sm:sticky sm:top-2)
          - Matches dashboard header styling: bg-white/70 backdrop-blur-md border border-white/40 shadow-xs
      */}
      <div className="relative sm:sticky sm:top-2 z-40 mx-auto max-w-7xl px-3 sm:px-6 pt-2 sm:pt-0">
        <header className="flex min-h-[3.75rem] items-center justify-between rounded-xl sm:rounded-2xl border border-white/60 bg-white/80 backdrop-blur-md px-4 sm:px-6 shadow-xs transition-all">
          {/* Logo & Brand Info */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white font-black text-base shadow-sm group-hover:scale-105 transition-transform">
              SU
            </div>
            <div>
              <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 block leading-tight">
                SU Developers
              </span>
              <p className="text-[11px] font-medium text-slate-500 leading-none mt-0.5">
                Marketed by <span className="text-primary font-semibold">SS Estate & Marketing</span>
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
            <a href="#announcements" className="hover:text-primary transition-colors">
              Announcements
            </a>
            <a href="#updates" className="hover:text-primary transition-colors">
              News & Milestones
            </a>
            <a href="#quick-portal" className="hover:text-primary transition-colors">
              Plot Portal
            </a>
            <a href="#about" className="hover:text-primary transition-colors">
              About Project
            </a>
            <a href="#contact" className="hover:text-primary transition-colors">
              Contact
            </a>
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/portal/login"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary/90 transition-all active:scale-98"
            >
              <User className="h-3.5 w-3.5" />
              Customer Portal Login
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              Staff Login
            </Link>
          </div>

          {/* Mobile Right: ONLY clean Hamburger Icon (Customer Portal button is cleanly inside drawer) */}
          <div className="flex sm:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition"
              aria-label="Open Navigation Menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </header>
      </div>

      {/* MOBILE SLIDE-OUT DRAWER / SIDEBAR */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
          {/* Backdrop Blur Overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" 
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Slide-out Sheet Panel */}
          <div className="relative w-full max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between p-6 z-10 animate-in slide-in-from-right duration-300">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white font-extrabold text-sm">
                    SU
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-tight">SU Developers</h3>
                    <p className="text-[10px] text-slate-500 font-medium">SS Estate & Marketing</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Prominent Customer Portal Button in Sidebar on Phone */}
              <div className="mb-6">
                <Link
                  href="/portal/login"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-md hover:bg-primary/95 active:scale-98 transition"
                >
                  <User className="h-4 w-4" />
                  Customer Portal Login
                </Link>
              </div>

              {/* Navigation Links List */}
              <nav className="space-y-1">
                <a
                  href="#announcements"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <span>Announcements & Circulars</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </a>
                <a
                  href="#updates"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <span>News & Milestones</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </a>
                <a
                  href="#quick-portal"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <span>Check Plot Ledger</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </a>
                <a
                  href="#about"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <span>About Project</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </a>
                <a
                  href="#contact"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <span>Contact Desk</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </a>
              </nav>
            </div>

            {/* Bottom Drawer Actions */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <Link
                href="/login"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                <Lock className="h-3.5 w-3.5" />
                Staff Admin Login
              </Link>
              <p className="text-[11px] text-center text-slate-400">
                SU Developers • SS Estate & Marketing
              </p>
            </div>
          </div>
        </div>
      )}

      {/* HERO BANNER SECTION */}
      <section className="relative overflow-hidden bg-slate-900 text-white mt-2 sm:mt-4">
        {/* Architectural Background Banner Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80')`,
          }}
        />
        {/* Rich Dark Navy Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/85 to-slate-950/90" />

        {/* Content Container */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
          <div className="max-w-3xl space-y-6 text-left">
            {/* Top Subtitle Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
              <Building2 className="h-3.5 w-3.5 text-blue-400" />
              <span>SU DEVELOPERS • MASTER HOUSING & COMMERCIAL PROJECTS</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15]">
              Building Prime Living Spaces & Visionary Communities
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base lg:text-lg text-slate-300 leading-relaxed font-normal">
              Official digital portal for plot allocations, transparent installment ledgers, and ongoing development tracking. Proudly developed with modern infrastructure and complete financial integrity.
            </p>

            {/* Marketed By Pill */}
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 border border-white/15 p-3.5 backdrop-blur-md max-w-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm font-bold">
                SS
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  Exclusive Marketing & Management
                </p>
                <p className="text-sm font-bold text-white">
                  SS Estate & Marketing
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <Link
                href="/portal/login"
                className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-primary px-7 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-primary/90 active:scale-98 transition"
              >
                <User className="h-4 w-4" />
                Customer Portal Login
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#announcements"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition backdrop-blur-md"
              >
                View Latest Notices
              </a>
            </div>
          </div>
        </div>

        {/* Highlights Strip (Sitting cleanly inside the banner with zero negative margin overlapping) */}
        <div className="relative z-10 border-t border-white/10 bg-slate-950/90 backdrop-blur-md py-4">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center sm:text-left">
            <div className="border-r border-white/10 last:border-none pr-4">
              <p className="text-xs font-semibold text-slate-400">Ledger Transparency</p>
              <p className="text-sm sm:text-base font-bold text-white mt-0.5">Accurate Real-Time Records</p>
            </div>
            <div className="border-r border-white/10 last:border-none pr-4">
              <p className="text-xs font-semibold text-slate-400">Development Costs</p>
              <p className="text-sm sm:text-base font-bold text-white mt-0.5">Decoupled Accounts</p>
            </div>
            <div className="border-r border-white/10 last:border-none pr-4">
              <p className="text-xs font-semibold text-slate-400">Customer Access</p>
              <p className="text-sm sm:text-base font-bold text-white mt-0.5">Instant QR & PIN Login</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Project Management</p>
              <p className="text-sm sm:text-base font-bold text-white mt-0.5">SS Estate & Marketing</p>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK PLOT STATEMENT & PORTAL LOOKUP SECTION
          - Clean positive top spacing (no negative margin overlapping the banner)
      */}
      <section id="quick-portal" className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-md">
              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4" />
                <span>Instant Plot Lookup</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Check Your Plot Statement Online
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Plot owners can enter their Customer ID, CNIC, or Mobile and Portal PIN to review their installment ledgers.
              </p>
            </div>

            {/* Quick Login Form */}
            <form onSubmit={handleQuickLogin} className="flex-1 max-w-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer ID or CNIC
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. CUST-0223"
                      value={quickId}
                      onChange={(e) => setQuickId(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Portal PIN
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="Enter 4-digit PIN"
                      value={quickPin}
                      onChange={(e) => setQuickPin(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="submit"
                  disabled={isQuickLoggingIn}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-primary/95 active:scale-98 transition disabled:opacity-50"
                >
                  {isQuickLoggingIn ? 'Checking...' : 'Sign In To Portal'}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <Link
                  href="/portal/login"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Need full login page? Click here →
                </Link>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ANNOUNCEMENTS SECTION
          - Tabs in a clean touch carousel on phone (overflow-x-auto, no wrapping)
      */}
      <section id="announcements" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-1">
              <Megaphone className="h-4 w-4" />
              <span>Official Notices</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Announcements & Circulars
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Important alerts, payment deadlines, balloting updates, and site announcements.
            </p>
          </div>

          {/* Touch-Friendly Category Filter Carousel (Never wraps on phone screens) */}
          <div className="w-full sm:w-auto overflow-x-auto no-scrollbar py-1">
            <div className="inline-flex items-center gap-1.5 bg-slate-200/70 p-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
              {['ALL', 'URGENT', 'PAYMENT', 'DEVELOPMENT', 'GENERAL'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setAnnouncementFilter(cat)}
                  className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                    announcementFilter === cat
                      ? 'bg-white text-primary shadow-xs ring-1 ring-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredAnnouncements.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
            <Megaphone className="mx-auto h-10 w-10 text-slate-400 mb-3" />
            <h3 className="text-base font-bold text-slate-800">No active announcements</h3>
            <p className="text-xs text-slate-500 mt-1">
              There are no announcements currently published in this category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAnnouncements.map((item) => {
              const isUrgent = item.priority === 'CRITICAL' || item.category === 'URGENT'
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveAnnouncement(item)}
                  className={`group rounded-2xl border p-5 shadow-xs transition-all hover:shadow-md cursor-pointer flex flex-col justify-between ${
                    isUrgent
                      ? 'border-rose-200 bg-rose-50/40 hover:border-rose-300'
                      : 'border-slate-200/90 bg-white hover:border-primary/40'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          isUrgent
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {item.category}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(item.createdAt)}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {item.content}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-primary">
                    <span>Read full notice</span>
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* BLOGS & DEVELOPMENT UPDATES SECTION */}
      <section id="updates" className="bg-white border-y border-slate-200/80 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-1">
                <Newspaper className="h-4 w-4" />
                <span>On-Site Progress</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Development Updates & News
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Construction milestones, development photos, and project progress reports.
              </p>
            </div>
          </div>

          {blogs.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center">
              <Newspaper className="mx-auto h-10 w-10 text-slate-400 mb-3" />
              <h3 className="text-base font-bold text-slate-800">No project articles yet</h3>
              <p className="text-xs text-slate-500 mt-1">
                Field progress reports and development photos will be published here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {blogs.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setActiveBlog(item)}
                  className="group rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {item.coverImage ? (
                      <div className="h-48 sm:h-52 w-full overflow-hidden bg-slate-100 relative">
                        <img
                          src={item.coverImage}
                          alt={item.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="rounded-full bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 text-[10px] font-bold text-white">
                            {item.category.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-40 w-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Building2 className="h-8 w-8 stroke-1" />
                      </div>
                    )}

                    <div className="p-5 space-y-2.5">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                        <span>{formatDate(item.createdAt)}</span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2">
                        {item.title}
                      </h3>

                      {item.excerpt && (
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                          {item.excerpt}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-primary">
                      <span>Read article</span>
                      <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ABOUT & STANDARDS SECTION */}
      <section id="about" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
            Standard of Excellence
          </p>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Why Choose SU Developers?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Combining authentic real estate development with seamless digital governance.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 font-bold">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Decoupled Financials</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Plot cost installments and development charges are tracked separately to ensure total accounting precision.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 font-bold">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Customer Portal Access</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Every plot owner receives a private online dashboard to view authentic receipts and balance status 24/7.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 font-bold">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Ownership Transfer History</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Authenticated ownership chain displaying genuine transfer dates and past owner records transparently.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 font-bold">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">SS Estate & Marketing</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Exclusive marketing management providing direct client assistance, documentation support, and plot guidance.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="border-t border-slate-200 bg-slate-900 text-white pt-16 pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-slate-800">
            {/* Brand Info */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white font-extrabold text-base">
                  SU
                </div>
                <div>
                  <span className="text-lg font-black tracking-tight text-white block">SU Developers</span>
                  <span className="text-[11px] text-slate-400 block -mt-0.5">
                    Marketed by SS Estate & Marketing
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                SU Developers is committed to delivering premier master-planned housing communities and commercial developments with certified digital ledgers and genuine trust.
              </p>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Quick Navigation</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#announcements" className="hover:text-white transition">Public Notices</a></li>
                <li><a href="#updates" className="hover:text-white transition">Project News & Updates</a></li>
                <li><Link href="/portal/login" className="hover:text-primary transition font-semibold text-white">Customer Portal Login</Link></li>
                <li><Link href="/login" className="hover:text-white transition">Staff Management Login</Link></li>
              </ul>
            </div>

            {/* Assistance Desk */}
            <div className="md:col-span-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Customer Assistance Desk
              </h4>
              <p className="text-xs text-slate-400">
                Marketed & Managed Exclusively by <span className="font-semibold text-white">SS Estate & Marketing</span>.
              </p>
              <div className="space-y-2 text-xs text-slate-400 pt-1">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span>Main Project Development Office</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary shrink-0" />
                  <span>Customer Support & Inquiries Desk</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} SU Developers. All rights reserved.</p>
            <p className="text-[11px] text-slate-400">
              Marketed & Managed by SS Estate & Marketing
            </p>
          </div>
        </div>
      </footer>

      {/* ANNOUNCEMENT READER MODAL */}
      {activeAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-bold">
                  {activeAnnouncement.category}
                </span>
                <span className="text-xs text-slate-400">{formatDate(activeAnnouncement.createdAt)}</span>
              </div>
              <button
                onClick={() => setActiveAnnouncement(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-4 leading-snug">
              {activeAnnouncement.title}
            </h3>

            <div className="overflow-y-auto text-sm text-slate-700 leading-relaxed whitespace-pre-line space-y-3 pr-2">
              {activeAnnouncement.content}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveAnnouncement(null)}
                className="rounded-xl bg-slate-100 px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BLOG ARTICLE READER MODAL */}
      {activeBlog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            {activeBlog.coverImage && (
              <div className="relative h-60 w-full shrink-0 bg-slate-900">
                <img
                  src={activeBlog.coverImage}
                  alt={activeBlog.title}
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => setActiveBlog(null)}
                  className="absolute top-4 right-4 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-4">
              {!activeBlog.coverImage && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setActiveBlog(null)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 font-bold">
                  {activeBlog.category.replace('_', ' ')}
                </span>
                <span>•</span>
                <span>{formatDate(activeBlog.createdAt)}</span>
              </div>

              <h2 className="text-2xl font-black text-slate-900 leading-tight">
                {activeBlog.title}
              </h2>

              {activeBlog.excerpt && (
                <p className="text-sm font-medium text-slate-700 border-l-4 border-primary pl-3 italic">
                  {activeBlog.excerpt}
                </p>
              )}

              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line pt-2">
                {activeBlog.content}
              </div>

              {activeBlog.tags && activeBlog.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-4 border-t border-slate-100">
                  {activeBlog.tags.map((tag, i) => (
                    <span key={i} className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setActiveBlog(null)}
                className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white hover:bg-primary/95 transition"
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

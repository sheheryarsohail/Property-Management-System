
'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { toast } from 'sonner'

import { Header } from '@/components/layout/header'
import { communicationApi, customersApi } from '@/lib/api'
import { SearchableSelect } from '@/components/SearchableSelect'
import { formatDate } from '@/lib/utils'
import { MessageSquare, Mail, Phone, Send, Loader2, Search, X } from 'lucide-react'

type CommunicationEntry = {
  id: string
  channel: string
  subject?: string | null
  body?: string | null
  createdAt: string
  customer?: {
    fullName?: string | null
    code?: string | null
  } | null
}

type CommunicationStats = {
  total?: number
  byChannel?: { channel: string; count: number }[]
}

export default function CommunicationPage() {
  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState<string>('all')

  const queryClient = useQueryClient()

  const {
    data: history = [],
    isLoading: isHistoryLoading,
  } = useQuery<CommunicationEntry[]>({
    queryKey: ['communication-history'],
    queryFn: () => communicationApi.history({}),
  })

  const {
    data: stats,
    isLoading: isStatsLoading,
  } = useQuery<CommunicationStats>({
    queryKey: ['communication-stats'],
    queryFn: () => communicationApi.stats({}),
  })

  const communications = history
  const statistics = stats

  const filteredCommunications = useMemo(() => {
    return communications.filter((entry) => {
      const matchesChannel =
        channelFilter === 'all' ? true : entry.channel?.toLowerCase() === channelFilter.toLowerCase()
      const matchesSearch = search
        ? `${entry.customer?.fullName ?? ''} ${entry.subject ?? ''} ${entry.body ?? ''}`
            .toLowerCase()
            .includes(search.toLowerCase())
        : true
      return matchesChannel && matchesSearch
    })
  }, [communications, channelFilter, search])

  const dueReminderMutation = useMutation({
    mutationFn: () => communicationApi.sendDueReminders({}),
    onSuccess: () => {
      toast.success('Due reminders queued successfully')
      queryClient.invalidateQueries({ queryKey: ['communication-history'] })
      queryClient.invalidateQueries({ queryKey: ['communication-stats'] })
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to send due reminders')
    },
  })

  const overdueReminderMutation = useMutation({
    mutationFn: () => communicationApi.sendOverdueReminders({}),
    onSuccess: () => {
      toast.success('Overdue reminders queued successfully')
      queryClient.invalidateQueries({ queryKey: ['communication-history'] })
      queryClient.invalidateQueries({ queryKey: ['communication-stats'] })
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to send overdue reminders')
    },
  })

  const channelIcon = (channel: string) => {
    switch (channel) {
      case 'EMAIL':
        return <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
      case 'SMS':
      case 'WHATSAPP':
        return <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
      case 'PHONE':
        return <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
      default:
        return <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
    }
  }

  return (
    <div className="flex flex-col">
      <Header title="Communication" />
      
      <div className="flex-1 space-y-4 p-4 sm:space-y-6 sm:p-6">
        {/* Stats */}
        {isStatsLoading ? (
          <div className="grid gap-3 grid-cols-2 sm:gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((skeleton) => (
              <div key={skeleton} className="h-24 animate-pulse rounded-xl border bg-card sm:h-28" />
            ))}
          </div>
        ) : statistics ? (
          <div className="grid gap-3 grid-cols-2 sm:gap-4 md:grid-cols-4">
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground sm:text-sm">Total</p>
              <p className="mt-1 text-xl font-bold sm:mt-2 sm:text-2xl">{statistics.total ?? 0}</p>
            </div>
            {statistics.byChannel?.map((channel) => (
              <div key={channel.channel} className="rounded-xl border bg-card p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground sm:text-sm">{channel.channel}</p>
                <p className="mt-1 text-xl font-bold sm:mt-2 sm:text-2xl">{channel.count}</p>
              </div>
            ))}
          </div>
        ) : null}

        {/* Filters */}
        <div className="rounded-xl border bg-card p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-center h-10 w-full sm:max-w-sm rounded-xl border border-slate-200 bg-white px-3 gap-2 shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition">
              <Search className="h-4 w-4 text-slate-400 shrink-0 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by customer or subject"
                className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none border-none p-0"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Channel</label>
              <SearchableSelect
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                isSearchable={false}
                className="w-40"
                options={[
                  { label: 'All', value: 'all' },
                  { label: 'Email', value: 'EMAIL' },
                  { label: 'SMS', value: 'SMS' },
                  { label: 'Phone', value: 'PHONE' },
                  { label: 'WhatsApp', value: 'WHATSAPP' }
                ]}
              />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border bg-card p-4 sm:p-6">
          <h2 className="mb-3 text-lg font-semibold sm:mb-4">Send Reminders</h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            <button
              type="button"
              onClick={() => dueReminderMutation.mutate()}
              disabled={dueReminderMutation.isPending}
              className="flex items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-accent disabled:opacity-50 sm:p-4"
            >
              <Mail className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Due Invoice Reminders</p>
                <p className="hidden text-xs text-muted-foreground sm:block">Send to customers with due invoices</p>
              </div>
              {dueReminderMutation.isPending && <Loader2 className="ml-auto h-4 w-4 shrink-0 animate-spin text-muted-foreground" />}
            </button>
            <button
              type="button"
              onClick={() => overdueReminderMutation.mutate()}
              disabled={overdueReminderMutation.isPending}
              className="flex items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-accent disabled:opacity-50 sm:p-4"
            >
              <Send className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Overdue Reminders</p>
                <p className="hidden text-xs text-muted-foreground sm:block">Send to customers with overdue invoices</p>
              </div>
              {overdueReminderMutation.isPending && (
                <Loader2 className="ml-auto h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
              )}
            </button>
            <Link
              href="/pdc"
              className="flex items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-accent sm:p-4"
            >
              <Phone className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">PDC Follow-up</p>
                <p className="hidden text-xs text-muted-foreground sm:block">Review upcoming cheques</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Communication History */}
        <div className="rounded-xl border bg-card p-4 sm:p-6">
          <h2 className="mb-3 text-lg font-semibold sm:mb-4">Communication History</h2>
          {isHistoryLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : filteredCommunications.length === 0 ? (
            <div className="py-8 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No communication history yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCommunications.map((comm) => (
                <div key={comm.id} className="rounded-xl border p-3 sm:p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary sm:h-10 sm:w-10">
                        {channelIcon(comm.channel)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-medium">{comm.customer?.fullName || 'N/A'}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium">{comm.channel}</span>
                        </div>
                        {comm.subject && (
                          <p className="mt-1 truncate text-sm font-medium">{comm.subject}</p>
                        )}
                        <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                          {comm.body}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(comm.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

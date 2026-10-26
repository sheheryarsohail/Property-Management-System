'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { contentApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { 
  Megaphone, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  Calendar, 
  AlertCircle,
  CheckCircle2,
  X,
  Sparkles
} from 'lucide-react'

type Announcement = {
  id: string
  title: string
  content: string
  category: string
  priority: string
  targetAudience: string
  isPublished: boolean
  publishedAt?: string | null
  expiresAt?: string | null
  createdAt: string
  author?: {
    id: string
    name: string
    email: string
  } | null
}

export default function AnnouncementsAdminPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Announcement | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'GENERAL',
    priority: 'NORMAL',
    targetAudience: 'ALL',
    isPublished: true,
    expiresAt: '',
  })

  const { data: announcements = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ['admin-announcements', search, selectedCategory],
    queryFn: () => contentApi.adminListAnnouncements({
      search: search || undefined,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
    }),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => contentApi.adminCreateAnnouncement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      toast.success('Announcement published successfully')
      closeModal()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create announcement')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      contentApi.adminUpdateAnnouncement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      toast.success('Announcement updated successfully')
      closeModal()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update announcement')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contentApi.adminDeleteAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      toast.success('Announcement deleted')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete announcement')
    },
  })

  const openCreateModal = () => {
    setEditingItem(null)
    setFormData({
      title: '',
      content: '',
      category: 'GENERAL',
      priority: 'NORMAL',
      targetAudience: 'ALL',
      isPublished: true,
      expiresAt: '',
    })
    setModalOpen(true)
  }

  const openEditModal = (item: Announcement) => {
    setEditingItem(item)
    setFormData({
      title: item.title,
      content: item.content,
      category: item.category,
      priority: item.priority,
      targetAudience: item.targetAudience,
      isPublished: item.isPublished,
      expiresAt: item.expiresAt ? new Date(item.expiresAt).toISOString().split('T')[0] : '',
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingItem(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required')
      return
    }

    const payload = {
      ...formData,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const togglePublish = (item: Announcement) => {
    updateMutation.mutate({
      id: item.id,
      data: { isPublished: !item.isPublished },
    })
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-800 px-2 py-0.5 text-xs font-semibold">Critical</span>
      case 'IMPORTANT':
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-semibold">Important</span>
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-xs font-medium">Normal</span>
    }
  }

  return (
    <div className="flex flex-col">
      <Header title="Announcements" />

      <div className="flex-1 space-y-6 p-4 sm:p-6 max-w-7xl">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search announcements..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-xs"
            >
              <option value="all">All Categories</option>
              <option value="GENERAL">General</option>
              <option value="PAYMENT">Payment</option>
              <option value="DEVELOPMENT">Development</option>
              <option value="EVENT">Event</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 transition active:scale-98"
          >
            <Plus className="h-4 w-4" />
            New Announcement
          </button>
        </div>

        {/* Content Table / Cards */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 text-sm">Loading announcements...</div>
          ) : announcements.length === 0 ? (
            <div className="p-12 text-center">
              <Megaphone className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-base font-semibold text-slate-800">No announcements yet</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Create announcements to notify customers and investors on the homepage.
              </p>
              <button
                onClick={openCreateModal}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" /> Create First Announcement
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {announcements.map((item) => (
                <div key={item.id} className="p-5 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 pr-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-semibold text-slate-900">{item.title}</h4>
                      {getPriorityBadge(item.priority)}
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        {item.category}
                      </span>
                      {item.isPublished ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 text-xs font-medium">
                          <CheckCircle2 className="h-3 w-3" /> Live
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-xs font-medium">
                          Draft
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed whitespace-pre-line">
                      {item.content}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                      <span>Created: {formatDate(item.createdAt)}</span>
                      {item.expiresAt && <span>Expires: {formatDate(item.expiresAt)}</span>}
                      {item.author?.name && <span>By: {item.author.name}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      onClick={() => togglePublish(item)}
                      title={item.isPublished ? 'Unpublish' : 'Publish to Homepage'}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                        item.isPublished 
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {item.isPublished ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      {item.isPublished ? 'Live' : 'Draft'}
                    </button>
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this announcement?')) {
                          deleteMutation.mutate(item.id)
                        }
                      }}
                      className="p-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                {editingItem ? 'Edit Announcement' : 'New Announcement'}
              </h3>
              <button
                onClick={closeModal}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule for Phase 2 Development Payments"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="GENERAL">General</option>
                    <option value="PAYMENT">Payment</option>
                    <option value="DEVELOPMENT">Development</option>
                    <option value="EVENT">Event</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="IMPORTANT">Important</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Content *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write announcement details..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expires On (Optional)</label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                      className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="text-xs font-semibold text-slate-700">Publish Immediately</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 disabled:opacity-50 transition"
                >
                  {editingItem ? 'Save Changes' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

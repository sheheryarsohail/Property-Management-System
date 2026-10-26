'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { contentApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { 
  Newspaper, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  Image as ImageIcon,
  CheckCircle2,
  X,
  Tag,
  BookOpen
} from 'lucide-react'

type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  content: string
  coverImage?: string | null
  category: string
  tags?: string[] | null
  isPublished: boolean
  publishedAt?: string | null
  createdAt: string
  author?: {
    id: string
    name: string
    email: string
  } | null
}

export default function BlogsAdminPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<BlogPost | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    coverImage: '',
    category: 'PROJECT_UPDATE',
    tagsInput: '',
    isPublished: true,
  })

  const { data: blogs = [], isLoading } = useQuery<BlogPost[]>({
    queryKey: ['admin-blogs', search, selectedCategory],
    queryFn: () => contentApi.adminListBlogs({
      search: search || undefined,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
    }),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => contentApi.adminCreateBlog(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blogs'] })
      toast.success('Blog article published')
      closeModal()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to save blog post')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      contentApi.adminUpdateBlog(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blogs'] })
      toast.success('Blog article updated')
      closeModal()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update blog post')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contentApi.adminDeleteBlog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blogs'] })
      toast.success('Blog post deleted')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete blog post')
    },
  })

  const openCreateModal = () => {
    setEditingItem(null)
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      coverImage: '',
      category: 'PROJECT_UPDATE',
      tagsInput: '',
      isPublished: true,
    })
    setModalOpen(true)
  }

  const openEditModal = (item: BlogPost) => {
    setEditingItem(item)
    setFormData({
      title: item.title,
      excerpt: item.excerpt || '',
      content: item.content,
      coverImage: item.coverImage || '',
      category: item.category,
      tagsInput: Array.isArray(item.tags) ? item.tags.join(', ') : '',
      isPublished: item.isPublished,
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

    const tags = formData.tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const payload = {
      title: formData.title,
      excerpt: formData.excerpt || null,
      content: formData.content,
      coverImage: formData.coverImage || null,
      category: formData.category,
      tags,
      isPublished: formData.isPublished,
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const togglePublish = (item: BlogPost) => {
    updateMutation.mutate({
      id: item.id,
      data: { isPublished: !item.isPublished },
    })
  }

  return (
    <div className="flex flex-col">
      <Header title="Blogs & Updates" />

      <div className="flex-1 space-y-6 p-4 sm:p-6 max-w-7xl">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search blogs & news..."
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
              <option value="PROJECT_UPDATE">Project Update</option>
              <option value="SITE_PROGRESS">Site Progress</option>
              <option value="ANNOUNCEMENT">Announcement</option>
              <option value="GUIDE">Customer Guide</option>
              <option value="GENERAL">General</option>
            </select>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 transition active:scale-98"
          >
            <Plus className="h-4 w-4" />
            New Blog Post
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full p-12 text-center text-slate-500 text-sm">Loading articles...</div>
          ) : blogs.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
              <Newspaper className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-base font-semibold text-slate-800">No blog posts yet</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Share construction milestones, project photos, and updates for customers on the homepage.
              </p>
              <button
                onClick={openCreateModal}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" /> Create First Post
              </button>
            </div>
          ) : (
            blogs.map((item) => (
              <div 
                key={item.id} 
                className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden flex flex-col hover:shadow-md transition-shadow"
              >
                {item.coverImage ? (
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="rounded-full bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 text-xs font-semibold text-white">
                        {item.category.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 w-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400">
                    <ImageIcon className="h-8 w-8 stroke-1" />
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">
                        {formatDate(item.createdAt)}
                      </span>
                      {item.isPublished ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-xs font-medium">
                          <CheckCircle2 className="h-3 w-3" /> Live
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          Draft
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-slate-900 line-clamp-2">
                      {item.title}
                    </h4>

                    {item.excerpt && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {item.excerpt}
                      </p>
                    )}

                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                    <button
                      onClick={() => togglePublish(item)}
                      className={`text-xs font-medium inline-flex items-center gap-1.5 ${
                        item.isPublished ? 'text-emerald-700 hover:text-emerald-800' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {item.isPublished ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      {item.isPublished ? 'Published' : 'Hidden'}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                        title="Edit"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this blog post?')) {
                            deleteMutation.mutate(item.id)
                          }
                        }}
                        className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {editingItem ? 'Edit Blog Article' : 'New Blog Article'}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Article Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Boundary Wall Construction Completed for Sector B"
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
                    <option value="PROJECT_UPDATE">Project Update</option>
                    <option value="SITE_PROGRESS">Site Progress</option>
                    <option value="ANNOUNCEMENT">Announcement</option>
                    <option value="GUIDE">Customer Guide</option>
                    <option value="GENERAL">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cover Image URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.coverImage}
                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Short Excerpt (Summary for Cards)</label>
                <input
                  type="text"
                  placeholder="A quick 1-2 sentence preview for homepage visitors..."
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="Development, Sector B, Infrastructure, Roads"
                  value={formData.tagsInput}
                  onChange={(e) => setFormData({ ...formData, tagsInput: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Article Content *</label>
                <textarea
                  required
                  rows={8}
                  placeholder="Write full article content or updates here..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y font-normal"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                  />
                  <span className="text-xs font-semibold text-slate-700">Publish Immediately on Homepage</span>
                </label>

                <div className="flex items-center gap-3">
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
                    {editingItem ? 'Save Changes' : 'Publish Article'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

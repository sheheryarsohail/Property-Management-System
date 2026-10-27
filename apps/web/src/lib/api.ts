import axios, { AxiosResponse } from 'axios'

const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'dev-key-local'
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || 't_local'
const DEFAULT_DEV_PORT = process.env.NEXT_PUBLIC_API_PORT || '3001'

type AxiosWithMetadata = typeof api & {
  __resolvedBase?: string
  __candidates?: string[]
}

const normalizeBase = (maybeUrl: string | undefined | null) => {
  if (!maybeUrl) return null
  try {
    const url = new URL(maybeUrl)
    url.hash = ''
    url.pathname = ''
    url.search = ''
    return url.toString().replace(/\/$/, '')
  } catch {
    return null
  }
}

const buildCandidates = (): string[] => {
  const unique = new Set<string>()

  const fromEnv = normalizeBase(process.env.NEXT_PUBLIC_API_URL)
  if (fromEnv) unique.add(fromEnv)

  const apiPort = DEFAULT_DEV_PORT || '3001'

  const add = (candidate: string) => {
    if (!candidate) return
    unique.add(candidate.replace(/\/$/, ''))
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location
    const protocols = new Set<string>([protocol])
    if (protocol === 'https:') {
      protocols.add('http:')
    }

    protocols.forEach((proto) => add(`${proto}//${hostname}:${apiPort}`))
  } else {
    add(`http://127.0.0.1:${apiPort}`)
    add(`http://localhost:${apiPort}`)
    add(`https://127.0.0.1:${apiPort}`)
    add(`https://localhost:${apiPort}`)
  }

  return Array.from(unique)
}

const getCandidates = (client: AxiosWithMetadata): string[] => {
  if (!client.__candidates || client.__candidates.length === 0) {
    const envUrl = process.env.NEXT_PUBLIC_API_URL
    if (envUrl) {
      client.__candidates = [envUrl.replace(/\/$/, '')]
    } else {
      client.__candidates = buildCandidates()
    }
  }
  return client.__candidates
}

const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
    'x-tenant-id': TENANT_ID,
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const tenantId = localStorage.getItem('tenant_id')
      const token = localStorage.getItem('access_token')
      if (tenantId) {
        if (config.headers && typeof config.headers.set === 'function') {
          config.headers.set('x-tenant-id', tenantId)
        } else if (config.headers) {
          config.headers['x-tenant-id'] = tenantId
        }
      }
      if (token) {
        if (config.headers && typeof config.headers.set === 'function') {
          config.headers.set('Authorization', `Bearer ${token}`)
        } else if (config.headers) {
          config.headers['Authorization'] = `Bearer ${token}`
        }
      }
    }

    const client = api as AxiosWithMetadata
    const candidates = getCandidates(client)

    if (!config.baseURL) {
      const base = client.__resolvedBase ?? candidates[0]
      config.baseURL = base
      ;(config as any).__candidateIndex = candidates.indexOf(base)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    const client = api as AxiosWithMetadata
    if (response.headers && typeof response.headers['content-type'] === 'string' && response.headers['content-type'].includes('text/html')) {
      return Promise.reject(new Error('Received HTML instead of JSON. Wrong base URL?'))
    }
    if (response.config?.baseURL) {
      client.__resolvedBase = response.config.baseURL.replace(/\/$/, '')
    }
    return response
  },
  async (error) => {
    const client = api as AxiosWithMetadata
    const candidates = getCandidates(client)
    const cfg = error.config || {}
    const currentIndex = typeof cfg.__candidateIndex === 'number' ? cfg.__candidateIndex : candidates.indexOf(cfg.baseURL)

    if ((!error.response || error.message === 'Network Error' || error.message.includes('Received HTML')) && currentIndex >= 0) {
      const nextIndex = currentIndex + 1
      if (nextIndex < candidates.length) {
        const nextBase = candidates[nextIndex]
        const retryConfig = {
          ...cfg,
          baseURL: nextBase,
          __candidateIndex: nextIndex,
        }

        // prevent infinite retry loops
        retryConfig.__retryCount = (retryConfig.__retryCount || 0) + 1
        if (retryConfig.__retryCount <= candidates.length) {
          return api.request(retryConfig)
        }
      }
    }

    const message = error.response?.data?.message || error.message || 'An error occurred'
    return Promise.reject(new Error(message))
  }
)

const unwrap = <T>(promise: Promise<AxiosResponse<T>>) => promise.then((res) => res.data)

/**
 * Download a file (PDF/CSV) from the API. Opens a blob URL as a browser download.
 */
export async function downloadFile(path: string, filename: string) {
  const client = api as AxiosWithMetadata
  const candidates = getCandidates(client)
  const base = client.__resolvedBase ?? candidates[0]
  const url = `${base}${path}`

  const tenantId = typeof window !== 'undefined' ? (localStorage.getItem('tenant_id') || TENANT_ID) : TENANT_ID;
  const response = await fetch(url, {
    headers: {
      'x-api-key': API_KEY,
      'x-tenant-id': tenantId,
      'Idempotency-Key': Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    },
  })

  if (!response.ok) {
    throw new Error(`Download failed: ${response.statusText}`)
  }

  const blob = await response.blob()
  const blobUrl = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(blobUrl)
}

/**
 * Export data as CSV — client-side generation from JSON data.
 */
export function exportCsv(data: Record<string, any>[], filename: string) {
  if (!data.length) return
  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = row[h] ?? ''
          return typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))
            ? `"${val.replace(/"/g, '""')}"`
            : String(val)
        })
        .join(',')
    ),
  ]
  const csvString = csvRows.join('\n')
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

// API Functions
export const propertiesApi = {
  list: (params?: any) => unwrap<any[]>(api.get('/properties', { params })),
  get: (id: string) => unwrap<any>(api.get(`/properties/${id}`)),
  create: (data: any) => unwrap<any>(api.post('/properties', data)),
  update: (id: string, data: any) => unwrap<any>(api.put(`/properties/${id}`, data)),
  correctCustomer: (id: string, newCustomerId: string) => unwrap<any>(api.put(`/properties/${id}/correct-customer`, { newCustomerId })),
  delete: (id: string) => unwrap<any>(api.delete(`/properties/${id}`)),
}

export const customersApi = {
  list: (params?: any) => unwrap<any[]>(api.get('/customers', { params })),
  get: (id: string) => api.get(`/customers/${id}`).then(res => res.data),
  create: (data: any) => api.post('/customers', data).then(res => res.data),
  update: (id: string, data: any) => unwrap<any>(api.put(`/customers/${id}`, data)),
  delete: (id: string) => unwrap<any>(api.delete(`/customers/${id}`)),
  updatePortalCredentials: (id: string, data: { pin?: string; password?: string }) =>
    unwrap<any>(api.post(`/customers/${id}/portal-credentials`, data)),
}

export const portalApi = {
  get: (accessId: string) => api.get(`/portal/${accessId}`).then(res => res.data),
  login: (data: { identifier: string; pinOrPassword: string }) =>
    unwrap<{ accessId: string; customerId: string; customerName: string }>(api.post('/portal/login', data)),
}

export const contentApi = {
  // Public
  getAnnouncements: (params?: { category?: string; priority?: string }) =>
    unwrap<any[]>(api.get('/content/announcements', { params })),
  getBlogs: (params?: { category?: string; tag?: string }) =>
    unwrap<any[]>(api.get('/content/blogs', { params })),
  getBlogBySlug: (slug: string) =>
    unwrap<any>(api.get(`/content/blogs/${slug}`)),

  // Admin
  adminListAnnouncements: (params?: any) =>
    unwrap<any[]>(api.get('/content/admin/announcements', { params })),
  adminCreateAnnouncement: (data: any) =>
    unwrap<any>(api.post('/content/admin/announcements', data)),
  adminUpdateAnnouncement: (id: string, data: any) =>
    unwrap<any>(api.put(`/content/admin/announcements/${id}`, data)),
  adminDeleteAnnouncement: (id: string) =>
    unwrap<any>(api.delete(`/content/admin/announcements/${id}`)),

  adminListBlogs: (params?: any) =>
    unwrap<any[]>(api.get('/content/admin/blogs', { params })),
  adminCreateBlog: (data: any) =>
    unwrap<any>(api.post('/content/admin/blogs', data)),
  adminUpdateBlog: (id: string, data: any) =>
    unwrap<any>(api.put(`/content/admin/blogs/${id}`, data)),
  adminDeleteBlog: (id: string) =>
    unwrap<any>(api.delete(`/content/admin/blogs/${id}`)),
}

export const invoicesApi = {
  list: (params?: any) => unwrap<{ data: any[], total: number, page: number, totalPages: number }>(api.get('/invoices', { params })),
  get: (id: string) => unwrap<any>(api.get(`/invoices/${id}`)),
  create: (data: any) => unwrap<any>(api.post('/invoices', data)),
  update: (id: string, data: any) => unwrap<any>(api.put(`/invoices/${id}`, data)),
  downloadPdf: (id: string) => downloadFile(`/invoices/${id}/pdf`, `invoice-${id}.pdf`),
}

export const receiptsApi = {
  list: (params?: any) => unwrap<{ data: any[], total: number, page: number, totalPages: number }>(api.get('/receipts', { params })),
  get: (id: string) => unwrap<any>(api.get(`/receipts/${id}`)),
  create: (data: any) => unwrap<any>(api.post('/receipts', data)),
  update: (id: string, data: any) => unwrap<any>(api.put(`/receipts/${id}`, data)),
  downloadPdf: (id: string) => downloadFile(`/receipts/${id}/pdf`, `receipt-${id}.pdf`),
}

export const paymentPlansApi = {
  list: (params?: any) => unwrap<any[]>(api.get('/payment-plans', { params })),
  get: (id: string) => unwrap<any>(api.get(`/payment-plans/${id}`)),
  create: (data: any) => unwrap<any>(api.post('/payment-plans', data)),
  delete: (id: string) => unwrap<any>(api.delete(`/payment-plans/${id}`)),
}

export const transfersApi = {
  list: (params?: any) => unwrap<any[]>(api.get('/transfers', { params })),
  get: (id: string) => unwrap<any>(api.get(`/transfers/${id}`)),
  create: (data: any) => unwrap<any>(api.post('/transfers', data)),
  submit: (id: string) => unwrap<any>(api.post(`/transfers/${id}/submit`, {})),
  approve: (id: string, data?: any) => unwrap<any>(api.post(`/transfers/${id}/approve`, data || {})),
  reject: (id: string, data?: any) => unwrap<any>(api.post(`/transfers/${id}/reject`, data || {})),
  delete: (id: string) => unwrap<any>(api.delete(`/transfers/${id}`)),
}

export const pdcApi = {
  list: (params?: any) => unwrap<any[]>(api.get('/pdc', { params })),
  create: (data: any) => unwrap<any>(api.post('/pdc', data)),
  deposit: (id: string, data?: any) => unwrap<any>(api.post(`/pdc/${id}/deposit`, data || {})),
  clear: (id: string, data?: any) => unwrap<any>(api.post(`/pdc/${id}/clear`, data || {})),
  bounce: (id: string, data?: any) => unwrap<any>(api.post(`/pdc/${id}/bounce`, data || {})),
  return: (id: string, data?: any) => unwrap<any>(api.post(`/pdc/${id}/return`, data || {})),
  cancel: (id: string, data?: any) => unwrap<any>(api.post(`/pdc/${id}/cancel`, data || {})),
  delete: (id: string) => unwrap<any>(api.delete(`/pdc/${id}`)),
}

export const expensesApi = {
  list: (params?: any) => unwrap<any[]>(api.get('/expenses', { params })),
  get: (id: string) => unwrap<any>(api.get(`/expenses/${id}`)),
  create: (data: any) => unwrap<any>(api.post('/expenses', data)),
}

export const recoveryApi = {
  allocate: (data: any) => unwrap<any>(api.post('/recovery/allocate', data)),
  generateInvoices: (data: any) => unwrap<any>(api.post('/recovery/generate-invoices', data)),
  summary: (poolId: string) => unwrap<any>(api.get(`/recovery/summary/${poolId}`)),
}

export const reportsApi = {
  propertyLedger: (propertyId: string, params?: any) =>
    unwrap<any>(api.get(`/reports/property-ledger/${propertyId}`, { params })),
  customerLedger: (customerId: string, params?: any) =>
    unwrap<any>(api.get(`/reports/customer-ledger/${customerId}`, { params })),
  aging: (params?: any) => unwrap<any>(api.get('/reports/aging', { params })),
  financialSummary: (params?: any) => unwrap<any>(api.get('/reports/financial-summary', { params })),
  pdcRegister: (params?: any) => unwrap<any>(api.get('/reports/pdc-register', { params })),
  expenseRegister: (params?: any) => unwrap<any>(api.get('/reports/expense-register', { params })),
  recovery: (params?: any) => unwrap<any>(api.get('/reports/recovery', { params })),
  cashFlow: (params?: any) => unwrap<any>(api.get('/reports/cash-flow', { params })),
}

export const communicationApi = {
  log: (data: any) => unwrap<any>(api.post('/communication', data)),
  history: (params?: any) => unwrap<any[]>(api.get('/communication/history', { params })),
  sendDueReminders: (data: any) => unwrap<any>(api.post('/communication/reminders/due-invoices', data)),
  sendOverdueReminders: (data: any) => unwrap<any>(api.post('/communication/reminders/overdue-invoices', data)),
  stats: (params?: any) => unwrap<any>(api.get('/communication/stats', { params })),
}

export const dashboardApi = {
  summary: () => unwrap<any>(api.get('/dashboard')),
}

export const statementsApi = {
  propertyStatement: (propertyId: string, params?: any) =>
    unwrap<any>(api.get(`/statements/property/${propertyId}`, { params })),
  customerStatement: (customerId: string, params?: any) =>
    unwrap<any>(api.get(`/statements/customer/${customerId}`, { params })),
  generate: (data: any) => unwrap<any>(api.post('/statements/generate', data)),
  downloadPdf: (id: string) => downloadFile(`/statements/${id}/pdf`, `statement-${id}.pdf`),
  downloadPropertyReport: (propertyId: string, from?: string, to?: string) =>
    downloadFile(
      `/statements/property-report.pdf?propertyId=${propertyId}${from ? `&from=${from}` : ''}${to ? `&to=${to}` : ''}`,
      `property-statement-${propertyId}.pdf`
    ),
}

export const ownershipsApi = {
  list: (params?: any) => unwrap<any[]>(api.get('/ownerships', { params })),
  createActive: (data: any) => unwrap<any>(api.post('/ownerships', data)),
}

export const expensePoolsApi = {
  list: (params?: any) => unwrap<any[]>(api.get('/expense-pools', { params })),
  get: (id: string) => unwrap<any>(api.get(`/expense-pools/${id}`)),
}

export const developmentChargesApi = {
  properties: (params?: any) => unwrap<any>(api.get('/development-charges/properties', { params })),
  setPropertyCharge: (propertyId: string, data: { amount: number; dueDate?: string; phase?: number }) =>
    unwrap<any>(api.put(`/development-charges/properties/${propertyId}`, data)),
  bulkSetCharges: (data: { propertyIds: string[]; amount: number; dueDate?: string }) =>
    unwrap<any>(api.post('/development-charges/bulk-set', data)),
  invoices: (params?: any) => unwrap<any>(api.get('/development-charges/invoices', { params })),
  generate: (data: { pricePerSqYd: number; title: string; dueDate: string }) => 
    unwrap<any>(api.post('/development-charges/generate', data)),
}



export const mergesApi = {
  candidates: (params?: { q?: string }) => unwrap<any[]>(api.get("/merges/candidates", { params })),
  preview: (data: { customerId: string; sourcePropertyIds: string[]; targetPropertyId: string }) =>
    unwrap<any>(api.post("/merges/preview", data)),
  execute: (data: any) => unwrap<any>(api.post("/merges/execute", data)),
  history: (params?: any) => unwrap<any>(api.get("/merges/history", { params })),
  get: (id: string) => unwrap<any>(api.get(`/merges/${id}`)),
};

export const cancellationsApi = {
  defaulters: (params?: any) => unwrap<any>(api.get('/cancellations/defaulters', { params })),
  searchActive: (q?: string) => unwrap<any[]>(api.get('/cancellations/search-active', { params: { q } })),
  preview: (propertyId: string) => unwrap<any>(api.get(`/cancellations/preview/${propertyId}`)),
  execute: (data: any) => unwrap<any>(api.post('/cancellations/execute', data)),
  history: (params?: any) => unwrap<any>(api.get('/cancellations/history', { params })),
  get: (id: string) => unwrap<any>(api.get(`/cancellations/${id}`)),
}

export { api }

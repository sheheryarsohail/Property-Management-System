import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'PKR'): string {
  const safeAmount = Number.isNaN(Number(amount)) ? 0 : Number(amount)
  return `${currency} ${safeAmount.toLocaleString('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

export function formatDate(date: Date | string): string {
  if (!date) return '';
  if (typeof date === 'string') {
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, y, m, d] = match;
      return `${d}/${m}/${y}`;
    }
  }
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    PAID: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    PARTIAL: 'bg-blue-100 text-blue-800',
    PDC: 'bg-purple-100 text-purple-800',
    OVERDUE: 'bg-red-100 text-red-800',
    VOID: 'bg-gray-100 text-gray-800',
    DRAFT: 'bg-gray-100 text-gray-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    AVAILABLE: 'bg-green-100 text-green-800',
    'CANCELLED & AVAILABLE': 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold',
    'Cancelled & Available': 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold',
    'CANCELLED_AVAILABLE': 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold',
    RESERVED: 'bg-amber-100 text-amber-800 border border-amber-200',
    BOOKED: 'bg-blue-100 text-blue-800',
    IN_TRANSFER: 'bg-amber-100 text-amber-800',
    SOLD: 'bg-purple-100 text-purple-800',
    CANCELLED: 'bg-red-100 text-red-800',
    BOUNCED: 'bg-red-100 text-red-800',
  }
  return statusColors[status] || 'bg-gray-100 text-gray-800'
}

'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { customersApi, api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import QRCode from 'react-qr-code'
import { toast } from 'sonner'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  FileText,
  Users,
  Calendar,
  CreditCard,
  Building,
  Edit,
  Globe,
  Lock,
  Download,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  
  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.get(id),
  })

  const togglePortalMutation = useMutation({
    mutationFn: async (isActive: boolean) => {
      const res = await api.post(`/customers/${id}/portal-access`, { isActive })
      return res.data
    },
    onSuccess: () => {
      toast.success('Portal access updated')
      queryClient.invalidateQueries({ queryKey: ['customer', id] })
    },
    onError: () => {
      toast.error('Failed to update portal access')
    }
  })

  const downloadQR = () => {
    const svg = document.getElementById('portal-qr-code');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Add white background
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }
      
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `customer-portal-qr-${cust?.code}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <Header title="Customer Details" />
        <div className="flex-1 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-32 rounded-lg bg-muted" />
            <div className="h-64 rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex flex-col">
        <Header title="Customer Not Found" />
        <div className="flex-1 p-6">
          <div className="rounded-lg border border-dashed p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Customer not found</h3>
            <Link href="/customers" className="mt-4 inline-block text-sm text-primary hover:underline">
              Back to Customers
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const cust: any = customer

  return (
    <div className="flex flex-col">
      <Header title={cust.fullName} />
      
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Link
            href="/customers"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Customers
          </Link>
        </div>

        {/* Header Card */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Users className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{cust.fullName}</h1>
                {!cust.fullName && <p className="text-muted-foreground">{cust.code}</p>}
              </div>
            </div>
            <Link
              href={`/customers/${id}/edit`}
              className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Contact Information */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Contact Information</h2>
            <div className="space-y-3">
              {cust.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{cust.email}</p>
                  </div>
                </div>
              )}
              {cust.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{cust.phone}</p>
                  </div>
                </div>
              )}
              {cust.mobile && cust.mobile !== cust.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Mobile</p>
                    <p className="font-medium">{cust.mobile}</p>
                  </div>
                </div>
              )}
              {cust.cnic && (
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">CNIC</p>
                    <p className="font-medium">{cust.cnic}</p>
                  </div>
                </div>
              )}
              {cust.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{cust.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Nominee Information */}
          {(cust.nomineeName || cust.nomineeRelation || cust.nomineeCnic) && (
            <div className="rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">Nominee Information</h2>
              <div className="space-y-3">
                {cust.nomineeName && (
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{cust.nomineeName}</p>
                    </div>
                  </div>
                )}
                {cust.nomineeRelation && (
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Relation</p>
                      <p className="font-medium">{cust.nomineeRelation}</p>
                    </div>
                  </div>
                )}
                {cust.nomineeCnic && (
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">CNIC</p>
                      <p className="font-medium">{cust.nomineeCnic}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Owned Properties */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Owned Properties</h2>
            {cust.ownerships?.length > 0 ? (
              <div className="space-y-4">
                {cust.ownerships.map((own: any) => (
                  <div key={own.id} className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Building className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{own.property?.code}</p>
                        <p className="text-sm text-muted-foreground">{own.property?.title}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${!own.endDate ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                        {!own.endDate ? 'ACTIVE' : 'TRANSFERRED'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No properties assigned to this customer.</p>
            )}
          </div>

          {/* Additional Info */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Additional Information</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Registered</p>
                  <p className="text-sm font-medium">{formatDate(cust.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Portal Access */}
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Customer Portal
              </h2>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${cust.isPortalActive ? 'text-emerald-600' : 'text-red-600'}`}>
                  {cust.isPortalActive ? 'Active' : 'Disabled'}
                </span>
                <button
                  onClick={() => togglePortalMutation.mutate(!cust.isPortalActive)}
                  disabled={togglePortalMutation.isPending}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${cust.isPortalActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${cust.isPortalActive ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center space-y-4 rounded-xl border bg-slate-50 p-6">
              {!cust.portalAccessId || !cust.isPortalActive ? (
                <div className="flex flex-col items-center text-center text-muted-foreground p-4">
                  <Lock className="mb-2 h-10 w-10 text-slate-400" />
                  <p className="text-sm">
                    {!cust.portalAccessId 
                      ? "Portal access has not been generated for this customer yet. Enable access to generate it." 
                      : "Portal access is currently disabled for this customer."}
                  </p>
                </div>
              ) : (
                  <>
                    <div className="rounded-lg bg-white p-3 shadow-sm border">
                      <QRCode
                        id="portal-qr-code"
                        value={typeof window !== 'undefined' ? `${window.location.origin}/portal/${cust.portalAccessId}` : ''}
                        size={150}
                        level="H"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Scan to access the customer portal</p>
                      <Link 
                        href={`/portal/${cust.portalAccessId}`} 
                        target="_blank"
                        className="text-sm font-medium text-primary hover:underline break-all"
                      >
                        {typeof window !== 'undefined' ? `${window.location.origin}/portal/${cust.portalAccessId}` : ''}
                      </Link>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={downloadQR}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        <Download className="h-4 w-4" />
                        Download QR
                      </button>
                      <button
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            navigator.clipboard.writeText(`${window.location.origin}/portal/${cust.portalAccessId}`)
                            toast.success('Link copied to clipboard')
                          }
                        }}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50"
                      >
                        <Lock className="h-4 w-4" /> {/* Or Copy icon, but Lock is already imported */}
                        Copy Link
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}

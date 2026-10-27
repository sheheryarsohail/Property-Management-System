'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useParams } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { propertiesApi } from '@/lib/api'
import { SearchableSelect } from '@/components/SearchableSelect'
import { toast } from 'sonner'
import { ArrowLeft, ChevronDown, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function EditPropertyPage() {
  const router = useRouter()
  const params = useParams()
  const propertyId = params.id as string
  const queryClient = useQueryClient()

  const { data: property, isLoading: isLoadingProperty } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => propertiesApi.get(propertyId),
    enabled: !!propertyId,
  })

  const [formData, setFormData] = useState({
    code: '',
    prefix: 'R',
    type: 'RESIDENTIAL',
    block: '',
    sizeSqYd: '',
    address: '',
    totalPrice: '',
    isCorner: false,
    isWestOpen: false,
    isRoadFacing: false,
    isParkingFacing: false,
    autoReceiptGeneration: true,
    pricePerSqYd: '',
    discount: '',
    ownMoney: '',
    pricingMethod: 'SQ_YD',
  })

  // Auto-calculate total price
  useEffect(() => {
    const size = parseFloat(formData.sizeSqYd) || 0;
    const price = parseFloat(formData.pricePerSqYd) || 0;
    const discount = parseFloat(formData.discount) || 0;
    const ownMoney = parseFloat(formData.ownMoney) || 0;
    
    if (formData.pricingMethod === 'SQ_YD') {
      if (size > 0 && price > 0) {
        const base = size * price;
        let extra = 0;
        if (formData.isCorner) extra += base * 0.15;
        if (formData.isWestOpen) extra += base * 0.10;
        if (formData.isRoadFacing) extra += base * 0.10;
        if (formData.isParkingFacing) extra += base * 0.10;
        
        const total = base + extra + ownMoney - discount;
        setFormData(prev => {
          if (prev.totalPrice !== total.toString()) {
            return { ...prev, totalPrice: total.toString() }
          }
          return prev;
        });
      }
    }
  }, [
    formData.sizeSqYd, 
    formData.pricePerSqYd, 
    formData.discount, 
    formData.ownMoney,
    formData.isCorner,
    formData.isWestOpen,
    formData.isRoadFacing,
    formData.isParkingFacing,
    formData.pricingMethod,
  ]);

  useEffect(() => {
    if (property) {
      const match = (property.code || '').match(/^(CL|CA|CR|R|C|A|L)-(.*)$/i);
      const extractedPrefix = match
        ? match[1].toUpperCase()
        : (property.type === 'COMMERCIAL' ? 'C' : 'R');
      const extractedCode = match
        ? match[2]
        : (property.code ? property.code.replace(/^[CR]-/, '') : '');

      setFormData({
        code: extractedCode,
        prefix: extractedPrefix,
        type: property.type || 'RESIDENTIAL',
        block: property.block || '',
        sizeSqYd: property.sizeSqYd ? String(property.sizeSqYd) : '',
        address: property.address || '',
        totalPrice: property.totalPrice ? String(property.totalPrice) : '',
        isCorner: property.isCorner || false,
        isWestOpen: property.isWestOpen || false,
        isRoadFacing: property.isRoadFacing || false,
        isParkingFacing: property.isParkingFacing || false,
        autoReceiptGeneration: property.autoReceiptGeneration ?? true,
        pricePerSqYd: property.pricePerSqYd ? String(property.pricePerSqYd) : '',
        discount: property.discount ? String(property.discount) : '',
        ownMoney: property.ownMoney ? String(property.ownMoney) : '',
        pricingMethod: property.pricePerSqYd ? 'SQ_YD' : 'TOTAL',
      })
    }
  }, [property])

  const updateMutation = useMutation({
    mutationFn: (data: any) => propertiesApi.update(propertyId, data),
    onSuccess: () => {
      toast.success('Property updated successfully')
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] })
      router.push(`/properties/${propertyId}`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update property')
    },
  })

  const handlePrefixChange = (newPrefix: string) => {
    setFormData((prev) => {
      let updatedType = prev.type;
      if (newPrefix === 'R') {
        updatedType = 'RESIDENTIAL';
      } else if (['C', 'CL', 'CA', 'CR', 'L'].includes(newPrefix)) {
        updatedType = 'COMMERCIAL';
      }
      return {
        ...prev,
        prefix: newPrefix,
        type: updatedType,
      };
    });
  };

  const handleTypeChange = (newType: string) => {
    setFormData((prev) => {
      let updatedPrefix = prev.prefix;
      if (newType === 'COMMERCIAL' && prev.prefix === 'R') {
        updatedPrefix = 'C';
      } else if (newType === 'RESIDENTIAL' && prev.prefix === 'C') {
        updatedPrefix = 'R';
      }
      return {
        ...prev,
        type: newType,
        prefix: updatedPrefix,
      };
    });
  };

  const handleCodeChange = (val: string) => {
    const match = val.trim().match(/^(CL|CA|CR|R|C|A|L)-(.*)$/i);
    if (match) {
      const matchedPrefix = match[1].toUpperCase();
      const remainingCode = match[2];
      setFormData((prev) => {
        let updatedType = prev.type;
        if (matchedPrefix === 'R') {
          updatedType = 'RESIDENTIAL';
        } else if (['C', 'CL', 'CA', 'CR', 'L'].includes(matchedPrefix)) {
          updatedType = 'COMMERCIAL';
        }
        return {
          ...prev,
          prefix: matchedPrefix,
          code: remainingCode,
          type: updatedType,
        };
      });
      return;
    }
    setFormData((prev) => ({ ...prev, code: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanCode = formData.code.trim().replace(/^(CL|CA|CR|R|C|A|L)-/i, '');
    const codePrefix = `${formData.prefix}-`;
    const fullCode = codePrefix + cleanCode;
    const data = {
      code: fullCode,
      title: `Plot ${fullCode}`,
      type: formData.type,
      block: formData.block || null,
      sizeSqYd: formData.sizeSqYd ? parseFloat(formData.sizeSqYd) : null,
      address: formData.address || '',
      pricePerSqYd: formData.pricePerSqYd ? parseFloat(formData.pricePerSqYd) : null,
      discount: formData.discount ? parseFloat(formData.discount) : null,
      ownMoney: formData.ownMoney ? parseFloat(formData.ownMoney) : null,
      totalPrice: formData.totalPrice ? parseFloat(formData.totalPrice) : null,
      isCorner: formData.isCorner,
      isWestOpen: formData.isWestOpen,
      isRoadFacing: formData.isRoadFacing,
      isParkingFacing: formData.isParkingFacing,
      autoReceiptGeneration: formData.autoReceiptGeneration,
    }
    updateMutation.mutate(data)
  }

  if (isLoadingProperty) {
    return (
      <div className="flex flex-col">
        <Header title="Edit Property" />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <Header title="Edit Property" />

      <div className="flex-1 p-4 sm:p-6">
        <div className="mx-auto max-w-3xl">
          <Link
            href={`/properties/${propertyId}`}
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Property
          </Link>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="rounded-xl border bg-card p-4 sm:p-6">
              <h2 className="mb-4 text-lg font-semibold">Basic Information</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Plot No. <span className="text-red-500">*</span>
                  </label>
                  <div className="flex rounded-lg border bg-background focus-within:ring-2 focus-within:ring-primary overflow-hidden">
                    <div className="relative flex items-center border-r bg-muted">
                      <select
                        aria-label="Plot prefix"
                        value={formData.prefix}
                        onChange={(e) => handlePrefixChange(e.target.value)}
                        className="h-full bg-transparent pl-3 pr-7 py-2 text-sm font-semibold text-foreground focus:outline-none cursor-pointer appearance-none"
                      >
                        <option value="R">R-</option>
                        <option value="C">C-</option>
                        <option value="CL">CL-</option>
                        <option value="CA">CA-</option>
                        <option value="CR">CR-</option>
                        <option value="A">A-</option>
                        <option value="L">L-</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 h-4 w-4 text-muted-foreground" />
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => handleCodeChange(e.target.value)}
                      className="w-full bg-transparent px-3 py-2 text-sm focus:outline-none"
                      placeholder="e.g., 726"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Type</label>
                  <SearchableSelect
                    value={formData.type}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    isSearchable={false}
                    options={[
                      { label: 'Residential', value: 'RESIDENTIAL' },
                      { label: 'Commercial', value: 'COMMERCIAL' }
                    ]}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Block</label>
                  <input
                    type="text"
                    value={formData.block}
                    onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Block A"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Size (sq.yds)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.sizeSqYd}
                    onChange={(e) => setFormData({ ...formData, sizeSqYd: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., 120"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Optional address details"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="rounded-xl border bg-card p-4 sm:p-6">
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">Pricing</h2>
                <div className="flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="pricingMethod" 
                      checked={formData.pricingMethod === 'SQ_YD'} 
                      onChange={() => setFormData({ ...formData, pricingMethod: 'SQ_YD', totalPrice: '' })} 
                      className="text-primary focus:ring-primary"
                    />
                    By Sq. Yd.
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="pricingMethod" 
                      checked={formData.pricingMethod === 'TOTAL'} 
                      onChange={() => setFormData({ ...formData, pricingMethod: 'TOTAL', pricePerSqYd: '' })} 
                      className="text-primary focus:ring-primary"
                    />
                    Fixed Total
                  </label>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium">Price per Sq. Yd.</label>
                  <input
                    type="number"
                    step="0.01"
                    disabled={formData.pricingMethod === 'TOTAL'}
                    value={formData.pricePerSqYd}
                    onChange={(e) => setFormData({ ...formData, pricePerSqYd: e.target.value })}
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${formData.pricingMethod === 'TOTAL' ? 'bg-muted cursor-not-allowed' : 'bg-background'}`}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-emerald-600">Own Money (Added)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.ownMoney}
                    onChange={(e) => setFormData({ ...formData, ownMoney: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0.00 (e.g. 50000)"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-rose-600">Discount (Subtracted)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0.00 (e.g. 50000)"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium">Total Price (Base)</label>
                  <input
                    type="number"
                    step="0.01"
                    readOnly={formData.pricingMethod === 'SQ_YD'}
                    value={formData.totalPrice}
                    onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value })}
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none font-semibold text-primary ${formData.pricingMethod === 'SQ_YD' ? 'bg-muted cursor-not-allowed' : 'bg-background focus:ring-2 focus:ring-primary'}`}
                    placeholder="0.00"
                  />
                  {formData.pricingMethod === 'TOTAL' ? (
                    <p className="mt-1 text-xs text-muted-foreground">Fixed base price for this property.</p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">Automatically calculated including features (+), own money (+), and discount (-).</p>
                  )}
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="rounded-xl border bg-card p-4 sm:p-6">
              <h2 className="mb-4 text-lg font-semibold">Features</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { key: 'isCorner', label: 'Corner Plot' },
                  { key: 'isWestOpen', label: 'West Open' },
                  { key: 'isRoadFacing', label: 'Road Facing' },
                  { key: 'isParkingFacing', label: 'Parking Facing' },
                ].map((feature) => (
                  <label key={feature.key} className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                    <input
                      type="checkbox"
                      checked={(formData as any)[feature.key]}
                      onChange={(e) => setFormData({ ...formData, [feature.key]: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm font-medium">{feature.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
              <Link
                href={`/properties/${propertyId}`}
                className="rounded-lg border px-4 py-2.5 text-center text-sm font-medium hover:bg-accent"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

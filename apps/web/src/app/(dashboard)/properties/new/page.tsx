'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { propertiesApi } from '@/lib/api'
import { SearchableSelect } from '@/components/SearchableSelect'
import { toast } from 'sonner'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import Link from 'next/link'

export default function NewPropertyPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    code: '',
    prefix: 'R',
    type: 'RESIDENTIAL',
    block: '',
    sizeSqYd: '',
    pricingMethod: 'SQ_YD',
    pricePerSqYd: '',
    fixedBasePrice: '',
    discount: '',
    totalPrice: '',
    isCorner: false,
    isWestOpen: false,
    isRoadFacing: false,
    isParkingFacing: false,
    autoReceiptGeneration: true,
  })

  // Auto-calculate total price
  useEffect(() => {
    const size = parseFloat(formData.sizeSqYd) || 0;
    const price = parseFloat(formData.pricePerSqYd) || 0;
    const discount = parseFloat(formData.discount) || 0;
    const fixedBase = parseFloat(formData.fixedBasePrice) || 0;
    
    let total = 0;
    if (formData.pricingMethod === 'SQ_YD') {
      if (size > 0 && price > 0) {
        const base = size * price;
        let extra = 0;
        if (formData.isCorner) extra += base * 0.15;
        if (formData.isWestOpen) extra += base * 0.10;
        if (formData.isRoadFacing) extra += base * 0.10;
        if (formData.isParkingFacing) extra += base * 0.10;
        
        total = base + extra - discount;
      }
    } else {
      if (fixedBase > 0) {
        let extra = 0;
        if (formData.isCorner) extra += fixedBase * 0.15;
        if (formData.isWestOpen) extra += fixedBase * 0.10;
        if (formData.isRoadFacing) extra += fixedBase * 0.10;
        if (formData.isParkingFacing) extra += fixedBase * 0.10;
        
        total = fixedBase + extra - discount;
      }
    }

    setFormData(prev => {
      if (prev.totalPrice !== total.toString()) {
        return { ...prev, totalPrice: total.toString() }
      }
      return prev;
    });
  }, [
    formData.sizeSqYd, 
    formData.pricePerSqYd, 
    formData.fixedBasePrice,
    formData.discount, 
    formData.isCorner,
    formData.isWestOpen,
    formData.isRoadFacing,
    formData.isParkingFacing,
    formData.pricingMethod,
  ]);

  const createMutation = useMutation({
    mutationFn: (data: any) => propertiesApi.create(data),
    onSuccess: () => {
      toast.success('Property created successfully')
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      router.push('/properties')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create property')
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
      pricePerSqYd: formData.pricePerSqYd ? parseFloat(formData.pricePerSqYd) : null,
      discount: formData.discount ? parseFloat(formData.discount) : null,
      totalPrice: formData.totalPrice ? parseFloat(formData.totalPrice) : null,
      isCorner: formData.isCorner,
      isWestOpen: formData.isWestOpen,
      isRoadFacing: formData.isRoadFacing,
      isParkingFacing: formData.isParkingFacing,
      autoReceiptGeneration: formData.autoReceiptGeneration,
      bookingPrice: null,
      confirmationPrice: null,
      installmentPrice: null,
      halfYearlyPrice: null,
      yearlyPrice: null,
      bookingMonths: 1,
      confirmationMonths: 1,
      installmentMonths: 50,
    }
    
    createMutation.mutate(data)
  }

  return (
    <div className="flex flex-col">
      <Header title="Add New Property" />
      
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/properties"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Properties
          </Link>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="rounded-lg border bg-card p-6">
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
              </div>
            </div>

            {/* Features */}
            <div className="rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">Features</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                  <input
                    type="checkbox"
                    checked={formData.isCorner}
                    onChange={(e) => setFormData({ ...formData, isCorner: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium">Corner Plot</span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                  <input
                    type="checkbox"
                    checked={formData.isWestOpen}
                    onChange={(e) => setFormData({ ...formData, isWestOpen: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium">West Open</span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                  <input
                    type="checkbox"
                    checked={formData.isRoadFacing}
                    onChange={(e) => setFormData({ ...formData, isRoadFacing: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium">Road Facing</span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                  <input
                    type="checkbox"
                    checked={formData.isParkingFacing}
                    onChange={(e) => setFormData({ ...formData, isParkingFacing: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium">Park Facing</span>
                </label>
              </div>
            </div>

            {/* Pricing */}
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">Pricing</h2>
                <div className="flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="pricingMethod" 
                      checked={formData.pricingMethod === 'SQ_YD'} 
                      onChange={() => setFormData({ ...formData, pricingMethod: 'SQ_YD', fixedBasePrice: '' })} 
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
                <div>
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
                  <label className="mb-2 block text-sm font-medium">Discount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0.00"
                  />
                </div>
                <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
                  {formData.pricingMethod === 'TOTAL' && (
                    <div>
                      <label className="mb-2 block text-sm font-medium">Fixed Base Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.fixedBasePrice}
                        onChange={(e) => setFormData({ ...formData, fixedBasePrice: e.target.value })}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="0.00"
                      />
                    </div>
                  )}
                  <div className={formData.pricingMethod === 'SQ_YD' ? "md:col-span-2" : ""}>
                    <label className="mb-2 block text-sm font-medium">Final Total Price</label>
                    <input
                      type="number"
                      step="0.01"
                      readOnly
                      value={formData.totalPrice}
                      className="w-full rounded-lg border px-3 py-2 text-sm font-semibold text-primary bg-muted cursor-not-allowed focus:outline-none"
                      placeholder="0.00"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Automatically calculated including features and discounts.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <Link
                href="/properties"
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Property'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

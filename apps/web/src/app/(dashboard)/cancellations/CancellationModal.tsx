'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  ShieldAlert,
  Percent,
} from 'lucide-react';
import { cancellationsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface CancellationModalProps {
  propertyId: string | null;
  onClose: () => void;
  onSuccess: (data: any) => void;
}

export function CancellationModal({ propertyId, onClose, onSuccess }: CancellationModalProps) {
  const queryClient = useQueryClient();

  const { data: preview, isLoading, error } = useQuery({
    queryKey: ['cancellation-preview', propertyId],
    queryFn: () => (propertyId ? cancellationsApi.preview(propertyId) : null),
    enabled: !!propertyId,
  });

  const [applyDeduction, setApplyDeduction] = useState<boolean>(true);
  const [deductionPercent, setDeductionPercent] = useState<number>(20);
  const [manualDeductionAmount, setManualDeductionAmount] = useState<string>('');
  const [isManualDeduction, setIsManualDeduction] = useState<boolean>(false);

  const [refundMethod, setRefundMethod] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER' | 'ONLINE' | 'PDC'>('CASH');
  const [refundReceiptCode, setRefundReceiptCode] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [chequeNumber, setChequeNumber] = useState<string>('');
  const [chequeDate, setChequeDate] = useState<string>('');
  const [refundReference, setRefundReference] = useState<string>('');
  const [reason, setReason] = useState<string>('Overdue Payment Default');
  const [notes, setNotes] = useState<string>('');
  const [refundDate, setRefundDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (preview) {
      setRefundReceiptCode(preview.financials?.suggestedVoucherCode || '');
      setApplyDeduction(true);
      setDeductionPercent(20);
      setIsManualDeduction(false);
      setManualDeductionAmount('');
      if (preview.financials?.isDefaulter) {
        setReason('Overdue Payment Default');
      } else {
        setReason('Mutual Agreement');
      }
    }
  }, [preview]);

  const totalPaid = preview?.financials?.totalPaid || 0;
  const totalDues = preview?.financials?.totalDues || 0;
  
  let deductionAmount = 0;
  if (!applyDeduction) {
    deductionAmount = 0;
  } else if (isManualDeduction) {
    deductionAmount = Math.max(0, parseFloat(manualDeductionAmount) || 0);
  } else {
    deductionAmount = Math.round(totalPaid * (deductionPercent / 100));
  }

  const effectiveDeductionPercent = totalPaid > 0 ? ((deductionAmount / totalPaid) * 100).toFixed(1) : '0';
  const refundAmount = Math.max(0, totalPaid - deductionAmount);

  const cancelMutation = useMutation({
    mutationFn: (payload: any) => cancellationsApi.execute(payload),
    onSuccess: (result) => {
      toast.success('Plot allotment cancelled');
      queryClient.invalidateQueries({ queryKey: ['cancellations'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      onSuccess(result);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to cancel plot');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId || !preview) return;

    if (refundAmount < 0) {
      toast.error('Refund amount cannot be negative');
      return;
    }

    cancelMutation.mutate({
      propertyId,
      totalPaid,
      totalDues,
      deductionPercent: applyDeduction ? (isManualDeduction ? parseFloat(effectiveDeductionPercent) : deductionPercent) : 0,
      deductionAmount,
      refundAmount,
      refundMethod,
      refundReference,
      refundReceiptCode: refundReceiptCode.trim() || undefined,
      bankName: bankName.trim() || undefined,
      chequeNumber: chequeNumber.trim() || undefined,
      chequeDate: chequeDate || undefined,
      reason,
      notes: notes.trim() || undefined,
      refundDate,
    });
  };

  if (!propertyId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#fafafa] rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Cancel Plot Allotment</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground text-sm space-y-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Loading details...</p>
          </div>
        ) : error || !preview ? (
          <div className="p-8 text-center text-destructive text-sm">
            Failed to load plot details.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">


            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border bg-card">
                <span className="text-xs text-muted-foreground block">Total Paid</span>
                <span className="text-base font-extrabold text-foreground">
                  {formatCurrency(totalPaid)}
                </span>
              </div>

              <div className="p-3 rounded-xl border bg-card">
                <span className="text-xs text-muted-foreground block">Overdue Dues</span>
                <span className="text-base font-extrabold text-destructive">
                  {formatCurrency(preview.financials.overdueDues)}
                </span>
              </div>

              <div className="p-3 rounded-xl border bg-card">
                <span className="text-xs text-muted-foreground block">Days Overdue</span>
                <span className="text-base font-extrabold text-foreground">
                  {preview.financials.daysOverdue} Days
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="deduction-toggle"
                    checked={applyDeduction}
                    onChange={(e) => setApplyDeduction(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <label htmlFor="deduction-toggle" className="text-sm font-bold text-foreground cursor-pointer">
                    20% Deduction
                  </label>
                </div>
                <span className="text-xs font-mono font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                  {applyDeduction ? `-${effectiveDeductionPercent}%` : '0%'}
                </span>
              </div>

              {applyDeduction && (
                <div className="pt-2 border-t border-indigo-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Rate (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        disabled={isManualDeduction}
                        value={deductionPercent}
                        onChange={(e) => {
                          setDeductionPercent(parseFloat(e.target.value) || 0);
                        }}
                        className="w-full text-sm font-semibold bg-card border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary disabled:opacity-50"
                      />
                      <Percent className="w-4 h-4 absolute right-3 top-2.5 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-foreground">
                        Deduction Amount (PKR)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsManualDeduction(!isManualDeduction);
                          if (!isManualDeduction) {
                            setManualDeductionAmount(String(deductionAmount));
                          }
                        }}
                        className="text-[11px] text-primary hover:underline"
                      >
                        {isManualDeduction ? 'Reset to %' : 'Custom'}
                      </button>
                    </div>
                    <input
                      type="number"
                      min="0"
                      disabled={!isManualDeduction}
                      value={isManualDeduction ? manualDeductionAmount : deductionAmount}
                      onChange={(e) => setManualDeductionAmount(e.target.value)}
                      className="w-full text-sm font-semibold bg-card border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary disabled:opacity-50"
                    />
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-indigo-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Net Refund:</span>
                <span className="text-2xl font-black text-emerald-600">
                  {formatCurrency(refundAmount)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Payment Method
                </label>
                <select
                  value={refundMethod}
                  onChange={(e: any) => setRefundMethod(e.target.value)}
                  className="w-full text-sm bg-card border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="PDC">Cheque / Pay Order</option>
                  <option value="ONLINE">Online</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Voucher No.
                </label>
                <input
                  type="text"
                  value={refundReceiptCode}
                  onChange={(e) => setRefundReceiptCode(e.target.value)}
                  className="w-full text-sm font-mono font-bold bg-card border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={refundDate}
                  onChange={(e) => setRefundDate(e.target.value)}
                  className="w-full text-sm bg-card border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {(refundMethod === 'PDC' || refundMethod === 'BANK_TRANSFER') && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg border bg-muted/20">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Bank
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full text-sm bg-card border rounded-lg px-3 py-2 text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Cheque #
                  </label>
                  <input
                    type="text"
                    value={chequeNumber}
                    onChange={(e) => setChequeNumber(e.target.value)}
                    className="w-full text-sm bg-card border rounded-lg px-3 py-2 text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Cheque Date
                  </label>
                  <input
                    type="date"
                    value={chequeDate}
                    onChange={(e) => setChequeDate(e.target.value)}
                    className="w-full text-sm bg-card border rounded-lg px-3 py-2 text-foreground"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Reason
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-sm bg-card border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary"
                >
                  <option value="Overdue Payment Default">Overdue Payment Default</option>
                  <option value="Mutual Agreement">Mutual Agreement</option>
                  <option value="Financial Hardship">Financial Hardship</option>
                  <option value="Disputed Booking">Disputed Booking</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Reference
                </label>
                <input
                  type="text"
                  value={refundReference}
                  onChange={(e) => setRefundReference(e.target.value)}
                  className="w-full text-sm bg-card border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-sm bg-card border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={cancelMutation.isPending}
                className="px-4 py-2 rounded-xl border text-sm font-medium hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={cancelMutation.isPending}
                className="px-5 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold shadow hover:opacity-95 transition disabled:opacity-50 flex items-center gap-2"
              >
                {cancelMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    Confirm Cancellation ({formatCurrency(refundAmount)})
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

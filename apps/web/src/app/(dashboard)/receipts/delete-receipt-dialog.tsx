'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2, AlertTriangle, Trash2, Building2, User, Calendar, CreditCard } from 'lucide-react';
import { receiptsApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface DeleteReceiptDialogProps {
  receipt: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteReceiptDialog({
  receipt,
  open,
  onOpenChange,
  onDeleted,
}: DeleteReceiptDialogProps) {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!receipt) return;

    setIsDeleting(true);
    try {
      await receiptsApi.delete(receipt.id);

      toast.success(`Receipt ${receipt.code} deleted successfully. Invoices and ledgers have been restored.`);

      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['property-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['customer-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });

      onOpenChange(false);
      onDeleted?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete receipt');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!receipt) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs animate-fade-in" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <Dialog.Title className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  Delete Receipt
                  <span className="inline-flex rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 uppercase tracking-wide">
                    Super Admin
                  </span>
                </Dialog.Title>
                <p className="text-xs text-slate-500 mt-0.5">
                  Permanent action with automatic ledger reversal
                </p>
              </div>
            </div>
            <Dialog.Close className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          {/* Details Card */}
          <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5 space-y-2.5 text-xs mb-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
              <span className="text-slate-500 font-medium">Receipt Code</span>
              <span className="font-mono font-bold text-slate-900">{receipt.code}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
              <span className="text-slate-500 font-medium">Amount</span>
              <span className="font-black text-slate-900 text-sm">
                {formatCurrency(Number(receipt.amount))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-500">
                <User className="h-3.5 w-3.5" /> Customer
              </span>
              <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                {receipt.customer?.fullName || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-500">
                <Building2 className="h-3.5 w-3.5" /> Property
              </span>
              <span className="font-bold text-slate-800">
                {receipt.property?.code || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-500">
                <Calendar className="h-3.5 w-3.5" /> Received Date
              </span>
              <span className="text-slate-700">
                {formatDate(receipt.receivedAt)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-500">
                <CreditCard className="h-3.5 w-3.5" /> Method
              </span>
              <span className="font-medium text-slate-700">
                {receipt.method}
              </span>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="rounded-xl bg-amber-50/80 border border-amber-200/80 p-3 text-xs text-amber-900 flex items-start gap-2.5 mb-5">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              Deleting this receipt will <strong>revert applied invoice payments</strong> and restore the outstanding balance. Ledgers and statements will be updated immediately.
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => onOpenChange(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-rose-700 transition disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Receipt
                </>
              )}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

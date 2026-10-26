'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Download, UserPlus, ArrowRight, Printer, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { receiptsApi } from '@/lib/api';
import { toast } from 'sonner';

interface CancellationSuccessDialogProps {
  open: boolean;
  onClose: () => void;
  data: {
    cancellationId: string;
    receiptId: string;
    receiptCode: string;
    propertyId: string;
    propertyCode: string;
    customerName: string;
    refundAmount: number;
  } | null;
}

export function CancellationSuccessDialog({ open, onClose, data }: CancellationSuccessDialogProps) {
  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#fafafa] rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Cancellation Completed</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="rounded-xl border bg-muted/40 p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Plot:</span>
            <span className="font-bold text-foreground">Plot {data.propertyCode}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Customer:</span>
            <span className="font-medium text-foreground">{data.customerName}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Voucher No:</span>
            <span className="font-mono font-bold text-indigo-600">{data.receiptCode}</span>
          </div>
          <div className="pt-2 border-t flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Refund Amount:</span>
            <span className="text-lg font-black text-emerald-600">
              {formatCurrency(data.refundAmount)}
            </span>
          </div>
        </div>

        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => {
              receiptsApi.downloadPdf(data.receiptId).catch((err: any) =>
                toast.error(err.message || "Download failed")
              );
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold shadow hover:opacity-95 transition"
          >
            <Download className="w-4 h-4" />
            Download Refund Voucher
          </button>

          <Link
            href={`/print/cancellation-letter/${data.cancellationId}`}
            target="_blank"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-neutral-900 text-white font-semibold shadow hover:bg-black transition"
          >
            <Printer className="w-4 h-4" />
            Print Cancellation Letter
          </Link>

          <Link
            href={`/properties/${data.propertyId}/assign`}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-semibold shadow hover:bg-emerald-700 transition"
          >
            <UserPlus className="w-4 h-4" />
            Re-allocate Plot
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl border bg-card text-muted-foreground text-sm font-medium hover:bg-muted transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

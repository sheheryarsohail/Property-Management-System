'use client';

import React from "react";
import Link from "next/link";
import { CheckCircle2, Download, ExternalLink, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { receiptsApi } from "@/lib/api";
import { toast } from "sonner";

interface MergeSuccessDialogProps {
  open: boolean;
  data: {
    mergeId: string;
    receiptId: string;
    receiptCode: string;
    targetPropertyId: string;
    targetPropertyCode: string;
    totalMergedAmount: number;
    customerName: string;
  } | null;
  onClose: () => void;
}

export function MergeSuccessDialog({ open, data, onClose }: MergeSuccessDialogProps) {
  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#fafafa] rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-foreground">Plots Merged Successfully</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Source allotments surrendered and funds credited to Target Plot {data.targetPropertyCode}
            </p>
          </div>

          <div className="bg-muted/40 rounded-xl p-4 border text-xs space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Client:</span>
              <span className="font-bold text-foreground">{data.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Target Plot:</span>
              <span className="font-bold text-foreground">Plot {data.targetPropertyCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Merged Credit:</span>
              <span className="font-black text-emerald-600 text-sm">{formatCurrency(data.totalMergedAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Voucher Serial #:</span>
              <span className="font-mono font-bold text-foreground">{data.receiptCode}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => {
                receiptsApi.downloadPdf(data.receiptId).catch((err: any) =>
                  toast.error(err.message || "Download failed")
                );
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 text-white font-bold text-xs shadow hover:bg-black transition"
            >
              <Download className="w-4 h-4" />
              Download Voucher
            </button>

            <Link
              href={`/properties/${data.targetPropertyId}`}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border font-semibold text-xs text-foreground hover:bg-muted transition"
            >
              <ExternalLink className="w-4 h-4" />
              View Target Plot
            </Link>
          </div>

          <div>
            <button
              onClick={onClose}
              className="text-xs text-muted-foreground hover:text-foreground underline transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

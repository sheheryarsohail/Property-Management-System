'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Download, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { receiptsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

function numberToWords(num: number): string {
  if (!num || num === 0) return 'Zero';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const format = (n: number): string => {
    if (n < 20) return a[n];
    const digit = n % 10;
    return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : ' ');
  };
  let str = '';
  if (num >= 10000000) {
    str += format(Math.floor(num / 10000000)) + 'Crore ';
    num %= 10000000;
  }
  if (num >= 100000) {
    str += format(Math.floor(num / 100000)) + 'Lakh ';
    num %= 100000;
  }
  if (num >= 1000) {
    str += format(Math.floor(num / 1000)) + 'Thousand ';
    num %= 1000;
  }
  if (num >= 100) {
    str += format(Math.floor(num / 100)) + 'Hundred ';
    num %= 100;
  }
  if (num > 0) {
    str += format(Math.floor(num));
  }
  return str.trim() + ' Rupees Only';
}

export default function RefundReceiptPrintPage() {
  const params = useParams();
  const id = params?.id as string;

  const { data: receipt, isLoading } = useQuery({
    queryKey: ['receipt', id],
    queryFn: () => receiptsApi.get(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 text-sm font-medium text-neutral-600">
        Loading...
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-100 p-4">
        <p className="text-base font-bold text-neutral-900 mb-2">Refund Voucher Not Found</p>
        <Link href="/cancellations" className="text-xs text-primary underline">
          Return to Cancellations
        </Link>
      </div>
    );
  }

  const customer = receipt.customer || {};
  const property = receipt.property || {};
  const cancellation = (receipt as any).cancellation;
  const merge = (receipt as any).merge;
  const refundAmount = Number(receipt.amount || 0);

  const isMerge = receipt.category === "MERGE_ADJUSTMENT" || receipt.code.startsWith("MRG-");
  const voucherTitle = isMerge ? "Plot Merge & Adjustment Voucher" : "{voucherTitle}";
  const voucherStatus = isMerge ? "STATUS: ADJUSTED" : "{voucherStatus}";
  const partyLabel = isMerge ? "Credited / Adjusted To:" : "{partyLabel}";

  const grossPaid = Number(cancellation?.totalPaid ?? receipt.amount);
  const deductionAmount = isMerge ? 0 : Number(cancellation?.deductionAmount ?? Math.max(0, grossPaid - refundAmount));

  let reasonOnly = receipt.notes || cancellation?.reason || merge?.reason || "—";
  if (reasonOnly.includes("Reason:")) {
    reasonOnly = reasonOnly.split("Reason:")[1].trim();
  }

  const renderVoucherHalf = (copyTitle: string) => (
    <div className="border border-neutral-900 rounded-lg p-3.5 bg-white text-neutral-900 flex flex-col justify-between h-[122mm] box-border">
      <div>
        <div className="text-center mb-2.5">
          <div className="inline-block border border-neutral-900 px-6 py-1 rounded">
            <h2 className="text-xs font-black tracking-wider uppercase">
              Cancellation & Refund Voucher
            </h2>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] mb-2.5">
          <div className="border border-neutral-900 rounded px-2.5 py-1 flex items-center gap-2">
            <span className="font-bold">Serial No:</span>
            <span className="font-mono font-bold">{receipt.code}</span>
            <span className="text-neutral-400">|</span>
            <span className="font-bold">Date:</span>
            <span>{new Date(receipt.receivedAt).toLocaleDateString('en-GB')}</span>
          </div>

          <div className="border border-neutral-900 rounded px-3 py-1 flex items-center gap-2 bg-neutral-50">
            <span className="font-black text-neutral-900 uppercase tracking-wider">{copyTitle}</span>
            <span className="text-neutral-400">|</span>
            <span className="font-bold text-emerald-700">STATUS: REFUNDED</span>
          </div>
        </div>

        <table className="w-full border-collapse border border-neutral-900 text-[11px]">
          <tbody>
            <tr className="border-b border-neutral-900">
              <td className="border-r border-neutral-900 px-2 py-1 font-bold bg-neutral-50 w-36">
                Paid / Refunded To:
              </td>
              <td colSpan={3} className="px-2 py-1 font-bold text-center">
                {customer.fullName || '—'}
              </td>
            </tr>

            <tr className="border-b border-neutral-900">
              <td className="border-r border-neutral-900 px-2 py-1 font-bold bg-neutral-50">
                National ID / CNIC:
              </td>
              <td className="border-r border-neutral-900 px-2 py-1 text-center font-mono">
                {customer.nationalId || '—'}
              </td>
              <td className="border-r border-neutral-900 px-2 py-1 font-bold bg-neutral-50 w-28">
                Contact:
              </td>
              <td className="px-2 py-1 text-center">
                {customer.phone || customer.mobile || '—'}
              </td>
            </tr>

            <tr className="border-b border-neutral-900">
              <td className="border-r border-neutral-900 px-2 py-1 font-bold bg-neutral-50">
                Property / Plot:
              </td>
              <td className="border-r border-neutral-900 px-2 py-1 text-center font-bold">
                Plot {property.code || '—'}
              </td>
              <td className="border-r border-neutral-900 px-2 py-1 font-bold bg-neutral-50">
                Project:
              </td>
              <td className="px-2 py-1 text-center font-semibold">
                Gulshan-e-Fatima
              </td>
            </tr>

            <tr className="border-b border-neutral-900">
              <td className="border-r border-neutral-900 px-2 py-1 font-bold bg-neutral-50">
                Total Paid:
              </td>
              <td className="border-r border-neutral-900 px-2 py-1 text-center font-semibold">
                {formatCurrency(grossPaid)}
              </td>
              <td className="border-r border-neutral-900 px-2 py-1 font-bold bg-neutral-50">
                Deduction:
              </td>
              <td className="px-2 py-1 text-center font-semibold text-neutral-800">
                -{formatCurrency(deductionAmount)}
              </td>
            </tr>

            <tr className="border-b border-neutral-900 bg-neutral-100/70">
              <td className="border-r border-neutral-900 px-2 py-1.5 font-bold">
                {isMerge ? 'Consolidated Credit:' : 'Net Refund Amount:'}
              </td>
              <td colSpan={3} className="px-2 py-1.5 font-black text-sm text-center text-emerald-800">
                {formatCurrency(refundAmount)}
              </td>
            </tr>

            <tr className="border-b border-neutral-900">
              <td className="border-r border-neutral-900 px-2 py-1 font-bold bg-neutral-50">
                Amount in Words:
              </td>
              <td colSpan={3} className="px-2 py-1 text-center italic font-semibold">
                {numberToWords(refundAmount)}
              </td>
            </tr>

            <tr className="border-b border-neutral-900">
              <td className="border-r border-neutral-900 px-2 py-1 font-bold bg-neutral-50">
                Payment Mode:
              </td>
              <td colSpan={3} className="px-2 py-1 text-center font-medium">
                {receipt.method}
                {receipt.bankName ? ` (${receipt.bankName})` : ''}
                {receipt.chequeNumber ? ` — Cheque #: ${receipt.chequeNumber}` : ''}
                {receipt.chequeDate ? ` (Date: ${new Date(receipt.chequeDate).toLocaleDateString('en-GB')})` : ''}
              </td>
            </tr>

            <tr>
              <td className="border-r border-neutral-900 px-2 py-1 font-bold bg-neutral-50">
                Notes:
              </td>
              <td colSpan={3} className="px-2 py-1 text-center text-[10px] text-neutral-700 font-medium">
                {reasonOnly}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="pt-2">
        <div className="grid grid-cols-3 gap-6 text-center text-[10px]">
          <div>
            <div className="border-b border-neutral-900 pb-1 mb-1 font-semibold text-transparent select-none">
              Signature
            </div>
            <span className="font-bold">Accountant</span>
          </div>

          <div>
            <div className="border-b border-neutral-900 pb-1 mb-1 font-semibold text-transparent select-none">
              Signature
            </div>
            <span className="font-bold">Authorized Signature</span>
          </div>

          <div>
            <div className="border-b border-neutral-900 pb-1 mb-1 font-semibold text-transparent select-none">
              Signature
            </div>
            <span className="font-bold">Customer Signature</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col items-center py-6">
      <div className="no-print w-full max-w-[210mm] mb-4 flex items-center justify-between px-4 sm:px-0">
        <Link
          href="/cancellations"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              receiptsApi.downloadPdf(receipt.id).catch((err: any) =>
                toast.error(err.message || "Download failed")
              );
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 text-white font-bold text-xs shadow hover:bg-neutral-800 transition"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>

      <div className="a4-page-sheet bg-white shadow-xl flex flex-col justify-between">
        {renderVoucherHalf('Office Copy')}

        <div className="relative my-2 flex items-center justify-center">
          <div className="w-full border-t border-dashed border-neutral-400" />
        </div>

        {renderVoucherHalf('Customer Copy')}
      </div>
    </div>
  );
}

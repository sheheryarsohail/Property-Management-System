'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { expensesApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

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

export default function ExpenseVoucherPrintPage() {
  const params = useParams();
  const id = params?.id as string;

  const { data: expense, isLoading } = useQuery({
    queryKey: ['expense', id],
    queryFn: () => expensesApi.get(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 text-sm font-medium text-neutral-600">
        Loading Expense Voucher...
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-100 p-4">
        <p className="text-base font-bold text-neutral-900 mb-2">Expense Voucher Not Found</p>
        <Link href="/expenses" className="text-xs text-primary underline">
          Return to Expenses
        </Link>
      </div>
    );
  }

  const finalAmount = Number(expense.amount || expense.netAmount || 0);
  const voucherCode = `EXP-${expense.id.slice(-6).toUpperCase()}`;
  const dateStr = formatDate(expense.incurredAt || expense.date);

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col items-center py-6">
      {/* Top action bar (hidden on print) */}
      <div className="no-print w-full max-w-[210mm] mb-4 flex items-center justify-between px-4 sm:px-0">
        <Link
          href="/expenses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Expenses
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 text-white font-bold text-xs shadow hover:bg-neutral-800 transition"
          >
            <Printer className="w-4 h-4" />
            Print Voucher
          </button>
        </div>
      </div>

      {/* Single Printable Voucher */}
      <div className="no-letterhead-sheet !h-auto min-h-[140mm] print:!h-[297mm] bg-white shadow-xl flex flex-col justify-start">
        <div className="border border-neutral-900 rounded-lg p-6 bg-white text-neutral-900 flex flex-col justify-between box-border">
          <div>
            {/* Clean Header: Document Title Only (No PMS, No Tagline) */}
            <div className="text-center mb-3.5">
              <div className="inline-block border-2 border-neutral-900 px-8 py-1.5 rounded bg-neutral-50 shadow-2xs">
                <h1 className="text-sm font-black tracking-widest uppercase text-neutral-900">
                  EXPENSE VOUCHER
                </h1>
              </div>
            </div>

            {/* Info Bar: Voucher No & Date (No Status) */}
            <div className="flex items-center justify-between text-xs mb-3">
              <div className="border border-neutral-900 rounded px-3 py-1 bg-white">
                <span className="font-bold text-neutral-700">Voucher No:</span>{' '}
                <span className="font-mono font-black text-neutral-900">{voucherCode}</span>
              </div>
              <div className="border border-neutral-900 rounded px-3 py-1 bg-white">
                <span className="font-bold text-neutral-700">Date:</span>{' '}
                <span className="font-semibold text-neutral-900">{dateStr}</span>
              </div>
            </div>

            {/* Clean, Precise Table (No Project/Plot, No Expense Type, No Amount Breakdown) */}
            <table className="w-full border-collapse border border-neutral-900 text-[11px]">
              <tbody className="divide-y divide-neutral-900">
                <tr>
                  <td className="border-r border-neutral-900 px-3 py-2 font-bold bg-neutral-50 w-36">
                    Paid To / Payee:
                  </td>
                  <td colSpan={3} className="px-3 py-2 font-bold text-neutral-900">
                    {expense.vendor || expense.vendorName || '—'}
                    {expense.vendorId ? ` [ID: ${expense.vendorId}]` : ''}
                  </td>
                </tr>

                <tr>
                  <td className="border-r border-neutral-900 px-3 py-2 font-bold bg-neutral-50 w-36">
                    Category:
                  </td>
                  <td
                    colSpan={expense.billNo || expense.billNumber ? 1 : 3}
                    className={
                      expense.billNo || expense.billNumber
                        ? 'border-r border-neutral-900 px-3 py-2 font-semibold'
                        : 'px-3 py-2 font-semibold'
                    }
                  >
                    {expense.category || 'OFFICE'}
                    {expense.subcategory ? ` — ${expense.subcategory}` : ''}
                  </td>
                  {(expense.billNo || expense.billNumber) && (
                    <>
                      <td className="border-r border-neutral-900 px-3 py-2 font-bold bg-neutral-50 w-32">
                        Bill / Ref No:
                      </td>
                      <td className="px-3 py-2 font-mono font-medium">
                        {expense.billNo || expense.billNumber}
                        {expense.billDate ? ` (${formatDate(expense.billDate)})` : ''}
                      </td>
                    </>
                  )}
                </tr>

                <tr>
                  <td className="border-r border-neutral-900 px-3 py-2 font-bold bg-neutral-50 w-36">
                    Particulars:
                  </td>
                  <td colSpan={3} className="px-3 py-2 font-medium text-neutral-900">
                    {expense.title || '—'}
                  </td>
                </tr>

                <tr className="bg-neutral-100/70">
                  <td className="border-r border-neutral-900 px-3 py-2.5 font-bold w-36">
                    Total Amount Paid:
                  </td>
                  <td colSpan={3} className="px-3 py-2.5 font-black text-base text-neutral-900 tracking-tight">
                    {formatCurrency(finalAmount)}
                  </td>
                </tr>

                <tr>
                  <td className="border-r border-neutral-900 px-3 py-2 font-bold bg-neutral-50 w-36">
                    Amount in Words:
                  </td>
                  <td colSpan={3} className="px-3 py-2 italic font-semibold text-neutral-900">
                    {numberToWords(finalAmount)}
                  </td>
                </tr>

                {expense.notes && (
                  <tr>
                    <td className="border-r border-neutral-900 px-3 py-2 font-bold bg-neutral-50 w-36">
                      Remarks / Notes:
                    </td>
                    <td colSpan={3} className="px-3 py-2 text-neutral-700 font-medium">
                      {expense.notes}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Three Signatures: Accountant, Manager, Received By */}
          <div className="pt-8">
            <div className="grid grid-cols-3 gap-8 text-center text-xs">
              <div>
                <div className="h-10"></div>
                <div className="border-b border-neutral-900 mb-2"></div>
                <span className="font-bold text-neutral-900">Accountant</span>
              </div>

              <div>
                <div className="h-10"></div>
                <div className="border-b border-neutral-900 mb-2"></div>
                <span className="font-bold text-neutral-900">Manager</span>
              </div>

              <div>
                <div className="h-10"></div>
                <div className="border-b border-neutral-900 mb-2"></div>
                <span className="font-bold text-neutral-900">Received By</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

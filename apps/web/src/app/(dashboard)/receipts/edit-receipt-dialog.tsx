'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2, ShieldAlert, Receipt, Building2, User, Trash2 } from 'lucide-react';
import { receiptsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface EditReceiptDialogProps {
  receipt: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (receipt: any) => void;
}

export function EditReceiptDialog({ receipt, open, onOpenChange, onDelete }: EditReceiptDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [code, setCode] = useState('');
  const [amount, setAmount] = useState<string | number>('');
  const [receivedAt, setReceivedAt] = useState('');
  const [method, setMethod] = useState('CASH');
  const [reference, setReference] = useState('');
  const [bankName, setBankName] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [slipNumber, setSlipNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (receipt && open) {
      setCode(receipt.code || '');
      setAmount(receipt.amount !== undefined ? receipt.amount : '');
      if (receipt.receivedAt) {
        const d = new Date(receipt.receivedAt);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        setReceivedAt(`${yyyy}-${mm}-${dd}`);
      } else {
        setReceivedAt('');
      }
      setMethod(receipt.method || 'CASH');
      setReference(receipt.reference || '');
      setBankName(receipt.bankName || '');
      setChequeNumber(receipt.chequeNumber || '');
      if (receipt.chequeDate) {
        const d = new Date(receipt.chequeDate);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        setChequeDate(`${yyyy}-${mm}-${dd}`);
      } else {
        setChequeDate('');
      }
      setSlipNumber(receipt.slipNumber || '');
      setNotes(receipt.notes || '');
    }
  }, [receipt, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receipt) return;

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid positive amount');
      return;
    }

    if (!code.trim()) {
      toast.error('Receipt number is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        code: code.trim(),
        amount: parsedAmount,
        receivedAt: receivedAt ? new Date(receivedAt).toISOString() : undefined,
        method,
        reference: reference.trim() || undefined,
        bankName: bankName.trim() || undefined,
        chequeNumber: chequeNumber.trim() || undefined,
        chequeDate: chequeDate ? new Date(chequeDate).toISOString() : undefined,
        slipNumber: slipNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      await receiptsApi.update(receipt.id, payload);

      toast.success('Receipt updated successfully. Changes reflected across all ledgers.');
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['property-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['customer-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });

      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update receipt');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!receipt) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs animate-fade-in" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-xl translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-white border border-slate-200 p-6 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  Edit Receipt
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                    <ShieldAlert className="h-3 w-3" />
                    Super Admin
                  </span>
                </Dialog.Title>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update payment details. Allocations, ledgers, and balances will recompute automatically.
                </p>
              </div>
            </div>
            <Dialog.Close className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          {/* Context Banner */}
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 mb-5 grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Customer</span>
                <span className="font-semibold text-slate-800 truncate block">
                  {receipt.customer?.fullName || 'N/A'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Property / Plot</span>
                <span className="font-semibold text-slate-800 block">
                  {receipt.property?.code || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Receipt Code */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Receipt Number
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 font-mono font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="e.g. 001493 or RCP-2026-0001"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Amount (PKR)
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="e.g. 50000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Received Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Received Date
                </label>
                <input
                  type="date"
                  required
                  value={receivedAt}
                  onChange={(e) => setReceivedAt(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>

              {/* Method */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Payment Method
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="PDC">Post-Dated Cheque (PDC)</option>
                  <option value="ONLINE">Online / Card</option>
                </select>
              </div>
            </div>

            {/* Reference */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Reference / Transaction ID
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="Optional payment reference or transaction ID"
              />
            </div>

            {/* Instrument / Cheque / Bank Details */}
            {(method === 'CHEQUE' || method === 'PDC' || method === 'BANK_TRANSFER') && (
              <div className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-3.5 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Instrument / Bank Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      placeholder="e.g. Meezan Bank"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cheque / Instrument No.</label>
                    <input
                      type="text"
                      value={chequeNumber}
                      onChange={(e) => setChequeNumber(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 font-mono focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      placeholder="e.g. 10293847"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cheque Due Date</label>
                    <input
                      type="date"
                      value={chequeDate}
                      onChange={(e) => setChequeDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Deposit Slip / Ref No.</label>
                    <input
                      type="text"
                      value={slipNumber}
                      onChange={(e) => setSlipNumber(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 font-mono focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      placeholder="Deposit slip number"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Notes / Remarks
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="Optional notes regarding this receipt adjustment"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              {onDelete ? (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    onOpenChange(false);
                    onDelete(receipt);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                  title="Delete Receipt (Super Admin)"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Receipt
                </button>
              ) : <div />}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

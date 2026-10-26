'use client';

import { Header } from '@/components/layout/header';

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  GitMerge,
  Search,
  CheckCircle2,
  AlertCircle,
  Building2,
  ArrowRight,
  Download,
  ExternalLink,
  History,
  Layers,
  User,
  CreditCard,
  ShieldCheck,
  RefreshCw,
  X,
} from "lucide-react";
import Link from "next/link";
import { mergesApi, receiptsApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { MergeSuccessDialog } from "./MergeSuccessDialog";

export default function MergesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"merge" | "history">("merge");

  // Selection state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [targetPropertyId, setTargetPropertyId] = useState<string | null>(null);
  const [sourcePropertyIds, setSourcePropertyIds] = useState<string[]>([]);

  // Execution form state
  const [receiptCode, setReceiptCode] = useState("");
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("Consolidation of Allotments");
  const [notes, setNotes] = useState("");

  // History state
  const [historySearch, setHistorySearch] = useState("");
  const [historyPage, setHistoryPage] = useState(1);

  // Success dialog state
  const [successData, setSuccessData] = useState<any>(null);

  // 1. Fetch eligible candidates (customers owning > 1 active plot)
  const { data: candidates = [], isLoading: isLoadingCandidates } = useQuery({
    queryKey: ["merges", "candidates", searchQuery],
    queryFn: () => mergesApi.candidates({ q: searchQuery }),
  });

  // Selected customer object
  const selectedCustomer = useMemo(() => {
    return candidates.find((c: any) => c.id === selectedCustomerId) || null;
  }, [candidates, selectedCustomerId]);

  // Selected customer properties
  const customerProperties = useMemo(() => {
    return selectedCustomer?.properties || [];
  }, [selectedCustomer]);

  // Handle customer selection
  const handleSelectCustomer = (cust: any) => {
    setSelectedCustomerId(cust.id);
    if (cust.properties && cust.properties.length >= 2) {
      setTargetPropertyId(cust.properties[0].id);
      setSourcePropertyIds([cust.properties[1].id]);
    } else {
      setTargetPropertyId(null);
      setSourcePropertyIds([]);
    }
  };

  // Toggle source property
  const toggleSourceProperty = (propertyId: string) => {
    if (propertyId === targetPropertyId) return;
    setSourcePropertyIds((prev) =>
      prev.includes(propertyId) ? prev.filter((id) => id !== propertyId) : [...prev, propertyId]
    );
  };

  // Switch target property
  const handleSetTargetProperty = (propertyId: string) => {
    setTargetPropertyId(propertyId);
    setSourcePropertyIds((prev) => prev.filter((id) => id !== propertyId));
  };

  // 2. Fetch live preview when selections change
  const shouldPreview = !!selectedCustomerId && !!targetPropertyId && sourcePropertyIds.length > 0;
  const { data: previewData, isLoading: isLoadingPreview } = useQuery({
    queryKey: ["merges", "preview", selectedCustomerId, targetPropertyId, sourcePropertyIds],
    queryFn: () =>
      mergesApi.preview({
        customerId: selectedCustomerId!,
        targetPropertyId: targetPropertyId!,
        sourcePropertyIds,
      }),
    enabled: shouldPreview,
  });

  // Keep receiptCode initialized with suggested code if not manually set
  React.useEffect(() => {
    if (previewData?.financials?.suggestedReceiptCode && !receiptCode) {
      setReceiptCode(previewData.financials.suggestedReceiptCode);
    }
  }, [previewData?.financials?.suggestedReceiptCode]);

  // 3. Execute merge mutation
  const mergeMutation = useMutation({
    mutationFn: (payload: any) => mergesApi.execute(payload),
    onSuccess: (result) => {
      toast.success("Plots merged successfully");
      queryClient.invalidateQueries({ queryKey: ["merges"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setSuccessData(result);
      // Reset selections
      setSelectedCustomerId(null);
      setTargetPropertyId(null);
      setSourcePropertyIds([]);
      setReceiptCode("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to execute merge");
    },
  });

  const handleSubmitMerge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !targetPropertyId || sourcePropertyIds.length === 0) {
      toast.error("Please select a target plot and at least one source plot to merge");
      return;
    }

    mergeMutation.mutate({
      customerId: selectedCustomerId,
      targetPropertyId,
      sourcePropertyIds,
      receiptCode: receiptCode.trim() || undefined,
      receiptDate,
      reason,
      notes: notes.trim() || undefined,
    });
  };

  // 4. Fetch merge history
  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["merges", "history", historySearch, historyPage],
    queryFn: () => mergesApi.history({ q: historySearch, page: historyPage, limit: 50 }),
    enabled: activeTab === "history",
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Header
        title="Merges"
        actions={
          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setActiveTab("merge")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "merge" ? "bg-white text-primary shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Merge Plots</span>
              <span className="sm:hidden">Merge</span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "history" ? "bg-white text-primary shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Merge History</span>
              <span className="sm:hidden">History</span>
            </button>
          </div>
        }
      />

      {activeTab === "merge" ? (
        <div className="space-y-6">
          {/* Customer Selection Section */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Select Client
                </h2>
              </div>

              {/* Search Bar */}
              <div className="flex items-center h-10 w-full sm:w-80 rounded-xl border border-slate-200 bg-white px-3 gap-2 shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition">
                <Search className="h-4 w-4 text-slate-400 shrink-0 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by client name, CNIC, or plot..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none border-none p-0"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Candidates Chips / Selector */}
            {isLoadingCandidates ? (
              <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Loading clients...
              </div>
            ) : candidates.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                No clients found with more than 1 active plot.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-1">
                {candidates.map((cust: any) => {
                  const isSelected = selectedCustomerId === cust.id;
                  return (
                    <button
                      type="button"
                      key={cust.id}
                      onClick={() => handleSelectCustomer(cust)}
                      className={`text-left p-3.5 rounded-xl border transition flex flex-col justify-between ${
                        isSelected
                          ? "bg-primary/5 border-primary shadow-sm"
                          : "bg-card hover:bg-muted/40 border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-bold text-sm text-foreground block">{cust.fullName}</span>
                          <span className="text-[11px] text-muted-foreground block">
                            {cust.nationalId || cust.phone || cust.mobile || cust.code}
                          </span>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                          {cust.activePlotsCount} Plots
                        </span>
                      </div>

                      <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">
                          Plots: {cust.properties.map((p: any) => p.code).join(", ")}
                        </span>
                        <span className="font-semibold text-foreground">
                          {formatCurrency(cust.grandTotalPaid)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Plot Consolidation Work Area (Only when customer is selected) */}
          {selectedCustomer && (
            <form onSubmit={handleSubmitMerge} className="space-y-6">
              {/* Properties Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    Select Target & Sources
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Selected Client: <strong className="text-foreground">{selectedCustomer.fullName}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customerProperties.map((prop: any) => {
                    const isTarget = targetPropertyId === prop.id;
                    const isSource = sourcePropertyIds.includes(prop.id);

                    return (
                      <div
                        key={prop.id}
                        className={`rounded-2xl border p-4 transition relative flex flex-col justify-between ${
                          isTarget
                            ? "bg-emerald-500/5 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                            : isSource
                            ? "bg-amber-500/5 border-amber-400 shadow-sm"
                            : "bg-card border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <span className="text-base font-black text-foreground block">
                                Plot {prop.code}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {prop.sizeSqYd ? `${prop.sizeSqYd} Sq.Yd` : "Plot"} • {prop.type || "Residential"}
                              </span>
                            </div>

                            {isTarget ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase bg-emerald-600 text-white">
                                Target (Keep)
                              </span>
                            ) : isSource ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase bg-amber-500 text-white">
                                Surrender & Merge
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
                                Active
                              </span>
                            )}
                          </div>

                          <div className="space-y-1.5 text-xs bg-muted/20 p-2.5 rounded-xl border border-border/40">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total Paid:</span>
                              <span className="font-extrabold text-foreground">
                                {formatCurrency(prop.totalPaid)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Outstanding Dues:</span>
                              <span className={`font-extrabold ${prop.totalDues > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                                {formatCurrency(prop.totalDues)}
                              </span>
                            </div>
                            {prop.overdueDues > 0 && (
                              <div className="flex justify-between text-[11px]">
                                <span className="text-destructive font-medium">Overdue:</span>
                                <span className="text-destructive font-bold">{formatCurrency(prop.overdueDues)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons on Card */}
                        <div className="mt-4 pt-3 border-t border-border/60 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSetTargetProperty(prop.id)}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition ${
                              isTarget
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "bg-muted/60 text-foreground hover:bg-muted"
                            }`}
                          >
                            {isTarget ? "✓ Target Plot" : "Set as Target"}
                          </button>

                          <button
                            type="button"
                            disabled={isTarget}
                            onClick={() => toggleSourceProperty(prop.id)}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition disabled:opacity-30 disabled:cursor-not-allowed ${
                              isSource
                                ? "bg-amber-500 text-white shadow-sm"
                                : "border hover:bg-muted/40 text-foreground"
                            }`}
                          >
                            {isSource ? "✓ Surrendering" : "Merge Funds"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Financial Consolidation & Adjustment Voucher Form */}
              {shouldPreview && previewData && (
                <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-5">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Merge Summary
                  </h3>

                  {/* Numbers Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="p-4 rounded-xl border bg-amber-500/5 border-amber-200">
                      <span className="text-xs text-muted-foreground block">Surrendered Plots</span>
                      <span className="text-lg sm:text-xl font-bold text-amber-600 mt-1 block">
                        {previewData.sourceProperties?.map((p: any) => p.code).join(", ") || "—"}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl border bg-emerald-500/5 border-emerald-200">
                      <span className="text-xs text-muted-foreground block">Consolidated Credit</span>
                      <span className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1 block">
                        {formatCurrency(previewData.financials?.totalMergedAmount || 0)}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl border bg-card">
                      <span className="text-xs text-muted-foreground block">
                        Target Plot {previewData.targetProperty?.code} Balance
                      </span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-sm line-through text-muted-foreground">
                          {formatCurrency(previewData.targetProperty?.currentDues || 0)}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-lg sm:text-xl font-bold text-foreground">
                          {formatCurrency(previewData.targetProperty?.newDuesAfterMerge || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Voucher Form Fields */}
                  <div className="pt-3 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">
                        Adjustment Voucher No.
                      </label>
                      <input
                        type="text"
                        value={receiptCode}
                        onChange={(e) => setReceiptCode(e.target.value)}
                        placeholder="e.g. MRG-0001"
                        className="w-full text-sm font-mono font-bold bg-card border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">
                        Voucher Date
                      </label>
                      <input
                        type="date"
                        value={receiptDate}
                        onChange={(e) => setReceiptDate(e.target.value)}
                        className="w-full text-sm bg-card border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">
                        Reason
                      </label>
                      <select
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full text-sm bg-card border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary"
                      >
                        <option value="Consolidation of Allotments">Consolidation of Allotments</option>
                        <option value="Payment Adjustment">Payment Adjustment</option>
                        <option value="Mutual Agreement">Mutual Agreement</option>
                        <option value="Financial Relief">Financial Relief</option>
                        <option value="Voluntary Surrender & Merge">Voluntary Surrender & Merge</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t">
                    <button
                      type="submit"
                      disabled={mergeMutation.isPending}
                      className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow hover:opacity-95 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {mergeMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing Merge...
                        </>
                      ) : (
                        <>
                          <GitMerge className="w-4 h-4" />
                          Confirm & Merge Plots ({formatCurrency(previewData.financials?.totalMergedAmount || 0)})
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      ) : (
        /* History Tab */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center h-10 w-full sm:w-80 rounded-xl border border-slate-200 bg-white px-3 gap-2 shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition">
              <Search className="h-4 w-4 text-slate-400 shrink-0 pointer-events-none" />
              <input
                type="text"
                placeholder="Search history by client, plot, or voucher..."
                value={historySearch}
                onChange={(e) => {
                  setHistorySearch(e.target.value);
                  setHistoryPage(1);
                }}
                className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none border-none p-0"
              />
              {historySearch && (
                <button
                  type="button"
                  onClick={() => setHistorySearch('')}
                  className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 border-b text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Surrendered Plot(s)</th>
                    <th className="px-4 py-3">Target Plot</th>
                    <th className="px-4 py-3 text-right">Consolidated Credit</th>
                    <th className="px-4 py-3">Voucher No.</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs">
                  {isLoadingHistory ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-muted-foreground">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Loading merge history...
                      </td>
                    </tr>
                  ) : historyData?.data?.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-muted-foreground">
                        No merge transactions recorded.
                      </td>
                    </tr>
                  ) : (
                    historyData?.data?.map((m: any) => {
                      const sourceCodes = Array.isArray(m.sourceDetails)
                        ? m.sourceDetails.map((s: any) => s.propertyCode).join(", ")
                        : "—";

                      return (
                        <tr key={m.id} className="hover:bg-muted/30 transition">
                          <td className="px-4 py-3.5 whitespace-nowrap text-muted-foreground">
                            {formatDate(m.mergedAt)}
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-foreground">
                            {m.customer?.fullName || "—"}
                          </td>
                          <td className="px-4 py-3.5 font-medium text-amber-600">
                            {sourceCodes}
                          </td>
                          <td className="px-4 py-3.5 font-bold text-emerald-700">
                            Plot {m.targetProperty?.code}
                          </td>
                          <td className="px-4 py-3.5 text-right font-black text-emerald-600 text-sm">
                            {formatCurrency(Number(m.totalMergedAmount))}
                          </td>
                          <td className="px-4 py-3.5 font-mono font-bold text-foreground">
                            {m.receipt?.code || "—"}
                          </td>
                          <td className="px-4 py-3.5 max-w-xs truncate text-foreground" title={m.reason}>
                            {m.reason || "—"}
                          </td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-1.5">
                            {m.receipt?.id && (
                              <button
                                onClick={() => {
                                  receiptsApi.downloadPdf(m.receipt.id).catch((err: any) =>
                                    toast.error(err.message || "Download failed")
                                  );
                                }}
                                className="inline-flex items-center gap-1 p-1.5 rounded-lg border text-muted-foreground hover:text-foreground hover:bg-muted transition"
                                title="Download Voucher"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {m.targetProperty?.id && (
                              <Link
                                href={`/properties/${m.targetProperty.id}`}
                                className="inline-flex items-center gap-1 p-1.5 rounded-lg border text-muted-foreground hover:text-foreground hover:bg-muted transition"
                                title="View Target Plot"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successData && (
        <MergeSuccessDialog
          open={!!successData}
          data={successData}
          onClose={() => setSuccessData(null)}
        />
      )}
    </div>
  );
}

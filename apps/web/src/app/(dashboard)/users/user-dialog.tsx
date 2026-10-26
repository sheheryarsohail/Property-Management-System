"use client";

import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { 
  X, 
  Loader2, 
  Check, 
  ShieldCheck, 
  LayoutDashboard, 
  Building2, 
  Users, 
  Calendar, 
  Receipt, 
  FileText, 
  ArrowLeftRight, 
  UserX, 
  GitMerge, 
  Wallet, 
  TrendingUp, 
  BarChart3, 
  Settings as SettingsIcon,
  RotateCcw,
  Eye,
  EyeOff,
  KeyRound,
  Copy
} from "lucide-react";
import { SearchableSelect } from "@/components/SearchableSelect";
import { useAuth } from "@/lib/auth-context";

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any | null;
}

const ALL_ROLES = ["ADMIN", "SALES", "ACCOUNTS", "AUDITOR"];

export const ALL_SYSTEM_TABS = [
  { id: "dashboard", name: "Dashboard", category: "Core Operations", icon: LayoutDashboard, description: "Overview & key metrics" },
  { id: "properties", name: "Properties", category: "Core Operations", icon: Building2, description: "Plots, units & inventory" },
  { id: "customers", name: "Customers", category: "Core Operations", icon: Users, description: "Buyers & client directory" },
  { id: "invoices", name: "Installments", category: "Finance & Accounts", icon: Calendar, description: "Payment plans & installments" },
  { id: "receipts", name: "Receipts", category: "Finance & Accounts", icon: Receipt, description: "Payment vouchers & ledger" },
  { id: "development_charges", name: "Dev Charges", category: "Finance & Accounts", icon: FileText, description: "Infrastructure billing" },
  { id: "pdc", name: "PDC", category: "Finance & Accounts", icon: Wallet, description: "Post-dated cheques management" },
  { id: "expenses", name: "Expenses", category: "Finance & Accounts", icon: TrendingUp, description: "Operations & vendor expenses" },
  { id: "transfers", name: "Transfers", category: "Plot Lifecycle", icon: ArrowLeftRight, description: "Ownership reassignment" },
  { id: "cancellations", name: "Cancellations", category: "Plot Lifecycle", icon: UserX, description: "Plot surrender & refunds" },
  { id: "merges", name: "Merges", category: "Plot Lifecycle", icon: GitMerge, description: "Consolidate multiple plots" },
  { id: "reports", name: "Reports", category: "Management & Control", icon: BarChart3, description: "Financial & audit statements" },
  { id: "users", name: "Users & Access", category: "Management & Control", icon: ShieldCheck, description: "Staff members & permissions" },
  { id: "settings", name: "Settings", category: "Management & Control", icon: SettingsIcon, description: "Project preferences & config" },
];

export const ROLE_DEFAULT_TABS: Record<string, string[]> = {
  ADMIN: ALL_SYSTEM_TABS.map((t) => t.id),
  SALES: ["dashboard", "properties", "customers", "invoices", "transfers"],
  ACCOUNTS: ["dashboard", "customers", "invoices", "receipts", "development_charges", "pdc", "expenses", "reports"],
  AUDITOR: ["dashboard", "properties", "customers", "invoices", "receipts", "development_charges", "transfers", "reports"],
};

export function UserDialog({ open, onOpenChange, user: editingUser }: UserDialogProps) {
  const queryClient = useQueryClient();
  const { user: currentUser, updateUser } = useAuth();
  const isEditing = !!editingUser;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "ADMIN",
    isActive: true,
    tenantIds: [] as string[],
    allowedTabs: [] as string[],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let gen = "";
    for (let i = 0; i < 10; i++) {
      gen += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: gen }));
    setShowPassword(true);
    toast.success("Generated secure password!");
  };

  const copyPassword = () => {
    if (formData.password) {
      navigator.clipboard.writeText(formData.password);
      toast.success("Password copied to clipboard!");
    }
  };

  // Fetch tenants for property assignment
  const { data: fetchedTenants = [] } = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const { data } = await api.get("/tenants");
      return data;
    },
    enabled: currentUser?.role === "SUPER_ADMIN" && open,
  });

  const tenants = useMemo(() => {
    if (currentUser?.role === "SUPER_ADMIN") {
      return fetchedTenants || [];
    }
    return currentUser?.authorizedTenants?.filter((t: any) => t.id !== "all") || [];
  }, [currentUser?.role, currentUser?.authorizedTenants, fetchedTenants]);

  const canAssignProperties = tenants.length > 0;
  const availableRoles = ALL_ROLES.filter((r) => r !== "SUPER_ADMIN");

  // Reset form when dialog opens or editing user changes
  useEffect(() => {
    if (!open) return;
    setShowPassword(false);

    if (editingUser) {
      // Determine initial allowedTabs
      let userTabs = editingUser.allowedTabs;
      if (!userTabs || userTabs.length === 0) {
        userTabs = ROLE_DEFAULT_TABS[editingUser.role] || ALL_SYSTEM_TABS.map((t) => t.id);
      }

      setFormData({
        name: editingUser.name || "",
        email: editingUser.email || "",
        password: "",
        role: editingUser.role || "ADMIN",
        isActive: editingUser.isActive ?? true,
        tenantIds: editingUser.tenantAccess?.map((ta: any) => ta.tenantId) || [],
        allowedTabs: userTabs,
      });
    } else {
      const defaultTenantId = typeof window !== "undefined" ? localStorage.getItem("tenant_id") : null;
      let initialTenants: string[] = [];
      if (defaultTenantId && defaultTenantId !== "all" && tenants.some((t: any) => t.id === defaultTenantId)) {
        initialTenants = [defaultTenantId];
      } else if (tenants.length > 0) {
        initialTenants = tenants.map((t: any) => t.id);
      }

      setFormData({
        name: "",
        email: "",
        password: "",
        role: "ADMIN",
        isActive: true,
        tenantIds: initialTenants,
        allowedTabs: ROLE_DEFAULT_TABS["ADMIN"] || ALL_SYSTEM_TABS.map((t) => t.id),
      });
    }
  }, [open, editingUser]);

  // When tenants finish loading for a new user, if tenantIds is still empty, populate it
  useEffect(() => {
    if (open && !editingUser && tenants.length > 0) {
      setFormData((prev) => {
        if (prev.tenantIds.length > 0) return prev;
        const defaultTenantId = typeof window !== "undefined" ? localStorage.getItem("tenant_id") : null;
        if (defaultTenantId && defaultTenantId !== "all" && tenants.some((t: any) => t.id === defaultTenantId)) {
          return { ...prev, tenantIds: [defaultTenantId] };
        }
        return { ...prev, tenantIds: tenants.map((t: any) => t.id) };
      });
    }
  }, [open, editingUser, tenants.length]);

  const toggleTenant = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      tenantIds: prev.tenantIds.includes(id)
        ? prev.tenantIds.filter((t) => t !== id)
        : [...prev.tenantIds, id],
    }));
  };

  const toggleTab = (tabId: string) => {
    setFormData((prev) => ({
      ...prev,
      allowedTabs: prev.allowedTabs.includes(tabId)
        ? prev.allowedTabs.filter((id) => id !== tabId)
        : [...prev.allowedTabs, tabId],
    }));
  };

  const handleRoleChange = (newRole: string) => {
    setFormData((prev) => ({
      ...prev,
      role: newRole,
      allowedTabs: ROLE_DEFAULT_TABS[newRole] || ALL_SYSTEM_TABS.map((t) => t.id),
    }));
  };

  const selectAllTabs = () => {
    setFormData((prev) => ({
      ...prev,
      allowedTabs: ALL_SYSTEM_TABS.map((t) => t.id),
    }));
  };

  const clearAllTabs = () => {
    setFormData((prev) => ({
      ...prev,
      allowedTabs: [],
    }));
  };

  const resetRoleDefaultTabs = () => {
    setFormData((prev) => ({
      ...prev,
      allowedTabs: ROLE_DEFAULT_TABS[prev.role] || ALL_SYSTEM_TABS.map((t) => t.id),
    }));
  };

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEditing) {
        const payload = { ...data };
        if (!payload.password || !payload.password.trim()) {
          delete payload.password;
        } else {
          payload.password = payload.password.trim();
        }
        delete payload.email;
        await api.put(`/users/${editingUser.id}`, payload);
      } else {
        const payload = { ...data, password: (data.password || "").trim() };
        await api.post("/users", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      if (editingUser?.id === currentUser?.id) {
        updateUser({
          name: formData.name,
          role: formData.role,
          allowedTabs: formData.allowedTabs,
        });
      }
      const passUpdated = formData.password.trim().length > 0;
      toast.success(
        isEditing
          ? passUpdated
            ? "User updated successfully (password changed)"
            : "User updated successfully"
          : "User created successfully. They can now log in with this password."
      );
      onOpenChange(false);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || err.response?.data?.message || "Failed to save user";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEditing && (!formData.password || formData.password.trim().length < 6)) {
      toast.error("Please enter an initial password of at least 6 characters.");
      return;
    }

    if (isEditing && formData.password && formData.password.trim().length > 0 && formData.password.trim().length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
    }

    if (canAssignProperties && formData.tenantIds.length === 0) {
      toast.error("Please assign at least one property to this user.");
      return;
    }

    if (formData.allowedTabs.length === 0) {
      toast.error("Please select at least one tab for this user's scope of access.");
      return;
    }

    setIsLoading(true);

    const payload = { ...formData };
    if (!canAssignProperties) {
      delete (payload as any).tenantIds;
    }

    mutation.mutate(payload);
  };

  // Group tabs by category
  const categories = useMemo(() => {
    const cats: Record<string, typeof ALL_SYSTEM_TABS> = {};
    for (const tab of ALL_SYSTEM_TABS) {
      if (!cats[tab.category]) cats[tab.category] = [];
      cats[tab.category].push(tab);
    }
    return cats;
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs animate-fade-in" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-xl translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-white border border-slate-200 p-6 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div>
              <Dialog.Title className="text-lg font-bold text-slate-900">
                {isEditing ? "Edit User & Access Scope" : "Add New User"}
              </Dialog.Title>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEditing 
                  ? "Manage credentials, property assignments, and tab visibility."
                  : "Create staff account, set password, and choose accessible tabs."}
              </p>
            </div>
            <Dialog.Close className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="e.g. John Doe"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required={!isEditing}
                disabled={isEditing}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="e.g. john@property.com"
              />
            </div>

            {/* Password */}
            {!isEditing ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Initial Password <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {formData.password && (
                      <button
                        type="button"
                        onClick={copyPassword}
                        className="text-[11px] font-medium text-slate-500 hover:text-slate-800 transition flex items-center gap-1 cursor-pointer"
                        title="Copy password"
                      >
                        <Copy className="h-3 w-3" /> Copy
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="text-[11px] font-semibold text-primary hover:text-primary/80 transition flex items-center gap-1 cursor-pointer"
                    >
                      <KeyRound className="h-3 w-3" /> Auto-Generate
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono"
                    placeholder="Enter password (minimum 6 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  The user can sign in immediately with this email and password.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Reset Password <span className="text-[10px] font-normal lowercase text-slate-400">(optional)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {formData.password && (
                      <button
                        type="button"
                        onClick={copyPassword}
                        className="text-[11px] font-medium text-slate-500 hover:text-slate-800 transition flex items-center gap-1 cursor-pointer"
                        title="Copy password"
                      >
                        <Copy className="h-3 w-3" /> Copy
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="text-[11px] font-semibold text-primary hover:text-primary/80 transition flex items-center gap-1 cursor-pointer"
                    >
                      <KeyRound className="h-3 w-3" /> Auto-Generate
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono"
                    placeholder="Type new password to reset, or leave empty"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Leave empty to keep existing password. Type here to reset if user cannot log in.
                </p>
              </div>
            )}

            {/* Role */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Role
              </label>
              <SearchableSelect
                value={formData.role}
                onChange={(e) => handleRoleChange(e.target.value)}
                options={availableRoles.map((r) => ({ value: r, label: r }))}
                placeholder="Select role"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Changing role automatically adjusts default tab scopes below.
              </p>
            </div>

            {/* SCOPE OF ACCESS - TAB VISIBILITY CHECKBOXES */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider">
                    Access Scope (Tabs Visibility)
                  </label>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    {formData.allowedTabs.length} of {ALL_SYSTEM_TABS.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllTabs}
                    className="text-xs text-primary font-medium hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={clearAllTabs}
                    className="text-xs text-slate-500 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={resetRoleDefaultTabs}
                    title="Reset to default tabs for this role"
                    className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-primary cursor-pointer transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Preset</span>
                  </button>
                </div>
              </div>

              {/* Grouped Tab Checkboxes Container */}
              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50/50 p-3 space-y-3.5">
                {Object.entries(categories).map(([category, tabs]) => (
                  <div key={category} className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
                      {category}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {tabs.map((tab) => {
                        const isChecked = formData.allowedTabs.includes(tab.id);
                        const Icon = tab.icon;
                        return (
                          <div
                            key={tab.id}
                            id={`tab-toggle-${tab.id}`}
                            onClick={() => toggleTab(tab.id)}
                            className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all cursor-pointer select-none ${
                              isChecked
                                ? "bg-white border-primary/30 shadow-2xs"
                                : "bg-white/40 border-slate-200/80 hover:bg-white hover:border-slate-300"
                            }`}
                          >
                            <div
                              className={`mt-0.5 h-4 w-4 shrink-0 rounded flex items-center justify-center border transition-colors ${
                                isChecked
                                  ? "bg-primary border-primary text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <Icon className={`h-3.5 w-3.5 shrink-0 ${isChecked ? "text-primary" : "text-slate-400"}`} />
                                <span className={`text-xs font-semibold truncate ${isChecked ? "text-slate-900" : "text-slate-600"}`}>
                                  {tab.name}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                {tab.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Only checked tabs will be visible in the sidebar navigation for this user.
              </p>
            </div>

            {/* Assign Properties */}
            {canAssignProperties && (
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider">
                      Assign Properties
                    </label>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      {formData.tenantIds.length} of {tenants.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, tenantIds: tenants.map((t: any) => t.id) }))}
                      className="text-xs text-primary font-medium hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, tenantIds: [] }))}
                      className="text-xs text-slate-500 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl bg-white divide-y divide-slate-100">
                  {tenants.map((t: any) => {
                    const isAssigned = formData.tenantIds.includes(t.id);
                    return (
                      <div
                        key={t.id}
                        onClick={() => toggleTenant(t.id)}
                        className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <span className="text-xs font-medium text-slate-800">{t.name}</span>
                        <div
                          className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                            isAssigned
                              ? "bg-primary border-primary text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isAssigned && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                  {tenants.length === 0 && (
                    <div className="p-3 text-xs text-slate-500 text-center">No properties available</div>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Users can only view data and records for their assigned properties.
                </p>
              </div>
            )}

            {/* Is Active */}
            {isEditing && (
              <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <label htmlFor="isActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Account is active and permitted to log in
                </label>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow-sm disabled:opacity-70 cursor-pointer"
              >
                {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isEditing ? "Save Changes" : "Create User"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

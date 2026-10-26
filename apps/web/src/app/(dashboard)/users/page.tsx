'use client';

import { Header } from '@/components/layout/header';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Plus, Search, Shield, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { UserDialog } from './user-dialog';
import { useAuth } from '@/lib/auth-context';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    },
  });

  const filteredUsers = users.filter((u: any) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canDeleteUser = (targetUser: any) => {
    if (!targetUser) return false;
    // 1. Cannot delete self
    if (targetUser.id === currentUser?.id || targetUser.email === currentUser?.email) {
      return false;
    }
    // 2. Super admin cannot be deleted by anyone
    if (targetUser.role === 'SUPER_ADMIN') {
      return false;
    }
    // 3. If target is ADMIN, only SUPER_ADMIN can delete them
    if (targetUser.role === 'ADMIN') {
      return currentUser?.role === 'SUPER_ADMIN';
    }
    // 4. Standard ADMIN can delete other operational roles
    return true;
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Header
        title="Users & Access"
        actions={
          <button
            onClick={handleCreate}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-2xs hover:bg-primary/90 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Add User
          </button>
        }
      />

      {/* Toolbar */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center h-10 flex-1 max-w-md rounded-xl border border-slate-200 bg-white px-3 gap-2 shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition">
          <Search className="h-4 w-4 text-slate-400 shrink-0 pointer-events-none" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none border-none p-0"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Access Scope</th>
                <th className="px-6 py-4 font-medium">Assigned Properties</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Last Login</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user: any) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                          {user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        <Shield className="h-3 w-3" />
                        {user.role}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'SUPER_ADMIN' ? (
                        <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
                          Full System Access
                        </span>
                      ) : user.allowedTabs && user.allowedTabs.length > 0 ? (
                        <span 
                          className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 border border-slate-200"
                          title={user.allowedTabs.join(', ')}
                        >
                          {user.allowedTabs.length} of 14 tabs
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Role Default
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'SUPER_ADMIN' ? (
                        <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 border border-purple-100">
                          All Properties
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {user.tenantAccess && user.tenantAccess.length > 0 ? (
                            user.tenantAccess.map((ta: any) => (
                              <span
                                key={ta.tenantId}
                                className="inline-flex items-center rounded-md bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 border border-sky-100"
                              >
                                {ta.tenant?.name || ta.tenantId}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">Default Property</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {user.lastLoginAt ? format(new Date(user.lastLoginAt), 'MMM d, yyyy HH:mm') : 'Never'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded transition-colors"
                          title="Edit User"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {canDeleteUser(user) && (
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UserDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        user={editingUser} 
      />
    </div>
  );
}

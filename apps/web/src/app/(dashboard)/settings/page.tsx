'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import { Loader2, User, KeyRound, Mail, Shield } from 'lucide-react';
import { Header } from '@/components/layout/header';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  
  // Profile State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const { data } = await api.patch('/auth/me', { name, email });
      updateUser({ name: data.name, email: data.email });
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    setIsSavingPassword(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Settings"
      />

      <div className="max-w-4xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Details Section */}
          <div className="md:col-span-1">
            <h2 className="text-base font-semibold text-slate-900">Profile Details</h2>
            
          </div>
          
          <div className="md:col-span-2">
            <form onSubmit={handleUpdateProfile} className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 sm:p-6 space-y-5">
              <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-base font-bold">
                  {user?.name?.substring(0, 2).toUpperCase() || <User className="h-5 w-5" />}
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                    <Shield className="h-3 w-3 text-slate-500" />
                    {user?.role}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile || (name === user?.name && email === user?.email)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-2xs hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {isSavingProfile && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Profile
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Section */}
          <div className="md:col-span-1 pt-2 md:pt-0">
            <h2 className="text-base font-semibold text-slate-900">Security</h2>
            
          </div>

          <div className="md:col-span-2">
            <form onSubmit={handleChangePassword} className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 sm:p-6 space-y-4">
              <div className="space-y-3.5">
                <div className="space-y-1.5 max-w-md">
                  <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                  />
                </div>

                <div className="space-y-1.5 max-w-md">
                  <label className="text-xs font-medium text-slate-700">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                  />
                </div>

                <div className="space-y-1.5 max-w-md">
                  <label className="text-xs font-medium text-slate-700">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-slate-800 transition disabled:opacity-50"
                >
                  {isSavingPassword && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

import os

test_base = "/home/sheheryar-sohail/Downloads/Property-Management-System-test"

# 1. Update apps/web/src/app/login/page.tsx
login_page_path = os.path.join(test_base, "apps/web/src/app/login/page.tsx")
login_page_content = r"""'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Loader2, 
  Mail, 
  KeyRound, 
  ArrowLeft, 
  CheckCircle2, 
  Lock, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  ShieldCheck 
} from 'lucide-react';
import { api } from '@/lib/axios';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

type ViewMode = 'login' | 'forgot-email' | 'forgot-verify' | 'forgot-password' | 'forgot-success';

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Main view state
  const [view, setView] = useState<ViewMode>('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password flow state
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const codeInputRef = useRef<HTMLInputElement>(null);

  // Check URL query parameters for ?mode=forgot or ?forgot=true
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'forgot' || params.get('forgot') === 'true') {
        setView('forgot-email');
      }
    }
  }, []);

  // Cooldown countdown for resending code
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-focus code input when step 2 is activated
  useEffect(() => {
    if (view === 'forgot-verify') {
      setTimeout(() => codeInputRef.current?.focus(), 150);
    }
  }, [view]);

  // 1. Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data } = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password: password.trim()
      });
      
      login(data.accessToken, data.user);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (error: any) {
      const msg = error.response?.data?.message || error.response?.data?.detail || (error.message === 'Network Error' ? 'Cannot connect to server. Check internet or CORS.' : 'Invalid email or password');
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle Send Reset Code
  const handleSendResetCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetEmail = resetEmail.trim().toLowerCase();
    if (!targetEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', {
        email: targetEmail
      });
      toast.success(data?.message || 'Verification code sent to your email!');
      setView('forgot-verify');
      setResendCooldown(60);
    } catch (error: any) {
      const msg = error.response?.data?.message || error.response?.data?.detail || 'Failed to send verification code. Please check the email.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Handle Verify Code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = resetCode.trim();
    if (cleanCode.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/verify-reset-code', {
        email: resetEmail.trim().toLowerCase(),
        code: cleanCode
      });
      toast.success(data?.message || 'Code verified successfully!');
      setView('forgot-password');
    } catch (error: any) {
      const msg = error.response?.data?.message || error.response?.data?.detail || 'Invalid or expired code. Please try again.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Handle Save New Password
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', {
        email: resetEmail.trim().toLowerCase(),
        code: resetCode.trim(),
        newPassword: newPassword.trim()
      });
      toast.success(data?.message || 'Password reset successfully!');
      setView('forgot-success');
    } catch (error: any) {
      const msg = error.response?.data?.message || error.response?.data?.detail || 'Failed to reset password. Please try again.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Start forgot flow
  const startForgotFlow = () => {
    setResetEmail(email.trim() || '');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setView('forgot-email');
  };

  // Return to login screen
  const returnToLogin = (prefilledEmail?: string) => {
    if (prefilledEmail) {
      setEmail(prefilledEmail);
    }
    setPassword('');
    setView('login');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Left Pane - Forms */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          
          {/* Logo Brand Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Property Suite
              </h2>
              <p className="text-xs text-slate-500 font-medium tracking-wide">ENTERPRISE PMS</p>
            </div>
          </div>

          {/* VIEW 1: SIGN IN */}
          {view === 'login' && (
            <div className="animate-fade-in">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-1">Sign in to your account</h3>
                <p className="text-sm text-slate-500">Enter your credentials to access your properties</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div>
                  <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <input
                      id="login-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full appearance-none rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-sm"
                      placeholder="you@company.com"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={startForgotFlow}
                      className="text-xs font-semibold text-primary hover:text-primary/80 transition focus:outline-none"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full appearance-none rounded-lg border border-slate-300 px-4 py-2.5 pr-10 text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary transition"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-xs font-medium text-slate-600">
                    Keep me signed in
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full justify-center items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>
            </div>
          )}

          {/* VIEW 2: FORGOT PASSWORD - STEP 1 (ENTER EMAIL) */}
          {view === 'forgot-email' && (
            <div className="animate-fade-in">
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => returnToLogin()}
                  className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-800 transition mb-3"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Sign In
                </button>
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Forgot password</h3>
                </div>
                <p className="text-sm text-slate-500">
                  Enter your registered account email and we'll send a 6-digit verification code to reset your password.
                </p>
              </div>

              <form onSubmit={handleSendResetCode} className="space-y-4">
                <div>
                  <label htmlFor="reset-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Account email address
                  </label>
                  <div className="relative">
                    <input
                      id="reset-email"
                      type="email"
                      autoFocus
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="block w-full appearance-none rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-sm"
                      placeholder="e.g. sheheryarsohail3@gmail.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !resetEmail.trim()}
                  className="flex w-full justify-center items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                  {isLoading ? 'Generating & Sending Code...' : 'Send Verification Code'}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => returnToLogin()}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                  >
                    Remember your password? Sign in
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* VIEW 3: FORGOT PASSWORD - STEP 2 (ENTER CODE) */}
          {view === 'forgot-verify' && (
            <div className="animate-fade-in">
              <div className="mb-5">
                <button
                  type="button"
                  onClick={() => setView('forgot-email')}
                  className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-800 transition mb-3"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Change Email
                </button>
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Enter 6-digit code</h3>
                </div>
                <p className="text-sm text-slate-500">
                  We've sent a verification code to <span className="font-semibold text-slate-800">{resetEmail}</span>. Enter it below to authorize changing your password:
                </p>
              </div>

              <form onSubmit={handleVerifyCode} className="space-y-5">
                <div>
                  <div className="relative">
                    <input
                      ref={codeInputRef}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoFocus
                      required
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                      className="block w-full text-center font-mono text-3xl font-extrabold tracking-[0.4em] py-3 px-4 rounded-xl border-2 border-slate-300 text-slate-900 focus:border-primary focus:ring-4 focus:ring-primary/10 transition shadow-inner placeholder:tracking-normal placeholder:font-sans placeholder:text-slate-300 placeholder:text-base placeholder:font-normal"
                      placeholder="6-digit code"
                    />
                  </div>
                  <p className="text-xs text-slate-400 text-center mt-2">
                    Code is valid for 10 minutes
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || resetCode.length !== 6}
                  className="flex w-full justify-center items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {isLoading ? 'Verifying Code...' : 'Authorize & Continue'}
                </button>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-xs">
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || isLoading}
                    onClick={() => handleSendResetCode()}
                    className="font-medium text-primary hover:text-primary/80 disabled:text-slate-400 disabled:cursor-not-allowed transition flex items-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </button>

                  <button
                    type="button"
                    onClick={() => returnToLogin()}
                    className="text-slate-500 hover:text-slate-800 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* VIEW 4: FORGOT PASSWORD - STEP 3 (NEW PASSWORD) */}
          {view === 'forgot-password' && (
            <div className="animate-fade-in">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Lock className="h-4 w-4" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Set new password</h3>
                </div>
                <p className="text-sm text-slate-500">
                  Code authorized! Please choose a new password for <span className="font-semibold text-slate-800">{resetEmail}</span>.
                </p>
              </div>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      autoFocus
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full appearance-none rounded-lg border border-slate-300 px-4 py-2.5 pr-10 text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-sm"
                      placeholder="At least 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Confirm new password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full appearance-none rounded-lg border border-slate-300 px-4 py-2.5 pr-10 text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-sm"
                      placeholder="Repeat new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Criteria Checklist */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`h-3.5 w-3.5 rounded-full flex items-center justify-center text-[10px] ${newPassword.length >= 6 ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-500'}`}>
                      ✓
                    </div>
                    <span className={newPassword.length >= 6 ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                      At least 6 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-3.5 w-3.5 rounded-full flex items-center justify-center text-[10px] ${newPassword && confirmPassword && newPassword === confirmPassword ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-500'}`}>
                      ✓
                    </div>
                    <span className={newPassword && confirmPassword && newPassword === confirmPassword ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                      Passwords match
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || newPassword.length < 6 || newPassword !== confirmPassword}
                  className="flex w-full justify-center items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {isLoading ? 'Updating Password...' : 'Save New Password'}
                </button>
              </form>
            </div>
          )}

          {/* VIEW 5: SUCCESS STATE */}
          {view === 'forgot-success' && (
            <div className="animate-fade-in text-center py-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mb-4 shadow-sm">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Password reset complete!</h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Your password has been changed successfully. You can now use your new password to sign in.
              </p>
              <button
                type="button"
                onClick={() => returnToLogin(resetEmail)}
                className="flex w-full justify-center items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all"
              >
                Proceed to Sign In
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Right Pane - Visual Branding Graphic */}
      <div className="relative hidden w-0 flex-1 lg:block bg-primary overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-xl text-center space-y-6 text-primary-foreground animate-slide-up-fade">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Manage properties with unprecedented clarity.
            </h1>
            <p className="text-lg text-primary-foreground/80">
              The complete toolkit for modern real estate developers and property managers. 
              Track sales, installments, transfers, and expenses all in one place.
            </p>
            
            {/* Abstract visual art */}
            <div className="relative mx-auto mt-12 h-64 w-64 rounded-full bg-white/10 backdrop-blur-3xl border border-white/20 flex items-center justify-center shadow-2xl">
              <div className="h-48 w-48 rounded-full bg-white/20 blur-2xl absolute -top-4 -right-4" />
              <Building2 className="h-24 w-24 text-white drop-shadow-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
"""
with open(login_page_path, "w", encoding="utf-8") as f:
    f.write(login_page_content)
print("Updated apps/web/src/app/login/page.tsx")

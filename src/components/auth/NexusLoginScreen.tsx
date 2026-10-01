import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Store as StoreIcon,
  Headphones,
  KeyRound,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldAlert,
  X,
} from 'lucide-react';
import { useNexus } from '../../context/NexusContext';
import { NexusLogo } from '../common/NexusLogo';
import { PrimaryUserRole } from '../../types';

export const NexusLoginScreen: React.FC = () => {
  const {
    login,
    posLockoutUntil,
    securityAlertNotice,
    clearPosLockout,
    stores,
    staffAccounts,
    adminProfile,
    changeAdminPassword,
  } = useNexus();

  // Active Login Tab: Super Admin | Staff | Store
  const [activeRoleTab, setActiveRoleTab] = useState<PrimaryUserRole>('SUPER_ADMIN');

  // Form Inputs (Empty by default; never persisted in storage or cookies)
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Rate-limiting / Cooldown Countdown
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      if (posLockoutUntil > now) {
        setSecondsRemaining(Math.ceil((posLockoutUntil - now) / 1000));
      } else {
        setSecondsRemaining(0);
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [posLockoutUntil]);

  // Forgot Password Modal
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [newTempPass, setNewTempPass] = useState<string | null>(null);

  // Tab change
  const handleTabChange = (role: PrimaryUserRole) => {
    setActiveRoleTab(role);
    setErrorMessage(null);
    setPassword('');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (secondsRemaining > 0) return;
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = login(activeRoleTab, identifier.trim(), password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.message);
        // Clear password input immediately upon failure to maintain strict credential hygiene
        setPassword('');
      }
    }, 200);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    if (activeRoleTab !== 'SUPER_ADMIN') {
      setResetSuccessMessage('Store POS and Staff POS credentials are exclusively managed by the Super Admin. Please contact your Super Administrator to change or reset your password.');
      return;
    }

    if (resetEmail.toLowerCase() === (adminProfile?.email || 'styrishappy@gmail.com').toLowerCase()) {
      const temp = 'Admin' + Math.floor(1000 + Math.random() * 9000) + '!';
      changeAdminPassword(adminProfile?.password || 'admin', temp);
      setNewTempPass(temp);
      setResetSuccessMessage(`Temporary password generated for Super Admin: ${temp}`);
    } else {
      setResetSuccessMessage(`If an admin account exists for ${resetEmail}, reset instructions have been dispatched.`);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#F8FAFC] text-[#172033] font-sans select-none overflow-y-auto">
      {/* 1. Header with Logo */}
      <header className="h-[75px] bg-white border-b border-[#E5EAF2] px-6 sm:px-12 flex items-center justify-between shadow-xs sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <NexusLogo size="md" showSubtitle={true} />
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-[#64748B] bg-slate-50 px-3 py-1.5 rounded-full border border-[#E5EAF2]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Unified 3-Tier Enterprise Auth Portal</span>
        </div>
      </header>

      {/* 2. Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-[480px] bg-white rounded-3xl border border-[#E5EAF2] shadow-xl p-6 sm:p-8 my-auto">
          {/* Top Title & Badge */}
          <div className="text-center space-y-1.5 mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>NEXUS-POS Core Authentication</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
              Sign In to Your Workspace
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Select your access level and enter your assigned credentials
            </p>
          </div>

          {/* 3. Three-Level Role Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl mb-6 border border-[#E5EAF2]">
            {/* SUPER ADMIN TAB */}
            <button
              type="button"
              onClick={() => handleTabChange('SUPER_ADMIN')}
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeRoleTab === 'SUPER_ADMIN'
                  ? 'bg-white text-blue-700 shadow-sm border border-[#E5EAF2]'
                  : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              <ShieldCheck className="w-4 h-4 mb-1" />
              <span className="truncate">Super Admin</span>
            </button>

            {/* STAFF TAB */}
            <button
              type="button"
              onClick={() => handleTabChange('STAFF')}
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeRoleTab === 'STAFF'
                  ? 'bg-white text-blue-700 shadow-sm border border-[#E5EAF2]'
                  : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              <Headphones className="w-4 h-4 mb-1" />
              <span className="truncate">Staff POS</span>
            </button>

            {/* STORE TAB */}
            <button
              type="button"
              onClick={() => handleTabChange('STORE')}
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeRoleTab === 'STORE'
                  ? 'bg-white text-blue-700 shadow-sm border border-[#E5EAF2]'
                  : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              <StoreIcon className="w-4 h-4 mb-1" />
              <span className="truncate">Store Branch</span>
            </button>
          </div>

          {/* Role Description Banner */}
          <div className="mb-5 p-3 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-2.5 text-xs text-blue-900">
            <div className="p-1 bg-blue-600 text-white rounded-md shrink-0 mt-0.5">
              {activeRoleTab === 'SUPER_ADMIN' && <ShieldCheck className="w-3.5 h-3.5" />}
              {activeRoleTab === 'STAFF' && <Headphones className="w-3.5 h-3.5" />}
              {activeRoleTab === 'STORE' && <StoreIcon className="w-3.5 h-3.5" />}
            </div>
            <div>
              <div className="font-bold">
                {activeRoleTab === 'SUPER_ADMIN' && 'Master Owner & Super Admin Control'}
                {activeRoleTab === 'STAFF' && 'Staff High-Speed Phone Order Terminal'}
                {activeRoleTab === 'STORE' && 'Assigned Store POS & Table Management'}
              </div>
              <div className="text-[11px] text-blue-700 mt-0.5 leading-relaxed">
                {activeRoleTab === 'SUPER_ADMIN' &&
                  'Unrestricted network control: Menu, Pricing, All Stores, Staff, Security & Financials.'}
                {activeRoleTab === 'STAFF' &&
                  'Fast phone order taking, master menu browse, delivery routing, and dispatch to store.'}
                {activeRoleTab === 'STORE' &&
                  'Isolated branch access: View incoming orders, table statuses, local receipts, and daily sales.'}
              </div>
            </div>
          </div>

          {/* Security Alert & Lockout Notice Banner */}
          {secondsRemaining > 0 && (
            <div className="mb-5 p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5 animate-pulse">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-sm text-amber-950 flex items-center gap-2">
                    <span>Security Alert Dispatched</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" />
                      {secondsRemaining}s lockout
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    3 consecutive incorrect login attempts were detected on this POS. An unauthorized access alert has been dispatched to <strong>{securityAlertNotice?.dispatchedTo || adminProfile?.email || 'styrishappy@gmail.com'}</strong>.
                  </p>
                  <p className="text-[11px] text-amber-700 font-medium">
                    Terminal is temporarily locked to prevent brute-force attacks. Cooldown will lift automatically.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div className="space-y-0.5">
                <div className="font-bold">{errorMessage}</div>
                <div className="text-[11px] text-red-600">Access denied. Verify credentials or contact security administrator.</div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Username / Email */}
            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1.5">
                {activeRoleTab === 'SUPER_ADMIN' && 'Admin Login ID / Username'}
                {activeRoleTab === 'STAFF' && 'Staff Login ID / Username'}
                {activeRoleTab === 'STORE' && 'Store Login Username / Email'}
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  disabled={secondsRemaining > 0}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={
                    activeRoleTab === 'SUPER_ADMIN'
                      ? 'admin@nexus-pos.com'
                      : activeRoleTab === 'STAFF'
                      ? 'staff.sarah@nexus-pos.com'
                      : 'branch.soho@nexus-pos.com'
                  }
                  autoComplete="off"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-[#E5EAF2] text-sm text-[#172033] font-medium focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-[#94A3B8] disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#172033]">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(identifier);
                    setResetSuccessMessage(null);
                    setNewTempPass(null);
                    setIsForgotPasswordOpen(true);
                  }}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={secondsRemaining > 0}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="off"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-[#E5EAF2] text-sm text-[#172033] font-medium focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-[#94A3B8] disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 p-1 text-[#94A3B8] hover:text-[#172033] transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || secondsRemaining > 0}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : secondsRemaining > 0 ? (
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 animate-spin" />
                  Terminal Locked ({secondsRemaining}s)
                </span>
              ) : (
                <>
                  <span>
                    Sign In to {activeRoleTab === 'SUPER_ADMIN' ? 'Super Admin' : activeRoleTab === 'STAFF' ? 'Staff POS' : 'Store POS'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher Cards */}
          <div className="mt-6 pt-5 border-t border-[#E5EAF2]">
            <div className="text-[11px] font-bold uppercase text-[#64748B] mb-2.5 tracking-wider text-center flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Instant 1-Click Access Cards</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Admin Card */}
              <div
                onClick={() => {
                  setActiveRoleTab('SUPER_ADMIN');
                  setIdentifier(adminProfile.email || 'admin@nexus-pos.com');
                  setPassword('');
                  setErrorMessage(null);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  activeRoleTab === 'SUPER_ADMIN'
                    ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-100'
                    : 'bg-slate-50 border-[#E5EAF2] hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Super Admin</span>
                </div>
                <div className="text-[11px] text-[#64748B] font-mono mt-1 truncate">{adminProfile.email || 'admin@nexus-pos.com'}</div>
                <div className="text-[10px] text-blue-600 font-semibold mt-1 flex items-center gap-1">
                  <span>Authorized Login</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>

              {/* Staff Card */}
              <div
                onClick={() => {
                  setActiveRoleTab('STAFF');
                  setIdentifier(staffAccounts?.[0]?.username || 'staff@nexus-pos.com');
                  setPassword('');
                  setErrorMessage(null);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  activeRoleTab === 'STAFF'
                    ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-100'
                    : 'bg-slate-50 border-[#E5EAF2] hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700">
                  <Headphones className="w-3.5 h-3.5" />
                  <span>Staff POS</span>
                </div>
                <div className="text-[11px] text-[#64748B] font-mono mt-1 truncate">{staffAccounts?.[0]?.username || 'staff@nexus-pos.com'}</div>
                <div className="text-[10px] text-blue-600 font-semibold mt-1 flex items-center gap-1">
                  <span>Phone Orders</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>

              {/* Store Card */}
              <div
                onClick={() => {
                  setActiveRoleTab('STORE');
                  setIdentifier(stores[0]?.storeUsername || 'store@nexus-pos.com');
                  setPassword('');
                  setErrorMessage(null);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  activeRoleTab === 'STORE'
                    ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-100'
                    : 'bg-slate-50 border-[#E5EAF2] hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700">
                  <StoreIcon className="w-3.5 h-3.5" />
                  <span>Store POS</span>
                </div>
                <div className="text-[11px] text-[#64748B] font-mono mt-1 truncate">{stores[0]?.storeUsername || 'store@nexus-pos.com'}</div>
                <div className="text-[10px] text-blue-600 font-semibold mt-1 flex items-center gap-1">
                  <span>Terminal Locked</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 4. Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5EAF2] shadow-2xl p-6 relative">
            <button
              onClick={() => setIsForgotPasswordOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#64748B] hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#172033]">Reset Password</h3>
                <p className="text-xs text-[#64748B]">
                  Recover access for {activeRoleTab.replace('_', ' ')}
                </p>
              </div>
            </div>

            {resetSuccessMessage ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs leading-relaxed">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Reset Successful</span>
                  </div>
                  <p>{resetSuccessMessage}</p>
                </div>
                <button
                  onClick={() => {
                    setIsForgotPasswordOpen(false);
                    if (newTempPass) {
                      setPassword(newTempPass);
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Account Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="name@nexus-pos.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs font-medium text-[#172033] focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    Send Reset Instructions
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-[#64748B] border-t border-[#E5EAF2] bg-white">
        NEXUS-POS Enterprise • Multi-Branch Restaurant Point of Sale & Terminal Management System
      </footer>
    </div>
  );
};

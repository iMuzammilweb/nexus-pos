import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Laptop,
  AlertTriangle,
  Key,
} from 'lucide-react';
import { NexusLogo } from '../common/NexusLogo';
import {
  verifyDeviceAuthorizationPassword,
  getClientDeviceInfo,
  DeviceAuthStatus,
} from '../../services/deviceAuthService';

interface DeviceAuthorizationScreenProps {
  onAuthorized: () => void;
  initialStatus?: DeviceAuthStatus | null;
}

export const DeviceAuthorizationScreen: React.FC<DeviceAuthorizationScreenProps> = ({
  onAuthorized,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Rate Limiting / Lockout state
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const deviceInfo = getClientDeviceInfo();

  // Handle countdown timer when locked out
  useEffect(() => {
    let interval: any = null;
    if (isLockedOut && lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev <= 1) {
            setIsLockedOut(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLockedOut, lockoutTimer]);

  const handleAuthorizeSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const passToTest = password.trim();
    if (!passToTest) return;

    setIsLoading(true);
    setErrorMessage(null);

    const res = await verifyDeviceAuthorizationPassword(passToTest);
    setIsLoading(false);

    if (res.success) {
      setSuccessMessage('Device successfully authorized! Redirecting to Sign In to Your Workspace...');
      setTimeout(() => {
        onAuthorized();
      }, 400);
    } else {
      setErrorMessage('Access Denied: Invalid Master Password or Security Passkey.');
      if (res.isLockedOut) {
        setIsLockedOut(true);
        setLockoutTimer(res.lockoutRemainingSeconds || 30);
      }
      setFailedAttempts((prev) => prev + 1);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#F8FAFC] text-[#172033] font-sans select-none overflow-y-auto">
      {/* 1. Top Enterprise Security Header */}
      <header className="h-[75px] bg-white border-b border-[#E5EAF2] px-6 sm:px-12 flex items-center justify-between shadow-xs sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <NexusLogo size="md" showSubtitle={true} />
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-blue-600 animate-pulse" />
          <span>Device Authorization Gate</span>
        </div>
      </header>

      {/* 2. Main Authorization Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-[460px] bg-white rounded-3xl border border-[#E5EAF2] shadow-xl p-6 sm:p-8 my-auto relative">
          {/* Top Shield Emblem */}
          <div className="flex flex-col items-center text-center space-y-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-blue-600/25">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-extrabold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span>Super Admin Protected</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#172033] tracking-tight">
                Device Authorization Required
              </h1>
              <p className="text-xs sm:text-sm text-[#64748B] max-w-sm">
                Enter the Master Super Admin Password or Passkey to securely unlock this terminal.
              </p>
            </div>
          </div>

          {/* Device Fingerprint Card */}
          <div className="mb-5 p-3 rounded-2xl bg-slate-50 border border-[#E5EAF2] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white rounded-xl border border-[#E5EAF2] text-[#64748B]">
                <Laptop className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="font-bold text-[#172033]">{deviceInfo.name}</div>
                <div className="text-[10px] text-[#64748B]">
                  {deviceInfo.browser} • {deviceInfo.os}
                </div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
              Unverified
            </span>
          </div>

          {/* Success Notification */}
          {successMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error / Lockout Notification */}
          {errorMessage && !successMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div>{errorMessage}</div>
                {failedAttempts > 0 && !isLockedOut && (
                  <div className="text-[11px] text-red-600 font-normal">
                    Attempt {failedAttempts} of 5. Unauthorized access attempts are monitored.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lockout Active Banner */}
          {isLockedOut && (
            <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Temporary Security Lockout Active</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Too many incorrect attempts. Please wait for the lockout window to expire.
              </p>
              <div className="flex items-center justify-between gap-2">
                <div className="font-mono font-bold text-sm text-amber-900 bg-amber-100/70 px-3 py-1.5 rounded-xl border border-amber-200">
                  Retry in {lockoutTimer}s
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsLockedOut(false);
                    setLockoutTimer(0);
                    setFailedAttempts(0);
                    setErrorMessage(null);
                  }}
                  className="text-xs font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer"
                >
                  Clear Lockout & Retry
                </button>
              </div>
            </div>
          )}

          {/* Password Form */}
          <form onSubmit={handleAuthorizeSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1.5">
                Master Password or Super Admin Passkey
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLockedOut || isLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter master password or passkey"
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50 border border-[#E5EAF2] text-sm text-[#172033] placeholder:text-[#94A3B8] focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  autoComplete="off"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  disabled={isLockedOut}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#64748B] hover:text-[#172033] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-blue-600" />}
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={isLoading || !password.trim()}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credential...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Unlock & Authorize Terminal</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Master Security Notice */}
          <div className="mt-6 pt-4 border-t border-[#E5EAF2] text-center">
            <div className="inline-flex items-center gap-1.5 text-[11px] text-[#64748B] font-medium">
              <Key className="w-3.5 h-3.5 text-blue-600" />
              <span>Protected by Super Admin Master Passkey Protocol</span>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="py-4 text-center text-xs text-[#94A3B8]">
        Nexus POS Zero-Trust Hardware Authorization Framework • Super Admin Exclusive Access
      </footer>
    </div>
  );
};

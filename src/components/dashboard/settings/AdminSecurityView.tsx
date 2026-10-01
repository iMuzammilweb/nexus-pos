import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Mail,
  Lock,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  UserCheck,
  Clock,
  Laptop,
  Globe,
  BellRing,
  RefreshCw,
  LogOut,
  X,
  Trash2,
  AlertTriangle,
  Smartphone,
  ShieldAlert,
} from 'lucide-react';
import { useNexus } from '../../../context/NexusContext';
import {
  changeDeviceAuthorizationPassword,
  getAuthorizedDevicesList,
  revokeAuthorizedDevice,
  getSecurityAlertsList,
  DeviceInfo,
  SecurityAlert,
  getClientDeviceInfo,
} from '../../../services/deviceAuthService';

export const AdminSecurityView: React.FC = () => {
  const {
    adminProfile,
    updateAdminProfile,
    changeAdminPassword,
    logout,
    activityLogs,
    resetAllData,
    stores,
    staffAccounts,
    changeStorePassword,
    resetStaffPassword,
    currentUser,
  } = useNexus();

  const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-xl mx-auto bg-white rounded-2xl border border-[#E5EAF2] shadow-xs text-center my-12">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-[#172033]">Master Admin & Security Settings Restricted</h3>
        <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
          Master admin credentials, API keys, device authorizations, and system security controls can only be viewed and changed by the Super Admin.
        </p>
        <div className="mt-4 pt-4 border-t border-[#E5EAF2] text-[11px] text-[#94A3B8]">
          Store POS and Staff POS can only operate menu, orders, table management, printer devices, add-ons, customer database, daily reports, and promotions.
        </div>
      </div>
    );
  }

  // Branch PIN / Password Quick Edit
  const [selectedBranchId, setSelectedBranchId] = useState<string>(stores[0]?.id || '');
  const [branchNewPass, setBranchNewPass] = useState('');
  const [branchNewPin, setBranchNewPin] = useState('');
  const [branchMsg, setBranchMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Staff Password Quick Reset
  const [selectedStaffId, setSelectedStaffId] = useState<string>(staffAccounts[0]?.id || '');
  const [staffNewPass, setStaffNewPass] = useState('');
  const [staffMsg, setStaffMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Reset Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Edit Name Modal (Super Admin Full Name / Display Name)
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [editFullName, setEditFullName] = useState(adminProfile.ceoName || 'Administrator');
  const [nameSuccess, setNameSuccess] = useState<string | null>(null);

  // Change Password Modal
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  // Change Email / Username Modal
  const [isChangeEmailOpen, setIsChangeEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState(adminProfile.email || '');
  const [newCeoName, setNewCeoName] = useState(adminProfile.ceoName || '');
  const [emailVerifyPass, setEmailVerifyPass] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  // Copy Login URL State
  const [copiedUrl, setCopiedUrl] = useState(false);
  const adminLoginUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/admin-login`
      : 'https://nexus-pos.app/admin-login';

  // Super Admin Device Authorization Password Management
  const [isChangeDevicePassOpen, setIsChangeDevicePassOpen] = useState(false);
  const [deviceCurrentPass, setDeviceCurrentPass] = useState('');
  const [deviceNewPass, setDeviceNewPass] = useState('');
  const [deviceConfirmPass, setDeviceConfirmPass] = useState('');
  const [devicePassError, setDevicePassError] = useState<string | null>(null);
  const [devicePassSuccess, setDevicePassSuccess] = useState<string | null>(null);
  const [devicePassLoading, setDevicePassLoading] = useState(false);

  // Authorized Devices & Security Alerts Management
  const [authorizedDevices, setAuthorizedDevices] = useState<DeviceInfo[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [revokeMessage, setRevokeMessage] = useState<string | null>(null);

  const fetchDevicesAndAlerts = async () => {
    setIsLoadingDevices(true);
    const devs = await getAuthorizedDevicesList();
    const alertsData = await getSecurityAlertsList();
    setAuthorizedDevices(devs);
    setSecurityAlerts(alertsData.alerts || []);
    setIsLoadingDevices(false);
  };

  useEffect(() => {
    fetchDevicesAndAlerts();
  }, []);

  const handleChangeDevicePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDevicePassError(null);
    setDevicePassSuccess(null);

    if (!deviceCurrentPass || !deviceNewPass || !deviceConfirmPass) {
      setDevicePassError('All password fields are required.');
      return;
    }

    if (deviceNewPass !== deviceConfirmPass) {
      setDevicePassError('New passwords do not match.');
      return;
    }

    if (deviceNewPass.length < 6) {
      setDevicePassError('New password must be at least 6 characters long.');
      return;
    }

    setDevicePassLoading(true);
    const res = await changeDeviceAuthorizationPassword(deviceCurrentPass, deviceNewPass, deviceConfirmPass);
    setDevicePassLoading(false);

    if (!res.success) {
      setDevicePassError(res.message);
    } else {
      setDevicePassSuccess('Device authorization password updated successfully.');
      setDeviceCurrentPass('');
      setDeviceNewPass('');
      setDeviceConfirmPass('');
      setTimeout(() => {
        setIsChangeDevicePassOpen(false);
        setDevicePassSuccess(null);
      }, 1500);
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    setRevokeMessage(null);
    const res = await revokeAuthorizedDevice(deviceId);
    if (res.success) {
      setRevokeMessage(res.message);
      await fetchDevicesAndAlerts();
      setTimeout(() => setRevokeMessage(null), 4000);
    }
  };

  const handleCopyUrl = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(adminLoginUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleEditNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFullName.trim()) return;

    updateAdminProfile({
      ceoName: editFullName.trim(),
      fullName: editFullName.trim(),
      displayName: editFullName.trim(),
    });

    setNameSuccess('Super Admin name updated permanently across all systems and database!');
    setTimeout(() => {
      setIsEditNameOpen(false);
      setNameSuccess(null);
    }, 1200);
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (newPass !== confirmPass) {
      setPassError('New passwords do not match.');
      return;
    }

    if (newPass.length < 4) {
      setPassError('Password must be at least 4 characters long.');
      return;
    }

    const res = changeAdminPassword(currentPass, newPass);
    if (!res.success) {
      setPassError(res.message);
    } else {
      setPassSuccess('Super Admin password successfully updated!');
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
      setTimeout(() => {
        setIsChangePassOpen(false);
        setPassSuccess(null);
      }, 1500);
    }
  };

  const handleChangeEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(null);

    if (adminProfile.password && emailVerifyPass !== adminProfile.password) {
      setEmailError('Current password is incorrect. Verification failed.');
      return;
    }

    updateAdminProfile({
      email: newEmail.trim(),
      ceoName: newCeoName.trim(),
    });

    setEmailSuccess('Admin profile and login username updated successfully!');
    setEmailVerifyPass('');
    setTimeout(() => {
      setIsChangeEmailOpen(false);
      setEmailSuccess(null);
    }, 1500);
  };

  // Filter security logs
  const securityLogs = activityLogs
    .filter((l) => l.category === 'Auth' || l.category === 'System' || l.action.toLowerCase().includes('admin'))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* 1. SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold uppercase tracking-wider mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Master System Security</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#172033] tracking-tight">
            Admin Security & Credentials
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Manage your Super Admin account, login routing URL, authentication keys, and security audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyUrl}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-[#E5EAF2] text-xs font-bold text-[#172033] shadow-xs transition-colors cursor-pointer"
          >
            {copiedUrl ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#64748B]" />
                <span>Copy Admin Login URL</span>
              </>
            )}
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-xs font-bold text-red-700 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* 2. ADMIN PROFILE CREDENTIALS CARD */}
      <div className="bg-white rounded-3xl border border-[#E5EAF2] p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#E5EAF2]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-xl font-black shadow-md shadow-blue-600/20 shrink-0">
              {adminProfile.ceoName ? adminProfile.ceoName.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-[#172033]">
                  {adminProfile.ceoName || 'Administrator'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200">
                  SUPER_ADMIN / OWNER
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Full Unrestricted Master Platform Control • All Branches & POS Terminals
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setEditFullName(adminProfile.ceoName || 'Administrator');
                setNameSuccess(null);
                setIsEditNameOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Edit Full Name</span>
            </button>

            <button
              onClick={() => {
                setPassError(null);
                setPassSuccess(null);
                setIsChangePassOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Change Password</span>
            </button>

            <button
              onClick={() => {
                setNewEmail(adminProfile.email || '');
                setNewCeoName(adminProfile.ceoName || '');
                setEmailError(null);
                setEmailSuccess(null);
                setIsChangeEmailOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#172033] font-bold text-xs border border-[#E5EAF2] flex items-center gap-2 transition-all cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-[#64748B]" />
              <span>Change Username / Email</span>
            </button>
          </div>
        </div>

        {/* Credentials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          <div className="p-4 rounded-2xl bg-slate-50 border border-[#E5EAF2]">
            <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
              Admin Login Email / Username
            </div>
            <div className="text-sm font-black text-[#172033] truncate">
              {adminProfile.email || 'Styrishappy@gmail.com'}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Primary Master Account</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-[#E5EAF2]">
            <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
              Password Security
            </div>
            <div className="text-sm font-black text-[#172033]">
              ••••••••••••
            </div>
            <div className="text-[10px] text-[#64748B] font-semibold mt-1">
              Last updated recently
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-[#E5EAF2]">
            <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
              Direct Admin Route
            </div>
            <div className="text-xs font-bold text-blue-600 font-mono truncate">
              /admin-login
            </div>
            <div className="text-[10px] text-[#64748B] mt-1">
              Routes directly to Admin Dashboard
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-[#E5EAF2]">
            <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
              Account Status
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-black text-[#172033]">Active & Secured</span>
            </div>
            <div className="text-[10px] text-[#64748B] mt-1">
              Role: SUPER_ADMIN
            </div>
          </div>
        </div>
      </div>

      {/* 3. SUPER ADMIN DEVICE AUTHORIZATION PASSWORD & TERMINAL CONTROLS */}
      <div className="bg-white rounded-3xl border border-[#E5EAF2] p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5EAF2]">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-md shadow-blue-600/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span>Super Admin Exclusive Credential</span>
              </div>
              <h3 className="text-lg font-black text-[#172033]">
                Device Authorization Password
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Hardware terminal gatekeeper. Terminals must be authorized with this password before cashiers or staff can reach the POS login page.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setDevicePassError(null);
              setDevicePassSuccess(null);
              setDeviceCurrentPass('');
              setDeviceNewPass('');
              setDeviceConfirmPass('');
              setIsChangeDevicePassOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <KeyRound className="w-4 h-4" />
            <span>Change Password</span>
          </button>
        </div>

        {/* Password Display & Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-[#E5EAF2]">
            <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
              Active Authorization Password
            </div>
            <div className="text-base font-black text-[#172033] tracking-widest">
              ••••••••••••
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Hashed & Protected Server-Side</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-[#E5EAF2]">
            <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
              Authorized Recovery Email
            </div>
            <div className="text-xs font-black text-[#172033] truncate">
              styrishappy@gmail.com
            </div>
            <div className="text-[10px] text-[#64748B] font-semibold mt-1">
              Immutable server recovery destination
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-[#E5EAF2]">
            <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
              Terminal Protection Status
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-black text-[#172033]">Active Rate Limiting</span>
            </div>
            <div className="text-[10px] text-[#64748B] mt-1">
              Alerts dispatched after 5 failed attempts
            </div>
          </div>
        </div>

        {/* Authorized Devices List */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-black text-[#172033] uppercase tracking-wider">
                Authorized Devices & POS Terminals
              </h4>
            </div>
            <button
              type="button"
              onClick={fetchDevicesAndAlerts}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDevices ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {revokeMessage && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold">
              {revokeMessage}
            </div>
          )}

          {authorizedDevices.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-[#CBD5E1] text-center space-y-1">
              <Laptop className="w-6 h-6 text-[#94A3B8] mx-auto" />
              <div className="text-xs font-bold text-[#172033]">Terminal Authorization Active</div>
              <p className="text-[11px] text-[#64748B]">
                New cash register tablets, phones, and terminals will appear here once authorized.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {authorizedDevices.map((dev) => (
                <div
                  key={dev.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-[#E5EAF2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white rounded-xl border border-[#E5EAF2] text-blue-600">
                      <Laptop className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-[#172033] flex items-center gap-2">
                        <span>{dev.name}</span>
                        {dev.status === 'active' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold">
                            Revoked
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#64748B] mt-0.5">
                        {dev.browser} • {dev.os} • IP: {dev.ip || '127.0.0.1'} • Auth: {new Date(dev.authorizedAt || Date.now()).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {dev.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => handleRevokeDevice(dev.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      Revoke Device
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security Alerts Log */}
        {securityAlerts.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-[#E5EAF2]">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-black text-[#172033] uppercase tracking-wider">
                Security Alerts Dispatched to styrishappy@gmail.com
              </h4>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {securityAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-1"
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>{alert.subject}</span>
                    <span className="text-[10px] text-amber-800 font-normal">
                      {new Date(alert.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-relaxed font-mono bg-white/70 p-2 rounded-lg border border-amber-200/60 whitespace-pre-line">
                    {alert.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. SECURITY POLICIES & CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Rules */}
        <div className="bg-white rounded-3xl border border-[#E5EAF2] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-black text-[#172033]">
              Enterprise Access Control Policy
            </h3>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-bold text-blue-900">Protected Super Admin Authority</div>
                <p className="text-blue-700 mt-0.5 leading-relaxed">
                  Only the Super Admin / Owner account can alter global pricing, create new store branches, configure VAT rates, or view platform financial totals.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-[#E5EAF2] flex items-start gap-3">
              <UserCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-bold text-[#172033]">Store Data Isolation</div>
                <p className="text-[#64748B] mt-0.5 leading-relaxed">
                  Store branch accounts are strictly isolated to their assigned location. Store managers cannot view data or reports from other locations.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-[#E5EAF2] flex items-start gap-3">
              <BellRing className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-bold text-[#172033]">Real-Time Audible Order Alerts</div>
                <p className="text-[#64748B] mt-0.5 leading-relaxed">
                  Incoming orders from Phone Staff or Online triggers instant synthesized multi-tone kitchen chimes across active branch terminals.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Audit Activity Logs */}
        <div className="bg-white rounded-3xl border border-[#E5EAF2] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-black text-[#172033]">
                Recent Authentication Audit Log
              </h3>
            </div>
            <span className="text-[11px] font-bold text-[#64748B]">Live Stream</span>
          </div>

          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
            {securityLogs.length === 0 ? (
              <p className="text-xs text-[#94A3B8] text-center py-6">No recent security events</p>
            ) : (
              securityLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-[#E5EAF2] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <div>
                      <div className="font-bold text-[#172033]">{log.action}</div>
                      <div className="text-[10px] text-[#64748B]">{log.details}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-[#94A3B8] text-right">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. BRANCH STORE CREDENTIALS & 6-DIGIT PIN MANAGEMENT (SUPER ADMIN EXCLUSIVE) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch Store POS Passwords & 6-Digit PINs */}
        <div className="bg-white rounded-3xl border border-[#E5EAF2] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-black text-[#172033]">
                Branch POS Passwords & 6-Digit PINs
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
              SUPER ADMIN ONLY
            </span>
          </div>

          <p className="text-xs text-[#64748B]">
            Configure the 6-digit access PIN and terminal password for any branch location.
          </p>

          {branchMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold ${
                branchMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {branchMsg.text}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-[#172033] mb-1">Select Store Branch</label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs font-semibold text-[#172033]"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.businessName} (Current PIN: {s.storePin || '123456'})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#172033] mb-1">New Terminal Password</label>
                <input
                  type="password"
                  placeholder="e.g. Store123!"
                  value={branchNewPass}
                  onChange={(e) => setBranchNewPass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs text-[#172033]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#172033] mb-1">New 6-Digit Store PIN</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="6 digits (e.g. 123456)"
                  value={branchNewPin}
                  onChange={(e) => setBranchNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs font-mono font-bold tracking-widest text-blue-700"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setBranchMsg(null);
                if (!branchNewPass && !branchNewPin) {
                  setBranchMsg({ type: 'error', text: 'Please enter a new password or 6-digit PIN.' });
                  return;
                }
                if (branchNewPin && (branchNewPin.length !== 6 || !/^\d{6}$/.test(branchNewPin))) {
                  setBranchMsg({ type: 'error', text: 'PIN must be exactly 6 digits.' });
                  return;
                }
                const st = stores.find((s) => s.id === selectedBranchId);
                // Empty = PIN-only change; the stored password is kept as is
                const pass = branchNewPass;
                const pin = branchNewPin || st?.storePin || '123456';
                const res = changeStorePassword(selectedBranchId, pass, pin);
                if (res.success) {
                  setBranchMsg({ type: 'success', text: `Updated credentials & PIN (${pin}) for ${st?.businessName}!` });
                  setBranchNewPass('');
                  setBranchNewPin('');
                } else {
                  setBranchMsg({ type: 'error', text: res.message });
                }
                setTimeout(() => setBranchMsg(null), 4000);
              }}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              Update Branch Credentials
            </button>
          </div>
        </div>

        {/* Staff Accounts Password Resets */}
        <div className="bg-white rounded-3xl border border-[#E5EAF2] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-black text-[#172033]">
                Staff Accounts Password Resets
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
              SUPER ADMIN ONLY
            </span>
          </div>

          <p className="text-xs text-[#64748B]">
            Only Super Admin can reset phone agent or cashier staff passwords.
          </p>

          {staffMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold ${
                staffMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {staffMsg.text}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-[#172033] mb-1">Select Staff Account</label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs font-semibold text-[#172033]"
              >
                {staffAccounts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.email}) — Role: {s.role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#172033] mb-1">New Staff Password</label>
              <input
                type="password"
                placeholder="Minimum 4 characters"
                value={staffNewPass}
                onChange={(e) => setStaffNewPass(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs text-[#172033]"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setStaffMsg(null);
                if (!staffNewPass || staffNewPass.length < 4) {
                  setStaffMsg({ type: 'error', text: 'Password must be at least 4 characters long.' });
                  return;
                }
                const st = staffAccounts.find((s) => s.id === selectedStaffId);
                const res = resetStaffPassword(selectedStaffId, staffNewPass);
                if (res.success) {
                  setStaffMsg({ type: 'success', text: `Password for staff member ${st?.name} reset successfully!` });
                  setStaffNewPass('');
                } else {
                  setStaffMsg({ type: 'error', text: res.message });
                }
                setTimeout(() => setStaffMsg(null), 4000);
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              Reset Staff Password
            </button>
          </div>
        </div>
      </div>

      {/* 5. DANGER ZONE / DATA RESET CARD */}
      <div className="bg-red-50/50 rounded-3xl border border-red-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-red-100 border border-red-200 rounded-2xl text-red-600 shrink-0">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-red-900">
                System Data Reset & Fresh Setup
              </h3>
              <p className="text-xs text-red-700 mt-1 max-w-xl leading-relaxed">
                Delete all previous orders, test customers, and mock records. Resets the entire website and database to a clean, ready-to-use slate configured for Administrator and Nexus Pizza & Grill.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setResetConfirmText('');
              setResetSuccess(false);
              setIsResetModalOpen(true);
            }}
            className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>Reset All Website Data</span>
          </button>
        </div>
      </div>

      {/* MODAL: RESET CONFIRMATION */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-red-200 shadow-2xl p-6 relative">
            <button
              onClick={() => setIsResetModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#64748B] hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-red-100 text-red-600 border border-red-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#172033]">Confirm System Wipe</h3>
                <p className="text-xs text-[#64748B]">Permanent reset of demo data</p>
              </div>
            </div>

            {resetSuccess ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-emerald-900 mb-0.5">All Data Successfully Reset</div>
                    <div>Your system has been completely cleaned and is ready for personal use under Nexus Pizza & Grill.</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
                  This will clear all past mock orders, cart history, test customers, and reset your store to <strong>Nexus Pizza & Grill</strong> owned by <strong>Administrator</strong>.
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1.5">
                    Type <span className="font-mono text-red-600 font-black">RESET</span> to confirm:
                  </label>
                  <input
                    type="text"
                    value={resetConfirmText}
                    onChange={(e) => setResetConfirmText(e.target.value)}
                    placeholder="RESET"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs font-mono font-bold text-[#172033] focus:bg-white focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-100"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsResetModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={resetConfirmText.trim().toUpperCase() !== 'RESET'}
                    onClick={() => {
                      resetAllData();
                      setResetSuccess(true);
                    }}
                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Wipe & Reset Everything
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: EDIT SUPER ADMIN FULL NAME / DISPLAY NAME */}
      {isEditNameOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5EAF2] shadow-2xl p-6 relative">
            <button
              onClick={() => setIsEditNameOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#64748B] hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#172033]">Edit Super Admin Name</h3>
                <p className="text-xs text-[#64748B]">Update Full Name & Display Name permanently in Firestore database</p>
              </div>
            </div>

            {nameSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{nameSuccess}</span>
              </div>
            )}

            <form onSubmit={handleEditNameSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Full Name / Display Name
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="Administrator"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs font-medium text-[#172033] focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                />
                <p className="text-[11px] text-[#64748B] mt-1">
                  This name will appear on all administrative logs, dashboards, and platform certificates. Your sign-in email and password remain unchanged.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditNameOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save & Update Everywhere
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHANGE PASSWORD */}
      {isChangePassOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5EAF2] shadow-2xl p-6 relative">
            <button
              onClick={() => setIsChangePassOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#64748B] hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#172033]">Update Admin Password</h3>
                <p className="text-xs text-[#64748B]">Set a new master password for Super Admin</p>
              </div>
            </div>

            {passError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passError}</span>
              </div>
            )}

            {passSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{passSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Current Master Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs font-medium text-[#172033] focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs font-medium text-[#172033] focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs font-medium text-[#172033] focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangePassOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHANGE EMAIL / USERNAME */}
      {isChangeEmailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5EAF2] shadow-2xl p-6 relative">
            <button
              onClick={() => setIsChangeEmailOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#64748B] hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#172033]">Update Admin Profile</h3>
                <p className="text-xs text-[#64748B]">Change owner name and sign-in email</p>
              </div>
            </div>

            {emailError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{emailError}</span>
              </div>
            )}

            {emailSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{emailSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangeEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Owner / CEO Name
                </label>
                <input
                  type="text"
                  required
                  value={newCeoName}
                  onChange={(e) => setNewCeoName(e.target.value)}
                  placeholder="Administrator"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs font-medium text-[#172033] focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Admin Sign-In Email / Username
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="admin@nexus-pos.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs font-medium text-[#172033] focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Confirm Current Password (for security)
                </label>
                <input
                  type="password"
                  required
                  value={emailVerifyPass}
                  onChange={(e) => setEmailVerifyPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs font-medium text-[#172033] focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangeEmailOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHANGE DEVICE AUTHORIZATION PASSWORD (SUPER ADMIN ONLY) */}
      {isChangeDevicePassOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5EAF2] shadow-2xl p-6 relative">
            <button
              onClick={() => setIsChangeDevicePassOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#64748B] hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#172033]">Change Device Password</h3>
                <p className="text-xs text-[#64748B]">Super Admin Device Authorization Credential</p>
              </div>
            </div>

            {devicePassError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{devicePassError}</span>
              </div>
            )}

            {devicePassSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{devicePassSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangeDevicePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={deviceCurrentPass}
                  onChange={(e) => setDeviceCurrentPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs font-medium text-[#172033] focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={deviceNewPass}
                  onChange={(e) => setDeviceNewPass(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs font-medium text-[#172033] focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={deviceConfirmPass}
                  onChange={(e) => setDeviceConfirmPass(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs font-medium text-[#172033] focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-[11px] text-blue-900 leading-relaxed">
                After saving, the previous password will immediately stop working across all terminals.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangeDevicePassOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={devicePassLoading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2"
                >
                  {devicePassLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Update Security Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

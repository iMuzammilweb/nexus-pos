import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  KeyRound,
  Trash2,
  Edit2,
  Store as StoreIcon,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Check,
  X,
  Lock,
  Layers,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { useNexus } from '../../../context/NexusContext';
import { StaffAccount, Store } from '../../../types';

export const StaffAccountsManagementView: React.FC = () => {
  const {
    staffAccounts,
    addStaffAccount,
    updateStaffAccount,
    deleteStaffAccount,
    resetStaffPassword,
    stores,
  } = useNexus();

  const [searchQuery, setSearchQuery] = useState('');
  const [storeFilter, setStoreFilter] = useState('all');

  // Create Staff Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPhone, setCreatePhone] = useState('+44 7700 ');
  const [createPassword, setCreatePassword] = useState('');
  const [createSelectedStoreIds, setCreateSelectedStoreIds] = useState<string[]>([]);
  const [createStatus, setCreateStatus] = useState<'Active' | 'Disabled'>('Active');
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Staff Modal State
  const [editModalStaff, setEditModalStaff] = useState<StaffAccount | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editSelectedStoreIds, setEditSelectedStoreIds] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState<'Active' | 'Disabled'>('Active');
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // Reset Password Modal State
  const [resetModalStaff, setResetModalStaff] = useState<StaffAccount | null>(null);
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return (staffAccounts || []).filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.username?.toLowerCase().includes(searchQuery.toLowerCase());

      const assignedList = Array.isArray(s.assignedStoreIds) && s.assignedStoreIds.length > 0
        ? s.assignedStoreIds
        : (s.assignedStoreId ? [s.assignedStoreId] : []);

      const matchesStore = storeFilter === 'all' || assignedList.includes(storeFilter);
      return matchesSearch && matchesStore;
    });
  }, [staffAccounts, searchQuery, storeFilter]);

  // Open Create Modal
  const openCreateModal = () => {
    setCreateError(null);
    setCreateName('');
    setCreateEmail('');
    setCreatePhone('+44 7700 ');
    setCreatePassword('');
    setCreateStatus('Active');
    // Default to the first store selected
    setCreateSelectedStoreIds(stores.length > 0 ? [stores[0].id] : ['store-1']);
    setIsCreateOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (staff: StaffAccount) => {
    setEditError(null);
    setEditSuccess(null);
    setEditModalStaff(staff);
    setEditName(staff.name);
    setEditEmail(staff.email);
    setEditPhone(staff.phone || '');
    setEditPassword('');
    setEditStatus(staff.status);
    const existingStores = Array.isArray(staff.assignedStoreIds) && staff.assignedStoreIds.length > 0
      ? staff.assignedStoreIds
      : (staff.assignedStoreId ? [staff.assignedStoreId] : [stores[0]?.id || 'store-1']);
    setEditSelectedStoreIds(existingStores);
  };

  // Create Staff Submission
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!createName.trim() || !createEmail.trim() || !createPassword.trim()) {
      setCreateError('Please fill in all required fields (Name, Email/Username, and Password).');
      return;
    }

    if (createPassword.length < 4) {
      setCreateError('Password must be at least 4 characters.');
      return;
    }

    if (createSelectedStoreIds.length === 0) {
      setCreateError('Please assign at least one store branch to this staff account.');
      return;
    }

    // Check duplicate email
    const exists = staffAccounts.some((s) => s.email.toLowerCase() === createEmail.trim().toLowerCase());
    if (exists) {
      setCreateError('A staff account with this email/username already exists. Do not create duplicates.');
      return;
    }

    addStaffAccount({
      name: createName.trim(),
      username: createEmail.trim(),
      email: createEmail.trim(),
      password: createPassword.trim(),
      phone: createPhone.trim(),
      role: 'STAFF',
      assignedStoreIds: createSelectedStoreIds,
      assignedStoreId: createSelectedStoreIds[0],
      status: createStatus,
    });

    setIsCreateOpen(false);
  };

  // Edit Staff Submission
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalStaff) return;
    setEditError(null);

    if (!editName.trim() || !editEmail.trim()) {
      setEditError('Staff Name and Login Email/Username cannot be empty.');
      return;
    }

    if (editSelectedStoreIds.length === 0) {
      setEditError('Please assign at least one store branch to this staff member.');
      return;
    }

    if (editPassword && editPassword.trim().length < 4) {
      setEditError('New password must be at least 4 characters long.');
      return;
    }

    const updates: Partial<StaffAccount> = {
      name: editName.trim(),
      username: editEmail.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      status: editStatus,
      assignedStoreIds: editSelectedStoreIds,
      assignedStoreId: editSelectedStoreIds[0],
    };

    if (editPassword.trim()) {
      updates.password = editPassword.trim();
    }

    updateStaffAccount(editModalStaff.id, updates);
    setEditSuccess(`Staff account for ${editName} updated successfully!`);

    setTimeout(() => {
      setEditModalStaff(null);
      setEditSuccess(null);
    }, 1000);
  };

  // Password Reset Submission
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalStaff || !newStaffPassword.trim()) return;

    resetStaffPassword(resetModalStaff.id, newStaffPassword.trim());
    setResetSuccess(`Password successfully updated for ${resetModalStaff.name}!`);
    setTimeout(() => {
      setResetModalStaff(null);
      setResetSuccess(null);
      setNewStaffPassword('');
    }, 1400);
  };

  // Toggle store helper
  const toggleStoreInList = (list: string[], storeId: string): string[] => {
    if (list.includes(storeId)) {
      return list.filter((id) => id !== storeId);
    }
    return [...list, storeId];
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold uppercase tracking-wider mb-1.5">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Staff Terminal Accounts & Permissions</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#172033] tracking-tight">
            Staff & Phone Operator Accounts
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Assign single or multiple store branches to staff members with isolated order taking and dispatch.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer shrink-0 active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Create Staff Account</span>
        </button>
      </div>

      {/* 2. FILTERS & SEARCH */}
      <div className="bg-white rounded-2xl border border-[#E5EAF2] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by staff name or email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs font-medium text-[#172033] focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-[#64748B] whitespace-nowrap">Filter by Location:</span>
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs font-bold text-[#172033] focus:outline-none focus:border-blue-600 cursor-pointer"
          >
            <option value="all">All Store Locations</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.businessName} ({s.city || 'Branch'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. STAFF ACCOUNTS TABLE */}
      <div className="bg-white rounded-3xl border border-[#E5EAF2] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-[#E5EAF2] text-[#64748B] font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-4">Assigned Store Access</th>
                <th className="py-3.5 px-4">Contact Phone</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Last Active</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAF2]">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#94A3B8]">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <div>No staff accounts found matching your filter.</div>
                    <button
                      onClick={openCreateModal}
                      className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer"
                    >
                      + Create a new Staff Account
                    </button>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const assignedIds = Array.isArray(staff.assignedStoreIds) && staff.assignedStoreIds.length > 0
                    ? staff.assignedStoreIds
                    : (staff.assignedStoreId ? [staff.assignedStoreId] : []);

                  const assignedStoreObjects = stores.filter((s) => assignedIds.includes(s.id));

                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                            {staff.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-[#172033]">{staff.name}</div>
                            <div className="text-[11px] text-[#64748B] flex items-center gap-1">
                              <Mail className="w-3 h-3 text-[#94A3B8]" />
                              <span>{staff.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Multi-Store Access Badges */}
                      <td className="py-3.5 px-4">
                        {assignedStoreObjects.length === 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-semibold">
                            <AlertCircle className="w-3 h-3" />
                            <span>No Stores Assigned</span>
                          </span>
                        ) : assignedStoreObjects.length === 1 ? (
                          <div className="flex items-center gap-1.5 font-semibold text-[#172033]">
                            <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                              <StoreIcon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs">{assignedStoreObjects[0].businessName}</span>
                            <span className="text-[10px] text-[#64748B]">({assignedStoreObjects[0].city || 'Main'})</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                                <Layers className="w-3 h-3 text-blue-600" />
                                <span>{assignedStoreObjects.length} Stores Assigned</span>
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 max-w-[280px]">
                              {assignedStoreObjects.slice(0, 3).map((st) => (
                                <span
                                  key={st.id}
                                  className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md border border-slate-200 truncate max-w-[130px]"
                                  title={`${st.businessName} (${st.city})`}
                                >
                                  <StoreIcon className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                                  <span className="truncate">{st.businessName}</span>
                                </span>
                              ))}
                              {assignedStoreObjects.length > 3 && (
                                <span className="text-[10px] font-bold text-blue-600 px-1 self-center">
                                  +{assignedStoreObjects.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 text-[#64748B]">
                        {staff.phone ? (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[#94A3B8]" />
                            <span>{staff.phone}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => {
                            const next = staff.status === 'Active' ? 'Disabled' : 'Active';
                            updateStaffAccount(staff.id, { status: next });
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                            staff.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {staff.status === 'Active' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-red-600" />
                              <span>Disabled</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Last Active */}
                      <td className="py-3.5 px-4 text-[#64748B]">
                        {staff.lastLogin
                          ? new Date(staff.lastLogin).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Never'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Details & Stores */}
                          <button
                            type="button"
                            onClick={() => openEditModal(staff)}
                            className="p-1.5 rounded-lg text-[#64748B] hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit Staff & Store Access"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Reset Password */}
                          <button
                            type="button"
                            onClick={() => {
                              setResetModalStaff(staff);
                              setNewStaffPassword('');
                              setResetSuccess(null);
                            }}
                            className="p-1.5 rounded-lg text-[#64748B] hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Reset Password"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Delete Account */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete staff account ${staff.name}?`)) {
                                deleteStaffAccount(staff.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-[#64748B] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Staff"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE STAFF MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-[#E5EAF2] shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#64748B] hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#172033]">Create Staff Account</h3>
                <p className="text-xs text-[#64748B]">Authorize operator & assign single or multiple store branches</p>
              </div>
            </div>

            {createError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Full Staff Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs font-medium text-[#172033] focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Login Email / Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="e.g. staff.sarah@nexus-pos.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs font-medium text-[#172033] focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={createPhone}
                    onChange={(e) => setCreatePhone(e.target.value)}
                    placeholder="+44 7700 900892"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs font-medium text-[#172033] focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Initial Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs font-medium text-[#172033] focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* STORE ACCESS SECTION */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-[#E5EAF2] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <StoreIcon className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-[#172033]">Store Access Permissions</span>
                    <span className="text-red-500">*</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCreateSelectedStoreIds(stores.map((s) => s.id))}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setCreateSelectedStoreIds([])}
                      className="text-[11px] font-bold text-[#64748B] hover:text-[#172033] cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-[#64748B]">
                  Check the store branch(es) this staff member can access. If multiple stores are chosen, staff will see a store selector after login.
                </p>

                {/* Touchscreen-Friendly Store Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {stores.map((st) => {
                    const isChecked = createSelectedStoreIds.includes(st.id);
                    return (
                      <div
                        key={st.id}
                        onClick={() => setCreateSelectedStoreIds((prev) => toggleStoreInList(prev, st.id))}
                        className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all select-none ${
                          isChecked
                            ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
                            : 'bg-white border-[#E5EAF2] hover:border-slate-300 text-[#172033]'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                            isChecked
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white border-[#CBD5E1]'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs truncate">{st.businessName}</div>
                          <div className="text-[10px] text-[#64748B] truncate">
                            {st.city || 'Branch'}, {st.postcode || 'UK'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Counter & Warning */}
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200">
                  <span>
                    {createSelectedStoreIds.length === 0 ? (
                      <span className="text-red-600 font-bold">⚠️ Assign at least 1 store</span>
                    ) : (
                      <span className="text-emerald-700 font-bold">
                        ✓ {createSelectedStoreIds.length} store branch{createSelectedStoreIds.length > 1 ? 'es' : ''} selected
                      </span>
                    )}
                  </span>
                  <span className="text-[#64748B]">Total Available: {stores.length}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">Account Status</label>
                <select
                  value={createStatus}
                  onChange={(e) => setCreateStatus(e.target.value as 'Active' | 'Disabled')}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs font-bold text-[#172033] focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="Active">Active (Permitted to log in)</option>
                  <option value="Disabled">Disabled (Suspended access)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5EAF2]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#64748B] hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSelectedStoreIds.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STAFF & STORE ACCESS MODAL */}
      {editModalStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-[#E5EAF2] shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditModalStaff(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#64748B] hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Edit2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#172033]">Edit Staff Account & Store Access</h3>
                <p className="text-xs text-[#64748B]">Update profile details and add or remove branch permissions</p>
              </div>
            </div>

            {editError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            {editSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{editSuccess}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Full Staff Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs font-medium text-[#172033] focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Login Email / Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs font-medium text-[#172033] focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs font-medium text-[#172033] focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Update Password <span className="text-[#64748B] font-normal">(optional)</span>
                  </label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Leave blank to keep current"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs font-medium text-[#172033] focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* STORE ACCESS SECTION */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-[#E5EAF2] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <StoreIcon className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-[#172033]">Store Access Permissions</span>
                    <span className="text-red-500">*</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditSelectedStoreIds(stores.map((s) => s.id))}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setEditSelectedStoreIds([])}
                      className="text-[11px] font-bold text-[#64748B] hover:text-[#172033] cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-[#64748B]">
                  Add or remove store branches for this staff operator. Changes take effect immediately in real-time.
                </p>

                {/* Touchscreen-Friendly Store Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {stores.map((st) => {
                    const isChecked = editSelectedStoreIds.includes(st.id);
                    return (
                      <div
                        key={st.id}
                        onClick={() => setEditSelectedStoreIds((prev) => toggleStoreInList(prev, st.id))}
                        className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all select-none ${
                          isChecked
                            ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
                            : 'bg-white border-[#E5EAF2] hover:border-slate-300 text-[#172033]'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                            isChecked
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white border-[#CBD5E1]'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs truncate">{st.businessName}</div>
                          <div className="text-[10px] text-[#64748B] truncate">
                            {st.city || 'Branch'}, {st.postcode || 'UK'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Counter & Warning */}
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200">
                  <span>
                    {editSelectedStoreIds.length === 0 ? (
                      <span className="text-red-600 font-bold">⚠️ Assign at least 1 store</span>
                    ) : (
                      <span className="text-emerald-700 font-bold">
                        ✓ {editSelectedStoreIds.length} store branch{editSelectedStoreIds.length > 1 ? 'es' : ''} assigned
                      </span>
                    )}
                  </span>
                  <span className="text-[#64748B]">Total Available: {stores.length}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">Account Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'Active' | 'Disabled')}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs font-bold text-[#172033] focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="Active">Active (Permitted to log in)</option>
                  <option value="Disabled">Disabled (Suspended access)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5EAF2]">
                <button
                  type="button"
                  onClick={() => setEditModalStaff(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#64748B] hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSelectedStoreIds.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Store Permissions & Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetModalStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5EAF2] shadow-2xl p-6 relative">
            <button
              onClick={() => setResetModalStaff(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#64748B] hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#172033]">Reset Staff Password</h3>
                <p className="text-xs text-[#64748B]">For {resetModalStaff.name}</p>
              </div>
            </div>

            {resetSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    New Staff Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newStaffPassword}
                    onChange={(e) => setNewStaffPassword(e.target.value)}
                    placeholder="Enter new password (min 4 chars)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs font-medium text-[#172033] focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetModalStaff(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Set Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

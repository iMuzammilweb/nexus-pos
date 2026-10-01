import React, { useState } from 'react';
import {
  X,
  Lock,
  Unlock,
  User,
  ShieldCheck,
  KeyRound,
  Trash2,
  Plus,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useNexus } from '../../context/NexusContext';
import { EmployeeRole } from '../../types';
import { clearStoredDeviceToken } from '../../services/deviceAuthService';

export const StaffLockModal: React.FC = () => {
  const {
    isStaffLockModalOpen,
    setIsStaffLockModalOpen,
    currentEmployee,
    setCurrentEmployee,
    setActiveOperator,
    currentStore,
    employees,
    deleteEmployee,
    addEmployee,
  } = useNexus();

  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    currentEmployee?.id || employees[0]?.id || ''
  );
  const [showManageStaff, setShowManageStaff] = useState<boolean>(false);

  // New staff form state
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<EmployeeRole>('Cashier');
  const [newStaffPin, setNewStaffPin] = useState('1234');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!isStaffLockModalOpen) return null;

  const handleNumClick = (num: string) => {
    if (enteredPin.length < 6) {
      setEnteredPin((prev) => prev + num);
      setPinError(null);
    }
  };

  const handleBackspace = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setPinError(null);
  };

  const handleClear = () => {
    setEnteredPin('');
    setPinError(null);
  };

  const handleUnlock = () => {
    const targetStaff = employees.find((e) => e.id === selectedStaffId);
    if (!targetStaff) return;

    if (enteredPin === targetStaff.pinCode || enteredPin === '9999' || enteredPin === '1234') {
      setActiveOperator(targetStaff);
      setIsStaffLockModalOpen(false);
      setEnteredPin('');
      setPinError(null);
    } else {
      setPinError('Invalid PIN code. Please try again.');
      setEnteredPin('');
    }
  };

  const handleAddNewStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;

    addEmployee({
      storeId: currentStore?.id || 'store-1',
      name: newStaffName.trim(),
      role: newStaffRole,
      pinCode: newStaffPin || '1234',
      hourlyRate: 12.5,
      clockedIn: false,
    });

    setNewStaffName('');
    setNewStaffPin('1234');
  };

  const handleDeleteStaff = (empId: string) => {
    if (employees.length <= 1) {
      alert('Cannot delete the only staff member.');
      return;
    }
    deleteEmployee(empId);
    setDeleteConfirmId(null);
    if (selectedStaffId === empId) {
      const remaining = employees.filter((e) => e.id !== empId);
      if (remaining[0]) setSelectedStaffId(remaining[0].id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white border border-[#E5EAF2] rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-white border-b border-[#E5EAF2] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#172033] tracking-tight">Staff Security & Switch</h2>
              <p className="text-[11px] text-[#64748B]">Select employee and enter PIN</p>
            </div>
          </div>
          <button
            onClick={() => setIsStaffLockModalOpen(false)}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#F8FAFC]">
          {!showManageStaff ? (
            <>
              {/* Staff Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
                  1. Select Staff Member
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {employees.map((emp) => {
                    const isSelected = emp.id === selectedStaffId;
                    return (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => {
                          setSelectedStaffId(emp.id);
                          setEnteredPin('');
                          setPinError(null);
                        }}
                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer shadow-xs ${
                          isSelected
                            ? 'bg-[#EFF6FF] border-blue-600 text-blue-600 ring-1 ring-blue-500'
                            : 'bg-white border-[#E5EAF2] text-[#172033] hover:border-blue-200'
                        }`}
                      >
                        <span className="font-bold text-xs truncate">{emp.name}</span>
                        <span className="text-[10px] text-[#64748B] font-mono mt-1">{emp.role}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PIN Display & Pad */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B]">
                    2. Enter Passcode / PIN
                  </label>
                  <span className="text-[10px] text-[#64748B] font-mono">
                    (Default: 1234 or 9999)
                  </span>
                </div>

                {/* Masked PIN bubbles */}
                <div className="flex justify-center items-center gap-3 py-2 bg-white rounded-xl border border-[#E5EAF2] shadow-xs">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className={`w-3.5 h-3.5 rounded-full border transition-all ${
                        enteredPin.length > idx
                          ? 'bg-blue-600 border-blue-600 scale-110 shadow-xs'
                          : 'border-[#E5EAF2] bg-slate-100'
                      }`}
                    />
                  ))}
                </div>

                {pinError && (
                  <div className="text-center text-xs text-rose-500 font-semibold">{pinError}</div>
                )}

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto pt-1">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        if (k === 'C') handleClear();
                        else if (k === '⌫') handleBackspace();
                        else handleNumClick(k);
                      }}
                      className="h-11 rounded-lg bg-white hover:bg-[#EFF6FF] text-[#172033] font-mono font-bold text-sm border border-[#E5EAF2] hover:border-blue-300 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-xs"
                    >
                      {k}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleUnlock}
                  disabled={enteredPin.length === 0}
                  className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer mt-2"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Authenticate & Switch Staff</span>
                </button>
              </div>

              {/* Bottom toggle to manage staff */}
              <div className="pt-2 border-t border-[#E5EAF2] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowManageStaff(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
                >
                  Manage Staff & Roles →
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsStaffLockModalOpen(false);
                    clearStoredDeviceToken();
                    window.location.reload();
                  }}
                  className="text-xs text-amber-700 hover:text-amber-800 font-bold cursor-pointer flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Master Lock Screen</span>
                </button>
              </div>
            </>
          ) : (
            /* Manage Staff View */
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5EAF2] pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                  Staff Members List
                </h3>
                <button
                  type="button"
                  onClick={() => setShowManageStaff(false)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
                >
                  ← Back to PIN Pad
                </button>
              </div>

              {/* Existing Staff Table */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {employees.map((emp) => (
                  <div
                    key={emp.id}
                    className="p-2.5 rounded-xl bg-white border border-[#E5EAF2] flex items-center justify-between text-xs shadow-xs"
                  >
                    <div>
                      <span className="font-bold text-[#172033] block">{emp.name}</span>
                      <span className="text-[10px] text-[#64748B] font-mono">
                        Role: {emp.role} • PIN: ****
                      </span>
                    </div>

                    {deleteConfirmId === emp.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDeleteStaff(emp.id)}
                          className="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-bold"
                        >
                          Confirm Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1 rounded bg-slate-100 text-[#172033] text-[10px]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(emp.id)}
                        className="p-1 rounded text-[#64748B] hover:text-rose-500 hover:bg-rose-50 transition-colors"
                        title="Delete Staff ID"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add New Staff Form */}
              <form
                onSubmit={handleAddNewStaff}
                className="p-3 bg-white rounded-xl border border-[#E5EAF2] space-y-2.5 text-xs shadow-xs"
              >
                <span className="font-bold text-[#172033] block">Add New Staff Member</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Staff Full Name"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] focus:border-blue-600 focus:outline-none"
                  />
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as EmployeeRole)}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] focus:border-blue-600 focus:outline-none font-medium"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Cashier">Cashier</option>
                    <option value="Kitchen">Kitchen</option>
                    <option value="Driver">Driver</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="4-digit PIN (e.g. 1234)"
                    value={newStaffPin}
                    onChange={(e) => setNewStaffPin(e.target.value)}
                    className="w-36 px-2.5 py-1.5 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] font-mono focus:border-blue-600 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Add Staff Member
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

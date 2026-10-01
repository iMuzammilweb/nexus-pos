import React, { useState, useMemo } from 'react';
import {
  X,
  CircleDollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  Unlock,
  History,
  CheckCircle2,
  TrendingUp,
  Receipt,
  User,
  RotateCcw,
  AlertTriangle,
  CreditCard,
  Banknote,
  Users,
  ShieldAlert,
  ChevronDown,
  ShoppingBag,
} from 'lucide-react';
import { useNexus } from '../../context/NexusContext';
import { Employee } from '../../types';

export const CashDrawerModal: React.FC = () => {
  const {
    isCashDrawerModalOpen,
    setIsCashDrawerModalOpen,
    cashDrawerState,
    cashDrawerTransactions,
    openDrawer,
    recordCashIn,
    recordCashOut,
    resetCashDrawerSales,
    currentStore,
    currentEmployee,
    employees,
    roles,
    setActiveOperator,
    orders,
  } = useNexus();

  const [activeTab, setActiveTab] = useState<'status' | 'operator' | 'cash-in' | 'cash-out' | 'logs'>('status');
  const [cashInAmount, setCashInAmount] = useState<string>('');
  const [cashInReason, setCashInReason] = useState<string>('Float Addition / Change Top-Up');
  const [cashOutAmount, setCashOutAmount] = useState<string>('');
  const [cashOutReason, setCashOutReason] = useState<string>('Supplier Cash Payment');
  const [manualOpenReason, setManualOpenReason] = useState<string>('Routine Register Count');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Reset Drawer & Sales Modal State
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [newOpeningFloatInput, setNewOpeningFloatInput] = useState<string>('0.00');
  const [resetOrdersCheck, setResetOrdersCheck] = useState<boolean>(true);
  const [resetReason, setResetReason] = useState<string>('End of shift reconciliation & fresh shift open');

  if (!isCashDrawerModalOpen) return null;

  // 1. Calculate Gross Sales, Avg Sales (AOV), Order Count, Card vs Cash for Current Store
  const storeOrders = (orders || []).filter(
    (o) => o.storeId === currentStore.id && o.orderStatus !== 'Cancelled'
  );

  const grossSales = storeOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const totalOrderCount = storeOrders.length;
  const avgSales = totalOrderCount > 0 ? grossSales / totalOrderCount : 0.0;

  const cashOrdersSales = storeOrders
    .filter((o) => o.paymentMethod === 'Cash')
    .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  const cardOrdersSales = storeOrders
    .filter((o) => o.paymentMethod === 'Card' || o.paymentMethod === 'Online' || o.paymentMethod === 'Split' || o.paymentMethod === 'Contactless')
    .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  const currentRole = (roles || []).find((r) => r.id === currentEmployee?.roleId);
  const storeEmployees = (employees || []).filter(
    (e) => !e.storeId || e.storeId === currentStore.id || e.role === 'Administrator' || e.roleId === 'role-admin'
  );

  const handleOpenDrawerKick = () => {
    openDrawer(manualOpenReason);
    setActionSuccess('Cash drawer kick command sent successfully.');
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleProcessCashIn = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(cashInAmount);
    if (isNaN(val) || val <= 0) {
      alert('Please enter a valid cash-in amount.');
      return;
    }
    recordCashIn(val, cashInReason);
    setCashInAmount('');
    setActionSuccess(`£${val.toFixed(2)} cash-in recorded.`);
    setTimeout(() => {
      setActionSuccess(null);
      setActiveTab('status');
    }, 1500);
  };

  const handleProcessCashOut = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(cashOutAmount);
    if (isNaN(val) || val <= 0) {
      alert('Please enter a valid cash-out amount.');
      return;
    }
    if (val > cashDrawerState.currentBalance) {
      if (
        !confirm(
          `Warning: Cash out (£${val.toFixed(2)}) exceeds current recorded balance (£${cashDrawerState.currentBalance.toFixed(2)}). Continue?`
        )
      ) {
        return;
      }
    }
    recordCashOut(val, cashOutReason);
    setCashOutAmount('');
    setActionSuccess(`£${val.toFixed(2)} cash payout recorded.`);
    setTimeout(() => {
      setActionSuccess(null);
      setActiveTab('status');
    }, 1500);
  };

  const handleExecuteReset = (e: React.FormEvent) => {
    e.preventDefault();
    const floatNum = parseFloat(newOpeningFloatInput) || 0.0;
    resetCashDrawerSales({
      resetOrders: resetOrdersCheck,
      newOpeningFloat: floatNum,
      reason: resetReason,
    });
    setIsResetConfirmOpen(false);
    setActionSuccess(
      `Till & Sales Reset: Gross sales and till balance cleared with £${floatNum.toFixed(2)} float.`
    );
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleSwitchOperator = (empId: string) => {
    setActiveOperator(empId);
    setActionSuccess(`Active operator changed.`);
    setTimeout(() => setActionSuccess(null), 2500);
  };

  const storeTransactions = cashDrawerTransactions.filter((tx) => tx.storeId === currentStore.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white border border-[#E5EAF2] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-white border-b border-[#E5EAF2] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold">
              <CircleDollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
                Cash Drawer & Sales Management
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                  {currentStore?.businessName}
                </span>
              </h3>
              <p className="text-xs text-[#64748B] flex items-center gap-2 mt-0.5">
                <span>Active Operator:</span>
                <strong className="text-blue-700 font-semibold">{currentEmployee?.name || 'Administrator'}</strong>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 font-mono">
                  {currentRole?.name || 'Cashier'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Reset Cash Drawer Balance, Gross Sales & Average Sales"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Drawer & Sales</span>
            </button>

            <button
              onClick={() => setIsCashDrawerModalOpen(false)}
              className="p-2 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2.5 bg-[#F8FAFC] border-b border-[#E5EAF2] flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('status')}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0 ${
              activeTab === 'status'
                ? 'bg-blue-600 text-white'
                : 'text-[#64748B] hover:text-[#172033] bg-white border border-[#E5EAF2]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Till & Sales Overview
          </button>

          <button
            onClick={() => setActiveTab('operator')}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0 ${
              activeTab === 'operator'
                ? 'bg-blue-600 text-white'
                : 'text-[#64748B] hover:text-[#172033] bg-white border border-[#E5EAF2]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Active Operator ({currentEmployee?.name?.split(' ')[0]})
          </button>

          <button
            onClick={() => setActiveTab('cash-in')}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0 ${
              activeTab === 'cash-in'
                ? 'bg-blue-600 text-white'
                : 'text-[#64748B] hover:text-[#172033] bg-white border border-[#E5EAF2]'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            + Cash In
          </button>

          <button
            onClick={() => setActiveTab('cash-out')}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0 ${
              activeTab === 'cash-out'
                ? 'bg-blue-600 text-white'
                : 'text-[#64748B] hover:text-[#172033] bg-white border border-[#E5EAF2]'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            - Cash Out
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0 ${
              activeTab === 'logs'
                ? 'bg-blue-600 text-white'
                : 'text-[#64748B] hover:text-[#172033] bg-white border border-[#E5EAF2]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Audit Log ({storeTransactions.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-[#F8FAFC]">
          {actionSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* TAB 1: TILL & SALES OVERVIEW */}
          {activeTab === 'status' && (
            <div className="space-y-5">
              {/* PRIMARY FINANCIAL METRICS (Gross Sales, Avg Sales, Cash in Till) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* 1. Gross Sales */}
                <div className="p-4 rounded-2xl bg-white border border-[#E5EAF2] shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                      Gross Sales (Today)
                    </span>
                    <ShoppingBag className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-black text-[#172033] font-mono">
                    £{grossSales.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-[#64748B] mt-1 block">
                    {totalOrderCount} Completed / Active Orders
                  </span>
                </div>

                {/* 2. Average Sales (AOV) */}
                <div className="p-4 rounded-2xl bg-white border border-[#E5EAF2] shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                      Avg Sales / Order (AOV)
                    </span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-emerald-600 font-mono">
                    £{avgSales.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-[#64748B] mt-1 block">
                    Average basket spend per ticket
                  </span>
                </div>

                {/* 3. Live Cash in Till */}
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                      Live Cash in Till
                    </span>
                    <Banknote className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-black text-blue-700 font-mono">
                    £{(cashDrawerState?.currentBalance ?? 0).toFixed(2)}
                  </div>
                  <span className="text-[10px] text-blue-600 font-medium mt-1 block">
                    Float: £{(cashDrawerState?.openingBalance ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Methods & Flow Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-white border border-[#E5EAF2] shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-[#64748B] flex items-center gap-1">
                    <Banknote className="w-3 h-3 text-emerald-600" />
                    Cash Sales
                  </span>
                  <span className="text-base font-bold text-[#172033] font-mono block mt-1">
                    +£{cashOrdersSales.toFixed(2)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#E5EAF2] shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-[#64748B] flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-blue-600" />
                    Card / Digital
                  </span>
                  <span className="text-base font-bold text-[#172033] font-mono block mt-1">
                    +£{cardOrdersSales.toFixed(2)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#E5EAF2] shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-[#64748B] flex items-center gap-1">
                    <ArrowDownLeft className="w-3 h-3 text-blue-600" />
                    Float In
                  </span>
                  <span className="text-base font-bold text-blue-600 font-mono block mt-1">
                    +£{(cashDrawerState?.totalCashIn ?? 0).toFixed(2)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#E5EAF2] shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-[#64748B] flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3 text-amber-600" />
                    Cash Paid Out
                  </span>
                  <span className="text-base font-bold text-amber-600 font-mono block mt-1">
                    -£{(cashDrawerState?.totalCashOut ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Drawer Kick & Quick Operator Bar */}
              <div className="p-4.5 rounded-2xl bg-white border border-[#E5EAF2] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      (currentEmployee?.avatarUrl && currentEmployee.avatarUrl.trim() !== '')
                        ? currentEmployee.avatarUrl
                        : (currentEmployee?.avatar && currentEmployee.avatar.trim() !== '')
                        ? currentEmployee.avatar
                        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                    }
                    alt={currentEmployee?.name}
                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-blue-100"
                  />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#64748B] block">Current Active Operator</span>
                    <span className="text-sm font-bold text-[#172033]">{currentEmployee?.name || 'Administrator'}</span>
                    <span className="text-xs text-blue-600 font-semibold block">{currentRole?.name || 'Cashier'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('operator')}
                    className="px-3.5 py-2 rounded-xl bg-[#F8FAFC] hover:bg-slate-100 border border-[#E5EAF2] text-[#172033] font-bold text-xs transition-colors cursor-pointer"
                  >
                    Switch Operator
                  </button>
                  <button
                    onClick={handleOpenDrawerKick}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Open Drawer</span>
                  </button>
                </div>
              </div>

              {/* Reset Warning / Action Card */}
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold shrink-0">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-rose-900">Shift Reconciliation & Counter Reset</h4>
                    <p className="text-[11px] text-rose-700">
                      Reset cash drawer balance, gross sales, and average sales to £0.00 for the next shift or operator.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all shrink-0 cursor-pointer"
                >
                  Reset Shift Counters
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVE OPERATOR */}
          {activeTab === 'operator' && (
            <div className="space-y-4">
              <div className="bg-white border border-[#E5EAF2] rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF2] mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-[#172033]">Select Active Till Operator</h4>
                    <p className="text-xs text-[#64748B]">
                      The active operator is assigned to all new receipts, cash sales, and drawer transactions.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {storeEmployees.map((emp) => {
                    const isSelected = emp.id === currentEmployee?.id;
                    const role = roles.find((r) => r.id === emp.roleId);
                    return (
                      <button
                        key={emp.id}
                        onClick={() => handleSwitchOperator(emp.id)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20'
                            : 'bg-white hover:bg-slate-50 border-[#E5EAF2]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              (emp.avatarUrl && emp.avatarUrl.trim() !== '')
                                ? emp.avatarUrl
                                : (emp.avatar && emp.avatar.trim() !== '')
                                ? emp.avatar
                                : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                            }
                            alt={emp.name}
                            className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200"
                          />
                          <div>
                            <span className="font-bold text-xs text-[#172033] block">{emp.name}</span>
                            <span className="text-[10px] text-blue-600 font-semibold">{role?.name || emp.role}</span>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CASH IN */}
          {activeTab === 'cash-in' && (
            <form onSubmit={handleProcessCashIn} className="space-y-4">
              <div className="bg-white border border-[#E5EAF2] rounded-2xl p-5 shadow-xs space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#172033] uppercase mb-1.5">
                    Cash In Float Amount (£) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="e.g. 50.00"
                    value={cashInAmount}
                    onChange={(e) => setCashInAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2] text-[#172033] font-mono text-lg font-bold focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] uppercase mb-1.5">
                    Reason / Source Description *
                  </label>
                  <select
                    value={cashInReason}
                    onChange={(e) => setCashInReason(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2] text-[#172033] text-xs font-semibold focus:outline-none focus:border-blue-600 shadow-xs cursor-pointer"
                  >
                    <option value="Float Addition / Change Top-Up">Float Addition / Change Top-Up</option>
                    <option value="Manager Cash Injection">Manager Cash Injection</option>
                    <option value="Customer Dispute Adjustment">Customer Dispute Adjustment</option>
                    <option value="Petty Cash Refund">Petty Cash Refund</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Confirm & Add Float to Drawer</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: CASH OUT */}
          {activeTab === 'cash-out' && (
            <form onSubmit={handleProcessCashOut} className="space-y-4">
              <div className="bg-white border border-[#E5EAF2] rounded-2xl p-5 shadow-xs space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#172033] uppercase mb-1.5">
                    Cash Out / Payout Amount (£) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="e.g. 25.00"
                    value={cashOutAmount}
                    onChange={(e) => setCashOutAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2] text-[#172033] font-mono text-lg font-bold focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] uppercase mb-1.5">
                    Expense / Payout Reason *
                  </label>
                  <select
                    value={cashOutReason}
                    onChange={(e) => setCashOutReason(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2] text-[#172033] text-xs font-semibold focus:outline-none focus:border-blue-600 shadow-xs cursor-pointer"
                  >
                    <option value="Supplier Cash Payment">Supplier Cash Payment</option>
                    <option value="Mid-Day Cash Safe Drop">Mid-Day Cash Safe Drop</option>
                    <option value="Store Supplies / Produce Emergency Purchase">Store Supplies / Produce Emergency Purchase</option>
                    <option value="Courier Delivery Driver Advance">Courier Delivery Driver Advance</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Record Cash Payout</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 5: AUDIT LOG */}
          {activeTab === 'logs' && (
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2 flex items-center justify-between">
                <span>Till Activity & Reconciliation History</span>
                <span>{storeTransactions.length} events logged</span>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {storeTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-xl bg-white border border-[#E5EAF2] flex items-center justify-between text-xs shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                          tx.type === 'Cash-In'
                            ? 'bg-blue-50 text-blue-600'
                            : tx.type === 'Cash-Out'
                            ? 'bg-amber-50 text-amber-600'
                            : tx.type === 'Sale-Cash'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-purple-50 text-purple-600'
                        }`}
                      >
                        {tx.type === 'Cash-In' ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : tx.type === 'Cash-Out' ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : tx.type === 'Sale-Cash' ? (
                          <Banknote className="w-4 h-4" />
                        ) : (
                          <RotateCcw className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-[#172033]">{tx.reason}</span>
                        <span className="text-[10px] text-[#64748B] font-mono">
                          {new Date(tx.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          • Operator: {tx.cashierName}
                        </span>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span
                        className={`font-bold ${
                          tx.type === 'Cash-Out' ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      >
                        {tx.type === 'Cash-Out' ? '-' : '+'}£{(tx.amount || 0).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-[#64748B] block">
                        Bal: £{(tx.balanceAfter || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-[#E5EAF2] flex justify-between items-center">
          <span className="text-xs text-[#64748B]">
            Till State: <strong className="text-emerald-600 font-bold">Synchronized Live</strong>
          </span>
          <button
            onClick={() => setIsCashDrawerModalOpen(false)}
            className="px-5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-[#E5EAF2] text-[#172033] font-bold text-xs transition-colors cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>

      {/* SUB-MODAL: CONFIRM RESET CASH DRAWER, GROSS SALES & AVG SALES */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white border border-[#E5EAF2] rounded-2xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#172033]">Reset Till, Gross Sales & Avg Sales</h3>
                <p className="text-xs text-[#64748B]">Store: {currentStore.businessName}</p>
              </div>
            </div>

            <form onSubmit={handleExecuteReset} className="space-y-4">
              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs leading-relaxed border border-rose-200">
                This will reset the cash drawer transactions, live balance, gross sales counter, and average sales counter for <strong>{currentStore.businessName}</strong> to £0.00.
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] uppercase mb-1">
                  New Opening Float Balance (£)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newOpeningFloatInput}
                    onChange={(e) => setNewOpeningFloatInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2] text-[#172033] font-mono text-base font-bold focus:outline-none focus:border-blue-600"
                    placeholder="0.00"
                  />
                  <button
                    type="button"
                    onClick={() => setNewOpeningFloatInput('0.00')}
                    className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer shrink-0"
                  >
                    £0
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewOpeningFloatInput('100.00')}
                    className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer shrink-0"
                  >
                    £100
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewOpeningFloatInput('200.00')}
                    className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer shrink-0"
                  >
                    £200
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2]">
                <input
                  type="checkbox"
                  id="chk-reset-orders"
                  checked={resetOrdersCheck}
                  onChange={(e) => setResetOrdersCheck(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <label htmlFor="chk-reset-orders" className="text-xs font-bold text-[#172033] cursor-pointer">
                  Reset gross sales & ticket orders for current shift
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] uppercase mb-1">
                  Reason / Audit Log Note
                </label>
                <input
                  type="text"
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2] text-xs text-[#172033] focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E5EAF2] hover:bg-slate-100 text-xs font-bold text-[#64748B] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer active:scale-95"
                >
                  Confirm Reset & Clear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

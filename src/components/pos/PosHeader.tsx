import React, { useState } from 'react';
import {
  Search,
  ReceiptText,
  UtensilsCrossed,
  ShoppingBag,
  Bell,
  Building2,
  Lock,
  ChevronDown,
  Store as StoreIcon,
  ShieldCheck,
  CircleDollarSign,
  Menu,
  LayoutGrid,
  Volume2,
  KeyRound,
  History,
} from 'lucide-react';
import { useNexus } from '../../context/NexusContext';
import { NexusLogo } from '../common/NexusLogo';
import { clearStoredDeviceToken } from '../../services/deviceAuthService';
import { StoreSwitchPinModal } from './StoreSwitchPinModal';
import { Store } from '../../types';
import { soundFX } from '../../utils/audioAlert';

export const PosHeader: React.FC = () => {
  const {
    currentStore,
    setCurrentStoreId,
    stores,
    accessibleStores,
    currentEmployee,
    currentUser,
    roles,
    activeAppView,
    setActiveAppView,
    launchPos,
    orders,
    notifications,
    unacceptedOrders,
    setIsSearchModalOpen,
    setIsCashDrawerModalOpen,
    setIsNotificationsOpen,
    setIsStaffLockModalOpen,
    setIsTableManagementModalOpen,
    cashDrawerState,
    activePosMode,
    orderHistory,
    isOrderHistoryModalOpen,
    setIsOrderHistoryModalOpen,
  } = useNexus();

  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [storePendingSwitch, setStorePendingSwitch] = useState<Store | null>(null);
  const [isSwitchPinModalOpen, setIsSwitchPinModalOpen] = useState(false);

  const isStaffUser = currentUser?.role === 'STAFF' || activePosMode === 'staff' || activeAppView === 'staff-pos';
  const isStoreUser = currentUser?.role === 'STORE';
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';
  const storesToDisplay = isStaffUser || isStoreUser ? accessibleStores : stores;

  const handleSelectStore = (st: Store) => {
    setIsStoreDropdownOpen(false);
    if (st.id === currentStore.id) return;

    // Super Admin or Staff routing can switch directly; Store POS user must enter that store's PIN
    if (isSuperAdmin || isStaffUser) {
      setCurrentStoreId(st.id);
    } else {
      setStorePendingSwitch(st);
      setIsSwitchPinModalOpen(true);
    }
  };

  const activeOrdersCount = (orders || []).filter(
    (o) => o.storeId === currentStore?.id && (o.orderStatus === 'Current' || o.orderStatus === 'On The Way')
  ).length;

  const unacceptedCount = (unacceptedOrders || []).length;
  const unreadNotificationsCount = (notifications || []).filter((n) => !n.read).length;
  const currentRole = (roles || []).find((r) => r.id === currentEmployee?.roleId);

  return (
    <header className="h-[70px] bg-white border-b border-[#E5EAF2] px-4 md:px-6 flex items-center justify-between z-30 sticky top-0 shadow-sm">
      {/* Left side: Brand Logo & Store Selector */}
      <div className="flex items-center gap-3 lg:gap-5">
        <button
          onClick={() => setActiveAppView('dashboard')}
          title="Open Company Management Dashboard"
          className="lg:hidden p-2 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-[#F8FAFC] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="cursor-pointer" onClick={() => setActiveAppView(isStaffUser ? 'staff-pos' : 'pos-menu')}>
          <NexusLogo size="md" showSubtitle={true} />
        </div>

        {/* POS Name Indicator Badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black shadow-2xs border ${
            isStaffUser
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isStaffUser ? 'bg-blue-600 animate-pulse' : 'bg-emerald-600 animate-pulse'
            }`}
          />
          <span className="tracking-wide uppercase">
            {isStaffUser ? 'Staff POS' : 'Store POS'}
          </span>
        </div>

        {/* Store Branch Selector Pill */}
        <div className="relative hidden md:block">
          <button
            onClick={() => !isStoreUser && setIsStoreDropdownOpen(!isStoreDropdownOpen)}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white border border-[#E5EAF2] text-left transition-all text-xs shadow-sm ${
              isStoreUser ? 'cursor-default' : 'hover:bg-[#F8FAFC] cursor-pointer'
            }`}
          >
            <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <StoreIcon className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-[#172033] truncate max-w-[150px] lg:max-w-[200px]">
                {isStaffUser ? `Routing Store: ${currentStore.businessName}` : currentStore.businessName}
              </span>
              <span className="text-[10px] text-[#64748B]">{currentStore.city || 'Branch'}, UK</span>
            </div>
            {!isStoreUser && <ChevronDown className="w-3.5 h-3.5 text-[#64748B] ml-1" />}
          </button>

          {isStoreDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsStoreDropdownOpen(false)}
              />
              <div className="absolute left-0 mt-2 w-72 rounded-xl bg-white border border-[#E5EAF2] shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#64748B] border-b border-[#E5EAF2]">
                  {isStaffUser ? `Assigned Branches (${storesToDisplay.length})` : 'Switch Active Branch'}
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1 mt-1">
                  {storesToDisplay.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => handleSelectStore(st)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                        st.id === currentStore.id
                          ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-100'
                          : 'hover:bg-[#F8FAFC] text-[#172033]'
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="font-semibold truncate">{st.businessName}</span>
                        <span className="text-[10px] text-[#64748B] truncate">{st.city || st.address || 'Branch'}</span>
                      </div>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                          st.id === currentStore.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-[#64748B]'
                        }`}
                      >
                        {st.id === currentStore.id ? 'Active' : isSuperAdmin || isStaffUser ? 'Switch' : '🔒 Unlock'}
                      </span>
                    </button>
                  ))}
                </div>
                {storesToDisplay.length > 1 && (
                  <div className="pt-2 mt-1 border-t border-[#E5EAF2]">
                    <button
                      onClick={() => {
                        setIsStoreDropdownOpen(false);
                        setActiveAppView('store-selection');
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Choose Branch Screen</span>
                      <span aria-hidden="true">&rarr;</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Center/Right: Main POS Nav Items */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* 1. Search */}
        <button
          onClick={() => setIsSearchModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[#64748B] hover:text-blue-600 hover:bg-[#EFF6FF] border border-[#E5EAF2] bg-white transition-all text-xs font-semibold cursor-pointer shadow-sm"
          title="Search items, orders, customers"
        >
          <Search className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline text-[#172033]">Search</span>
        </button>

        {/* 2. Cash Drawer */}
        <button
          onClick={() => setIsCashDrawerModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[#64748B] hover:text-blue-600 hover:bg-[#EFF6FF] border border-[#E5EAF2] bg-white transition-all text-xs font-semibold cursor-pointer shadow-sm"
          title="Cash Drawer Management"
        >
          <CircleDollarSign className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline text-[#172033]">Cash Drawer</span>
          <span className="hidden xl:inline px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-mono text-[10px] font-bold border border-blue-100">
            £{(cashDrawerState?.currentBalance ?? 0).toFixed(2)}
          </span>
        </button>

        {/* 3. Tables Management */}
        <button
          onClick={() => setIsTableManagementModalOpen(true)}
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg text-[#64748B] hover:text-blue-600 hover:bg-[#EFF6FF] border border-[#E5EAF2] bg-white transition-all text-xs font-semibold cursor-pointer shadow-sm"
          title="Live Dine-In Table Management"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-[#172033]">Tables</span>
        </button>

        {/* 4. Menu (Product Selection) */}
        <button
          onClick={() => setActiveAppView(isStaffUser ? 'staff-pos' : 'pos-menu')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all text-xs font-bold cursor-pointer ${
            activeAppView === 'pos-menu' || activeAppView === 'staff-pos'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-[#64748B] hover:text-blue-600 hover:bg-[#EFF6FF] border border-[#E5EAF2]'
          }`}
        >
          <UtensilsCrossed className="w-3.5 h-3.5" />
          <span>Menu</span>
        </button>

        {/* 5. Order (Order Management) */}
        <button
          onClick={() => setActiveAppView('pos-orders')}
          className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all text-xs font-bold cursor-pointer ${
            activeAppView === 'pos-orders'
              ? 'bg-blue-600 text-white shadow-sm'
              : unacceptedCount > 0
              ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse'
              : 'bg-white text-[#64748B] hover:text-blue-600 hover:bg-[#EFF6FF] border border-[#E5EAF2]'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Orders</span>
          {unacceptedCount > 0 ? (
            <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-full font-black text-[10px] bg-red-600 text-white animate-bounce">
              <Volume2 className="w-2.5 h-2.5" />
              {unacceptedCount}
            </span>
          ) : activeOrdersCount > 0 ? (
            <span className={`w-5 h-5 rounded-full font-black text-[10px] flex items-center justify-center ${
              activeAppView === 'pos-orders' ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
            }`}>
              {activeOrdersCount}
            </span>
          ) : null}
        </button>

        {/* Order History */}
        <button
          onClick={() => setIsOrderHistoryModalOpen(true)}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-lg transition-all text-xs font-bold cursor-pointer border ${
            isOrderHistoryModalOpen
              ? 'bg-blue-600 text-white shadow-sm border-blue-600'
              : 'bg-white text-[#64748B] hover:text-blue-600 hover:bg-[#EFF6FF] border-[#E5EAF2]'
          }`}
          title="Complete Permanent Order History across all POS"
        >
          <History className={`w-3.5 h-3.5 ${isOrderHistoryModalOpen ? 'text-white' : 'text-blue-600'}`} />
          <span className="hidden sm:inline">Order History</span>
          <span className={`px-1.5 py-0.2 rounded-full font-bold text-[10px] ${
            isOrderHistoryModalOpen ? 'bg-white text-blue-600' : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            {orderHistory?.length || 0}
          </span>
        </button>
        <button
          onClick={() => setIsNotificationsOpen(true)}
          className="relative p-2 rounded-lg text-[#64748B] hover:text-blue-600 hover:bg-[#EFF6FF] bg-white border border-[#E5EAF2] transition-all cursor-pointer shadow-sm"
          title="Live Store Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
          )}
        </button>

        {/* 6. Alert Sound Status & Test Button */}
        <button
          onClick={() => {
            if (unacceptedCount > 0) {
              soundFX.startContinuousNewOrderAlert(true);
            } else {
              soundFX.startContinuousNewOrderAlert(true);
              setTimeout(() => soundFX.stopContinuousNewOrderAlert(), 3200);
            }
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer shadow-xs ${
            unacceptedCount > 0
              ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 animate-pulse'
              : 'bg-white hover:bg-[#EFF6FF] text-[#64748B] hover:text-blue-600 border-[#E5EAF2]'
          }`}
          title={
            unacceptedCount > 0
              ? 'Beep sound actively alerting for unaccepted orders. Click to test/unmute.'
              : 'Test uploaded Beeping Sound Effect'
          }
        >
          <Volume2 className={`w-3.5 h-3.5 ${unacceptedCount > 0 ? 'text-white animate-bounce' : 'text-blue-600'}`} />
          <span className="hidden sm:inline">
            {unacceptedCount > 0 ? 'Beeping Active' : 'Sound Test'}
          </span>
        </button>

        <div className="h-5 w-px bg-[#E5EAF2] mx-1 hidden sm:block" />

        {/* Store Management Dashboard Direct Jump */}
        <button
          onClick={() => setActiveAppView('dashboard')}
          className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeAppView === 'dashboard'
              ? 'bg-blue-600 text-white'
              : 'bg-white hover:bg-[#EFF6FF] text-blue-600 border border-[#E5EAF2]'
          }`}
          title="Company Management & Store Administration"
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>

        {/* Current Cashier & Lock Switch */}
        <button
          onClick={() => setIsStaffLockModalOpen(true)}
          className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-lg bg-white hover:bg-[#F8FAFC] border border-[#E5EAF2] transition-all text-xs shadow-sm cursor-pointer"
          title="Switch Staff / PIN Lock Terminal"
        >
          <img
            src={(currentEmployee?.avatarUrl && currentEmployee.avatarUrl.trim() !== '') ? currentEmployee.avatarUrl : (currentEmployee?.avatar && currentEmployee.avatar.trim() !== '') ? currentEmployee.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt={currentEmployee?.name || 'Cashier'}
            className="w-6 h-6 rounded-md object-cover ring-1 ring-[#E5EAF2]"
          />
          <div className="hidden lg:flex flex-col text-left leading-tight">
            <span className="font-semibold text-[#172033] text-xs truncate max-w-[100px]">
              {currentEmployee?.name || 'Administrator'}
            </span>
            <span className="text-[9px] text-blue-600 font-semibold">{currentRole?.name || 'Cashier'}</span>
          </div>
          <Lock className="w-3 h-3 text-[#64748B] ml-1" />
        </button>

        {/* Master Device Lock Button */}
        <button
          onClick={() => {
            clearStoredDeviceToken();
            window.location.reload();
          }}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-all cursor-pointer shadow-xs"
          title="Lock Terminal & Show Master Authorization Screen"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
          <span className="hidden xl:inline">Master Lock</span>
        </button>
      </div>

      {/* Store Switch PIN Authorization Modal */}
      <StoreSwitchPinModal
        targetStore={storePendingSwitch}
        isOpen={isSwitchPinModalOpen}
        onClose={() => {
          setIsSwitchPinModalOpen(false);
          setStorePendingSwitch(null);
        }}
        onSuccess={(unlockedStore) => {
          setCurrentStoreId(unlockedStore.id);
          setIsSwitchPinModalOpen(false);
          setStorePendingSwitch(null);
        }}
      />
    </header>
  );
};

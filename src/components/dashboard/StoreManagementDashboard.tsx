import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Shield,
  History,
  LayoutDashboard,
  Plus,
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Store,
  Mail,
  Phone,
  MapPin,
  Globe,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  Sliders,
  DollarSign,
  TrendingUp,
  Activity,
  ShoppingBag,
  Sparkles,
  ArrowUpRight,
  ArrowLeft,
  Layers,
  Key,
  UtensilsCrossed,
  Tag,
  Printer,
  Settings,
  LogOut,
  SlidersHorizontal,
  ShieldCheck,
  Lock,
  Truck,
} from 'lucide-react';
import { useNexus } from '../../context/NexusContext';
import { NexusLogo } from '../common/NexusLogo';
import { clearStoredDeviceToken } from '../../services/deviceAuthService';
import { Store as StoreType, Employee, EmployeeRole, ActivityLog } from '../../types';
import { MenuManagementView } from './menu/MenuManagementView';
import { AddonsManagementView } from './menu/AddonsManagementView';
import { CustomersManagementView } from './customers/CustomersManagementView';
import { PromotionsManagementView } from './promotions/PromotionsManagementView';
import { StoreSettingsView } from './settings/StoreSettingsView';
import { TableManagementView } from './settings/TableManagementView';
import { PrinterDevicesView } from './settings/PrinterDevicesView';
import { DailyReportsAndLiveOrdersView } from './reports/DailyReportsAndLiveOrdersView';
import { StaffAccountsManagementView } from './settings/StaffAccountsManagementView';
import { AdminSecurityView } from './settings/AdminSecurityView';
import { StoreDeliverySettingsView } from './settings/StoreDeliverySettingsView';
import { hashPasswordSync } from '../../utils/security';

export type DashboardTab =
  | 'overview'
  | 'stores'
  | 'menu-management'
  | 'addons-management'
  | 'promotions'
  | 'customers'
  | 'store-settings'
  | 'delivery-settings'
  | 'table-management'
  | 'printer-devices'
  | 'roles'
  | 'employees'
  | 'staff-accounts'
  | 'admin-security'
  | 'activity';

export const StoreManagementDashboard: React.FC = () => {
  const {
    stores,
    currentStore,
    setCurrentStore,
    employees,
    currentEmployee,
    currentUser,
    logout,
    orders,
    activityLogs,
    addStore,
    updateStore,
    deleteStore,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    setActiveAppView,
    launchPos,
    categories,
    products,
    clearAllOrders,
    activePosMode,
    setActivePosMode,
  } = useNexus();

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  // Role-based POS button visibility
  const showStaffPos =
    currentUser?.role === 'SUPER_ADMIN' ||
    currentUser?.role === 'ADMIN' ||
    currentUser?.role === 'STAFF' ||
    !currentUser;

  const showStorePos =
    currentUser?.role === 'SUPER_ADMIN' ||
    currentUser?.role === 'ADMIN' ||
    currentUser?.role === 'STORE' ||
    !currentUser;

  const [isClearOrdersModalOpen, setIsClearOrdersModalOpen] = useState(false);
  const [isClearingOrders, setIsClearingOrders] = useState(false);

  const handleClearOrders = async () => {
    setIsClearingOrders(true);
    try {
      await clearAllOrders();
    } finally {
      setIsClearingOrders(false);
      setIsClearOrdersModalOpen(false);
    }
  };

  // Return directly to POS based on role without logout or store selection
  const handleBackToPos = () => {
    if (currentUser?.role === 'STAFF' || activePosMode === 'staff') {
      if (setActivePosMode) setActivePosMode('staff');
      setActiveAppView('staff-pos');
    } else {
      if (setActivePosMode) setActivePosMode('store');
      setActiveAppView('pos-menu');
    }
  };

  // Restrict Store POS and Staff POS from sensitive settings and passwords
  useEffect(() => {
    if (!isSuperAdmin) {
      const allowedTabs: DashboardTab[] = [
        'overview',
        'menu-management',
        'addons-management',
        'promotions',
        'customers',
        'delivery-settings',
        'table-management',
        'printer-devices',
      ];
      if (!allowedTabs.includes(activeTab)) {
        setActiveTab('overview');
      }
    }
  }, [isSuperAdmin, activeTab]);

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [storeStatusFilter, setStoreStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Add Store Modal state
  const [isAddStoreModalOpen, setIsAddStoreModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreType | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newStorePassword, setNewStorePassword] = useState('');
  const [confirmNewStorePassword, setConfirmNewStorePassword] = useState('');
  const [credentialsError, setCredentialsError] = useState<string | null>(null);
  const [storeFormData, setStoreFormData] = useState({
    businessName: '',
    legalEntityName: '',
    domain: '',
    email: '',
    phone: '',
    address: '',
    postcode: '',
    city: 'London',
    currency: 'GBP',
    vatNumber: 'GB 987 654 321',
    taxRatePercentage: 20,
    subscriptionPlan: 'Enterprise POS Pro' as 'Standard' | 'Premium POS' | 'Enterprise POS Pro',
    storeUsername: '',
    storePassword: '',
    confirmPassword: '',
    accountStatus: 'Active' as 'Active' | 'Disabled',
  });

  // Add Employee Modal state
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'employee' | 'store';
    id: string;
    name: string;
  } | null>(null);
  const [employeeFormData, setEmployeeFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Cashier' as EmployeeRole,
    storeId: currentStore.id,
    pinCode: '1234',
    hourlyRate: 13.5,
  });

  // Filtered Stores
  const filteredStores = stores.filter((s) => {
    if (storeStatusFilter !== 'All' && (storeStatusFilter === 'Active' ? !s.isActive : s.isActive)) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.businessName.toLowerCase().includes(q) ||
        s.domain.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.postcode.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalStorePages = Math.ceil(filteredStores.length / itemsPerPage) || 1;
  const paginatedStores = filteredStores.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Financial aggregates across all stores
  const totalNetworkRevenue = orders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalOrdersCount = orders.length;

  const handleOpenAddStore = () => {
    setEditingStore(null);
    setIsResettingPassword(false);
    setNewStorePassword('');
    setConfirmNewStorePassword('');
    setCredentialsError(null);
    setStoreFormData({
      businessName: '',
      legalEntityName: '',
      domain: '',
      email: '',
      phone: '',
      address: '',
      postcode: '',
      city: 'London',
      currency: 'GBP',
      vatNumber: 'GB ' + Math.floor(100000000 + Math.random() * 900000000),
      taxRatePercentage: 20,
      subscriptionPlan: 'Enterprise POS Pro',
      storeUsername: '',
      storePassword: '',
      confirmPassword: '',
      accountStatus: 'Active',
    });
    setIsAddStoreModalOpen(true);
  };

  const handleOpenEditStore = (store: StoreType) => {
    setEditingStore(store);
    setIsResettingPassword(false);
    setNewStorePassword('');
    setConfirmNewStorePassword('');
    setCredentialsError(null);
    setStoreFormData({
      businessName: store.businessName,
      legalEntityName: store.legalEntityName || store.businessName + ' Ltd',
      domain: store.domain || store.domainName || 'nexus-pos.co.uk',
      email: store.email,
      phone: store.phone || store.mobileNumber || '+44 20 7946 0991',
      address: store.address,
      postcode: store.postcode,
      city: store.city,
      currency: store.currency || store.currencySymbol || 'GBP',
      vatNumber: store.vatNumber || 'GB 987 654 321',
      taxRatePercentage: store.taxRatePercentage || (store.taxRate ? store.taxRate * 100 : 20),
      subscriptionPlan: store.subscriptionPlan || 'Enterprise POS Pro',
      storeUsername: store.storeUsername || store.email || '',
      storePassword: '',
      confirmPassword: '',
      accountStatus: store.accountStatus || (store.isActive === false ? 'Disabled' : 'Active'),
    });
    setIsAddStoreModalOpen(true);
  };

  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    setCredentialsError(null);

    if (!storeFormData.businessName || !storeFormData.email) {
      setCredentialsError('Please provide required business details.');
      return;
    }

    const cleanUsername = storeFormData.storeUsername.trim();
    if (!cleanUsername) {
      setCredentialsError('Store Login Username / Email is required.');
      return;
    }

    // Requirement 11: Prevent duplicate usernames/emails from being assigned to multiple stores
    const targetUsername = cleanUsername.toLowerCase();
    const isDuplicate = stores.some((s) => {
      if (editingStore && s.id === editingStore.id) return false;
      const sUser = (s.storeUsername || '').trim().toLowerCase();
      const sEmail = (s.email || '').trim().toLowerCase();
      return (sUser && sUser === targetUsername) || (sEmail && sEmail === targetUsername);
    });

    if (isDuplicate) {
      setCredentialsError(
        'This Login Username / Email is already assigned to another store. Please choose a unique username or email.'
      );
      return;
    }

    if (!editingStore) {
      // Creating NEW STORE
      if (!storeFormData.storePassword) {
        setCredentialsError('Store Login Password is required.');
        return;
      }
      if (storeFormData.storePassword.length < 4) {
        setCredentialsError('Store Login Password must be at least 4 characters.');
        return;
      }
      if (storeFormData.storePassword !== storeFormData.confirmPassword) {
        setCredentialsError('Store Login Password and Confirm Password do not match.');
        return;
      }

      const passwordHash = hashPasswordSync(storeFormData.storePassword);

      addStore({
        ...storeFormData,
        storeUsername: cleanUsername,
        storePassword: '••••••••',
        storePasswordHash: passwordHash,
        accountStatus: storeFormData.accountStatus,
        isActive: storeFormData.accountStatus === 'Active',
        activeStatus: storeFormData.accountStatus === 'Active' ? 'Active' : 'Inactive',
        logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80',
      });
    } else {
      // Editing EXISTING STORE
      const updates: Partial<StoreType> = {
        ...storeFormData,
        storeUsername: cleanUsername,
        accountStatus: storeFormData.accountStatus,
        isActive: storeFormData.accountStatus === 'Active',
        activeStatus: storeFormData.accountStatus === 'Active' ? 'Active' : 'Inactive',
        updatedAt: new Date().toISOString(),
      };

      if (isResettingPassword) {
        if (!newStorePassword) {
          setCredentialsError('Please enter a new password or click Cancel Reset.');
          return;
        }
        if (newStorePassword.length < 4) {
          setCredentialsError('New password must be at least 4 characters.');
          return;
        }
        if (newStorePassword !== confirmNewStorePassword) {
          setCredentialsError('New Password and Confirm Password do not match.');
          return;
        }
        updates.storePassword = '••••••••';
        updates.storePasswordHash = hashPasswordSync(newStorePassword);
      }

      updateStore(editingStore.id, updates);
    }
    setIsAddStoreModalOpen(false);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeFormData.name || !employeeFormData.email) {
      alert('Please fill employee name and email.');
      return;
    }

    addEmployee({
      name: employeeFormData.name,
      email: employeeFormData.email,
      phone: employeeFormData.phone,
      role: employeeFormData.role,
      storeId: employeeFormData.storeId,
      pinCode: employeeFormData.pinCode,
      hourlyRate: Number(employeeFormData.hourlyRate),
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isActive: true,
    });
    setIsAddEmployeeModalOpen(false);
  };

  const renderAccessRestrictedCard = (title: string, desc?: string) => (
    <div className="p-8 max-w-xl mx-auto bg-white rounded-2xl border border-[#E5EAF2] shadow-xs text-center my-12">
      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
        <Lock className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-[#172033]">{title}</h3>
      <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
        {desc || 'Basic store settings, passwords, and master admin security settings can only be viewed and changed by the Super Admin.'}
      </p>
      <div className="mt-4 pt-4 border-t border-[#E5EAF2] text-[11px] text-[#94A3B8]">
        Store POS and Staff POS terminals are restricted to operating menu, orders, table management, printer devices, add-ons, customer database, daily reports, and promotions.
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] text-[#172033] select-none">
      {/* 1. Left Sidebar Navigation (Vertically scrollable) */}
      <aside className="w-64 bg-white border-r border-[#E5EAF2] flex flex-col justify-between p-3.5 flex-shrink-0 h-full overflow-hidden shadow-xs">
        {/* Top Logo & Scrollable Navigation Menu */}
        <div className="flex-1 flex flex-col overflow-hidden space-y-4">
          {/* Branded Logo Header */}
          <div className="px-2 pt-1 flex items-center justify-between shrink-0">
            <NexusLogo />
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-[#172033]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] px-2">
              Restaurant & Store Management
            </div>

            {/* Nav links */}
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#172033] hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard className={`w-4 h-4 ${activeTab === 'overview' ? 'text-white' : 'text-blue-600'}`} />
                  <span>Daily Reports & Live Orders</span>
                </div>
                <span className={`flex items-center gap-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                  activeTab === 'overview'
                    ? 'bg-blue-700 text-blue-100'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'overview' ? 'bg-white' : 'bg-blue-600'} animate-pulse`} />
                  LIVE
                </span>
              </button>

              {/* Company & Stores (Super Admin Only) */}
              {isSuperAdmin && (
                <button
                  onClick={() => setActiveTab('stores')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'stores'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#172033] hover:bg-slate-50'
                  }`}
                >
                  <Building2 className={`w-4 h-4 ${activeTab === 'stores' ? 'text-white' : 'text-blue-600'}`} />
                  <span>Company & Stores ({stores.length})</span>
                </button>
              )}

              {/* 1. MENU MANAGEMENT */}
              <button
                onClick={() => setActiveTab('menu-management')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'menu-management'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#172033] hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <UtensilsCrossed className={`w-4 h-4 ${activeTab === 'menu-management' ? 'text-white' : 'text-blue-600'}`} />
                  <span>Menu Management</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  activeTab === 'menu-management'
                    ? 'bg-blue-700 text-white border-blue-500'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {products?.length || 0} items
                </span>
              </button>

              {/* 1.1 ADD-ONS MANAGEMENT */}
              <button
                onClick={() => setActiveTab('addons-management')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'addons-management'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#172033] hover:bg-slate-50'
                }`}
              >
                <Layers className={`w-4 h-4 ${activeTab === 'addons-management' ? 'text-white' : 'text-blue-600'}`} />
                <span>Add-ons & Options</span>
              </button>

              {/* 2. PROMOTIONS */}
              <button
                onClick={() => setActiveTab('promotions')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'promotions'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#172033] hover:bg-slate-50'
                }`}
              >
                <Tag className={`w-4 h-4 ${activeTab === 'promotions' ? 'text-white' : 'text-blue-600'}`} />
                <span>Promotions & Coupons</span>
              </button>

              {/* 2.1 CUSTOMERS DATABASE */}
              <button
                onClick={() => setActiveTab('customers')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'customers'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#172033] hover:bg-slate-50'
                }`}
              >
                <Users className={`w-4 h-4 ${activeTab === 'customers' ? 'text-white' : 'text-blue-600'}`} />
                <span>Customers Database</span>
              </button>

              {/* 3. EXPANDABLE SETTINGS (Store Settings, Table Management, Printer Devices) */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold text-[#64748B] hover:text-[#172033] hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-blue-600" />
                    <span>Settings</span>
                  </div>
                  {isSettingsOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-[#64748B]" />
                  )}
                </button>

                {/* Submenu in Exact Order: Store Settings (Super Admin Only) -> Table Management -> Printer Devices */}
                {isSettingsOpen && (
                  <div className="ml-4 pl-3 border-l border-[#E5EAF2] my-1 space-y-1">
                    {isSuperAdmin && (
                      <button
                        onClick={() => setActiveTab('store-settings')}
                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all text-left cursor-pointer ${
                          activeTab === 'store-settings'
                            ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                            : 'text-[#64748B] hover:text-[#172033] hover:bg-slate-50'
                        }`}
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                        <span>Store Settings</span>
                      </button>
                    )}

                    <button
                      onClick={() => setActiveTab('delivery-settings')}
                      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all text-left cursor-pointer ${
                        activeTab === 'delivery-settings'
                          ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                          : 'text-[#64748B] hover:text-[#172033] hover:bg-slate-50'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Delivery Settings</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('table-management')}
                      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all text-left cursor-pointer ${
                        activeTab === 'table-management'
                          ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                          : 'text-[#64748B] hover:text-[#172033] hover:bg-slate-50'
                      }`}
                    >
                      <UtensilsCrossed className="w-3.5 h-3.5 text-blue-600" />
                      <span>Table Management</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('printer-devices')}
                      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all text-left cursor-pointer ${
                        activeTab === 'printer-devices'
                          ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                          : 'text-[#64748B] hover:text-[#172033] hover:bg-slate-50'
                      }`}
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-600" />
                      <span>Printer Devices</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Super Admin Only: Team, Staff Accounts & Master Admin Security */}
              {isSuperAdmin && (
                <>
                  <div className="pt-2 text-[10px] font-bold uppercase tracking-wider text-[#64748B] px-2">
                    Team & Security (Super Admin)
                  </div>

                  {/* Staff Accounts Management */}
                  <button
                    onClick={() => setActiveTab('staff-accounts')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'staff-accounts'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-[#64748B] hover:text-[#172033] hover:bg-slate-50'
                    }`}
                  >
                    <Users className={`w-4 h-4 ${activeTab === 'staff-accounts' ? 'text-white' : 'text-blue-600'}`} />
                    <span>Phone / Staff Accounts</span>
                  </button>

                  {/* Master Admin Security */}
                  <button
                    onClick={() => setActiveTab('admin-security')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'admin-security'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-[#64748B] hover:text-[#172033] hover:bg-slate-50'
                    }`}
                  >
                    <Key className={`w-4 h-4 ${activeTab === 'admin-security' ? 'text-white' : 'text-blue-600'}`} />
                    <span>Master Admin & Security</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('roles')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'roles'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-[#64748B] hover:text-[#172033] hover:bg-slate-50'
                    }`}
                  >
                    <Shield className={`w-4 h-4 ${activeTab === 'roles' ? 'text-white' : 'text-blue-600'}`} />
                    <span>Role Permissions</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('employees')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'employees'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-[#64748B] hover:text-[#172033] hover:bg-slate-50'
                    }`}
                  >
                    <Users className={`w-4 h-4 ${activeTab === 'employees' ? 'text-white' : 'text-blue-600'}`} />
                    <span>Employees & Staff ({employees.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('activity')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'activity'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-[#64748B] hover:text-[#172033] hover:bg-slate-50'
                    }`}
                  >
                    <History className={`w-4 h-4 ${activeTab === 'activity' ? 'text-white' : 'text-blue-600'}`} />
                    <span>Audit & Activity Logs</span>
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>

        {/* Bottom Actions: Switch to POS & Sync indicator */}
        <div className="p-2 space-y-2 border-t border-[#E5EAF2] pt-3 shrink-0">
          {showStaffPos && (
            <button
              onClick={() => {
                if (setActivePosMode) setActivePosMode('staff');
                setActiveAppView('staff-pos');
              }}
              className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-blue-400" />
              <span>Staff POS</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}

          {showStorePos && (
            <button
              onClick={() => {
                if (setActivePosMode) setActivePosMode('store');
                setActiveAppView('pos-menu');
              }}
              className="w-full py-2.5 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Store POS</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center justify-between px-1 text-[11px] text-[#64748B]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>Database Synced</span>
            </div>
            <button
              onClick={() => logout ? logout() : setActiveAppView('login')}
              className="text-[11px] text-[#64748B] hover:text-red-600 font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Logout / Switch User"
            >
              <LogOut className="w-3 h-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 px-3 sm:px-6 bg-white border-b border-[#E5EAF2] flex items-center justify-between flex-shrink-0 shadow-xs gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            {/* “← Back to POS” Direct Return Button */}
            <button
              id="btn-back-to-pos"
              onClick={handleBackToPos}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-[#7091E6] hover:bg-[#5d7ecf] active:scale-[0.97] text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer shrink-0 min-h-[42px] touch-manipulation select-none border border-[#7091E6]"
              title={currentUser?.role === 'STAFF' || activePosMode === 'staff' ? 'Return directly to Staff POS' : 'Return directly to Store POS'}
              aria-label="← Back to POS"
            >
              <span className="font-bold text-sm sm:text-base leading-none select-none">←</span>
              <span className="whitespace-nowrap font-extrabold tracking-tight">Back to POS</span>
            </button>

            <div className="h-6 w-px bg-[#E5EAF2] shrink-0 hidden sm:block" />

            <h2 className="text-xs sm:text-base font-bold text-[#172033] truncate hidden sm:block">
              {activeTab === 'overview' && 'Live Restaurant Daily Performance & Current Orders'}
              {activeTab === 'stores' && 'Company & Store Management'}
              {activeTab === 'menu-management' && 'Single Source-of-Truth Menu Management'}
              {activeTab === 'promotions' && 'Promotions, Coupons & Offers'}
              {activeTab === 'store-settings' && 'Store Operations & Fulfillment Settings'}
              {activeTab === 'delivery-settings' && 'UK Foodhub-Style Delivery Address & Postcode Zones'}
              {activeTab === 'table-management' && 'Dine-In Table Floorplan & Seating'}
              {activeTab === 'printer-devices' && 'Hardware Thermal Printers & KOT Stations'}
              {activeTab === 'staff-accounts' && 'Phone Operators & Staff Terminal Accounts'}
              {activeTab === 'admin-security' && 'Master Admin Security & Profile Settings'}
              {activeTab === 'roles' && 'Role-Based Access Control (RBAC)'}
              {activeTab === 'employees' && 'Staff Directory & Access PINs'}
              {activeTab === 'activity' && 'Real-Time Operational Audit Log'}
            </h2>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border shrink-0 hidden md:inline-flex ${
              isSuperAdmin
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              {isSuperAdmin ? 'Super Admin' : currentUser?.role === 'STAFF' ? 'Staff Dashboard' : 'Store Dashboard'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Store Switcher (Locked for Store POS to its assigned branch) */}
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-[#64748B]" />
              <select
                value={currentStore.id}
                disabled={!isSuperAdmin && currentUser?.role === 'STORE'}
                onChange={(e) => {
                  const target = stores.find((s) => s.id === e.target.value);
                  if (target) setCurrentStore(target);
                }}
                className={`border border-[#E5EAF2] text-[#172033] text-xs rounded-lg px-3 py-1.5 font-bold focus:outline-none focus:border-blue-600 ${
                  !isSuperAdmin && currentUser?.role === 'STORE'
                    ? 'bg-slate-100 cursor-not-allowed text-slate-500'
                    : 'bg-[#F8FAFC]'
                }`}
                title={!isSuperAdmin && currentUser?.role === 'STORE' ? 'Store terminal locked to branch' : 'Switch store'}
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.businessName}
                  </option>
                ))}
              </select>
            </div>

            {/* Profile */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-[#E5EAF2]">
              <img
                src={
                  currentEmployee?.avatar && currentEmployee.avatar.trim() !== ''
                    ? currentEmployee.avatar
                    : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                }
                alt={currentEmployee?.name || 'Staff'}
                className="w-8 h-8 rounded-full ring-2 ring-blue-500/20 object-cover"
              />
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-[#172033]">{currentEmployee?.name || 'Administrator'}</span>
                <span className="text-[10px] text-blue-600 font-bold font-mono">
                  {currentEmployee?.role || 'Administrator'}
                </span>
              </div>
            </div>

            {/* Clear All Orders for Admin */}
            {isSuperAdmin && (
              <button
                onClick={() => setIsClearOrdersModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer shadow-xs"
                title="Clear all orders and reset sequence to 1"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Clear All Orders</span>
              </button>
            )}

            {/* Lock to Master Terminal Button */}
            <button
              onClick={() => {
                clearStoredDeviceToken();
                window.location.reload();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="Lock Terminal & Show Master Authorization Screen"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>Master Lock</span>
            </button>
          </div>
        </header>

        {/* Dynamic Body Content based on Tab */}
        <div className={`flex-1 overflow-y-auto ${activeTab === 'overview' ? 'p-0' : 'p-6'} bg-[#F8FAFC]`}>
          {/* TAB 1: OVERVIEW & LIVE DAILY REPORTS */}
          {activeTab === 'overview' && <DailyReportsAndLiveOrdersView />}

          {/* TAB 2: COMPANY & STORE MANAGEMENT (Sections 6 & 7 - Super Admin Only) */}
          {activeTab === 'stores' && (
            !isSuperAdmin ? (
              renderAccessRestrictedCard('Company & Store Management Restricted', 'Store management, adding branches, and store passwords can only be configured by the Super Admin.')
            ) : (
            <div className="space-y-4">
              {/* Table Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E5EAF2] shadow-xs">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative w-full">
                    <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by store name, domain, email, postcode..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#E5EAF2] text-[#172033] text-xs focus:outline-none focus:border-blue-600 focus:bg-white placeholder:text-[#64748B]"
                    />
                  </div>

                  <select
                    value={storeStatusFilter}
                    onChange={(e) => {
                      setStoreStatusFilter(e.target.value as any);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#E5EAF2] text-[#172033] text-xs font-bold focus:outline-none focus:border-blue-600"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active Only</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <button
                  onClick={handleOpenAddStore}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register New Store</span>
                </button>
              </div>

              {/* Stores Table */}
              <div className="rounded-xl border border-[#E5EAF2] bg-white overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#172033]">
                    <thead className="bg-[#F8FAFC] text-[#64748B] font-bold uppercase tracking-wider text-[10px] border-b border-[#E5EAF2]">
                      <tr>
                        <th className="px-4 py-3.5">Business Name & Brand</th>
                        <th className="px-4 py-3.5">Domain / Online URL</th>
                        <th className="px-4 py-3.5">Contact & Email</th>
                        <th className="px-4 py-3.5">Address & UK Postcode</th>
                        <th className="px-4 py-3.5">VAT / Tax</th>
                        <th className="px-4 py-3.5">Plan / Status</th>
                        <th className="px-4 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5EAF2]">
                      {paginatedStores.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-10 text-[#64748B]">
                            No stores match your search criteria.
                          </td>
                        </tr>
                      ) : (
                        paginatedStores.map((store) => (
                          <tr
                            key={store.id}
                            className="hover:bg-blue-50/40 transition-colors group"
                          >
                            {/* Business Name */}
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-black">
                                  {store.businessName.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-[#172033] text-xs">
                                    {store.businessName}
                                  </span>
                                  <span className="text-[10px] text-[#64748B] font-mono">
                                    {store.legalEntityName}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Domain */}
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-1 text-blue-600 font-mono text-[11px]">
                                <Globe className="w-3.5 h-3.5 text-[#64748B]" />
                                <span>{store.domain}</span>
                              </div>
                            </td>

                            {/* Contact */}
                            <td className="px-4 py-3.5">
                              <div className="flex flex-col">
                                <span className="text-[#172033] font-medium">{store.email}</span>
                                <span className="text-[10px] text-[#64748B] font-mono">
                                  {store.phone}
                                </span>
                              </div>
                            </td>

                            {/* Address */}
                            <td className="px-4 py-3.5">
                              <div className="flex flex-col">
                                <span className="text-[#172033] truncate max-w-[180px]">
                                  {store.address}
                                </span>
                                <span className="text-[10px] font-mono text-blue-700 font-bold">
                                  {store.postcode}, {store.city}
                                </span>
                              </div>
                            </td>

                            {/* VAT */}
                            <td className="px-4 py-3.5 font-mono text-[11px]">
                              <div className="text-[#172033] font-bold">{store.vatNumber}</div>
                              <span className="text-[10px] text-[#64748B]">
                                {store.taxRatePercentage}% Tax
                              </span>
                            </td>

                            {/* Plan / Status */}
                            <td className="px-4 py-3.5">
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200 inline-block w-fit">
                                  {store.subscriptionPlan}
                                </span>
                                <span
                                  className={`text-[9px] font-bold ${
                                    store.isActive ? 'text-blue-600' : 'text-[#64748B]'
                                  }`}
                                >
                                  {store.isActive ? '● Active' : '○ Inactive'}
                                </span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setCurrentStore(store);
                                    setActiveAppView('pos-menu');
                                  }}
                                  className="px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 font-bold text-[11px] transition-all cursor-pointer"
                                  title="Open POS register for this store"
                                >
                                  POS
                                </button>
                                <button
                                  onClick={() => {
                                    setCurrentStore(store);
                                    setActiveTab('delivery-settings');
                                  }}
                                  className="p-1.5 rounded-md bg-white hover:bg-blue-50 border border-[#E5EAF2] text-[#64748B] hover:text-blue-600 transition-colors cursor-pointer shadow-xs"
                                  title="Delivery Settings & Postcode Zones"
                                >
                                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                                </button>
                                <button
                                  onClick={() => handleOpenEditStore(store)}
                                  className="p-1.5 rounded-md bg-white hover:bg-slate-50 border border-[#E5EAF2] text-[#64748B] hover:text-[#172033] transition-colors cursor-pointer shadow-xs"
                                  title="Edit Store Configuration"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                                </button>
                                {stores.length > 1 && (
                                  <button
                                    onClick={() =>
                                      setDeleteTarget({
                                        type: 'store',
                                        id: store.id,
                                        name: store.businessName,
                                      })
                                    }
                                    className="p-1.5 rounded-md bg-white hover:bg-red-50 border border-[#E5EAF2] hover:border-red-200 text-[#64748B] hover:text-red-600 transition-colors cursor-pointer shadow-xs"
                                    title="Delete Store"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
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

                {/* Pagination */}
                <div className="p-4 bg-[#F8FAFC] border-t border-[#E5EAF2] flex items-center justify-between text-xs text-[#64748B]">
                  <div>
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                    {Math.min(currentPage * itemsPerPage, filteredStores.length)} of{' '}
                    {filteredStores.length} stores
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-md bg-white border border-[#E5EAF2] text-[#172033] hover:bg-slate-50 disabled:opacity-40 cursor-pointer shadow-xs"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-2 font-mono font-bold text-[#172033]">
                      {currentPage} / {totalStorePages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalStorePages, p + 1))}
                      disabled={currentPage === totalStorePages}
                      className="p-1.5 rounded-md bg-white border border-[#E5EAF2] text-[#172033] hover:bg-slate-50 disabled:opacity-40 cursor-pointer shadow-xs"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            )
          )}

          {/* TAB 3: ROLE PERMISSIONS (RBAC - Super Admin Only) */}
          {activeTab === 'roles' && (
            !isSuperAdmin ? (
              renderAccessRestrictedCard('Role Permissions Restricted', 'Role-based access control and system matrix can only be viewed and changed by the Super Admin.')
            ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white border border-[#E5EAF2] shadow-xs">
                <h3 className="font-bold text-sm text-[#172033]">Role-Based Access Control matrix</h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Nexus-Pos isolates managerial, financial, and operational features per employee privilege.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    role: 'Super Admin',
                    desc: 'Full enterprise control across all registered stores, subscriptions, employee wages, and database overrides.',
                    badge: 'bg-red-50 text-red-700 border-red-200',
                    permissions: [
                      'Manage Companies & Stores',
                      'Access Financial Audit Logs',
                      'Create / Delete Staff',
                      'Configure Menu & Pricing',
                      'Open Cash Drawer Freely',
                    ],
                  },
                  {
                    role: 'Store Manager',
                    desc: 'Location authority: cash drawer reconciliation, discounts, menu toggles, and live staff oversight.',
                    badge: 'bg-blue-50 text-blue-700 border-blue-200',
                    permissions: [
                      'Issue Refunds & Voids',
                      'Execute Cash In / Cash Out',
                      'Apply Custom Coupons',
                      'Access Store Daily Reports',
                      'View Location Audit Logs',
                    ],
                  },
                  {
                    role: 'Cashier',
                    desc: 'Fast front-of-house register: creating tickets, accepting cash/card, customer lookup, and printing receipts.',
                    badge: 'bg-blue-50 text-blue-700 border-blue-200',
                    permissions: [
                      'Create & Modify Cart',
                      'Execute Checkout & Take Payments',
                      'Lookup UK Addresses',
                      'Print Thermal Receipts',
                      'View Current Ticket Queue',
                    ],
                  },
                  {
                    role: 'Kitchen Staff',
                    desc: 'Back-of-house preparation display: advancing tickets from preparation to ready/dispatched.',
                    badge: 'bg-amber-50 text-amber-700 border-amber-200',
                    permissions: [
                      'View Preparation Queue',
                      'Advance Ticket to On The Way',
                      'Inspect Recipe Customizations',
                      'Filter Orders by Type',
                    ],
                  },
                  {
                    role: 'Delivery Driver',
                    desc: 'Mobile driver companion: viewing delivery addresses, route notes, and customer contact numbers.',
                    badge: 'bg-purple-50 text-purple-700 border-purple-200',
                    permissions: [
                      'View Delivery Addresses & Postcodes',
                      'Mark Order Completed',
                      'View Driver Notes & Buzzers',
                      'Call Customer Phone Directly',
                    ],
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-xl bg-white border border-[#E5EAF2] flex flex-col justify-between shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[#172033]">{item.role}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${item.badge}`}
                        >
                          Level {idx + 1}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] mt-2 leading-relaxed">{item.desc}</p>

                      <div className="mt-4 space-y-1.5 pt-3 border-t border-[#E5EAF2]">
                        <span className="text-[10px] font-bold uppercase text-[#64748B]">
                          Active Capabilities
                        </span>
                        {item.permissions.map((p, pi) => (
                          <div key={pi} className="flex items-center gap-2 text-xs text-[#172033]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                            <span>{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )
          )}

          {/* TAB 4: EMPLOYEES MANAGEMENT (Super Admin Only) */}
          {activeTab === 'employees' && (
            !isSuperAdmin ? (
              renderAccessRestrictedCard('Staff & Employees Directory Restricted', 'Employee profiles, PIN codes, and wage settings can only be viewed and changed by the Super Admin.')
            ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-[#E5EAF2] shadow-xs">
                <div>
                  <h3 className="font-bold text-sm text-[#172033]">Staff Directory & PIN Security</h3>
                  <p className="text-xs text-[#64748B]">
                    Manage cashiers, managers, and drivers across your store network.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddEmployeeModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Employee</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employees.map((emp) => {
                  const empStore = stores.find((s) => s.id === emp.storeId);
                  return (
                    <div
                      key={emp.id}
                      className="p-5 rounded-xl bg-white border border-[#E5EAF2] flex flex-col justify-between group shadow-xs"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                emp.avatar && emp.avatar.trim() !== ''
                                  ? emp.avatar
                                  : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                              }
                              alt={emp.name}
                              className="w-12 h-12 rounded-xl object-cover ring-2 ring-[#E5EAF2]"
                            />
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-[#172033]">{emp.name}</span>
                              <span className="text-[11px] text-blue-600 font-bold">{emp.role}</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F8FAFC] text-[#64748B] border border-[#E5EAF2] font-bold">
                            PIN: ••••
                          </span>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#E5EAF2] space-y-1.5 text-xs text-[#172033]">
                          <div className="flex justify-between">
                            <span className="text-[#64748B]">Email:</span>
                            <span className="text-[#172033] font-medium">{emp.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#64748B]">Phone:</span>
                            <span className="font-mono text-[#172033]">{emp.phone}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#64748B]">Assigned Branch:</span>
                            <span className="text-blue-700 font-bold truncate max-w-[150px]">
                              {empStore?.businessName || 'All Stores'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#64748B]">Hourly Rate:</span>
                            <span className="font-mono font-bold text-blue-600">
                              £{(emp.hourlyRate ?? 12.50).toFixed(2)}/hr
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#E5EAF2] flex items-center justify-between">
                        <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          Ready for Shift
                        </span>
                        {employees.length > 1 && (
                          <button
                            onClick={() =>
                              setDeleteTarget({
                                type: 'employee',
                                id: emp.id,
                                name: emp.name,
                              })
                            }
                            className="text-xs px-2.5 py-1 rounded-md bg-white hover:bg-red-50 border border-[#E5EAF2] hover:border-red-200 text-[#64748B] hover:text-red-600 font-semibold transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            )
          )}

          {/* TAB 5: AUDIT & ACTIVITY LOGS (Section 8 - Super Admin Only) */}
          {activeTab === 'activity' && (
            !isSuperAdmin ? (
              renderAccessRestrictedCard('Audit & Activity Logs Restricted', 'Audit trail, drawer kicks, voids, and cashier switch records can only be viewed by the Super Admin.')
            ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white border border-[#E5EAF2] flex items-center justify-between shadow-xs">
                <div>
                  <h3 className="font-bold text-sm text-[#172033]">System Audit & Shift Activity Log</h3>
                  <p className="text-xs text-[#64748B]">
                    Live chronological record of all transactions, drawer kicks, voids, and logins.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                  {activityLogs.length} Events Logged
                </span>
              </div>

              <div className="rounded-xl border border-[#E5EAF2] bg-white overflow-hidden shadow-xs">
                <div className="divide-y divide-[#E5EAF2]">
                  {activityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 hover:bg-slate-50 transition-colors flex items-start justify-between gap-4 text-xs"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            log.action === 'CREATE_ORDER'
                              ? 'bg-blue-50 text-blue-600 border border-blue-200'
                              : log.action === 'CASH_DRAWER_KICK'
                              ? 'bg-blue-50 text-blue-600 border border-blue-200'
                              : log.action === 'CANCEL_ORDER'
                              ? 'bg-red-50 text-red-600 border border-red-200'
                              : 'bg-purple-50 text-purple-600 border border-purple-200'
                          }`}
                        >
                          <Activity className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#172033]">{log.details}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F8FAFC] text-[#64748B] border border-[#E5EAF2] font-mono">
                              {log.action}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#64748B] mt-1 flex items-center gap-2">
                            <span>By: <b className="text-[#172033]">{log.performedBy}</b></span>
                            <span>•</span>
                            <span>Store: <b className="text-blue-700">{log.storeName}</b></span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono text-[11px] text-[#64748B] flex-shrink-0">
                        {new Date(log.timestamp).toLocaleDateString()}{' '}
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            )
          )}

          {/* TAB: MENU MANAGEMENT (Single Source of Truth) */}
          {activeTab === 'menu-management' && <MenuManagementView />}

          {/* TAB: ADD-ONS & OPTIONS */}
          {activeTab === 'addons-management' && <AddonsManagementView />}

          {/* TAB: PROMOTIONS & COUPONS */}
          {activeTab === 'promotions' && <PromotionsManagementView />}

          {/* TAB: CUSTOMERS DATABASE */}
          {activeTab === 'customers' && <CustomersManagementView />}

          {/* TAB: STORE SETTINGS (Super Admin Only) */}
          {activeTab === 'store-settings' && (
            isSuperAdmin ? (
              <StoreSettingsView />
            ) : (
              renderAccessRestrictedCard(
                'Store Settings Restricted',
                'Basic store settings, fulfillment rules, and store passwords can only be configured by the Super Admin.'
              )
            )
          )}

          {/* TAB: DELIVERY SETTINGS (Super Admin & Store Managers) */}
          {activeTab === 'delivery-settings' && <StoreDeliverySettingsView />}

          {/* TAB: TABLE MANAGEMENT */}
          {activeTab === 'table-management' && <TableManagementView />}

          {/* TAB: PRINTER DEVICES */}
          {activeTab === 'printer-devices' && <PrinterDevicesView />}

          {/* TAB: STAFF / PHONE ACCOUNTS (Super Admin Only) */}
          {activeTab === 'staff-accounts' && (
            isSuperAdmin ? (
              <StaffAccountsManagementView />
            ) : (
              renderAccessRestrictedCard(
                'Staff & Terminal Accounts Restricted',
                'Terminal logins, driver accounts, and staff passwords can only be managed by the Super Admin.'
              )
            )
          )}

          {/* TAB: MASTER ADMIN SECURITY (Super Admin Only) */}
          {activeTab === 'admin-security' && (
            isSuperAdmin ? (
              <AdminSecurityView />
            ) : (
              renderAccessRestrictedCard(
                'Master Admin Security Restricted',
                'Master admin security settings, passwords, and system privileges can only be viewed and changed by the Super Admin.'
              )
            )
          )}
        </div>
      </main>

      {/* 3. ADD / EDIT STORE MODAL (Section 7) */}
      {isAddStoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white border border-[#E5EAF2] rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-white border-b border-[#E5EAF2] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-200">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#172033]">
                  {editingStore ? 'Edit Store Profile' : 'Register New Restaurant / Store'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddStoreModalOpen(false)}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStore} className="p-6 overflow-y-auto flex-1 space-y-4 bg-[#F8FAFC]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#172033] uppercase mb-1">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nexus Pizza Soho"
                    value={storeFormData.businessName}
                    onChange={(e) =>
                      setStoreFormData({ ...storeFormData, businessName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] text-xs focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] uppercase mb-1">
                    Legal Entity Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Nexus Hospitality Ltd"
                    value={storeFormData.legalEntityName}
                    onChange={(e) =>
                      setStoreFormData({ ...storeFormData, legalEntityName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] text-xs focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#172033] uppercase mb-1">
                    Store Domain / Subdomain *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="soho.nexus-pos.co.uk"
                    value={storeFormData.domain}
                    onChange={(e) =>
                      setStoreFormData({ ...storeFormData, domain: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] text-xs focus:outline-none focus:border-blue-600 font-mono shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] uppercase mb-1">
                    Store Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="orders@nexus-pos.co.uk"
                    value={storeFormData.email}
                    onChange={(e) =>
                      setStoreFormData({ ...storeFormData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] text-xs focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-[#172033] uppercase mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="124 Wardour Street"
                    value={storeFormData.address}
                    onChange={(e) =>
                      setStoreFormData({ ...storeFormData, address: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] text-xs focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] uppercase mb-1">
                    UK Postcode *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="W1F 0TY"
                    value={storeFormData.postcode}
                    onChange={(e) =>
                      setStoreFormData({ ...storeFormData, postcode: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] text-xs focus:outline-none focus:border-blue-600 uppercase font-mono shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#172033] uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+44 20 7946 0991"
                    value={storeFormData.phone}
                    onChange={(e) =>
                      setStoreFormData({ ...storeFormData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] text-xs focus:outline-none focus:border-blue-600 font-mono shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] uppercase mb-1">
                    VAT Registration
                  </label>
                  <input
                    type="text"
                    placeholder="GB 987 654 321"
                    value={storeFormData.vatNumber}
                    onChange={(e) =>
                      setStoreFormData({ ...storeFormData, vatNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] text-xs focus:outline-none focus:border-blue-600 font-mono shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] uppercase mb-1">
                    Subscription Plan
                  </label>
                  <select
                    value={storeFormData.subscriptionPlan}
                    onChange={(e) =>
                      setStoreFormData({
                        ...storeFormData,
                        subscriptionPlan: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] text-xs font-semibold focus:outline-none focus:border-blue-600 shadow-xs"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Premium POS">Premium POS</option>
                    <option value="Enterprise POS Pro">Enterprise POS Pro</option>
                  </select>
                </div>
              </div>

              {/* STORE LOGIN CREDENTIALS SECTION */}
              <div className="pt-4 border-t border-[#E5EAF2] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-200">
                      <Key className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                        STORE LOGIN CREDENTIALS
                      </h4>
                      <p className="text-[11px] text-[#64748B]">
                        {editingStore
                          ? 'Manage Store POS login credentials and account activation status'
                          : 'Configure credentials specifically for this store to access Store POS'}
                      </p>
                    </div>
                  </div>
                  {editingStore && (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        storeFormData.accountStatus === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {storeFormData.accountStatus === 'Active' ? 'Active' : 'Disabled'}
                    </span>
                  )}
                </div>

                {credentialsError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in duration-150">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span className="font-semibold">{credentialsError}</span>
                  </div>
                )}

                {!editingStore ? (
                  /* Creating NEW STORE */
                  <div className="space-y-3 bg-white p-3.5 rounded-xl border border-[#E5EAF2] shadow-2xs">
                    <div>
                      <label className="block text-xs font-bold text-[#172033] uppercase mb-1">
                        Login Username / Email *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. branch.soho@nexus-pos.com"
                        value={storeFormData.storeUsername}
                        onChange={(e) => {
                          setCredentialsError(null);
                          setStoreFormData({ ...storeFormData, storeUsername: e.target.value });
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#E5EAF2] text-[#172033] text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-600 shadow-xs"
                      />
                      <span className="text-[10px] text-[#64748B] mt-0.5 block">
                        Unique username or email used exclusively for this branch to sign in to Store POS.
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#172033] uppercase mb-1">
                          Password *
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={storeFormData.storePassword}
                          onChange={(e) => {
                            setCredentialsError(null);
                            setStoreFormData({ ...storeFormData, storePassword: e.target.value });
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#E5EAF2] text-[#172033] text-xs focus:bg-white focus:outline-none focus:border-blue-600 shadow-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#172033] uppercase mb-1">
                          Confirm Password *
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={storeFormData.confirmPassword}
                          onChange={(e) => {
                            setCredentialsError(null);
                            setStoreFormData({ ...storeFormData, confirmPassword: e.target.value });
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#E5EAF2] text-[#172033] text-xs focus:bg-white focus:outline-none focus:border-blue-600 shadow-xs"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Editing EXISTING STORE */
                  <div className="space-y-3 bg-white p-3.5 rounded-xl border border-[#E5EAF2] shadow-2xs">
                    <div>
                      <label className="block text-xs font-bold text-[#172033] uppercase mb-1">
                        Login Username / Email
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. branch.soho@nexus-pos.com"
                        value={storeFormData.storeUsername}
                        onChange={(e) => {
                          setCredentialsError(null);
                          setStoreFormData({ ...storeFormData, storeUsername: e.target.value });
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#E5EAF2] text-[#172033] text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-600 shadow-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#172033] uppercase mb-1">
                          Password
                        </label>
                        {!isResettingPassword ? (
                          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-[#E5EAF2]">
                            <span className="font-mono text-xs tracking-widest text-[#64748B]">••••••••</span>
                            <button
                              type="button"
                              onClick={() => {
                                setIsResettingPassword(true);
                                setNewStorePassword('');
                                setConfirmNewStorePassword('');
                                setCredentialsError(null);
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-[#E5EAF2] rounded text-[11px] font-bold text-blue-600 shadow-2xs cursor-pointer transition-colors"
                            >
                              Reset Password
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2 p-2.5 rounded-lg bg-blue-50/50 border border-blue-200">
                            <div>
                              <label className="block text-[10px] font-bold text-blue-900 uppercase mb-0.5">
                                New Password *
                              </label>
                              <input
                                type="password"
                                placeholder="Enter new password"
                                value={newStorePassword}
                                onChange={(e) => {
                                  setCredentialsError(null);
                                  setNewStorePassword(e.target.value);
                                }}
                                className="w-full px-2.5 py-1.5 rounded bg-white border border-blue-200 text-xs focus:outline-none focus:border-blue-600"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-blue-900 uppercase mb-0.5">
                                Confirm New Password *
                              </label>
                              <input
                                type="password"
                                placeholder="Confirm new password"
                                value={confirmNewStorePassword}
                                onChange={(e) => {
                                  setCredentialsError(null);
                                  setConfirmNewStorePassword(e.target.value);
                                }}
                                className="w-full px-2.5 py-1.5 rounded bg-white border border-blue-200 text-xs focus:outline-none focus:border-blue-600"
                              />
                            </div>
                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsResettingPassword(false);
                                  setNewStorePassword('');
                                  setConfirmNewStorePassword('');
                                  setCredentialsError(null);
                                }}
                                className="text-[11px] font-semibold text-[#64748B] hover:text-[#172033] cursor-pointer"
                              >
                                Cancel Reset
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#172033] uppercase mb-1">
                          Account Status
                        </label>
                        <select
                          value={storeFormData.accountStatus}
                          onChange={(e) =>
                            setStoreFormData({
                              ...storeFormData,
                              accountStatus: e.target.value as 'Active' | 'Disabled',
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-[#E5EAF2] text-[#172033] text-xs font-bold focus:bg-white focus:outline-none focus:border-blue-600 shadow-xs cursor-pointer"
                        >
                          <option value="Active">Active</option>
                          <option value="Disabled">Disabled</option>
                        </select>
                        <span className="text-[10px] text-[#64748B] mt-1 block">
                          If disabled, Store POS sign-in is rejected.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#E5EAF2] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStoreModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 border border-[#E5EAF2] text-[#172033] font-bold text-xs cursor-pointer shadow-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  {editingStore ? 'Save Changes' : 'Create Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. ADD EMPLOYEE MODAL */}
      {isAddEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-[#E5EAF2] rounded-xl shadow-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-white border-b border-[#E5EAF2] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-200">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#172033]">Add Staff Member</h3>
              </div>
              <button
                onClick={() => setIsAddEmployeeModalOpen(false)}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="p-6 space-y-3.5 bg-[#F8FAFC]">
              <div>
                <label className="block text-xs font-bold text-[#172033] uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={employeeFormData.name}
                  onChange={(e) =>
                    setEmployeeFormData({ ...employeeFormData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] text-xs focus:outline-none focus:border-blue-600 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#172033] uppercase mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="sarah@nexus-pos.co.uk"
                    value={employeeFormData.email}
                    onChange={(e) =>
                      setEmployeeFormData({ ...employeeFormData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] text-xs focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] uppercase mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="07700 900888"
                    value={employeeFormData.phone}
                    onChange={(e) =>
                      setEmployeeFormData({ ...employeeFormData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] text-xs focus:outline-none focus:border-blue-600 font-mono shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#172033] uppercase mb-1">
                    Role Privilege *
                  </label>
                  <select
                    value={employeeFormData.role}
                    onChange={(e) =>
                      setEmployeeFormData({
                        ...employeeFormData,
                        role: e.target.value as EmployeeRole,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] text-xs font-semibold focus:outline-none focus:border-blue-600 shadow-xs"
                  >
                    <option value="Cashier">Cashier</option>
                    <option value="Store Manager">Store Manager</option>
                    <option value="Super Admin">Super Admin</option>
                    <option value="Kitchen Staff">Kitchen Staff</option>
                    <option value="Delivery Driver">Delivery Driver</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] uppercase mb-1">
                    Assigned Store
                  </label>
                  <select
                    value={employeeFormData.storeId}
                    onChange={(e) =>
                      setEmployeeFormData({
                        ...employeeFormData,
                        storeId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] text-xs font-semibold focus:outline-none focus:border-blue-600 shadow-xs"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.businessName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#172033] uppercase mb-1">
                    PIN Code (4-Digits) *
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="1234"
                    value={employeeFormData.pinCode}
                    onChange={(e) =>
                      setEmployeeFormData({ ...employeeFormData, pinCode: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] text-xs focus:outline-none focus:border-blue-600 font-mono tracking-widest text-center font-bold shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] uppercase mb-1">
                    Hourly Wage (£)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    placeholder="13.50"
                    value={employeeFormData.hourlyRate}
                    onChange={(e) =>
                      setEmployeeFormData({
                        ...employeeFormData,
                        hourlyRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] text-xs focus:outline-none focus:border-blue-600 font-mono shadow-xs"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5EAF2] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddEmployeeModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 border border-[#E5EAF2] text-[#172033] text-xs font-bold cursor-pointer shadow-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-[#E5EAF2] rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-200">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#172033]">
                  Confirm {deleteTarget.type === 'employee' ? 'Employee Deactivation' : 'Store Deletion'}
                </h3>
                <p className="text-xs text-[#64748B]">This action will take effect immediately</p>
              </div>
            </div>

            <p className="text-xs text-[#172033] bg-[#F8FAFC] p-3.5 rounded-lg border border-[#E5EAF2] leading-relaxed">
              Are you sure you want to remove{' '}
              <strong className="text-[#172033] font-bold">{deleteTarget.name}</strong> from the system?
              {deleteTarget.type === 'store' && (
                <span className="block mt-1 text-red-600 text-[11px]">
                  All associated store terminal settings will be unlinked.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 border border-[#E5EAF2] text-[#172033] text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteTarget.type === 'employee') {
                    deleteEmployee(deleteTarget.id);
                  } else {
                    deleteStore(deleteTarget.id);
                  }
                  setDeleteTarget(null);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Clear All Orders Confirmation Modal */}
      {isClearOrdersModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-orders-admin-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 id="clear-orders-admin-modal-title" className="font-black text-lg text-slate-900">
                  Clear All Orders & Reset Sequence
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to clear all orders? This will immediately remove all {orders.length} orders from the order list and reset the order numbering back to <strong>1</strong>.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Sequential Order Numbering:</span>
              </div>
              <p className="text-[11px] text-amber-800">
                After clearing, the next order placed in Admin POS or Store/Staff POS will automatically receive <strong>Order #1</strong>, then <strong>Order #2</strong>, <strong>Order #3</strong>, etc.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsClearOrdersModalOpen(false)}
                disabled={isClearingOrders}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleClearOrders}
                disabled={isClearingOrders}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isClearingOrders ? 'Clearing...' : 'Yes, Clear All & Reset to #1'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

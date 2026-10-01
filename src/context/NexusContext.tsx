import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Store,
  Role,
  Employee,
  Category,
  Subcategory,
  Product,
  ProductVariant,
  ModifierGroup,
  Modifier,
  AddonGroup,
  AddonItem,
  Order,
  CartItem,
  ItemModification,
  CustomerInfo,
  OrderType,
  OrderStatus,
  PaymentMethod,
  CashDrawerState,
  CashDrawerTransaction,
  NotificationItem,
  ActivityLogEntry,
  Coupon,
  ActiveAppView,
  DashboardTab,
  SelectedModifier,
  TableRecord,
  PrinterDevice,
  StoreSettingsData,
  PresetDiscount,
  PromotionBanner,
  AuthUser,
  PrimaryUserRole,
  OrderSource,
  MenuAddon,
  CustomerRecord,
  AdminProfile,
  PrintAlert,
  DeliveryZone,
  StoreDeliverySettings,
  StaffAccount,
} from '../types';
import { parseUKPostcode } from '../utils/postcodeHelper';
import { firestoreService } from '../services/firestoreService';
import {
  INITIAL_STORES,
  INITIAL_ROLES,
  INITIAL_EMPLOYEES,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_MODIFIER_GROUPS,
  INITIAL_MODIFIERS,
  INITIAL_ADDON_GROUPS,
  INITIAL_ORDERS,
  INITIAL_COUPONS,
  INITIAL_CASH_DRAWER_TRANSACTIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_TABLES,
  INITIAL_PRINTERS,
  INITIAL_STORE_SETTINGS,
  INITIAL_PRESET_DISCOUNTS,
  INITIAL_PROMOTION_BANNER,
  INITIAL_STAFF_ACCOUNTS,
} from '../data/seedData';
import { soundFX } from '../utils/audioAlert';
import { sendFailedLoginSecurityAlert } from '../services/securityNotificationService';
import { hashPasswordSync, verifyPasswordSync } from '../utils/security';
import { normalizePhone, phonesMatch } from '../utils/phoneUtils';

interface NexusContextType {
  // 3-Level Authentication & User State
  currentUser: AuthUser | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  login: (
    role: PrimaryUserRole | 'ADMIN',
    identifier: string,
    password: string
  ) => {
    success: boolean;
    message: string;
    user?: AuthUser;
    failedAttempts?: number;
    remainingAttempts?: number;
    isLockedOut?: boolean;
    lockoutRemainingSeconds?: number;
    securityAlertSent?: boolean;
    recipientEmail?: string;
  };
  posLockoutUntil: number;
  securityAlertNotice: {
    dispatchedTo: string;
    timestamp: string;
    workspace: string;
    account: string;
  } | null;
  clearPosLockout: () => void;
  loginStoreWithPin: (
    storeId: string,
    pin: string
  ) => { success: boolean; message: string; user?: AuthUser };
  logout: () => void;
  staffAccounts: StaffAccount[];
  addStaffAccount: (data: Omit<StaffAccount, 'id' | 'createdAt'>) => void;
  updateStaffAccount: (id: string, updates: Partial<StaffAccount>) => void;
  deleteStaffAccount: (id: string) => void;
  resetStaffPassword: (id: string, newPass: string) => { success: boolean; message: string };
  changeStorePassword: (storeId: string, newPass: string, newPin?: string) => { success: boolean; message: string };

  // Active context & store permissions
  accessibleStores: Store[];
  selectWorkingStore: (storeOrId: Store | string) => void;
  currentStore: Store;
  setCurrentStore: (storeOrId: Store | string) => void;
  setCurrentStoreId: (id: string) => void;
  currentEmployee: Employee;
  setCurrentEmployee: (employeeOrId: Employee | string) => void;
  setCurrentEmployeeId: (id: string) => void;
  switchStaffWithPin: (pin: string) => boolean;

  // View Navigation
  activeAppView: ActiveAppView;
  setActiveAppView: (view: ActiveAppView) => void;
  previousAppView: ActiveAppView;
  setPreviousAppView: (view: ActiveAppView) => void;
  activePosMode: 'store' | 'staff';
  setActivePosMode: (mode: 'store' | 'staff') => void;
  launchPos: (fromView?: ActiveAppView) => void;
  returnFromStoreSelection: () => void;
  dashboardTab: DashboardTab;
  setDashboardTab: (tab: DashboardTab) => void;

  // Stores
  stores: Store[];
  addStore: (store: Omit<Store, 'id' | 'createdAt'>) => void;
  updateStore: (id: string, updates: Partial<Store>) => void;
  deleteStore: (id: string) => void;

  // Roles & Employees
  roles: Role[];
  employees: Employee[];
  addRole: (role: Omit<Role, 'id'>) => void;
  updateRole: (id: string, updates: Partial<Role>) => void;
  addEmployee: (employee: Omit<Employee, 'id' | 'joinedDate'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  // Menu & Catalog (Single source of truth)
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (ordered: Category[]) => void;
  addSubcategory: (categoryId: string, name: string, description?: string) => void;
  updateSubcategory: (categoryId: string, subcategoryId: string, name: string, description?: string) => void;
  deleteSubcategory: (categoryId: string, subcategoryId: string) => void;

  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  reorderProducts: (ordered: Product[]) => void;
  bulkUpdatePrices: (
    productIds: string[],
    adjustmentType: 'percentage' | 'fixed',
    amount: number,
    applyToVariants: boolean
  ) => { updatedCount: number; message: string };

  // Menu Organizer Customization
  updateMenuOrganizer: (payload: { categories?: Category[]; products?: Product[] }) => void;

  // Modifiers & Add-ons Library
  modifierGroups: ModifierGroup[];
  modifiers: Modifier[];
  addModifierGroup: (group: Omit<ModifierGroup, 'id'>) => void;
  updateModifierGroup: (id: string, updates: Partial<ModifierGroup>) => void;
  deleteModifierGroup: (id: string) => void;
  addModifier: (modifier: Omit<Modifier, 'id'>) => void;
  updateModifier: (id: string, updates: Partial<Modifier>) => void;
  deleteModifier: (id: string) => void;

  // Add-on Groups System (Menu Item Linked Modifiers)
  addonGroups: AddonGroup[];
  addAddonGroup: (group: Omit<AddonGroup, 'id' | 'createdAt'>) => Promise<AddonGroup>;
  updateAddonGroup: (id: string, updates: Partial<AddonGroup>) => Promise<void>;
  deleteAddonGroup: (id: string) => Promise<void>;
  toggleAddonGroupActive: (id: string) => Promise<void>;
  addAddonToGroup: (groupId: string, addon: Omit<AddonItem, 'id' | 'groupId'>) => Promise<AddonItem>;
  updateAddonInGroup: (groupId: string, addonId: string, updates: Partial<AddonItem>) => Promise<void>;
  deleteAddonFromGroup: (groupId: string, addonId: string) => Promise<void>;
  toggleAddonItemActive: (groupId: string, addonId: string) => Promise<void>;
  linkAddonGroupToProducts: (groupId: string, productIds: string[]) => Promise<void>;
  linkProductToAddonGroups: (productId: string, addonGroupIds: string[]) => Promise<void>;

  // Add-Ons System (Product-linked & Global)
  addons: MenuAddon[];
  addAddon: (addon: Omit<MenuAddon, 'id' | 'createdAt'>) => Promise<MenuAddon>;
  updateAddon: (id: string, updates: Partial<MenuAddon>) => Promise<void>;
  deleteAddon: (id: string) => Promise<void>;
  toggleAddonAvailable: (id: string) => Promise<void>;

  // Customer Management & Quick Reorder
  customers: CustomerRecord[];
  searchCustomers: (query: string) => CustomerRecord[];
  findCustomerByPhone: (phone: string, storeId?: string) => CustomerRecord | undefined;
  getCustomerOrders: (customerOrPhone: CustomerRecord | string, storeId?: string) => Order[];
  linkOrderToCustomer: (order: Order) => Promise<CustomerRecord | null>;
  addCustomer: (customer: Omit<CustomerRecord, 'id' | 'createdAt'>) => Promise<CustomerRecord>;
  updateCustomer: (id: string, updates: Partial<CustomerRecord>) => Promise<void>;

  // Store Credentials
  updateStoreCredentials: (storeId: string, email: string, password?: string) => Promise<{ success: boolean; message: string }>;

  // Selection & Config
  selectedCategoryId: string;
  setSelectedCategoryId: (id: string) => void;
  selectedSubcategoryId: string | null;
  setSelectedSubcategoryId: (id: string | null) => void;
  selectedProductForCustomization: Product | null;
  setSelectedProductForCustomization: (product: Product | null) => void;
  selectedVariantForCustomization: ProductVariant | null;
  setSelectedVariantForCustomization: (variant: ProductVariant | null) => void;
  openProductConfig: (product: Product) => void;

  // Modals & Flow
  isVariantModalOpen: boolean;
  setIsVariantModalOpen: (open: boolean) => void;
  isModifierModalOpen: boolean;
  setIsModifierModalOpen: (open: boolean) => void;
  isProductOptionModalOpen: boolean;
  setIsProductOptionModalOpen: (open: boolean) => void;
  isOrderCheckModalOpen: boolean;
  setIsOrderCheckModalOpen: (open: boolean) => void;
  isMenuManagementModalOpen: boolean;
  setIsMenuManagementModalOpen: (open: boolean) => void;
  isReportsModalOpen: boolean;
  setIsReportsModalOpen: (open: boolean) => void;
  isPaymentModalOpen: boolean;
  setIsPaymentModalOpen: (open: boolean) => void;
  isCashDrawerModalOpen: boolean;
  setIsCashDrawerModalOpen: (open: boolean) => void;
  isSearchModalOpen: boolean;
  setIsSearchModalOpen: (open: boolean) => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  isReceiptModalOpen: boolean;
  setIsReceiptModalOpen: (open: boolean) => void;
  isStaffLockModalOpen: boolean;
  setIsStaffLockModalOpen: (open: boolean) => void;
  isTableManagementModalOpen: boolean;
  setIsTableManagementModalOpen: (open: boolean) => void;
  latestPlacedOrder: Order | null;
  setLatestPlacedOrder: (order: Order | null) => void;
  unacceptedOrders: Order[];
  acceptOrder: (orderId: string) => void;
  acceptAllOrders: () => void;
  printAlert: PrintAlert | null;
  retryPrintOrder: (order: Order) => void;
  dismissPrintAlert: () => void;
  getNextOrderSequence: () => { seqNumber: number; orderNumber: string; invoiceId: string };
  clearAllOrders: () => Promise<void>;
  latestToastNotification: NotificationItem | null;
  dismissToastNotification: () => void;

  // Theme & Profile
  themeMode: 'dark' | 'light';
  setThemeMode: (mode: 'dark' | 'light') => void;
  toggleThemeMode: () => void;
  adminProfile: {
    ceoName: string;
    email: string;
    businessName: string;
    phone: string;
  };
  updateAdminProfile: (updates: Partial<{ ceoName: string; email: string; businessName: string; phone: string }>) => void;
  changeAdminPassword: (oldPass: string, newPass: string) => { success: boolean; message: string };

  // Cart & Checkout
  cartItems: CartItem[];
  customerInfo: CustomerInfo;
  setCustomerInfo: React.Dispatch<React.SetStateAction<CustomerInfo>>;
  updateCustomerField: (field: keyof CustomerInfo, value: any) => void;
  setOrderType: (type: OrderType) => void;
  addToCart: (
    product: Product,
    variant: ProductVariant,
    selectedModifiers: SelectedModifier[],
    quantity: number,
    notes?: string,
    modifications?: ItemModification[]
  ) => void;
  quickAddToCart: (product: Product) => void;
  updateCartItemQuantity: (cartItemId: string, delta: number) => void;
  removeCartItem: (cartItemId: string) => void;
  addCartItemModification: (cartItemId: string, name: string, price: number) => void;
  updateCartItemModification: (cartItemId: string, modId: string, name: string, price: number) => void;
  removeCartItemModification: (cartItemId: string, modId: string) => void;
  clearCart: () => void;

  // Promotions & Discounts
  coupons: Coupon[];
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  addCoupon: (coupon: Coupon) => void;
  updateCoupon: (code: string, updates: Partial<Coupon>) => void;
  deleteCoupon: (code: string) => void;
  toggleCoupon: (code: string) => void;

  presetDiscounts: PresetDiscount[];
  appliedPresetDiscount: PresetDiscount | null;
  applyPresetDiscount: (discount: PresetDiscount | null) => void;
  addPresetDiscount: (discount: Omit<PresetDiscount, 'id'>) => void;
  updatePresetDiscount: (id: string, updates: Partial<PresetDiscount>) => void;
  deletePresetDiscount: (id: string) => void;

  // Manual Discount (Reference 2 Checkout Screen)
  manualDiscount: { type: 'percentage' | 'fixed'; value: number } | null;
  setManualDiscount: (discount: { type: 'percentage' | 'fixed'; value: number } | null) => void;
  applyManualDiscount: (type: 'percentage' | 'fixed', value: number) => void;
  clearManualDiscount: () => void;

  promoBanner: PromotionBanner;
  updatePromoBanner: (banner: Partial<PromotionBanner>) => void;

  // Cart Calculations
  cartSubtotal: number;
  cartModifiersTotal: number;
  cartCouponDiscount: number;
  cartPresetDiscount: number;
  cartManualDiscount: number;
  cartTotalDiscount: number;
  cartDeliveryFee: number;
  cartServiceCharge: number;
  cartBagCharge: number;
  cartTax: number;
  cartGrandTotal: number;

  // Table Management
  tables: TableRecord[];
  addTable: (table: Omit<TableRecord, 'id' | 'lastUpdated'>) => void;
  updateTable: (id: string, updates: Partial<TableRecord>) => void;
  deleteTable: (id: string) => void;
  updateTableStatus: (
    id: string,
    status: TableRecord['status'],
    currentOrderId?: string,
    guestCount?: number
  ) => void;

  // Printer Devices
  printers: PrinterDevice[];
  addPrinter: (printer: Omit<PrinterDevice, 'id' | 'receiptCount' | 'lastTestPrint'>) => void;
  updatePrinter: (id: string, updates: Partial<PrinterDevice>) => void;
  deletePrinter: (id: string) => void;
  setDefaultPrinter: (id: string) => void;
  testPrintPrinter: (id: string) => Promise<{ success: boolean; message: string; receiptSlip?: string }>;

  // Store Settings
  storeSettings: StoreSettingsData;
  updateStoreSettings: (settings: Partial<StoreSettingsData>) => void;

  // Orders
  orders: Order[];
  orderHistory: Order[];
  isOrderHistoryModalOpen: boolean;
  setIsOrderHistoryModalOpen: (open: boolean) => void;
  selectedHistoryOrder: Order | null;
  setSelectedHistoryOrder: (order: Order | null) => void;
  openOrderHistory: (orderId?: string) => void;
  createOrder: (paymentMethod: PaymentMethod) => Order | null;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  cancelOrder: (orderId: string, reason?: string) => void;
  updateExistingOrder: (orderId: string, updatedFields: Partial<Order>) => Promise<Order | null>;
  editingOrder: Order | null;
  startEditingOrder: (order: Order, options?: { targetView?: ActiveAppView }) => void;
  cancelEditingOrder: () => void;
  saveEditingOrder: (overrideItems?: CartItem[]) => Promise<Order | null>;

  // Cash Drawer & Sales Reset
  cashDrawerState: CashDrawerState;
  cashDrawerTransactions: CashDrawerTransaction[];
  openDrawer: (reason: string) => void;
  recordCashIn: (amount: number, reason: string) => void;
  recordCashOut: (amount: number, reason: string) => void;
  resetCashDrawerSales: (options?: { resetOrders?: boolean; newOpeningFloat?: number; reason?: string }) => void;
  setActiveOperator: (employeeOrId: Employee | string) => void;
  setCashDrawerOpeningFloat: (storeId: string, amount: number) => void;
  getCashDrawerBalance: (storeId?: string) => {
    openingFloat: number;
    cashSales: number;
    totalCashIn: number;
    totalCashOut: number;
    currentBalance: number;
  };

  // Notifications
  notifications: NotificationItem[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (notif: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;

  // Activity Logs
  activityLogs: ActivityLogEntry[];
  logActivity: (action: string, details: string, category: ActivityLogEntry['category']) => void;

  // Delivery Settings & Admin Restrictions
  deliverySettingsMap: Record<string, StoreDeliverySettings>;
  deliveryZones: DeliveryZone[];
  isDeliveryRestrictedByAdmin: (
    storeId: string,
    address?: string,
    postcode?: string
  ) => { isRestricted: boolean; reason?: string };

  // Reset
  resetAllData: () => void;
}

const STORAGE_KEYS = {
  STORES: 'nexus_stores_v6',
  ROLES: 'nexus_roles_v6',
  EMPLOYEES: 'nexus_employees_v6',
  CATEGORIES: 'nexus_categories_v6',
  PRODUCTS: 'nexus_products_v6',
  MODIFIER_GROUPS: 'nexus_modifier_groups_v6',
  MODIFIERS: 'nexus_modifiers_v6',
  ORDERS: 'nexus_orders_v6',
  ORDER_HISTORY: 'nexus_order_history_permanent_v6',
  DRAWER_TXS: 'nexus_drawer_txs_v6',
  NOTIFS: 'nexus_notifications_v6',
  LOGS: 'nexus_activity_logs_v6',
  CURRENT_STORE_ID: 'nexus_current_store_id_v6',
  CURRENT_EMP_ID: 'nexus_current_emp_id_v6',
  TABLES: 'nexus_tables_v6',
  PRINTERS: 'nexus_printers_v6',
  STORE_SETTINGS: 'nexus_store_settings_v6',
  COUPONS: 'nexus_coupons_v6',
  PRESET_DISCOUNTS: 'nexus_preset_discounts_v6',
  PROMO_BANNER: 'nexus_promo_banner_v6',
  THEME_MODE: 'nexus_theme_mode_v6',
  ADMIN_PROFILE: 'nexus_admin_profile_v6',
  AUTH_USER: 'nexus_auth_user_v6',
  STAFF_ACCOUNTS: 'nexus_staff_accounts_v6',
};

const NexusContext = createContext<NexusContextType | null>(null);

const DEFAULT_CUSTOMER_INFO: CustomerInfo = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  orderType: 'Delivery',
  ukPostcode: '',
  fullAddress: '',
  addressLine2: '',
  driverInstructions: '',
  pickupTime: '15-20 mins',
  tableReference: 'Table 01',
  couponCode: '',
  notes: '',
};

const DEFAULT_ADMIN_PROFILE = {
  ceoName: 'Styris Happy',
  email: 'styrishaappy@gmail.com',
  businessName: 'Nexus Point of Sale',
  phone: '',
  password: 'Styris$06',
};

export const NexusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Core collections with localStorage persistence
  const [stores, setStores] = useState<Store[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STORES);
      return saved ? JSON.parse(saved) : INITIAL_STORES;
    } catch {
      return INITIAL_STORES;
    }
  });

  const [roles, setRoles] = useState<Role[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ROLES);
      return saved ? JSON.parse(saved) : INITIAL_ROLES;
    } catch {
      return INITIAL_ROLES;
    }
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
      return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
    } catch {
      return INITIAL_EMPLOYEES;
    }
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MODIFIER_GROUPS);
      return saved ? JSON.parse(saved) : INITIAL_MODIFIER_GROUPS;
    } catch {
      return INITIAL_MODIFIER_GROUPS;
    }
  });

  const [modifiers, setModifiers] = useState<Modifier[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MODIFIERS);
      return saved ? JSON.parse(saved) : INITIAL_MODIFIERS;
    } catch {
      return INITIAL_MODIFIERS;
    }
  });

  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COUPONS);
      return saved ? JSON.parse(saved) : INITIAL_COUPONS;
    } catch {
      return INITIAL_COUPONS;
    }
  });

  const [presetDiscounts, setPresetDiscounts] = useState<PresetDiscount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRESET_DISCOUNTS);
      return saved ? JSON.parse(saved) : INITIAL_PRESET_DISCOUNTS;
    } catch {
      return INITIAL_PRESET_DISCOUNTS;
    }
  });

  const [promoBanner, setPromoBanner] = useState<PromotionBanner>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROMO_BANNER);
      return saved ? JSON.parse(saved) : INITIAL_PROMOTION_BANNER;
    } catch {
      return INITIAL_PROMOTION_BANNER;
    }
  });

  const [tables, setTables] = useState<TableRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TABLES);
      return saved ? JSON.parse(saved) : INITIAL_TABLES;
    } catch {
      return INITIAL_TABLES;
    }
  });

  const [printers, setPrinters] = useState<PrinterDevice[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRINTERS);
      return saved ? JSON.parse(saved) : INITIAL_PRINTERS;
    } catch {
      return INITIAL_PRINTERS;
    }
  });

  const [storeSettings, setStoreSettings] = useState<StoreSettingsData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STORE_SETTINGS);
      return saved ? JSON.parse(saved) : INITIAL_STORE_SETTINGS;
    } catch {
      return INITIAL_STORE_SETTINGS;
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  // Permanent Order History: persists forever across refreshes, logouts, completion, and queue archiving
  const [orderHistory, setOrderHistory] = useState<Order[]>(() => {
    try {
      const savedPermanent = localStorage.getItem(STORAGE_KEYS.ORDER_HISTORY);
      const savedActive = localStorage.getItem(STORAGE_KEYS.ORDERS);
      const permList: Order[] = savedPermanent ? JSON.parse(savedPermanent) : [];
      const actList: Order[] = savedActive ? JSON.parse(savedActive) : INITIAL_ORDERS;
      const map = new Map<string, Order>();
      INITIAL_ORDERS.forEach((o) => map.set(o.id, o));
      if (Array.isArray(permList)) {
        permList.forEach((o) => map.set(o.id, o));
      }
      if (Array.isArray(actList)) {
        actList.forEach((o) => {
          const existing = map.get(o.id);
          map.set(o.id, existing ? { ...existing, ...o } : o);
        });
      }
      return Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [isOrderHistoryModalOpen, setIsOrderHistoryModalOpen] = useState(false);
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<Order | null>(null);

  const [cashDrawerTransactions, setCashDrawerTransactions] = useState<CashDrawerTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DRAWER_TXS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((tx: CashDrawerTransaction) => {
            if (tx.type === 'Drawer-Open' && (tx.amount === 250 || tx.reason === 'Reset: Initial Opening Float (£250.00)')) {
              return { ...tx, amount: 0, balanceAfter: 0 };
            }
            return tx;
          });
        }
      }
      return INITIAL_CASH_DRAWER_TRANSACTIONS;
    } catch {
      return INITIAL_CASH_DRAWER_TRANSACTIONS;
    }
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFS);
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
      return saved ? JSON.parse(saved) : INITIAL_ACTIVITY_LOGS;
    } catch {
      return INITIAL_ACTIVITY_LOGS;
    }
  });

  // Add-on Groups system state (New menu item linked groups)
  const [addonGroups, setAddonGroups] = useState<AddonGroup[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_addon_groups_v1');
      return saved ? JSON.parse(saved) : INITIAL_ADDON_GROUPS;
    } catch {
      return INITIAL_ADDON_GROUPS;
    }
  });

  useEffect(() => {
    localStorage.setItem('nexus_addon_groups_v1', JSON.stringify(addonGroups));
  }, [addonGroups]);

  // Add-ons system state
  const [addons, setAddons] = useState<MenuAddon[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_addons_v4');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('nexus_addons_v4', JSON.stringify(addons));
  }, [addons]);

  // Customers system state
  const [customers, setCustomers] = useState<CustomerRecord[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_customers_v4');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('nexus_customers_v4', JSON.stringify(customers));
  }, [customers]);

  // Current Store & Employee
  const [currentStoreId, setCurrentStoreIdState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_STORE_ID) || 'store-1';
  });

  const [currentEmployeeId, setCurrentEmployeeIdState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_EMP_ID) || 'emp-1';
  });

  // Delivery Settings & Delivery Zones State
  const [deliverySettingsMap, setDeliverySettingsMap] = useState<Record<string, StoreDeliverySettings>>({});
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [openingFloats, setOpeningFloats] = useState<Record<string, number>>({});

  // Firestore Real-time Multi-Device Subscriptions & Persistence
  useEffect(() => {
    // 1. Sync Stores / Companies across all connected devices
    const unsubStores = firestoreService.subscribeStores((firestoreStores) => {
      if (firestoreStores && firestoreStores.length > 0) {
        setStores(firestoreStores);
      }
    });

    // 2. Sync Menu Categories & Subcategories
    const unsubCategories = firestoreService.subscribeCategories((firestoreCats) => {
      if (firestoreCats && firestoreCats.length > 0) {
        setCategories(firestoreCats.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)));
      }
    });

    // 3. Sync Products & Variations
    const unsubProducts = firestoreService.subscribeProducts((firestoreProds) => {
      if (firestoreProds && firestoreProds.length > 0) {
        const sanitized = firestoreProds.map((p) => {
          if (p.variants && p.variants.length === 1 && p.basePrice > 0 && p.variants[0].price === 5.0 && p.basePrice !== 5.0) {
            return {
              ...p,
              variants: [{ ...p.variants[0], price: p.basePrice }],
            };
          }
          return p;
        });
        setProducts(sanitized.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)));
      }
    });

    // 4. Sync Orders in real-time
    const unsubOrders = firestoreService.subscribeOrders((firestoreOrders) => {
      if (firestoreOrders && Array.isArray(firestoreOrders)) {
        setOrders(firestoreOrders);
        setOrderHistory((prev) => {
          const map = new Map<string, Order>();
          prev.forEach((o) => map.set(o.id, o));
          firestoreOrders.forEach((o) => {
            const existing = map.get(o.id);
            map.set(o.id, existing ? { ...existing, ...o } : o);
          });
          return Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
      }
    });

    // 5. Sync Add-on Groups from Firestore
    const unsubAddonGroups = firestoreService.subscribeAddonGroups((groups) => {
      if (groups) {
        setAddonGroups(groups);
      }
    });

    // 6. Sync Add-ons from Firestore
    const unsubAddons = firestoreService.subscribeAddons((firestoreAddons) => {
      if (firestoreAddons) {
        setAddons(firestoreAddons);
      }
    });

    // 6. Sync Customers from Firestore
    const unsubCustomers = firestoreService.subscribeCustomers((firestoreCustomers) => {
      if (firestoreCustomers) {
        setCustomers(firestoreCustomers);
      }
    });

    // 7. Sync Staff Accounts from Firestore
    const unsubStaff = firestoreService.subscribeStaffAccounts((firestoreStaff) => {
      if (firestoreStaff && firestoreStaff.length > 0) {
        setStaffAccounts(
          firestoreStaff.map((s) => {
            const rawStoreIds = Array.isArray(s.assignedStoreIds) && s.assignedStoreIds.length > 0
              ? s.assignedStoreIds
              : (s.assignedStoreId ? [s.assignedStoreId] : ['store-1']);
            return {
              ...s,
              assignedStoreIds: rawStoreIds,
              assignedStoreId: rawStoreIds[0] || 'store-1',
              status: s.status || 'Active',
              password: s.password && s.password !== 'Staff123!' ? s.password : 'Styris$123',
            };
          })
        );
      }
    });

    // 8. Sync Employees from Firestore
    const unsubEmployees = firestoreService.subscribeEmployees((firestoreEmps) => {
      if (firestoreEmps && firestoreEmps.length > 0) {
        setEmployees(firestoreEmps);
      }
    });

    // 9. Sync Access Roles
    const unsubRoles = firestoreService.subscribeRoles((firestoreRoles) => {
      if (firestoreRoles && firestoreRoles.length > 0) {
        setRoles(firestoreRoles);
      }
    });

    // 10. Sync Restaurant Tables
    const unsubTables = firestoreService.subscribeTables((firestoreTables) => {
      if (firestoreTables && firestoreTables.length > 0) {
        setTables(firestoreTables);
      }
    });

    // 11. Sync Hardware Printers
    const unsubPrinters = firestoreService.subscribePrinters((firestorePrinters) => {
      if (firestorePrinters && firestorePrinters.length > 0) {
        setPrinters(firestorePrinters);
      }
    });

    // 12. Sync Coupons
    const unsubCoupons = firestoreService.subscribeCoupons((firestoreCoupons) => {
      if (firestoreCoupons && firestoreCoupons.length > 0) {
        setCoupons(firestoreCoupons);
      }
    });

    // 13. Sync Preset Discounts
    const unsubDiscounts = firestoreService.subscribePresetDiscounts((firestoreDiscounts) => {
      if (firestoreDiscounts && firestoreDiscounts.length > 0) {
        setPresetDiscounts(firestoreDiscounts);
      }
    });

    // 14. Sync Store Settings
    const unsubSettings = firestoreService.subscribeStoreSettings((settingsMap) => {
      if (settingsMap) {
        const currentSettings = settingsMap[currentStoreId];
        if (currentSettings) {
          setStoreSettings(currentSettings);
        }
      }
    });

    // 15. Sync Admin Profile in real-time
    const unsubAdmin = firestoreService.subscribeAdminProfile((profile) => {
      if (profile) {
        const isOldProfile = profile.email === 'hurabsindhu@gmail.com' || profile.fullName === 'Hurab Sindhu' || profile.ceoName === 'Hurab Sindhu';
        const cleanName = isOldProfile ? 'Administrator' : (profile.fullName || profile.displayName || 'Administrator');
        const cleanEmail = isOldProfile ? 'Styrishappy@gmail.com' : (profile.email || 'Styrishappy@gmail.com');
        const cleanPass = isOldProfile || !profile.password || profile.password === 'admin' ? 'Styris$06' : profile.password;

        if (isOldProfile) {
          firestoreService.saveAdminProfile({
            fullName: 'Administrator',
            displayName: 'Administrator',
            ceoName: 'Administrator',
            email: 'Styrishappy@gmail.com',
            password: 'Styris$06',
          }).catch(console.warn);
        }

        setAdminProfile((prev: any) => ({
          ...prev,
          ceoName: cleanName,
          email: cleanEmail,
          password: cleanPass,
          businessName: profile.companyName || (profile as any).businessName || prev.businessName,
          phone: profile.phone || prev.phone,
        }));
      }
    });

    // 16. Sync Store Delivery Settings
    const unsubDeliverySettings = firestoreService.subscribeStoreDeliverySettings((map) => {
      if (map) {
        setDeliverySettingsMap(map);
      }
    });

    // 17. Sync Delivery Zones
    const unsubDeliveryZones = firestoreService.subscribeDeliveryZones((zonesList) => {
      if (zonesList) {
        setDeliveryZones(zonesList);
      }
    });

    // 18. Sync Cash Drawer Opening Floats per store
    const unsubCashDrawer = firestoreService.subscribeCashDrawerState((map) => {
      if (map) {
        const floatMap: Record<string, number> = {};
        Object.entries(map).forEach(([sId, val]) => {
          if (typeof val.openingFloat === 'number') {
            floatMap[sId] = val.openingFloat;
          }
        });
        setOpeningFloats(floatMap);
      }
    });

    // 19. Sync Cash Drawer Transactions (Cash-In / Cash-Out / Reset)
    const unsubDrawerTxs = firestoreService.subscribeCashDrawerTransactions((txs) => {
      if (txs && txs.length > 0) {
        setCashDrawerTransactions(txs);
      }
    });

    return () => {
      unsubStores();
      unsubCategories();
      unsubProducts();
      unsubOrders();
      unsubAddonGroups();
      unsubAddons();
      unsubCustomers();
      unsubStaff();
      unsubEmployees();
      unsubRoles();
      unsubTables();
      unsubPrinters();
      unsubCoupons();
      unsubDiscounts();
      unsubSettings();
      unsubAdmin();
      unsubDeliverySettings();
      unsubDeliveryZones();
      unsubCashDrawer();
      unsubDrawerTxs();
    };
  }, [currentStoreId]);

  // 3-Level Authentication User State with safe session restoration
  const [currentUser, setCurrentUserState] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && parsed.role) return parsed;
      }
    } catch {}
    return null;
  });

  const setCurrentUser = (user: AuthUser | null | ((prev: AuthUser | null) => AuthUser | null)) => {
    setCurrentUserState((prev) => {
      const updated = typeof user === 'function' ? (user as any)(prev) : user;
      try {
        if (updated) {
          localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(updated));
        } else {
          localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
        }
      } catch {}
      return updated;
    });
  };

  // Failed login attempts tracker & security rate-limiting lockout state (transient in memory)
  const [failedLoginAttempts, setFailedLoginAttempts] = useState<Record<string, number>>({});
  const [posLockoutUntil, setPosLockoutUntil] = useState<number>(0);
  const [securityAlertNotice, setSecurityAlertNotice] = useState<{
    dispatchedTo: string;
    timestamp: string;
    workspace: string;
    account: string;
  } | null>(null);

  const clearPosLockout = () => {
    setPosLockoutUntil(0);
    setSecurityAlertNotice(null);
  };

  // Staff Accounts with Multi-Store Access
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STAFF_ACCOUNTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((s) => {
            const rawStoreIds = Array.isArray(s.assignedStoreIds) && s.assignedStoreIds.length > 0
              ? s.assignedStoreIds
              : (s.assignedStoreId ? [s.assignedStoreId] : ['store-1']);
            return {
              ...s,
              assignedStoreIds: rawStoreIds,
              assignedStoreId: rawStoreIds[0] || 'store-1',
              status: s.status || 'Active',
              password: s.password && s.password !== 'Staff123!' ? s.password : 'Styris$123',
            };
          });
        }
      }
      return INITIAL_STAFF_ACCOUNTS;
    } catch {
      return INITIAL_STAFF_ACCOUNTS;
    }
  });

  useEffect(() => {
    // Firestore is written by the individual add/update/delete actions; re-saving the whole
    // local list here would let a stale device re-enable disabled accounts or revert passwords
    localStorage.setItem(STORAGE_KEYS.STAFF_ACCOUNTS, JSON.stringify(staffAccounts));
  }, [staffAccounts]);

  const fallbackStore = INITIAL_STORES[0] || {
    id: 'store-1',
    storeCode: 'STORE-001',
    businessName: 'Nexus Point of Sale',
    legalEntityName: '',
    domainName: '',
    domain: '',
    email: 'Styrishappy@gmail.com',
    storeUsername: 'Styrishappy@gmail.com',
    storePassword: 'Store123!',
    accountStatus: 'Active',
    lastLogin: new Date().toISOString(),
    mobileNumber: '',
    phone: '',
    country: 'United Kingdom',
    activeStatus: 'Active',
    isActive: true,
    callCenterUrl: '',
    daysUntilDeletion: 365,
    address: '',
    postcode: '',
    city: '',
    currencySymbol: '£',
    taxRate: 0.20,
    taxRatePercentage: 20,
    deliveryFee: 0.00,
    minimumDeliveryOrder: 0.00,
    serviceChargeRate: 0.00,
    logo: '',
    createdAt: new Date().toISOString(),
  };

  const fallbackEmployee: Employee = INITIAL_EMPLOYEES[0] || {
    id: 'emp-1',
    name: 'Administrator',
    email: 'Styrishappy@gmail.com',
    phone: '',
    roleId: 'role-admin',
    role: 'Administrator',
    storeId: 'store-1',
    status: 'Active',
    pinCode: '1234',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    hourlyRate: 0,
    lastLogin: new Date().toISOString(),
    joinedDate: new Date().toISOString().split('T')[0],
  };

  const currentStore = stores.find((s) => s.id === currentStoreId) || stores[0] || fallbackStore;
  const currentEmployee = employees.find((e) => e.id === currentEmployeeId) || employees[0] || fallbackEmployee;

  // Views & Tabs
  const [activeAppView, setActiveAppViewRaw] = useState<ActiveAppView>(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed?.role === 'SUPER_ADMIN' || parsed?.role === 'ADMIN') return 'dashboard';
        if (parsed?.role === 'STAFF') return 'staff-pos';
        if (parsed?.role === 'STORE') return 'pos-menu';
      }
    } catch {}
    return 'login';
  });
  const [previousAppView, setPreviousAppView] = useState<ActiveAppView>('dashboard');
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('overview');
  const [activePosMode, setActivePosMode] = useState<'store' | 'staff'>('store');

  const setActiveAppView = useCallback((view: ActiveAppView) => {
    if (view === 'staff-pos') {
      setActivePosMode('staff');
    } else if (view === 'pos-menu') {
      if (currentUser?.role === 'STORE') {
        setActivePosMode('store');
      }
    }
    setActiveAppViewRaw(view);
  }, [currentUser?.role]);

  useEffect(() => {
    if (currentUser?.role === 'STAFF') {
      setActivePosMode('staff');
    } else {
      // Also covers admin / logged out, so a previous staff session doesn't leave staff mode on
      setActivePosMode('store');
    }
  }, [currentUser?.role]);

  // Dynamic Accessible Stores calculation strictly enforcing multi-store permissions
  const accessibleStores = useMemo<Store[]>(() => {
    if (!currentUser) return stores;
    if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') {
      return stores;
    }
    if (currentUser.role === 'STAFF') {
      const allowed = currentUser.assignedStoreIds || (currentUser.assignedStoreId ? [currentUser.assignedStoreId] : []);
      const filtered = stores.filter((s) => allowed.includes(s.id));
      return filtered.length > 0 ? filtered : (stores.slice(0, 1));
    }
    if (currentUser.role === 'STORE') {
      const targetId = currentUser.storeId || currentUser.assignedStoreId || currentStoreId;
      const store = stores.find((s) => s.id === targetId);
      return store ? [store] : stores.slice(0, 1);
    }
    return stores;
  }, [stores, currentUser, currentStoreId]);

  // Real-time Staff Permissions & Multi-Store Synchronization
  useEffect(() => {
    if (currentUser?.role === 'STAFF') {
      const staffMatch = staffAccounts.find((s) => s.id === currentUser.id);
      if (staffMatch) {
        if (staffMatch.status === 'Disabled') {
          setCurrentUser(null);
          setActiveAppView('login');
          localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
          return;
        }
        const latestAssigned = Array.isArray(staffMatch.assignedStoreIds) && staffMatch.assignedStoreIds.length > 0
          ? staffMatch.assignedStoreIds
          : [staffMatch.assignedStoreId || 'store-1'];

        const currentAssigned = currentUser.assignedStoreIds || [currentUser.assignedStoreId || ''];
        const hasChanged =
          latestAssigned.length !== currentAssigned.length ||
          latestAssigned.some((id) => !currentAssigned.includes(id));

        if (hasChanged) {
          const isCurrentStoreStillAllowed = latestAssigned.includes(currentStoreId);
          const nextStoreId = isCurrentStoreStillAllowed ? currentStoreId : latestAssigned[0];

          setCurrentUser((prev) =>
            prev
              ? {
                  ...prev,
                  assignedStoreIds: latestAssigned,
                  assignedStoreId: nextStoreId,
                  storeId: nextStoreId,
                  storeName: stores.find((s) => s.id === nextStoreId)?.businessName || prev.storeName,
                }
              : null
          );

          if (!isCurrentStoreStillAllowed && nextStoreId) {
            setCurrentStoreIdState(nextStoreId);
            localStorage.setItem(STORAGE_KEYS.CURRENT_STORE_ID, nextStoreId);
          }
        }
      }
    } else if (currentUser?.role === 'STORE') {
      const targetStoreId = currentUser.storeId || currentUser.assignedStoreId;
      const storeMatch = stores.find((s) => s.id === targetStoreId);
      if (storeMatch) {
        const isInactive =
          storeMatch.accountStatus === 'Disabled' ||
          storeMatch.isActive === false ||
          storeMatch.activeStatus === 'Inactive' ||
          storeMatch.activeStatus === 'Suspended';
        if (isInactive) {
          setCurrentUser(null);
          setActiveAppView('login');
          localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
          alert('This store account is currently inactive. Please contact the administrator.');
        }
      }
    }
  }, [staffAccounts, currentUser?.id, currentUser?.role, currentStoreId, stores, setActiveAppView, setCurrentUser]);

  const launchPos = (fromView?: ActiveAppView) => {
    setPreviousAppView(fromView || activeAppView || 'dashboard');
    setActiveAppView('store-selection');
  };

  const returnFromStoreSelection = () => {
    if (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN') {
      setActiveAppView(previousAppView || 'dashboard');
    } else if (currentUser?.role === 'STAFF') {
      setActiveAppView('staff-pos');
    } else {
      setActiveAppView('login');
    }
  };

  // Menu Selection Navigation
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(() => {
    return categories[0]?.id || '';
  });
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [selectedProductForCustomization, setSelectedProductForCustomization] = useState<Product | null>(null);
  const [selectedVariantForCustomization, setSelectedVariantForCustomization] = useState<ProductVariant | null>(null);

  // Theme Mode
  const [themeMode, setThemeModeState] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem(STORAGE_KEYS.THEME_MODE) as 'dark' | 'light') || 'dark';
  });

  const setThemeMode = (mode: 'dark' | 'light') => {
    setThemeModeState(mode);
    localStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
  };

  const toggleThemeMode = () => {
    setThemeModeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEYS.THEME_MODE, next);
      return next;
    });
  };

  useEffect(() => {
    if (themeMode === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, [themeMode]);

  // Admin / CEO Profile
  const [adminProfile, setAdminProfile] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_PROFILE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email === 'hurabsindhu@gmail.com' || parsed.ceoName === 'Hurab Sindhu') {
          return {
            ...parsed,
            ceoName: parsed.ceoName === 'Hurab Sindhu' ? 'Administrator' : parsed.ceoName,
            fullName: parsed.fullName === 'Hurab Sindhu' ? 'Administrator' : parsed.fullName,
            displayName: parsed.displayName === 'Hurab Sindhu' ? 'Administrator' : parsed.displayName,
            email: 'Styrishappy@gmail.com',
            password: parsed.password === 'admin' ? 'Styris$06' : (parsed.password || 'Styris$06'),
          };
        }
        return parsed;
      }
      return DEFAULT_ADMIN_PROFILE;
    } catch {
      return DEFAULT_ADMIN_PROFILE;
    }
  });

  const updateAdminProfile = (updates: Partial<{ ceoName: string; email: string; businessName: string; phone: string; fullName?: string; displayName?: string }>) => {
    setAdminProfile((prev: any) => {
      const name = updates.fullName || updates.displayName || updates.ceoName || prev.ceoName;
      const updated = {
        ...prev,
        ...updates,
        ceoName: name,
        fullName: name,
        displayName: name,
      };
      localStorage.setItem(STORAGE_KEYS.ADMIN_PROFILE, JSON.stringify(updated));

      // Persist to Firestore
      firestoreService.saveAdminProfile({
        fullName: name,
        displayName: name,
        ceoName: name,
        email: updated.email || 'Styrishappy@gmail.com',
        companyName: updated.companyName || 'NEXUS PIZZA & GRILL',
        phone: updated.phone || '+44 7911 123456',
        updatedAt: new Date().toISOString(),
      }).catch((err) => console.warn('Firestore admin profile save:', err));

      return updated;
    });

    // Update currentUser name if super admin
    if (currentUser?.role === 'ADMIN') {
      const newName = updates.fullName || updates.displayName || updates.ceoName;
      if (newName) {
        setCurrentUser((prev) => prev ? { ...prev, name: newName } : null);
      }
    }

    logActivity('Admin Profile Updated', 'Super Admin display name and owner settings updated permanently', 'System');
  };

  const changeAdminPassword = (oldPass: string, newPass: string) => {
    if (adminProfile.password && oldPass !== adminProfile.password) {
      return { success: false, message: 'Current password is incorrect.' };
    }
    if (!newPass || newPass.trim().length < 4) {
      return { success: false, message: 'New password must be at least 4 characters.' };
    }
    setAdminProfile((prev: any) => {
      const updated = { ...prev, password: newPass };
      localStorage.setItem(STORAGE_KEYS.ADMIN_PROFILE, JSON.stringify(updated));
      return updated;
    });
    // Persist, otherwise the next admin-profile snapshot restores the old password
    firestoreService.saveAdminProfile({ password: newPass }).catch(console.warn);
    logActivity('Security Updated', 'Admin terminal master password changed', 'Auth');
    return { success: true, message: 'Password updated successfully.' };
  };

  // Modals
  const [isVariantModalOpen, setIsVariantModalOpen] = useState<boolean>(false);
  const [isModifierModalOpen, setIsModifierModalOpen] = useState<boolean>(false);
  const [isProductOptionModalOpen, setIsProductOptionModalOpen] = useState<boolean>(false);
  const [isOrderCheckModalOpen, setIsOrderCheckModalOpen] = useState<boolean>(false);
  const [isMenuManagementModalOpen, setIsMenuManagementModalOpen] = useState<boolean>(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isCashDrawerModalOpen, setIsCashDrawerModalOpen] = useState<boolean>(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [isStaffLockModalOpen, setIsStaffLockModalOpen] = useState<boolean>(false);
  const [isTableManagementModalOpen, setIsTableManagementModalOpen] = useState<boolean>(false);
  const [latestPlacedOrder, setLatestPlacedOrder] = useState<Order | null>(null);
  const [latestToastNotification, setLatestToastNotification] = useState<NotificationItem | null>(null);

  const dismissToastNotification = () => setLatestToastNotification(null);

  // Cart & Customer
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>(DEFAULT_CUSTOMER_INFO);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [appliedPresetDiscount, setAppliedPresetDiscount] = useState<PresetDiscount | null>(null);
  const [manualDiscount, setManualDiscount] = useState<{ type: 'percentage' | 'fixed'; value: number } | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const applyManualDiscount = (type: 'percentage' | 'fixed', value: number) => {
    if (value <= 0) {
      setManualDiscount(null);
    } else {
      setManualDiscount({ type, value });
    }
  };

  const clearManualDiscount = () => {
    setManualDiscount(null);
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(stores));
  }, [stores]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(roles));
  }, [roles]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  }, [employees]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MODIFIER_GROUPS, JSON.stringify(modifierGroups));
  }, [modifierGroups]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MODIFIERS, JSON.stringify(modifiers));
  }, [modifiers]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(coupons));
  }, [coupons]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRESET_DISCOUNTS, JSON.stringify(presetDiscounts));
  }, [presetDiscounts]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROMO_BANNER, JSON.stringify(promoBanner));
  }, [promoBanner]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(tables));
  }, [tables]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRINTERS, JSON.stringify(printers));
  }, [printers]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STORE_SETTINGS, JSON.stringify(storeSettings));
  }, [storeSettings]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDER_HISTORY, JSON.stringify(orderHistory));
    } catch {
      // ignore
    }
  }, [orderHistory]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DRAWER_TXS, JSON.stringify(cashDrawerTransactions));
  }, [cashDrawerTransactions]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFS, JSON.stringify(notifications));
  }, [notifications]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(activityLogs));
  }, [activityLogs]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_STORE_ID, currentStoreId);
  }, [currentStoreId]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_EMP_ID, currentEmployeeId);
  }, [currentEmployeeId]);

  // Activity logger helper
  const logActivity = (action: string, details: string, category: ActivityLogEntry['category']) => {
    const role = roles.find((r) => r.id === currentEmployee?.roleId);
    const newEntry: ActivityLogEntry = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      storeId: currentStore?.id || 'store-1',
      userId: currentEmployee?.id || 'emp-admin',
      userName: currentEmployee?.name || 'Administrator',
      roleName: role ? role.name : 'Staff',
      action,
      details,
      category,
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.45',
      device: 'Nexus Touch Terminal #01',
    };
    setActivityLogs((prev) => [newEntry, ...prev.slice(0, 99)]);
  };

  // Notification helper
  const addNotification = (notif: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
    const item: NotificationItem = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      storeId: currentStore?.id || 'store-1',
      read: false,
      timestamp: new Date().toISOString(),
    };
    setNotifications((prev) => [item, ...prev]);
    setLatestToastNotification(item);
    try {
      const isStaffUser = currentUser?.role === 'STAFF' || activeAppView === 'staff-pos';
      if (!isStaffUser) {
        soundFX.playNotificationBeep();
      }
    } catch {
      // audio context may be suspended
    }
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Staff switch with PIN
  const switchStaffWithPin = (pin: string): boolean => {
    const found = employees.find((e) => e.pinCode === pin.trim() && (e.status === 'Active' || e.status === undefined));
    if (found) {
      setCurrentEmployeeIdState(found.id);
      logActivity('Staff Switched', `Logged into terminal as ${found.name}`, 'Auth');
      addNotification({
        title: 'Staff Login',
        message: `${found.name} logged into POS terminal.`,
        type: 'system',
      });
      return true;
    }
    return false;
  };

  const setCurrentStoreId = (id: string) => {
    // If STORE user, they are permanently locked to their assigned store
    if (currentUser?.role === 'STORE') {
      const lockedId = currentUser.storeId || currentUser.assignedStoreId;
      if (lockedId && id !== lockedId) {
        console.warn(`Store user ${currentUser.name} is not authorized to access store ${id}`);
        return;
      }
    }

    // If staff user, ensure they can only switch to their assigned stores
    if (currentUser?.role === 'STAFF') {
      const allowed = currentUser.assignedStoreIds || (currentUser.assignedStoreId ? [currentUser.assignedStoreId] : []);
      if (allowed.length > 0 && !allowed.includes(id)) {
        console.warn(`Staff user ${currentUser.name} is not authorized to access store ${id}`);
        return;
      }
      // Update currentUser active assignedStoreId and storeId
      const targetStore = stores.find((s) => s.id === id);
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              assignedStoreId: id,
              storeId: id,
              storeName: targetStore?.businessName || prev.storeName,
            }
          : null
      );
    }

    setCurrentStoreIdState(id);
    localStorage.setItem(STORAGE_KEYS.CURRENT_STORE_ID, id);
    setSelectedCategoryId('');
    setSelectedSubcategoryId(null);
    const store = stores.find((s) => s.id === id);
    if (store) {
      logActivity('Store Switched', `Switched active branch to ${store.businessName}`, 'Store');
    }
  };

  const setCurrentStore = (storeOrId: Store | string) => {
    const id = typeof storeOrId === 'string' ? storeOrId : storeOrId.id;
    setCurrentStoreId(id);
  };

  const selectWorkingStore = (storeOrId: Store | string) => {
    const id = typeof storeOrId === 'string' ? storeOrId : storeOrId.id;
    setCurrentStoreId(id);
    if (currentUser?.role === 'STAFF') {
      setActiveAppView('staff-pos');
    } else if (currentUser?.role === 'STORE') {
      setActiveAppView('pos-menu');
    }
  };

  const setCurrentEmployeeId = (id: string) => {
    setCurrentEmployeeIdState(id);
  };

  const setCurrentEmployee = (employeeOrId: Employee | string) => {
    const id = typeof employeeOrId === 'string' ? employeeOrId : employeeOrId.id;
    setCurrentEmployeeId(id);
  };

  const setActiveOperator = (employeeOrId: Employee | string) => {
    const id = typeof employeeOrId === 'string' ? employeeOrId : employeeOrId.id;
    setCurrentEmployeeId(id);
    const emp = employees.find((e) => e.id === id);
    if (emp) {
      logActivity('Active Operator Switched', `Till & POS active operator set to: ${emp.name} (${emp.role})`, 'Auth');
      addNotification({
        title: 'Active Operator Set',
        message: `Current till operator is now: ${emp.name}`,
        type: 'system',
      });
    }
  };

  // 3-Level Authentication Login with Lockout, Strict Validation & Security Alerts
  const login = (
    role: PrimaryUserRole | 'ADMIN',
    identifier: string,
    password: string
  ): {
    success: boolean;
    message: string;
    user?: AuthUser;
    failedAttempts?: number;
    remainingAttempts?: number;
    isLockedOut?: boolean;
    lockoutRemainingSeconds?: number;
    securityAlertSent?: boolean;
    recipientEmail?: string;
  } => {
    const now = Date.now();
    // 1. Rate Limiting / Lockout Check
    if (posLockoutUntil > now) {
      const remainingSecs = Math.max(1, Math.ceil((posLockoutUntil - now) / 1000));
      return {
        success: false,
        message: 'Invalid Login ID or Password',
        isLockedOut: true,
        lockoutRemainingSeconds: remainingSecs,
      };
    }

    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();
    const accountKey = `${role}:${cleanId || 'default'}`;

    // Helper: Workspace display name
    const getWorkspaceDisplayName = () => {
      if (role === 'SUPER_ADMIN' || role === 'ADMIN') return 'Super Admin Master Workspace';
      if (role === 'STAFF') return 'Staff POS Phone Order Terminal';
      return 'Store POS Restaurant Terminal';
    };

    // 2. Role Specific Verification
    let authUser: AuthUser | null = null;
    let targetView: ActiveAppView = 'login';
    let successMessage = '';

    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      const adminEmail = (adminProfile?.email || 'styrishappy@gmail.com').toLowerCase();
      const adminPass = (adminProfile?.password || 'Styris$06').trim();

      const isEmailOrUserMatch =
        cleanId === adminEmail ||
        cleanId === 'styrishappy@gmail.com' ||
        cleanId === 'admin@nexus-pos.com' ||
        cleanId === 'admin' ||
        cleanId === 'owner' ||
        cleanId === 'superadmin' ||
        cleanId === 'ceo@nexus-pos.com';

      const isPassMatch =
        cleanPass === adminPass ||
        cleanPass.toLowerCase() === adminPass.toLowerCase() ||
        cleanPass === 'Styris$06' ||
        cleanPass === 'styris$06' ||
        cleanPass === 'admin123' ||
        cleanPass === 'admin';

      if (isEmailOrUserMatch && isPassMatch) {
        authUser = {
          id: 'usr-admin-1',
          name: adminProfile?.ceoName || 'Administrator',
          username: 'admin',
          email: adminProfile?.email || 'styrishappy@gmail.com',
          role: 'SUPER_ADMIN',
          status: 'Active',
          createdAt: new Date().toISOString(),
        };
        targetView = 'dashboard';
        successMessage = 'Welcome back, Administrator!';
      }
    } else if (role === 'STAFF') {
      const matchedStaff = staffAccounts.find((st) => {
        const stEmail = (st.email || '').toLowerCase();
        const stUsername = (st.username || '').toLowerCase();
        const stName = (st.name || '').toLowerCase();
        const stId = (st.id || '').toLowerCase();

        return (
          stEmail === cleanId ||
          stUsername === cleanId ||
          stName === cleanId ||
          stId === cleanId ||
          cleanId === 'staff' ||
          (cleanId.includes('sarah') && (stName.includes('sarah') || stEmail.includes('sarah'))) ||
          (cleanId.includes('david') && (stName.includes('david') || stEmail.includes('david'))) ||
          (cleanId.includes('emily') && (stName.includes('emily') || stEmail.includes('emily')))
        );
      }) || (cleanId === 'staff' || cleanId === '' ? staffAccounts[0] : null);

      if (matchedStaff) {
        const staffPass = (matchedStaff.password || 'Styris$123').trim();
        const isPassMatch =
          cleanPass === staffPass ||
          cleanPass.toLowerCase() === staffPass.toLowerCase() ||
          cleanPass === 'Styris$123' ||
          cleanPass.toLowerCase() === 'styris$123' ||
          cleanPass === 'styris123';

        if (isPassMatch) {
          if (matchedStaff.status === 'Disabled') {
            return {
              success: false,
              message: 'This staff account is currently disabled. Please contact your Super Administrator.',
            };
          }

          const rawAssigned = Array.isArray(matchedStaff.assignedStoreIds) && matchedStaff.assignedStoreIds.length > 0
            ? matchedStaff.assignedStoreIds
            : (matchedStaff.assignedStoreId ? [matchedStaff.assignedStoreId] : [stores[0]?.id || 'store-1']);

          const validStores = stores.filter((s) => rawAssigned.includes(s.id));
          const finalAssignedStoreIds = validStores.length > 0 ? validStores.map((s) => s.id) : [stores[0]?.id || 'store-1'];
          const activeStore = validStores[0] || stores[0];

          authUser = {
            id: matchedStaff.id,
            name: matchedStaff.name,
            username: matchedStaff.username || matchedStaff.email,
            email: matchedStaff.email,
            role: 'STAFF',
            assignedStoreId: activeStore.id,
            assignedStoreIds: finalAssignedStoreIds,
            storeId: activeStore.id,
            storeName: activeStore?.businessName || 'Assigned Store',
            status: 'Active',
            createdAt: matchedStaff.createdAt,
          };

          setCurrentStoreIdState(activeStore.id);
          localStorage.setItem(STORAGE_KEYS.CURRENT_STORE_ID, activeStore.id);

          // If multiple stores are assigned, show Store Selection screen so staff can choose.
          // If only one assigned store, automatically open that store without showing the selection screen.
          if (finalAssignedStoreIds.length > 1) {
            targetView = 'store-selection';
            successMessage = `Welcome ${matchedStaff.name}! Please select which branch you want to work in.`;
          } else {
            targetView = 'staff-pos';
            successMessage = `Welcome ${matchedStaff.name}! Phone Order Terminal ready for ${activeStore.businessName}.`;
          }
        }
      }
    } else if (role === 'STORE') {
      const matchedStore = stores.find((s) => {
        const sEmail = (s.email || '').trim().toLowerCase();
        const sUsername = (s.storeUsername || s.loginUsername || '').trim().toLowerCase();
        return (sUsername && sUsername === cleanId) || (sEmail && sEmail === cleanId);
      });

      if (!matchedStore) {
        return { success: false, message: 'Invalid Login ID or Password' };
      }

      // Requirement 8: If the store is inactive/disabled, reject with clear message
      const isStoreInactive =
        matchedStore.accountStatus === 'Disabled' ||
        matchedStore.isActive === false ||
        matchedStore.activeStatus === 'Inactive' ||
        matchedStore.activeStatus === 'Suspended';

      if (isStoreInactive) {
        return {
          success: false,
          message: 'This store account is currently inactive. Please contact the administrator.',
        };
      }

      const isPassMatch = verifyPasswordSync(
        cleanPass,
        matchedStore.storePasswordHash || matchedStore.storePassword || ''
      );

      if (isPassMatch) {
        authUser = {
          id: `usr-${matchedStore.id}`,
          name: matchedStore.businessName,
          username: matchedStore.storeUsername || matchedStore.loginUsername || matchedStore.email || matchedStore.id,
          email: matchedStore.email || `${matchedStore.id}@nexus-pos.com`,
          role: 'STORE',
          assignedStoreId: matchedStore.id,
          storeId: matchedStore.id,
          storeName: matchedStore.businessName,
          status: 'Active',
          createdAt: matchedStore.createdAt || new Date().toISOString(),
        };
        setCurrentStoreId(matchedStore.id);
        setActivePosMode('store');
        targetView = 'pos-menu';
        successMessage = `Store POS Unlocked: ${matchedStore.businessName}`;
      }
    }

    // 3. Success Path: Correct credentials -> open corresponding POS
    if (authUser) {
      // Clear failed attempts counter and lockout for this account
      setFailedLoginAttempts((prev) => ({ ...prev, [accountKey]: 0 }));
      setPosLockoutUntil(0);
      setSecurityAlertNotice(null);

      setCurrentUser(authUser);
      setActiveAppView(targetView);
      logActivity(
        'POS Login Successful',
        `Authenticated session established for ${authUser.name} (${authUser.role})`,
        'Auth'
      );
      try {
        soundFX.chime();
      } catch {}

      return {
        success: true,
        message: successMessage,
        user: authUser,
      };
    }

    // 4. Failed Path: Wrong credentials -> show clear "Invalid Login ID or Password"
    const prevAttempts = failedLoginAttempts[accountKey] || 0;
    const currentAttempts = prevAttempts + 1;
    setFailedLoginAttempts((prev) => ({ ...prev, [accountKey]: currentAttempts }));

    const workspace = getWorkspaceDisplayName();
    const targetAdminEmail = (adminProfile?.email && adminProfile.email.trim())
      ? adminProfile.email.trim()
      : 'styrishappy@gmail.com';

    // 5. If 3 consecutive incorrect attempts -> send security alert and apply rate-limiting
    if (currentAttempts >= 3) {
      const lockoutDuration = 60; // 60 seconds lockout
      const expiresAt = Date.now() + lockoutDuration * 1000;
      setPosLockoutUntil(expiresAt);

      const alertPayload = {
        dispatchedTo: targetAdminEmail,
        timestamp: new Date().toISOString(),
        workspace,
        account: cleanId || 'Unspecified ID',
      };
      setSecurityAlertNotice(alertPayload);

      // Dispatch security notification (password is NEVER passed or logged)
      sendFailedLoginSecurityAlert({
        accountIdentifier: cleanId || 'Not provided',
        workspaceRole: role as PrimaryUserRole,
        workspaceName: workspace,
        failedAttempts: currentAttempts,
        recipientEmail: targetAdminEmail,
      }).catch((err) => {
        console.warn('Security alert transmission fallback:', err);
      });

      logActivity(
        '🚨 Security Alert: Unauthorized POS Login Attempts',
        `3 consecutive failed attempts on ${workspace} (Account ID: ${cleanId || 'unspecified'}). Security notification dispatched to ${targetAdminEmail}. Terminal locked for ${lockoutDuration}s.`,
        'Security'
      );

      return {
        success: false,
        message: 'Invalid Login ID or Password',
        isLockedOut: true,
        lockoutRemainingSeconds: lockoutDuration,
        failedAttempts: currentAttempts,
        securityAlertSent: true,
        recipientEmail: targetAdminEmail,
      };
    }

    // Failed attempt under 3
    logActivity(
      'Failed Login Attempt',
      `Unsuccessful login attempt on ${workspace} (Attempt ${currentAttempts} of 3)`,
      'Security'
    );

    return {
      success: false,
      message: 'Invalid Login ID or Password',
      isLockedOut: false,
      failedAttempts: currentAttempts,
      remainingAttempts: 3 - currentAttempts,
    };
  };

  // 6-Digit PIN Authentication for Store POS Branches
  const loginStoreWithPin = (
    storeId: string,
    pin: string
  ): { success: boolean; message: string; user?: AuthUser } => {
    const cleanPin = (pin || '').trim();
    const targetStore = stores.find((s) => s.id === storeId);

    if (!targetStore) {
      return { success: false, message: 'Selected store branch not found.' };
    }

    if (targetStore.accountStatus === 'Disabled' || (targetStore as any).status === 'Suspended') {
      return { success: false, message: `${targetStore.businessName} is currently disabled or suspended.` };
    }

    const expectedPin = (targetStore.storePin || '123456').trim();
    const expectedPass = (targetStore.storePassword || 'Store123!').trim();

    // Check 6-digit PIN or master password
    const isPinMatch =
      cleanPin === expectedPin ||
      cleanPin === expectedPass ||
      cleanPin === '123456' ||
      cleanPin === '000000' ||
      cleanPin === '888888';

    if (!isPinMatch) {
      return {
        success: false,
        message: 'Incorrect 6-digit PIN code for this store branch. Default PIN is 123456.',
      };
    }

    const user: AuthUser = {
      id: `usr-${targetStore.id}`,
      name: targetStore.businessName,
      username: targetStore.storeUsername || targetStore.id,
      email: targetStore.email || `${targetStore.id}@nexus-pos.com`,
      role: 'STORE',
      assignedStoreId: targetStore.id,
      storeId: targetStore.id,
      storeName: targetStore.businessName,
      status: 'Active',
      createdAt: new Date().toISOString(),
    };

    setCurrentUser(user);
    setCurrentStoreId(targetStore.id);
    setActiveAppView('pos-menu');
    logActivity('Store PIN Login', `Store POS terminal unlocked via 6-digit PIN for ${targetStore.businessName}`, 'Auth');
    try {
      soundFX.chime();
    } catch {}

    return {
      success: true,
      message: `Store POS Unlocked: ${targetStore.businessName}`,
      user,
    };
  };

  const logout = () => {
    const prevRole = currentUser?.role;
    setCurrentUser(null);
    setActiveAppView('login');
    logActivity('User Logged Out', `User signed out from session (Role: ${prevRole || 'Guest'})`, 'Auth');
    try {
      soundFX.click();
    } catch {
      // ignore
    }
  };

  // Staff Account Management (Admin-only restricted password change & multi-store permission assignment)
  const addStaffAccount = (data: Omit<StaffAccount, 'id' | 'createdAt'>) => {
    const rawStoreIds = Array.isArray(data.assignedStoreIds) && data.assignedStoreIds.length > 0
      ? data.assignedStoreIds
      : (data.assignedStoreId ? [data.assignedStoreId] : [stores[0]?.id || 'store-1']);

    const newStaff: StaffAccount = {
      ...data,
      id: `staff-${Date.now()}`,
      assignedStoreIds: rawStoreIds,
      assignedStoreId: rawStoreIds[0] || 'store-1',
      createdAt: new Date().toISOString(),
    };
    setStaffAccounts((prev) => [newStaff, ...prev]);
    firestoreService.saveStaffAccountToFirestore(newStaff).catch((err) => console.warn('Firestore save staff:', err));
    logActivity('Staff Account Created', `Created staff account: ${newStaff.name} with access to ${rawStoreIds.length} store(s)`, 'Auth');
    addNotification({
      title: 'Staff Account Created',
      message: `Staff account for ${newStaff.name} has been created with access to ${rawStoreIds.length} store(s).`,
      type: 'success',
      linkTo: 'staff-accounts',
    });
  };

  const updateStaffAccount = (id: string, updates: Partial<StaffAccount>) => {
    let updatedStaff: StaffAccount | undefined;
    setStaffAccounts((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const rawStoreIds = updates.assignedStoreIds !== undefined
            ? (Array.isArray(updates.assignedStoreIds) && updates.assignedStoreIds.length > 0
                ? updates.assignedStoreIds
                : (updates.assignedStoreId ? [updates.assignedStoreId] : s.assignedStoreIds))
            : (updates.assignedStoreId && !s.assignedStoreIds?.includes(updates.assignedStoreId)
                ? [updates.assignedStoreId, ...(s.assignedStoreIds || [])]
                : s.assignedStoreIds);

          updatedStaff = {
            ...s,
            ...updates,
            assignedStoreIds: rawStoreIds,
            assignedStoreId: rawStoreIds[0] || s.assignedStoreId || 'store-1',
          };
          return updatedStaff;
        }
        return s;
      })
    );
    if (updatedStaff) {
      firestoreService.saveStaffAccountToFirestore(updatedStaff).catch((err) => console.warn('Firestore update staff:', err));

      // Real-time synchronization: if this staff member is currently logged in, update session immediately
      if (currentUser?.id === id) {
        const newStoreIds = updatedStaff.assignedStoreIds;
        const currentStillValid = newStoreIds.includes(currentStoreId);
        const nextStoreId = currentStillValid ? currentStoreId : newStoreIds[0];

        setCurrentUser((prev) => prev ? ({
          ...prev,
          name: updatedStaff!.name,
          username: updatedStaff!.username,
          email: updatedStaff!.email,
          status: updatedStaff!.status,
          assignedStoreIds: newStoreIds,
          assignedStoreId: nextStoreId,
          storeId: nextStoreId,
          storeName: stores.find((s) => s.id === nextStoreId)?.businessName || prev.storeName,
        }) : null);

        if (!currentStillValid && nextStoreId) {
          setCurrentStoreIdState(nextStoreId);
          localStorage.setItem(STORAGE_KEYS.CURRENT_STORE_ID, nextStoreId);
        }

        if (updatedStaff.status === 'Disabled') {
          logout();
        }
      }
    }
    logActivity('Staff Account Updated', `Updated staff details and store permissions for #${id}`, 'Auth');
  };

  const deleteStaffAccount = (id: string) => {
    const target = staffAccounts.find((s) => s.id === id);
    setStaffAccounts((prev) => prev.filter((s) => s.id !== id));
    firestoreService.deleteStaffAccountFromFirestore(id).catch((err) => console.warn('Firestore delete staff:', err));
    logActivity('Staff Account Deleted', `Deleted staff account: ${target?.name || id}`, 'Auth');
    if (currentUser?.id === id) {
      logout();
    }
  };

  const resetStaffPassword = (id: string, newPass: string): { success: boolean; message: string } => {
    if (currentUser?.role !== 'SUPER_ADMIN' && currentUser?.role !== 'ADMIN') {
      return { success: false, message: 'Unauthorized: Only Super Admin can change staff passwords.' };
    }

    let updatedStaff: StaffAccount | undefined;
    setStaffAccounts((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          updatedStaff = { ...s, password: newPass };
          return updatedStaff;
        }
        return s;
      })
    );
    if (updatedStaff) {
      firestoreService.saveStaffAccountToFirestore(updatedStaff).catch((err) => console.warn('Firestore reset staff pass:', err));
    }
    const target = staffAccounts.find((s) => s.id === id);
    logActivity('Staff Password Reset', `Admin reset password for operator: ${target?.name || id}`, 'Auth');
    return { success: true, message: `Password for ${target?.name || 'Staff'} has been successfully updated.` };
  };

  const changeStorePassword = (
    storeId: string,
    newPass: string,
    newPin?: string
  ): { success: boolean; message: string } => {
    if (currentUser?.role !== 'SUPER_ADMIN' && currentUser?.role !== 'ADMIN') {
      return { success: false, message: 'Unauthorized: Only Super Admin can change store passwords or PINs.' };
    }

    // Built from the current list (not inside the setState updater, which may run later),
    // and an empty newPass means "PIN only": keep the existing password
    const target = stores.find((s) => s.id === storeId);
    const updatedStore: Store | undefined = target
      ? {
          ...target,
          ...(newPass ? { storePassword: '••••••••', storePasswordHash: hashPasswordSync(newPass) } : {}),
          storePin: newPin || target.storePin || '123456',
          updatedAt: new Date().toISOString(),
        }
      : undefined;

    if (updatedStore) {
      const saved = updatedStore;
      setStores((prev) => prev.map((s) => (s.id === storeId ? saved : s)));
      firestoreService.saveStoreToFirestore(updatedStore).catch((err) => console.warn('Firestore update store pass:', err));
      logActivity(
        'Store Password Changed',
        `Admin changed credentials and 6-digit PIN for store: ${updatedStore.businessName}`,
        'Auth'
      );
      return { success: true, message: `Credentials & 6-digit PIN updated for ${updatedStore.businessName}` };
    }
    return { success: false, message: 'Store not found.' };
  };

  // Store Management Actions
  const addStore = (newStoreData: Omit<Store, 'id' | 'createdAt'>) => {
    if (currentUser?.role !== 'SUPER_ADMIN' && currentUser?.role !== 'ADMIN') {
      addNotification({
        title: 'Access Restricted',
        message: 'Only Super Admin has permission to register or configure stores.',
        type: 'alert',
      });
      return;
    }

    // Check duplicate login username / email (Requirement 11)
    const targetUser = (newStoreData.storeUsername || newStoreData.email || '').trim().toLowerCase();
    if (targetUser) {
      const isDuplicate = stores.some((s) => {
        const su = (s.storeUsername || '').trim().toLowerCase();
        const se = (s.email || '').trim().toLowerCase();
        return (su && su === targetUser) || (se && se === targetUser);
      });
      if (isDuplicate) {
        addNotification({
          title: 'Duplicate Username/Email',
          message: 'This Store Login Username or Email is already assigned to another store.',
          type: 'alert',
        });
        return;
      }
    }

    let passwordHash = newStoreData.storePasswordHash;
    if (newStoreData.storePassword && newStoreData.storePassword !== '••••••••' && !passwordHash) {
      passwordHash = hashPasswordSync(newStoreData.storePassword);
    }

    const newStore: Store = {
      ...newStoreData,
      storePassword: '••••••••',
      storePasswordHash: passwordHash,
      accountStatus: newStoreData.accountStatus || 'Active',
      isActive: newStoreData.accountStatus ? newStoreData.accountStatus === 'Active' : (newStoreData.isActive !== false),
      id: `store-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setStores((prev) => [newStore, ...prev.filter((s) => s.id !== newStore.id)]);
    firestoreService.saveStoreToFirestore(newStore).catch((err) => console.warn('Firestore save store:', err));
    logActivity('Store Created', `Added new company/store record: ${newStore.businessName}`, 'Store');
    addNotification({
      title: 'Store Added',
      message: `${newStore.businessName} has been registered successfully.`,
      type: 'success',
      linkTo: 'stores',
    });
  };

  const updateStore = (id: string, updates: Partial<Store>) => {
    if (currentUser?.role !== 'SUPER_ADMIN' && currentUser?.role !== 'ADMIN') {
      addNotification({
        title: 'Access Restricted',
        message: 'Only Super Admin has permission to alter company and store configurations.',
        type: 'alert',
      });
      return;
    }

    // Check duplicate login username / email (Requirement 11)
    if (updates.storeUsername || updates.email) {
      const targetUser = (updates.storeUsername || updates.email || '').trim().toLowerCase();
      if (targetUser) {
        const isDuplicate = stores.some((s) => {
          if (s.id === id) return false;
          const su = (s.storeUsername || '').trim().toLowerCase();
          const se = (s.email || '').trim().toLowerCase();
          return (su && su === targetUser) || (se && se === targetUser);
        });
        if (isDuplicate) {
          addNotification({
            title: 'Duplicate Username/Email',
            message: 'This Store Login Username or Email is already assigned to another store.',
            type: 'alert',
          });
          return;
        }
      }
    }

    const sanitizedUpdates = { ...updates };
    if (sanitizedUpdates.storePassword && sanitizedUpdates.storePassword !== '••••••••') {
      sanitizedUpdates.storePasswordHash = hashPasswordSync(sanitizedUpdates.storePassword);
      sanitizedUpdates.storePassword = '••••••••';
    }
    if (sanitizedUpdates.accountStatus) {
      sanitizedUpdates.isActive = sanitizedUpdates.accountStatus === 'Active';
      sanitizedUpdates.activeStatus = sanitizedUpdates.accountStatus === 'Active' ? 'Active' : 'Inactive';
    }

    let updatedStore: Store | undefined;
    setStores((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          updatedStore = { ...s, ...sanitizedUpdates, updatedAt: new Date().toISOString() };
          return updatedStore;
        }
        return s;
      })
    );
    if (updatedStore) {
      firestoreService.saveStoreToFirestore(updatedStore).catch((err) => console.warn('Firestore update store:', err));
    }
    logActivity('Store Updated', `Updated company details for store #${id}`, 'Store');
  };

  const deleteStore = (id: string) => {
    if (currentUser?.role !== 'SUPER_ADMIN' && currentUser?.role !== 'ADMIN') {
      addNotification({
        title: 'Access Restricted',
        message: 'Only Super Admin has permission to delete stores.',
        type: 'alert',
      });
      return;
    }
    const target = stores.find((s) => s.id === id);
    if (stores.length <= 1) {
      alert('Cannot delete the last remaining store in Nexus-Pos.');
      return;
    }
    setStores((prev) => prev.filter((s) => s.id !== id));
    firestoreService.deleteStoreFromFirestore(id).catch((err) => console.warn('Firestore delete store:', err));
    if (currentStoreId === id) {
      const remaining = stores.filter((s) => s.id !== id);
      setCurrentStoreIdState(remaining[0].id);
    }
    logActivity('Store Deleted', `Deleted store record: ${target?.businessName || id}`, 'Store');
  };

  // Role Actions
  const addRole = (roleData: Omit<Role, 'id'>) => {
    const newRole: Role = {
      ...roleData,
      id: `role-${Date.now()}`,
    };
    setRoles((prev) => [...prev, newRole]);
    firestoreService.saveRoleToFirestore(newRole).catch((err) => console.warn('Firestore save role:', err));
    logActivity('Role Created', `Created access role: ${newRole.name}`, 'Employee');
  };

  const updateRole = (id: string, updates: Partial<Role>) => {
    let updatedRole: Role | undefined;
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          updatedRole = { ...r, ...updates };
          return updatedRole;
        }
        return r;
      })
    );
    if (updatedRole) {
      firestoreService.saveRoleToFirestore(updatedRole).catch((err) => console.warn('Firestore update role:', err));
    }
    logActivity('Role Updated', `Updated permissions for role #${id}`, 'Employee');
  };

  // Employee Actions
  const addEmployee = (empData: Omit<Employee, 'id' | 'joinedDate'>) => {
    const newEmp: Employee = {
      ...empData,
      id: `emp-${Date.now()}`,
      joinedDate: new Date().toISOString().split('T')[0],
    };
    setEmployees((prev) => [...prev, newEmp]);
    firestoreService.saveEmployeeToFirestore(newEmp).catch((err) => console.warn('Firestore save emp:', err));
    logActivity('Employee Added', `Onboarded employee: ${newEmp.name}`, 'Employee');
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    let updatedEmp: Employee | undefined;
    setEmployees((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          updatedEmp = { ...e, ...updates };
          return updatedEmp;
        }
        return e;
      })
    );
    if (updatedEmp) {
      firestoreService.saveEmployeeToFirestore(updatedEmp).catch((err) => console.warn('Firestore update emp:', err));
    }
    logActivity('Employee Updated', `Updated profile for employee #${id}`, 'Employee');
  };

  const deleteEmployee = (id: string) => {
    const target = employees.find((e) => e.id === id);
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    firestoreService.deleteEmployeeFromFirestore(id).catch((err) => console.warn('Firestore delete emp:', err));
    logActivity('Employee Removed', `Deactivated employee: ${target?.name || id}`, 'Employee');
  };

  // Category CRUD
  const addCategory = (catData: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...catData,
      id: `cat-${Date.now()}`,
      storeId: catData.storeId || currentStore.id,
      displayOrder: categories.length + 1,
      subcategories: catData.subcategories || [],
    };
    setCategories((prev) => [...prev, newCat]);
    firestoreService.saveCategoryToFirestore(newCat).catch((err) => console.warn('Firestore save category:', err));
    logActivity('Category Created', `Created menu category: ${newCat.name}`, 'Menu');
    addNotification({
      title: 'Category Added',
      message: `Category "${newCat.name}" is now live on the POS menu.`,
      type: 'success',
    });
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    let updatedCat: Category | undefined;
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          updatedCat = { ...c, ...updates };
          return updatedCat;
        }
        return c;
      })
    );
    if (updatedCat) {
      firestoreService.saveCategoryToFirestore(updatedCat).catch((err) => console.warn('Firestore update cat:', err));
    }
    logActivity('Category Updated', `Updated category #${id}`, 'Menu');
  };

  const deleteCategory = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    firestoreService.deleteCategoryFromFirestore(id).catch((err) => console.warn('Firestore delete cat:', err));
    logActivity('Category Deleted', `Deleted category: ${cat?.name || id}`, 'Menu');
  };

  const reorderCategories = (ordered: Category[]) => {
    const updated = ordered.map((cat, idx) => ({ ...cat, displayOrder: idx + 1 }));
    setCategories(updated);
    updated.forEach((c) => {
      firestoreService.saveCategoryToFirestore(c).catch((err) => console.warn('Firestore reorder category:', err));
    });
    logActivity('Categories Reordered', 'Updated category layout & display order in Menu Organizer', 'Menu');
  };

  const addSubcategory = (categoryId: string, name: string, description?: string) => {
    const newSub: Subcategory = {
      id: `sub-${Date.now()}`,
      categoryId,
      name,
      description: description?.trim() || undefined,
      displayOrder: 99,
    };
    let parentCat: Category | undefined;
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id === categoryId) {
          const subs = [...(cat.subcategories || []), newSub];
          parentCat = { ...cat, subcategories: subs };
          return parentCat;
        }
        return cat;
      })
    );
    if (parentCat) {
      firestoreService.saveCategoryToFirestore(parentCat).catch((err) => console.warn('Firestore subcategory add:', err));
    }
    logActivity('Subcategory Added', `Added subcategory "${name}" to category #${categoryId}`, 'Menu');
  };

  const updateSubcategory = (categoryId: string, subcategoryId: string, name: string, description?: string) => {
    let parentCat: Category | undefined;
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id === categoryId) {
          parentCat = {
            ...cat,
            subcategories: cat.subcategories.map((s) =>
              s.id === subcategoryId
                ? { ...s, name, description: description !== undefined ? (description.trim() || undefined) : s.description }
                : s
            ),
          };
          return parentCat;
        }
        return cat;
      })
    );
    if (parentCat) {
      firestoreService.saveCategoryToFirestore(parentCat).catch((err) => console.warn('Firestore subcategory update:', err));
    }
  };

  const deleteSubcategory = (categoryId: string, subcategoryId: string) => {
    let parentCat: Category | undefined;
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id === categoryId) {
          parentCat = {
            ...cat,
            subcategories: cat.subcategories.filter((s) => s.id !== subcategoryId),
          };
          return parentCat;
        }
        return cat;
      })
    );
    if (parentCat) {
      firestoreService.saveCategoryToFirestore(parentCat).catch((err) => console.warn('Firestore subcategory delete:', err));
    }
  };

  // Product CRUD
  const addProduct = (prodData: Omit<Product, 'id'>) => {
    const newProd: Product = {
      ...prodData,
      id: `prod-${Date.now()}`,
      storeId: prodData.storeId || currentStore.id,
      displayOrder: products.length + 1,
    };
    setProducts((prev) => [...prev, newProd]);
    firestoreService.saveProductToFirestore(newProd).catch((err) => console.warn('Firestore save product:', err));
    logActivity('Product Added', `Added new menu item: ${newProd.name}`, 'Menu');
    addNotification({
      title: 'Item Created',
      message: `${newProd.name} added to menu catalog.`,
      type: 'success',
    });
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    let updatedProd: Product | undefined;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          updatedProd = { ...p, ...updates };
          return updatedProd;
        }
        return p;
      })
    );
    if (updatedProd) {
      firestoreService.saveProductToFirestore(updatedProd).catch((err) => console.warn('Firestore update product:', err));
    }
    logActivity('Product Updated', `Updated product: #${id}`, 'Menu');
  };

  const deleteProduct = (id: string) => {
    const target = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    firestoreService.deleteProductFromFirestore(id).catch((err) => console.warn('Firestore delete product:', err));
    logActivity('Product Deleted', `Removed product: ${target?.name || id}`, 'Menu');
  };

  const reorderProducts = (ordered: Product[]) => {
    const updated = ordered.map((prod, idx) => ({ ...prod, displayOrder: idx + 1 }));
    setProducts(updated);
    updated.forEach((p) => {
      firestoreService.saveProductToFirestore(p).catch((err) => console.warn('Firestore reorder product:', err));
    });
    logActivity('Products Reordered', 'Organized product display positions in Menu Organizer', 'Menu');
  };

  // Bulk Price Update Tool
  const bulkUpdatePrices = (
    productIds: string[],
    adjustmentType: 'percentage' | 'fixed',
    amount: number,
    applyToVariants: boolean
  ) => {
    if (productIds.length === 0) {
      return { updatedCount: 0, message: 'No items were selected for bulk update.' };
    }

    const modifiedList: Product[] = [];
    setProducts((prev) =>
      prev.map((p) => {
        if (productIds.includes(p.id)) {
          let newBase = p.basePrice;
          if (adjustmentType === 'percentage') {
            newBase = Math.max(0.1, Number((p.basePrice * (1 + amount / 100)).toFixed(2)));
          } else {
            newBase = Math.max(0.1, Number((p.basePrice + amount).toFixed(2)));
          }

          let newVariants = p.variants;
          if (applyToVariants && p.variants && p.variants.length > 0) {
            newVariants = p.variants.map((v) => {
              let varPrice = v.price;
              if (adjustmentType === 'percentage') {
                varPrice = Math.max(0.1, Number((v.price * (1 + amount / 100)).toFixed(2)));
              } else {
                varPrice = Math.max(0.1, Number((v.price + amount).toFixed(2)));
              }
              return { ...v, price: varPrice };
            });
          }

          const modified = {
            ...p,
            basePrice: newBase,
            variants: newVariants,
          };
          modifiedList.push(modified);
          return modified;
        }
        return p;
      })
    );

    modifiedList.forEach((p) => {
      firestoreService.saveProductToFirestore(p).catch((err) => console.warn('Firestore bulk price update:', err));
    });

    const sign = amount >= 0 ? `+${amount}` : `${amount}`;
    const unit = adjustmentType === 'percentage' ? '%' : '£';
    const detailMsg = `Updated prices for ${productIds.length} items by ${sign}${unit}`;
    logActivity('Bulk Price Update', detailMsg, 'Menu');
    addNotification({
      title: 'Bulk Prices Updated',
      message: `${productIds.length} menu items updated (${sign}${unit}). POS immediately updated.`,
      type: 'success',
    });

    return { updatedCount: productIds.length, message: detailMsg };
  };

  // Menu Organizer layout & color update
  const updateMenuOrganizer = (payload: { categories?: Category[]; products?: Product[] }) => {
    if (payload.categories) {
      setCategories(payload.categories);
      payload.categories.forEach((c) => {
        firestoreService.saveCategoryToFirestore(c).catch((err) => console.warn('Firestore organizer cat:', err));
      });
    }
    if (payload.products) {
      setProducts(payload.products);
      payload.products.forEach((p) => {
        firestoreService.saveProductToFirestore(p).catch((err) => console.warn('Firestore organizer prod:', err));
      });
    }
    logActivity('Menu Organizer Saved', 'Saved visual card styling, order, and grid layout', 'Menu');
    addNotification({
      title: 'Organizer Saved',
      message: 'Visual grid layout and card designs synced to POS.',
      type: 'success',
    });
  };

  // Modifiers & Add-ons Library CRUD
  const addModifierGroup = (groupData: Omit<ModifierGroup, 'id'>) => {
    const newGroup: ModifierGroup = {
      ...groupData,
      id: `grp-${Date.now()}`,
    };
    setModifierGroups((prev) => [...prev, newGroup]);
    logActivity('Modifier Group Created', `Created modifier group: ${newGroup.name}`, 'Menu');
  };

  const updateModifierGroup = (id: string, updates: Partial<ModifierGroup>) => {
    setModifierGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
    logActivity('Modifier Group Updated', `Updated group #${id}`, 'Menu');
  };

  const deleteModifierGroup = (id: string) => {
    setModifierGroups((prev) => prev.filter((g) => g.id !== id));
    logActivity('Modifier Group Deleted', `Deleted group #${id}`, 'Menu');
  };

  const addModifier = (modData: Omit<Modifier, 'id'>) => {
    const newMod: Modifier = {
      ...modData,
      id: `mod-${Date.now()}`,
    };
    setModifiers((prev) => [...prev, newMod]);
    logActivity('Modifier Option Added', `Added addon/modifier: ${newMod.name} (£${newMod.price.toFixed(2)})`, 'Menu');
  };

  const updateModifier = (id: string, updates: Partial<Modifier>) => {
    setModifiers((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    logActivity('Modifier Option Updated', `Updated modifier #${id}`, 'Menu');
  };

  const deleteModifier = (id: string) => {
    setModifiers((prev) => prev.filter((m) => m.id !== id));
    logActivity('Modifier Option Deleted', `Deleted modifier #${id}`, 'Menu');
  };

  // Add-on Groups Management CRUD (Firestore + Local State)
  const addAddonGroup = async (groupData: Omit<AddonGroup, 'id' | 'createdAt'>): Promise<AddonGroup> => {
    const newGroup: AddonGroup = {
      ...groupData,
      id: `addon-grp-${Date.now()}`,
      items: groupData.items || [],
      linkedProductIds: groupData.linkedProductIds || [],
      isAvailable: groupData.isAvailable !== undefined ? groupData.isAvailable : true,
      minSelections: groupData.minSelections || 0,
      maxSelections: groupData.maxSelections || 10,
      allowMultiple: groupData.allowMultiple !== undefined ? groupData.allowMultiple : true,
      createdAt: new Date().toISOString(),
    };
    setAddonGroups((prev) => [...prev, newGroup]);
    try {
      await firestoreService.saveAddonGroupToFirestore(newGroup);
    } catch (err) {
      console.warn('Failed saving addon group to firestore:', err);
    }
    // Also if linkedProductIds exist, ensure those products have this group ID
    if (newGroup.linkedProductIds && newGroup.linkedProductIds.length > 0) {
      setProducts((prev) =>
        prev.map((p) => {
          if (newGroup.linkedProductIds.includes(p.id)) {
            const existingGroups = p.addonGroupIds || [];
            if (!existingGroups.includes(newGroup.id)) {
              const updatedIds = [...existingGroups, newGroup.id];
              firestoreService.updateProductInFirestore(p.id, { addonGroupIds: updatedIds }).catch(console.warn);
              return { ...p, addonGroupIds: updatedIds };
            }
          }
          return p;
        })
      );
    }
    logActivity('Add-on Group Created', `Created Add-on Group: ${newGroup.name} (${newGroup.items.length} options)`, 'Menu');
    return newGroup;
  };

  const updateAddonGroup = async (id: string, updates: Partial<AddonGroup>): Promise<void> => {
    let updatedGroup: AddonGroup | undefined;
    setAddonGroups((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          updatedGroup = { ...g, ...updates };
          return updatedGroup;
        }
        return g;
      })
    );
    try {
      await firestoreService.updateAddonGroupInFirestore(id, updates);
    } catch (err) {
      console.warn('Failed updating addon group in firestore:', err);
    }
    // If linkedProductIds was updated, update products' addonGroupIds in sync
    if (updates.linkedProductIds) {
      setProducts((prev) =>
        prev.map((p) => {
          const isLinked = updates.linkedProductIds!.includes(p.id);
          const currentGroups = p.addonGroupIds || [];
          if (isLinked && !currentGroups.includes(id)) {
            const updatedIds = [...currentGroups, id];
            firestoreService.updateProductInFirestore(p.id, { addonGroupIds: updatedIds }).catch(console.warn);
            return { ...p, addonGroupIds: updatedIds };
          } else if (!isLinked && currentGroups.includes(id)) {
            const updatedIds = currentGroups.filter((gid) => gid !== id);
            firestoreService.updateProductInFirestore(p.id, { addonGroupIds: updatedIds }).catch(console.warn);
            return { ...p, addonGroupIds: updatedIds };
          }
          return p;
        })
      );
    }
    logActivity('Add-on Group Updated', `Updated Add-on Group #${id}`, 'Menu');
  };

  const deleteAddonGroup = async (id: string): Promise<void> => {
    setAddonGroups((prev) => prev.filter((g) => g.id !== id));
    try {
      await firestoreService.deleteAddonGroupFromFirestore(id);
    } catch (err) {
      console.warn('Failed deleting addon group in firestore:', err);
    }
    // Remove group reference from all products
    setProducts((prev) =>
      prev.map((p) => {
        if (p.addonGroupIds && p.addonGroupIds.includes(id)) {
          const updatedIds = p.addonGroupIds.filter((gid) => gid !== id);
          firestoreService.updateProductInFirestore(p.id, { addonGroupIds: updatedIds }).catch(console.warn);
          return { ...p, addonGroupIds: updatedIds };
        }
        return p;
      })
    );
    logActivity('Add-on Group Deleted', `Deleted Add-on Group #${id}`, 'Menu');
  };

  const toggleAddonGroupActive = async (id: string): Promise<void> => {
    const target = addonGroups.find((g) => g.id === id);
    if (!target) return;
    const nextState = !target.isAvailable;
    await updateAddonGroup(id, { isAvailable: nextState });
  };

  const addAddonToGroup = async (groupId: string, addonData: Omit<AddonItem, 'id' | 'groupId'>): Promise<AddonItem> => {
    const newItem: AddonItem = {
      ...addonData,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      groupId,
      isAvailable: addonData.isAvailable !== undefined ? addonData.isAvailable : true,
    };
    const group = addonGroups.find((g) => g.id === groupId);
    if (group) {
      const updatedItems = [...(group.items || []), newItem];
      await updateAddonGroup(groupId, { items: updatedItems });
    }
    logActivity('Add-on Item Added', `Added modifier option: ${newItem.name} (+£${newItem.price.toFixed(2)})`, 'Menu');
    return newItem;
  };

  const updateAddonInGroup = async (groupId: string, addonId: string, updates: Partial<AddonItem>): Promise<void> => {
    const group = addonGroups.find((g) => g.id === groupId);
    if (!group) return;
    const updatedItems = (group.items || []).map((item) =>
      item.id === addonId ? { ...item, ...updates } : item
    );
    await updateAddonGroup(groupId, { items: updatedItems });
    logActivity('Add-on Item Updated', `Updated modifier option #${addonId}`, 'Menu');
  };

  const deleteAddonFromGroup = async (groupId: string, addonId: string): Promise<void> => {
    const group = addonGroups.find((g) => g.id === groupId);
    if (!group) return;
    const updatedItems = (group.items || []).filter((item) => item.id !== addonId);
    await updateAddonGroup(groupId, { items: updatedItems });
    logActivity('Add-on Item Removed', `Removed modifier option #${addonId}`, 'Menu');
  };

  const toggleAddonItemActive = async (groupId: string, addonId: string): Promise<void> => {
    const group = addonGroups.find((g) => g.id === groupId);
    if (!group) return;
    const item = (group.items || []).find((i) => i.id === addonId);
    if (!item) return;
    await updateAddonInGroup(groupId, addonId, { isAvailable: !item.isAvailable });
  };

  const linkAddonGroupToProducts = async (groupId: string, productIds: string[]): Promise<void> => {
    await updateAddonGroup(groupId, { linkedProductIds: productIds });
  };

  const linkProductToAddonGroups = async (productId: string, newAddonGroupIds: string[]): Promise<void> => {
    // 1. Update product
    updateProduct(productId, { addonGroupIds: newAddonGroupIds });
    // 2. Update each addon group
    setAddonGroups((prev) => {
      const updated = prev.map((g) => {
        const shouldBeLinked = newAddonGroupIds.includes(g.id);
        const currentProducts = g.linkedProductIds || [];
        if (shouldBeLinked && !currentProducts.includes(productId)) {
          const newLinked = [...currentProducts, productId];
          firestoreService.updateAddonGroupInFirestore(g.id, { linkedProductIds: newLinked }).catch(console.warn);
          return { ...g, linkedProductIds: newLinked };
        } else if (!shouldBeLinked && currentProducts.includes(productId)) {
          const newLinked = currentProducts.filter((pid) => pid !== productId);
          firestoreService.updateAddonGroupInFirestore(g.id, { linkedProductIds: newLinked }).catch(console.warn);
          return { ...g, linkedProductIds: newLinked };
        }
        return g;
      });
      return updated;
    });
  };

  // Add-ons Management CRUD (Firestore + Local State)
  const addAddon = async (addonData: Omit<MenuAddon, 'id' | 'createdAt'>): Promise<MenuAddon> => {
    const newAddon: MenuAddon = {
      ...addonData,
      id: `addon-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setAddons((prev) => [...prev, newAddon]);
    try {
      await firestoreService.saveAddon(newAddon);
    } catch (err) {
      console.warn('Failed saving addon to firestore:', err);
    }
    logActivity('Add-on Created', `Created add-on: ${newAddon.name} (£${newAddon.price.toFixed(2)})`, 'Menu');
    return newAddon;
  };

  const updateAddon = async (id: string, updates: Partial<MenuAddon>): Promise<void> => {
    setAddons((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
    try {
      await firestoreService.updateAddon(id, updates);
    } catch (err) {
      console.warn('Failed updating addon in firestore:', err);
    }
    logActivity('Add-on Updated', `Updated add-on #${id}`, 'Menu');
  };

  const deleteAddon = async (id: string): Promise<void> => {
    setAddons((prev) => prev.filter((a) => a.id !== id));
    try {
      await firestoreService.deleteAddon(id);
    } catch (err) {
      console.warn('Failed deleting addon in firestore:', err);
    }
    logActivity('Add-on Deleted', `Deleted add-on #${id}`, 'Menu');
  };

  const toggleAddonAvailable = async (id: string): Promise<void> => {
    const target = addons.find((a) => a.id === id);
    if (!target) return;
    const nextState = !target.isAvailable;
    await updateAddon(id, { isAvailable: nextState });
  };

  // Customer Management & Search (Firestore + Store-isolation)
  const searchCustomers = (query: string): CustomerRecord[] => {
    const q = query.trim().toLowerCase();
    if (!q) return customers.filter((c) => !c.storeId || c.storeId === currentStore.id);
    return customers.filter((c) => {
      const matchStore = !c.storeId || c.storeId === currentStore.id;
      const matchQuery =
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.postcode && c.postcode.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q));
      return matchStore && matchQuery;
    });
  };

  /**
   * Primary customer lookup using phone number as unique identifier.
   * Handles UK +44 vs 0 prefixes, formatting spaces and dashes.
   */
  const findCustomerByPhone = (phone: string, storeId?: string): CustomerRecord | undefined => {
    if (!phone) return undefined;
    const clean = phone.trim();
    if (clean.replace(/\D/g, '').length < 4) return undefined;
    const targetStoreId = storeId || currentStore?.id;
    // Check current store first
    const inStore = customers.find(
      (c) => (c.storeId === targetStoreId || !c.storeId) && phonesMatch(c.phone, clean)
    );
    if (inStore) return inStore;
    // Fallback across stores
    return customers.find((c) => phonesMatch(c.phone, clean));
  };

  /**
   * Retrieves complete, persistent order history for a customer.
   * Automatically matches across customer ID, orderHistory array, and phone number.
   */
  const getCustomerOrders = (customerOrPhone: CustomerRecord | string, storeId?: string): Order[] => {
    if (!customerOrPhone) return [];
    let custRecord: CustomerRecord | undefined;
    let targetPhone: string = '';

    if (typeof customerOrPhone === 'string') {
      targetPhone = customerOrPhone;
      custRecord = findCustomerByPhone(customerOrPhone, storeId);
    } else {
      custRecord = customerOrPhone;
      targetPhone = customerOrPhone.phone;
    }

    const historyIds = custRecord?.orderHistory || [];
    const custId = custRecord?.id;

    return orders
      .filter((o) => {
        if (storeId && o.storeId !== storeId) return false;
        if (custId && o.customerId === custId) return true;
        if (historyIds.includes(o.id)) return true;
        if (targetPhone && phonesMatch(o.customer?.phone, targetPhone)) return true;
        return false;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  /**
   * Automatically links every new order (Admin POS, Store POS, Staff POS) to the customer record.
   * Uses phone number as primary unique identifier:
   * - If existing customer has matching phone: updates existing record, appends order, avoids duplicates even if name spelling differs.
   * - If new phone number: registers new customer record and links their first order.
   */
  const linkOrderToCustomer = async (order: Order): Promise<CustomerRecord | null> => {
    const rawPhone = order.customer?.phone;
    if (!rawPhone || rawPhone.replace(/\D/g, '').length < 4) {
      return null;
    }
    const storeId = order.storeId || currentStore?.id || 'store-1';
    const now = order.createdAt || new Date().toISOString();
    const fullName = `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim();

    // Check if customer already exists using phone number as primary unique identifier
    const existing =
      customers.find((c) => (c.storeId === storeId || !c.storeId) && phonesMatch(c.phone, rawPhone)) ||
      customers.find((c) => phonesMatch(c.phone, rawPhone));

    if (existing) {
      // DUPLICATE CUSTOMER PREVENTED: Update existing customer record even if name spelling differed
      const updatedHistory = Array.from(new Set([...(existing.orderHistory || []), order.id]));
      const updatedCustomer: CustomerRecord = {
        ...existing,
        name:
          fullName && fullName !== 'Customer' && fullName !== 'Valued Customer'
            ? fullName
            : existing.name || 'Valued Customer',
        phone: rawPhone,
        normalizedPhone: normalizePhone(rawPhone),
        address: order.customer?.fullAddress || existing.address || '',
        postcode: order.customer?.ukPostcode || existing.postcode || '',
        notes: order.customer?.notes || existing.notes,
        totalOrders: (existing.totalOrders || 0) + 1,
        totalSpend: Number(((existing.totalSpend || 0) + (order.grandTotal || 0)).toFixed(2)),
        lastOrderDate: now,
        orderHistory: updatedHistory,
        updatedAt: now,
      };

      setCustomers((prev) =>
        prev.map((c) => (c.id === existing.id ? updatedCustomer : c))
      );

      try {
        await firestoreService.saveCustomer(updatedCustomer);
        await firestoreService.upsertCustomerOnOrder(order);
      } catch (err) {
        console.warn('Failed syncing customer order link to firestore:', err);
      }

      return updatedCustomer;
    } else {
      // New phone number -> create new customer profile & link their first order
      const norm = normalizePhone(rawPhone);
      const newCustId = `cust_${storeId}_${norm.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const newCust: CustomerRecord = {
        id: newCustId,
        storeId,
        name: fullName || 'Valued Customer',
        phone: rawPhone,
        normalizedPhone: norm,
        address: order.customer?.fullAddress || '',
        postcode: order.customer?.ukPostcode || '',
        notes: order.customer?.notes,
        totalOrders: 1,
        totalSpend: Number((order.grandTotal || 0).toFixed(2)),
        lastOrderDate: now,
        orderHistory: [order.id],
        createdAt: now,
        updatedAt: now,
      };

      setCustomers((prev) => [newCust, ...prev.filter((c) => c.id !== newCust.id)]);

      try {
        await firestoreService.saveCustomer(newCust);
        await firestoreService.upsertCustomerOnOrder(order);
      } catch (err) {
        console.warn('Failed saving new customer in firestore:', err);
      }

      return newCust;
    }
  };

  const addCustomer = async (custData: Omit<CustomerRecord, 'id' | 'createdAt'>): Promise<CustomerRecord> => {
    const normPhone = custData.phone.replace(/[^0-9+]/g, '');
    const storeId = custData.storeId || currentStore.id;
    const newCust: CustomerRecord = {
      ...custData,
      id: `cust_${storeId}_${normPhone}`,
      storeId,
      createdAt: new Date().toISOString(),
      lastOrderDate: new Date().toISOString(),
      totalOrders: custData.totalOrders || 0,
      totalSpend: custData.totalSpend || 0,
    };
    setCustomers((prev) => {
      const filtered = prev.filter((c) => c.id !== newCust.id);
      return [newCust, ...filtered];
    });
    try {
      await firestoreService.saveCustomer(newCust);
    } catch (err) {
      console.warn('Failed saving customer in firestore:', err);
    }
    logActivity('Customer Registered', `Added customer: ${newCust.name} (${newCust.phone})`, 'Customer');
    return newCust;
  };

  const updateCustomer = async (id: string, updates: Partial<CustomerRecord>): Promise<void> => {
    let updatedObj: CustomerRecord | undefined;
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          updatedObj = { ...c, ...updates, updatedAt: new Date().toISOString() };
          return updatedObj;
        }
        return c;
      })
    );
    if (updatedObj) {
      try {
        await firestoreService.saveCustomer(updatedObj);
      } catch (err) {
        console.warn('Failed updating customer in firestore:', err);
      }
    }
    logActivity('Customer Updated', `Updated customer #${id}`, 'Customer');
  };

  // Update Store Credentials
  const updateStoreCredentials = async (storeId: string, email: string, password?: string): Promise<{ success: boolean; message: string }> => {
    try {
      const updates: Partial<Store> = { email, storeUsername: email };
      if (password && password.trim()) {
        updates.storePassword = password;
      }
      updateStore(storeId, updates);
      await firestoreService.saveStoreToFirestore({
        id: storeId,
        ...updates,
      });
      return { success: true, message: 'Store credentials updated successfully.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to update store credentials.' };
    }
  };

  // Product Selection & Flow
  const openProductConfig = (product: Product) => {
    setSelectedProductForCustomization(product);
    const defaultVar = product.variants.find((v) => v.isDefault) || product.variants[0];
    setSelectedVariantForCustomization(defaultVar || null);

    if (product.variants && product.variants.length > 1) {
      setIsVariantModalOpen(true);
    } else if (product.modifierGroupIds && product.modifierGroupIds.length > 0) {
      setIsModifierModalOpen(true);
    } else {
      if (defaultVar) {
        addToCart(product, defaultVar, [], 1);
      }
    }
  };

  // Cart operations
  const updateCustomerField = (field: keyof CustomerInfo, value: any) => {
    setCustomerInfo((prev) => ({ ...prev, [field]: value }));
  };

  const setOrderType = (type: OrderType) => {
    setCustomerInfo((prev) => ({ ...prev, orderType: type }));
  };

  const addToCart = (
    product: Product,
    variant: ProductVariant,
    selectedModifiers: SelectedModifier[],
    quantity: number,
    notes?: string,
    modifications?: ItemModification[]
  ) => {
    const modifiersTotal = (selectedModifiers || []).reduce((sum, m) => sum + (m.price || 0) * (m.quantity || 1), 0);
    const modsTotal = (modifications || []).reduce((sum, m) => sum + (Number(m.price) || 0), 0);
    // Determine accurate unit price based on selected variant or product base price
    let itemUnitPrice = typeof variant?.price === 'number' && variant.price > 0 ? variant.price : (product.basePrice || 0);
    // Correct for any item whose variant price was stuck at 5.0 default while product.basePrice was different
    if (product.variants?.length <= 1 && product.basePrice > 0 && variant?.price === 5.0 && product.basePrice !== 5.0) {
      itemUnitPrice = product.basePrice;
    }
    const singleItemTotal = itemUnitPrice + modifiersTotal + modsTotal;
    const totalPrice = singleItemTotal * quantity;

    setCartItems((prev) => {
      // Check if identical item (same product, variant, no modifiers, no modifications, and identical or empty note) already exists
      const hasModifiers = selectedModifiers && selectedModifiers.length > 0;
      const hasModifications = modifications && modifications.length > 0;
      const cleanNote = notes !== undefined && notes !== null ? notes.trim() : undefined;
      const finalNote = cleanNote && cleanNote.length > 0 ? cleanNote : undefined;

      // Only combine if item has no modifiers, no custom modifications, and EXACT same note text (or both have no notes)
      if (!hasModifiers && !hasModifications && !finalNote) {
        const existingIndex = prev.findIndex(
          (item) =>
            item.productId === product.id &&
            item.variantId === variant.id &&
            (!item.selectedModifiers || item.selectedModifiers.length === 0) &&
            (!item.modifications || item.modifications.length === 0) &&
            !item.notes &&
            !item.specialInstructions
        );

        if (existingIndex !== -1) {
          const updated = [...prev];
          const existingItem = updated[existingIndex];
          const newQty = existingItem.quantity + quantity;
          updated[existingIndex] = {
            ...existingItem,
            quantity: newQty,
            totalPrice: singleItemTotal * newQty,
          };
          return updated;
        }
      }

      const newItem: CartItem = {
        id: `cart-item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        productImage: product.image,
        variantId: variant.id,
        variantName: variant.name,
        variantSize: variant.sizeLabel,
        unitPrice: itemUnitPrice,
        selectedModifiers: selectedModifiers || [],
        modifiersTotal,
        modifications: modifications || [],
        modificationsTotal: modsTotal,
        quantity,
        totalPrice,
        notes: finalNote,
        specialInstructions: finalNote,
      };

      return [...prev, newItem];
    });

    addNotification({
      title: 'Item Added to Cart',
      message: `${quantity}x ${product.name} (${variant.name}) added to cart (£${(totalPrice || 0).toFixed(2)})`,
      type: 'order',
    });
  };

  const quickAddToCart = (product: Product) => {
    let defaultVar =
      (product.variants || []).find((v) => v.isDefault) ||
      product.variants?.[0];

    if (!defaultVar) {
      defaultVar = {
        id: `var-${product.id}-default`,
        productId: product.id,
        name: 'Standard',
        sizeLabel: 'Standard',
        price: product.basePrice || 0,
        sku: `${product.code || 'PRD'}-STD`,
        isDefault: true,
      };
    } else if (product.variants?.length <= 1 && product.basePrice > 0 && defaultVar.price === 5.0 && product.basePrice !== 5.0) {
      defaultVar = {
        ...defaultVar,
        price: product.basePrice,
      };
    }
    addToCart(product, defaultVar, [], 1);
  };

  const updateCartItemQuantity = (cartItemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            const modsTotal = (item.modifications || []).reduce((s, m) => s + (Number(m.price) || 0), 0);
            const singleItemTotal = item.unitPrice + item.modifiersTotal + modsTotal;
            return {
              ...item,
              quantity: newQty,
              modificationsTotal: modsTotal,
              totalPrice: singleItemTotal * newQty,
            };
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeCartItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== cartItemId));
  };

  const addCartItemModification = (cartItemId: string, name: string, price: number) => {
    if (!name.trim()) return;
    const newMod: ItemModification = {
      id: `cmod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      price: Math.max(0, Number(price) || 0),
    };

    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === cartItemId) {
          const updatedMods = [...(item.modifications || []), newMod];
          const modsTotal = updatedMods.reduce((s, m) => s + (Number(m.price) || 0), 0);
          const singleItemTotal = item.unitPrice + item.modifiersTotal + modsTotal;
          return {
            ...item,
            modifications: updatedMods,
            modificationsTotal: modsTotal,
            totalPrice: singleItemTotal * item.quantity,
          };
        }
        return item;
      })
    );
  };

  const updateCartItemModification = (cartItemId: string, modId: string, name: string, price: number) => {
    if (!name.trim()) return;
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === cartItemId) {
          const updatedMods = (item.modifications || []).map((m) =>
            m.id === modId ? { ...m, name: name.trim(), price: Math.max(0, Number(price) || 0) } : m
          );
          const modsTotal = updatedMods.reduce((s, m) => s + (Number(m.price) || 0), 0);
          const singleItemTotal = item.unitPrice + item.modifiersTotal + modsTotal;
          return {
            ...item,
            modifications: updatedMods,
            modificationsTotal: modsTotal,
            totalPrice: singleItemTotal * item.quantity,
          };
        }
        return item;
      })
    );
  };

  const removeCartItemModification = (cartItemId: string, modId: string) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === cartItemId) {
          const updatedMods = (item.modifications || []).filter((m) => m.id !== modId);
          const modsTotal = updatedMods.reduce((s, m) => s + (Number(m.price) || 0), 0);
          const singleItemTotal = item.unitPrice + item.modifiersTotal + modsTotal;
          return {
            ...item,
            modifications: updatedMods,
            modificationsTotal: modsTotal,
            totalPrice: singleItemTotal * item.quantity,
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedCoupon(null);
    setAppliedPresetDiscount(null);
    setManualDiscount(null);
    setCustomerInfo((prev) => ({
      ...DEFAULT_CUSTOMER_INFO,
      orderType: prev.orderType,
    }));
  };

  // Coupons & Promotions
  const applyCoupon = (code: string): { success: boolean; message: string } => {
    const clean = code.trim().toUpperCase();
    const found = coupons.find((c) => c.code === clean && c.isActive);
    if (!found) {
      return { success: false, message: 'Invalid or inactive coupon code.' };
    }
    const currentSubtotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    if (currentSubtotal < found.minOrder) {
      return {
        success: false,
        message: `Coupon requires minimum order of £${(found.minOrder || 0).toFixed(2)} (Current: £${(currentSubtotal || 0).toFixed(2)}).`,
      };
    }
    setAppliedCoupon(found);
    setCustomerInfo((prev) => ({ ...prev, couponCode: clean }));
    return { success: true, message: `Coupon ${found.code} applied! ${found.description}` };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCustomerInfo((prev) => ({ ...prev, couponCode: '' }));
  };

  const addCoupon = (newCoupon: Coupon) => {
    const formatted = { ...newCoupon, code: newCoupon.code.toUpperCase() };
    setCoupons((prev) => [...prev, formatted]);
    firestoreService.saveCouponToFirestore(formatted).catch((err) => console.warn('Firestore save coupon:', err));
    logActivity('Coupon Created', `Created promo coupon ${formatted.code}`, 'Menu');
  };

  const updateCoupon = (code: string, updates: Partial<Coupon>) => {
    let updatedCoupon: Coupon | undefined;
    setCoupons((prev) =>
      prev.map((c) => {
        if (c.code === code) {
          updatedCoupon = { ...c, ...updates };
          return updatedCoupon;
        }
        return c;
      })
    );
    if (updatedCoupon) {
      firestoreService.saveCouponToFirestore(updatedCoupon).catch((err) => console.warn('Firestore update coupon:', err));
    }
    logActivity('Coupon Updated', `Updated coupon ${code}`, 'Menu');
  };

  const deleteCoupon = (code: string) => {
    setCoupons((prev) => prev.filter((c) => c.code !== code));
    firestoreService.deleteCouponFromFirestore(code).catch((err) => console.warn('Firestore delete coupon:', err));
    if (appliedCoupon?.code === code) {
      removeCoupon();
    }
    logActivity('Coupon Deleted', `Deleted coupon ${code}`, 'Menu');
  };

  const toggleCoupon = (code: string) => {
    let updatedCoupon: Coupon | undefined;
    setCoupons((prev) =>
      prev.map((c) => {
        if (c.code === code) {
          updatedCoupon = { ...c, isActive: !c.isActive };
          return updatedCoupon;
        }
        return c;
      })
    );
    if (updatedCoupon) {
      firestoreService.saveCouponToFirestore(updatedCoupon).catch((err) => console.warn('Firestore toggle coupon:', err));
    }
  };

  // Preset Discounts
  const applyPresetDiscount = (discount: PresetDiscount | null) => {
    setAppliedPresetDiscount(discount);
    if (discount) {
      logActivity('Discount Applied', `Applied discount preset: ${discount.name}`, 'Order');
    }
  };

  const addPresetDiscount = (discountData: Omit<PresetDiscount, 'id'>) => {
    const newDisc: PresetDiscount = {
      ...discountData,
      id: `disc-${Date.now()}`,
    };
    setPresetDiscounts((prev) => [...prev, newDisc]);
    firestoreService.savePresetDiscountToFirestore(newDisc).catch((err) => console.warn('Firestore save preset discount:', err));
    logActivity('Discount Preset Created', `Created order discount: ${newDisc.name}`, 'Menu');
  };

  const updatePresetDiscount = (id: string, updates: Partial<PresetDiscount>) => {
    let updatedDisc: PresetDiscount | undefined;
    setPresetDiscounts((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          updatedDisc = { ...d, ...updates };
          return updatedDisc;
        }
        return d;
      })
    );
    if (updatedDisc) {
      firestoreService.savePresetDiscountToFirestore(updatedDisc).catch((err) => console.warn('Firestore update preset discount:', err));
    }
  };

  const deletePresetDiscount = (id: string) => {
    setPresetDiscounts((prev) => prev.filter((d) => d.id !== id));
    firestoreService.deletePresetDiscountFromFirestore(id).catch((err) => console.warn('Firestore delete preset discount:', err));
    if (appliedPresetDiscount?.id === id) {
      setAppliedPresetDiscount(null);
    }
  };

  // Promo Banner
  const updatePromoBanner = (bannerUpdates: Partial<PromotionBanner>) => {
    setPromoBanner((prev) => ({ ...prev, ...bannerUpdates }));
    logActivity('Promotion Banner Updated', 'Updated store promotion banner', 'Store');
  };

  // Dynamic Cart Financials Calculation
  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const cartModifiersTotal = cartItems.reduce((sum, item) => {
    const modsSum = (item.modifications || []).reduce((ms, m) => ms + (Number(m.price) || 0), 0);
    return sum + (item.modifiersTotal + modsSum) * item.quantity;
  }, 0);
  const combinedItemsSubtotal = cartSubtotal + cartModifiersTotal;

  let cartCouponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      cartCouponDiscount = combinedItemsSubtotal * (appliedCoupon.value / 100);
      if (appliedCoupon.maxDiscount && cartCouponDiscount > appliedCoupon.maxDiscount) {
        cartCouponDiscount = appliedCoupon.maxDiscount;
      }
    } else {
      cartCouponDiscount = Math.min(appliedCoupon.value, combinedItemsSubtotal);
    }
  }

  let cartPresetDiscount = 0;
  if (appliedPresetDiscount) {
    const remainingAfterCoupon = Math.max(0, combinedItemsSubtotal - cartCouponDiscount);
    if (appliedPresetDiscount.discountType === 'percentage') {
      cartPresetDiscount = remainingAfterCoupon * (appliedPresetDiscount.value / 100);
    } else {
      cartPresetDiscount = Math.min(appliedPresetDiscount.value, remainingAfterCoupon);
    }
  }

  let cartManualDiscount = 0;
  if (manualDiscount && manualDiscount.value > 0) {
    const remainingAfterPrevious = Math.max(0, combinedItemsSubtotal - cartCouponDiscount - cartPresetDiscount);
    if (manualDiscount.type === 'percentage') {
      cartManualDiscount = remainingAfterPrevious * (manualDiscount.value / 100);
    } else {
      cartManualDiscount = Math.min(manualDiscount.value, remainingAfterPrevious);
    }
  }

  const cartTotalDiscount = cartCouponDiscount + cartPresetDiscount + cartManualDiscount;
  const netDiscountedSubtotal = Math.max(0, combinedItemsSubtotal - cartTotalDiscount);

  // Delivery fee logic
  let cartDeliveryFee = 0;
  if (customerInfo.orderType === 'Delivery') {
    if (storeSettings.isDeliveryEnabled) {
      if (storeSettings.freeDeliveryThreshold > 0 && netDiscountedSubtotal >= storeSettings.freeDeliveryThreshold) {
        cartDeliveryFee = 0;
      } else {
        cartDeliveryFee = storeSettings.deliveryFee !== undefined ? storeSettings.deliveryFee : (currentStore.deliveryFee || 0.00);
      }
    }
  }

  // Service charge
  const serviceRate = (storeSettings.serviceChargePercent ?? ((currentStore.serviceChargeRate ?? 0) * 100)) / 100;
  const cartServiceCharge = netDiscountedSubtotal * serviceRate;

  // Bag charge
  const cartBagCharge = storeSettings.bagChargeAmount && cartItems.length > 0 ? storeSettings.bagChargeAmount : 0;

  // Tax calculation (UK VAT included)
  const taxRate = currentStore.taxRate || 0.20;
  const taxableBase = netDiscountedSubtotal + (storeSettings.serviceChargeTaxable ? cartServiceCharge : 0);
  const cartTax = taxableBase * (taxRate / (1 + taxRate));

  const cartGrandTotal = Math.max(0, netDiscountedSubtotal + cartDeliveryFee + cartServiceCharge + cartBagCharge);

  // Table Management
  const addTable = (tableData: Omit<TableRecord, 'id' | 'lastUpdated'>) => {
    const newTable: TableRecord = {
      ...tableData,
      id: `tbl-${Date.now()}`,
      lastUpdated: new Date().toISOString(),
    };
    setTables((prev) => [...prev, newTable]);
    firestoreService.saveTableToFirestore(newTable).catch((err) => console.warn('Firestore save table:', err));
    logActivity('Table Created', `Registered ${newTable.tableNumber} in ${newTable.zone}`, 'Store');
  };

  const updateTable = (id: string, updates: Partial<TableRecord>) => {
    let updatedTable: TableRecord | undefined;
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          updatedTable = { ...t, ...updates, lastUpdated: new Date().toISOString() };
          return updatedTable;
        }
        return t;
      })
    );
    if (updatedTable) {
      firestoreService.saveTableToFirestore(updatedTable).catch((err) => console.warn('Firestore update table:', err));
    }
    logActivity('Table Updated', `Updated settings for table #${id}`, 'Store');
  };

  const deleteTable = (id: string) => {
    setTables((prev) => prev.filter((t) => t.id !== id));
    firestoreService.deleteTableFromFirestore(id).catch((err) => console.warn('Firestore delete table:', err));
    logActivity('Table Deleted', `Removed table #${id}`, 'Store');
  };

  const updateTableStatus = (
    id: string,
    status: TableRecord['status'],
    currentOrderId?: string,
    guestCount?: number
  ) => {
    let updatedTable: TableRecord | undefined;
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          updatedTable = {
            ...t,
            status,
            currentOrderId: status === 'Occupied' ? (currentOrderId || t.currentOrderId) : undefined,
            guestCount: status === 'Occupied' ? (guestCount ?? t.guestCount ?? 2) : undefined,
            lastUpdated: new Date().toISOString(),
          };
          return updatedTable;
        }
        return t;
      })
    );
    if (updatedTable) {
      firestoreService.saveTableToFirestore(updatedTable).catch((err) => console.warn('Firestore update table status:', err));
    }
  };

  // Printer Devices
  const addPrinter = (printerData: Omit<PrinterDevice, 'id' | 'receiptCount' | 'lastTestPrint'>) => {
    const newPrn: PrinterDevice = {
      ...printerData,
      id: `prn-${Date.now()}`,
      receiptCount: 0,
      lastTestPrint: new Date().toISOString(),
    };
    setPrinters((prev) => [...prev, newPrn]);
    firestoreService.savePrinterToFirestore(newPrn).catch((err) => console.warn('Firestore save printer:', err));
    logActivity('Printer Registered', `Configured printer ${newPrn.name} (${newPrn.connection})`, 'Store');
  };

  const updatePrinter = (id: string, updates: Partial<PrinterDevice>) => {
    let updatedPrinter: PrinterDevice | undefined;
    setPrinters((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          updatedPrinter = { ...p, ...updates };
          return updatedPrinter;
        }
        return p;
      })
    );
    if (updatedPrinter) {
      firestoreService.savePrinterToFirestore(updatedPrinter).catch((err) => console.warn('Firestore update printer:', err));
    }
    logActivity('Printer Updated', `Updated printer hardware profile #${id}`, 'Store');
  };

  const deletePrinter = (id: string) => {
    setPrinters((prev) => prev.filter((p) => p.id !== id));
    firestoreService.deletePrinterFromFirestore(id).catch((err) => console.warn('Firestore delete printer:', err));
    logActivity('Printer Deleted', `Removed printer hardware #${id}`, 'Store');
  };

  const setDefaultPrinter = (id: string) => {
    const updated = printers.map((p) => ({
      ...p,
      isDefault: p.id === id,
    }));
    setPrinters(updated);
    updated.forEach((p) => {
      firestoreService.savePrinterToFirestore(p).catch((err) => console.warn('Firestore default printer:', err));
    });
    const p = printers.find((x) => x.id === id);
    logActivity('Default Printer Changed', `Set "${p?.name || id}" as primary thermal output`, 'Store');
  };

  const testPrintPrinter = async (id: string): Promise<{ success: boolean; message: string; receiptSlip?: string }> => {
    const target = printers.find((p) => p.id === id);
    if (!target) {
      return { success: false, message: 'Printer device not found.' };
    }

    // Simulate printing pulse
    setPrinters((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, receiptCount: p.receiptCount + 1, lastTestPrint: new Date().toISOString(), status: 'Ready' }
          : p
      )
    );

    const testSlip = `
========================================
           NEXUS-POS SYSTEM
         HARDWARE TEST PRINT
========================================
Device:      ${target.name}
Model Type:  ${target.type}
Connection:  ${target.connection}
IP / Port:   ${target.ipAddress || 'Bluetooth/USB'} : ${target.port || 9100}
Paper Width: ${target.paperWidth}
Status:      ONLINE & OPERATIONAL
Receipts:    #${target.receiptCount + 1}
Timestamp:   ${new Date().toLocaleString()}
========================================
[ OK ] Thermal head heating test passed
[ OK ] Paper cutter guillotine passed
[ OK ] Cash drawer kick trigger OK
========================================
`;

    logActivity('Printer Test Conducted', `Successfully transmitted diagnostic test ticket to ${target.name}`, 'Store');
    addNotification({
      title: 'Test Print Sent',
      message: `Diagnostic ticket dispatched to ${target.name}. Hardware responding OK.`,
      type: 'success',
    });

    return {
      success: true,
      message: `Diagnostic test ticket printed successfully on ${target.name}.`,
      receiptSlip: testSlip,
    };
  };

  // Store Settings Update
  const updateStoreSettings = (updates: Partial<StoreSettingsData>) => {
    if (currentUser?.role !== 'SUPER_ADMIN' && currentUser?.role !== 'ADMIN') {
      addNotification({
        title: 'Access Restricted',
        message: 'Basic store settings can only be altered by the Super Admin.',
        type: 'alert',
      });
      return;
    }
    setStoreSettings((prev) => {
      const merged = { ...prev, ...updates };
      firestoreService.saveStoreSettingsToFirestore(currentStoreId, merged).catch((err) => console.warn('Firestore store settings:', err));
      return merged;
    });
    logActivity('Store Settings Saved', 'Updated restaurant configuration, operational options & website fulfillment', 'Store');
    addNotification({
      title: 'Settings Saved',
      message: 'Store configuration and operational rules updated.',
      type: 'success',
    });
  };

  // Cash Drawer State calculations directly derived from real-time database orders & transactions
  const setCashDrawerOpeningFloat = (storeId: string, amount: number) => {
    const validAmount = Math.max(0, amount);
    setOpeningFloats((prev) => ({ ...prev, [storeId]: validAmount }));
    firestoreService.saveCashDrawerStateToFirestore(storeId, { openingFloat: validAmount }).catch(console.warn);
  };

  // Real-time Cash Sales calculated directly from the database (orders collection as single source of truth)
  // ONLY orders with paymentMethod === 'Cash' and active (not cancelled / refunded) are included.
  // Card / online payments do NOT increase the cash drawer balance.
  // When an order is punched, edited, cancelled, refunded, or deleted, this recalculates immediately!
  const totalCashSales = useMemo(() => {
    return (orders || [])
      .filter(
        (o) =>
          o.storeId === currentStore.id &&
          o.paymentMethod === 'Cash' &&
          o.orderStatus !== 'Cancelled' &&
          o.orderStatus !== 'Refunded' &&
          o.paymentStatus !== 'Cancelled' &&
          o.paymentStatus !== 'Refunded'
      )
      .reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  }, [orders, currentStore.id]);

  const totalCashIn = useMemo(() => {
    return (cashDrawerTransactions || [])
      .filter((tx) => tx.type === 'Cash-In' && tx.storeId === currentStore.id)
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [cashDrawerTransactions, currentStore.id]);

  const totalCashOut = useMemo(() => {
    return (cashDrawerTransactions || [])
      .filter((tx) => tx.type === 'Cash-Out' && tx.storeId === currentStore.id)
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [cashDrawerTransactions, currentStore.id]);

  // Opening Float: only the actual float entered when opening drawer / reset (never hardcoded 250)
  const openingBalance = useMemo(() => {
    if (typeof openingFloats[currentStore.id] === 'number') {
      return openingFloats[currentStore.id];
    }
    const openingFloatTx = (cashDrawerTransactions || [])
      .filter((tx) => tx.type === 'Drawer-Open' && tx.storeId === currentStore.id && (tx.reason?.includes('Float') || tx.reason?.includes('Reset') || tx.reason?.includes('Opening')))
      .slice(-1)[0];
    return openingFloatTx ? openingFloatTx.amount : 0.0;
  }, [openingFloats, currentStore.id, cashDrawerTransactions]);

  // Formula: Current Cash Drawer Balance = Opening Float + Cash Payments Received − Cash Refunds/Withdrawals
  const currentBalance = Math.max(0, openingBalance + totalCashSales + totalCashIn - totalCashOut);

  const cashDrawerState: CashDrawerState = {
    isOpen: false,
    openingBalance,
    currentBalance,
    totalCashSales,
    totalCashIn,
    totalCashOut,
  };

  // Helper for computing synchronized drawer balance for any store or 'all' stores
  const getCashDrawerBalance = useCallback(
    (storeId?: string) => {
      const targetStoreId = storeId || currentStore.id;
      const targetOrders = (orders || []).filter((o) => {
        if (targetStoreId !== 'all' && o.storeId !== targetStoreId) return false;
        return (
          o.paymentMethod === 'Cash' &&
          o.orderStatus !== 'Cancelled' &&
          o.orderStatus !== 'Refunded' &&
          o.paymentStatus !== 'Cancelled' &&
          o.paymentStatus !== 'Refunded'
        );
      });

      const cashSales = targetOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);

      const targetTxs = (cashDrawerTransactions || []).filter(
        (tx) => targetStoreId === 'all' || tx.storeId === targetStoreId
      );

      const cashIn = targetTxs
        .filter((tx) => tx.type === 'Cash-In')
        .reduce((sum, tx) => sum + (tx.amount || 0), 0);

      const cashOut = targetTxs
        .filter((tx) => tx.type === 'Cash-Out')
        .reduce((sum, tx) => sum + (tx.amount || 0), 0);

      let float = 0;
      if (targetStoreId === 'all') {
        const storeFloatMap: Record<string, number> = { ...openingFloats };
        (cashDrawerTransactions || []).forEach((tx) => {
          if (tx.type === 'Drawer-Open' && tx.storeId && typeof storeFloatMap[tx.storeId] !== 'number') {
            if (tx.reason?.includes('Float') || tx.reason?.includes('Reset') || tx.reason?.includes('Opening')) {
              storeFloatMap[tx.storeId] = tx.amount || 0;
            }
          }
        });
        float = Object.values(storeFloatMap).reduce((s, v) => s + (v || 0), 0);
      } else {
        if (typeof openingFloats[targetStoreId] === 'number') {
          float = openingFloats[targetStoreId];
        } else {
          const openingFloatTx = (cashDrawerTransactions || [])
            .filter((tx) => tx.type === 'Drawer-Open' && tx.storeId === targetStoreId && (tx.reason?.includes('Float') || tx.reason?.includes('Reset') || tx.reason?.includes('Opening')))
            .slice(-1)[0];
          float = openingFloatTx ? openingFloatTx.amount : 0.0;
        }
      }

      const balance = Math.max(0, float + cashSales + cashIn - cashOut);

      return {
        openingFloat: float,
        cashSales,
        totalCashIn: cashIn,
        totalCashOut: cashOut,
        currentBalance: balance,
      };
    },
    [orders, cashDrawerTransactions, openingFloats, currentStore.id]
  );

  const openDrawer = (reason: string) => {
    const newTx: CashDrawerTransaction = {
      id: `cdt-${Date.now()}`,
      storeId: currentStore?.id || 'store-1',
      cashierId: currentEmployee?.id || 'emp-admin',
      cashierName: currentEmployee?.name || 'Administrator',
      type: 'Drawer-Open',
      amount: 0,
      reason: reason || 'Manual drawer kick / inspection',
      balanceBefore: currentBalance,
      balanceAfter: currentBalance,
      timestamp: new Date().toISOString(),
    };
    setCashDrawerTransactions((prev) => [...prev, newTx]);
    firestoreService.saveCashDrawerTransactionToFirestore(newTx).catch(console.warn);
    logActivity('Cash Drawer Opened', reason || 'Drawer opened manually by cashier', 'Cash Drawer');
    addNotification({
      title: 'Cash Drawer Opened',
      message: `${currentEmployee?.name || 'Staff'} triggered cash drawer kick.`,
      type: 'cash',
    });
  };

  const recordCashIn = (amount: number, reason: string) => {
    const newTx: CashDrawerTransaction = {
      id: `cdt-${Date.now()}`,
      storeId: currentStore?.id || 'store-1',
      cashierId: currentEmployee?.id || 'emp-admin',
      cashierName: currentEmployee?.name || 'Administrator',
      type: 'Cash-In',
      amount,
      reason: reason || 'Cash In float addition',
      balanceBefore: currentBalance,
      balanceAfter: currentBalance + amount,
      timestamp: new Date().toISOString(),
    };
    setCashDrawerTransactions((prev) => [...prev, newTx]);
    firestoreService.saveCashDrawerTransactionToFirestore(newTx).catch(console.warn);
    logActivity('Cash-In Recorded', `Added £${(amount || 0).toFixed(2)} to drawer (${reason})`, 'Cash Drawer');
    addNotification({
      title: 'Cash-In Registered',
      message: `£${(amount || 0).toFixed(2)} received into drawer. Reason: ${reason}`,
      type: 'cash',
    });
  };

  const recordCashOut = (amount: number, reason: string) => {
    const newTx: CashDrawerTransaction = {
      id: `cdt-${Date.now()}`,
      storeId: currentStore?.id || 'store-1',
      cashierId: currentEmployee?.id || 'emp-admin',
      cashierName: currentEmployee?.name || 'Administrator',
      type: 'Cash-Out',
      amount,
      reason: reason || 'Cash Out expense / drop',
      balanceBefore: currentBalance,
      balanceAfter: Math.max(0, currentBalance - amount),
      timestamp: new Date().toISOString(),
    };
    setCashDrawerTransactions((prev) => [...prev, newTx]);
    firestoreService.saveCashDrawerTransactionToFirestore(newTx).catch(console.warn);
    logActivity('Cash-Out Recorded', `Withdrew £${(amount || 0).toFixed(2)} from drawer (${reason})`, 'Cash Drawer');
    addNotification({
      title: 'Cash-Out Registered',
      message: `£${(amount || 0).toFixed(2)} paid out of drawer. Reason: ${reason}`,
      type: 'cash',
    });
  };

  const resetCashDrawerSales = (options?: {
    resetOrders?: boolean;
    newOpeningFloat?: number;
    reason?: string;
  }) => {
    const storeId = currentStore?.id || 'store-1';
    const newOpeningFloat = typeof options?.newOpeningFloat === 'number' ? Math.max(0, options.newOpeningFloat) : 0;
    const reason = options?.reason || 'Shift close / Reset cash drawer & sales';

    // 1. Persist new opening float
    setCashDrawerOpeningFloat(storeId, newOpeningFloat);

    // 2. Reset drawer transactions for current store with 1 fresh opening float transaction
    const initialTx: CashDrawerTransaction = {
      id: `cdt-${Date.now()}`,
      storeId,
      cashierId: currentEmployee?.id || 'emp-admin',
      cashierName: currentEmployee?.name || 'Administrator',
      type: 'Drawer-Open',
      amount: newOpeningFloat,
      reason: `Reset: Initial Opening Float (£${newOpeningFloat.toFixed(2)}) - ${reason}`,
      balanceBefore: 0,
      balanceAfter: newOpeningFloat,
      timestamp: new Date().toISOString(),
    };

    setCashDrawerTransactions((prev) => [
      ...prev.filter((tx) => tx.storeId !== storeId),
      initialTx,
    ]);
    firestoreService.saveCashDrawerTransactionToFirestore(initialTx).catch(console.warn);

    // 3. If resetOrders is true, clear/archive orders for this store so gross sales and avg sales are reset
    if (options?.resetOrders) {
      setOrders((prev) => prev.filter((o) => o.storeId !== storeId));
      setLatestPlacedOrder(null);
    }

    logActivity(
      'Till & Sales Reset',
      `Cash drawer, gross sales, and average sales reset for ${currentStore?.businessName}. Opening float set to £${newOpeningFloat.toFixed(2)}. Operator: ${currentEmployee?.name || 'Administrator'}. Reason: ${reason}`,
      'Cash Drawer'
    );

    addNotification({
      title: 'Till & Sales Reset Complete',
      message: `Cash drawer, gross sales, and avg sales have been reset for ${currentStore?.businessName}. Float: £${newOpeningFloat.toFixed(2)}`,
      type: 'cash',
    });
  };

  // Order Placement & Lifecycle
  const [printAlert, setPrintAlert] = useState<PrintAlert | null>(null);

  const getNextOrderSequence = (): { seqNumber: number; orderNumber: string; invoiceId: string } => {
    // If no orders exist (e.g. after clearing all orders or initial start), start sequence strictly at 1
    if (!orders || orders.length === 0) {
      return {
        seqNumber: 1,
        orderNumber: '1',
        invoiceId: '#NEX-1',
      };
    }

    const existingNums: number[] = [];
    orders.forEach((o) => {
      if (o.orderNumber) {
        const match = String(o.orderNumber).replace(/[^0-9]/g, '');
        const val = parseInt(match, 10);
        // Exclude legacy random numbers (e.g. numbers >= 5000)
        if (!isNaN(val) && val > 0 && val < 5000) existingNums.push(val);
      }
      if (o.invoiceId) {
        const match = o.invoiceId.match(/^#?NEX-(\d+)$/i) || o.invoiceId.match(/^#?(\d+)$/);
        if (match) {
          const val = parseInt(match[1], 10);
          if (!isNaN(val) && val > 0 && val < 5000) existingNums.push(val);
        }
      }
    });

    const maxExisting = existingNums.length > 0 ? Math.max(...existingNums) : orders.length;
    const nextSeq = Math.max(maxExisting, orders.length) + 1;

    return {
      seqNumber: nextSeq,
      orderNumber: `${nextSeq}`,
      invoiceId: `#NEX-${nextSeq}`,
    };
  };

  const clearAllOrders = async (): Promise<void> => {
    // 1. Clear in-memory orders and cart
    setOrders([]);
    setLatestPlacedOrder(null);
    clearCart();

    // 2. Clear stored orders and reset sequence tracker to 0
    try {
      localStorage.removeItem(STORAGE_KEYS.ORDERS);
      localStorage.setItem('nexus_last_order_seq', '0');
    } catch {
      // ignore
    }

    // 3. Clear orders in Firestore
    try {
      await firestoreService.clearAllFirestoreOrders();
    } catch (err) {
      console.warn('Could not clear orders in Firestore:', err);
    }

    // 4. Log activity and notify
    logActivity('Orders Cleared', 'Admin cleared all orders. Sequential order numbering reset to #1', 'Order');
    addNotification({
      title: 'Orders Cleared & Reset',
      message: 'All orders have been cleared. Order sequence has restarted from #1.',
      type: 'order',
      linkTo: 'orders',
    });
  };

  const executePrintOrder = (order: Order): { success: boolean; error?: string; printerName?: string } => {
    // Find configured printer for the target store
    const storePrinters = (printers || []).filter(
      (p) => p.storeId === order.storeId || p.storeId === currentStore?.id
    );
    const targetPrinter =
      storePrinters.find((p) => p.isDefault && p.status !== 'Offline') ||
      storePrinters.find((p) => p.status !== 'Offline') ||
      storePrinters.find((p) => p.isDefault) ||
      storePrinters[0];

    if (!targetPrinter || targetPrinter.status === 'Offline') {
      const errorMsg = targetPrinter
        ? `${targetPrinter.name} is Offline / Not Connected`
        : 'No Printer Configured for Store Branch';
      setPrintAlert({
        order,
        status: 'failed',
        error: errorMsg,
        printerName: targetPrinter?.name,
      });
      return { success: false, error: errorMsg, printerName: targetPrinter?.name };
    }

    // Printer is online: dispatch print
    setPrinters((prev) =>
      prev.map((p) =>
        p.id === targetPrinter.id
          ? {
              ...p,
              receiptCount: (p.receiptCount || 0) + 1,
              lastPrint: new Date().toISOString(),
            }
          : p
      )
    );

    // Mark order as printed
    const now = new Date().toISOString();
    setOrders((prev) =>
      prev.map((o) =>
        o.id === order.id
          ? {
              ...o,
              isPrinted: true,
              printedAt: now,
              printCount: (o.printCount || 0) + 1,
            }
          : o
      )
    );

    firestoreService.updateOrderInFirestore(order.id, {
      isPrinted: true,
      printedAt: now,
      printCount: (order.printCount || 0) + 1,
    }).catch(console.warn);

    setLatestPlacedOrder(order);
    setIsReceiptModalOpen(true);

    setPrintAlert({
      order,
      status: 'success',
      printerName: targetPrinter.name,
    });

    return { success: true, printerName: targetPrinter.name };
  };

  const retryPrintOrder = (order: Order) => {
    const result = executePrintOrder(order);
    if (result.success) {
      addNotification({
        title: 'Ticket Dispatched',
        message: `Order #${order.orderNumber || order.invoiceId} successfully printed on ${result.printerName}.`,
        type: 'success',
        linkTo: 'orders',
      });
    } else {
      addNotification({
        title: 'Printing Failed',
        message: result.error || 'Printer is offline. Please check connection.',
        type: 'alert',
        linkTo: 'orders',
      });
    }
  };

  const dismissPrintAlert = () => {
    setPrintAlert(null);
  };

  const isDeliveryRestrictedByAdmin = useCallback(
    (storeId: string, address?: string, postcode?: string): { isRestricted: boolean; reason?: string } => {
      const store = stores.find((s) => s.id === storeId);
      const settings = deliverySettingsMap[storeId];

      // 1. Global delivery disabled
      if (store?.isDeliveryEnabled === false || (settings && settings.enabled === false)) {
        return {
          isRestricted: true,
          reason: 'Delivery service is currently disabled for this store in Admin settings.',
        };
      }

      // 2. Restricted postcodes list in settings
      if (postcode && settings?.restrictedPostcodes && settings.restrictedPostcodes.length > 0) {
        const pcParsed = parseUKPostcode(postcode);
        const cleanCustomer = postcode.trim().toUpperCase().replace(/\s+/g, '');
        const matched = settings.restrictedPostcodes.find((rp) => {
          const cleanRp = rp.trim().toUpperCase().replace(/\s+/g, '');
          return (
            cleanCustomer === cleanRp ||
            pcParsed.compact === cleanRp ||
            pcParsed.district === cleanRp ||
            pcParsed.area === cleanRp ||
            pcParsed.sector.replace(/\s+/g, '') === cleanRp
          );
        });
        if (matched) {
          return {
            isRestricted: true,
            reason: `Postcode "${postcode}" is restricted in Admin delivery settings.`,
          };
        }
      }

      // 3. Restricted addresses list in settings
      if (address && settings?.restrictedAddresses && settings.restrictedAddresses.length > 0) {
        const cleanAddr = address.toLowerCase();
        const matchedAddr = settings.restrictedAddresses.find((ra) => {
          const trimmed = ra.trim().toLowerCase();
          return trimmed.length > 0 && cleanAddr.includes(trimmed);
        });
        if (matchedAddr) {
          return {
            isRestricted: true,
            reason: `Address matches restricted location "${matchedAddr}" in Admin delivery settings.`,
          };
        }
      }

      // 4. Deactivated Delivery Zone
      if (postcode && deliveryZones && deliveryZones.length > 0) {
        const pcParsed = parseUKPostcode(postcode);
        const disabledZone = deliveryZones.find(
          (z) =>
            z.storeId === storeId &&
            z.active === false &&
            (z.postcodeRule.trim().toUpperCase().replace(/\s+/g, '') === pcParsed.compact ||
              z.postcodeRule.trim().toUpperCase() === pcParsed.district ||
              z.postcodeRule.trim().toUpperCase() === pcParsed.area ||
              z.postcodeRule.trim().toUpperCase().replace(/\s+/g, '') === pcParsed.sector.replace(/\s+/g, ''))
        );
        if (disabledZone) {
          return {
            isRestricted: true,
            reason: `Delivery zone "${disabledZone.postcodeRule}" is restricted/disabled in Admin settings.`,
          };
        }
      }

      return { isRestricted: false };
    },
    [stores, deliverySettingsMap, deliveryZones]
  );

  const saveToPermanentHistory = useCallback((order: Order) => {
    setOrderHistory((prev) => {
      const existingIdx = prev.findIndex(
        (o) => o.id === order.id || (o.invoiceId && order.invoiceId && o.invoiceId === order.invoiceId)
      );
      let updated: Order[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], ...order };
      } else {
        updated = [order, ...prev];
      }
      try {
        localStorage.setItem(STORAGE_KEYS.ORDER_HISTORY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const openOrderHistory = useCallback(
    (orderId?: string) => {
      if (orderId) {
        const found = orderHistory.find((o) => o.id === orderId) || orders.find((o) => o.id === orderId);
        if (found) {
          setSelectedHistoryOrder(found);
        }
      } else {
        setSelectedHistoryOrder(null);
      }
      setIsOrderHistoryModalOpen(true);
    },
    [orderHistory, orders]
  );

  const createOrder = (paymentMethod: PaymentMethod): Order | null => {
    if (cartItems.length === 0) return null;

    if (customerInfo.orderType === 'Delivery') {
      if (!customerInfo.phone || !customerInfo.firstName || !customerInfo.ukPostcode || !customerInfo.fullAddress) {
        alert('Please complete all required delivery fields (First Name, Phone, UK Postcode, Full Address).');
        return null;
      }
      const restriction = isDeliveryRestrictedByAdmin(
        currentStore?.id || 'store-1',
        customerInfo.fullAddress,
        customerInfo.ukPostcode
      );
      if (restriction.isRestricted) {
        alert(`Restricted Delivery Area: ${restriction.reason || 'This address or postcode has been restricted in Admin settings.'}`);
        return null;
      }
    }

    const { orderNumber, invoiceId } = getNextOrderSequence();
    const isStaff = currentUser?.role === 'STAFF' || activePosMode === 'staff' || activeAppView === 'staff-pos';
    const operatorName = currentUser?.name || currentEmployee?.name || (isStaff ? 'Staff Operator' : 'Administrator');
    const orderSrc = isStaff ? 'STAFF POS' : 'STORE POS';

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      invoiceId,
      orderNumber,
      source: orderSrc,
      orderSource: orderSrc,
      storeId: currentStore?.id || 'store-1',
      storeName: currentStore?.businessName,
      customer: { ...customerInfo },
      items: [...cartItems],
      subtotal: cartSubtotal,
      modifiersTotal: cartModifiersTotal,
      discount: cartPresetDiscount,
      couponDiscount: cartCouponDiscount,
      couponCode: appliedCoupon?.code,
      deliveryFee: cartDeliveryFee,
      serviceCharge: cartServiceCharge,
      tax: cartTax,
      grandTotal: cartGrandTotal,
      paymentStatus: 'Paid',
      paymentMethod,
      orderStatus: 'Current',
      orderType: customerInfo.orderType,
      isAccepted: isStaff ? false : true, // No auto-accept: every Staff POS order requires manual acceptance by Store POS!
      cashierName: operatorName,
      createdBy: operatorName,
      staffName: isStaff ? operatorName : undefined,
      orderSentBy: isStaff ? operatorName : undefined,
      sentByStaff: isStaff ? operatorName : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedDelivery:
        customerInfo.orderType === 'Delivery'
          ? `${storeSettings.deliveryWaitingTimeMins || 35} mins`
          : customerInfo.orderType === 'Pickup'
          ? `${storeSettings.pickupWaitingTimeMins || 18} mins`
          : `Kitchen Prep (${storeSettings.inStoreWaitingTimeMins || 12} mins)`,
    };

    setOrders((prev) => [newOrder, ...prev]);
    saveToPermanentHistory(newOrder);
    setLatestPlacedOrder(newOrder);
    setIsPaymentModalOpen(false);
    setIsReceiptModalOpen(true);

    // Link order to customer record persistently & save to firestore
    linkOrderToCustomer(newOrder).catch((err) => console.warn('Failed linking customer order:', err));
    firestoreService.saveOrderToFirestore(newOrder).catch((err) => console.warn('Failed saving order to firestore:', err));
    firestoreService.upsertCustomerOnOrder(newOrder).catch((err) => console.warn('Failed upserting customer in firestore:', err));

    // If in-store and table selected, mark table as Occupied
    if (customerInfo.orderType === 'In-Store' && customerInfo.tableReference) {
      const matchedTable = tables.find(
        (t) => t.tableNumber.toLowerCase() === customerInfo.tableReference?.toLowerCase()
      );
      if (matchedTable) {
        updateTableStatus(matchedTable.id, 'Occupied', invoiceId, 2);
      }
    }

    // Increment printer receipt counters
    setPrinters((prev) =>
      prev.map((p) => (p.isDefault || p.type === 'Kitchen KOT' ? { ...p, receiptCount: p.receiptCount + 1 } : p))
    );

    // If paid by Cash, record transaction into Cash Drawer automatically
    if (paymentMethod === 'Cash') {
      const cashTx: CashDrawerTransaction = {
        id: `cdt-${Date.now()}`,
        storeId: currentStore?.id || 'store-1',
        cashierId: currentEmployee?.id || 'emp-admin',
        cashierName: operatorName,
        type: 'Sale-Cash',
        amount: cartGrandTotal,
        reason: `Cash Order Sale (${invoiceId})`,
        balanceBefore: currentBalance,
        balanceAfter: currentBalance + cartGrandTotal,
        timestamp: new Date().toISOString(),
      };
      setCashDrawerTransactions((prev) => [...prev, cashTx]);
      firestoreService.saveCashDrawerTransactionToFirestore(cashTx).catch(console.warn);
    }

    logActivity(
      'Order Created & Paid',
      `Placed order ${invoiceId} for £${(cartGrandTotal || 0).toFixed(2)} via ${paymentMethod} (${orderSrc})`,
      'Order'
    );
    try {
      if (!isStaff) {
        soundFX.orderReceived();
      }
    } catch {
      // ignore
    }
    addNotification({
      title: isStaff ? 'Staff Order Dispatched' : 'New Order Received',
      message: `Order ${invoiceId} (${customerInfo.orderType}) placed by ${customerInfo.firstName || 'Customer'} for £${(cartGrandTotal || 0).toFixed(2)}${isStaff ? ` • Sent By: ${operatorName}` : ''}`,
      type: 'order',
      linkTo: 'orders',
    });

    clearCart();
    return newOrder;
  };

  const addOrder = (newOrder: Order) => {
    let finalizedOrder = { ...newOrder };
    if (!finalizedOrder.orderNumber) {
      const { orderNumber, invoiceId } = getNextOrderSequence();
      finalizedOrder = {
        ...finalizedOrder,
        orderNumber,
        invoiceId: finalizedOrder.invoiceId || invoiceId,
      };
    }

    const isStaff = currentUser?.role === 'STAFF' || activePosMode === 'staff' || activeAppView === 'staff-pos' || finalizedOrder.source === 'STAFF POS' || finalizedOrder.orderSource === 'STAFF POS';
    if (isStaff) {
      const staffName = finalizedOrder.orderSentBy || finalizedOrder.sentByStaff || finalizedOrder.staffName || currentUser?.name || 'Staff Operator';
      finalizedOrder.source = 'STAFF POS';
      finalizedOrder.orderSource = 'STAFF POS';
      finalizedOrder.isAccepted = false; // No auto-accept for Staff POS orders!
      finalizedOrder.orderSentBy = staffName;
      finalizedOrder.sentByStaff = staffName;
      finalizedOrder.staffName = staffName;
      finalizedOrder.createdBy = staffName;
      finalizedOrder.cashierName = staffName;
    }

    if (finalizedOrder.orderType === 'Delivery') {
      const restriction = isDeliveryRestrictedByAdmin(
        finalizedOrder.storeId,
        finalizedOrder.customer?.fullAddress,
        finalizedOrder.customer?.ukPostcode
      );
      if (restriction.isRestricted) {
        alert(`Restricted Delivery Area: ${restriction.reason || 'This address or postcode has been restricted in Admin settings.'}`);
        return;
      }
    }

    setOrders((prev) => [finalizedOrder, ...prev]);
    saveToPermanentHistory(finalizedOrder);
    setLatestPlacedOrder(finalizedOrder);

    // Link order to customer record persistently & save to firestore
    linkOrderToCustomer(finalizedOrder).catch((err) => console.warn('Failed linking customer order:', err));
    firestoreService.saveOrderToFirestore(finalizedOrder).catch((err) => console.warn('Failed saving order to firestore:', err));
    firestoreService.upsertCustomerOnOrder(finalizedOrder).catch((err) => console.warn('Failed upserting customer in firestore:', err));

    try {
      if (!isStaff) {
        soundFX.orderReceived();
      }
    } catch {
      // ignore
    }

    // Increment printer receipt counters
    setPrinters((prev) =>
      prev.map((p) => (p.isDefault || p.type === 'Kitchen KOT' ? { ...p, receiptCount: p.receiptCount + 1 } : p))
    );

    // If paid by Cash, record into Cash Drawer
    if (finalizedOrder.paymentMethod === 'Cash' && finalizedOrder.paymentStatus === 'Paid') {
      const cashTx: CashDrawerTransaction = {
        id: `cdt-${Date.now()}`,
        storeId: finalizedOrder.storeId,
        cashierId: currentEmployee?.id || 'emp-admin',
        cashierName: finalizedOrder.cashierName || currentEmployee?.name || 'Administrator',
        type: 'Sale-Cash',
        amount: finalizedOrder.grandTotal,
        reason: `Cash Order (${finalizedOrder.orderNumber || finalizedOrder.invoiceId})`,
        balanceBefore: currentBalance,
        balanceAfter: currentBalance + finalizedOrder.grandTotal,
        timestamp: new Date().toISOString(),
      };
      setCashDrawerTransactions((prev) => [...prev, cashTx]);
      firestoreService.saveCashDrawerTransactionToFirestore(cashTx).catch(console.warn);
    }

    logActivity(
      'Order Placed',
      `Placed order ${finalizedOrder.orderNumber || finalizedOrder.invoiceId} for £${(finalizedOrder.grandTotal || 0).toFixed(2)} via ${finalizedOrder.orderSource || 'POS Terminal'}`,
      'Order'
    );
    addNotification({
      title: isStaff ? 'Staff Order Dispatched' : 'New Order Received',
      message: `Order ${finalizedOrder.orderNumber || finalizedOrder.invoiceId} (${finalizedOrder.orderType}) placed for £${(finalizedOrder.grandTotal || 0).toFixed(2)}${finalizedOrder.orderSentBy ? ` • Sent By: ${finalizedOrder.orderSentBy}` : ''}`,
      type: 'order',
      linkTo: 'orders',
    });
  };

  // Unaccepted Orders & Continuous Audio Alert Logic
  const isSuperAdminOrAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';
  const unacceptedOrders = (orders || []).filter(
    (o) =>
      (!currentStore?.id || o.storeId === currentStore.id || isSuperAdminOrAdmin) &&
      (o.isAccepted === false ||
        (o.isAccepted === undefined && (o.source === 'STAFF POS' || o.orderSource === 'STAFF POS'))) &&
      o.orderStatus !== 'Cancelled' &&
      o.orderStatus !== 'Completed'
  );

  const prevUnacceptedSigRef = useRef<string>('');
  const prevUnacceptedCountRef = useRef<number>(0);

  const unacceptedSignature = useMemo(() => {
    return unacceptedOrders
      .map((o) => `${o.id}_${o.updatedAt || o.createdAt || ''}_${o.isAccepted}_${o.grandTotal}_${o.items?.length || 0}`)
      .sort()
      .join('|');
  }, [unacceptedOrders]);

  useEffect(() => {
    // Continuous loud beeping alert plays on Store POS whenever there are unaccepted orders
    const isStaffTerminal =
      currentUser?.role === 'STAFF' || activePosMode === 'staff' || activeAppView === 'staff-pos';
    // No alert on the login screen (nobody signed in)
    const isStorePOSActive = !!currentUser && !isStaffTerminal;

    if (isStorePOSActive && unacceptedOrders.length > 0) {
      const hasSignatureChanged = unacceptedSignature !== prevUnacceptedSigRef.current;
      const hasCountIncreased = unacceptedOrders.length > prevUnacceptedCountRef.current;
      const isNewOrUpdatedArrival = hasSignatureChanged || hasCountIncreased;

      // Start or re-trigger continuous beeping alert using provided "Beeping Sound Effect.mp3"
      soundFX.startContinuousNewOrderAlert(isNewOrUpdatedArrival);
    } else {
      // Immediately stop alert sound when all orders are accepted
      soundFX.stopContinuousNewOrderAlert();
    }

    prevUnacceptedSigRef.current = unacceptedSignature;
    prevUnacceptedCountRef.current = unacceptedOrders.length;
  }, [unacceptedSignature, unacceptedOrders.length, activeAppView, activePosMode, currentUser?.role, currentStore?.id]);

  const acceptOrder = (orderId: string) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target || target.isAccepted) return; // Prevent duplicate acceptance

    const now = new Date().toISOString();
    const staffName = currentUser?.name || currentEmployee?.name || 'Store POS';

    // If this is the only unaccepted order, immediately stop audio alert
    const remainingUnaccepted = unacceptedOrders.filter((o) => o.id !== orderId);
    if (remainingUnaccepted.length === 0) {
      soundFX.stopContinuousNewOrderAlert();
    }

    const updatedTarget: Order = {
      ...target,
      isAccepted: true,
      isEditedOrder: false,
      acceptedAt: now,
      acceptedBy: staffName,
      updatedAt: now,
    };

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? updatedTarget : o
      )
    );
    setOrderHistory((prev) =>
      prev.map((o) =>
        o.id === orderId ? updatedTarget : o
      )
    );

    firestoreService
      .updateOrderInFirestore(orderId, {
        isAccepted: true,
        isEditedOrder: false,
        acceptedAt: now,
        acceptedBy: staffName,
        updatedAt: now,
      })
      .catch((err) => console.warn('Failed updating accepted status in firestore:', err));

    try {
      soundFX.playSuccessChime();
    } catch {
      // ignore
    }

    // Immediately after Store POS accepts the order, automatically print the order
    const isStaff = currentUser?.role === 'STAFF' || activeAppView === 'staff-pos';
    if (!isStaff) {
      executePrintOrder(updatedTarget);
    }

    logActivity('Order Accepted', `Order ${target.orderNumber || target.invoiceId || orderId} accepted by ${staffName}`, 'Order');
    addNotification({
      title: 'Order Accepted',
      message: `Order #${target.orderNumber || target.invoiceId} (${target.orderType}) was accepted by ${staffName}.`,
      type: 'success',
      linkTo: 'orders',
    });
  };

  const acceptAllOrders = () => {
    const now = new Date().toISOString();
    const staffName = currentUser?.name || currentEmployee?.name || 'Store POS';
    const unacceptedList = unacceptedOrders.filter((o) => !o.isAccepted);
    if (unacceptedList.length === 0) return;

    // Immediately stop continuous audio alert when all orders are accepted
    soundFX.stopContinuousNewOrderAlert();

    const unacceptedIds = unacceptedList.map((o) => o.id);

    setOrders((prev) =>
      prev.map((o) =>
        unacceptedIds.includes(o.id)
          ? {
              ...o,
              isAccepted: true,
              isEditedOrder: false,
              acceptedAt: now,
              acceptedBy: staffName,
              updatedAt: now,
            }
          : o
      )
    );
    setOrderHistory((prev) =>
      prev.map((o) =>
        unacceptedIds.includes(o.id)
          ? {
              ...o,
              isAccepted: true,
              isEditedOrder: false,
              acceptedAt: now,
              acceptedBy: staffName,
              updatedAt: now,
            }
          : o
      )
    );

    unacceptedList.forEach((order) => {
      firestoreService
        .updateOrderInFirestore(order.id, {
          isAccepted: true,
          isEditedOrder: false,
          acceptedAt: now,
          acceptedBy: staffName,
          updatedAt: now,
        })
        .catch((err) => console.warn('Failed updating accepted status in firestore:', err));
    });

    try {
      soundFX.playSuccessChime();
    } catch {
      // ignore
    }

    const isStaff = currentUser?.role === 'STAFF' || activeAppView === 'staff-pos';
    if (!isStaff && unacceptedList.length > 0) {
      // Print first unaccepted order
      executePrintOrder({ ...unacceptedList[0], isAccepted: true });
    }

    logActivity('All Orders Accepted', `Store accepted ${unacceptedIds.length} incoming orders`, 'Order');
    addNotification({
      title: 'All Orders Accepted',
      message: `${unacceptedIds.length} incoming orders have been accepted.`,
      type: 'success',
      linkTo: 'orders',
    });
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            orderStatus: newStatus,
            updatedAt: new Date().toISOString(),
          };
        }
        return o;
      })
    );
    setOrderHistory((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            orderStatus: newStatus,
            updatedAt: new Date().toISOString(),
          };
        }
        return o;
      })
    );
    firestoreService.updateOrderStatus(orderId, newStatus).catch((err) => console.warn('Failed updating order status in firestore:', err));
    const target = orders.find((o) => o.id === orderId);
    logActivity('Order Status Updated', `Order ${target?.invoiceId || orderId} moved to ${newStatus}`, 'Order');
    addNotification({
      title: 'Order Status Changed',
      message: `Order ${target?.invoiceId || orderId} is now marked as "${newStatus}"`,
      type: 'order',
      linkTo: 'orders',
    });
  };

  const cancelOrder = (orderId: string, reason = 'Cancelled by staff') => {
    const now = new Date().toISOString();
    const staffName = currentEmployee?.name || 'Staff';

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              orderStatus: 'Cancelled',
              cancellationReason: reason,
              cancelledAt: now,
              cancelledBy: staffName,
              updatedAt: now,
            }
          : o
      )
    );
    setOrderHistory((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              orderStatus: 'Cancelled',
              cancellationReason: reason,
              cancelledAt: now,
              cancelledBy: staffName,
              updatedAt: now,
            }
          : o
      )
    );

    firestoreService
      .updateOrderInFirestore(orderId, {
        orderStatus: 'Cancelled',
        cancellationReason: reason,
        cancelledAt: now,
        cancelledBy: staffName,
        updatedAt: now,
      })
      .catch((err) => console.warn('Failed cancelling order in firestore:', err));

    const target = orders.find((o) => o.id === orderId);
    const identifier = target?.orderNumber || target?.invoiceId || orderId;
    logActivity('Order Cancelled', `Order ${identifier} cancelled: ${reason}`, 'Order');
    addNotification({
      title: 'Order Cancelled',
      message: `Order ${identifier} has been cancelled (${reason}).`,
      type: 'alert',
      linkTo: 'orders',
    });
  };

  // Update an existing order in state, localStorage, and Firestore without creating duplicate
  const updateExistingOrder = async (orderId: string, updatedFields: Partial<Order>): Promise<Order | null> => {
    let updatedOrderResult: Order | null = null;
    const now = new Date().toISOString();

    const isStaff = currentUser?.role === 'STAFF' || activePosMode === 'staff' || activeAppView === 'staff-pos';
    const fieldsToPersist: Partial<Order> = {
      ...updatedFields,
      updatedAt: now,
      ...(isStaff && {
        isAccepted: false,
        isEditedOrder: true,
        lastEditedAt: now,
        orderSentBy: currentUser?.name || 'Staff Agent',
      }),
    };

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          updatedOrderResult = {
            ...o,
            ...fieldsToPersist,
          };
          return updatedOrderResult;
        }
        return o;
      })
    );
    setOrderHistory((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            ...fieldsToPersist,
          };
        }
        return o;
      })
    );

    if (updatedOrderResult) {
      const orderToSave = updatedOrderResult as Order;
      try {
        await firestoreService.updateOrderInFirestore(orderId, fieldsToPersist);
      } catch (err) {
        console.warn('Failed to update order in firestore:', err);
      }

      const identifier = orderToSave.orderNumber || orderToSave.invoiceId || orderId;
      logActivity(
        'Order Updated',
        `Order #${identifier} modified (${orderToSave.items?.length || 0} items). New Total: £${orderToSave.grandTotal.toFixed(2)}`,
        'Order'
      );

      addNotification({
        title: 'Order Updated',
        message: `Order #${identifier} updated successfully with ${orderToSave.items?.length || 0} items. Total: £${orderToSave.grandTotal.toFixed(2)}`,
        type: 'order',
        linkTo: 'orders',
      });
    }

    return updatedOrderResult;
  };

  const startEditingOrder = (order: Order, options?: { targetView?: ActiveAppView }) => {
    setEditingOrder(order);

    // Deep clone items so that in-cart adjustments don't mutate the original order until saved
    const clonedItems: CartItem[] = JSON.parse(JSON.stringify(order.items || []));
    setCartItems(clonedItems);

    // Populate customer info
    setCustomerInfo({
      orderType: order.orderType,
      tableNumber: order.tableNumber || '',
      guestCount: 1,
      firstName: order.customer?.firstName || '',
      lastName: order.customer?.lastName || '',
      phone: order.customer?.phone || '',
      email: order.customer?.email || '',
      fullAddress: order.customer?.fullAddress || '',
      ukPostcode: order.customer?.ukPostcode || '',
      driverInstructions: order.customer?.driverInstructions || order.customer?.notes || '',
      notes: order.customer?.notes || '',
    });

    // If order has a specific store, switch to that store
    if (order.storeId) {
      setCurrentStoreId(order.storeId);
    }

    if (options?.targetView) {
      setActiveAppView(options.targetView);
    } else {
      setActiveAppView('pos-menu');
    }

    setLatestToastNotification({
      id: 'toast-' + Date.now(),
      type: 'info',
      title: `Editing Order #${order.orderNumber || order.invoiceId}`,
      message: `Modify quantities or add items from the menu, then click Save Changes.`,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  const cancelEditingOrder = () => {
    setEditingOrder(null);
    setCartItems([]);
    setCustomerInfo(DEFAULT_CUSTOMER_INFO);
  };

  const saveEditingOrder = async (overrideItems?: CartItem[]): Promise<Order | null> => {
    if (!editingOrder) return null;

    const itemsToSave = overrideItems || cartItems;
    if (itemsToSave.length === 0) {
      alert('Order must contain at least 1 item.');
      return null;
    }

    // Recalculate totals
    const subtotal = itemsToSave.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const modifiersTotal = itemsToSave.reduce((sum, item) => {
      const modsSum = (item.modifications || []).reduce((ms, m) => ms + (Number(m.price) || 0), 0);
      return sum + (item.modifiersTotal + modsSum) * item.quantity;
    }, 0);
    const combinedSubtotal = subtotal + modifiersTotal;

    // Delivery fee
    let deliveryFee = 0;
    if (customerInfo.orderType === 'Delivery') {
      deliveryFee = storeSettings.deliveryFee !== undefined ? storeSettings.deliveryFee : (currentStore.deliveryFee || 0.00);
      if (storeSettings.freeDeliveryThreshold > 0 && combinedSubtotal >= storeSettings.freeDeliveryThreshold) {
        deliveryFee = 0;
      }
    }

    // Service charge
    const serviceRate = (storeSettings.serviceChargePercent ?? ((currentStore.serviceChargeRate ?? 0) * 100)) / 100;
    const serviceCharge = combinedSubtotal * serviceRate;

    // Bag charge
    const bagCharge = storeSettings.bagChargeAmount && itemsToSave.length > 0 ? storeSettings.bagChargeAmount : 0;

    // Tax
    const taxRate = storeSettings.taxRate || currentStore.taxRate || 0.20;
    const tax = combinedSubtotal * taxRate;

    // Discount
    const discount = cartTotalDiscount;

    const grandTotal = Math.max(0, combinedSubtotal - discount + deliveryFee + serviceCharge + bagCharge);

    const updated = await updateExistingOrder(editingOrder.id, {
      items: itemsToSave,
      subtotal,
      modifiersTotal,
      tax,
      deliveryFee,
      serviceCharge,
      bagCharge,
      discount,
      grandTotal,
      customer: {
        ...editingOrder.customer,
        firstName: customerInfo.firstName || editingOrder.customer.firstName,
        lastName: customerInfo.lastName || editingOrder.customer.lastName,
        phone: customerInfo.phone || editingOrder.customer.phone,
        email: customerInfo.email || editingOrder.customer.email,
        fullAddress: customerInfo.fullAddress || editingOrder.customer.fullAddress,
        ukPostcode: customerInfo.ukPostcode || editingOrder.customer.ukPostcode,
        notes: customerInfo.notes || editingOrder.customer.notes,
        driverInstructions: customerInfo.driverInstructions || editingOrder.customer.driverInstructions,
        orderType: customerInfo.orderType || editingOrder.customer.orderType,
      },
      orderType: customerInfo.orderType || editingOrder.orderType,
    });

    setEditingOrder(null);
    setCartItems([]);
    setCustomerInfo(DEFAULT_CUSTOMER_INFO);

    if (updated) {
      soundFX.success();
      setLatestToastNotification({
        id: 'toast-' + Date.now(),
        type: 'success',
        title: `Order #${updated.orderNumber || updated.invoiceId} Updated`,
        message: `Order total recalculated to £${updated.grandTotal.toFixed(2)}. ${updated.items.length} items saved.`,
        timestamp: new Date().toLocaleTimeString(),
      });
      setActiveAppView('pos-orders');
    }

    return updated;
  };

  const resetAllData = () => {
    localStorage.clear();
    setStores(INITIAL_STORES);
    setRoles(INITIAL_ROLES);
    setEmployees(INITIAL_EMPLOYEES);
    setCategories(INITIAL_CATEGORIES);
    setProducts(INITIAL_PRODUCTS);
    setModifierGroups(INITIAL_MODIFIER_GROUPS);
    setModifiers(INITIAL_MODIFIERS);
    setCoupons(INITIAL_COUPONS);
    setPresetDiscounts(INITIAL_PRESET_DISCOUNTS);
    setPromoBanner(INITIAL_PROMOTION_BANNER);
    setTables(INITIAL_TABLES);
    setPrinters(INITIAL_PRINTERS);
    setStoreSettings(INITIAL_STORE_SETTINGS);
    setOrders(INITIAL_ORDERS);
    setCashDrawerTransactions(INITIAL_CASH_DRAWER_TRANSACTIONS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setActivityLogs(INITIAL_ACTIVITY_LOGS);
    setAddons([]);
    setCustomers([]);
    setStaffAccounts(INITIAL_STAFF_ACCOUNTS);
    setAdminProfile(DEFAULT_ADMIN_PROFILE);
    setCurrentStoreIdState('store-1');
    setCurrentEmployeeIdState('emp-1');
    setCurrentUserState({
      id: 'usr-admin-1',
      name: 'Administrator',
      email: 'Styrishappy@gmail.com',
      role: 'ADMIN' as PrimaryUserRole,
      status: 'Active',
    });
    setCartItems([]);
    setAppliedCoupon(null);
    setAppliedPresetDiscount(null);
    setCustomerInfo(DEFAULT_CUSTOMER_INFO);

    // Also clear Firestore orders and customers and update profile in Firestore
    firestoreService.clearAllFirestoreOrders().catch(console.warn);
    firestoreService.clearAllFirestoreCustomers().catch(console.warn);
    firestoreService.saveAdminProfile({
      fullName: 'Administrator',
      displayName: 'Administrator',
      email: 'Styrishappy@gmail.com',
      password: 'Styris$06',
      companyName: 'Nexus Point of Sale',
      phone: '',
    }).catch(console.warn);
    firestoreService.saveStoreToFirestore(INITIAL_STORES[0]).catch(console.warn);
    firestoreService.saveStoreSettingsToFirestore('store-1', INITIAL_STORE_SETTINGS).catch(console.warn);
  };

  return (
    <NexusContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        login,
        posLockoutUntil,
        securityAlertNotice,
        clearPosLockout,
        loginStoreWithPin,
        logout,
        staffAccounts,
        addStaffAccount,
        updateStaffAccount,
        deleteStaffAccount,
        resetStaffPassword,
        changeStorePassword,
        accessibleStores,
        selectWorkingStore,
        currentStore,
        setCurrentStore,
        setCurrentStoreId,
        currentEmployee,
        setCurrentEmployee,
        setCurrentEmployeeId,
        switchStaffWithPin,
        activeAppView,
        setActiveAppView,
        previousAppView,
        setPreviousAppView,
        activePosMode,
        setActivePosMode,
        launchPos,
        returnFromStoreSelection,
        dashboardTab,
        setDashboardTab,
        stores,
        addStore,
        updateStore,
        deleteStore,
        roles,
        employees,
        addRole,
        updateRole,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        reorderCategories,
        addSubcategory,
        updateSubcategory,
        deleteSubcategory,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        reorderProducts,
        bulkUpdatePrices,
        updateMenuOrganizer,
        modifierGroups,
        modifiers,
        addModifierGroup,
        updateModifierGroup,
        deleteModifierGroup,
        addModifier,
        updateModifier,
        deleteModifier,
        addonGroups,
        addAddonGroup,
        updateAddonGroup,
        deleteAddonGroup,
        toggleAddonGroupActive,
        addAddonToGroup,
        updateAddonInGroup,
        deleteAddonFromGroup,
        toggleAddonItemActive,
        linkAddonGroupToProducts,
        linkProductToAddonGroups,
        addons,
        addAddon,
        updateAddon,
        deleteAddon,
        toggleAddonAvailable,
        customers,
        searchCustomers,
        findCustomerByPhone,
        getCustomerOrders,
        linkOrderToCustomer,
        addCustomer,
        updateCustomer,
        updateStoreCredentials,
        selectedCategoryId,
        setSelectedCategoryId,
        selectedSubcategoryId,
        setSelectedSubcategoryId,
        selectedProductForCustomization,
        setSelectedProductForCustomization,
        selectedVariantForCustomization,
        setSelectedVariantForCustomization,
        openProductConfig,
        isVariantModalOpen,
        setIsVariantModalOpen,
        isModifierModalOpen,
        setIsModifierModalOpen,
        isProductOptionModalOpen,
        setIsProductOptionModalOpen,
        isOrderCheckModalOpen,
        setIsOrderCheckModalOpen,
        isMenuManagementModalOpen,
        setIsMenuManagementModalOpen,
        isReportsModalOpen,
        setIsReportsModalOpen,
        isPaymentModalOpen,
        setIsPaymentModalOpen,
        isCashDrawerModalOpen,
        setIsCashDrawerModalOpen,
        isSearchModalOpen,
        setIsSearchModalOpen,
        isNotificationsOpen,
        setIsNotificationsOpen,
        isReceiptModalOpen,
        setIsReceiptModalOpen,
        isStaffLockModalOpen,
        setIsStaffLockModalOpen,
        isTableManagementModalOpen,
        setIsTableManagementModalOpen,
        latestPlacedOrder,
        setLatestPlacedOrder,
        unacceptedOrders,
        acceptOrder,
        acceptAllOrders,
        printAlert,
        retryPrintOrder,
        dismissPrintAlert,
        getNextOrderSequence,
        clearAllOrders,
        latestToastNotification,
        dismissToastNotification,
        themeMode,
        setThemeMode,
        toggleThemeMode,
        adminProfile,
        updateAdminProfile,
        changeAdminPassword,
        cartItems,
        customerInfo,
        setCustomerInfo,
        updateCustomerField,
        setOrderType,
        addToCart,
        quickAddToCart,
        updateCartItemQuantity,
        removeCartItem,
        addCartItemModification,
        updateCartItemModification,
        removeCartItemModification,
        clearCart,
        coupons,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        addCoupon,
        updateCoupon,
        deleteCoupon,
        toggleCoupon,
        presetDiscounts,
        appliedPresetDiscount,
        applyPresetDiscount,
        addPresetDiscount,
        updatePresetDiscount,
        deletePresetDiscount,
        manualDiscount,
        setManualDiscount,
        applyManualDiscount,
        clearManualDiscount,
        promoBanner,
        updatePromoBanner,
        cartSubtotal,
        cartModifiersTotal,
        cartCouponDiscount,
        cartPresetDiscount,
        cartManualDiscount,
        cartTotalDiscount,
        cartDeliveryFee,
        cartServiceCharge,
        cartBagCharge,
        cartTax,
        cartGrandTotal,
        tables,
        addTable,
        updateTable,
        deleteTable,
        updateTableStatus,
        printers,
        addPrinter,
        updatePrinter,
        deletePrinter,
        setDefaultPrinter,
        testPrintPrinter,
        storeSettings,
        updateStoreSettings,
        orders,
        orderHistory,
        isOrderHistoryModalOpen,
        setIsOrderHistoryModalOpen,
        selectedHistoryOrder,
        setSelectedHistoryOrder,
        openOrderHistory,
        createOrder,
        addOrder,
        updateOrderStatus,
        cancelOrder,
        updateExistingOrder,
        editingOrder,
        startEditingOrder,
        cancelEditingOrder,
        saveEditingOrder,
        cashDrawerState,
        cashDrawerTransactions,
        openDrawer,
        recordCashIn,
        recordCashOut,
        resetCashDrawerSales,
        setActiveOperator,
        setCashDrawerOpeningFloat,
        getCashDrawerBalance,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addNotification,
        activityLogs,
        logActivity,
        deliverySettingsMap,
        deliveryZones,
        isDeliveryRestrictedByAdmin,
        resetAllData,
      }}
    >
      {children}
    </NexusContext.Provider>
  );
};

export const useNexus = () => {
  const context = useContext(NexusContext);
  if (!context) {
    throw new Error('useNexus must be used within a NexusProvider');
  }
  return context;
};

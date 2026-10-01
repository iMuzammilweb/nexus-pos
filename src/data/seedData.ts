import {
  Store,
  Role,
  Employee,
  Category,
  ModifierGroup,
  Modifier,
  AddonGroup,
  AddonItem,
  Product,
  Order,
  CashDrawerTransaction,
  NotificationItem,
  ActivityLogEntry,
  Coupon,
  TableRecord,
  PrinterDevice,
  StoreSettingsData,
  PresetDiscount,
  PromotionBanner,
  StaffAccount,
} from '../types';

export const INITIAL_STORES: Store[] = [
  {
    id: 'store-1',
    storeCode: 'STORE-001',
    businessName: 'Nexus Point of Sale',
    legalEntityName: '',
    domainName: '',
    domain: '',
    email: 'Styrishappy@gmail.com',
    storeUsername: 'Styrishappy@gmail.com',
    storePassword: '••••••••',
    storePasswordHash: '4638706d87178a9c336fc19d45362ff4a6cf8ab4d3fb06016bfbf96fbca8974a',
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
  },
];

export const INITIAL_STAFF_ACCOUNTS: StaffAccount[] = [
  {
    id: 'staff-1',
    name: 'Staff Operator',
    username: 'staff@nexus-pos.com',
    email: 'staff@nexus-pos.com',
    password: 'Styris$123',
    phone: '+44 7700 900123',
    role: 'STAFF',
    assignedStoreId: 'store-1',
    assignedStoreIds: ['store-1'],
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_ROLES: Role[] = [
  {
    id: 'role-admin',
    name: 'Administrator',
    description: 'Full unconstrained platform control, store configs, employee management, billing & system audit.',
    badgeColor: 'bg-purple-900/40 text-purple-300 border-purple-700/50',
    permissions: [
      'stores:view',
      'stores:manage',
      'pos:access',
      'orders:view',
      'orders:manage',
      'orders:discount',
      'cash_drawer:access',
      'employees:view',
      'employees:manage',
      'menu:view',
      'menu:manage',
      'reports:view',
      'activity:view',
    ],
  },
  {
    id: 'role-manager',
    name: 'Store Manager',
    description: 'Manages daily store operations, menu pricing, shift employees, discounts and drawer balancing.',
    badgeColor: 'bg-blue-900/40 text-blue-300 border-blue-700/50',
    permissions: [
      'stores:view',
      'pos:access',
      'orders:view',
      'orders:manage',
      'orders:discount',
      'cash_drawer:access',
      'employees:view',
      'menu:view',
      'menu:manage',
      'reports:view',
      'activity:view',
    ],
  },
  {
    id: 'role-cashier',
    name: 'POS Cashier',
    description: 'Front-of-house order taker, payment processor, customer details lookup, and drawer operator.',
    badgeColor: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
    permissions: [
      'pos:access',
      'orders:view',
      'orders:manage',
      'cash_drawer:access',
      'menu:view',
    ],
  },
  {
    id: 'role-kitchen',
    name: 'Kitchen Display Staff',
    description: 'Kitchen prep screen viewer, updates cooking status from Current to Ready for delivery/collection.',
    badgeColor: 'bg-amber-900/40 text-amber-300 border-amber-700/50',
    permissions: ['orders:view', 'orders:manage'],
  },
  {
    id: 'role-delivery',
    name: 'Delivery Courier',
    description: 'Fleet driver view, addresses, customer phone contact, and marks delivery completion.',
    badgeColor: 'bg-cyan-900/40 text-cyan-300 border-cyan-700/50',
    permissions: ['orders:view', 'orders:manage'],
  },
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
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
  },
];

export const INITIAL_MODIFIERS: Modifier[] = [];

export const INITIAL_MODIFIER_GROUPS: ModifierGroup[] = [];

export const INITIAL_ADDON_GROUPS: AddonGroup[] = [];

export const INITIAL_CATEGORIES: Category[] = [];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_COUPONS: Coupon[] = [];

export const INITIAL_CASH_DRAWER_TRANSACTIONS: CashDrawerTransaction[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const INITIAL_ACTIVITY_LOGS: ActivityLogEntry[] = [];

export const INITIAL_TABLES: TableRecord[] = [];

export const INITIAL_PRINTERS: PrinterDevice[] = [];

export const INITIAL_PRESET_DISCOUNTS: PresetDiscount[] = [];

export const INITIAL_PROMOTION_BANNER: PromotionBanner = {
  enabled: false,
  message: '',
  badgeText: '',
  bgColor: '#2563eb',
  textColor: '#ffffff',
  linkText: '',
};

export const INITIAL_STORE_SETTINGS: StoreSettingsData = {
  restaurantName: 'Nexus Point of Sale',
  legalEntityName: '',
  branchCode: 'STORE-001',
  cuisineType: '',
  taxRegistrationNumber: '',
  email: 'Styrishappy@gmail.com',
  phone: '',
  websiteUrl: '',
  address: '',
  city: '',
  postcode: '',

  logoUrl: '',
  faviconUrl: '',
  bannerUrl: '',

  isDeliveryEnabled: true,
  deliveryFee: 0.00,
  freeDeliveryThreshold: 0.00,
  minimumDeliveryOrder: 0.00,
  isPickupEnabled: true,
  isTableServiceEnabled: true,
  isOnlineOrderingOpen: true,
  isOfflineMode: false,

  productColumns: 5,
  webOrderingLayout: 'horizontal',
  themeAccent: '#2563eb',

  seoMetaTitle: 'Nexus Point of Sale | Professional Online Ordering',
  seoMetaDescription: 'Order online directly from our official portal.',
  seoKeywords: 'pos, restaurant, online ordering, takeaway, delivery',
  googleAnalyticsId: '',
  facebookPixelId: '',

  isCustomerDisplayEnabled: true,
  customerDisplayWelcomeMessage: 'Welcome to our store!',
  isSurpriseBoxEnabled: false,
  surpriseBoxDiscountPercent: 0,

  inStoreWaitingTimeMins: 15,
  deliveryWaitingTimeMins: 30,
  pickupWaitingTimeMins: 15,
  serviceChargePercent: 0.0,
  serviceChargeTaxable: false,
  isCharityRoundupEnabled: false,
  charityName: '',
  isCashPaymentEnabled: true,
  isOnlinePaymentEnabled: true,
  isPblQrPaymentEnabled: true,
  autoAcceptOrders: true,
  bagChargeAmount: 0.00,
  isUpsellingEnabled: false,
  upsellingMessage: '',
  platformCommissionPercent: 0.0,
  onlineSavingsBannerText: '',
};

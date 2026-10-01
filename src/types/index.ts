export type OrderType = 'Delivery' | 'Pickup' | 'In-Store' | 'Table Order';
export type OrderStatus = 'Current' | 'On The Way' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Paid' | 'Pending' | 'Refunded';
export type PaymentMethod = 'Card' | 'Cash' | 'Online' | 'Split' | 'Contactless';
export type StoreStatus = 'Active' | 'Inactive' | 'Suspended';
export type EmployeeStatus = 'Active' | 'On Break' | 'Inactive';
export type EmployeeRole = 'Super Admin' | 'Store Manager' | 'Cashier' | 'Kitchen Staff' | 'Delivery Driver';
export type PrimaryUserRole = 'SUPER_ADMIN' | 'STAFF' | 'STORE';
export type OrderSource = 'ADMIN POS' | 'STAFF POS' | 'STORE POS' | 'ONLINE' | 'CALL_CENTER';

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: PrimaryUserRole;
  storeId?: string; // Permanently linked for STORE role
  assignedStoreId?: string;
  assignedStoreIds?: string[]; // Multiple stores assigned to staff member
  storeName?: string;
  status: 'Active' | 'Disabled';
  lastLogin?: string;
  createdAt: string;
  phone?: string;
  avatarUrl?: string;
}

export interface StaffAccount {
  id: string;
  name: string;
  username: string;
  email: string;
  password?: string;
  phone?: string;
  role: 'STAFF';
  assignedStoreId?: string;
  assignedStoreIds: string[];
  status: 'Active' | 'Disabled';
  createdAt: string;
  lastLogin?: string;
}

export interface Store {
  id: string;
  storeCode?: string; // e.g. "STORE-001"
  businessName: string;
  legalEntityName?: string;
  domainName?: string;
  domain?: string;
  email: string;
  mobileNumber?: string;
  phone?: string;
  country?: string;
  activeStatus?: StoreStatus;
  isActive?: boolean;
  callCenterUrl?: string;
  daysUntilDeletion?: number;
  address: string;
  postcode: string;
  city: string;
  latitude?: number;
  longitude?: number;
  currencySymbol?: string;
  currency?: string;
  vatNumber?: string;
  taxRate?: number; // e.g. 0.20
  taxRatePercentage?: number; // e.g. 20
  isDeliveryEnabled?: boolean;
  deliveryFee?: number;
  deliveryRadiusMiles?: number;
  allowedPostcodes?: string;
  minimumDeliveryOrder?: number;
  serviceChargeRate?: number; // e.g. 0.03
  subscriptionPlan?: 'Standard' | 'Premium POS' | 'Enterprise POS Pro';
  logo?: string;
  image?: string;
  logoUrl?: string;
  // Store Account credentials
  storeUsername?: string;
  storePassword?: string;
  storePin?: string; // 6-digit PIN code for Store POS quick branch login
  storePasswordHash?: string;
  storeLoginUrl?: string;
  accountStatus?: 'Active' | 'Disabled';
  lastLogin?: string;
  createdAt: string;
  updatedAt?: string;
}

export type PermissionKey =
  | 'stores:view'
  | 'stores:manage'
  | 'pos:access'
  | 'orders:view'
  | 'orders:manage'
  | 'orders:discount'
  | 'cash_drawer:access'
  | 'employees:view'
  | 'employees:manage'
  | 'menu:view'
  | 'menu:manage'
  | 'reports:view'
  | 'activity:view';

export interface Role {
  id: string;
  name: string;
  description: string;
  badgeColor: string;
  permissions: PermissionKey[];
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  roleId?: string;
  role?: EmployeeRole | string;
  storeId: string;
  status?: EmployeeStatus;
  isActive?: boolean;
  pinCode: string;
  avatarUrl?: string;
  avatar?: string;
  hourlyRate?: number;
  lastLogin?: string;
  joinedDate?: string;
}

export interface Category {
  id: string;
  storeId?: string; // Restaurant store ID (or 'all' for franchise-wide)
  name: string;
  slug: string;
  iconName: string;
  image: string;
  displayOrder: number;
  bgColor?: string;
  textColor?: string;
  badgeText?: string;
  description?: string;
  isPublished?: boolean;
  itemCount?: number;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  displayOrder: number;
}

export interface Modifier {
  id: string;
  name: string;
  description?: string;
  price: number; // 0.00 for free, 0.80, 1.00, etc.
  isAvailable: boolean;
  category?: 'Sauce' | 'Veg' | 'Meat' | 'Cheese' | 'Dips' | 'Extras' | string;
}

export interface ModifierGroup {
  id: string;
  name: string;
  description?: string;
  minSelections: number;
  maxSelections: number;
  isRequired: boolean;
  allowMultiple: boolean;
  modifierIds: string[];
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string; // e.g. "9 Inch", "12 Inch", "16 Inch", "Single", "Regular", "Large"
  description?: string;
  sizeLabel: string;
  price: number;
  sku: string;
  isDefault?: boolean;
}

export interface AddonItem {
  id: string;
  groupId: string;
  name: string;
  description?: string;
  price: number; // 0.00 for free, 0.80, 1.50, etc.
  isAvailable?: boolean;
  category?: string;
  displayOrder?: number;
}

export interface AddonGroup {
  id: string;
  storeId?: string; // 'all' or specific storeId
  name: string; // e.g. "Pizza Add-ons", "Burger Add-ons", "Kebab Add-ons"
  description?: string;
  minSelections?: number;
  maxSelections?: number;
  isRequired?: boolean;
  allowMultiple?: boolean;
  isAvailable?: boolean;
  linkedProductIds: string[]; // List of Menu Item IDs linked to this Add-on Group
  items: AddonItem[]; // Unlimited modifiers/add-ons with name and individual price
  addons?: AddonItem[]; // Alias for backward compatibility
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuAddon {
  id: string;
  storeId?: string; // 'all' or specific storeId
  name: string;
  description?: string;
  price: number;
  category?: 'Sauce' | 'Veg' | 'Meat' | 'Cheese' | 'Dips' | 'Sides' | 'Drinks' | 'Extras' | string;
  isAvailable: boolean;
  linkedProductIds: string[]; // Linked products
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerRecord {
  id: string;
  storeId: string;
  name: string;
  phone: string;
  normalizedPhone: string;
  email?: string;
  address: string;
  addressLine2?: string;
  postcode: string;
  totalOrders: number;
  totalSpend: number;
  lastOrderDate?: string;
  notes?: string;
  orderHistory?: string[]; // order IDs
  createdAt: string;
  updatedAt: string;
}

export interface AdminProfile {
  fullName: string;
  displayName?: string;
  ceoName?: string;
  email: string;
  password?: string;
  phone?: string;
  companyName?: string;
  avatarUrl?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  storeId?: string; // Restaurant store ID (or 'all' for franchise-wide)
  categoryId: string;
  subcategoryId: string;
  code: string; // e.g. "(01)", "(02)"
  name: string;
  description: string;
  image: string;
  basePrice: number;
  displayOrder?: number;
  cardBgColor?: string;
  cardTextColor?: string;
  customBadge?: string;
  cardStyle?: 'standard' | 'highlight' | 'compact' | 'accent';
  isVegetarian?: boolean;
  isSpicy?: boolean;
  isPopular?: boolean;
  isAvailable: boolean;
  variants: ProductVariant[];
  modifierGroupIds: string[];
  addonGroupIds?: string[];
  linkedAddonIds?: string[];
  addonOverrides?: Record<string, number>; // modifierId -> custom price override
}

export interface TableRecord {
  id: string;
  storeId: string;
  storeName?: string;
  tableNumber: string; // e.g. "T-01", "T-02", "Booth A"
  zone: string; // "Main Dining", "Window Patio", "Bar Area", "Upstairs Mezzanine"
  capacity: number; // seat count
  status: 'Available' | 'Occupied' | 'Reserved' | 'Cleaning' | 'Disabled';
  currentOrderId?: string;
  guestCount?: number;
  assignedStaff?: string;
  notes?: string;
  lastUpdated?: string;
}

export interface PrinterDevice {
  id: string;
  storeId: string;
  name: string; // e.g. "Main Counter Thermal 80mm"
  type: 'Receipt 80mm' | 'Receipt 58mm' | 'Kitchen KOT' | 'Bar Ticket' | 'Label 4x6' | string;
  connection: 'Ethernet LAN' | 'Bluetooth' | 'USB' | 'Wi-Fi Cloud' | 'LAN' | 'Wi-Fi' | string;
  ipAddress?: string;
  port?: number;
  macAddress?: string;
  status: 'Online' | 'Ready' | 'Low Paper' | 'Offline';
  paperWidth: '80mm' | '58mm' | '100mm' | string;
  isDefault: boolean;
  autoCut: boolean;
  soundAlert: boolean;
  openDrawerOnPrint?: boolean;
  receiptCount: number;
  lastTestPrint?: string;
}

export interface StoreSettingsData {
  // Store / Restaurant Information
  restaurantName: string;
  businessName?: string;
  legalEntityName: string;
  branchCode: string;
  cuisineType: string;
  taxRegistrationNumber: string;
  taxNumber?: string;
  currencySymbol?: string;
  domainUrl?: string;
  bannerImageUrl?: string;
  minDeliveryOrder?: number;
  isDineInEnabled?: boolean;
  posProductColumns?: number;
  isCustomerFacingDisplayEnabled?: boolean;
  customerDisplayWelcomeText?: string;
  surpriseBoxEnabled?: boolean;
  surpriseBoxPrice?: number;
  email: string;
  phone: string;
  websiteUrl: string;
  address: string;
  city: string;
  postcode: string;

  // Media & Logos
  logoUrl: string;
  faviconUrl: string;
  bannerUrl: string;

  // Website & Fulfillment Settings
  isDeliveryEnabled: boolean;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  minimumDeliveryOrder: number;
  deliveryRadiusMiles?: number;
  allowedPostcodes?: string;
  storeLatitude?: number;
  storeLongitude?: number;
  deliveryFeeType?: 'fixed' | 'distance_based';
  deliveryFeePerMile?: number;
  isPickupEnabled: boolean;
  isTableServiceEnabled: boolean;
  isOnlineOrderingOpen: boolean;
  isOfflineMode: boolean;

  // Layout & Display
  productColumns: 4 | 5 | 6 | number;
  webOrderingLayout: 'horizontal' | 'vertical' | 'horizontal-tabs' | 'vertical-sidebar' | string;
  themeAccent: string;

  // SEO & Analytics
  seoMetaTitle: string;
  seoMetaDescription: string;
  seoKeywords: string;
  googleAnalyticsId: string;
  facebookPixelId: string;

  // Customer Display & Surprise Box
  isCustomerDisplayEnabled: boolean;
  customerDisplayWelcomeMessage: string;
  isSurpriseBoxEnabled: boolean;
  surpriseBoxDiscountPercent: number;

  // Advanced Operational Options
  inStoreWaitingTimeMins: number;
  deliveryWaitingTimeMins: number;
  pickupWaitingTimeMins: number;
  serviceChargePercent: number;
  serviceChargeTaxable: boolean;
  isCharityRoundupEnabled: boolean;
  charityName: string;
  isCashPaymentEnabled: boolean;
  isOnlinePaymentEnabled: boolean;
  isPblQrPaymentEnabled: boolean;
  autoAcceptOrders: boolean;
  bagChargeAmount: number;
  isUpsellingEnabled: boolean;
  upsellingMessage: string;
  platformCommissionPercent: number;
  onlineSavingsBannerText: string;
  [key: string]: any;
}

export interface PresetDiscount {
  id: string;
  name: string;
  code?: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  isActive: boolean;
  requiresManagerPin?: boolean;
  color?: string;
}

export interface PromotionBanner {
  enabled: boolean;
  message: string;
  badgeText: string;
  bgColor: string;
  textColor: string;
  linkText?: string;
}

export interface Coupon {
  code: string;
  name?: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  minOrder: number;
  maxDiscount?: number;
  validUntil: string;
  startDate?: string;
  usageLimit?: number;
  usedCount?: number;
  applicableCategoryIds?: string[];
  applicableProductIds?: string[];
  isActive: boolean;
}

export type ActiveAppView =
  | 'pos-menu'
  | 'pos-orders'
  | 'dashboard'
  | 'cash-drawer'
  | 'store-selection'
  | 'login'
  | 'staff-pos';

export type DashboardTab =
  | 'overview'
  | 'stores'
  | 'roles'
  | 'employees'
  | 'activity'
  | 'menu-management'
  | 'addons-management'
  | 'promotions'
  | 'store-settings'
  | 'delivery-settings'
  | 'table-management'
  | 'printer-devices'
  | 'admin-security'
  | 'staff-accounts'
  | 'store-accounts'
  | 'customers'
  | 'discounts'
  | 'reports'
  | 'payments'
  | 'business-settings'
  | 'pos-settings'
  | 'order-notifications';

export interface SelectedModifier {
  modifierId: string;
  modifierGroupId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface SelectedAddon {
  addonId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface ItemModification {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string; // unique cart line item id
  productId: string;
  productName: string;
  productCode: string;
  productImage: string;
  variantId: string;
  variantName: string;
  variantSize: string;
  unitPrice: number;
  selectedModifiers: SelectedModifier[];
  selectedAddons?: SelectedAddon[];
  modifications?: ItemModification[];
  modifiersTotal: number;
  modificationsTotal?: number;
  addonsTotal?: number;
  quantity: number;
  totalPrice: number;
  specialInstructions?: string;
  notes?: string;
}

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  orderType: OrderType;
  // Delivery specific fields
  ukPostcode: string;
  fullAddress: string;
  houseNumber?: string;
  buildingName?: string;
  street?: string;
  town?: string;
  city?: string;
  county?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  distanceMiles?: number;
  deliveryDurationMins?: number;
  deliveryZone?: string;
  deliveryFee?: number;
  deliveryMinimumOrder?: number;
  estimatedDeliveryTime?: string;
  addressValidationStatus?: 'VALID' | 'WARNING' | 'UNVERIFIED' | 'INVALID';
  addressLine2?: string;
  driverInstructions?: string;
  // Pickup specific fields
  pickupTime?: string;
  // In-Store specific fields
  tableReference?: string;
  // Common
  couponCode?: string;
  notes?: string;
}

export interface Order {
  id: string;
  invoiceId: string; // e.g. #NEX-7021
  orderNumber?: string; // e.g. #1, #2, #1048
  source?: OrderSource; // 'ADMIN POS' | 'STAFF POS' | 'STORE POS' | 'ONLINE' | 'CALL_CENTER'
  orderSource?: string;
  storeId: string;
  storeName?: string;
  tableId?: string;
  tableNumber?: string;
  customer: CustomerInfo;
  items: CartItem[];
  subtotal: number;
  modifiersTotal: number;
  discount: number;
  couponDiscount: number;
  couponCode?: string;
  manualDiscount?: number;
  presetDiscount?: number;
  discountNote?: string;
  deliveryFee: number;
  serviceCharge: number;
  bagCharge?: number;
  tax: number;
  grandTotal: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  orderStatus: OrderStatus;
  orderType: OrderType;
  isAccepted?: boolean;
  acceptedAt?: string;
  acceptedBy?: string;
  isEditedOrder?: boolean;
  lastEditedAt?: string;
  isPrinted?: boolean;
  printedAt?: string;
  printCount?: number;
  printError?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  orderDate?: string;
  cashierName: string;
  staffName?: string;
  orderSentBy?: string;
  sentByStaff?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
  deliveryDistanceMiles?: number;
  deliveryDurationMins?: number;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  deliveryPlaceId?: string;
  deliveryZone?: string;
  deliveryMinimumOrder?: number;
  addressValidationStatus?: 'VALID' | 'WARNING' | 'UNVERIFIED' | 'INVALID';
}

export interface CashDrawerTransaction {
  id: string;
  storeId: string;
  cashierId: string;
  cashierName: string;
  type: 'Cash-In' | 'Cash-Out' | 'Drawer-Open' | 'Sale-Cash';
  amount: number;
  reason: string;
  balanceBefore: number;
  balanceAfter: number;
  timestamp: string;
}

export interface CashDrawerState {
  isOpen: boolean;
  openingBalance: number;
  currentBalance: number;
  totalCashSales: number;
  totalCashIn: number;
  totalCashOut: number;
  lastOpenedAt?: string;
}

export interface NotificationItem {
  id: string;
  storeId?: string;
  title: string;
  message: string;
  type: 'order' | 'system' | 'alert' | 'cash' | 'success';
  read: boolean;
  timestamp: string;
  linkTo?: 'orders' | 'menu' | 'cash-drawer' | 'stores' | string;
}

export interface ActivityLog {
  id: string;
  storeId: string;
  storeName?: string;
  userId?: string;
  userName?: string;
  performedBy?: string;
  roleName?: string;
  action: string;
  details: string;
  category?: 'Order' | 'Auth' | 'Cash Drawer' | 'Store' | 'Employee' | 'Menu' | 'System' | string;
  timestamp: string;
  ipAddress?: string;
  device?: string;
}

export type DeliveryRuleType = 'area' | 'district' | 'sector' | 'full';

export interface DeliveryZone {
  id: string;
  storeId: string;
  postcodeRule: string; // e.g. "HA", "HA9", "HA9 8", "HA9 8AB"
  ruleType: DeliveryRuleType;
  deliveryFee: number;
  minimumOrder: number;
  estimatedTime: string; // e.g. "30–45 mins"
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DeliveryMethodType = 'postcode' | 'radius' | 'postcode_and_radius';

export interface StoreDeliverySettings {
  storeId: string;
  enabled: boolean;
  method: DeliveryMethodType;
  radiusMiles: number;
  defaultFee: number;
  defaultMinimumOrder: number;
  defaultEstimatedTime: string;
  storeAddress: string;
  storeLatitude: number;
  storeLongitude: number;
  restrictedPostcodes?: string[];
  restrictedAddresses?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DeliveryCheckResult {
  available: boolean;
  reason?: 'INVALID_ADDRESS' | 'INVALID_POSTCODE' | 'OUTSIDE_DELIVERY_AREA' | 'OUTSIDE_RADIUS' | 'MINIMUM_ORDER_NOT_MET' | 'DELIVERY_DISABLED' | 'STORE_UNAVAILABLE' | string | null;
  deliveryZone?: string | null;
  deliveryFee: number;
  minimumOrder: number;
  estimatedTime: string;
  distanceMiles: number;
  matchedRuleType?: 'area' | 'district' | 'sector' | 'full' | 'radius' | 'default';
  message: string;
}

export type ActivityLogEntry = ActivityLog;

export interface BreadcrumbItem {
  label: string;
  step: 'category' | 'subcategory' | 'product' | 'variant' | 'modifiers';
  data?: any;
}

export interface PrintAlert {
  order: Order;
  status: 'failed' | 'printing' | 'success';
  error?: string;
  printerName?: string;
}



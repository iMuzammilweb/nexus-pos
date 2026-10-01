import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Store,
  Category,
  Product,
  Order,
  CustomerRecord,
  MenuAddon,
  AddonGroup,
  AddonItem,
  AdminProfile,
  TableRecord,
  PrinterDevice,
  Coupon,
  PresetDiscount,
  StoreSettingsData,
  Employee,
  Role,
  DeliveryZone,
  StoreDeliverySettings,
  CashDrawerTransaction,
  StaffAccount,
} from '../types';

// Collection Constants
export const COLLECTIONS = {
  ADMIN_PROFILE: 'admin_profile',
  STORES: 'stores',
  STORE_SETTINGS: 'store_settings',
  DELIVERY_SETTINGS: 'delivery_settings',
  DELIVERY_ZONES: 'delivery_zones',
  CATEGORIES: 'categories',

  PRODUCTS: 'products',
  ADDONS: 'addons',
  ADDON_GROUPS: 'addon_groups',
  ORDERS: 'orders',
  CUSTOMERS: 'customers',
  STAFF_ACCOUNTS: 'staff_accounts',
  EMPLOYEES: 'employees',
  ROLES: 'roles',
  TABLES: 'tables',
  PRINTERS: 'printers',
  COUPONS: 'coupons',
  PRESET_DISCOUNTS: 'preset_discounts',
  SECURITY_SETTINGS: 'security_settings',
  AUTHORIZED_DEVICES: 'authorized_devices',
  CASH_DRAWER: 'cash_drawer',
  CASH_DRAWER_TRANSACTIONS: 'cash_drawer_transactions',
};

// Normalize Phone Number for indexing and exact matching
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/[^0-9+]/g, '').trim();
}

/* =========================================================================
   1. SUPER ADMIN PROFILE
========================================================================= */
const ADMIN_DOC_ID = 'master_admin';

export async function fetchAdminProfile(): Promise<AdminProfile | null> {
  try {
    const docRef = doc(db, COLLECTIONS.ADMIN_PROFILE, ADMIN_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as AdminProfile;
    }
  } catch (err) {
    console.error('Error fetching admin profile:', err);
  }
  return null;
}

export async function saveAdminProfile(profile: Partial<AdminProfile>): Promise<boolean> {
  try {
    const docRef = doc(db, COLLECTIONS.ADMIN_PROFILE, ADMIN_DOC_ID);
    // Read directly (not via fetchAdminProfile, which swallows errors) so a failed
    // read can never be mistaken for "no profile yet" and reset the password to defaults
    const snap = await getDoc(docRef);
    const existing = snap.exists() ? (snap.data() as AdminProfile) : null;
    const dataToSave: Record<string, any> = existing
      ? { updatedAt: new Date().toISOString() }
      : {
          fullName: 'Administrator',
          displayName: 'Administrator',
          ceoName: 'Administrator',
          email: 'Styrishappy@gmail.com',
          password: 'Styris$06',
          phone: '+44 7911 123456',
          companyName: 'NEXUS PIZZA & GRILL',
          updatedAt: new Date().toISOString(),
        };
    if (profile.fullName) {
      dataToSave.fullName = profile.fullName;
      dataToSave.ceoName = profile.fullName;
    }
    if (profile.displayName || profile.fullName) dataToSave.displayName = profile.displayName || profile.fullName;
    if (profile.email) dataToSave.email = profile.email;
    if (profile.password) dataToSave.password = profile.password;
    if (profile.phone) dataToSave.phone = profile.phone;
    if (profile.companyName) dataToSave.companyName = profile.companyName;
    await setDoc(docRef, dataToSave, { merge: true });
    return true;
  } catch (err) {
    console.error('Error saving admin profile to Firestore:', err);
    return false;
  }
}

/* =========================================================================
   2. STORES & CREDENTIALS
========================================================================= */
export async function saveStoreToFirestore(store: Partial<Store> & { id: string }): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.STORES, store.id);
    await setDoc(docRef, store, { merge: true });
  } catch (err) {
    console.error('Error saving store to Firestore:', err);
  }
}

export async function deleteStoreFromFirestore(storeId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.STORES, storeId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting store from Firestore:', err);
  }
}

/* =========================================================================
   3. MENU ADDONS (MANAGEMENT & PERSISTENCE)
========================================================================= */
export async function saveAddonToFirestore(addon: MenuAddon): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.ADDONS, addon.id);
    await setDoc(docRef, addon, { merge: true });
  } catch (err) {
    console.error('Error saving addon to Firestore:', err);
  }
}

export async function updateAddonInFirestore(addonId: string, updates: Partial<MenuAddon>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.ADDONS, addonId);
    await setDoc(docRef, updates, { merge: true });
  } catch (err) {
    console.error('Error updating addon in Firestore:', err);
  }
}

export async function deleteAddonFromFirestore(addonId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.ADDONS, addonId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting addon from Firestore:', err);
  }
}

/* =========================================================================
   3.1 ADD-ON GROUPS (MODIFIERS & ADD-ON GROUPS)
========================================================================= */
export async function saveAddonGroupToFirestore(group: AddonGroup): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.ADDON_GROUPS, group.id);
    await setDoc(docRef, group, { merge: true });
  } catch (err) {
    console.error('Error saving addon group to Firestore:', err);
  }
}

export async function updateAddonGroupInFirestore(groupId: string, updates: Partial<AddonGroup>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.ADDON_GROUPS, groupId);
    await setDoc(docRef, updates, { merge: true });
  } catch (err) {
    console.error('Error updating addon group in Firestore:', err);
  }
}

export async function deleteAddonGroupFromFirestore(groupId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.ADDON_GROUPS, groupId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting addon group from Firestore:', err);
  }
}

/* =========================================================================
   4. PRODUCTS & CATEGORIES
========================================================================= */
export async function saveProductToFirestore(product: Product): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.PRODUCTS, product.id);
    await setDoc(docRef, product, { merge: true });
  } catch (err) {
    console.error('Error saving product to Firestore:', err);
  }
}

export async function updateProductInFirestore(productId: string, updates: Partial<Product>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.PRODUCTS, productId);
    await setDoc(docRef, updates, { merge: true });
  } catch (err) {
    console.error('Error updating product in Firestore:', err);
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.PRODUCTS, productId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting product from Firestore:', err);
  }
}

export async function saveCategoryToFirestore(category: Category): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.CATEGORIES, category.id);
    await setDoc(docRef, category, { merge: true });
  } catch (err) {
    console.error('Error saving category to Firestore:', err);
  }
}

export async function deleteCategoryFromFirestore(categoryId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.CATEGORIES, categoryId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting category from Firestore:', err);
  }
}

/* =========================================================================
   5. ORDERS (STORE RESTRICTED)
========================================================================= */
export async function saveOrderToFirestore(order: Order): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.ORDERS, order.id);
    await setDoc(docRef, order, { merge: true });
  } catch (err) {
    console.error('Error saving order to Firestore:', err);
  }
}

export async function updateOrderStatusInFirestore(orderId: string, status: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.ORDERS, orderId);
    await updateDoc(docRef, {
      orderStatus: status,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error updating order status in Firestore:', err);
  }
}

export async function updateOrderInFirestore(orderId: string, updates: Partial<Order>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.ORDERS, orderId);
    await setDoc(docRef, updates, { merge: true });
  } catch (err) {
    console.error('Error updating order in Firestore:', err);
  }
}

/* =========================================================================
   6. SECURE CUSTOMER DATABASE (STORE SPECIFIC & NORMALIZED)
========================================================================= */
export async function upsertCustomerOnOrder(
  storeIdOrOrder: string | Order,
  customerDataParam?: {
    firstName: string;
    lastName: string;
    phone: string;
    address?: string;
    addressLine2?: string;
    postcode?: string;
    orderId: string;
    grandTotal: number;
  }
): Promise<CustomerRecord | null> {
  let storeId: string;
  let customerData: {
    firstName: string;
    lastName: string;
    phone: string;
    address?: string;
    addressLine2?: string;
    postcode?: string;
    orderId: string;
    grandTotal: number;
  };

  if (typeof storeIdOrOrder === 'object' && storeIdOrOrder !== null) {
    const o = storeIdOrOrder as Order;
    storeId = o.storeId;
    customerData = {
      firstName: o.customer?.firstName || '',
      lastName: o.customer?.lastName || '',
      phone: o.customer?.phone || '',
      address: o.customer?.fullAddress || '',
      addressLine2: o.customer?.addressLine2 || '',
      postcode: o.customer?.ukPostcode || '',
      orderId: o.id,
      grandTotal: o.grandTotal || 0,
    };
  } else {
    storeId = storeIdOrOrder as string;
    customerData = customerDataParam || {
      firstName: '',
      lastName: '',
      phone: '',
      orderId: '',
      grandTotal: 0,
    };
  }

  if (!storeId || !customerData.phone) return null;

  const normalized = normalizePhone(customerData.phone);
  if (!normalized || normalized.length < 5) return null;

  // Composite document ID ensuring store-level uniqueness: storeId_normalizedPhone
  const customerDocId = `cust_${storeId}_${normalized.replace(/[^a-zA-Z0-9]/g, '_')}`;

  try {
    const docRef = doc(db, COLLECTIONS.CUSTOMERS, customerDocId);
    const snap = await getDoc(docRef);

    const enteredName = `${(customerData.firstName || '').trim()} ${(customerData.lastName || '').trim()}`.trim();
    const fullName = enteredName || 'Valued Customer';
    const now = new Date().toISOString();

    if (snap.exists()) {
      const existing = snap.data() as CustomerRecord;
      // Already counted this order: don't add it to the totals a second time
      if (customerData.orderId && (existing.orderHistory || []).includes(customerData.orderId)) {
        return existing;
      }
      const updatedRecord: CustomerRecord = {
        ...existing,
        name: enteredName || existing.name || fullName,
        phone: customerData.phone,
        normalizedPhone: normalized,
        address: customerData.address || existing.address || '',
        addressLine2: customerData.addressLine2 || existing.addressLine2 || '',
        postcode: customerData.postcode || existing.postcode || '',
        totalOrders: (existing.totalOrders || 0) + 1,
        totalSpend: Number(((existing.totalSpend || 0) + customerData.grandTotal).toFixed(2)),
        lastOrderDate: now,
        orderHistory: Array.from(new Set([...(existing.orderHistory || []), customerData.orderId])),
        updatedAt: now,
      };
      await setDoc(docRef, updatedRecord, { merge: true });
      return updatedRecord;
    } else {
      const newCustomer: CustomerRecord = {
        id: customerDocId,
        storeId,
        name: fullName,
        phone: customerData.phone,
        normalizedPhone: normalized,
        address: customerData.address || '',
        addressLine2: customerData.addressLine2 || '',
        postcode: customerData.postcode || '',
        totalOrders: 1,
        totalSpend: Number(customerData.grandTotal.toFixed(2)),
        lastOrderDate: now,
        orderHistory: [customerData.orderId],
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(docRef, newCustomer);
      return newCustomer;
    }
  } catch (err) {
    console.error('Error upserting customer to Firestore:', err);
    return null;
  }
}

export async function searchStoreCustomers(
  storeId: string,
  searchTerm: string
): Promise<CustomerRecord[]> {
  if (!storeId || !searchTerm.trim()) return [];

  const term = searchTerm.toLowerCase().trim();
  const normalizedTerm = normalizePhone(searchTerm);

  try {
    const colRef = collection(db, COLLECTIONS.CUSTOMERS);
    const q = query(colRef, where('storeId', '==', storeId));
    const snap = await getDocs(q);

    const customers: CustomerRecord[] = [];
    snap.forEach((docSnap) => {
      const cust = docSnap.data() as CustomerRecord;
      const matchPhone = (cust.phone || '').toLowerCase().includes(term) || (normalizedTerm && (cust.normalizedPhone || '').includes(normalizedTerm));
      const matchName = (cust.name || '').toLowerCase().includes(term);
      const matchAddr = cust.address?.toLowerCase().includes(term) || cust.postcode?.toLowerCase().includes(term);

      if (matchPhone || matchName || matchAddr) {
        customers.push(cust);
      }
    });

    return customers;
  } catch (err) {
    console.error('Error searching store customers in Firestore:', err);
    return [];
  }
}

export async function fetchAllStoreCustomers(storeId: string): Promise<CustomerRecord[]> {
  if (!storeId) return [];
  try {
    const colRef = collection(db, COLLECTIONS.CUSTOMERS);
    const q = query(colRef, where('storeId', '==', storeId));
    const snap = await getDocs(q);
    const customers: CustomerRecord[] = [];
    snap.forEach((d) => customers.push(d.data() as CustomerRecord));
    return customers;
  } catch (err) {
    console.error('Error fetching all store customers:', err);
    return [];
  }
}

/* =========================================================================
   7. STORE SETTINGS & OTHER ENTITIES
========================================================================= */
export async function saveStoreSettingsToFirestore(storeId: string, settings: StoreSettingsData): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.STORE_SETTINGS, storeId);
    await setDoc(docRef, settings, { merge: true });
  } catch (err) {
    console.error('Error saving store settings to Firestore:', err);
  }
}

export function subscribeStoreSettings(callback: (settings: Record<string, StoreSettingsData>) => void): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.STORE_SETTINGS);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const map: Record<string, StoreSettingsData> = {};
        snapshot.forEach((d) => {
          map[d.id] = d.data() as StoreSettingsData;
        });
        callback(map);
      },
      (err) => console.warn('Store settings subscription error:', err)
    );
  } catch (e) {
    console.warn('Could not initialize store settings subscription:', e);
    return () => {};
  }
}

/* =========================================================================
   7.1 STORE DELIVERY SETTINGS & DELIVERY ZONES
========================================================================= */
export async function saveStoreDeliverySettingsToFirestore(settings: StoreDeliverySettings): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.DELIVERY_SETTINGS, settings.storeId);
    await setDoc(docRef, { ...settings, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.error('Error saving store delivery settings to Firestore:', err);
  }
}

export function subscribeStoreDeliverySettings(callback: (settings: Record<string, StoreDeliverySettings>) => void): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.DELIVERY_SETTINGS);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const map: Record<string, StoreDeliverySettings> = {};
        snapshot.forEach((d) => {
          map[d.id] = d.data() as StoreDeliverySettings;
        });
        callback(map);
      },
      (err) => console.warn('Store delivery settings subscription error:', err)
    );
  } catch (e) {
    console.warn('Could not initialize store delivery settings subscription:', e);
    return () => {};
  }
}

export async function saveDeliveryZoneToFirestore(zone: DeliveryZone): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.DELIVERY_ZONES, zone.id);
    await setDoc(docRef, { ...zone, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.error('Error saving delivery zone to Firestore:', err);
  }
}

export async function deleteDeliveryZoneFromFirestore(zoneId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.DELIVERY_ZONES, zoneId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting delivery zone from Firestore:', err);
  }
}

export function subscribeDeliveryZones(callback: (zones: DeliveryZone[]) => void): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.DELIVERY_ZONES);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: DeliveryZone[] = [];
        snapshot.forEach((d) => list.push(d.data() as DeliveryZone));
        callback(list);
      },
      (err) => console.warn('Delivery zones subscription error:', err)
    );
  } catch (e) {
    console.warn('Could not initialize delivery zones subscription:', e);
    return () => {};
  }
}

/* =========================================================================
   7.2 CASH DRAWER STATE & TRANSACTIONS
========================================================================= */
export async function saveCashDrawerStateToFirestore(
  storeId: string,
  state: { openingFloat: number; updatedAt?: string }
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.CASH_DRAWER, storeId);
    await setDoc(docRef, { ...state, storeId, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn('Error saving cash drawer state to Firestore:', err);
  }
}

export function subscribeCashDrawerState(
  callback: (map: Record<string, { openingFloat: number; updatedAt?: string }>) => void
): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.CASH_DRAWER);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const map: Record<string, { openingFloat: number; updatedAt?: string }> = {};
        snapshot.forEach((d) => {
          map[d.id] = d.data() as any;
        });
        callback(map);
      },
      (err) => console.warn('Cash drawer state subscription error:', err)
    );
  } catch (e) {
    console.warn('Could not initialize cash drawer subscription:', e);
    return () => {};
  }
}

export async function saveCashDrawerTransactionToFirestore(tx: CashDrawerTransaction): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.CASH_DRAWER_TRANSACTIONS, tx.id);
    await setDoc(docRef, { ...tx, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn('Error saving cash drawer transaction to Firestore:', err);
  }
}

export function subscribeCashDrawerTransactions(callback: (txs: CashDrawerTransaction[]) => void): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.CASH_DRAWER_TRANSACTIONS);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: CashDrawerTransaction[] = [];
        snapshot.forEach((d) => list.push(d.data() as CashDrawerTransaction));
        callback(list);
      },
      (err) => console.warn('Cash drawer transactions subscription error:', err)
    );
  } catch (e) {
    console.warn('Could not initialize cash drawer transactions subscription:', e);
    return () => {};
  }
}


export async function saveStaffAccountToFirestore(staff: StaffAccount): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.STAFF_ACCOUNTS, staff.id);
    await setDoc(docRef, staff, { merge: true });
  } catch (err) {
    console.error('Error saving staff account to Firestore:', err);
  }
}

export async function deleteStaffAccountFromFirestore(staffId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.STAFF_ACCOUNTS, staffId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting staff account from Firestore:', err);
  }
}

export function subscribeStaffAccounts(callback: (staff: StaffAccount[]) => void): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.STAFF_ACCOUNTS);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: StaffAccount[] = [];
        snapshot.forEach((d) => list.push(d.data() as StaffAccount));
        callback(list);
      },
      (err) => console.warn('Staff accounts subscription error:', err)
    );
  } catch (e) {
    console.warn('Could not initialize staff accounts subscription:', e);
    return () => {};
  }
}

export async function saveEmployeeToFirestore(emp: Employee): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.EMPLOYEES, emp.id);
    await setDoc(docRef, emp, { merge: true });
  } catch (err) {
    console.error('Error saving employee to Firestore:', err);
  }
}

export async function deleteEmployeeFromFirestore(empId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.EMPLOYEES, empId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting employee from Firestore:', err);
  }
}

export function subscribeEmployees(callback: (employees: Employee[]) => void): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.EMPLOYEES);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: Employee[] = [];
        snapshot.forEach((d) => list.push(d.data() as Employee));
        callback(list);
      },
      (err) => console.warn('Employees subscription error:', err)
    );
  } catch (e) {
    console.warn('Could not initialize employees subscription:', e);
    return () => {};
  }
}

export async function saveRoleToFirestore(role: Role): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.ROLES, role.id);
    await setDoc(docRef, role, { merge: true });
  } catch (err) {
    console.error('Error saving role to Firestore:', err);
  }
}

export function subscribeRoles(callback: (roles: Role[]) => void): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.ROLES);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: Role[] = [];
        snapshot.forEach((d) => list.push(d.data() as Role));
        callback(list);
      },
      (err) => console.warn('Roles subscription error:', err)
    );
  } catch (e) {
    console.warn('Could not initialize roles subscription:', e);
    return () => {};
  }
}

export function subscribeStores(callback: (stores: Store[]) => void): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.STORES);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: Store[] = [];
        snapshot.forEach((d) => list.push(d.data() as Store));
        callback(list);
      },
      (err) => console.warn('Stores subscription error:', err)
    );
  } catch (e) {
    console.warn('Could not initialize stores subscription:', e);
    return () => {};
  }
}

export function subscribeCategories(callback: (categories: Category[]) => void): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.CATEGORIES);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: Category[] = [];
        snapshot.forEach((d) => list.push(d.data() as Category));
        callback(list);
      },
      (err) => console.warn('Categories subscription error:', err)
    );
  } catch (e) {
    console.warn('Could not initialize categories subscription:', e);
    return () => {};
  }
}

export function subscribeProducts(callback: (products: Product[]) => void): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.PRODUCTS);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: Product[] = [];
        snapshot.forEach((d) => list.push(d.data() as Product));
        callback(list);
      },
      (err) => console.warn('Products subscription error:', err)
    );
  } catch (e) {
    console.warn('Could not initialize products subscription:', e);
    return () => {};
  }
}

export async function saveTableToFirestore(table: TableRecord): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.TABLES, table.id);
    await setDoc(docRef, table, { merge: true });
  } catch (err) {
    console.error('Error saving table to Firestore:', err);
  }
}

export async function deleteTableFromFirestore(tableId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.TABLES, tableId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting table from Firestore:', err);
  }
}

export function subscribeTables(callback: (tables: TableRecord[]) => void): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.TABLES);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: TableRecord[] = [];
        snapshot.forEach((d) => list.push(d.data() as TableRecord));
        callback(list);
      },
      (err) => console.warn('Tables subscription error:', err)
    );
  } catch (e) {
    console.warn('Could not initialize tables subscription:', e);
    return () => {};
  }
}

export async function savePrinterToFirestore(printer: PrinterDevice): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.PRINTERS, printer.id);
    await setDoc(docRef, printer, { merge: true });
  } catch (err) {
    console.error('Error saving printer to Firestore:', err);
  }
}

export async function deletePrinterFromFirestore(printerId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.PRINTERS, printerId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting printer from Firestore:', err);
  }
}

export function subscribePrinters(callback: (printers: PrinterDevice[]) => void): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.PRINTERS);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: PrinterDevice[] = [];
        snapshot.forEach((d) => list.push(d.data() as PrinterDevice));
        callback(list);
      },
      (err) => console.warn('Printers subscription error:', err)
    );
  } catch (e) {
    console.warn('Could not initialize printers subscription:', e);
    return () => {};
  }
}

export async function saveCouponToFirestore(coupon: Coupon): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.COUPONS, coupon.code);
    await setDoc(docRef, coupon, { merge: true });
  } catch (err) {
    console.error('Error saving coupon to Firestore:', err);
  }
}

export async function deleteCouponFromFirestore(couponId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.COUPONS, couponId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting coupon from Firestore:', err);
  }
}

export function subscribeCoupons(callback: (coupons: Coupon[]) => void): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.COUPONS);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: Coupon[] = [];
        snapshot.forEach((d) => list.push(d.data() as Coupon));
        callback(list);
      },
      (err) => console.warn('Coupons subscription error:', err)
    );
  } catch (e) {
    console.warn('Could not initialize coupons subscription:', e);
    return () => {};
  }
}

export async function savePresetDiscountToFirestore(discount: PresetDiscount): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.PRESET_DISCOUNTS, discount.id);
    await setDoc(docRef, discount, { merge: true });
  } catch (err) {
    console.error('Error saving discount to Firestore:', err);
  }
}

export async function deletePresetDiscountFromFirestore(discountId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.PRESET_DISCOUNTS, discountId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting discount from Firestore:', err);
  }
}

export function subscribePresetDiscounts(callback: (discounts: PresetDiscount[]) => void): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.PRESET_DISCOUNTS);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: PresetDiscount[] = [];
        snapshot.forEach((d) => list.push(d.data() as PresetDiscount));
        callback(list);
      },
      (err) => console.warn('Discounts subscription error:', err)
    );
  } catch (e) {
    console.warn('Could not initialize discounts subscription:', e);
    return () => {};
  }
}

export function subscribeAdminProfile(callback: (profile: AdminProfile) => void): () => void {
  try {
    const docRef = doc(db, COLLECTIONS.ADMIN_PROFILE, ADMIN_DOC_ID);
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          callback(snap.data() as AdminProfile);
        }
      },
      (err) => console.warn('Admin profile subscription error:', err)
    );
  } catch (e) {
    console.warn('Could not initialize admin profile subscription:', e);
    return () => {};
  }
}

export function subscribeOrders(callback: (orders: Order[]) => void): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.ORDERS);
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(100));
    return onSnapshot(
      q,
      (snapshot) => {
        const ordersList: Order[] = [];
        snapshot.forEach((doc) => {
          ordersList.push(doc.data() as Order);
        });
        callback(ordersList);
      },
      (err) => {
        console.warn('Orders subscription error (using local cache):', err);
      }
    );
  } catch (e) {
    console.warn('Could not initialize orders subscription:', e);
    return () => {};
  }
}

export function subscribeAddons(callback: (addons: MenuAddon[]) => void): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.ADDONS);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const addonsList: MenuAddon[] = [];
        snapshot.forEach((doc) => {
          addonsList.push(doc.data() as MenuAddon);
        });
        if (addonsList.length > 0) {
          callback(addonsList);
        }
      },
      (err) => {
        console.warn('Addons subscription error (using local cache):', err);
      }
    );
  } catch (e) {
    console.warn('Could not initialize addons subscription:', e);
    return () => {};
  }
}

export function subscribeAddonGroups(callback: (groups: AddonGroup[]) => void): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.ADDON_GROUPS);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const groupsList: AddonGroup[] = [];
        snapshot.forEach((doc) => {
          groupsList.push(doc.data() as AddonGroup);
        });
        callback(groupsList);
      },
      (err) => {
        console.warn('Addon groups subscription error (using local cache):', err);
      }
    );
  } catch (e) {
    console.warn('Could not initialize addon groups subscription:', e);
    return () => {};
  }
}

export function subscribeCustomers(callback: (customers: CustomerRecord[]) => void): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.CUSTOMERS);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const custList: CustomerRecord[] = [];
        snapshot.forEach((doc) => {
          custList.push(doc.data() as CustomerRecord);
        });
        if (custList.length > 0) {
          callback(custList);
        }
      },
      (err) => {
        console.warn('Customers subscription error (using local cache):', err);
      }
    );
  } catch (e) {
    console.warn('Could not initialize customers subscription:', e);
    return () => {};
  }
}

export async function saveCustomerToFirestore(customer: CustomerRecord): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.CUSTOMERS, customer.id);
    await setDoc(docRef, customer, { merge: true });
  } catch (err) {
    console.error('Error saving customer to Firestore:', err);
  }
}

export async function deleteCustomerFromFirestore(customerId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.CUSTOMERS, customerId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting customer from Firestore:', err);
  }
}

export async function clearAllFirestoreOrders(): Promise<void> {
  try {
    const colRef = collection(db, COLLECTIONS.ORDERS);
    const snap = await getDocs(colRef);
    const promises = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(promises);
  } catch (err) {
    console.error('Error clearing firestore orders:', err);
  }
}

export async function clearAllFirestoreCustomers(): Promise<void> {
  try {
    const colRef = collection(db, COLLECTIONS.CUSTOMERS);
    const snap = await getDocs(colRef);
    const promises = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(promises);
  } catch (err) {
    console.error('Error clearing firestore customers:', err);
  }
}

/* =========================================================================
   17. DEVICE AUTHORIZATION & SECURITY SETTINGS
========================================================================= */
const SECURITY_DOC_ID = 'device_auth_config';

export interface DeviceAuthConfig {
  masterPassword?: string;
  allowedPasswords?: string[];
  maxFailedAttempts?: number;
  lockoutDurationSeconds?: number;
  updatedAt?: string;
}

export interface FirestoreAuthorizedDevice {
  deviceId: string;
  deviceName: string;
  browser?: string;
  os?: string;
  ip?: string;
  isAuthorized: boolean;
  authorizedAt: string;
  lastActiveAt?: string;
  assignedStoreId?: string;
}

export async function fetchDeviceAuthConfigFromFirestore(): Promise<DeviceAuthConfig | null> {
  try {
    const docRef = doc(db, COLLECTIONS.SECURITY_SETTINGS, SECURITY_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as DeviceAuthConfig;
    }
  } catch (err) {
    console.warn('Error fetching device auth config from Firestore:', err);
  }
  return null;
}

export async function saveDeviceAuthConfigToFirestore(config: Partial<DeviceAuthConfig>): Promise<boolean> {
  try {
    const docRef = doc(db, COLLECTIONS.SECURITY_SETTINGS, SECURITY_DOC_ID);
    await setDoc(
      docRef,
      {
        ...config,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.error('Error saving device auth config to Firestore:', err);
    return false;
  }
}

export async function saveAuthorizedDeviceToFirestore(device: FirestoreAuthorizedDevice): Promise<boolean> {
  try {
    const docRef = doc(db, COLLECTIONS.AUTHORIZED_DEVICES, device.deviceId);
    await setDoc(docRef, {
      ...device,
      lastActiveAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('Error saving authorized device to Firestore:', err);
    return false;
  }
}

export async function revokeDeviceInFirestore(deviceId: string): Promise<boolean> {
  try {
    const docRef = doc(db, COLLECTIONS.AUTHORIZED_DEVICES, deviceId);
    await updateDoc(docRef, {
      isAuthorized: false,
      revokedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error('Error revoking device in Firestore:', err);
    return false;
  }
}

export async function fetchAllAuthorizedDevicesFromFirestore(): Promise<FirestoreAuthorizedDevice[]> {
  try {
    const colRef = collection(db, COLLECTIONS.AUTHORIZED_DEVICES);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as FirestoreAuthorizedDevice);
  } catch (err) {
    console.warn('Error fetching authorized devices from Firestore:', err);
    return [];
  }
}

export function subscribeAuthorizedDevices(callback: (devices: FirestoreAuthorizedDevice[]) => void): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.AUTHORIZED_DEVICES);
    return onSnapshot(
      colRef,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as FirestoreAuthorizedDevice);
        callback(list);
      },
      (err) => console.warn('Firestore device listener fallback:', err)
    );
  } catch (err) {
    console.warn('Error setting up device snapshot:', err);
    return () => {};
  }
}

export const firestoreService = {
  fetchAdminProfile,
  getAdminProfile: fetchAdminProfile,
  saveAdminProfile,
  subscribeAdminProfile,
  fetchDeviceAuthConfigFromFirestore,
  saveDeviceAuthConfigToFirestore,
  saveAuthorizedDeviceToFirestore,
  revokeDeviceInFirestore,
  fetchAllAuthorizedDevicesFromFirestore,
  subscribeAuthorizedDevices,
  saveStoreToFirestore,
  deleteStoreFromFirestore,
  subscribeStores,
  saveAddonToFirestore,
  saveAddon: saveAddonToFirestore,
  updateAddonInFirestore,
  updateAddon: updateAddonInFirestore,
  deleteAddonFromFirestore,
  deleteAddon: deleteAddonFromFirestore,
  subscribeAddons,
  saveAddonGroupToFirestore,
  saveAddonGroup: saveAddonGroupToFirestore,
  updateAddonGroupInFirestore,
  updateAddonGroup: updateAddonGroupInFirestore,
  deleteAddonGroupFromFirestore,
  deleteAddonGroup: deleteAddonGroupFromFirestore,
  subscribeAddonGroups,
  saveProductToFirestore,
  updateProductInFirestore,
  updateProduct: updateProductInFirestore,
  deleteProductFromFirestore,
  subscribeProducts,
  saveCategoryToFirestore,
  deleteCategoryFromFirestore,
  subscribeCategories,
  saveOrderToFirestore,
  saveOrder: saveOrderToFirestore,
  updateOrderStatusInFirestore,
  updateOrderStatus: updateOrderStatusInFirestore,
  updateOrderInFirestore,
  updateOrder: updateOrderInFirestore,
  subscribeOrders,
  upsertCustomerOnOrder,
  saveCustomerToFirestore,
  saveCustomer: saveCustomerToFirestore,
  deleteCustomerFromFirestore,
  deleteCustomer: deleteCustomerFromFirestore,
  searchStoreCustomers,
  fetchAllStoreCustomers,
  subscribeCustomers,
  saveStoreSettingsToFirestore,
  subscribeStoreSettings,
  saveStoreDeliverySettings: saveStoreDeliverySettingsToFirestore,
  subscribeStoreDeliverySettings,
  saveDeliveryZone: saveDeliveryZoneToFirestore,
  deleteDeliveryZone: deleteDeliveryZoneFromFirestore,
  subscribeDeliveryZones,
  saveStaffAccountToFirestore,

  deleteStaffAccountFromFirestore,
  subscribeStaffAccounts,
  saveEmployeeToFirestore,
  deleteEmployeeFromFirestore,
  subscribeEmployees,
  saveRoleToFirestore,
  subscribeRoles,
  saveTableToFirestore,
  deleteTableFromFirestore,
  subscribeTables,
  savePrinterToFirestore,
  deletePrinterFromFirestore,
  subscribePrinters,
  saveCouponToFirestore,
  deleteCouponFromFirestore,
  subscribeCoupons,
  savePresetDiscountToFirestore,
  deletePresetDiscountFromFirestore,
  subscribePresetDiscounts,
  saveCashDrawerState: saveCashDrawerStateToFirestore,
  saveCashDrawerStateToFirestore,
  subscribeCashDrawerState,
  saveCashDrawerTransaction: saveCashDrawerTransactionToFirestore,
  saveCashDrawerTransactionToFirestore,
  subscribeCashDrawerTransactions,
  clearAllFirestoreOrders,
  clearAllFirestoreCustomers,
};


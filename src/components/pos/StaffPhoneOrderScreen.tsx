import React, { useState, useMemo } from 'react';
import {
  PhoneCall,
  Search,
  User,
  MapPin,
  Clock,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Send,
  CheckCircle2,
  Store as StoreIcon,
  LogOut,
  Sparkles,
  ArrowRight,
  Receipt,
  CreditCard,
  Banknote,
  Globe,
  Sliders,
  ChevronRight,
  AlertCircle,
  BellRing,
  History,
  X,
  Printer,
  CheckCircle,
  Truck,
  LayoutDashboard,
  Volume2,
  Pencil,
} from 'lucide-react';
import { useNexus } from '../../context/NexusContext';
import { NexusLogo } from '../common/NexusLogo';
import { Product, OrderType, CartItem, ProductVariant, SelectedModifier, Order, OrderStatus, CustomerRecord } from '../../types';
import { OrderLiveTimer } from '../common/OrderLiveTimer';
import { DeliveryAddressSearch } from './DeliveryAddressSearch';
import { StructuredAddress, DeliveryValidationResult } from '../../services/googleMapsService';
import { CustomerOrderHistoryModal } from './CustomerOrderHistoryModal';
import { soundFX } from '../../utils/audioAlert';

export const StaffPhoneOrderScreen: React.FC = () => {
  const {
    currentUser,
    logout,
    setActiveAppView,
    stores,
    currentStore,
    setCurrentStore,
    categories,
    products,
    modifierGroups,
    modifiers,
    addOrder,
    orders,
    getNextOrderSequence,
    updateOrderStatus,
    updateExistingOrder,
    setLatestPlacedOrder,
    setIsReceiptModalOpen,
    setActivePosMode,
    isDeliveryRestrictedByAdmin,
    customers,
    findCustomerByPhone,
    orderHistory = [],
    setIsOrderHistoryModalOpen,
  } = useNexus();

  // Selected Store for fulfillment (defaults to staff assigned store or currentStore)
  const assignedStore = useMemo(() => {
    if (currentUser?.storeId) {
      return stores.find((s) => s.id === currentUser.storeId) || currentStore;
    }
    return currentStore;
  }, [currentUser, stores, currentStore]);

  const [targetStoreId, setTargetStoreId] = useState<string>(assignedStore?.id || stores[0]?.id || 'store-1');
  const targetStore = stores.find((s) => s.id === targetStoreId) || stores[0];

  // Active Category filter
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Customer Form State
  const [customerPhone, setCustomerPhone] = useState<string>('+44 7911 ');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [customerPostcode, setCustomerPostcode] = useState<string>('');
  const [selectedAddress, setSelectedAddress] = useState<StructuredAddress | null>(null);
  const [deliveryValidation, setDeliveryValidation] = useState<DeliveryValidationResult | null>(null);
  const [orderType, setOrderType] = useState<OrderType>('Delivery');
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Online'>('Cash');

  // Customer order history & lookup states
  const [historyModalCustomer, setHistoryModalCustomer] = useState<CustomerRecord | null>(null);
  const [matchedCustomer, setMatchedCustomer] = useState<CustomerRecord | null>(null);
  const [phoneSuggestions, setPhoneSuggestions] = useState<CustomerRecord[]>([]);
  const [showPhoneSuggestions, setShowPhoneSuggestions] = useState<boolean>(false);

  const handleStaffPhoneChange = (val: string) => {
    setCustomerPhone(val);
    const cleanDigits = val.replace(/\D/g, '');
    if (cleanDigits.length >= 4) {
      const match = findCustomerByPhone(val, targetStoreId);
      if (match) {
        setMatchedCustomer(match);
        if (!customerName || customerName === 'Customer') {
          setCustomerName(match.name);
        }
        if (!customerAddress && match.address) {
          setCustomerAddress(match.address);
        }
        if (!customerPostcode && match.postcode) {
          setCustomerPostcode(match.postcode);
        }
        if (!customerNotes && match.notes) {
          setCustomerNotes(match.notes);
        }
      } else {
        setMatchedCustomer(null);
      }

      const q = val.toLowerCase().trim();
      const filtered = (customers || []).filter(
        (c) =>
          c.phone.toLowerCase().includes(q) ||
          c.phone.replace(/\D/g, '').includes(cleanDigits) ||
          c.name.toLowerCase().includes(q)
      ).slice(0, 5);
      setPhoneSuggestions(filtered);
      setShowPhoneSuggestions(filtered.length > 0);
    } else {
      setMatchedCustomer(null);
      setPhoneSuggestions([]);
      setShowPhoneSuggestions(false);
    }
  };

  const handleSelectSuggestedCustomer = (cust: CustomerRecord) => {
    setCustomerPhone(cust.phone);
    setCustomerName(cust.name);
    if (cust.address) setCustomerAddress(cust.address);
    if (cust.postcode) setCustomerPostcode(cust.postcode);
    if (cust.notes) setCustomerNotes(cust.notes);
    setMatchedCustomer(cust);
    setShowPhoneSuggestions(false);
  };

  // Cart & My Orders State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [activeHistoryTab, setActiveHistoryTab] = useState(false);
  const [historyStatusTab, setHistoryStatusTab] = useState<OrderStatus>('Current');
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  // Variant / Modifier Modal State
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedMods, setSelectedMods] = useState<Record<string, number>>({}); // modId -> qty
  const [modalItemNotes, setModalItemNotes] = useState<string>('');

  // Success Notification Modal
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Filter categories for the selected routing store
  const storeCategories = useMemo(() => {
    return categories.filter(
      (c) => c.storeId === targetStoreId || (!c.storeId && targetStoreId === 'store-1')
    );
  }, [categories, targetStoreId]);

  // Filtered Products for the selected routing store
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.isAvailable) return false;
      const matchesStore = p.storeId === targetStoreId || (!p.storeId && targetStoreId === 'store-1');
      if (!matchesStore) return false;
      const matchesCat = selectedCategoryId === 'all' || p.categoryId === selectedCategoryId;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [products, targetStoreId, selectedCategoryId, searchQuery]);

  // Open Product Customization Modal
  const handleProductClick = (product: Product) => {
    setModalProduct(product);
    if (product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    } else {
      setSelectedVariant(null);
    }
    setSelectedMods({});
    setModalItemNotes('');
  };

  // Add Item to Cart from Modal
  const handleAddToCart = () => {
    if (!modalProduct) return;

    const variant = selectedVariant || {
      id: 'default',
      name: 'Standard',
      size: 'Regular',
      price: modalProduct.basePrice,
      isAvailable: true,
    };

    const chosenModifiers: SelectedModifier[] = [];
    let modsTotal = 0;

    (Object.entries(selectedMods) as [string, number][]).forEach(([modId, qty]) => {
      const quantity = Number(qty);
      if (quantity > 0) {
        const mod = modifiers.find((m) => m.id === modId);
        if (mod) {
          chosenModifiers.push({
            modifierId: mod.id,
            modifierGroupId: 'custom',
            name: mod.name,
            price: mod.price,
            quantity: quantity,
          });
          modsTotal += mod.price * quantity;
        }
      }
    });

    const unitPrice = variant.price;
    const lineTotal = (unitPrice + modsTotal) * 1;
    const cleanNote = modalItemNotes.trim() || undefined;

    const newItem: CartItem = {
      id: 'cart-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      productId: modalProduct.id,
      productName: modalProduct.name,
      productCode: modalProduct.sku || 'SKU-' + modalProduct.id.slice(0, 4),
      productImage: modalProduct.image || '',
      variantId: variant.id,
      variantName: variant.name,
      variantSize: variant.size,
      unitPrice: unitPrice,
      selectedModifiers: chosenModifiers,
      modifiersTotal: modsTotal,
      quantity: 1,
      totalPrice: lineTotal,
      notes: cleanNote,
      specialInstructions: cleanNote,
    };

    setCartItems((prev) => [...prev, newItem]);
    setModalItemNotes('');
    setModalProduct(null);
  };

  const updateCartQty = (cartId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === cartId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            const singleUnitPrice = item.unitPrice + item.modifiersTotal;
            return {
              ...item,
              quantity: nextQty,
              totalPrice: singleUnitPrice * nextQty,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeCartItem = (cartId: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== cartId));
  };

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [cartItems]);

  const deliveryFee = orderType === 'Delivery' ? (Number(targetStore?.deliveryFee) || 0) : 0;
  const tax = subtotal * (targetStore?.taxRate || 0.2);
  const grandTotal = subtotal + deliveryFee;

  // Submit Order Dispatch
  const handleDispatchOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    if (orderType === 'Delivery') {
      const restriction = isDeliveryRestrictedByAdmin(
        targetStore.id,
        customerAddress,
        customerPostcode
      );
      if (restriction.isRestricted || (deliveryValidation && !deliveryValidation.isValid)) {
        alert(`Restricted Delivery Area: ${restriction.reason || deliveryValidation?.message || 'This delivery address or postcode has been restricted in Admin settings. Cannot proceed with order.'}`);
        return;
      }
    }

    const names = customerName.trim().split(' ');
    const firstName = names[0] || 'Phone';
    const lastName = names.slice(1).join(' ') || 'Customer';

    const { seqNumber, orderNumber, invoiceId } = getNextOrderSequence();

    const newOrder: Order = {
      id: 'order-' + Date.now(),
      invoiceId: invoiceId,
      orderNumber: `${seqNumber}`,
      source: 'STAFF POS',
      storeId: targetStore.id,
      storeName: targetStore.businessName,
      customer: {
        firstName,
        lastName,
        phone: customerPhone,
        fullAddress: customerAddress || 'Collection at Store Counter',
        ukPostcode: customerPostcode || 'N/A',
        orderType: orderType,
        driverInstructions: customerNotes,
      },
      items: cartItems,
      subtotal: subtotal,
      modifiersTotal: cartItems.reduce((s, i) => s + i.modifiersTotal * i.quantity, 0),
      discount: 0,
      couponDiscount: 0,
      deliveryFee: deliveryFee,
      serviceCharge: 0,
      tax: tax,
      grandTotal: grandTotal,
      paymentStatus: paymentMethod === 'Paid Online' ? 'Paid' : 'Pending',
      paymentMethod: paymentMethod as any,
      orderStatus: 'Current',
      orderType: orderType,
      isAccepted: false,
      isEditedOrder: false,
      orderSentBy: currentUser?.name || 'Staff Agent',
      cashierName: currentUser?.name || 'Staff Phone Agent',
      createdBy: currentUser?.name || 'Staff Agent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 35 * 60000).toISOString(),
    };

    addOrder(newOrder);

    // Staff POS does not play loud alert sounds (alert only sounds on the relevant Store POS)
    setCompletedOrder(newOrder);
    // Reset Form
    setCartItems([]);
    setCustomerName('');
    setCustomerAddress('');
    setCustomerPostcode('');
    setCustomerNotes('');
  };

  // Start editing an existing order
  const handleStartEditOrder = (orderToEdit: Order) => {
    setEditingOrder(orderToEdit);
    setTargetStoreId(orderToEdit.storeId);
    setOrderType(orderToEdit.orderType);
    setPaymentMethod(
      orderToEdit.paymentMethod === 'Card' ? 'Card' : orderToEdit.paymentMethod === 'Online' ? 'Online' : 'Cash'
    );
    setCustomerPhone(orderToEdit.customer?.phone || '+44 7911 ');
    setCustomerName(`${orderToEdit.customer?.firstName || ''} ${orderToEdit.customer?.lastName || ''}`.trim());
    setCustomerAddress(orderToEdit.customer?.fullAddress || '');
    setCustomerPostcode(orderToEdit.customer?.ukPostcode || '');
    setCustomerNotes(orderToEdit.customer?.driverInstructions || orderToEdit.customer?.notes || '');
    setCartItems(JSON.parse(JSON.stringify(orderToEdit.items || [])));
    setActiveHistoryTab(false);
  };

  const handleCancelEditOrder = () => {
    setEditingOrder(null);
    setCartItems([]);
    setCustomerName('');
    setCustomerAddress('');
    setCustomerPostcode('');
    setCustomerNotes('');
  };

  const handleSaveEditedOrder = async () => {
    if (!editingOrder) return;
    if (cartItems.length === 0) return;

    const names = customerName.trim().split(' ');
    const firstName = names[0] || editingOrder.customer.firstName || 'Customer';
    const lastName = names.slice(1).join(' ') || editingOrder.customer.lastName || '';

    const updated = await updateExistingOrder(editingOrder.id, {
      items: cartItems,
      subtotal,
      modifiersTotal: cartItems.reduce((s, i) => s + (i.modifiersTotal || 0) * i.quantity, 0),
      tax,
      deliveryFee,
      grandTotal,
      orderType,
      isAccepted: false,
      isEditedOrder: true,
      lastEditedAt: new Date().toISOString(),
      orderSentBy: currentUser?.name || 'Staff Agent',
      customer: {
        ...editingOrder.customer,
        firstName,
        lastName,
        phone: customerPhone,
        fullAddress: customerAddress || 'Collection at Store Counter',
        ukPostcode: customerPostcode || 'N/A',
        orderType: orderType,
        driverInstructions: customerNotes,
      },
      paymentMethod: paymentMethod as any,
    });

    if (updated) {
      soundFX.chime();
      setCompletedOrder(updated);
      setEditingOrder(null);
      setCartItems([]);
      setCustomerName('');
      setCustomerAddress('');
      setCustomerPostcode('');
      setCustomerNotes('');
    }
  };

  // Store-specific orders for selected routing store
  const storeOrders = useMemo(() => {
    return orders.filter((o) => o.storeId === targetStoreId);
  }, [orders, targetStoreId]);

  const currentCount = useMemo(() => storeOrders.filter((o) => o.orderStatus === 'Current').length, [storeOrders]);
  const onTheWayCount = useMemo(() => storeOrders.filter((o) => o.orderStatus === 'On The Way').length, [storeOrders]);
  const completedCount = useMemo(() => storeOrders.filter((o) => o.orderStatus === 'Completed').length, [storeOrders]);

  const filteredStoreOrders = useMemo(() => {
    return storeOrders.filter((o) => {
      if (o.orderStatus !== historyStatusTab) return false;
      if (historySearchQuery.trim()) {
        const q = historySearchQuery.toLowerCase();
        return (
          o.invoiceId.toLowerCase().includes(q) ||
          o.customer.firstName.toLowerCase().includes(q) ||
          o.customer.lastName.toLowerCase().includes(q) ||
          o.customer.phone.includes(q)
        );
      }
      return true;
    });
  }, [storeOrders, historyStatusTab, historySearchQuery]);

  const handleAdvanceStatus = (order: Order) => {
    if (order.orderStatus === 'Current') {
      if (order.orderType === 'Delivery') {
        updateOrderStatus(order.id, 'On The Way');
      } else {
        updateOrderStatus(order.id, 'Completed');
      }
    } else if (order.orderStatus === 'On The Way') {
      updateOrderStatus(order.id, 'Completed');
    }
  };

  const handlePrintReceipt = (order: Order) => {
    setLatestPlacedOrder(order);
    setIsReceiptModalOpen(true);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#F1F5F9] text-[#172033] font-sans overflow-hidden select-none">
      {/* 1. STAFF HEADER */}
      <header className="h-[68px] bg-white border-b border-[#E5EAF2] px-6 flex items-center justify-between shrink-0 shadow-xs z-20">
        <div className="flex items-center gap-4">
          <NexusLogo size="sm" showSubtitle={false} />
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 text-white rounded-lg">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#172033]">Staff Phone Order Terminal</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200">
                  STAFF POS
                </span>
              </div>
              <p className="text-[11px] text-[#64748B]">
                Fast phone order taking • Direct store kitchen routing
              </p>
            </div>
          </div>
        </div>

        {/* Store Target Selector & Staff Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-[#E5EAF2] rounded-xl px-3 py-1.5">
            <StoreIcon className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-[#64748B]">Routing Store:</span>
            <select
              value={targetStoreId}
              onChange={(e) => setTargetStoreId(e.target.value)}
              className="text-xs font-bold text-[#172033] bg-transparent outline-none cursor-pointer"
            >
              {stores.filter(s => s.isActive !== false).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.businessName} ({s.city})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setActiveHistoryTab(!activeHistoryTab)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              activeHistoryTab
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white text-[#172033] border-[#E5EAF2] hover:bg-slate-50'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>My Orders ({currentCount})</span>
          </button>

          <button
            onClick={() => setIsOrderHistoryModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-[#E5EAF2] text-blue-600 bg-white hover:bg-blue-50 transition-colors cursor-pointer shadow-xs"
            title="Complete Permanent Order History across all POS"
          >
            <History className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Order History</span>
            <span className="px-1.5 py-0.2 rounded-full font-bold text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
              {orderHistory.length}
            </span>
          </button>

          {/* Direct Staff Dashboard Jump */}
          <button
            onClick={() => setActiveAppView('dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-[#E5EAF2] text-blue-600 bg-white hover:bg-blue-50 transition-colors cursor-pointer shadow-xs"
            title="Open Staff Dashboard"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          <div className="h-6 w-px bg-slate-200" />

          {/* User Profile & Sign out */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
              {currentUser?.name?.slice(0, 2).toUpperCase() || 'ST'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-[#172033] leading-none">{currentUser?.name || 'Staff Agent'}</div>
              <div className="text-[10px] text-[#64748B] mt-0.5">{currentUser?.username || 'Staff'}</div>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-xl text-[#64748B] hover:text-red-600 hover:bg-red-50 transition-colors ml-1 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Edit Mode Notice Bar */}
      {editingOrder && (
        <div className="bg-amber-500 text-white px-6 py-2.5 flex items-center justify-between shrink-0 shadow-xs border-b border-amber-600">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-black/20 text-white font-mono text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
              <Pencil className="w-3.5 h-3.5" />
              EDITING ORDER #{editingOrder.orderNumber || editingOrder.invoiceId?.replace(/[^0-9]/g, '')}
            </span>
            <span className="text-xs font-bold text-amber-50">
              {editingOrder.invoiceId} • Customer: {editingOrder.customer?.firstName || 'Guest'} {editingOrder.customer?.lastName || ''}
            </span>
            <span className="text-[11px] text-amber-100 hidden md:inline">
              (Add more items from menu below or adjust quantities, then save)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveEditedOrder}
              disabled={cartItems.length === 0}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-98 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
            <button
              type="button"
              onClick={handleCancelEditOrder}
              className="px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/30 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. MAIN 3-COLUMN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {/* COLUMN 1: CUSTOMER PHONE & ADDRESS FORM (320px) */}
        <div className="w-[320px] bg-white border-r border-[#E5EAF2] flex flex-col shrink-0 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600" />
              <span>Caller & Fulfillment</span>
            </h2>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>

          {/* Order Type Toggle */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl border border-[#E5EAF2]">
            {(['Delivery', 'Pickup', 'In-Store'] as OrderType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setOrderType(type)}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  orderType === type
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Caller Details */}
          <div className="space-y-3">
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-[#172033]">
                  Customer Phone Number <span className="text-red-500">*</span>
                </label>
                {matchedCustomer && (
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Profile Loaded
                  </span>
                )}
              </div>
              <div className="relative">
                <PhoneCall className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={(e) => handleStaffPhoneChange(e.target.value)}
                  placeholder="+44 7700 900000"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs font-semibold text-[#172033] focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Phone suggestions dropdown */}
              {showPhoneSuggestions && phoneSuggestions.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {phoneSuggestions.map((sug) => (
                    <div
                      key={sug.id}
                      onClick={() => handleSelectSuggestedCustomer(sug)}
                      className="p-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900">{sug.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono ml-2">{sug.phone}</span>
                      </div>
                      <span className="text-[10px] font-bold text-blue-600">
                        {sug.totalOrders} {sug.totalOrders === 1 ? 'order' : 'orders'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Matched Customer Profile Banner */}
            {matchedCustomer && (
              <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900">{matchedCustomer.name}</span>
                    <span className="text-slate-500 text-[11px] ml-1.5">
                      • {matchedCustomer.totalOrders} previous {matchedCustomer.totalOrders === 1 ? 'order' : 'orders'} (£{(matchedCustomer.totalSpend || 0).toFixed(2)})
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setHistoryModalCustomer(matchedCustomer)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-100 text-[11px] font-bold transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                >
                  <History className="w-3.5 h-3.5 text-blue-600" />
                  <span>View Orders</span>
                </button>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-[#172033] mb-1">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. John Smith"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs font-semibold text-[#172033] focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {orderType === 'Delivery' && (
              <div className="space-y-2">
                <DeliveryAddressSearch
                  currentStore={targetStore}
                  selectedAddress={selectedAddress}
                  onAddressSelect={(addr, validation) => {
                    setSelectedAddress(addr);
                    setCustomerAddress(addr.fullAddress);
                    setCustomerPostcode(addr.postcode || '');
                    setDeliveryValidation(validation);
                  }}
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-[#172033] mb-1">
                Order Notes / Special Requests
              </label>
              <textarea
                rows={2}
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="e.g. Ring bell twice, extra napkins..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs font-medium text-[#172033] focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 resize-none"
              />
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-[11px] font-bold text-[#172033] mb-1">
                Payment Type
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Cash', 'Card', 'Online'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === method
                        ? 'bg-blue-50 border-blue-600 text-blue-700'
                        : 'bg-slate-50 border-[#E5EAF2] text-[#64748B] hover:bg-slate-100'
                    }`}
                  >
                    {method === 'Cash' && <Banknote className="w-4 h-4" />}
                    {method === 'Card' && <CreditCard className="w-4 h-4" />}
                    {method === 'Online' && <Globe className="w-4 h-4" />}
                    <span>{method}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2: MENU CATALOG BROWSER (FLEX-1) */}
        <div className="flex-1 flex flex-col bg-[#F8FAFC] overflow-hidden">
          {/* Categories & Search Bar */}
          <div className="p-4 bg-white border-b border-[#E5EAF2] space-y-3 shrink-0">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products by name, code or topping..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs font-medium text-[#172033] focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-[#94A3B8] hover:text-[#172033]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCategoryId('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategoryId === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-[#64748B] hover:bg-slate-200'
                }`}
              >
                All Menu ({filteredProducts.length})
              </button>
              {storeCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategoryId === cat.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-[#64748B] hover:bg-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => handleProductClick(prod)}
                  className="bg-white rounded-2xl border border-[#E5EAF2] p-3 flex flex-col justify-between hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div>
                    {prod.image && typeof prod.image === 'string' && prod.image.trim() !== '' && (
                      <div className="w-full h-24 rounded-xl overflow-hidden mb-2 bg-slate-100">
                        <img
                          src={prod.image.trim()}
                          alt={prod.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="text-xs font-bold text-[#172033] line-clamp-1 group-hover:text-blue-600">
                      {prod.name}
                    </div>
                    <p className="text-[11px] text-[#64748B] line-clamp-1 mt-0.5">
                      {prod.description || 'Delicious freshly prepared item'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                    <span className="text-xs font-extrabold text-blue-600">
                      £{prod.basePrice.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      className="p-1 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMN 3: CART & DISPATCH (350px) */}
        <div className="w-[350px] bg-white border-l border-[#E5EAF2] flex flex-col shrink-0 overflow-hidden">
          <div className="p-4 border-b border-[#E5EAF2] flex items-center justify-between shrink-0 bg-slate-50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                Order Items ({cartItems.reduce((s, i) => s + i.quantity, 0)})
              </span>
              <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-mono text-[11px] font-black shadow-2xs">
                Order #{getNextOrderSequence().orderNumber}
              </span>
            </div>
            {cartItems.length > 0 && (
              <button
                type="button"
                onClick={() => setCartItems([])}
                className="text-[11px] font-bold text-red-600 hover:text-red-700 cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Cart List */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#94A3B8]">
                <ShoppingBag className="w-10 h-10 mb-2 stroke-1" />
                <p className="text-xs font-bold text-[#64748B]">Cart is Empty</p>
                <p className="text-[11px] mt-1">Select items from the menu to build the order</p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-[#E5EAF2] space-y-1.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#172033]">{item.productName}</div>
                      <div className="text-[10px] text-blue-600 font-semibold">
                        {item.variantName} {item.variantSize && `(${item.variantSize})`}
                      </div>
                    </div>
                    <div className="text-xs font-extrabold text-[#172033]">
                      £{item.totalPrice.toFixed(2)}
                    </div>
                  </div>

                  {item.selectedModifiers.length > 0 && (
                    <div className="text-[10px] text-[#64748B] pl-2 border-l-2 border-blue-300">
                      {item.selectedModifiers.map((m) => m.name).join(', ')}
                    </div>
                  )}

                  {/* Special Kitchen Instructions / Notes */}
                  {(item.notes || item.specialInstructions) && (
                    <div className="pl-2.5 py-1.5 pr-2 bg-amber-50/90 rounded-lg border border-amber-200/90 text-[11px] text-amber-950 flex items-start gap-1.5 my-1 shadow-2xs">
                      <span className="font-bold text-amber-800 shrink-0 uppercase text-[10px] tracking-wide bg-amber-200/70 px-1 py-0.2 rounded">
                        Note:
                      </span>
                      <span className="italic break-words leading-tight font-medium">
                        "{item.notes || item.specialInstructions}"
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1 bg-white border border-[#E5EAF2] rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.id, -1)}
                        className="p-1 rounded text-[#64748B] hover:text-red-600 hover:bg-slate-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-[#172033]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.id, 1)}
                        className="p-1 rounded text-[#64748B] hover:text-blue-600 hover:bg-slate-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeCartItem(item.id)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Summary & Dispatch Button */}
          <div className="p-4 border-t border-[#E5EAF2] bg-slate-50 space-y-2 shrink-0">
            <div className="space-y-1 text-xs text-[#64748B]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-[#172033]">£{subtotal.toFixed(2)}</span>
              </div>
              {orderType === 'Delivery' && (
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-[#172033]">£{deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-[#172033] pt-1.5 border-t border-[#E5EAF2]">
                <span>Total</span>
                <span className="text-blue-600">£{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {editingOrder ? (
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={cartItems.length === 0}
                  onClick={handleSaveEditedOrder}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>SAVE CHANGES TO ORDER #{editingOrder.orderNumber || editingOrder.invoiceId?.replace(/[^0-9]/g, '')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancelEditOrder}
                  className="w-full py-2 rounded-xl bg-white hover:bg-slate-100 border border-[#E5EAF2] text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel Edit & Discard</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={cartItems.length === 0 || !customerName.trim()}
                onClick={handleDispatchOrder}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>DISPATCH TO {targetStore?.businessName?.split('-')[0]?.trim() || 'STORE'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. PRODUCT CUSTOMIZATION / MODIFIER MODAL */}
      {modalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-[#E5EAF2] shadow-2xl p-6 relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setModalProduct(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#64748B] hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <h3 className="text-base font-bold text-[#172033]">{modalProduct.name}</h3>
              <p className="text-xs text-[#64748B]">{modalProduct.description}</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Variants / Sizes */}
              {modalProduct.variants && modalProduct.variants.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-[#172033] mb-2 uppercase tracking-wider">
                    Select Size / Variant
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {modalProduct.variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                          selectedVariant?.id === v.id
                            ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold'
                            : 'border-[#E5EAF2] text-[#172033] hover:bg-slate-50 font-medium'
                        }`}
                      >
                        <span className="text-xs">{v.name} ({v.size})</span>
                        <span className="text-xs font-extrabold text-blue-600">£{v.price.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Addons / Sauces */}
              <div>
                <div className="text-xs font-bold text-[#172033] mb-2 uppercase tracking-wider">
                  Select Add-ons & Extra Toppings
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {modifiers.slice(0, 8).map((mod) => {
                    const qty = selectedMods[mod.id] || 0;
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => {
                          setSelectedMods((prev) => ({
                            ...prev,
                            [mod.id]: (prev[mod.id] || 0) > 0 ? 0 : 1,
                          }));
                        }}
                        className={`p-2 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                          qty > 0
                            ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold'
                            : 'border-[#E5EAF2] text-[#172033] hover:bg-slate-50 font-medium'
                        }`}
                      >
                        <span className="text-xs">{mod.name}</span>
                        <span className="text-xs text-[#64748B]">
                          {mod.price > 0 ? `+£${mod.price.toFixed(2)}` : 'Free'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Special Kitchen Instructions / Notes */}
              <div className="pt-3 border-t border-[#E5EAF2]">
                <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
                  Special Kitchen Instructions / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Well done, no onions, extra crispy..."
                  value={modalItemNotes}
                  onChange={(e) => setModalItemNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5EAF2] text-[#172033] text-xs focus:outline-none focus:border-blue-600 placeholder:text-[#64748B] shadow-xs"
                />
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-[#E5EAF2] flex items-center justify-between">
              <div>
                <span className="text-xs text-[#64748B]">Total Price:</span>
                <div className="text-base font-extrabold text-blue-600">
                  £
                  {(
                    (selectedVariant ? selectedVariant.price : modalProduct.basePrice) +
                    (Object.entries(selectedMods) as [string, number][]).reduce((s, [id, q]) => {
                      const numQ = Number(q);
                      if (numQ <= 0) return s;
                      const m = modifiers.find((x) => x.id === id);
                      return s + (m?.price || 0) * numQ;
                    }, 0)
                  ).toFixed(2)}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalProduct(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. DISPATCHED ORDER CONFIRMATION MODAL */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5EAF2] shadow-2xl p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold uppercase mb-2">
                <BellRing className="w-3.5 h-3.5 text-blue-600" />
                <span>Real-Time Dispatched to Kitchen</span>
              </div>
              <h3 className="text-xl font-extrabold text-[#172033]">
                Order {completedOrder.invoiceId} Sent
              </h3>
              <p className="text-xs text-[#64748B] mt-1">
                Dispatched to <strong className="text-[#172033]">{completedOrder.storeName}</strong>
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-[#E5EAF2] text-xs text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Customer:</span>
                <span className="font-bold text-[#172033]">
                  {completedOrder.customer.firstName} {completedOrder.customer.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Phone:</span>
                <span className="font-medium text-[#172033]">{completedOrder.customer.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Fulfillment:</span>
                <span className="font-bold text-blue-600">{completedOrder.orderType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Grand Total:</span>
                <span className="font-extrabold text-[#172033]">£{completedOrder.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
              <div className="flex items-center justify-center gap-1.5 font-bold text-amber-900">
                <Volume2 className="w-4 h-4 animate-pulse text-amber-600" />
                <span>Store POS Audio Alert Active</span>
              </div>
              <p className="text-[11px] text-amber-700">
                The uploaded beeping alert is now ringing continuously on the Store POS terminal until accepted.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setCompletedOrder(null);
                  if (setActivePosMode) setActivePosMode('store');
                  setActiveAppView('pos-menu');
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <StoreIcon className="w-4 h-4" />
                <span>Go to Store POS & Accept Order</span>
              </button>

              <button
                onClick={() => setCompletedOrder(null)}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-all"
              >
                Take Next Phone Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. STORE-SPECIFIC MY ORDERS DRAWER / MODAL */}
      {activeHistoryTab && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl h-full bg-[#F8FAFC] border-l border-[#E5EAF2] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 bg-white border-b border-[#E5EAF2] flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-[#172033]">Store Orders</h3>
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                      {targetStore?.businessName}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B]">
                    Real-time tickets and active order timers for this branch
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveHistoryTab(false)}
                className="p-2 rounded-xl text-[#64748B] hover:text-[#172033] hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Tabs (Current / On The Way / Completed) & Search */}
            <div className="p-4 bg-white border-b border-[#E5EAF2] space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setHistoryStatusTab('Current')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    historyStatusTab === 'Current'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 text-[#64748B] hover:bg-slate-100 border border-[#E5EAF2]'
                  }`}
                >
                  <span>Current</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      historyStatusTab === 'Current'
                        ? 'bg-white text-blue-600'
                        : 'bg-slate-200 text-[#64748B]'
                    }`}
                  >
                    {currentCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setHistoryStatusTab('On The Way')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    historyStatusTab === 'On The Way'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 text-[#64748B] hover:bg-slate-100 border border-[#E5EAF2]'
                  }`}
                >
                  <span>On The Way</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      historyStatusTab === 'On The Way'
                        ? 'bg-white text-blue-600'
                        : 'bg-slate-200 text-[#64748B]'
                    }`}
                  >
                    {onTheWayCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setHistoryStatusTab('Completed')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    historyStatusTab === 'Completed'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 text-[#64748B] hover:bg-slate-100 border border-[#E5EAF2]'
                  }`}
                >
                  <span>Completed</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      historyStatusTab === 'Completed'
                        ? 'bg-white text-blue-600'
                        : 'bg-slate-200 text-[#64748B]'
                    }`}
                  >
                    {completedCount}
                  </span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by invoice, customer name, phone..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* Orders List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredStoreOrders.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-[#E5EAF2]">
                  <ShoppingBag className="w-10 h-10 text-[#94A3B8] mb-2" />
                  <p className="text-sm font-bold text-[#172033]">No {historyStatusTab} orders</p>
                  <p className="text-xs text-[#64748B] mt-1">
                    Orders routed to {targetStore?.businessName} will appear here.
                  </p>
                </div>
              ) : (
                filteredStoreOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl bg-white border border-[#E5EAF2] shadow-2xs hover:border-blue-300 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-mono text-xs font-black shadow-2xs">
                            Order #{order.orderNumber || order.invoiceId?.replace(/[^0-9]/g, '') || '1'}
                          </span>
                          <span className="font-mono font-bold text-xs text-slate-500">
                            {order.invoiceId}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              order.orderType === 'Delivery'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : order.orderType === 'Pickup'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-slate-100 text-[#172033] border border-[#E5EAF2]'
                            }`}
                          >
                            {order.orderType}
                          </span>
                        </div>
                        <div className="font-bold text-xs text-[#172033] mt-1">
                          {order.customer.firstName} {order.customer.lastName || ''}
                        </div>
                        <div className="text-[11px] text-[#64748B] font-mono">
                          {order.customer.phone}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-extrabold text-base text-[#172033]">
                          £{order.grandTotal.toFixed(2)}
                        </div>
                        <div className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-[#64748B] font-semibold mt-1 inline-block">
                          {order.paymentMethod}
                        </div>
                      </div>
                    </div>

                    {/* Live Elapsed & Countdown Timer */}
                    <div className="py-1">
                      <OrderLiveTimer order={order} />
                    </div>

                    {order.customer.fullAddress && order.orderType === 'Delivery' && (
                      <div className="text-xs text-[#64748B] bg-slate-50 p-2 rounded-xl border border-[#E5EAF2] flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span>{order.customer.fullAddress}</span>
                      </div>
                    )}

                    {/* Items List */}
                    <div className="space-y-1 text-xs text-[#172033] pt-1">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>
                            <b>{it.quantity}x</b> {it.productName} ({it.variantSize})
                          </span>
                          <span className="font-mono text-[#64748B]">£{it.totalPrice.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Actions: Print Thermal, Edit & Advance Status */}
                    <div className="pt-2 border-t border-[#E5EAF2] flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handlePrintReceipt(order)}
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-[#64748B] border border-[#E5EAF2] flex items-center gap-1 text-xs font-semibold cursor-pointer"
                          title="Print Thermal POS Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>

                        <button
                          onClick={() => handleStartEditOrder(order)}
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                          title="Edit order & add more items"
                        >
                          <Pencil className="w-3.5 h-3.5 text-amber-600" />
                          <span>Edit</span>
                        </button>
                      </div>

                      {order.orderStatus === 'Current' && (
                        <button
                          onClick={() => handleAdvanceStatus(order)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <span>
                            {order.orderType === 'Delivery' ? 'Send On The Way' : 'Mark Completed'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {order.orderStatus === 'On The Way' && (
                        <button
                          onClick={() => handleAdvanceStatus(order)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Complete Delivery</span>
                        </button>
                      )}

                      {order.orderStatus === 'Completed' && (
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Fulfilled</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customer Order History Modal */}
      {historyModalCustomer && (
        <CustomerOrderHistoryModal
          isOpen={Boolean(historyModalCustomer)}
          onClose={() => setHistoryModalCustomer(null)}
          customer={historyModalCustomer}
          orders={orders}
          onReorder={(reorderItems) => {
            setCartItems(reorderItems);
            setHistoryModalCustomer(null);
            soundFX.tap();
          }}
        />
      )}
    </div>
  );
};

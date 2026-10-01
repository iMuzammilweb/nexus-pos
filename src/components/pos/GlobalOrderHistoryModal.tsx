import React, { useState, useMemo } from 'react';
import {
  X,
  History,
  Search,
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  Truck,
  ShoppingBag,
  Store,
  CreditCard,
  Banknote,
  Receipt,
  Eye,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Copy,
  Check,
  ChevronRight,
  Filter,
  ArrowUpDown,
  Printer,
  RotateCcw,
  Sparkles,
  FileText,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { useNexus } from '../../context/NexusContext';
import { Order, CartItem, OrderType, OrderStatus, PaymentMethod } from '../../types';

// Helper to intelligently categorize item modifiers, addons, and modifications
export interface CategorizedExtras {
  variant?: string;
  salads: string[];
  sauces: string[];
  drinks: string[];
  sides: string[];
  addons: { name: string; price: number; quantity: number }[];
  instructions?: string;
}

export function categorizeCartItem(item: CartItem): CategorizedExtras {
  const salads: string[] = [];
  const sauces: string[] = [];
  const drinks: string[] = [];
  const sides: string[] = [];
  const addons: { name: string; price: number; quantity: number }[] = [];

  const saladKeywords = ['salad', 'lettuce', 'tomato', 'cucumber', 'onion', 'cabbage', 'jalapeno', 'pickle', 'sweetcorn', 'olive', 'slaw', 'peppers'];
  const sauceKeywords = ['sauce', 'mayo', 'ketchup', 'chilli', 'chili', 'garlic', 'bbq', 'barbecue', 'dip', 'mint', 'tahini', 'peri', 'relish', 'dressing'];
  const drinkKeywords = ['drink', 'coke', 'pepsi', 'fanta', 'sprite', '7up', 'water', 'tango', 'mirinda', 'rubicon', 'can', 'bottle', 'shake', 'juice', 'soda'];
  const sideKeywords = ['side', 'fries', 'chips', 'onion ring', 'garlic bread', 'wedges', 'wings', 'nuggets', 'strips', 'hash brown', 'mozzarella', 'coleslaw'];

  const testKeyword = (str: string, keywords: string[]) => {
    const lower = str.toLowerCase();
    return keywords.some((k) => lower.includes(k));
  };

  // 1. Standard selectedModifiers
  if (item.selectedModifiers && Array.isArray(item.selectedModifiers)) {
    for (const mod of item.selectedModifiers) {
      const name = mod.name || '';
      if (testKeyword(name, saladKeywords)) {
        salads.push(name);
      } else if (testKeyword(name, sauceKeywords)) {
        sauces.push(name);
      } else if (testKeyword(name, drinkKeywords)) {
        drinks.push(name);
      } else if (testKeyword(name, sideKeywords)) {
        sides.push(name);
      } else {
        addons.push({ name, price: mod.price || 0, quantity: mod.quantity || 1 });
      }
    }
  }

  // 2. selectedAddons
  if (item.selectedAddons && Array.isArray(item.selectedAddons)) {
    for (const add of item.selectedAddons) {
      const name = add.name || '';
      if (testKeyword(name, saladKeywords)) {
        salads.push(name);
      } else if (testKeyword(name, sauceKeywords)) {
        sauces.push(name);
      } else if (testKeyword(name, drinkKeywords)) {
        drinks.push(name);
      } else if (testKeyword(name, sideKeywords)) {
        sides.push(name);
      } else {
        addons.push({ name, price: add.price || 0, quantity: add.quantity || 1 });
      }
    }
  }

  // 3. modifications
  if (item.modifications && Array.isArray(item.modifications)) {
    for (const mod of item.modifications) {
      const name = mod.name || '';
      if (testKeyword(name, saladKeywords)) {
        salads.push(name);
      } else if (testKeyword(name, sauceKeywords)) {
        sauces.push(name);
      } else if (testKeyword(name, drinkKeywords)) {
        drinks.push(name);
      } else if (testKeyword(name, sideKeywords)) {
        sides.push(name);
      } else {
        addons.push({ name, price: mod.price || 0, quantity: 1 });
      }
    }
  }

  return {
    variant: item.variantName || item.variantSize || undefined,
    salads,
    sauces,
    drinks,
    sides,
    addons,
    instructions: item.specialInstructions || item.notes || undefined,
  };
}

export const GlobalOrderHistoryModal: React.FC = () => {
  const {
    orderHistory = [],
    orders = [],
    isOrderHistoryModalOpen,
    setIsOrderHistoryModalOpen,
    selectedHistoryOrder,
    setSelectedHistoryOrder,
    setLatestPlacedOrder,
    setIsReceiptModalOpen,
    addToCart,
    products = [],
    setActiveAppView,
  } = useNexus();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<OrderType | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'Cancelled' | 'ALL'>('ALL');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | 'ALL'>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH'>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'AMOUNT_DESC' | 'AMOUNT_ASC'>('NEWEST');
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  // Merge permanent order history with current orders to ensure not a single record is ever missed
  const allHistoricalOrders = useMemo(() => {
    const map = new Map<string, Order>();
    // Permanent orders first
    orderHistory.forEach((o) => map.set(o.id, o));
    // Overlay active orders
    orders.forEach((o) => {
      const existing = map.get(o.id);
      map.set(o.id, existing ? { ...existing, ...o } : o);
    });
    return Array.from(map.values());
  }, [orderHistory, orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000;
    const startOfWeek = now.getTime() - 7 * 86400000;
    const startOfMonth = now.getTime() - 30 * 86400000;

    return allHistoricalOrders
      .filter((order) => {
        // Type filter
        if (selectedType !== 'ALL' && order.orderType !== selectedType) {
          return false;
        }

        // Status filter
        if (selectedStatus !== 'ALL' && order.orderStatus !== selectedStatus) {
          return false;
        }

        // Payment method filter
        if (selectedPayment !== 'ALL' && order.paymentMethod !== selectedPayment) {
          return false;
        }

        // Date filter
        const orderTime = new Date(order.createdAt).getTime();
        if (!isNaN(orderTime)) {
          if (dateFilter === 'TODAY' && orderTime < startOfToday) return false;
          if (dateFilter === 'YESTERDAY' && (orderTime < startOfYesterday || orderTime >= startOfToday)) return false;
          if (dateFilter === 'WEEK' && orderTime < startOfWeek) return false;
          if (dateFilter === 'MONTH' && orderTime < startOfMonth) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const orderNum = (order.orderNumber || '').toLowerCase();
          const invoice = (order.invoiceId || '').toLowerCase();
          const custName = `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.toLowerCase();
          const custPhone = (order.customer?.phone || '').replace(/\s+/g, '');
          const cleanQ = q.replace(/\s+/g, '');
          const address = (order.customer?.fullAddress || '').toLowerCase();
          const postcode = (order.customer?.ukPostcode || '').toLowerCase();
          const notes = (order.customer?.notes || '').toLowerCase();
          const table = (order.customer?.tableReference || '').toLowerCase();

          const matchItems = (order.items || []).some((item) => {
            const nameMatch = (item.productName || '').toLowerCase().includes(q);
            const variantMatch = (item.variantName || '').toLowerCase().includes(q);
            const modMatch = (item.selectedModifiers || []).some((m) => m.name.toLowerCase().includes(q));
            const addonMatch = (item.selectedAddons || []).some((a) => a.name.toLowerCase().includes(q));
            const noteMatch = (item.specialInstructions || item.notes || '').toLowerCase().includes(q);
            return nameMatch || variantMatch || modMatch || addonMatch || noteMatch;
          });

          return (
            orderNum.includes(q) ||
            invoice.includes(q) ||
            custName.includes(q) ||
            custPhone.includes(cleanQ) ||
            address.includes(q) ||
            postcode.includes(q) ||
            notes.includes(q) ||
            table.includes(q) ||
            matchItems
          );
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'NEWEST') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'OLDEST') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === 'AMOUNT_DESC') {
          return (b.grandTotal || 0) - (a.grandTotal || 0);
        }
        if (sortBy === 'AMOUNT_ASC') {
          return (a.grandTotal || 0) - (b.grandTotal || 0);
        }
        return 0;
      });
  }, [allHistoricalOrders, selectedType, selectedStatus, selectedPayment, dateFilter, searchQuery, sortBy]);

  // Overall Statistics for History Header
  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  }, [filteredOrders]);

  const completedCount = useMemo(() => {
    return filteredOrders.filter((o) => o.orderStatus === 'Completed').length;
  }, [filteredOrders]);

  const handleCopyPhone = (phone: string, id: string) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(id);
    setTimeout(() => setCopiedPhoneId(null), 2000);
  };

  const handlePrintReceipt = (order: Order) => {
    setLatestPlacedOrder(order);
    setIsReceiptModalOpen(true);
  };

  const handleReorder = (order: Order) => {
    if (!order.items || order.items.length === 0) return;
    // addToCart takes (product, variant, modifiers, qty, notes, modifications), not a cart line
    order.items.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return;
      const variant =
        product.variants?.find((v) => v.id === item.variantId) ??
        ({
          id: item.variantId,
          productId: product.id,
          name: item.variantName,
          sizeLabel: item.variantSize,
          price: item.unitPrice,
          sku: '',
        } as any);
      addToCart(
        product,
        variant,
        item.selectedModifiers || [],
        item.quantity,
        item.notes || item.specialInstructions,
        item.modifications
      );
    });
    setIsOrderHistoryModalOpen(false);
    setSelectedHistoryOrder(null);
    setActiveAppView('pos-menu');
  };

  if (!isOrderHistoryModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] font-sans">
        {/* 1. Modal Top Header */}
        <div className="bg-[#0F172A] text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Order History</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'}
                </span>
                <span className="hidden md:inline px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Permanent Sync Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Every order saved permanently with full item breakdown, variants, add-ons, salads, sauces, drinks, sides, and notes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsOrderHistoryModalOpen(false);
                setSelectedHistoryOrder(null);
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Order History"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Quick Stat Counters */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 sm:px-6 py-2.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Total in View:</span>
            <span className="font-bold text-slate-900 font-mono">{filteredOrders.length} orders</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Fulfilled:</span>
            <span className="font-bold text-emerald-700 font-mono">{completedCount} completed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Total Revenue:</span>
            <span className="font-bold text-blue-700 font-mono text-sm">£{totalRevenue.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Total Saved Permanently:</span>
            <span className="font-bold text-slate-800 font-mono">{allHistoricalOrders.length} all-time</span>
          </div>
        </div>

        {/* 3. Filter Toolbar & Search Bar */}
        <div className="p-4 bg-white border-b border-slate-200 space-y-3 shrink-0">
          <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Order #, Invoice, Customer, Phone, Item, Salad, Sauce, Note..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Order Type */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-semibold focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="ALL">All Order Types</option>
                <option value="Delivery">Delivery</option>
                <option value="Pickup">Pickup</option>
                <option value="In-Store">In-Store</option>
              </select>

              {/* Order Status */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-semibold focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="Current">Current</option>
                <option value="On The Way">On The Way</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              {/* Payment Method */}
              <select
                value={selectedPayment}
                onChange={(e) => setSelectedPayment(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-semibold focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="ALL">All Payment Methods</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Online">Online</option>
              </select>

              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-semibold focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today</option>
                <option value="YESTERDAY">Yesterday</option>
                <option value="WEEK">Last 7 Days</option>
                <option value="MONTH">Last 30 Days</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-semibold focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="NEWEST">Newest First</option>
                <option value="OLDEST">Oldest First</option>
                <option value="AMOUNT_DESC">Total: High to Low</option>
                <option value="AMOUNT_ASC">Total: Low to High</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. Orders Body List & Details Split View */}
        <div className="flex-1 flex overflow-hidden bg-slate-50">
          {/* LEFT: Order List */}
          <div
            className={`w-full ${
              selectedHistoryOrder ? 'hidden lg:block lg:w-1/2' : 'w-full'
            } border-r border-slate-200 overflow-y-auto p-4 space-y-3`}
          >
            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                  <History className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">No Orders Found in History</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {searchQuery || selectedType !== 'ALL' || selectedStatus !== 'ALL' || dateFilter !== 'ALL'
                    ? 'No orders match your active search or filters. Try clearing your search parameters.'
                    : 'Every completed, current, or cancelled order will be stored here permanently.'}
                </p>
                {(searchQuery || selectedType !== 'ALL' || selectedStatus !== 'ALL' || dateFilter !== 'ALL') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedType('ALL');
                      setSelectedStatus('ALL');
                      setSelectedPayment('ALL');
                      setDateFilter('ALL');
                    }}
                    className="mt-4 px-4 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition cursor-pointer"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isSelected = selectedHistoryOrder?.id === order.id;
                const createdDate = new Date(order.createdAt);
                const dateStr = !isNaN(createdDate.getTime())
                  ? createdDate.toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Today';
                const timeStr = !isNaN(createdDate.getTime())
                  ? createdDate.toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '';

                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedHistoryOrder(order)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer relative bg-white ${
                      isSelected
                        ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                        : 'border-slate-200 hover:border-blue-300 hover:shadow-xs'
                    }`}
                  >
                    {/* Top Row: Order #, Date/Time, Status Badge */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 font-mono font-black text-xs flex items-center justify-center shrink-0">
                          #{order.orderNumber || order.invoiceId?.replace(/[^0-9]/g, '') || '1'}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-sm font-mono">
                              {order.invoiceId || `#NEX-${order.orderNumber || '1'}`}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                order.orderType === 'Delivery'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : order.orderType === 'Pickup'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {order.orderType}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {dateStr} at {timeStr}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black text-slate-900 font-mono block">
                          £{(order.grandTotal || 0).toFixed(2)}
                        </span>
                        <span
                          className={`inline-block px-2 py-0.2 rounded-full text-[10px] font-bold border mt-0.5 ${
                            order.orderStatus === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : order.orderStatus === 'Current'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : order.orderStatus === 'On The Way'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {order.orderStatus}
                        </span>
                      </div>
                    </div>

                    {/* Customer Row: Name, Phone, Address / Table */}
                    <div className="pt-2.5 pb-2 text-xs flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-slate-800">
                          {order.customer?.firstName || 'Customer'} {order.customer?.lastName || ''}
                        </span>
                        {order.customer?.phone && (
                          <div className="flex items-center gap-1 text-slate-600 font-mono text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{order.customer.phone}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyPhone(order.customer.phone, order.id);
                              }}
                              className="text-slate-400 hover:text-blue-600 ml-1 cursor-pointer"
                              title="Copy Phone"
                            >
                              {copiedPhoneId === order.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <CreditCard className="w-3 h-3 text-slate-400" />
                        <span className="font-medium text-slate-700">{order.paymentMethod || 'Cash'}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500">{order.source || 'Store POS'}</span>
                      </div>
                    </div>

                    {/* Delivery / Table info if any */}
                    {order.orderType === 'Delivery' && order.customer?.fullAddress && (
                      <div className="mb-2 text-[11px] text-slate-600 flex items-start gap-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <MapPin className="w-3 h-3 text-blue-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{order.customer.fullAddress}</span>
                        {order.customer.ukPostcode && (
                          <span className="font-mono font-bold text-blue-700 ml-auto shrink-0">
                            {order.customer.ukPostcode}
                          </span>
                        )}
                      </div>
                    )}

                    {order.orderType === 'In-Store' && order.customer?.tableReference && (
                      <div className="mb-2 text-[11px] text-blue-800 bg-blue-50/60 px-2 py-1 rounded-md border border-blue-100 font-semibold inline-block">
                        Table: {order.customer.tableReference}
                      </div>
                    )}

                    {/* Order Notes Preview */}
                    {order.customer?.notes && (
                      <div className="mb-2 text-[11px] text-amber-900 bg-amber-50/70 px-2 py-1 rounded-md border border-amber-200/80 italic font-medium">
                        "{order.customer.notes}"
                      </div>
                    )}

                    {/* Ordered Items Preview with Badges for Salads, Sauces, Drinks, Sides, Notes */}
                    <div className="border-t border-slate-100 pt-2 space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Items Ordered ({order.items?.length || 0}):
                      </div>
                      <div className="space-y-1">
                        {(order.items || []).map((item, idx) => {
                          const cat = categorizeCartItem(item);

                          return (
                            <div key={idx} className="text-xs bg-slate-50/60 p-2 rounded-lg border border-slate-100">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-blue-700 font-mono bg-blue-100/70 px-1.5 py-0.2 rounded text-[11px]">
                                    {item.quantity}x
                                  </span>
                                  <span className="font-bold text-slate-800">{item.productName}</span>
                                  {cat.variant && (
                                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                                      {cat.variant}
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono font-semibold text-slate-700 text-xs">
                                  £{(item.totalPrice || item.unitPrice * item.quantity).toFixed(2)}
                                </span>
                              </div>

                              {/* Salads, Sauces, Drinks, Sides Badges */}
                              <div className="flex flex-wrap gap-1 mt-1 text-[10px]">
                                {cat.salads.length > 0 && (
                                  <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded font-medium">
                                    🥗 {cat.salads.join(', ')}
                                  </span>
                                )}
                                {cat.sauces.length > 0 && (
                                  <span className="inline-flex items-center gap-0.5 bg-rose-50 text-rose-800 border border-rose-200 px-1.5 py-0.2 rounded font-medium">
                                    🥫 {cat.sauces.join(', ')}
                                  </span>
                                )}
                                {cat.drinks.length > 0 && (
                                  <span className="inline-flex items-center gap-0.5 bg-cyan-50 text-cyan-800 border border-cyan-200 px-1.5 py-0.2 rounded font-medium">
                                    🥤 {cat.drinks.join(', ')}
                                  </span>
                                )}
                                {cat.sides.length > 0 && (
                                  <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
                                    🍟 {cat.sides.join(', ')}
                                  </span>
                                )}
                                {cat.addons.length > 0 && (
                                  <span className="inline-flex items-center gap-0.5 bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.2 rounded font-medium">
                                    + {cat.addons.map((a) => a.name).join(', ')}
                                  </span>
                                )}
                                {cat.instructions && (
                                  <span className="inline-flex items-center gap-0.5 bg-orange-50 text-orange-800 border border-orange-200 px-1.5 py-0.2 rounded font-medium italic">
                                    📝 {cat.instructions}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bottom CTA: View Full Original Order Details */}
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-bold">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        Click to view full original order details
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* RIGHT: Complete Original Order Details View */}
          <div
            className={`w-full lg:w-1/2 bg-white overflow-y-auto p-5 space-y-4 ${
              selectedHistoryOrder ? 'block' : 'hidden lg:flex lg:flex-col lg:items-center lg:justify-center text-center p-8'
            }`}
          >
            {selectedHistoryOrder ? (
              <div className="space-y-4">
                {/* Header of Detail Pane */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedHistoryOrder(null)}
                      className="lg:hidden p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 mr-1"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 font-mono">
                          Order #{selectedHistoryOrder.orderNumber || selectedHistoryOrder.invoiceId?.replace(/[^0-9]/g, '') || '1'}
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            selectedHistoryOrder.orderStatus === 'Completed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : selectedHistoryOrder.orderStatus === 'Current'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : selectedHistoryOrder.orderStatus === 'On The Way'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-red-50 text-red-800 border-red-200'
                          }`}
                        >
                          {selectedHistoryOrder.orderStatus}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        Invoice: {selectedHistoryOrder.invoiceId} •{' '}
                        {new Date(selectedHistoryOrder.createdAt).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handlePrintReceipt(selectedHistoryOrder)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                      title="Reprint Thermal Receipt"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-600" />
                      <span>Receipt</span>
                    </button>
                    <button
                      onClick={() => handleReorder(selectedHistoryOrder)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer"
                      title="Load items into active POS cart"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reorder</span>
                    </button>
                  </div>
                </div>

                {/* Customer & Fulfillment Information Card */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-slate-900">Customer & Fulfillment</span>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                        selectedHistoryOrder.orderType === 'Delivery'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : selectedHistoryOrder.orderType === 'Pickup'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {selectedHistoryOrder.orderType === 'Delivery' && <Truck className="w-3 h-3" />}
                      {selectedHistoryOrder.orderType === 'Pickup' && <ShoppingBag className="w-3 h-3" />}
                      {selectedHistoryOrder.orderType === 'In-Store' && <Store className="w-3 h-3" />}
                      <span>{selectedHistoryOrder.orderType}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Customer Name</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {selectedHistoryOrder.customer?.firstName || 'Walk-In'}{' '}
                        {selectedHistoryOrder.customer?.lastName || ''}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Phone Number</span>
                      {selectedHistoryOrder.customer?.phone ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          <a
                            href={`tel:${selectedHistoryOrder.customer.phone}`}
                            className="font-mono font-bold text-blue-600 hover:underline"
                          >
                            {selectedHistoryOrder.customer.phone}
                          </a>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyPhone(
                                selectedHistoryOrder.customer.phone,
                                selectedHistoryOrder.id
                              )
                            }
                            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                            title="Copy Phone"
                          >
                            {copiedPhoneId === selectedHistoryOrder.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not provided</span>
                      )}
                    </div>
                  </div>

                  {/* Delivery Address Details */}
                  {selectedHistoryOrder.orderType === 'Delivery' && (
                    <div className="pt-2 border-t border-slate-200 space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-semibold block">Delivery Address</span>
                      <div className="flex items-start gap-1.5 text-slate-800">
                        <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">{selectedHistoryOrder.customer?.fullAddress || 'Address on file'}</p>
                          {selectedHistoryOrder.customer?.ukPostcode && (
                            <span className="font-mono text-xs font-bold text-blue-700">
                              {selectedHistoryOrder.customer.ukPostcode}
                            </span>
                          )}
                        </div>
                      </div>

                      {selectedHistoryOrder.customer?.driverInstructions && (
                        <div className="p-2 bg-blue-50 rounded-lg border border-blue-200 text-[11px] text-blue-900 mt-1">
                          <strong className="font-bold block">Driver Instructions:</strong>
                          {selectedHistoryOrder.customer.driverInstructions}
                        </div>
                      )}
                    </div>
                  )}

                  {/* In-Store Table Reference */}
                  {selectedHistoryOrder.orderType === 'In-Store' && selectedHistoryOrder.customer?.tableReference && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-[10px] text-slate-400 font-semibold block">Table Reference</span>
                      <span className="font-bold text-blue-800 bg-blue-100/70 px-2.5 py-1 rounded-md border border-blue-200 inline-block mt-0.5">
                        Table {selectedHistoryOrder.customer.tableReference}
                      </span>
                    </div>
                  )}

                  {/* Special Kitchen / Customer Notes */}
                  {selectedHistoryOrder.customer?.notes && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-[10px] text-slate-400 font-semibold block">Special Kitchen Notes</span>
                      <p className="text-slate-800 italic bg-amber-50 p-2.5 rounded-lg border border-amber-200 mt-0.5 font-medium">
                        "{selectedHistoryOrder.customer.notes}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Ordered Items Full Breakdown Card */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-xs text-slate-900">Ordered Items & Add-ons</span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono font-medium">
                      {(selectedHistoryOrder.items || []).reduce((sum, item) => sum + item.quantity, 0)} items total
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {(selectedHistoryOrder.items || []).map((item, idx) => {
                      const cat = categorizeCartItem(item);

                      return (
                        <div key={idx} className="py-3 first:pt-0 last:pb-0 text-xs space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs border border-blue-100">
                                  {item.quantity}x
                                </span>
                                <span className="font-bold text-slate-900 text-sm">{item.productName}</span>
                                {cat.variant && (
                                  <span className="text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-semibold border border-slate-200">
                                    Variant: {cat.variant}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono ml-8 mt-0.5 block">
                                £{item.unitPrice.toFixed(2)} each
                              </span>
                            </div>

                            <span className="font-mono font-bold text-slate-900 text-sm">
                              £{(item.totalPrice || item.unitPrice * item.quantity).toFixed(2)}
                            </span>
                          </div>

                          {/* Salads breakdown */}
                          {cat.salads.length > 0 && (
                            <div className="ml-8 p-2 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900">
                              <strong className="font-bold text-emerald-800 block text-[10px] uppercase tracking-wide">
                                🥗 Salads:
                              </strong>
                              <span>{cat.salads.join(', ')}</span>
                            </div>
                          )}

                          {/* Sauces breakdown */}
                          {cat.sauces.length > 0 && (
                            <div className="ml-8 p-2 rounded-lg bg-rose-50/70 border border-rose-200 text-xs text-rose-900">
                              <strong className="font-bold text-rose-800 block text-[10px] uppercase tracking-wide">
                                🥫 Sauces:
                              </strong>
                              <span>{cat.sauces.join(', ')}</span>
                            </div>
                          )}

                          {/* Drinks breakdown */}
                          {cat.drinks.length > 0 && (
                            <div className="ml-8 p-2 rounded-lg bg-cyan-50/70 border border-cyan-200 text-xs text-cyan-900">
                              <strong className="font-bold text-cyan-800 block text-[10px] uppercase tracking-wide">
                                🥤 Drinks:
                              </strong>
                              <span>{cat.drinks.join(', ')}</span>
                            </div>
                          )}

                          {/* Sides breakdown */}
                          {cat.sides.length > 0 && (
                            <div className="ml-8 p-2 rounded-lg bg-amber-50/70 border border-amber-200 text-xs text-amber-900">
                              <strong className="font-bold text-amber-800 block text-[10px] uppercase tracking-wide">
                                🍟 Sides:
                              </strong>
                              <span>{cat.sides.join(', ')}</span>
                            </div>
                          )}

                          {/* Additional Add-ons */}
                          {cat.addons.length > 0 && (
                            <div className="ml-8 p-2 rounded-lg bg-blue-50/60 border border-blue-200 text-xs text-blue-900">
                              <strong className="font-bold text-blue-800 block text-[10px] uppercase tracking-wide">
                                ✨ Add-ons / Extras:
                              </strong>
                              <div className="space-y-0.5 mt-0.5">
                                {cat.addons.map((add, ai) => (
                                  <div key={ai} className="flex items-center justify-between text-[11px]">
                                    <span>+ {add.name}</span>
                                    <span className="font-mono text-blue-700 font-semibold">
                                      {add.price > 0 ? `+£${(add.price * item.quantity).toFixed(2)}` : 'Free'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Item Special Notes */}
                          {cat.instructions && (
                            <div className="ml-8 p-2 rounded-lg bg-orange-50/80 border border-orange-200 text-xs text-orange-950 italic">
                              <strong className="font-bold text-orange-800 not-italic block text-[10px] uppercase tracking-wide">
                                📝 Item Instructions:
                              </strong>
                              "{cat.instructions}"
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Financial Summary Card */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-2">
                    Financial & Payment Breakdown
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-mono font-medium">£{(selectedHistoryOrder.subtotal || 0).toFixed(2)}</span>
                  </div>

                  {selectedHistoryOrder.modifiersTotal > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Modifiers / Add-ons Total</span>
                      <span className="font-mono font-medium">
                        +£{(selectedHistoryOrder.modifiersTotal || 0).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {selectedHistoryOrder.orderType === 'Delivery' && (
                    <div className="flex justify-between text-slate-600">
                      <span>Delivery Fee</span>
                      <span className="font-mono font-medium">
                        £{(selectedHistoryOrder.deliveryFee || 0).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {(selectedHistoryOrder.discount > 0 || selectedHistoryOrder.couponDiscount > 0) && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Discounts Applied</span>
                      <span className="font-mono">
                        -£{((selectedHistoryOrder.discount || 0) + (selectedHistoryOrder.couponDiscount || 0)).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {selectedHistoryOrder.serviceCharge > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Service Charge</span>
                      <span className="font-mono font-medium">
                        +£{(selectedHistoryOrder.serviceCharge || 0).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-black text-slate-900">
                    <span>Grand Total</span>
                    <span className="font-mono text-blue-700 text-lg">
                      £{(selectedHistoryOrder.grandTotal || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                      Payment: <strong className="text-slate-800">{selectedHistoryOrder.paymentMethod || 'Cash'}</strong> (
                      <span className="text-emerald-700 font-bold">{selectedHistoryOrder.paymentStatus || 'Paid'}</span>)
                    </span>
                    <span>Operator: {selectedHistoryOrder.cashierName || 'Cashier'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                  <Receipt className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">Select an Order</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Click on any order in the history list to inspect its complete itemized breakdown, variants, add-ons, salads, sauces, drinks, sides, and notes.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

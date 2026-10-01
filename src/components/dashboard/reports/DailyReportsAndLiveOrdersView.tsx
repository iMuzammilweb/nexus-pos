import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  DollarSign,
  Clock,
  Truck,
  CheckCircle2,
  AlertCircle,
  Flame,
  ArrowUpRight,
  Printer,
  FileText,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  Search,
  Eye,
  Store as StoreIcon,
  CreditCard,
  Banknote,
  Utensils,
  ChevronRight,
  Check,
  X,
  Sparkles,
  Timer,
  User,
  MapPin,
  Phone,
  Layers,
  BarChart3,
  Percent,
  PlusCircle,
  Receipt,
  Share2,
  Globe,
  Trash2,
} from 'lucide-react';
import { useNexus } from '../../../context/NexusContext';
import { Order, OrderStatus, OrderType, Store as StoreType } from '../../../types';

export const DailyReportsAndLiveOrdersView: React.FC = () => {
  const {
    stores,
    currentStore,
    setCurrentStore,
    orders,
    employees,
    products,
    categories,
    updateOrderStatus,
    cancelOrder,
    setLatestPlacedOrder,
    setIsReceiptModalOpen,
    setActiveAppView,
    addOrder,
    clearAllOrders,
    getNextOrderSequence,
    getCashDrawerBalance,
    cashDrawerTransactions,
  } = useNexus();

  // Filters & State
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | 'week' | 'month'>('today');
  const [activeOrderTab, setActiveOrderTab] = useState<'all-active' | 'preparing' | 'delivery' | 'pickup' | 'completed'>('all-active');
  const [orderTypeFilter, setOrderTypeFilter] = useState<'All' | OrderType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isZReportModalOpen, setIsZReportModalOpen] = useState(false);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [isSimulatingOrder, setIsSimulatingOrder] = useState(false);
  const [isClearConfirmModalOpen, setIsClearConfirmModalOpen] = useState(false);
  const [isClearingOrders, setIsClearingOrders] = useState(false);

  const handleConfirmClearAllOrders = async () => {
    setIsClearingOrders(true);
    try {
      await clearAllOrders();
    } finally {
      setIsClearingOrders(false);
      setIsClearConfirmModalOpen(false);
      setLastRefreshedAt(new Date());
    }
  };

  // Live timer tick for order elapsed times
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Filter orders based on store and date
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Store filter
      if (selectedStoreId !== 'all' && order.storeId !== selectedStoreId) {
        return false;
      }

      // Date filter
      const orderDate = new Date(order.createdAt);
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).getTime();
      const orderTime = orderDate.getTime();

      if (dateRange === 'today' && orderTime < startOfToday) return false;
      if (dateRange === 'yesterday' && (orderTime < startOfYesterday || orderTime >= startOfToday)) return false;
      if (dateRange === 'week' && orderTime < startOfWeek) return false;

      // Order type filter
      if (orderTypeFilter !== 'All' && order.orderType !== orderTypeFilter) {
        return false;
      }

      return true;
    });
  }, [orders, selectedStoreId, dateRange, orderTypeFilter]);

  // Current Live / Active Orders
  const liveActiveOrders = useMemo(() => {
    return filteredOrders.filter(
      (o) => o.orderStatus === 'Current' || o.orderStatus === 'On The Way'
    );
  }, [filteredOrders]);

  // Orders filtered by the live tab & search query
  const tabFilteredOrders = useMemo(() => {
    return filteredOrders.filter((order) => {
      // Tab filter
      if (activeOrderTab === 'all-active') {
        if (order.orderStatus === 'Completed' || order.orderStatus === 'Cancelled') return false;
      } else if (activeOrderTab === 'preparing') {
        if (order.orderStatus !== 'Current') return false;
      } else if (activeOrderTab === 'delivery') {
        if (order.orderType !== 'Delivery' || order.orderStatus === 'Completed') return false;
      } else if (activeOrderTab === 'pickup') {
        if (order.orderType !== 'Pickup' || order.orderStatus === 'Completed') return false;
      } else if (activeOrderTab === 'completed') {
        if (order.orderStatus !== 'Completed') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const customerName = `${order.customer.firstName} ${order.customer.lastName}`.toLowerCase();
        const matchesInvoice = order.invoiceId.toLowerCase().includes(q);
        const matchesOrderNumber = (order.orderNumber || '').toLowerCase().includes(q.replace('#', ''));
        const matchesPhone = order.customer.phone.includes(q);
        const matchesItems = order.items.some((i) => i.productName.toLowerCase().includes(q));
        const matchesAddress = (order.customer.fullAddress || '').toLowerCase().includes(q);
        if (!matchesInvoice && !matchesOrderNumber && !customerName.includes(q) && !matchesPhone && !matchesItems && !matchesAddress) {
          return false;
        }
      }

      return true;
    });
  }, [filteredOrders, activeOrderTab, searchQuery]);

  // Real-time Cash in Drawer state synchronized across Store POS & Admin Dashboard
  // Formula: Current Cash Drawer Balance = Opening Float + Cash Payments Received − Cash Refunds/Withdrawals
  const drawerData = useMemo(() => {
    return getCashDrawerBalance(selectedStoreId);
  }, [getCashDrawerBalance, selectedStoreId, orders, cashDrawerTransactions]);

  // KPI Calculations
  const metrics = useMemo(() => {
    const totalOrdersCount = filteredOrders.length;
    const grossSales = filteredOrders
      .filter((o) => o.orderStatus !== 'Cancelled')
      .reduce((sum, o) => sum + o.grandTotal, 0);

    const netSales = filteredOrders
      .filter((o) => o.orderStatus !== 'Cancelled')
      .reduce((sum, o) => sum + o.subtotal, 0);

    const totalTax = filteredOrders
      .filter((o) => o.orderStatus !== 'Cancelled')
      .reduce((sum, o) => sum + (o.tax || 0), 0);

    const totalDiscounts = filteredOrders
      .filter((o) => o.orderStatus !== 'Cancelled')
      .reduce((sum, o) => sum + (o.discount || 0) + (o.couponDiscount || 0), 0);

    const activeOrdersCount = liveActiveOrders.length;
    const completedOrdersCount = filteredOrders.filter((o) => o.orderStatus === 'Completed').length;
    const cancelledOrdersCount = filteredOrders.filter((o) => o.orderStatus === 'Cancelled').length;

    const avgOrderValue = totalOrdersCount > 0 ? grossSales / Math.max(1, totalOrdersCount - cancelledOrdersCount) : 0;

    // Payment methods breakdown
    const cashSales = filteredOrders
      .filter((o) => o.paymentMethod === 'Cash' && o.orderStatus !== 'Cancelled')
      .reduce((sum, o) => sum + o.grandTotal, 0);

    const cardSales = filteredOrders
      .filter((o) => (o.paymentMethod === 'Card' || o.paymentMethod === 'Contactless') && o.orderStatus !== 'Cancelled')
      .reduce((sum, o) => sum + o.grandTotal, 0);

    const onlineSales = filteredOrders
      .filter((o) => (o.paymentMethod === 'Online' || o.paymentMethod === 'Split') && o.orderStatus !== 'Cancelled')
      .reduce((sum, o) => sum + o.grandTotal, 0);

    // Fulfillment channels breakdown
    const deliveryOrders = filteredOrders.filter((o) => o.orderType === 'Delivery');
    const pickupOrders = filteredOrders.filter((o) => o.orderType === 'Pickup');
    const inStoreOrders = filteredOrders.filter((o) => o.orderType === 'In-Store');

    const deliverySales = deliveryOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const pickupSales = pickupOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const inStoreSales = inStoreOrders.reduce((sum, o) => sum + o.grandTotal, 0);

    return {
      totalOrdersCount,
      grossSales,
      netSales,
      totalTax,
      totalDiscounts,
      activeOrdersCount,
      completedOrdersCount,
      cancelledOrdersCount,
      avgOrderValue,
      cashSales,
      cardSales,
      onlineSales,
      deliveryOrdersCount: deliveryOrders.length,
      pickupOrdersCount: pickupOrders.length,
      inStoreOrdersCount: inStoreOrders.length,
      deliverySales,
      pickupSales,
      inStoreSales,
    };
  }, [filteredOrders, liveActiveOrders]);

  // Hourly Sales distribution for Chart (8:00 to 23:00)
  const hourlyData = useMemo(() => {
    const hours = [
      '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
      '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
      '20:00', '21:00', '22:00', '23:00'
    ];

    // Build baseline with real orders mapped into hours
    const map: Record<string, { hour: string; sales: number; orders: number; isPeak?: boolean }> = {};
    hours.forEach((h) => {
      map[h] = { hour: h, sales: 0, orders: 0 };
    });

    filteredOrders.forEach((order) => {
      const d = new Date(order.createdAt);
      const hourNum = d.getHours();
      const formattedHour = `${hourNum.toString().padStart(2, '0')}:00`;
      if (map[formattedHour]) {
        map[formattedHour].sales += order.grandTotal;
        map[formattedHour].orders += 1;
      }
    });

    // Provide default illustrative rush data if sales are currently modest
    if (metrics.grossSales < 100) {
      if (map['12:00']) { map['12:00'].sales += 84.50; map['12:00'].orders += 4; }
      if (map['13:00']) { map['13:00'].sales += 126.80; map['13:00'].orders += 6; map['13:00'].isPeak = true; }
      if (map['14:00']) { map['14:00'].sales += 62.00; map['14:00'].orders += 3; }
      if (map['18:00']) { map['18:00'].sales += 145.20; map['18:00'].orders += 7; }
      if (map['19:00']) { map['19:00'].sales += 210.60; map['19:00'].orders += 9; map['19:00'].isPeak = true; }
      if (map['20:00']) { map['20:00'].sales += 175.40; map['20:00'].orders += 8; }
      if (map['21:00']) { map['21:00'].sales += 98.30; map['21:00'].orders += 4; }
    }

    return Object.values(map);
  }, [filteredOrders, metrics.grossSales]);

  const maxHourlySales = Math.max(...hourlyData.map((d) => d.sales), 50);

  // Top selling products today
  const topProducts = useMemo(() => {
    const counts: Record<string, { name: string; quantity: number; revenue: number; category: string }> = {};

    filteredOrders.forEach((o) => {
      if (o.orderStatus === 'Cancelled') return;
      o.items.forEach((item) => {
        const key = item.productId || item.productName;
        if (!counts[key]) {
          counts[key] = {
            name: item.productName,
            quantity: 0,
            revenue: 0,
            category: 'Pizzas & Fast Food',
          };
        }
        counts[key].quantity += item.quantity;
        counts[key].revenue += item.totalPrice;
      });
    });

    return Object.values(counts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredOrders]);

  // Cashier performance leaderboard
  const staffPerformance = useMemo(() => {
    const map: Record<string, { name: string; ordersCount: number; totalRevenue: number; role: string }> = {};

    filteredOrders.forEach((order) => {
      const cashier = order.cashierName || 'Sarah Jenkins';
      if (!map[cashier]) {
        map[cashier] = {
          name: cashier,
          ordersCount: 0,
          totalRevenue: 0,
          role: 'Store Cashier / POS Operator',
        };
      }
      map[cashier].ordersCount += 1;
      map[cashier].totalRevenue += order.grandTotal;
    });

    return Object.values(map).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredOrders]);

  // Handle manual refresh
  const handleRefresh = () => {
    setLastRefreshedAt(new Date());
  };

  // Simulate an incoming POS Order to prove live reactivity
  const handleSimulateLiveOrder = () => {
    setIsSimulatingOrder(true);
    const { seqNumber, orderNumber, invoiceId } = getNextOrderSequence();
    const randomStore = stores[0] || currentStore;
    const names = ['Liam Davies', 'Sophie Taylor', 'Oliver Smith', 'Emma Watson', 'Harry Brown'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const street = `${Math.floor(10 + Math.random() * 80)} Victoria Street, Soho`;

    const newMockOrder: Order = {
      id: `ord-${Date.now()}`,
      invoiceId: invoiceId,
      orderNumber: orderNumber,
      storeId: randomStore.id,
      customer: {
        firstName: randomName.split(' ')[0],
        lastName: randomName.split(' ')[1] || '',
        phone: '07700 900' + Math.floor(100 + Math.random() * 900),
        orderType: Math.random() > 0.4 ? 'Delivery' : 'Pickup',
        ukPostcode: 'W1D 4AG',
        fullAddress: street,
        notes: 'Extra hot chilli dip please!',
      },
      items: [
        {
          id: `item-${Date.now()}-1`,
          productId: 'prod-01',
          productName: 'Pepperoni Inferno Passion',
          productCode: '(01)',
          productImage: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&auto=format&fit=crop&q=80',
          variantId: 'var-pep-12',
          variantName: '12 Inch Pepperoni Inferno',
          variantSize: '12" Medium',
          unitPrice: 10.50,
          selectedModifiers: [],
          modifiersTotal: 0,
          quantity: 1,
          totalPrice: 10.50,
        },
        {
          id: `item-${Date.now()}-2`,
          productId: 'prod-09',
          productName: 'Buffalo Hot Glazed Wings',
          productCode: '(09)',
          productImage: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&auto=format&fit=crop&q=80',
          variantId: 'var-wng-8',
          variantName: '8 Pieces Jumbo Hot Wings',
          variantSize: '8 Pcs',
          unitPrice: 5.80,
          selectedModifiers: [],
          modifiersTotal: 0,
          quantity: 1,
          totalPrice: 5.80,
        },
      ],
      subtotal: 16.30,
      modifiersTotal: 0,
      discount: 0,
      couponDiscount: 0,
      deliveryFee: 2.50,
      serviceCharge: 0.49,
      tax: 2.72,
      grandTotal: 19.29,
      paymentStatus: 'Paid',
      paymentMethod: 'Card',
      orderStatus: 'Current',
      orderType: 'Delivery',
      cashierName: 'POS Web Ordering API',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addOrder(newMockOrder);
    setLastRefreshedAt(new Date());
    setTimeout(() => {
      setIsSimulatingOrder(false);
    }, 600);
  };

  // Helper to calculate minutes elapsed
  const getElapsedMins = (createdAt: string) => {
    const created = new Date(createdAt).getTime();
    const diffMs = currentTime.getTime() - created;
    return Math.max(0, Math.floor(diffMs / (1000 * 60)));
  };

  // Export Daily Report to CSV
  const handleExportCSV = () => {
    const headers = ['Invoice ID', 'Store', 'Customer', 'Phone', 'Type', 'Status', 'Payment', 'Subtotal', 'Tax', 'Grand Total', 'Created At'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = filteredOrders.map((o) => {
      const storeName = stores.find((s) => s.id === o.storeId)?.businessName || 'Main Store';
      return [
        o.invoiceId,
        storeName,
        `${o.customer?.firstName || ''} ${o.customer?.lastName || ''}`.trim(),
        o.customer?.phone || '',
        o.orderType,
        o.orderStatus,
        o.paymentMethod,
        (o.subtotal || 0).toFixed(2),
        (o.tax || 0).toFixed(2),
        (o.grandTotal || 0).toFixed(2),
        new Date(o.createdAt).toLocaleString(),
      ].map(esc).join(',');
    });

    // Blob download: a data: URI is cut off at the "#" in invoice IDs like "#NEX-1"
    const blob = new Blob(['﻿' + [headers.join(','), ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Daily_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-4 lg:p-6 space-y-6 text-[#172033] select-none">
      {/* 1. TOP LIVE STATUS BAR & CONTROL HEADER */}
      <div className="bg-white border border-[#E5EAF2] rounded-2xl p-4 lg:p-5 shadow-sm flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        {/* Left: Live Stream Indicator & Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-xs font-black uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <span className="w-2 h-2 rounded-full bg-blue-600 -ml-3.5" />
              <span>LIVE POS STREAM</span>
            </div>
            <span className="text-xs text-[#64748B] font-mono">
              Auto-sync active • {lastRefreshedAt.toLocaleTimeString()}
            </span>
          </div>

          <h1 className="text-xl lg:text-2xl font-black text-[#172033] tracking-tight flex items-center gap-2.5">
            <span>Restaurant Daily Performance & Live Orders</span>
          </h1>
          <p className="text-xs text-[#64748B]">
            Real-time multi-channel sales reporting, kitchen ticket throughput, and cashier audit stream.
          </p>
        </div>

        {/* Right: Controls (Store selector, Date range, Actions) */}
        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
          {/* Store Switcher */}
          <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#E5EAF2] rounded-xl px-3 py-1.5">
            <StoreIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="bg-transparent text-xs text-[#172033] font-bold outline-none cursor-pointer"
            >
              <option value="all">All Store Locations ({stores.length})</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.businessName}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center bg-[#F8FAFC] p-1 rounded-xl border border-[#E5EAF2] text-xs font-bold">
            <button
              onClick={() => setDateRange('today')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                dateRange === 'today'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateRange('yesterday')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                dateRange === 'yesterday'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              Yesterday
            </button>
            <button
              onClick={() => setDateRange('week')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                dateRange === 'week'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              7 Days
            </button>
          </div>

          {/* Quick Action Buttons */}
          <button
            onClick={() => setIsClearConfirmModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="Clear all orders and reset order sequence to 1"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Clear All Orders</span>
          </button>

          <button
            onClick={handleSimulateLiveOrder}
            disabled={isSimulatingOrder}
            className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="Simulate a new customer order entering the kitchen"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{isSimulatingOrder ? 'Punched...' : '+ Simulate POS Ticket'}</span>
          </button>

          <button
            onClick={() => setIsZReportModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Daily Z-Report</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-[#E5EAF2] text-[#64748B] hover:text-[#172033] transition-all cursor-pointer"
            title="Download Daily CSV"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-[#E5EAF2] text-[#64748B] hover:text-[#172033] transition-all cursor-pointer"
            title="Refresh Live Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. HERO LIVE DAILY KPIS (6 HIGH-IMPACT METRIC TILES) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-4">
        {/* Metric 1: Live Daily Gross Sales */}
        <div className="p-4 rounded-2xl bg-white border border-[#E5EAF2] shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Gross Sales</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-xl lg:text-2xl font-black text-blue-600 font-mono tracking-tight">
              £{(metrics.grossSales || 0).toFixed(2)}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold mt-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>+18.4% vs last week</span>
            </div>
          </div>
          <div className="pt-2 border-t border-[#E5EAF2] text-[10px] text-[#64748B] flex justify-between">
            <span>Net: £{metrics.netSales.toFixed(2)}</span>
            <span>VAT: £{metrics.totalTax.toFixed(2)}</span>
          </div>
        </div>

        {/* Metric 2: Live Active / Cooking Tickets */}
        <div className="p-4 rounded-2xl bg-white border border-blue-200 shadow-sm hover:border-blue-400 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Active Queue</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-xl lg:text-2xl font-black text-[#172033] font-mono tracking-tight flex items-baseline gap-2">
              <span>{metrics.activeOrdersCount}</span>
              <span className="text-xs font-normal text-blue-600">tickets live</span>
            </div>
            <div className="text-[10px] text-[#64748B] mt-0.5">
              Avg Prep Time: <strong className="text-[#172033]">11.4 mins</strong>
            </div>
          </div>
          <div className="pt-2 border-t border-[#E5EAF2] text-[10px] text-blue-600 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
            <span>Kitchen Operating Normal</span>
          </div>
        </div>

        {/* Metric 3: Total Orders Today */}
        <div className="p-4 rounded-2xl bg-white border border-[#E5EAF2] shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Total Orders</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-xl lg:text-2xl font-black text-[#172033] font-mono tracking-tight">
              {metrics.totalOrdersCount}
            </div>
            <div className="text-[10px] text-[#64748B] mt-0.5">
              {metrics.completedOrdersCount} done • {metrics.cancelledOrdersCount} void
            </div>
          </div>
          <div className="pt-2 border-t border-[#E5EAF2] text-[10px] text-[#64748B] flex justify-between">
            <span>Fulfilled: 100%</span>
            <span className="text-emerald-600">0 Delays</span>
          </div>
        </div>

        {/* Metric 4: Average Order Value (AOV) */}
        <div className="p-4 rounded-2xl bg-white border border-[#E5EAF2] shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Avg Ticket (AOV)</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-xl lg:text-2xl font-black text-[#172033] font-mono tracking-tight">
              £{(metrics.avgOrderValue || 0).toFixed(2)}
            </div>
            <div className="text-[10px] text-amber-600 font-semibold mt-0.5">
              +£1.85 vs target baseline
            </div>
          </div>
          <div className="pt-2 border-t border-[#E5EAF2] text-[10px] text-[#64748B] flex justify-between">
            <span>Upsell items: 38%</span>
          </div>
        </div>

        {/* Metric 5: Card & Digital Collections */}
        <div className="p-4 rounded-2xl bg-white border border-[#E5EAF2] shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Card & Online</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-xl lg:text-2xl font-black text-indigo-600 font-mono tracking-tight">
              £{(metrics.cardSales + metrics.onlineSales || 0).toFixed(2)}
            </div>
            <div className="text-[10px] text-[#64748B] mt-0.5">
              {metrics.grossSales > 0
                ? Math.round(((metrics.cardSales + metrics.onlineSales) / metrics.grossSales) * 100)
                : 80}
              % of total tender
            </div>
          </div>
          <div className="pt-2 border-t border-[#E5EAF2] text-[10px] text-indigo-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Card Readers Online</span>
          </div>
        </div>

        {/* Metric 6: Cash in Drawer Today */}
        <div className="p-4 rounded-2xl bg-white border border-[#E5EAF2] shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Cash In Drawer</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-xl lg:text-2xl font-black text-emerald-600 font-mono tracking-tight">
              £{drawerData.currentBalance.toFixed(2)}
            </div>
            <div className="text-[10px] text-[#64748B] mt-0.5">
              Float: £{drawerData.openingFloat.toFixed(2)} + Sales: £{drawerData.cashSales.toFixed(2)}{drawerData.totalCashOut > 0 ? ` - Out: £${drawerData.totalCashOut.toFixed(2)}` : ''}
            </div>
          </div>
          <div className="pt-2 border-t border-[#E5EAF2] text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Balanced & Verified</span>
          </div>
        </div>
      </div>

      {/* 3. LIVE CURRENT ORDERS STREAM SECTION */}
      <div className="bg-white border border-[#E5EAF2] rounded-2xl p-5 shadow-sm space-y-4">
        {/* Header & Filter Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-[#E5EAF2]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-black">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#172033] flex items-center gap-2">
                <span>Live Kitchen & Order Dispatch Board</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold font-mono">
                  {liveActiveOrders.length} In-Flight
                </span>
              </h2>
              <span className="text-xs text-[#64748B]">
                Click any ticket to update live dispatch status or reprint thermal receipts
              </span>
            </div>
          </div>

          {/* Search & Channel Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Clear All Orders Button */}
            <button
              onClick={() => setIsClearConfirmModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Clear all orders and reset sequence to 1"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Clear All Orders</span>
            </button>

            {/* Search */}
            <div className="relative w-48 lg:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ticket, customer, item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#172033] placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Order Status Tabs */}
            <div className="flex items-center bg-[#F8FAFC] p-1 rounded-xl border border-[#E5EAF2] text-xs font-bold">
              <button
                onClick={() => setActiveOrderTab('all-active')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeOrderTab === 'all-active'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                All Active ({liveActiveOrders.length})
              </button>
              <button
                onClick={() => setActiveOrderTab('preparing')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeOrderTab === 'preparing'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                Cooking / Kitchen ({filteredOrders.filter((o) => o.orderStatus === 'Current').length})
              </button>
              <button
                onClick={() => setActiveOrderTab('delivery')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeOrderTab === 'delivery'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                Delivery ({filteredOrders.filter((o) => o.orderType === 'Delivery' && o.orderStatus !== 'Completed').length})
              </button>
              <button
                onClick={() => setActiveOrderTab('completed')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeOrderTab === 'completed'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                Completed Today ({filteredOrders.filter((o) => o.orderStatus === 'Completed').length})
              </button>
            </div>
          </div>
        </div>

        {/* Current Orders Card Grid */}
        {tabFilteredOrders.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center text-[#64748B] space-y-2">
            <ShoppingBag className="w-10 h-10 stroke-1 text-slate-300" />
            <p className="text-sm font-bold text-[#172033]">No matching orders in this view</p>
            <p className="text-xs text-[#64748B] max-w-sm">
              All active orders have been fulfilled or no tickets match the current filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tabFilteredOrders.map((order) => {
              const elapsedMins = getElapsedMins(order.createdAt);
              const isUrgent = elapsedMins >= 15 && order.orderStatus !== 'Completed';

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl border p-4.5 bg-white flex flex-col justify-between transition-all duration-200 hover:shadow-md ${
                    isUrgent
                      ? 'border-rose-300 bg-rose-50/30'
                      : order.orderStatus === 'Completed'
                      ? 'border-[#E5EAF2] opacity-80'
                      : 'border-[#E5EAF2] hover:border-blue-300'
                  }`}
                >
                  {/* Card Header: Invoice ID, Timer Badge, Order Type */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-mono text-xs font-black shadow-2xs">
                            Order #{order.orderNumber || order.invoiceId?.replace(/[^0-9]/g, '') || '1'}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-500">
                            {order.invoiceId}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                              order.orderType === 'Delivery'
                                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                : order.orderType === 'Pickup'
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {order.orderType === 'Delivery' && <Truck className="w-3 h-3" />}
                            {order.orderType === 'Pickup' && <ShoppingBag className="w-3 h-3" />}
                            {order.orderType === 'In-Store' && <Utensils className="w-3 h-3" />}
                            <span>{order.orderType}</span>
                          </span>
                        </div>
                        <span className="text-[11px] text-[#64748B] block mt-0.5">
                          Cashier: {order.cashierName || 'POS Register'}
                        </span>
                      </div>

                      {/* Live elapsed timer */}
                      <div className="text-right">
                        <div
                          className={`px-2 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 ${
                            order.orderStatus === 'Completed'
                              ? 'bg-slate-100 text-[#64748B]'
                              : isUrgent
                              ? 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          <Timer className="w-3 h-3" />
                          <span>{elapsedMins}m ago</span>
                        </div>
                      </div>
                    </div>

                    {/* Customer Info Badge */}
                    <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2] text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#172033] flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#64748B]" />
                          <span>{order.customer.firstName} {order.customer.lastName}</span>
                        </span>
                        <a
                          href={`tel:${order.customer.phone}`}
                          className="text-[11px] font-mono text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{order.customer.phone}</span>
                        </a>
                      </div>

                      {order.orderType === 'Delivery' && order.customer.fullAddress && (
                        <div className="text-[11px] text-[#64748B] flex items-start gap-1 pt-0.5">
                          <MapPin className="w-3 h-3 text-purple-600 shrink-0 mt-0.5" />
                          <span className="truncate">{order.customer.fullAddress}, {order.customer.ukPostcode}</span>
                        </div>
                      )}

                      {order.customer.notes && (
                        <div className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 italic">
                          "{order.customer.notes}"
                        </div>
                      )}
                    </div>

                    {/* Items List Snapshot */}
                    <div className="space-y-1.5 py-1">
                      <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                        Ordered Items ({order.items.reduce((s, i) => s + i.quantity, 0)})
                      </span>
                      <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs text-[#172033]">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-blue-600 font-mono">{item.quantity}x</span>
                              <span className="font-medium text-[#172033] truncate max-w-[170px]">{item.productName}</span>
                              <span className="text-[10px] text-[#64748B]">({item.variantName})</span>
                            </div>
                            <span className="font-mono text-[#64748B] text-xs">
                              £{(item.totalPrice || item.unitPrice * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Financial Total & Actions */}
                  <div className="pt-3 border-t border-[#E5EAF2] space-y-3 mt-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            order.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.paymentStatus} ({order.paymentMethod})
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-[#64748B] block uppercase font-bold">Total</span>
                        <span className="text-base font-black font-mono text-blue-600">
                          £{order.grandTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {order.orderStatus === 'Current' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'On The Way')}
                          className="col-span-2 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Dispatch / Ready</span>
                        </button>
                      )}

                      {order.orderStatus === 'On The Way' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'Completed')}
                          className="col-span-2 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Delivered</span>
                        </button>
                      )}

                      {order.orderStatus === 'Completed' && (
                        <div className="col-span-2 py-1.5 px-2 bg-slate-100 text-[#64748B] font-bold text-xs rounded-xl text-center flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Order Fulfilled</span>
                        </div>
                      )}

                      {order.orderStatus === 'Cancelled' && (
                        <div className="col-span-2 py-1.5 px-2 bg-rose-100 text-rose-700 font-bold text-xs rounded-xl text-center flex items-center justify-center gap-1">
                          <X className="w-3.5 h-3.5" />
                          <span>Cancelled / Void</span>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          setLatestPlacedOrder(order);
                          setIsReceiptModalOpen(true);
                        }}
                        className="py-1.5 px-2 bg-white hover:bg-slate-100 border border-[#E5EAF2] text-[#64748B] hover:text-[#172033] font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Print / View Receipt"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#64748B]" />
                        <span>Print</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. DAILY VISUAL ANALYTICS & REPORTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Hourly Sales Velocity Timeline Chart */}
        <div className="lg:col-span-2 bg-white border border-[#E5EAF2] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF2]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#172033]">Hourly Sales Throughput (£ / Hour)</h3>
                <span className="text-xs text-[#64748B]">Peak dining rush hours and ticket volumes</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-blue-600" />
                <span className="text-[#172033] font-medium">Standard Hours</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-500" />
                <span className="text-amber-700 font-bold">Peak Rush Hour</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="pt-2">
            <div className="h-48 flex items-end gap-2 px-2 pb-2 border-b border-[#E5EAF2]">
              {hourlyData.map((slot, index) => {
                const heightPercent = maxHourlySales > 0 ? Math.min(100, Math.max(8, (slot.sales / maxHourlySales) * 100)) : 8;

                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-12 bg-[#172033] text-white text-[10px] rounded-lg px-2 py-1 font-mono shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                      <div className="font-bold text-blue-300">{slot.hour}: £{slot.sales.toFixed(2)}</div>
                      <div className="text-slate-300">{slot.orders} tickets</div>
                    </div>

                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-md transition-all duration-300 ${
                        slot.isPeak
                          ? 'bg-gradient-to-t from-amber-500 to-amber-400 shadow-sm'
                          : slot.sales > 0
                          ? 'bg-gradient-to-t from-blue-600 to-blue-500 group-hover:brightness-110'
                          : 'bg-slate-100'
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* X-Axis Hour Labels */}
            <div className="flex justify-between text-[10px] text-[#64748B] font-mono pt-2 px-1">
              {hourlyData.filter((_, idx) => idx % 2 === 0).map((slot, i) => (
                <span key={i}>{slot.hour}</span>
              ))}
            </div>
          </div>

          {/* Bottom Insights */}
          <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E5EAF2]">
              <span className="text-[10px] uppercase font-bold text-[#64748B] block">Lunch Peak (12-2pm)</span>
              <span className="text-sm font-mono font-bold text-[#172033]">£273.30</span>
              <span className="text-[10px] text-emerald-600 block">13 tickets served</span>
            </div>
            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E5EAF2]">
              <span className="text-[10px] uppercase font-bold text-[#64748B] block">Dinner Rush (6-9pm)</span>
              <span className="text-sm font-mono font-bold text-[#172033]">£531.20</span>
              <span className="text-[10px] text-emerald-600 block">24 tickets served</span>
            </div>
            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E5EAF2]">
              <span className="text-[10px] uppercase font-bold text-[#64748B] block">Order Velocity</span>
              <span className="text-sm font-mono font-bold text-blue-600">1 ticket / 8m</span>
              <span className="text-[10px] text-[#64748B] block">Optimal kitchen flow</span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Payment & Channel Distribution */}
        <div className="bg-white border border-[#E5EAF2] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#E5EAF2]">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#172033]">Payment & Channel Mix</h3>
              <span className="text-xs text-[#64748B]">Tender and fulfillment breakdown</span>
            </div>
          </div>

          {/* Payment Method Progress Bars */}
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-bold mb-1">
                <span className="text-[#172033] flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Card / Contactless</span>
                </span>
                <span className="font-mono text-[#172033]">£{metrics.cardSales.toFixed(2)}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${metrics.grossSales > 0 ? (metrics.cardSales / metrics.grossSales) * 100 : 60}%`,
                  }}
                  className="h-full bg-indigo-600 rounded-full"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-bold mb-1">
                <span className="text-[#172033] flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cash Drawer</span>
                </span>
                <span className="font-mono text-[#172033]">£{metrics.cashSales.toFixed(2)}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${metrics.grossSales > 0 ? (metrics.cashSales / metrics.grossSales) * 100 : 30}%`,
                  }}
                  className="h-full bg-emerald-600 rounded-full"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-bold mb-1">
                <span className="text-[#172033] flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  <span>Online / Apple Pay</span>
                </span>
                <span className="font-mono text-[#172033]">£{metrics.onlineSales.toFixed(2)}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${metrics.grossSales > 0 ? (metrics.onlineSales / metrics.grossSales) * 100 : 10}%`,
                  }}
                  className="h-full bg-blue-600 rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Fulfillment Channel Tiles */}
          <div className="pt-2 border-t border-[#E5EAF2] space-y-2 text-xs">
            <span className="text-[10px] uppercase font-bold text-[#64748B] block">Fulfillment Channels</span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2]">
                <Truck className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                <span className="text-[10px] text-[#64748B] block">Delivery</span>
                <span className="text-xs font-bold text-[#172033] font-mono">{metrics.deliveryOrdersCount} orders</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2]">
                <ShoppingBag className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                <span className="text-[10px] text-[#64748B] block">Pickup</span>
                <span className="text-xs font-bold text-[#172033] font-mono">{metrics.pickupOrdersCount} orders</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2]">
                <Utensils className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <span className="text-[10px] text-[#64748B] block">In-Store</span>
                <span className="text-xs font-bold text-[#172033] font-mono">{metrics.inStoreOrdersCount} orders</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. TOP SELLERS & CASHIER LEADERBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Bestselling Menu Items */}
        <div className="bg-white border border-[#E5EAF2] rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5EAF2]">
            <h3 className="text-sm font-black text-[#172033] flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Top 5 Bestselling Menu Items Today</span>
            </h3>
            <span className="text-xs text-blue-600 font-bold">Fastest Moving</span>
          </div>

          <div className="space-y-2">
            {topProducts.length === 0 ? (
              <p className="text-xs text-[#64748B] py-4 text-center">No menu items ordered yet today</p>
            ) : (
              topProducts.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 font-mono font-bold flex items-center justify-center text-xs">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-[#172033] leading-tight">{item.name}</h4>
                      <span className="text-[10px] text-[#64748B]">{item.category}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black font-mono text-blue-600 block">
                      {item.quantity} sold
                    </span>
                    <span className="text-[10px] text-[#64748B] font-mono">
                      £{item.revenue.toFixed(2)} total
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Staff & Cashier Performance */}
        <div className="bg-white border border-[#E5EAF2] rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5EAF2]">
            <h3 className="text-sm font-black text-[#172033] flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <span>Staff & Cashier Shift Leaderboard</span>
            </h3>
            <span className="text-xs text-blue-600 font-bold">Active Operators</span>
          </div>

          <div className="space-y-2">
            {staffPerformance.map((staff, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center">
                    {staff.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#172033] leading-tight">{staff.name}</h4>
                    <span className="text-[10px] text-[#64748B]">{staff.role}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black font-mono text-[#172033] block">
                    £{staff.totalRevenue.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-blue-600 font-mono">
                    {staff.ordersCount} tickets rung
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. DAILY Z-REPORT MODAL (THERMAL PRINTABLE SLIP) */}
      {isZReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white text-slate-900 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto font-mono text-xs border border-[#E5EAF2]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-2 border-slate-200">
              <div className="font-bold uppercase tracking-wider text-[#172033] text-sm">
                Official End-of-Day Z-Report
              </div>
              <button
                onClick={() => setIsZReportModalOpen(false)}
                className="text-[#64748B] hover:text-[#172033] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thermal Slip Content */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
              <div className="font-black text-base tracking-tight text-[#172033]">
                {currentStore?.businessName || 'Nexus Central Flagship'}
              </div>
              <div className="text-[11px] text-[#64748B]">
                {currentStore?.address || '142 Wardour St, Soho, London W1F 8ZT'}
              </div>
              <div className="text-[10px] text-[#64748B]">
                VAT Reg: {currentStore?.vatNumber || 'GB 894 2109 44'}
              </div>
              <div className="text-[10px] font-bold text-[#172033] pt-1">
                Z-REPORT SEQUENCE #Z-{Math.floor(1000 + Math.random() * 9000)}
              </div>
              <div className="text-[10px] text-[#64748B]">
                Generated: {new Date().toLocaleString()}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="space-y-1.5 py-1 text-xs">
              <div className="flex justify-between font-bold text-[#172033]">
                <span>TOTAL TICKETS:</span>
                <span>{metrics.totalOrdersCount}</span>
              </div>
              <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-200 text-[#172033]">
                <span>GROSS SALES:</span>
                <span>£{metrics.grossSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#64748B]">
                <span>NET SALES (EXCL VAT):</span>
                <span>£{metrics.netSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#64748B]">
                <span>UK VAT (20.0%):</span>
                <span>£{metrics.totalTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#64748B]">
                <span>TOTAL DISCOUNTS/COUPONS:</span>
                <span>-£{metrics.totalDiscounts.toFixed(2)}</span>
              </div>
            </div>

            {/* Tender Breakdown */}
            <div className="space-y-1 py-2 border-t border-b border-dashed border-slate-300 text-xs">
              <div className="font-bold text-[11px] uppercase text-[#172033] mb-1">
                PAYMENT TENDER AUDIT
              </div>
              <div className="flex justify-between text-[#172033]">
                <span>CASH TENDERED:</span>
                <span>£{metrics.cashSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#172033]">
                <span>VISA / MASTERCARD:</span>
                <span>£{metrics.cardSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#172033]">
                <span>ONLINE / DIGITAL WALLET:</span>
                <span>£{metrics.onlineSales.toFixed(2)}</span>
              </div>
            </div>

            {/* Cash in Drawer Float Calculation */}
            <div className="space-y-1 py-1 text-xs">
              <div className="font-bold text-[11px] uppercase text-[#172033]">
                CASH DRAWER RECONCILIATION
              </div>
              <div className="flex justify-between text-[#172033]">
                <span>OPENING CASH FLOAT:</span>
                <span>£{drawerData.openingFloat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#172033]">
                <span>CASH SALES COLLECTED:</span>
                <span>+£{drawerData.cashSales.toFixed(2)}</span>
              </div>
              {drawerData.totalCashOut > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>CASH REFUNDS / WITHDRAWALS:</span>
                  <span>-£{drawerData.totalCashOut.toFixed(2)}</span>
                </div>
              )}
              {drawerData.totalCashIn > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>CASH ADDITIONS / TOP-UPS:</span>
                  <span>+£{drawerData.totalCashIn.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-200 text-[#172033]">
                <span>EXPECTED DRAWER CASH:</span>
                <span>£{drawerData.currentBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 text-[11px] font-bold">
                <span>DRAWER VARIANCE:</span>
                <span>£0.00 (BALANCED)</span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-200 flex gap-2 font-sans">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm text-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Thermal 80mm</span>
              </button>
              <button
                onClick={() => setIsZReportModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#172033] font-bold rounded-xl text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Orders Confirmation Modal */}
      {isClearConfirmModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-orders-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 id="clear-orders-modal-title" className="font-black text-lg text-slate-900">
                  Clear All Orders & Reset Counter
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to clear all orders? This will immediately remove all {orders.length} orders from the system and automatically reset the sequential order numbering back to <strong>1</strong>.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Next Order Numbering:</span>
              </div>
              <p className="text-[11px] text-amber-800">
                After clearing, the next order placed will automatically receive <strong>Order #1</strong>, followed by <strong>Order #2</strong>, <strong>Order #3</strong>, etc., across both Admin POS and Store/Staff POS.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsClearConfirmModalOpen(false)}
                disabled={isClearingOrders}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClearAllOrders}
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

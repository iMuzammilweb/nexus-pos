import React, { useState, useMemo, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Clock,
  Truck,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Printer,
  ChevronRight,
  TrendingUp,
  Flame,
  ArrowRight,
  Store as StoreIcon,
  Phone,
  MapPin,
  XCircle,
  Timer,
  Receipt,
  Eye,
  Ban,
  CheckCircle2,
  ListOrdered,
  Trash2,
  Sparkles,
  Pencil,
  History,
} from 'lucide-react';
import { useNexus } from '../../context/NexusContext';
import { Order, OrderStatus, OrderType } from '../../types';
import { OrderLiveTimer } from '../common/OrderLiveTimer';
import { OrderDetailsDrawer } from './OrderDetailsDrawer';
import { OrderCancellationModal } from './OrderCancellationModal';
import { AutoPrintStatusBanner } from './AutoPrintStatusBanner';

export const PosOrderManagement: React.FC = () => {
  const {
    orders,
    currentStore,
    updateOrderStatus,
    cancelOrder,
    acceptOrder,
    acceptAllOrders,
    unacceptedOrders,
    printAlert,
    retryPrintOrder,
    dismissPrintAlert,
    setLatestPlacedOrder,
    setIsReceiptModalOpen,
    clearAllOrders,
    currentUser,
    startEditingOrder,
    orderHistory = [],
    setIsOrderHistoryModalOpen,
  } = useNexus();

  const [activeStatusTab, setActiveStatusTab] = useState<OrderStatus | 'Cancelled' | 'History'>('Current');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<OrderType | 'All'>('All');
  
  // State for right-side slide-over drawer and cancellation modal
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [isClearAllOrdersModalOpen, setIsClearAllOrdersModalOpen] = useState(false);
  const [isClearingOrders, setIsClearingOrders] = useState(false);

  const handleClearAllOrders = async () => {
    setIsClearingOrders(true);
    try {
      await clearAllOrders();
    } finally {
      setIsClearingOrders(false);
      setIsClearAllOrdersModalOpen(false);
      setSelectedOrderDetails(null);
    }
  };

  // Store-specific active orders
  const storeOrders = orders.filter((o) => !currentStore?.id || o.storeId === currentStore.id);

  // Store-specific permanent order history merged with active orders
  const storeHistoricalOrders = useMemo(() => {
    const map = new Map<string, Order>();
    orderHistory.forEach((o) => {
      if (!currentStore?.id || o.storeId === currentStore.id) {
        map.set(o.id, o);
      }
    });
    storeOrders.forEach((o) => {
      const existing = map.get(o.id);
      map.set(o.id, existing ? { ...existing, ...o } : o);
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [orderHistory, storeOrders, currentStore?.id]);

  // Filter by tab status & query
  const tabOrders = (activeStatusTab === 'History' ? storeHistoricalOrders : storeOrders).filter((o) => {
    if (activeStatusTab !== 'History' && o.orderStatus !== activeStatusTab) return false;
    if (filterType !== 'All' && o.orderType !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const orderNumStr = o.orderNumber ? String(o.orderNumber).toLowerCase() : '';
      return (
        o.invoiceId.toLowerCase().includes(q) ||
        orderNumStr.includes(q) ||
        o.customer.firstName.toLowerCase().includes(q) ||
        o.customer.lastName.toLowerCase().includes(q) ||
        o.customer.phone.includes(q) ||
        o.items.some((i) => i.productName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Tab counts
  const currentCount = storeOrders.filter((o) => o.orderStatus === 'Current').length;
  const onTheWayCount = storeOrders.filter((o) => o.orderStatus === 'On The Way').length;
  const completedCount = storeOrders.filter((o) => o.orderStatus === 'Completed').length;
  const cancelledCount = storeOrders.filter((o) => o.orderStatus === 'Cancelled').length;
  const historyCount = storeHistoricalOrders.length;

  // Daily statistics for left panel
  const totalCompletedRevenue = storeOrders
    .filter((o) => o.orderStatus === 'Completed')
    .reduce((sum, o) => sum + o.grandTotal, 0);

  const handlePrintReceipt = (order: Order) => {
    setLatestPlacedOrder(order);
    setIsReceiptModalOpen(true);
  };

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

  const handleConfirmCancelOrder = (orderId: string, reason: string) => {
    cancelOrder(orderId, reason);
  };

  // Keep the open drawer showing the latest version of its order (accept / advance / cancel)
  const selectedOrderId = selectedOrderDetails?.id;
  useEffect(() => {
    if (!selectedOrderId) return;
    const latest = orders.find((o) => o.id === selectedOrderId);
    if (latest) setSelectedOrderDetails((prev) => (prev && prev !== latest ? latest : prev));
  }, [orders, selectedOrderId]);

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-[#F8FAFC]">
      {/* LEFT SECTION (50%): High impact restaurant visual showcase + Live Operations Pulse */}
      <div className="w-full lg:w-1/2 p-4 lg:p-6 flex flex-col justify-between overflow-y-auto border-r border-[#E5EAF2] bg-[#F8FAFC] relative">
        <div className="space-y-4">
          {/* Main Restaurant Brand Showcase Image */}
          <div className="relative h-56 lg:h-60 w-full rounded-2xl overflow-hidden shadow-sm border border-[#E5EAF2] group">
            <img
              src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&auto=format&fit=crop&q=80"
              alt="Nexus Kitchen Operations"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent" />

            {/* Live Operational Status Tag */}
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-[#E5EAF2] text-blue-600 text-xs font-bold shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <span>LIVE KITCHEN DISPATCH</span>
            </div>

            <div className="absolute bottom-4 left-4 right-4">
              <span className="text-xs font-mono font-bold text-blue-300 uppercase tracking-wider">
                {currentStore.businessName}
              </span>
              <h2 className="text-xl font-bold text-white mt-0.5">
                Real-Time Order & Kitchen Station
              </h2>
              <p className="text-xs text-slate-200 line-clamp-2 mt-1">
                Active tickets sync instantly across counter POS, kitchen prep displays, and delivery couriers.
              </p>
            </div>
          </div>

          {/* Quick Metrics Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-white border border-[#E5EAF2] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748B]">In Preparation</span>
                <Flame className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-[#172033] font-mono">{currentCount}</span>
                <span className="text-[10px] text-[#64748B] block">Current active tickets</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-[#E5EAF2] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748B]">On The Way</span>
                <Truck className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-[#172033] font-mono">{onTheWayCount}</span>
                <span className="text-[10px] text-[#64748B] block">Out for delivery / pickup</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-[#E5EAF2] shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748B]">Today Fulfilled</span>
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-blue-600 font-mono">
                  £{(totalCompletedRevenue || 0).toFixed(2)}
                </span>
                <span className="text-[10px] text-[#64748B] block">{completedCount} orders completed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Informative footer tip */}
        <div className="mt-4 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Click any order card to view the comprehensive <strong>Order Details Panel</strong> with item modifications, customer notes, and real-time status controls.</span>
          </div>
        </div>
      </div>

      {/* RIGHT SECTION (50%): Order Management Center with 4 Status Tabs */}
      <div className="w-full lg:w-1/2 flex flex-col h-full bg-[#F8FAFC]">
        {/* Top 5 Status Tabs */}
        <div className="p-4 bg-white border-b border-[#E5EAF2] space-y-3 select-none shadow-xs">
          <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
            <button
              onClick={() => setActiveStatusTab('Current')}
              className={`py-2 px-1.5 sm:px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                activeStatusTab === 'Current'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white hover:bg-[#EFF6FF] text-[#64748B] hover:text-blue-600 border border-[#E5EAF2]'
              }`}
            >
              <span className="truncate">Current</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeStatusTab === 'Current' ? 'bg-white text-blue-600' : 'bg-slate-100 text-[#64748B]'
                }`}
              >
                {currentCount}
              </span>
            </button>

            <button
              onClick={() => setActiveStatusTab('On The Way')}
              className={`py-2 px-1.5 sm:px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                activeStatusTab === 'On The Way'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white hover:bg-[#EFF6FF] text-[#64748B] hover:text-blue-600 border border-[#E5EAF2]'
              }`}
            >
              <span className="truncate">On The Way</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeStatusTab === 'On The Way' ? 'bg-white text-blue-600' : 'bg-slate-100 text-[#64748B]'
                }`}
              >
                {onTheWayCount}
              </span>
            </button>

            <button
              onClick={() => setActiveStatusTab('Completed')}
              className={`py-2 px-1.5 sm:px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                activeStatusTab === 'Completed'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white hover:bg-[#EFF6FF] text-[#64748B] hover:text-blue-600 border border-[#E5EAF2]'
              }`}
            >
              <span className="truncate">Completed</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeStatusTab === 'Completed' ? 'bg-white text-blue-600' : 'bg-slate-100 text-[#64748B]'
                }`}
              >
                {completedCount}
              </span>
            </button>

            <button
              onClick={() => setActiveStatusTab('Cancelled')}
              className={`py-2 px-1.5 sm:px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                activeStatusTab === 'Cancelled'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-white hover:bg-red-50 text-[#64748B] hover:text-red-600 border border-[#E5EAF2]'
              }`}
            >
              <span className="truncate">Cancelled</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeStatusTab === 'Cancelled' ? 'bg-white text-red-600' : 'bg-slate-100 text-[#64748B]'
                }`}
              >
                {cancelledCount}
              </span>
            </button>

            <button
              onClick={() => setActiveStatusTab('History')}
              className={`py-2 px-1.5 sm:px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                activeStatusTab === 'History'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white hover:bg-[#EFF6FF] text-[#64748B] hover:text-blue-600 border border-[#E5EAF2]'
              }`}
              title="Permanent complete order history"
            >
              <History className={`w-3 h-3 ${activeStatusTab === 'History' ? 'text-white' : 'text-blue-600'}`} />
              <span className="truncate">History</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeStatusTab === 'History' ? 'bg-white text-blue-600' : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                {historyCount}
              </span>
            </button>
          </div>

          {/* Search & Order Type Filter Toolbar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search orders by #, invoice, customer, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] text-xs focus:outline-none focus:border-blue-600 placeholder:text-[#64748B] font-medium"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] text-xs font-semibold focus:outline-none focus:border-blue-600"
            >
              <option value="All">All Types</option>
              <option value="Delivery">Delivery</option>
              <option value="Pickup">Pickup</option>
              <option value="In-Store">In-Store</option>
            </select>

            <button
              onClick={() => setIsOrderHistoryModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0"
              title="Open full permanent order history dialog"
            >
              <History className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Order History</span>
            </button>

            {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN') && (
              <button
                onClick={() => setIsClearAllOrdersModalOpen(true)}
                className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0"
                title="Clear all orders and reset order sequence to 1"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Clear All Orders</span>
              </button>
            )}
          </div>
        </div>

        {/* Order Cards List Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
          {/* Auto Print Status Banner */}
          <AutoPrintStatusBanner
            alert={printAlert}
            onRetry={retryPrintOrder}
            onDismiss={dismissPrintAlert}
          />

          {/* Top Unaccepted Orders Alert Bar if any */}
          {unacceptedOrders.length > 0 && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white flex items-center justify-between shadow-md animate-pulse">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-white animate-ping" />
                <div>
                  <span className="font-black text-xs uppercase tracking-wider block">
                    {unacceptedOrders.length} New Unaccepted Order{unacceptedOrders.length > 1 ? 's' : ''} Received!
                  </span>
                  <span className="text-[11px] text-red-100 block">
                    Audible continuous alert is playing. Click Accept on order ticket to silence.
                  </span>
                </div>
              </div>
              <button
                onClick={acceptAllOrders}
                className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-red-50 text-red-700 font-extrabold text-xs shadow transition-all cursor-pointer"
              >
                Accept All ({unacceptedOrders.length})
              </button>
            </div>
          )}

          {tabOrders.length === 0 ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 bg-white rounded-xl border border-[#E5EAF2] shadow-sm">
              <ShoppingBag className="w-12 h-12 text-[#64748B] mb-3 stroke-[1.5]" />
              <h3 className="text-base font-bold text-[#172033]">
                There are no {activeStatusTab.toLowerCase()} orders
              </h3>
              <p className="text-xs text-[#64748B] mt-1 max-w-xs">
                {activeStatusTab === 'Current'
                  ? 'New orders placed from the POS Menu will appear immediately in the Current queue.'
                  : `Orders marked as ${activeStatusTab} will appear in this list.`}
              </p>
            </div>
          ) : (
            tabOrders.map((order) => {
              const isUnaccepted =
                order.isAccepted === false &&
                order.orderStatus !== 'Cancelled' &&
                order.orderStatus !== 'Completed';

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrderDetails(order)}
                  className={`p-4 rounded-xl bg-white hover:bg-blue-50/20 border shadow-sm transition-all flex flex-col gap-3 group cursor-pointer ${
                    isUnaccepted
                      ? 'border-red-400 ring-2 ring-red-200/80 bg-red-50/20'
                      : order.orderStatus === 'Cancelled'
                      ? 'border-red-200 bg-red-50/10'
                      : 'border-[#E5EAF2] hover:border-blue-300'
                  }`}
                >
                  {/* Unaccepted Attention Badge */}
                  {isUnaccepted && (
                    <div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                        <span>⚠️ NEW ORDER — AUDIBLE ALERT ACTIVE</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          acceptOrder(order.id);
                        }}
                        className="px-2.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] transition-colors cursor-pointer"
                      >
                        Accept Now
                      </button>
                    </div>
                  )}

                  {/* Card Header: Sequential Order #, Invoice ID, Customer, Order Type */}
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#E5EAF2]">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-mono font-black text-xs shadow-2xs">
                          Order #{order.orderNumber || order.invoiceId?.replace(/[^0-9]/g, '') || '1'}
                        </span>
                        <span className="font-mono font-bold text-xs text-slate-500">
                          {order.invoiceId}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            order.orderType === 'Delivery'
                              ? 'bg-blue-50 text-blue-600 border border-blue-200'
                              : order.orderType === 'Pickup'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {order.orderType}
                        </span>
                      </div>
                      <span className="font-bold text-sm text-[#172033] mt-1">
                        {order.customer.firstName || 'Walk-In'} {order.customer.lastName || ''}
                      </span>
                      {(order.orderSentBy || order.sentByStaff || order.source === 'STAFF POS' || order.orderSource === 'STAFF POS') && (
                        <div className="flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          <span>Order Sent By: <strong className="font-extrabold text-blue-900">{order.orderSentBy || order.sentByStaff || order.staffName || order.cashierName || 'Staff Operator'}</strong></span>
                        </div>
                      )}
                      {order.customer.phone && (
                        <span className="text-[11px] text-[#64748B] font-mono flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-[#64748B]" />
                          {order.customer.phone}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="font-mono font-extrabold text-base text-blue-600">
                        £{(order.grandTotal || 0).toFixed(2)}
                      </span>
                      <div className="mt-1">
                        <OrderLiveTimer order={order} compact />
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-bold border border-blue-100 mt-1">
                        {order.paymentStatus} ({order.paymentMethod})
                      </span>
                    </div>
                  </div>

                  {/* Live Timer Expanded */}
                  <div className="pt-1">
                    <OrderLiveTimer order={order} />
                  </div>

                  {/* Delivery Address & Zone info if applicable */}
                  {order.orderType === 'Delivery' && (
                    <div className="text-xs text-[#172033] bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E5EAF2] space-y-1">
                      <div className="flex items-start gap-1.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span className="break-words">
                          {order.customer.fullAddress || `${order.customer.street || ''} ${order.customer.city || ''}`}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200 text-[11px]">
                        <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {order.customer.ukPostcode || 'UK'}
                        </span>
                        {(order.deliveryZone || order.customer.deliveryZone) && (
                          <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            Zone: {order.deliveryZone || order.customer.deliveryZone}
                          </span>
                        )}
                        <span className="font-bold text-slate-700">
                          Delivery Fee: <strong className="text-blue-700 font-mono">£{(order.deliveryFee ?? 0).toFixed(2)}</strong>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* In-Store Table ref if applicable */}
                  {order.orderType === 'In-Store' && order.customer.tableReference && (
                    <div className="text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 font-semibold">
                      Ref: {order.customer.tableReference}
                    </div>
                  )}

                  {/* Cancellation Reason if cancelled */}
                  {order.orderStatus === 'Cancelled' && (
                    <div className="text-xs text-red-800 bg-red-50 p-2 rounded-lg border border-red-200">
                      <strong>Cancelled:</strong> {order.cancellationReason || 'Cancelled by staff'}
                    </div>
                  )}

                  {/* Order Line Items summary with modifications */}
                  <div className="space-y-1 py-1">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="text-xs text-[#172033] flex flex-col">
                        <div className="flex justify-between font-medium">
                          <span>
                            <b className="text-[#172033] font-bold">{it.quantity}x</b> {it.productName}{' '}
                            {it.variantName || it.variantSize ? `(${it.variantName || it.variantSize})` : ''}
                          </span>
                          <span className="font-mono text-[#64748B]">
                            £{(it.totalPrice || it.unitPrice * it.quantity).toFixed(2)}
                          </span>
                        </div>
                        {/* Standard modifiers */}
                        {it.selectedModifiers && it.selectedModifiers.length > 0 && (
                          <div className="text-[10px] text-[#64748B] pl-4">
                            + {it.selectedModifiers.map((m) => m.name).join(', ')}
                          </div>
                        )}
                        {/* Custom modifications with individual prices */}
                        {it.modifications && it.modifications.length > 0 && (
                          <div className="text-[10px] text-blue-700 pl-4 font-medium">
                            {it.modifications.map((m, mi) => (
                              <span key={mi} className="mr-2">
                                • {m.name} ({m.price > 0 ? `+£${m.price.toFixed(2)}` : 'Free'})
                              </span>
                            ))}
                          </div>
                        )}
                        {/* Kitchen Note / Special Instructions */}
                        {(it.notes || it.specialInstructions) && (
                          <div className="pl-4 mt-0.5">
                            <span className="inline-flex items-start gap-1 text-[10px] text-amber-900 bg-amber-50/90 rounded px-1.5 py-0.5 border border-amber-200/90 italic font-medium leading-tight">
                              <b className="font-bold text-amber-800 not-italic uppercase text-[9px] tracking-wide">Note:</b>
                              "{it.notes || it.specialInstructions}"
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div
                    className="pt-2.5 border-t border-[#E5EAF2] flex items-center justify-between gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handlePrintReceipt(order)}
                        className="p-1.5 rounded-lg bg-white hover:bg-[#EFF6FF] text-[#64748B] hover:text-blue-600 border border-[#E5EAF2] transition-colors cursor-pointer shadow-xs"
                        title="Print / View Thermal POS Receipt"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSelectedOrderDetails(order)}
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer shadow-xs flex items-center gap-1 text-xs font-bold px-2"
                        title="Inspect Order Breakdown"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>
                      <button
                        onClick={() => startEditingOrder(order)}
                        className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer shadow-xs flex items-center gap-1 text-xs font-bold px-2.5"
                        title="Edit order & add more items"
                      >
                        <Pencil className="w-3.5 h-3.5 text-amber-600" />
                        <span>Edit</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {order.orderStatus !== 'Cancelled' && (
                        <button
                          onClick={() => setOrderToCancel(order)}
                          className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs border border-red-200 transition-colors cursor-pointer"
                          title="Cancel order"
                        >
                          Cancel
                        </button>
                      )}

                      {isUnaccepted ? (
                        <button
                          onClick={() => acceptOrder(order.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-98"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Accept Order</span>
                        </button>
                      ) : (
                        <>
                          {order.orderStatus === 'Current' && (
                            <button
                              onClick={() => handleAdvanceStatus(order)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-98"
                            >
                              <span>{order.orderType === 'Delivery' ? 'Move to On The Way' : 'Mark Completed'}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {order.orderStatus === 'On The Way' && (
                            <button
                              onClick={() => handleAdvanceStatus(order)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-98"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Mark Completed</span>
                            </button>
                          )}

                          {order.orderStatus === 'Completed' && (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Completed</span>
                            </span>
                          )}

                          {order.orderStatus === 'Cancelled' && (
                            <span className="text-[11px] font-bold text-red-700 bg-red-50 px-2 py-1 rounded-md border border-red-200 flex items-center gap-1">
                              <Ban className="w-3.5 h-3.5" />
                              <span>Cancelled</span>
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right-Side Order Details Slide-Over Panel */}
      {selectedOrderDetails && (
        <OrderDetailsDrawer
          order={selectedOrderDetails}
          onClose={() => setSelectedOrderDetails(null)}
          onAdvanceStatus={handleAdvanceStatus}
          onPrintReceipt={handlePrintReceipt}
          onOpenCancelModal={(ord) => setOrderToCancel(ord)}
          onAcceptOrder={acceptOrder}
        />
      )}

      {/* Order Cancellation Confirmation Modal */}
      {orderToCancel && (
        <OrderCancellationModal
          isOpen={!!orderToCancel}
          order={orderToCancel}
          onClose={() => setOrderToCancel(null)}
          onConfirmCancel={handleConfirmCancelOrder}
        />
      )}

      {/* Clear All Orders Confirmation Modal */}
      {isClearAllOrdersModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-orders-pos-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 id="clear-orders-pos-modal-title" className="font-black text-lg text-slate-900">
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
                After clearing, the next order created will automatically receive <strong>Order #1</strong>, followed by <strong>Order #2</strong>, <strong>Order #3</strong>, etc., across both Admin POS and Store/Staff POS.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsClearAllOrdersModalOpen(false)}
                disabled={isClearingOrders}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllOrders}
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

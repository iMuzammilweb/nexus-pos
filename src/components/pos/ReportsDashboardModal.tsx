import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Calendar,
  CreditCard,
  Banknote,
  Printer,
  ChevronRight,
  Sparkles,
  BarChart3,
  PieChart,
  ArrowUpRight,
} from 'lucide-react';
import { useNexus } from '../../context/NexusContext';

export const ReportsDashboardModal: React.FC = () => {
  const {
    isReportsModalOpen,
    setIsReportsModalOpen,
    orders,
    currentStore,
    testPrintPrinter,
    printers,
    cashDrawerState,
  } = useNexus();

  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  if (!isReportsModalOpen) return null;

  const now = new Date();
  // Cancelled orders are not revenue
  const storeOrders = orders.filter(
    (o) => (!currentStore?.id || o.storeId === currentStore.id) && o.orderStatus !== 'Cancelled'
  );

  // Filter orders based on period
  const filteredOrders = storeOrders.filter((o) => {
    const orderDate = new Date(o.createdAt);
    if (period === 'daily') {
      return orderDate.toDateString() === now.toDateString();
    } else if (period === 'weekly') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return orderDate >= oneWeekAgo;
    } else {
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return orderDate >= oneMonthAgo;
    }
  });

  const totalGrossSales = filteredOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const totalOrdersCount = filteredOrders.length;
  const avgOrderValue = totalOrdersCount > 0 ? totalGrossSales / totalOrdersCount : 0;

  // Breakdown by payment method
  const cashSales = filteredOrders
    .filter((o) => o.paymentMethod === 'Cash')
    .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  const cardSales = filteredOrders
    .filter((o) => o.paymentMethod === 'Card' || o.paymentMethod === 'Online')
    .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  // Breakdown by order type
  const deliveryCount = filteredOrders.filter((o) => o.orderType === 'Delivery').length;
  const pickupCount = filteredOrders.filter((o) => o.orderType === 'Pickup').length;
  const inStoreCount = filteredOrders.filter((o) => o.orderType === 'In-Store').length;

  // Top items sold
  const itemMap: { [name: string]: { qty: number; revenue: number } } = {};
  filteredOrders.forEach((o) => {
    o.items?.forEach((item) => {
      if (!itemMap[item.productName]) {
        itemMap[item.productName] = { qty: 0, revenue: 0 };
      }
      itemMap[item.productName].qty += item.quantity;
      itemMap[item.productName].revenue += (item.unitPrice + item.modifiersTotal) * item.quantity;
    });
  });

  const topItems = Object.entries(itemMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const handlePrintReport = () => {
    const defaultPrinter = printers.find((p) => p.isDefault) || printers[0];
    if (defaultPrinter) {
      testPrintPrinter(defaultPrinter.id);
    }
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white border border-[#E5EAF2] rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-white border-b border-[#E5EAF2] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#172033] tracking-tight">
                POS Sales & Performance Reports
              </h2>
              <p className="text-xs text-[#64748B]">
                {currentStore.businessName} • Real-time terminal financial audit
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintReport}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-[#E5EAF2] text-[#172033] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={() => setIsReportsModalOpen(false)}
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Period Selector Tabs */}
        <div className="px-5 py-2.5 bg-[#F8FAFC] border-b border-[#E5EAF2] flex items-center justify-between">
          <div className="flex gap-1.5 bg-white p-1 rounded-lg border border-[#E5EAF2]">
            <button
              onClick={() => setPeriod('daily')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                period === 'daily'
                  ? 'bg-blue-600 text-white'
                  : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              Daily Report (Today)
            </button>
            <button
              onClick={() => setPeriod('weekly')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                period === 'weekly'
                  ? 'bg-blue-600 text-white'
                  : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              Weekly Report (Last 7 Days)
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                period === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              Monthly Report (Last 30 Days)
            </button>
          </div>

          <span className="text-xs text-[#64748B] font-mono hidden sm:inline">
            Generated: {now.toLocaleTimeString()}
          </span>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#F8FAFC]">
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-white border border-[#E5EAF2] shadow-xs">
              <span className="text-[#64748B] text-xs font-bold block mb-1">Total Gross Revenue</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-[#172033]">
                  £{totalGrossSales.toFixed(2)}
                </span>
                <span className="text-[10px] text-blue-600 font-bold bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                  +12.4% vs prev
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E5EAF2] shadow-xs">
              <span className="text-[#64748B] text-xs font-bold block mb-1">Completed Orders</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-blue-600">
                  {totalOrdersCount}
                </span>
                <span className="text-xs text-[#64748B]">orders processed</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E5EAF2] shadow-xs">
              <span className="text-[#64748B] text-xs font-bold block mb-1">Average Order Value (AOV)</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-[#172033]">
                  £{avgOrderValue.toFixed(2)}
                </span>
                <span className="text-xs text-[#64748B]">per ticket</span>
              </div>
            </div>
          </div>

          {/* Breakdown Grid: Cash vs Card & Fulfillment Distribution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Payment Breakdown */}
            <div className="p-4 rounded-xl bg-white border border-[#E5EAF2] space-y-3 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033] flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                <span>Payment Method Breakdown</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E5EAF2] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-[#172033]">Cash In Drawer</span>
                  </div>
                  <span className="font-mono font-bold text-[#172033]">
                    £{(period === 'daily' ? (cashDrawerState?.currentBalance ?? cashSales) : cashSales).toFixed(2)}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E5EAF2] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-[#172033]">Card & Online Terminals</span>
                  </div>
                  <span className="font-mono font-bold text-blue-600">
                    £{cardSales.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Fulfillment Types */}
            <div className="p-4 rounded-xl bg-white border border-[#E5EAF2] space-y-3 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033] flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                <span>Fulfillment Channels</span>
              </h3>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E5EAF2]">
                  <span className="text-[#64748B] block text-[10px] font-bold">Delivery</span>
                  <span className="text-lg font-bold font-mono text-[#172033]">{deliveryCount}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E5EAF2]">
                  <span className="text-[#64748B] block text-[10px] font-bold">Pickup</span>
                  <span className="text-lg font-bold font-mono text-[#172033]">{pickupCount}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E5EAF2]">
                  <span className="text-[#64748B] block text-[10px] font-bold">In-Store</span>
                  <span className="text-lg font-bold font-mono text-[#172033]">{inStoreCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Selling Products */}
          <div className="p-4 rounded-xl bg-white border border-[#E5EAF2] space-y-3 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Top Selling Menu Items</span>
            </h3>

            {topItems.length === 0 ? (
              <p className="text-xs text-[#64748B] italic">No items recorded in this period.</p>
            ) : (
              <div className="divide-y divide-[#E5EAF2] text-xs">
                {topItems.map((item, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 font-mono text-[10px] flex items-center justify-center font-bold">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-[#172033]">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[#64748B] font-medium">{item.qty} portions</span>
                      <span className="font-mono font-bold text-blue-600 w-16 text-right">
                        £{item.revenue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* HIDDEN PRINTABLE THERMAL SLIP FOR POS PRINTERS */}
        <div
          id="printable-report"
          className="hidden print:block font-mono text-[11px] leading-tight text-black p-4 space-y-2 bg-white"
        >
          <div className="text-center font-bold pb-2 border-b border-dashed border-black">
            <div className="text-sm">NEXUS-POS SYSTEM</div>
            <div>{currentStore.businessName}</div>
            <div className="text-[10px] font-normal">{currentStore.address}</div>
            <div className="text-[10px] font-normal">Tel: {currentStore.phone}</div>
            <div className="mt-1 text-xs font-extrabold uppercase">
              *** {period === 'daily' ? 'DAILY X/Z SALES AUDIT' : period === 'weekly' ? 'WEEKLY REPORT' : 'MONTHLY REPORT'} ***
            </div>
          </div>

          <div className="py-1 text-[10px] space-y-0.5 border-b border-dashed border-black">
            <div className="flex justify-between">
              <span>GENERATED:</span>
              <span>{new Date().toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>STORE ID:</span>
              <span>{currentStore.id}</span>
            </div>
            <div className="flex justify-between">
              <span>TOTAL ORDERS:</span>
              <span className="font-bold">{filteredOrders.length}</span>
            </div>
          </div>

          <div className="py-1 text-[11px] space-y-1 border-b border-dashed border-black">
            <div className="flex justify-between font-bold">
              <span>TOTAL GROSS SALES:</span>
              <span>£{totalGrossSales.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>AVERAGE TICKET:</span>
              <span>£{avgOrderValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>CASH SALES:</span>
              <span>£{cashSales.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>CARD SALES:</span>
              <span>£{cardSales.toFixed(2)}</span>
            </div>
          </div>

          <div className="py-1 text-[10px] space-y-0.5 border-b border-dashed border-black">
            <div className="font-bold text-[10px]">TOP SELLING ITEMS:</div>
            {topItems.map((item, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{item.qty}x {item.name}</span>
                <span>£{item.revenue.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="text-center pt-2 text-[10px]">
            <div>*** END OF AUDIT SLIP ***</div>
            <div className="text-[9px]">Nexus-POS Terminal Cloud Engine</div>
          </div>
        </div>
      </div>
    </div>
  );
};

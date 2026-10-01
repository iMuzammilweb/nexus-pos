import React from 'react';
import {
  Volume2,
  CheckCircle2,
  BellRing,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { useNexus } from '../../context/NexusContext';
import { soundFX } from '../../utils/audioAlert';

export const IncomingOrderAlertBanner: React.FC = () => {
  const {
    unacceptedOrders,
    acceptOrder,
    acceptAllOrders,
    setActiveAppView,
    activeAppView,
    currentUser,
    activePosMode,
  } = useNexus();

  const isStaff = currentUser?.role === 'STAFF' || activePosMode === 'staff' || activeAppView === 'staff-pos';

  if (isStaff || !unacceptedOrders || unacceptedOrders.length === 0) {
    return null;
  }

  const firstOrder = unacceptedOrders[0];

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-label="New incoming orders alert"
      onClick={() => soundFX.startContinuousNewOrderAlert(false)}
      className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white px-4 py-2.5 shadow-lg border-b-2 border-blue-400 z-40 flex items-center justify-between gap-4 animate-in slide-in-from-top duration-200"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative flex items-center justify-center">
          <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
          <div className="relative w-8 h-8 rounded-full bg-white text-blue-700 flex items-center justify-center font-black shadow-sm">
            <BellRing className="w-4 h-4 animate-bounce" />
          </div>
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`font-extrabold text-xs tracking-wider uppercase px-2 py-0.5 rounded-md backdrop-blur-xs ${
                firstOrder.isEditedOrder ? 'bg-amber-500 text-slate-950 font-black animate-pulse' : 'bg-white/20 text-white'
              }`}
            >
              {firstOrder.isEditedOrder
                ? 'Order Updated / Re-sent'
                : unacceptedOrders.length === 1
                ? 'New Order Received'
                : `${unacceptedOrders.length} New Orders`}
            </span>
            <span className="text-xs font-mono font-bold text-blue-200 truncate">
              Order #{firstOrder.orderNumber || firstOrder.invoiceId?.replace(/[^0-9]/g, '') || '1'} • {firstOrder.invoiceId} ({firstOrder.orderType}) • £{(firstOrder.grandTotal || 0).toFixed(2)}
            </span>
            {(firstOrder.orderSentBy || firstOrder.sentByStaff || firstOrder.source === 'STAFF POS' || firstOrder.orderSource === 'STAFF POS') && (
              <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-900 font-extrabold text-[11px] shadow-xs">
                Staff POS: {firstOrder.orderSentBy || firstOrder.sentByStaff || firstOrder.staffName || firstOrder.cashierName || 'Staff Agent'}
              </span>
            )}
          </div>
          <p className="text-[11px] text-blue-100 truncate mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span>Customer: <strong className="text-white">{firstOrder.customer.firstName || 'Walk-In'} {firstOrder.customer.lastName || ''}</strong> {firstOrder.customer.phone && `(${firstOrder.customer.phone})`}</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-amber-200 font-semibold">
              <Volume2 className="w-3.5 h-3.5 animate-bounce" />
              Beeping sound alert active continuously until accepted.
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            soundFX.startContinuousNewOrderAlert(true);
          }}
          title="Click to replay or unmute alert sound"
          className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-white/20 active:scale-95"
        >
          <Volume2 className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span className="hidden sm:inline">Unmute/Test Beep</span>
        </button>

        {unacceptedOrders.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              acceptAllOrders();
            }}
            className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all cursor-pointer backdrop-blur-xs active:scale-95"
          >
            Accept All ({unacceptedOrders.length})
          </button>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            acceptOrder(firstOrder.id);
          }}
          className="px-4 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-blue-700 text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 animate-pulse"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Accept Order</span>
        </button>

        {activeAppView !== 'pos-orders' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveAppView('pos-orders');
            }}
            className="px-3 py-1.5 rounded-lg bg-blue-900/60 hover:bg-blue-900/80 text-blue-100 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
          >
            <span>View Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </aside>
  );
};

import React, { useState } from 'react';
import {
  X,
  Printer,
  Ban,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Store,
  Truck,
  ShoppingBag,
  ArrowRight,
  User,
  CreditCard,
  Receipt,
  FileText,
  AlertCircle,
  Calendar,
  CheckCircle,
  Pencil,
  History,
} from 'lucide-react';
import { Order } from '../../types';
import { OrderLiveTimer } from '../common/OrderLiveTimer';
import { useNexus } from '../../context/NexusContext';
import { CustomerOrderHistoryModal } from './CustomerOrderHistoryModal';

interface OrderDetailsDrawerProps {
  order: Order | null;
  onClose: () => void;
  onAdvanceStatus?: (order: Order) => void;
  onPrintReceipt?: (order: Order) => void;
  onOpenCancelModal?: (order: Order) => void;
  onAcceptOrder?: (orderId: string) => void;
}

export const OrderDetailsDrawer: React.FC<OrderDetailsDrawerProps> = ({
  order,
  onClose,
  onAdvanceStatus,
  onPrintReceipt,
  onOpenCancelModal,
  onAcceptOrder,
}) => {
  const { startEditingOrder, orders = [] } = useNexus();
  const [showCustomerHistory, setShowCustomerHistory] = useState(false);
  if (!order) return null;

  const displayOrderNum = order.orderNumber || order.invoiceId;
  const isUnaccepted = order.isAccepted === false && order.orderStatus !== 'Cancelled' && order.orderStatus !== 'Completed';

  // Format created date
  const createdDateObj = new Date(order.createdAt);
  const formattedDate = !isNaN(createdDateObj.getTime())
    ? createdDateObj.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Today';
  const formattedTime = !isNaN(createdDateObj.getTime())
    ? createdDateObj.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Current':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'On The Way':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        // Only a click on the backdrop itself closes (not clicks bubbling from nested modals)
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-250 select-none overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Drawer Header */}
        <div className="px-5 py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-mono font-black text-sm">
              #{order.orderNumber || order.invoiceId?.replace(/[^0-9]/g, '') || '1'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">
                  Order #{order.orderNumber || order.invoiceId?.replace(/[^0-9]/g, '') || '1'}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(
                    order.orderStatus
                  )}`}
                >
                  {order.orderStatus}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Invoice: {order.invoiceId} • {formattedDate} at {formattedTime}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close Order Details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
          {/* Unaccepted Attention Banner */}
          {isUnaccepted && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white flex items-center justify-between shadow-md animate-pulse">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                <div>
                  <span className="text-xs font-black block">NEW UNACCEPTED ORDER</span>
                  <span className="text-[11px] text-red-100 block">
                    {order.orderSentBy || order.sentByStaff ? `Sent by Staff: ${order.orderSentBy || order.sentByStaff}` : 'Audible continuous alert is active'}
                  </span>
                </div>
              </div>
              {onAcceptOrder && (
                <button
                  onClick={() => onAcceptOrder(order.id)}
                  className="px-3.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 text-xs font-black rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Accept Order
                </button>
              )}
            </div>
          )}

          {/* Staff POS Order Sent By Highlight Card */}
          {(order.orderSentBy || order.sentByStaff || order.source === 'STAFF POS' || order.orderSource === 'STAFF POS') && (
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">Staff Phone / Remote Terminal</span>
                  <span className="text-xs font-extrabold text-blue-900">
                    Order Sent By: <span className="underline decoration-blue-400">{order.orderSentBy || order.sentByStaff || order.staffName || order.cashierName || 'Staff Operator'}</span>
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-blue-600 text-white font-mono font-bold text-[10px] tracking-wider uppercase shadow-2xs">
                Staff POS
              </span>
            </div>
          )}

          {/* Cancellation Notice if Cancelled */}
          {order.orderStatus === 'Cancelled' && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs">
                <Ban className="w-4 h-4 text-red-600" />
                <span>Order Cancelled</span>
              </div>
              <p className="text-xs text-red-800">
                Reason: <strong>{order.cancellationReason || 'Cancelled by staff'}</strong>
              </p>
              {order.cancelledAt && (
                <p className="text-[11px] text-red-700 font-mono">
                  Cancelled on: {new Date(order.cancelledAt).toLocaleString('en-GB')}
                  {order.cancelledBy ? ` by ${order.cancelledBy}` : ''}
                </p>
              )}
            </div>
          )}

          {/* Live Prep / Delivery Timer */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Fulfillment Timer</span>
            </div>
            <OrderLiveTimer order={order} />
          </div>

          {/* Customer & Fulfillment Information Card */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-xs text-slate-900">Customer & Delivery</span>
              </div>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                  order.orderType === 'Delivery'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : order.orderType === 'Pickup'
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {order.orderType === 'Delivery' && <Truck className="w-3 h-3" />}
                {order.orderType === 'Pickup' && <ShoppingBag className="w-3 h-3" />}
                {order.orderType === 'In-Store' && <Store className="w-3 h-3" />}
                <span>{order.orderType}</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Customer Name</span>
                <span className="font-bold text-slate-800">
                  {order.customer.firstName || 'Walk-In'} {order.customer.lastName || ''}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Contact Phone</span>
                {order.customer.phone ? (
                  <div>
                    <a
                      href={`tel:${order.customer.phone}`}
                      className="font-mono font-semibold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      {order.customer.phone}
                    </a>
                    <button
                      type="button"
                      onClick={() => setShowCustomerHistory(true)}
                      className="mt-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      <History className="w-3 h-3" />
                      <span>Order History</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-slate-400 italic">Not provided</span>
                )}
              </div>
            </div>

            {/* Delivery address details */}
            {order.orderType === 'Delivery' && (
              <div className="pt-2 border-t border-slate-100 text-xs space-y-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Delivery Address</span>
                  <div className="flex items-start gap-1.5 mt-0.5 text-slate-800">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{order.customer.fullAddress || 'Address on file'}</p>
                      {order.customer.ukPostcode && (
                        <span className="font-mono text-[11px] font-bold text-blue-600">
                          {order.customer.ukPostcode}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delivery Zone and Delivery Fee Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {(order.deliveryZone || order.customer.deliveryZone) && (
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Zone: {order.deliveryZone || order.customer.deliveryZone}
                    </span>
                  )}
                  <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Delivery Fee: <strong className="font-mono text-blue-700">£{(order.deliveryFee ?? 0).toFixed(2)}</strong>
                  </span>
                  {order.deliveryDistanceMiles !== undefined && (
                    <span className="text-[11px] font-mono text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      Distance: {order.deliveryDistanceMiles.toFixed(1)} miles
                    </span>
                  )}
                </div>

                {order.customer.driverInstructions && (
                  <div className="p-2 bg-blue-50/60 rounded-lg border border-blue-100 text-[11px] text-blue-900">
                    <strong className="font-bold block">Driver Instructions:</strong>
                    {order.customer.driverInstructions}
                  </div>
                )}
              </div>
            )}

            {/* In-Store table reference */}
            {order.orderType === 'In-Store' && order.customer.tableReference && (
              <div className="pt-2 border-t border-slate-100 text-xs">
                <span className="text-[10px] text-slate-400 font-medium block">Table Reference</span>
                <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 inline-block mt-0.5">
                  Table {order.customer.tableReference}
                </span>
              </div>
            )}

            {/* Order/Kitchen notes */}
            {order.customer.notes && (
              <div className="pt-2 border-t border-slate-100 text-xs">
                <span className="text-[10px] text-slate-400 font-medium block">Order Notes</span>
                <p className="text-slate-700 italic bg-amber-50/60 p-2 rounded-lg border border-amber-200 mt-0.5">
                  "{order.customer.notes}"
                </p>
              </div>
            )}
          </div>

          {/* Ordered Items Breakdown */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-xs text-slate-900">Ordered Items</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                {order.items.reduce((sum, item) => sum + item.quantity, 0)} items total
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {order.items.map((item, idx) => {
                const mods = item.modifications || [];
                const standardModifiers = item.selectedModifiers || [];

                return (
                  <div key={idx} className="py-2.5 first:pt-0 last:pb-0 text-xs space-y-1">
                    {/* Item row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-blue-600 font-mono bg-blue-50 px-1.5 py-0.5 rounded text-[11px] border border-blue-100">
                            {item.quantity}x
                          </span>
                          <span className="font-bold text-slate-900">{item.productName}</span>
                          {item.variantName && (
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-medium">
                              {item.variantName}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono ml-7">
                          £{item.unitPrice.toFixed(2)} each
                        </span>
                      </div>

                      <span className="font-mono font-bold text-slate-900">
                        £{(item.totalPrice || item.unitPrice * item.quantity).toFixed(2)}
                      </span>
                    </div>

                    {/* Standard Modifiers list */}
                    {standardModifiers.length > 0 && (
                      <div className="pl-7 space-y-0.5">
                        {standardModifiers.map((mod, mi) => (
                          <div key={mi} className="flex justify-between text-[11px] text-slate-600">
                            <span>+ {mod.name}</span>
                            <span className="font-mono text-blue-600">
                              {mod.price > 0 ? `+£${(mod.price * item.quantity).toFixed(2)}` : 'Free'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Custom Item Modifications list */}
                    {mods.length > 0 && (
                      <div className="pl-7 space-y-1 pt-0.5">
                        <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                          Modifications:
                        </div>
                        {mods.map((mod) => (
                          <div
                            key={mod.id}
                            className="flex items-center justify-between text-[11px] bg-blue-50/60 px-2 py-0.5 rounded border border-blue-100 text-blue-900 font-medium"
                          >
                            <span>• {mod.name}</span>
                            <span className="font-mono font-bold text-blue-700">
                              {mod.price > 0 ? `+£${(mod.price * item.quantity).toFixed(2)}` : 'Free'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Item special instructions */}
                    {(item.specialInstructions || item.notes) && (
                      <div className="pl-7 mt-0.5">
                        <span className="inline-flex items-start gap-1 text-[11px] text-amber-950 bg-amber-50/90 rounded-md px-2 py-0.5 border border-amber-200/90 italic font-medium leading-tight">
                          <b className="font-bold text-amber-800 not-italic uppercase text-[9px] tracking-wide">Note:</b>
                          "{item.specialInstructions || item.notes}"
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Financial Calculation Card */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2 text-xs">
            <div className="font-bold text-xs text-slate-900 border-b border-slate-100 pb-2">
              Financial Summary
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal:</span>
              <span className="font-mono text-slate-900">£{(order.subtotal || 0).toFixed(2)}</span>
            </div>

            {order.modifiersTotal > 0 && (
              <div className="flex justify-between text-blue-600">
                <span>Modifiers & Modifications:</span>
                <span className="font-mono font-semibold">+£{(order.modifiersTotal || 0).toFixed(2)}</span>
              </div>
            )}

            {(order.discount > 0 || order.couponDiscount > 0) && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Total Discounts ({order.couponCode || 'Promo'}):</span>
                <span className="font-mono">-£{((order.discount || 0) + (order.couponDiscount || 0)).toFixed(2)}</span>
              </div>
            )}

            {order.deliveryFee > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Delivery Fee:</span>
                <span className="font-mono text-slate-900">£{(order.deliveryFee || 0).toFixed(2)}</span>
              </div>
            )}

            {order.serviceCharge > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Service Charge:</span>
                <span className="font-mono text-slate-900">£{(order.serviceCharge || 0).toFixed(2)}</span>
              </div>
            )}

            {order.bagCharge ? (
              <div className="flex justify-between text-slate-600">
                <span>Bag Charge:</span>
                <span className="font-mono text-slate-900">£{(order.bagCharge || 0).toFixed(2)}</span>
              </div>
            ) : null}

            <div className="flex justify-between text-[11px] text-slate-500">
              <span>VAT (20% included):</span>
              <span className="font-mono">£{(order.tax || 0).toFixed(2)}</span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900">Grand Total:</span>
              <span className="font-mono font-extrabold text-lg text-blue-600">
                £{(order.grandTotal || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment & Staff Audit Card */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2 text-xs">
            <div className="font-bold text-xs text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>Payment & Operator</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <div>
                <span className="text-[10px] text-slate-400 block">Payment Method</span>
                <span className="font-bold text-slate-800">{order.paymentMethod}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Payment Status</span>
                <span className="font-bold text-emerald-600">{order.paymentStatus}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Staff / Cashier</span>
                <span className="font-medium text-slate-800">{order.cashierName || 'Administrator'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Order Source</span>
                <span className="font-medium text-slate-800">{order.orderSource || order.source || 'POS Terminal'}</span>
              </div>
              {(order.orderSentBy || order.sentByStaff) && (
                <div className="col-span-2 bg-blue-50/80 p-2 rounded-lg border border-blue-100">
                  <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider block">Order Sent By</span>
                  <span className="font-extrabold text-blue-950 text-xs">{order.orderSentBy || order.sentByStaff}</span>
                </div>
              )}
            </div>

            {order.isAccepted && (
              <div className="pt-1 text-[11px] text-slate-500 font-mono">
                Accepted by: {order.acceptedBy || 'Staff'} {order.acceptedAt ? `at ${new Date(order.acceptedAt).toLocaleTimeString('en-GB')}` : ''}
              </div>
            )}
          </div>
        </div>

        {/* 3. Action Footer */}
        <div className="p-4 bg-white border-t border-slate-200 space-y-2 shrink-0">
          <div className="flex items-center gap-2">
            {/* Status Progress Button */}
            {isUnaccepted ? (
              <button
                onClick={() => onAcceptOrder && onAcceptOrder(order.id)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Accept Order Ticket</span>
              </button>
            ) : order.orderStatus === 'Current' ? (
              <button
                onClick={() => onAdvanceStatus && onAdvanceStatus(order)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <span>{order.orderType === 'Delivery' ? 'Move to On The Way' : 'Mark as Completed'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : order.orderStatus === 'On The Way' ? (
              <button
                onClick={() => onAdvanceStatus && onAdvanceStatus(order)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark as Completed</span>
              </button>
            ) : order.orderStatus === 'Completed' ? (
              <div className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Fulfilled & Closed</span>
              </div>
            ) : (
              <div className="flex-1 py-2.5 px-3 rounded-xl bg-red-50 text-red-800 font-bold text-xs flex items-center justify-center gap-1.5 border border-red-200">
                <Ban className="w-4 h-4 text-red-600" />
                <span>Order Cancelled</span>
              </div>
            )}

            {/* Print Receipt Button */}
            {onPrintReceipt && (
              <button
                onClick={() => onPrintReceipt(order)}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200 shadow-2xs"
                title="Print Thermal Receipt"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Receipt</span>
              </button>
            )}

            {/* Edit Order Button */}
            {order.orderStatus !== 'Cancelled' && (
              <button
                onClick={() => {
                  onClose();
                  startEditingOrder(order);
                }}
                className="py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-amber-200 shadow-2xs"
                title="Edit this order and add more items"
              >
                <Pencil className="w-4 h-4 text-amber-600" />
                <span>Edit Order</span>
              </button>
            )}

            {/* Cancel Order Button */}
            {order.orderStatus !== 'Cancelled' && onOpenCancelModal && (
              <button
                onClick={() => onOpenCancelModal(order)}
                className="py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-red-200 shadow-2xs"
                title="Cancel this order"
              >
                <Ban className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Customer Order History Modal */}
      {showCustomerHistory && order.customer.phone && (
        <CustomerOrderHistoryModal
          isOpen={showCustomerHistory}
          onClose={() => setShowCustomerHistory(false)}
          customer={{
            name: `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || 'Valued Customer',
            phone: order.customer.phone,
            address: order.customer.fullAddress,
            postcode: order.customer.ukPostcode,
          }}
          orders={orders}
        />
      )}
    </div>
  );
};

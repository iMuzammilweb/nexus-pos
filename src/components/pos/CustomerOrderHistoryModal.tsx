import React, { useState, useMemo } from 'react';
import {
  X,
  ShoppingBag,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Receipt,
  User,
  Search,
  CheckCircle2,
  AlertCircle,
  Truck,
  Store,
  ChevronDown,
  ChevronUp,
  Tag,
  CreditCard,
  MessageSquare,
  FileText,
  Copy,
  Check,
} from 'lucide-react';
import { CustomerRecord, Order, CartItem } from '../../types';
import { phonesMatch } from '../../utils/phoneUtils';

interface CustomerOrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerRecord | { name: string; phone: string; address?: string; postcode?: string };
  orders: Order[];
  onSelectOrder?: (order: Order) => void;
  onReorder?: (items: CartItem[]) => void;
}

export const CustomerOrderHistoryModal: React.FC<CustomerOrderHistoryModalProps> = ({
  isOpen,
  onClose,
  customer,
  orders,
  onSelectOrder,
  onReorder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | 'Delivery' | 'Pickup' | 'In-Store'>('ALL');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Match all orders belonging to this customer by ID, orderHistory list, or phone number
  const customerOrders = useMemo(() => {
    if (!customer || !customer.phone) return [];
    const custRecord = customer as CustomerRecord;
    const historyIds = custRecord.orderHistory || [];

    return orders
      .filter((o) => {
        if (custRecord.id && o.customerId === custRecord.id) return true;
        if (historyIds.includes(o.id)) return true;
        if (phonesMatch(o.customer?.phone, customer.phone)) return true;
        return false;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [customer, orders]);

  // Filtered orders based on user query and order type
  const filteredOrders = useMemo(() => {
    return customerOrders.filter((o) => {
      if (selectedType !== 'ALL' && o.orderType !== selectedType) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchInvoice = (o.invoiceId || '').toLowerCase().includes(q);
      const matchOrderNum = (o.orderNumber || '').toLowerCase().includes(q);
      const matchItems = (o.items || []).some(
        (i) =>
          (i.productName || '').toLowerCase().includes(q) ||
          (i.variantName || '').toLowerCase().includes(q) ||
          (i.selectedModifiers && i.selectedModifiers.some((m) => (m.name || '').toLowerCase().includes(q)))
      );
      const matchNotes =
        (o.customer?.notes || '').toLowerCase().includes(q) ||
        (o.customer?.driverInstructions || '').toLowerCase().includes(q);
      return matchInvoice || matchOrderNum || matchItems || matchNotes;
    });
  }, [customerOrders, selectedType, searchQuery]);

  const totalSpend = useMemo(() => {
    return customerOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  }, [customerOrders]);

  const handleCopyPhone = () => {
    if (!customer.phone) return;
    navigator.clipboard.writeText(customer.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0F172A] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Customer Order History</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {customerOrders.length} {customerOrders.length === 1 ? 'Order' : 'Orders'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete timeline of all past orders, items, variants, kitchen notes, and payment records.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Profile Banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">{customer.name || 'Valued Customer'}</span>
                <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                  <Phone className="w-3 h-3 text-blue-600" />
                  {customer.phone}
                </span>
                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className="text-slate-400 hover:text-slate-600 p-0.5"
                  title="Copy Phone"
                >
                  {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              {customer.address && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {customer.address}
                    {customer.postcode ? `, ${customer.postcode}` : ''}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Lifetime Spend</span>
                <span className="text-sm font-extrabold font-mono text-blue-600">£{totalSpend.toFixed(2)}</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Orders</span>
                <span className="text-sm font-extrabold font-mono text-slate-800">{customerOrders.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dishes, variants, order #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex items-center gap-1 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
            {(['ALL', 'Delivery', 'Pickup', 'In-Store'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedType === type
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Order History Timeline List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
          {filteredOrders.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No Past Orders Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery || selectedType !== 'ALL'
                  ? 'No orders match your filter criteria.'
                  : 'This customer has not placed any orders yet. New orders will automatically appear here.'}
              </p>
            </div>
          ) : (
            filteredOrders.map((ord) => {
              const isExpanded = expandedOrderId === ord.id;
              const formattedDate = new Date(ord.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });
              const formattedTime = new Date(ord.createdAt).toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
              });

              // Status styles
              const statusColor =
                ord.orderStatus === 'Completed' || ord.orderStatus === 'Ready'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : ord.orderStatus === 'Cancelled'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200';

              const typeColor =
                ord.orderType === 'Delivery'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : ord.orderType === 'Pickup'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200';

              return (
                <div
                  key={ord.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all overflow-hidden"
                >
                  {/* Order Card Header */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 bg-white">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold font-mono text-sm text-blue-600">
                          {ord.orderNumber ? `Order #${ord.orderNumber}` : ord.invoiceId}
                        </span>
                        <span className="text-xs font-mono text-slate-400">({ord.invoiceId})</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${typeColor}`}>
                          {ord.orderType}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor}`}>
                          {ord.orderStatus}
                        </span>
                        {ord.source && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                            {ord.source}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formattedDate} at {formattedTime}
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                          {ord.paymentMethod} • {ord.paymentStatus}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Amount</span>
                        <span className="text-base font-extrabold font-mono text-slate-900">
                          £{ord.grandTotal.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {onReorder && ord.items && ord.items.length > 0 && (
                          <button
                            type="button"
                            onClick={() => onReorder(ord.items)}
                            className="px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold transition-colors cursor-pointer"
                            title="Re-order items from this ticket"
                          >
                            Reorder
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setExpandedOrderId(isExpanded ? null : ord.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          aria-label="Toggle details"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Special Kitchen Instructions / Notes */}
                  {(ord.customer?.notes || ord.customer?.driverInstructions) && (
                    <div className="px-4 py-2.5 bg-amber-50/70 border-b border-amber-100 flex items-start gap-2 text-xs">
                      <MessageSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        {ord.customer?.notes && (
                          <p className="text-amber-900 font-medium">
                            <strong className="font-bold">Special Kitchen Instructions / Notes:</strong>{' '}
                            {ord.customer.notes}
                          </p>
                        )}
                        {ord.customer?.driverInstructions && (
                          <p className="text-amber-800 text-[11px]">
                            <strong className="font-semibold">Driver Instructions:</strong>{' '}
                            {ord.customer.driverInstructions}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Items Ordered Table / Breakdown */}
                  <div className="p-4 space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Items Ordered ({ord.items?.length || 0})
                    </div>
                    <div className="divide-y divide-slate-100">
                      {(ord.items || []).map((item, idx) => (
                        <div key={idx} className="py-2 flex items-start justify-between gap-3 text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-800 font-bold font-mono text-[11px] flex items-center justify-center shrink-0">
                                {item.quantity}x
                              </span>
                              <span className="font-bold text-slate-900">{item.productName}</span>
                              {item.variantName && (
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                                  Variant: {item.variantName}
                                </span>
                              )}
                            </div>

                            {/* Add-ons & Modifiers */}
                            {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                              <div className="pl-7 flex flex-wrap gap-1">
                                {item.selectedModifiers.map((mod, mIdx) => (
                                  <span
                                    key={mIdx}
                                    className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium border border-blue-100"
                                  >
                                    <Tag className="w-2.5 h-2.5" />
                                    +{mod.name}
                                    {mod.price > 0 ? ` (£${mod.price.toFixed(2)})` : ''}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Item notes */}
                            {item.notes && (
                              <p className="pl-7 text-[11px] text-amber-700 italic">
                                Note: {item.notes}
                              </p>
                            )}
                          </div>

                          <div className="font-mono font-bold text-slate-800 shrink-0 text-right">
                            £{(item.totalPrice ?? ((item.unitPrice || 0) * (item.quantity || 1))).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Expanded details: taxes, discounts, delivery address */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50/70 p-3 rounded-xl text-xs space-y-1.5">
                        <div className="flex justify-between text-slate-600">
                          <span>Subtotal</span>
                          <span className="font-mono">£{(ord.subtotal || 0).toFixed(2)}</span>
                        </div>
                        {ord.deliveryFee > 0 && (
                          <div className="flex justify-between text-slate-600">
                            <span>Delivery Fee</span>
                            <span className="font-mono">£{ord.deliveryFee.toFixed(2)}</span>
                          </div>
                        )}
                        {ord.discount > 0 && (
                          <div className="flex justify-between text-emerald-600 font-medium">
                            <span>Discount</span>
                            <span className="font-mono">-£{ord.discount.toFixed(2)}</span>
                          </div>
                        )}
                        {ord.couponDiscount > 0 && (
                          <div className="flex justify-between text-emerald-600 font-medium">
                            <span>Coupon Discount ({ord.couponCode})</span>
                            <span className="font-mono">-£{ord.couponDiscount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                          <span>Grand Total</span>
                          <span className="font-mono text-blue-600">£{ord.grandTotal.toFixed(2)}</span>
                        </div>

                        {ord.customer?.fullAddress && ord.orderType === 'Delivery' && (
                          <div className="pt-2 text-slate-600 flex items-start gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span>
                              <strong>Delivery Destination:</strong> {ord.customer.fullAddress}{' '}
                              {ord.customer.ukPostcode}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredOrders.length} of {customerOrders.length} total customer orders
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

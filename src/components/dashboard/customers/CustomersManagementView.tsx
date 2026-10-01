import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Phone,
  MapPin,
  ShoppingBag,
  Clock,
  Copy,
  Check,
  Calendar,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  UserCheck,
  History,
  MessageSquare,
  Tag,
  Maximize2,
} from 'lucide-react';
import { useNexus } from '../../../context/NexusContext';
import { CustomerRecord, Order } from '../../../types';
import { phonesMatch } from '../../../utils/phoneUtils';
import { CustomerOrderHistoryModal } from '../../pos/CustomerOrderHistoryModal';

export const CustomersManagementView: React.FC = () => {
  const {
    customers = [],
    currentStore,
    stores,
    currentUser,
    orders = [],
  } = useNexus();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [copied, setCopied] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Store Isolation Filter: Filter customers by the authorized / current store
  const authorizedStoreId = useMemo(() => {
    if (currentUser?.role === 'STAFF' && currentUser?.storeId) {
      return currentUser.storeId;
    }
    return currentStore.id;
  }, [currentUser, currentStore]);

  const authorizedStore = stores.find((s) => s.id === authorizedStoreId) || currentStore;

  const storeCustomers = useMemo(() => {
    return (customers || []).filter((c) => !c.storeId || c.storeId === authorizedStoreId);
  }, [customers, authorizedStoreId]);

  const filteredCustomers = useMemo(() => {
    return storeCustomers.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q) ||
        c.postcode?.toLowerCase().includes(q)
      );
    });
  }, [storeCustomers, searchQuery]);

  // Copy All Customer Numbers for authorized store only (one per line)
  const handleCopyAllNumbers = () => {
    const numbers = storeCustomers
      .map((c) => c.phone)
      .filter((p) => Boolean(p && p.trim()))
      .join('\n');

    if (!numbers) return;
    navigator.clipboard.writeText(numbers);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Customer order history - robust matching across phone number, orderHistory IDs, or customer ID
  const customerOrders = useMemo(() => {
    if (!selectedCustomer) return [];
    return orders
      .filter((o) => {
        if (o.storeId && authorizedStoreId && o.storeId !== authorizedStoreId && currentUser?.role !== 'ADMIN') {
          return false;
        }
        if (o.customerId && o.customerId === selectedCustomer.id) return true;
        if (selectedCustomer.orderHistory && selectedCustomer.orderHistory.includes(o.id)) return true;
        if (phonesMatch(o.customer?.phone, selectedCustomer.phone)) return true;
        return false;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [selectedCustomer, orders, authorizedStoreId, currentUser]);

  const totalStoreCustomers = storeCustomers.length;
  const totalStoreCustomerSpend = storeCustomers.reduce((sum, c) => sum + (c.totalSpend || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-[#E5EAF2] p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-[#172033]">
                Customer Directory — {authorizedStore.businessName}
              </h1>
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              Secure store-isolated customer database, complete order history, variants, notes, and instant phone export.
            </p>
          </div>

          <button
            onClick={handleCopyAllNumbers}
            disabled={storeCustomers.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy All Customer Numbers'}</span>
          </button>
        </div>

        {/* Aggregate Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-[#E5EAF2]">
          <div className="p-3 bg-slate-50 rounded-xl border border-[#E5EAF2]">
            <span className="text-[11px] font-bold text-[#64748B] uppercase">Registered Customers</span>
            <div className="text-xl font-extrabold font-mono text-[#172033] mt-1">
              {totalStoreCustomers}
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-[#E5EAF2]">
            <span className="text-[11px] font-bold text-[#64748B] uppercase">Total Customer Spend</span>
            <div className="text-xl font-extrabold font-mono text-blue-600 mt-1">
              £{totalStoreCustomerSpend.toFixed(2)}
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-[#E5EAF2] col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold text-[#64748B] uppercase">Store Security Isolation</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 mt-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Store ID: {authorizedStoreId}</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full mt-4">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, phone number, address or postcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-[#E5EAF2] text-[#172033] text-xs font-semibold focus:bg-white focus:outline-none focus:border-blue-600 placeholder:text-[#64748B]"
          />
        </div>
      </div>

      {/* Main Customers List & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {filteredCustomers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5EAF2] p-12 text-center shadow-xs">
              <UserCheck className="w-12 h-12 text-[#64748B] mx-auto mb-3 stroke-[1.5]" />
              <h3 className="text-base font-bold text-[#172033]">No Customers Found</h3>
              <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? 'No customer records match your search criteria.'
                  : 'Customer records are automatically saved and updated on completed POS and Phone orders.'}
              </p>
            </div>
          ) : (
            filteredCustomers.map((cust) => {
              const isSelected = selectedCustomer?.id === cust.id;

              return (
                <div
                  key={cust.id}
                  onClick={() => setSelectedCustomer(cust)}
                  className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                    isSelected
                      ? 'border-blue-600 ring-2 ring-blue-600/10 bg-blue-50/20'
                      : 'border-[#E5EAF2] hover:border-blue-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#172033]">{cust.name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                        {cust.totalOrders} {cust.totalOrders === 1 ? 'Order' : 'Orders'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#64748B]">
                      <span className="flex items-center gap-1 font-mono font-bold text-[#172033]">
                        <Phone className="w-3 h-3 text-blue-600" />
                        {cust.phone}
                      </span>
                      {cust.postcode && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#64748B]" />
                          {cust.postcode}
                        </span>
                      )}
                    </div>

                    {cust.address && (
                      <p className="text-xs text-[#64748B] truncate max-w-md">{cust.address}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#E5EAF2]">
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-[#64748B] block">Lifetime Value</span>
                      <span className="text-base font-extrabold font-mono text-blue-600">
                        £{(cust.totalSpend || 0).toFixed(2)}
                      </span>
                      {cust.lastOrderDate && (
                        <span className="text-[10px] text-[#64748B] block mt-0.5">
                          Last: {new Date(cust.lastOrderDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCustomer(cust);
                        setIsHistoryModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-xs font-bold transition-all flex items-center gap-1 border border-slate-200"
                      title="View Complete Order History"
                    >
                      <History className="w-3.5 h-3.5 text-blue-600" />
                      <span>History</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Customer Detail Inspector */}
        <div className="bg-white rounded-2xl border border-[#E5EAF2] p-5 shadow-xs h-fit space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              <span>Customer Profile & History</span>
            </h2>
            {selectedCustomer && customerOrders.length > 0 && (
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(true)}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Full History</span>
              </button>
            )}
          </div>

          {selectedCustomer ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-[#E5EAF2] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-base font-bold text-[#172033]">{selectedCustomer.name}</div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 font-mono">
                    {customerOrders.length} Orders
                  </span>
                </div>
                <div className="text-xs font-mono font-bold text-blue-600 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{selectedCustomer.phone}</span>
                </div>
                {selectedCustomer.address && (
                  <div className="text-xs text-[#64748B] flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#64748B] shrink-0 mt-0.5" />
                    <span>
                      {selectedCustomer.address}
                      {selectedCustomer.postcode ? `, ${selectedCustomer.postcode}` : ''}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between text-xs font-bold">
                  <span className="text-[#64748B]">Total Spend:</span>
                  <span className="text-blue-600 font-mono">
                    £{customerOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Order History Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-blue-600" />
                    <span>Order History ({customerOrders.length})</span>
                  </span>
                  {customerOrders.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsHistoryModalOpen(true)}
                      className="text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      View All
                    </button>
                  )}
                </div>

                {customerOrders.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-[#64748B]">
                    No past orders recorded for this customer yet. New orders will automatically appear here.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                    {customerOrders.map((ord) => {
                      const formattedDate = new Date(ord.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      });
                      const formattedTime = new Date(ord.createdAt).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      const statusColor =
                        ord.orderStatus === 'Completed' || ord.orderStatus === 'Ready'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : ord.orderStatus === 'Cancelled'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200';

                      return (
                        <div
                          key={ord.id}
                          className="p-3 bg-slate-50 border border-[#E5EAF2] rounded-xl text-xs space-y-2 hover:border-blue-300 transition-colors"
                        >
                          {/* Order Header: Number, Date, Status, Total */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold font-mono text-blue-600">
                                  {ord.orderNumber ? `Order #${ord.orderNumber}` : ord.invoiceId}
                                </span>
                                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold border ${statusColor}`}>
                                  {ord.orderStatus}
                                </span>
                                <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[9px] font-semibold">
                                  {ord.orderType}
                                </span>
                              </div>
                              <div className="text-[10px] text-[#64748B] flex items-center gap-2 mt-0.5">
                                <span>{formattedDate} at {formattedTime}</span>
                                <span>•</span>
                                <span className="font-medium">{ord.paymentMethod}</span>
                              </div>
                            </div>

                            <div className="text-right font-extrabold font-mono text-sm text-[#172033]">
                              £{ord.grandTotal.toFixed(2)}
                            </div>
                          </div>

                          {/* Special Kitchen Instructions / Notes */}
                          {(ord.customer?.notes || ord.customer?.driverInstructions) && (
                            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-1.5">
                              <MessageSquare className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                              <div className="space-y-0.5">
                                {ord.customer?.notes && (
                                  <p>
                                    <strong className="font-bold">Kitchen Instructions:</strong> {ord.customer.notes}
                                  </p>
                                )}
                                {ord.customer?.driverInstructions && (
                                  <p className="text-[10px] text-amber-800">
                                    <strong className="font-semibold">Driver:</strong> {ord.customer.driverInstructions}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Items Ordered with Quantities, Add-ons / Variants */}
                          <div className="pt-1 border-t border-slate-200 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                              Items Ordered:
                            </span>
                            <div className="space-y-1">
                              {(ord.items || []).map((item, iIdx) => (
                                <div key={iIdx} className="space-y-0.5">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-[#172033]">
                                      <strong className="font-mono text-slate-900">{item.quantity}x</strong>{' '}
                                      {item.productName || (item as any).name}
                                    </span>
                                    <span className="font-mono text-[#64748B]">
                                      £{(item.totalPrice ?? ((item.unitPrice ?? (item as any).price ?? 0) * (item.quantity || 1))).toFixed(2)}
                                    </span>
                                  </div>

                                  {(item.variantName || (item as any).selectedVariant) && (
                                    <div className="pl-4 text-[10px] text-slate-500 font-medium">
                                      Variant: {item.variantName || (item as any).selectedVariant}
                                    </div>
                                  )}

                                  {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                    <div className="pl-4 flex flex-wrap gap-1">
                                      {item.selectedModifiers.map((m, mIdx) => (
                                        <span
                                          key={mIdx}
                                          className="text-[9px] px-1 py-0.2 rounded bg-blue-50 text-blue-700 font-medium border border-blue-100 flex items-center gap-0.5"
                                        >
                                          <Tag className="w-2 h-2" />
                                          +{m.name}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-[#64748B]">
              Select a customer from the directory to view their complete profile, contact details, and past order history.
            </div>
          )}
        </div>
      </div>

      {/* Full Customer Order History Modal */}
      {selectedCustomer && (
        <CustomerOrderHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          customer={selectedCustomer}
          orders={orders}
        />
      )}
    </div>
  );
};


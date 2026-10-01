import React from 'react';
import { X, Printer, CheckCircle2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useNexus } from '../../context/NexusContext';
import { NexusLogo } from '../common/NexusLogo';

export const ThermalReceiptModal: React.FC = () => {
  const {
    isReceiptModalOpen,
    setIsReceiptModalOpen,
    latestPlacedOrder,
    currentStore,
    currentEmployee,
    setActiveAppView,
  } = useNexus();

  if (!isReceiptModalOpen || !latestPlacedOrder) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDone = () => {
    setIsReceiptModalOpen(false);
    setActiveAppView('pos-menu');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white border border-[#E5EAF2] rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-white border-b border-[#E5EAF2] flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span className="text-xs font-bold text-[#172033] uppercase tracking-wider">
              Order Confirmed & Receipt Ready
            </span>
          </div>
          <button
            onClick={() => setIsReceiptModalOpen(false)}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Thermal Receipt Container */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#F8FAFC] flex justify-center">
          <div
            id="printable-receipt"
            className="w-full max-w-[340px] bg-white text-black p-5 rounded-xl shadow-sm border border-[#E5EAF2] font-mono text-xs leading-tight space-y-3"
          >
            {/* Branded Header */}
            <div className="text-center space-y-1 pb-2 border-b border-dashed border-neutral-300">
              <div className="font-sans font-bold text-base text-blue-600 tracking-wider">
                NEXUS-POS
              </div>
              <div className="font-bold text-sm text-neutral-900">{currentStore.businessName}</div>
              <div className="text-[11px] text-neutral-600">
                {currentStore.address}, {currentStore.postcode}
              </div>
              <div className="text-[10px] text-neutral-500">
                Tel: {currentStore.phone} • VAT Reg: {currentStore.vatNumber}
              </div>
            </div>

            {/* Ticket Metadata */}
            <div className="py-1 text-[11px] space-y-1 border-b border-dashed border-neutral-300">
              <div className="flex justify-between font-extrabold text-sm text-blue-600 pb-0.5">
                <span>ORDER NUMBER:</span>
                <span>#{latestPlacedOrder.orderNumber || latestPlacedOrder.invoiceId?.replace(/[^0-9]/g, '') || '1'}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>INVOICE:</span>
                <span>{latestPlacedOrder.invoiceId}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE/TIME:</span>
                <span>
                  {new Date(latestPlacedOrder.createdAt).toLocaleDateString()}{' '}
                  {new Date(latestPlacedOrder.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>ORDER TYPE:</span>
                <span className="font-bold underline">{latestPlacedOrder.orderType.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span>CASHIER:</span>
                <span>{latestPlacedOrder.cashierName || currentEmployee?.name || 'Administrator'}</span>
              </div>
              {(latestPlacedOrder.orderSentBy || latestPlacedOrder.sentByStaff || latestPlacedOrder.source === 'STAFF POS' || latestPlacedOrder.orderSource === 'STAFF POS') && (
                <div className="flex justify-between font-bold text-blue-700">
                  <span>ORDER SENT BY:</span>
                  <span>{latestPlacedOrder.orderSentBy || latestPlacedOrder.sentByStaff || latestPlacedOrder.staffName || latestPlacedOrder.cashierName} (Staff POS)</span>
                </div>
              )}
            </div>

            {/* Customer Details */}
            <div className="py-1 text-[11px] space-y-0.5 border-b border-dashed border-neutral-300">
              <div className="font-bold">
                CUSTOMER: {latestPlacedOrder.customer.firstName} {latestPlacedOrder.customer.lastName}
              </div>
              {latestPlacedOrder.customer.phone && (
                <div>PHONE: {latestPlacedOrder.customer.phone}</div>
              )}
              {latestPlacedOrder.orderType === 'Delivery' && latestPlacedOrder.customer.fullAddress && (
                <div className="text-[10px] leading-tight mt-0.5">
                  DELIVERY TO: {latestPlacedOrder.customer.fullAddress}
                </div>
              )}
              {latestPlacedOrder.orderType === 'In-Store' && latestPlacedOrder.customer.tableReference && (
                <div className="font-bold">TABLE: {latestPlacedOrder.customer.tableReference}</div>
              )}
              {latestPlacedOrder.customer.driverInstructions && (
                <div className="text-[10px] font-bold text-neutral-800 bg-neutral-100 p-1 rounded mt-1">
                  DELIVERY INSTRUCTIONS: {latestPlacedOrder.customer.driverInstructions}
                </div>
              )}
              {latestPlacedOrder.customer.notes && (
                <div className="text-[10px] italic text-neutral-700 mt-1">
                  ORDER INSTRUCTIONS: {latestPlacedOrder.customer.notes}
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <div className="py-2 space-y-2 border-b border-dashed border-neutral-300">
              <div className="flex justify-between font-bold text-[10px] text-neutral-500 uppercase pb-1 border-b border-neutral-200">
                <span>Qty Item</span>
                <span>Price</span>
              </div>

              {latestPlacedOrder.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5 text-[11px]">
                  <div className="flex justify-between font-bold">
                    <span>
                      {item.quantity}x {item.productName} ({item.variantName || item.variantSize})
                    </span>
                    <span>£{(item.totalPrice || 0).toFixed(2)}</span>
                  </div>
                  {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                    <div className="text-[10px] text-neutral-600 pl-3 space-y-0.5">
                      {item.selectedModifiers.map((mod, mi) => (
                        <div key={mi} className="flex justify-between">
                          <span>+ {mod.name}</span>
                          <span>{(mod.price || 0) > 0 ? `£${(mod.price || 0).toFixed(2)}` : 'Free'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {item.modifications && item.modifications.length > 0 && (
                    <div className="text-[10px] text-neutral-700 pl-3 space-y-0.5 font-medium">
                      {item.modifications.map((mod, mi) => (
                        <div key={mi} className="flex justify-between">
                          <span>• {mod.name}</span>
                          <span>{(mod.price || 0) > 0 ? `£${(mod.price || 0).toFixed(2)}` : 'Free'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {(item.specialInstructions || item.notes) && (
                    <div className="text-[10px] italic text-neutral-700 pl-3 font-semibold">
                      * Note: {item.specialInstructions || item.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="py-1 text-[11px] space-y-1 border-b border-dashed border-neutral-300">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>£{(latestPlacedOrder.subtotal || 0).toFixed(2)}</span>
              </div>

              {(latestPlacedOrder.modifiersTotal || 0) > 0 && (
                <div className="flex justify-between text-neutral-600">
                  <span>Modifiers:</span>
                  <span>£{(latestPlacedOrder.modifiersTotal || 0).toFixed(2)}</span>
                </div>
              )}

              {(latestPlacedOrder.couponDiscount || 0) > 0 && (
                <div className="flex justify-between font-bold">
                  <span>Discount ({latestPlacedOrder.couponCode}):</span>
                  <span>-£{(latestPlacedOrder.couponDiscount || 0).toFixed(2)}</span>
                </div>
              )}

              {(latestPlacedOrder.deliveryFee || 0) > 0 && (
                <div className="flex justify-between">
                  <span>Delivery Charge:</span>
                  <span>£{(latestPlacedOrder.deliveryFee || 0).toFixed(2)}</span>
                </div>
              )}

              {(latestPlacedOrder.serviceCharge || 0) > 0 && (
                <div className="flex justify-between">
                  <span>Service Charge:</span>
                  <span>£{(latestPlacedOrder.serviceCharge || 0).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-[10px] text-neutral-500">
                <span>Incl. UK VAT (20%):</span>
                <span>£{(latestPlacedOrder.tax || 0).toFixed(2)}</span>
              </div>

              <div className="flex justify-between font-bold text-sm pt-1 border-t border-neutral-300">
                <span>TOTAL:</span>
                <span>£{(latestPlacedOrder.grandTotal || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Verification */}
            <div className="py-1 text-[11px] space-y-1 text-center font-bold">
              <div>
                PAID VIA {latestPlacedOrder.paymentMethod.toUpperCase()} —{' '}
                {latestPlacedOrder.paymentStatus.toUpperCase()}
              </div>
              <div className="text-[10px] font-normal text-neutral-600">
                Thank you for your order! Please come again.
              </div>
              <div className="text-[9px] text-neutral-400">
                Powered by Nexus-POS System
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="px-6 py-4 bg-white border-t border-[#E5EAF2] flex items-center justify-between gap-3 no-print">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 border border-[#E5EAF2] text-[#172033] font-bold text-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>Print Receipt</span>
          </button>

          <button
            onClick={handleDone}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <span>Start Next Order</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

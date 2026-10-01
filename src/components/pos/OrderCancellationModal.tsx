import React, { useState } from 'react';
import { AlertTriangle, X, Ban, Check } from 'lucide-react';
import { Order } from '../../types';

interface OrderCancellationModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onConfirmCancel: (orderId: string, reason: string) => void;
}

const COMMON_REASONS = [
  'Customer requested cancellation',
  'Kitchen out of stock / ingredient unavailable',
  'Duplicate or test order',
  'Delivery address outside service zone',
  'Customer unreachable / wrong phone number',
  'Kitchen over capacity / delay too long',
  'Other reason',
];

export const OrderCancellationModal: React.FC<OrderCancellationModalProps> = ({
  isOpen,
  order,
  onClose,
  onConfirmCancel,
}) => {
  const [selectedReason, setSelectedReason] = useState(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const handleConfirm = () => {
    setIsSubmitting(true);
    const finalReason = selectedReason === 'Other reason' && customReason.trim()
      ? customReason.trim()
      : selectedReason;

    onConfirmCancel(order.id, finalReason);
    setIsSubmitting(false);
    onClose();
  };

  const displayOrderNum = order.orderNumber || order.invoiceId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E5EAF2] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-red-50 border-b border-red-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-red-950">Cancel Order</h3>
              <p className="text-xs text-red-700 font-mono">{displayOrderNum} • {order.customer.firstName || 'Customer'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-slate-700">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="flex justify-between font-medium">
              <span className="text-slate-500">Order Amount:</span>
              <span className="font-mono font-bold text-slate-900">£{(order.grandTotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-slate-500">Order Items:</span>
              <span className="text-slate-900">{order.items.reduce((s, i) => s + i.quantity, 0)} item(s)</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-slate-500">Order Type:</span>
              <span className="text-slate-900">{order.orderType}</span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1.5">
              Select Cancellation Reason:
            </label>
            <div className="space-y-1.5">
              {COMMON_REASONS.map((reason) => {
                const isSelected = selectedReason === reason;
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedReason(reason)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between border cursor-pointer ${
                      isSelected
                        ? 'bg-red-50 text-red-800 border-red-300 font-semibold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{reason}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-red-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedReason === 'Other reason' && (
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Custom Cancellation Note:
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Explain why this order is being cancelled..."
                rows={2}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-red-500"
              />
            </div>
          )}

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Cancelling this order will mark its status as <strong className="text-red-700">Cancelled</strong> and move it to the Cancelled orders archive.
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Keep Order
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Confirm Cancellation</span>
          </button>
        </div>
      </div>
    </div>
  );
};

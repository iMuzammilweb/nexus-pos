import React from 'react';
import { Printer, AlertTriangle, RefreshCw, X, CheckCircle2 } from 'lucide-react';
import { useNexus } from '../../context/NexusContext';

export const AutoPrintStatusBanner: React.FC = () => {
  const { printAlert, retryPrintOrder, dismissPrintAlert } = useNexus();

  if (!printAlert) return null;

  const isFailed = printAlert.status === 'failed';
  const isPrinting = printAlert.status === 'printing';
  const isSuccess = printAlert.status === 'success';

  return (
    <div
      className={`w-full px-4 py-2.5 flex items-center justify-between z-40 transition-all border-b shadow-sm ${
        isFailed
          ? 'bg-amber-500 text-white border-amber-600'
          : isPrinting
          ? 'bg-blue-600 text-white border-blue-700'
          : 'bg-emerald-600 text-white border-emerald-700'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-lg bg-white/20 text-white shrink-0">
          {isFailed ? (
            <AlertTriangle className="w-4 h-4 animate-bounce" />
          ) : isPrinting ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <span className="font-extrabold text-xs tracking-wide">
            {isFailed
              ? '⚠️ PRINTING FAILED / PRINTER OFFLINE'
              : isPrinting
              ? '🖨️ AUTO-PRINTING TICKET...'
              : '✅ TICKET PRINTED SUCCESSFULLY'}
          </span>
          <span className="text-[11px] text-white/90">
            Order #{printAlert.order.orderNumber || printAlert.order.invoiceId}
            {printAlert.error && ` — ${printAlert.error}`}
            {printAlert.printerName && ` (${printAlert.printerName})`}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isFailed && (
          <button
            onClick={() => retryPrintOrder(printAlert.order)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white text-amber-900 hover:bg-amber-50 font-black text-xs shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Print</span>
          </button>
        )}
        <button
          onClick={dismissPrintAlert}
          className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

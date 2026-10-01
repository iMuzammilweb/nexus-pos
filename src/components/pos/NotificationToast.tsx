import React, { useEffect } from 'react';
import {
  Bell,
  CheckCircle,
  AlertCircle,
  ShoppingBag,
  CircleDollarSign,
  X,
  Sparkles,
} from 'lucide-react';
import { useNexus } from '../../context/NexusContext';

export const NotificationToast: React.FC = () => {
  const {
    latestToastNotification,
    dismissToastNotification,
    setActiveAppView,
  } = useNexus();

  useEffect(() => {
    if (!latestToastNotification) return;

    const timer = setTimeout(() => {
      dismissToastNotification();
    }, 6000);

    return () => clearTimeout(timer);
  }, [latestToastNotification, dismissToastNotification]);

  if (!latestToastNotification) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingBag className="w-4 h-4 text-blue-600" />;
      case 'cash':
        return <CircleDollarSign className="w-4 h-4 text-emerald-600" />;
      case 'alert':
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Notification alert"
      className="fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-xl border border-[#E5EAF2] shadow-xl p-3.5 flex items-start gap-3 animate-in slide-in-from-top-3 fade-in duration-200"
    >
      <div className="p-2 rounded-lg bg-blue-50 shrink-0 mt-0.5">
        {getIcon(latestToastNotification.type)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <h4 className="text-xs font-bold text-[#172033] truncate">
            {latestToastNotification.title}
          </h4>
          <button
            onClick={() => dismissToastNotification()}
            className="text-[#64748B] hover:text-[#172033] p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-xs text-[#64748B] mt-0.5 leading-snug line-clamp-2">
          {latestToastNotification.message}
        </p>

        {latestToastNotification.linkTo && (
          <button
            onClick={() => {
              if (latestToastNotification.linkTo === 'orders') {
                setActiveAppView('pos-orders');
              }
              dismissToastNotification();
            }}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 mt-1.5 inline-block cursor-pointer"
          >
            Open Orders View &rarr;
          </button>
        )}
      </div>
    </div>
  );
};

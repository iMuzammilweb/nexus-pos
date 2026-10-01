import React from 'react';
import {
  X,
  Bell,
  CheckCheck,
  ShoppingBag,
  CircleDollarSign,
  AlertTriangle,
  Info,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useNexus } from '../../context/NexusContext';

export const NotificationsDrawer: React.FC = () => {
  const {
    isNotificationsOpen,
    setIsNotificationsOpen,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setActiveAppView,
    setIsCashDrawerModalOpen,
  } = useNexus();

  if (!isNotificationsOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (notif: any) => {
    markNotificationAsRead(notif.id);
    if (notif.linkTo === 'orders') {
      setActiveAppView('pos-orders');
      setIsNotificationsOpen(false);
    } else if (notif.linkTo === 'cash-drawer') {
      setIsCashDrawerModalOpen(true);
      setIsNotificationsOpen(false);
    } else if (notif.linkTo === 'stores') {
      setActiveAppView('dashboard');
      setIsNotificationsOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-[#E5EAF2] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 bg-white border-b border-[#E5EAF2] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#172033]">
                  Notifications & Live Feeds
                </h3>
                <span className="text-[10px] text-[#64748B]">
                  {unreadCount} unread store updates
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllNotificationsAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Read All</span>
                </button>
              )}
              <button
                onClick={() => setIsNotificationsOpen(false)}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-[#F8FAFC]">
            {notifications.length === 0 ? (
              /* Mandatory Empty State (Section 39 Requirement) */
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#64748B]">
                <CheckCircle2 className="w-12 h-12 text-slate-300 mb-2 stroke-[1.5]" />
                <h4 className="text-sm font-bold text-[#172033]">You're all caught up</h4>
                <p className="text-xs text-[#64748B] mt-1 max-w-[200px]">
                  No new operational notifications or alerts at this time.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 relative shadow-xs ${
                    notif.read
                      ? 'bg-white border-[#E5EAF2] text-[#64748B]'
                      : 'bg-blue-50/60 border-blue-200 text-[#172033]'
                  }`}
                >
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-blue-600 absolute top-3 right-3" />
                  )}

                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      notif.type === 'order'
                        ? 'bg-blue-100 text-blue-600'
                        : notif.type === 'cash'
                        ? 'bg-emerald-100 text-emerald-600'
                        : notif.type === 'alert'
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-purple-100 text-purple-600'
                    }`}
                  >
                    {notif.type === 'order' && <ShoppingBag className="w-4 h-4" />}
                    {notif.type === 'cash' && <CircleDollarSign className="w-4 h-4" />}
                    {notif.type === 'alert' && <AlertTriangle className="w-4 h-4" />}
                    {notif.type === 'system' && <Info className="w-4 h-4" />}
                    {notif.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 pr-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#172033] leading-tight">
                        {notif.title}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] mt-1 leading-snug">
                      {notif.message}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#E5EAF2]">
                      <span className="text-[10px] text-[#64748B] font-mono">
                        {new Date(notif.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {notif.linkTo && (
                        <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                          <span>View</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { Order, StoreSettingsData, OrderType } from '../../types';

interface OrderLiveTimerProps {
  order: Order;
  storeSettings?: StoreSettingsData;
  compact?: boolean;
}

export const OrderLiveTimer: React.FC<OrderLiveTimerProps> = ({
  order,
  storeSettings,
  compact = false,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    const createdTime = new Date(order.createdAt).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((now - createdTime) / 1000));
  });

  useEffect(() => {
    // Live update every second
    const interval = setInterval(() => {
      const createdTime = new Date(order.createdAt).getTime();
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - createdTime) / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [order.createdAt]);

  // Target Waiting Time from Store Settings (not hardcoded)
  const getTargetMinutes = (): number => {
    if (!storeSettings) {
      if (order.orderType === 'Delivery') return 35;
      if (order.orderType === 'Pickup') return 15;
      return 10;
    }

    if (order.orderType === 'Delivery') {
      return storeSettings.deliveryWaitingTimeMins || 35;
    } else if (order.orderType === 'Pickup') {
      return storeSettings.pickupWaitingTimeMins || 15;
    } else {
      return storeSettings.inStoreWaitingTimeMins || 10;
    }
  };

  const targetMinutes = getTargetMinutes();
  const targetSeconds = targetMinutes * 60;
  const isOverdue = elapsedSeconds > targetSeconds;

  // Format Elapsed Time MM:SS
  const formatTime = (totalSecs: number): string => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const formattedMins = mins < 10 ? `0${mins}` : `${mins}`;
    const formattedSecs = secs < 10 ? `0${secs}` : `${secs}`;
    return `${formattedMins}:${formattedSecs}`;
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 bg-red-600 text-white rounded-lg px-2.5 py-1 font-mono font-bold text-xs shadow-xs select-none ${
        compact ? 'text-[11px] px-2 py-0.5' : ''
      }`}
      title={`Target: ${targetMinutes}m • Elapsed: ${formatTime(elapsedSeconds)}`}
    >
      <Clock className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-white shrink-0 animate-spin-slow`} />
      <span className="tracking-tight text-white">{formatTime(elapsedSeconds)}</span>
      {isOverdue && (
        <span className="bg-white/20 text-white text-[9px] px-1 py-0.2 rounded font-sans font-extrabold uppercase ml-0.5 tracking-wider">
          Overdue
        </span>
      )}
    </div>
  );
};

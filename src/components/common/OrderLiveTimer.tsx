import React, { useState, useEffect } from 'react';
import { Timer, Clock, AlertTriangle } from 'lucide-react';
import { Order } from '../../types';

interface OrderLiveTimerProps {
  order: Order;
  showCountdown?: boolean;
  compact?: boolean;
}

export const OrderLiveTimer: React.FC<OrderLiveTimerProps> = ({
  order,
  showCountdown = true,
  compact = false,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const calculateElapsed = () => {
      const createdTime = new Date(order.createdAt).getTime();
      const now = Date.now();
      const diffInSec = Math.max(0, Math.floor((now - createdTime) / 1000));
      setElapsedSeconds(diffInSec);
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);
    return () => clearInterval(interval);
  }, [order.createdAt]);

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const elapsedSecs = elapsedSeconds % 60;
  const formattedElapsed = `${String(elapsedMinutes).padStart(2, '0')}:${String(elapsedSecs).padStart(2, '0')}`;

  // Color Coding based on elapsed minutes:
  // Green: <= 15 mins
  // Orange: 16-25 mins
  // Red: > 25 mins
  let colorBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let dotColor = 'bg-emerald-500';
  if (elapsedMinutes >= 25) {
    colorBadge = 'bg-red-50 text-red-700 border-red-200 animate-pulse';
    dotColor = 'bg-red-500';
  } else if (elapsedMinutes >= 16) {
    colorBadge = 'bg-amber-50 text-amber-700 border-amber-200';
    dotColor = 'bg-amber-500';
  }

  // Estimated delivery countdown calculation (for Delivery orders)
  let targetMins = 35;
  if (order.estimatedDelivery) {
    const parsed = parseInt(order.estimatedDelivery.replace(/\D/g, ''), 10);
    if (!isNaN(parsed) && parsed > 0) {
      targetMins = parsed;
    }
  }

  const targetSecondsTotal = targetMins * 60;
  const remainingSeconds = Math.max(0, targetSecondsTotal - elapsedSeconds);
  const remainingMins = Math.floor(remainingSeconds / 60);
  const remainingSecs = remainingSeconds % 60;
  const formattedRemaining = `${String(remainingMins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
  const isOverdue = elapsedSeconds > targetSecondsTotal;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border ${colorBadge}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span>{formattedElapsed}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Elapsed Timer */}
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border shadow-2xs ${colorBadge}`}>
        <Timer className="w-3.5 h-3.5 shrink-0" />
        <span>Elapsed: {formattedElapsed}</span>
      </div>

      {/* Target & Countdown for Delivery / Pickup */}
      {showCountdown && order.orderType === 'Delivery' && (
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border shadow-2xs ${
            isOverdue
              ? 'bg-red-100 text-red-800 border-red-300 animate-pulse'
              : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}
        >
          {isOverdue ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span>Overdue: +{Math.floor((elapsedSeconds - targetSecondsTotal) / 60)}m</span>
            </>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Target: {targetMins}m (Due: {formattedRemaining})</span>
            </>
          )}
        </div>
      )}

      {showCountdown && order.orderType === 'Pickup' && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
          <Clock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
          <span>Pickup Prep ({order.estimatedDelivery || '18 mins'})</span>
        </div>
      )}
    </div>
  );
};

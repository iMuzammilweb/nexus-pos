import React, { useState, useEffect } from 'react';
import {
  Lock,
  X,
  MapPin,
  Eye,
  EyeOff,
  AlertCircle,
  Delete,
  ArrowRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { useNexus } from '../../context/NexusContext';
import { Store } from '../../types';

interface StoreSwitchPinModalProps {
  targetStore: Store | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (store: Store) => void;
}

export const StoreSwitchPinModal: React.FC<StoreSwitchPinModalProps> = ({
  targetStore,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { loginStoreWithPin, currentUser } = useNexus();
  const [pinDigits, setPinDigits] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [showPinNumbers, setShowPinNumbers] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPinDigits('');
      setPinError(null);
      setShowPinNumbers(false);
      setIsVerifying(false);
    }
  }, [isOpen, targetStore]);

  if (!isOpen || !targetStore) return null;

  const handleKeyPress = (digit: string) => {
    if (pinDigits.length < 6) {
      const nextPin = pinDigits + digit;
      setPinDigits(nextPin);
      setPinError(null);
      if (nextPin.length === 6) {
        verifyPin(nextPin);
      }
    }
  };

  const handleDeleteDigit = () => {
    setPinDigits((prev) => prev.slice(0, -1));
    setPinError(null);
  };

  const handleClearPin = () => {
    setPinDigits('');
    setPinError(null);
  };

  const verifyPin = (pinToTest: string) => {
    setIsVerifying(true);
    setTimeout(() => {
      const res = loginStoreWithPin(targetStore.id, pinToTest);
      setIsVerifying(false);
      if (!res.success) {
        setPinError(res.message || 'Incorrect PIN for this store branch.');
        setPinDigits('');
      } else {
        onSuccess(targetStore);
        onClose();
      }
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white border border-[#E5EAF2] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 bg-white border-b border-[#E5EAF2] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#172033] truncate max-w-[240px]">
                {targetStore.businessName}
              </h3>
              <p className="text-xs text-[#64748B] flex items-center gap-1">
                <MapPin className="w-3 h-3 text-blue-600" />
                <span>{targetStore.postcode || targetStore.city || 'Store Terminal'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#64748B] hover:text-[#172033] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 bg-[#F8FAFC] flex flex-col items-center">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold mb-2">
              <Lock className="w-3 h-3" />
              <span>Store Terminal Security Lock</span>
            </div>
            <h4 className="text-base font-bold text-[#172033]">
              Enter Store PIN / Password
            </h4>
            <p className="text-xs text-[#64748B] mt-0.5 max-w-[280px]">
              Authentication required to switch to <strong>{targetStore.businessName}</strong>.
            </p>
          </div>

          {/* Error Message */}
          {pinError && (
            <div className="w-full mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold text-center flex items-center justify-center gap-1.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{pinError}</span>
            </div>
          )}

          {/* 6 Digit Display Boxes */}
          <div className="flex items-center justify-center gap-2.5 mb-5">
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const digit = pinDigits[index];
              const hasValue = digit !== undefined;
              return (
                <div
                  key={index}
                  className={`w-11 h-13 rounded-2xl border-2 flex items-center justify-center text-xl font-bold transition-all shadow-xs ${
                    hasValue
                      ? 'border-blue-600 bg-white text-blue-700 scale-105'
                      : 'border-[#CBD5E1] bg-white text-[#94A3B8]'
                  }`}
                >
                  {hasValue ? (
                    showPinNumbers ? (
                      digit
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full bg-blue-600" />
                    )
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-300" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Show / Hide Toggle */}
          <div className="flex items-center justify-between w-full max-w-[280px] mb-4 text-xs font-semibold text-[#64748B]">
            <button
              type="button"
              onClick={() => setShowPinNumbers(!showPinNumbers)}
              className="flex items-center gap-1.5 hover:text-[#172033] cursor-pointer"
            >
              {showPinNumbers ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPinNumbers ? 'Hide PIN' : 'Show PIN'}</span>
            </button>

            <button
              type="button"
              onClick={handleClearPin}
              className="text-red-600 hover:text-red-700 cursor-pointer"
            >
              Clear All
            </button>
          </div>

          {/* Numeric Keypad (3x4 Grid) */}
          <div className="grid grid-cols-3 gap-2.5 w-full max-w-[280px]">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeyPress(digit)}
                disabled={isVerifying || pinDigits.length >= 6}
                className="h-12 rounded-2xl bg-white hover:bg-slate-100 active:bg-blue-50 border border-[#E5EAF2] text-lg font-black text-[#172033] shadow-xs hover:border-blue-300 transition-all cursor-pointer disabled:opacity-50"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClearPin}
              className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 border border-[#E5EAF2] text-xs font-bold text-[#64748B] shadow-xs transition-all cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              disabled={isVerifying || pinDigits.length >= 6}
              className="h-12 rounded-2xl bg-white hover:bg-slate-100 active:bg-blue-50 border border-[#E5EAF2] text-lg font-black text-[#172033] shadow-xs hover:border-blue-300 transition-all cursor-pointer disabled:opacity-50"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDeleteDigit}
              className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 border border-[#E5EAF2] flex items-center justify-center text-[#64748B] hover:text-red-600 shadow-xs transition-all cursor-pointer"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Unlock Button */}
          <button
            type="button"
            onClick={() => verifyPin(pinDigits)}
            disabled={pinDigits.length < 4 || isVerifying}
            className="w-full max-w-[280px] mt-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isVerifying ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Unlock & Switch Store</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

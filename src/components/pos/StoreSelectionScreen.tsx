import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  X,
  Store as StoreIcon,
  MapPin,
  ArrowRight,
  Sparkles,
  Building2,
  CheckCircle2,
  AlertCircle,
  Phone,
  Globe,
  Lock,
  KeyRound,
  Delete,
  Eye,
  EyeOff,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { useNexus } from '../../context/NexusContext';
import { NexusLogo } from '../common/NexusLogo';
import { Store } from '../../types';

export const StoreSelectionScreen: React.FC = () => {
  const {
    stores,
    accessibleStores,
    currentStore,
    setCurrentStore,
    selectWorkingStore,
    setActiveAppView,
    returnFromStoreSelection,
    loginStoreWithPin,
    currentUser,
    logout,
  } = useNexus();

  const isStaffUser = currentUser?.role === 'STAFF';
  const storesToDisplay = isStaffUser ? accessibleStores : stores;

  const [searchQuery, setSearchQuery] = useState('');
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // 6-Digit PIN Modal State (for store branch terminal unlock)
  const [selectedStoreForPin, setSelectedStoreForPin] = useState<Store | null>(null);
  const [pinDigits, setPinDigits] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [showPinNumbers, setShowPinNumbers] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Instant reactive store filtering
  const filteredStores = useMemo(() => {
    if (!searchQuery.trim()) {
      return storesToDisplay;
    }
    const q = searchQuery.toLowerCase().trim();
    return storesToDisplay.filter((store) => {
      const name = (store.businessName || '').toLowerCase();
      const addr = (store.address || '').toLowerCase();
      const city = (store.city || '').toLowerCase();
      const postcode = (store.postcode || '').toLowerCase();
      const domain = (store.domain || store.domainName || '').toLowerCase();
      const entity = (store.legalEntityName || '').toLowerCase();

      return (
        name.includes(q) ||
        addr.includes(q) ||
        city.includes(q) ||
        postcode.includes(q) ||
        domain.includes(q) ||
        entity.includes(q)
      );
    });
  }, [storesToDisplay, searchQuery]);

  const handleCardClick = (store: Store) => {
    if (isStaffUser) {
      // Staff member is already authenticated: directly launch Staff POS for this store
      selectWorkingStore(store);
      return;
    }
    setSelectedStoreForPin(store);
    setPinDigits('');
    setPinError(null);
  };

  const handleKeyPress = (digit: string) => {
    if (pinDigits.length < 6) {
      const nextPin = pinDigits + digit;
      setPinDigits(nextPin);
      setPinError(null);
      if (nextPin.length === 6 && selectedStoreForPin) {
        verifyPin(selectedStoreForPin.id, nextPin);
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

  const verifyPin = (storeId: string, pinToTest: string) => {
    setIsVerifying(true);
    setTimeout(() => {
      const result = loginStoreWithPin(storeId, pinToTest);
      setIsVerifying(false);
      if (!result.success) {
        setPinError(result.message);
        setPinDigits('');
      } else {
        setSelectedStoreForPin(null);
      }
    }, 200);
  };

  const handleAdminBypass = (store: Store) => {
    setCurrentStore(store);
    setActiveAppView('pos-menu');
  };

  const handleImageError = (storeId: string) => {
    setImageErrors((prev) => ({ ...prev, [storeId]: true }));
  };

  // Physical keyboard listener when modal is open
  useEffect(() => {
    if (!selectedStoreForPin) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDeleteDigit();
      } else if (e.key === 'Escape') {
        setSelectedStoreForPin(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStoreForPin, pinDigits]);

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#F8FAFC] text-[#172033] select-none font-sans overflow-y-auto">
      {/* 1. Header with Nexus Logo on Left and User Controls on Right */}
      <header className="h-[70px] bg-white border-b border-[#E5EAF2] px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <NexusLogo size="md" showSubtitle={true} />
          {isStaffUser && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
              Staff POS Workspace
            </span>
          )}
        </div>

        {isStaffUser ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-[#172033]">{currentUser?.name}</span>
              <span className="text-[10px] text-blue-600 font-semibold">Authorized Operator</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-[#E5EAF2] text-[#64748B] font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <button
            onClick={returnFromStoreSelection}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-[#E5EAF2] text-[#172033] font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
            title="Return to previous screen"
          >
            <X className="w-4 h-4 text-[#64748B]" />
            <span>Back</span>
          </button>
        )}
      </header>

      {/* 2. Main Store Selection Body */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col items-center">
        {/* Title & Subtitle */}
        <div className="text-center max-w-xl mx-auto space-y-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>{isStaffUser ? 'Staff Multi-Store Assignment' : 'Store Branch Terminal Access'}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#172033] tracking-tight">
            {isStaffUser ? 'Choose Your Store Branch' : 'Select Your Store Branch'}
          </h1>
          <p className="text-sm text-[#64748B]">
            {isStaffUser
              ? `Welcome ${currentUser?.name || 'Staff'}. You have permission to access ${storesToDisplay.length} store branch${storesToDisplay.length > 1 ? 'es' : ''}. Tap a location below to start taking orders.`
              : 'Tap your store branch logo and enter your 6-digit PIN to unlock the Store POS'}
          </p>
        </div>

        {/* 3. Search Bar (Centered Pill Shape) */}
        <div className="w-full max-w-xl mx-auto mb-8">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-[#64748B] absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Store by Name, City or Postcode..."
              className="w-full pl-12 pr-12 py-3.5 rounded-full bg-white border border-[#E5EAF2] text-[#172033] text-sm md:text-base font-medium shadow-sm focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 placeholder:text-[#94A3B8] transition-all"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 p-1 rounded-full text-[#64748B] hover:text-[#172033] hover:bg-slate-100 transition-colors"
                title="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 4. Empty State: No Stores Configured in System */}
        {stores.length === 0 && (
          <div className="w-full max-w-md mx-auto my-12 bg-white rounded-2xl border border-[#E5EAF2] p-8 text-center shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100">
              <Building2 className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-[#172033]">No Stores Available</h2>
            <p className="text-xs text-[#64748B] mt-1 mb-6">
              No stores have been configured yet in your NEXUS-POS system.
            </p>
            <button
              onClick={() => {
                returnFromStoreSelection();
              }}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              Go to Store Management
            </button>
          </div>
        )}

        {/* 5. Empty State: Search Query Yields No Results */}
        {stores.length > 0 && filteredStores.length === 0 && (
          <div className="w-full max-w-md mx-auto my-12 bg-white rounded-2xl border border-[#E5EAF2] p-8 text-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-[#64748B] flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-[#172033]">No Stores Found</h2>
            <p className="text-xs text-[#64748B] mt-1 mb-5">
              No stores match your search <span className="font-semibold text-[#172033]">"{searchQuery}"</span>.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Search</span>
            </button>
          </div>
        )}

        {/* 6. Responsive Store Card Grid */}
        {filteredStores.length > 0 && (
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
            {filteredStores.map((store) => {
              const rawLogo = store.logo || store.image || (store as any).logoUrl;
              const hasLogo =
                typeof rawLogo === 'string' &&
                rawLogo.trim().length > 0 &&
                !imageErrors[store.id];
              const logoSrc = hasLogo ? rawLogo.trim() : null;
              const isActive = store.isActive ?? (store.activeStatus === 'Active');
              const isSelected = store.id === currentStore?.id;

              return (
                <div
                  key={store.id}
                  onClick={() => handleCardClick(store)}
                  className={`group relative bg-white rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden p-3.5 flex items-center gap-3.5 hover:shadow-md hover:border-blue-500 active:scale-[0.99] min-h-[110px] ${
                    isSelected
                      ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-[#E5EAF2]'
                  }`}
                >
                  {/* Active Indicator Top-Right Badge if currently active store */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-600 text-white text-[9px] font-bold">
                      <span>Selected</span>
                    </div>
                  )}

                  {/* LEFT: STORE IMAGE / LOGO */}
                  <div className="w-24 h-24 sm:w-26 sm:h-26 rounded-xl bg-slate-50 border border-[#E5EAF2] flex-shrink-0 flex items-center justify-center overflow-hidden p-2 group-hover:bg-blue-50/50 transition-colors">
                    {hasLogo && logoSrc ? (
                      <img
                        src={logoSrc}
                        alt={store.businessName}
                        onError={() => handleImageError(store.id)}
                        className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-1">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          {store.businessName
                            ? store.businessName.substring(0, 2).toUpperCase()
                            : 'NX'}
                        </div>
                        <span className="text-[9px] font-bold text-[#64748B] mt-1 truncate max-w-[80px]">
                          NEXUS
                        </span>
                      </div>
                    )}
                  </div>

                  {/* RIGHT: STORE INFORMATION */}
                  <div className="flex-1 flex flex-col justify-between h-full py-0.5 min-w-0 pr-1">
                    <div>
                      {/* Store Name */}
                      <h3 className="font-bold text-sm sm:text-base text-[#172033] group-hover:text-blue-600 transition-colors line-clamp-1 truncate" title={store.businessName}>
                        {store.businessName}
                      </h3>

                      {/* Full Address */}
                      <p className="text-xs text-[#64748B] line-clamp-1 mt-0.5 truncate" title={store.address}>
                        {store.address || 'Address not configured'}
                      </p>

                      {/* City, Postcode */}
                      <div className="text-xs font-semibold text-blue-600 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                        <span className="truncate">
                          {store.city ? `${store.city}, ` : ''}
                          {store.postcode || 'UK'}
                        </span>
                      </div>
                    </div>

                    {/* Bottom row: Status badge + CTA */}
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#F1F5F9]">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />}
                        <span>{isActive ? 'Active' : 'Inactive'}</span>
                      </span>

                      {isStaffUser ? (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded-lg group-hover:scale-105 transition-all shadow-xs">
                          <span>Select Branch</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                          <KeyRound className="w-3 h-3" />
                          <span>Enter 6-Digit PIN</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 7. 6-DIGIT PIN AUTHENTICATION MODAL */}
      {selectedStoreForPin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-[#E5EAF2] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 pt-6 pb-4 bg-white border-b border-[#E5EAF2] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033] truncate max-w-[240px]">
                    {selectedStoreForPin.businessName}
                  </h3>
                  <p className="text-xs text-[#64748B] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-blue-600" />
                    <span>{selectedStoreForPin.postcode || selectedStoreForPin.city || 'Store Terminal'}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStoreForPin(null)}
                className="p-2 rounded-xl text-[#64748B] hover:text-[#172033] hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 bg-[#F8FAFC] flex flex-col items-center">
              {/* Store Logo Banner */}
              <div className="w-16 h-16 rounded-2xl bg-white border border-[#E5EAF2] p-2 flex items-center justify-center mb-3 shadow-xs">
                {selectedStoreForPin.logo || selectedStoreForPin.image ? (
                  <img
                    src={selectedStoreForPin.logo || selectedStoreForPin.image}
                    alt={selectedStoreForPin.businessName}
                    className="w-full h-full object-contain rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <StoreIcon className="w-8 h-8 text-blue-600" />
                )}
              </div>

              <div className="text-center mb-4">
                <h4 className="text-base font-bold text-[#172033]">
                  Enter 6-Digit Store Password / PIN
                </h4>
                <p className="text-xs text-[#64748B] mt-0.5">
                  No email required. Enter your branch PIN to unlock this terminal.
                </p>
                <span className="inline-block mt-1 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  Demo Default PIN: 123456
                </span>
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
                  <span>{showPinNumbers ? 'Hide PIN Digits' : 'Show PIN Digits'}</span>
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
                onClick={() => verifyPin(selectedStoreForPin.id, pinDigits)}
                disabled={pinDigits.length < 4 || isVerifying}
                className="w-full max-w-[280px] mt-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isVerifying ? (
                  <span>Unlocking Store POS...</span>
                ) : (
                  <>
                    <span>Unlock Store POS</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Admin Bypass (If Super Admin is currently logged in) */}
              {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN') && (
                <button
                  type="button"
                  onClick={() => handleAdminBypass(selectedStoreForPin)}
                  className="mt-3 text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 cursor-pointer bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Super Admin Master Bypass (Direct Launch)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

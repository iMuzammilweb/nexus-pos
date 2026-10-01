import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapPin,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Navigation,
  Sparkles,
  Building2,
  X,
  Compass,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import {
  searchAddressSuggestions,
  extractStructuredAddress,
  validateStoreDelivery,
  AddressSuggestion,
  StructuredAddress,
  DeliveryValidationResult,
} from '../../services/googleMapsService';
import { Store } from '../../types';
import { useNexus } from '../../context/NexusContext';

interface DeliveryAddressSearchProps {
  currentStore: Store;
  selectedAddress: StructuredAddress | null;
  onAddressSelect: (address: StructuredAddress, validation: DeliveryValidationResult) => void;
  disabled?: boolean;
}

export const DeliveryAddressSearch: React.FC<DeliveryAddressSearchProps> = ({
  currentStore,
  selectedAddress,
  onAddressSelect,
  disabled = false,
}) => {
  const { deliverySettingsMap, deliveryZones } = useNexus();
  const settings = deliverySettingsMap[currentStore.id];
  const zones = useMemo(
    () => deliveryZones.filter((z) => z.storeId === currentStore.id),
    [deliveryZones, currentStore.id]
  );
  // Parents pass a fresh object each render; key on its contents so the sync effect doesn't loop
  const selectedAddressKey = selectedAddress
    ? `${selectedAddress.placeId}|${selectedAddress.fullAddress}|${selectedAddress.postcode}`
    : '';

  const [searchInput, setSearchInput] = useState(selectedAddress?.fullAddress || '');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [validationResult, setValidationResult] = useState<DeliveryValidationResult | null>(null);

  // Manual breakdown overrides
  const [houseNumber, setHouseNumber] = useState(selectedAddress?.houseNumber || '');
  const [street, setStreet] = useState(selectedAddress?.street || '');
  const [town, setTown] = useState(selectedAddress?.town || '');
  const [postcode, setPostcode] = useState(selectedAddress?.postcode || '');
  const [county, setCounty] = useState(selectedAddress?.county || '');

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state if selectedAddress changes externally
  useEffect(() => {
    if (selectedAddress) {
      setSearchInput(selectedAddress.fullAddress);
      setHouseNumber(selectedAddress.houseNumber || '');
      setStreet(selectedAddress.street || '');
      setTown(selectedAddress.town || '');
      setPostcode(selectedAddress.postcode || '');
      setCounty(selectedAddress.county || '');

      const val = validateStoreDelivery(
        currentStore,
        selectedAddress.latitude,
        selectedAddress.longitude,
        selectedAddress.postcode,
        selectedAddress.fullAddress,
        settings,
        zones
      );
      setValidationResult(val);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddressKey, currentStore.id, settings, zones]);

  // Handle Search Input with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchInput(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length < 2) {
      setSuggestions([]);
      setIsDropdownOpen(false);
      return;
    }

    setIsSearching(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchAddressSuggestions(val);
        setSuggestions(results);
        setIsDropdownOpen(true);
      } catch (err) {
        console.warn('Address search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);
  };

  // Select a suggestion
  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    const structured = extractStructuredAddress(suggestion);
    setSearchInput(structured.fullAddress);
    setHouseNumber(structured.houseNumber);
    setStreet(structured.street);
    setTown(structured.town);
    setPostcode(structured.postcode);
    setCounty(structured.county);
    setIsDropdownOpen(false);

    const val = validateStoreDelivery(
      currentStore,
      structured.latitude,
      structured.longitude,
      structured.postcode,
      structured.fullAddress,
      settings,
      zones
    );
    setValidationResult(val);
    onAddressSelect(structured, val);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update structured fields when manually edited
  const handleFieldChange = (
    field: 'houseNumber' | 'street' | 'town' | 'postcode' | 'county',
    value: string
  ) => {
    const updated = {
      houseNumber: field === 'houseNumber' ? value : houseNumber,
      street: field === 'street' ? value : street,
      town: field === 'town' ? value : town,
      postcode: field === 'postcode' ? value : postcode,
      county: field === 'county' ? value : county,
      buildingName: selectedAddress?.buildingName || '',
      city: field === 'town' ? value : town,
      country: 'United Kingdom',
      fullAddress: `${field === 'houseNumber' ? value : houseNumber} ${field === 'street' ? value : street}, ${
        field === 'town' ? value : town
      }, ${field === 'postcode' ? value : postcode}, UK`.replace(/^\s+/, ''),
      latitude: selectedAddress?.latitude || 51.5133,
      longitude: selectedAddress?.longitude || -0.1365,
      placeId: selectedAddress?.placeId || `manual_${Date.now()}`,
    };

    if (field === 'houseNumber') setHouseNumber(value);
    if (field === 'street') setStreet(value);
    if (field === 'town') setTown(value);
    if (field === 'postcode') setPostcode(value);
    if (field === 'county') setCounty(value);
    setSearchInput(updated.fullAddress);

    const val = validateStoreDelivery(
      currentStore,
      updated.latitude,
      updated.longitude,
      updated.postcode,
      updated.fullAddress,
      settings,
      zones
    );
    setValidationResult(val);
    onAddressSelect(updated, val);
  };

  return (
    <div className="space-y-3" ref={searchContainerRef}>
      {/* 1. Address Search Bar with Google Maps Suggestions */}
      <div className="relative">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>Search Delivery Address / Postcode</span>
          </label>
          <span className="text-[10px] text-[#64748B] flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-600" />
            <span>Google Maps Live Suggestions</span>
          </span>
        </div>

        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            disabled={disabled}
            value={searchInput}
            onChange={handleInputChange}
            onFocus={() => {
              if (suggestions.length > 0) setIsDropdownOpen(true);
            }}
            placeholder="Search UK Postcode, House No, Street name, or Full address..."
            className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-slate-50 border border-[#E5EAF2] text-xs font-medium text-[#172033] focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-[#94A3B8]"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSuggestions([]);
                setIsDropdownOpen(false);
              }}
              className="absolute right-10 p-1 text-[#94A3B8] hover:text-[#172033] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {isSearching && (
            <div className="absolute right-3.5">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {isDropdownOpen && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-[#E5EAF2] shadow-2xl z-50 overflow-hidden max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-1.5 bg-slate-50 border-b border-[#E5EAF2] flex items-center justify-between text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
              <span>Verified Address Suggestions</span>
              <span>Google Maps Platform</span>
            </div>
            {suggestions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50/70 border-b border-slate-100 transition-colors flex items-start gap-2.5 group cursor-pointer"
              >
                <div className="p-1 rounded-lg bg-slate-100 group-hover:bg-blue-100 text-slate-500 group-hover:text-blue-600 mt-0.5 shrink-0 transition-colors">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-[#172033] group-hover:text-blue-700 truncate">
                    {item.mainText}
                  </div>
                  <div className="text-[11px] text-[#64748B] truncate mt-0.5">
                    {item.secondaryText || item.description}
                  </div>
                </div>
                {item.postcode && (
                  <span className="shrink-0 px-2 py-0.5 rounded bg-slate-100 text-[#172033] font-mono text-[10px] font-bold border border-slate-200">
                    {item.postcode}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Admin Restriction Warning (Shown ONLY if Admin restricted this address or postcode) */}
      {validationResult?.isRestricted && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 shadow-xs animate-in fade-in">
          <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600 shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-rose-900">Restricted Delivery Area</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-200 text-rose-800 font-mono">
                Admin Blocked
              </span>
            </div>
            <p className="text-xs text-rose-700 mt-1 font-medium">
              {validationResult.message}
            </p>
            <p className="text-[11px] text-rose-600 mt-1">
              Delivery orders cannot proceed to this location. Please check Admin settings or choose an alternative address.
            </p>
          </div>
        </div>
      )}

      {/* 3. Address Accepted Status (Shown when address is selected and NOT restricted) */}
      {selectedAddress && !validationResult?.isRestricted && (
        <div className="flex items-center justify-between text-xs text-emerald-800 bg-emerald-50/80 px-3 py-1.5 rounded-xl border border-emerald-200 animate-in fade-in">
          <div className="flex items-center gap-1.5 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Delivery Address Accepted</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-medium">Standard Delivery Active</span>
        </div>
      )}

      {/* 4. Structured Address Breakdown Form Fields */}
      <div className="p-3.5 rounded-xl border border-[#E5EAF2] bg-white grid grid-cols-1 sm:grid-cols-4 gap-2.5 shadow-2xs">
        <div>
          <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">
            House / Flat No
          </label>
          <input
            type="text"
            disabled={disabled}
            value={houseNumber}
            onChange={(e) => handleFieldChange('houseNumber', e.target.value)}
            placeholder="e.g. 42 or Flat 3"
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-[#E5EAF2] text-xs font-semibold text-[#172033] focus:bg-white focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">
            Street Name
          </label>
          <input
            type="text"
            disabled={disabled}
            value={street}
            onChange={(e) => handleFieldChange('street', e.target.value)}
            placeholder="e.g. Old Compton Street"
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-[#E5EAF2] text-xs font-semibold text-[#172033] focus:bg-white focus:outline-none focus:border-blue-600"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">
            Postcode
          </label>
          <input
            type="text"
            disabled={disabled}
            value={postcode}
            onChange={(e) => handleFieldChange('postcode', e.target.value.toUpperCase())}
            placeholder="e.g. W1D 4AG"
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-[#E5EAF2] text-xs font-bold text-[#172033] font-mono focus:bg-white focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>
    </div>
  );
};

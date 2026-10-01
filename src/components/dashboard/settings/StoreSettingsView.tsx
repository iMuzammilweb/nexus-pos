import React, { useState } from 'react';
import {
  Store,
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  Sliders,
  DollarSign,
  Clock,
  ShieldCheck,
  Check,
  RefreshCw,
  Sparkles,
  Truck,
  ShoppingBag,
  Utensils,
  Tv,
  Gift,
  BarChart3,
  HelpCircle,
  Save,
  Image,
  Layers,
  Heart,
  QrCode,
  Zap,
  KeyRound,
  Navigation,
  Lock,
} from 'lucide-react';
import { useNexus } from '../../../context/NexusContext';
import { StoreSettingsData } from '../../../types';
import { INITIAL_STORE_SETTINGS } from '../../../data/seedData';
import { geocodeAddressWithPostcode } from '../../../services/googleMapsService';

export const StoreSettingsView: React.FC = () => {
  const { currentStore, updateStore, storeSettings, updateStoreSettings, currentUser, changeStorePassword } = useNexus();
  const [formData, setFormData] = useState<StoreSettingsData>(storeSettings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Store POS Password & 6-Digit PIN Management (Admin-only)
  const [storeOldPass, setStoreOldPass] = useState('');
  const [storeNewPass, setStoreNewPass] = useState('');
  const [storeConfirmPass, setStoreConfirmPass] = useState('');
  const [storeNewPin, setStoreNewPin] = useState(currentStore.storePin || '123456');
  const [storePassMsg, setStorePassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-xl mx-auto bg-white rounded-2xl border border-[#E5EAF2] shadow-xs text-center my-12">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-[#172033]">Basic Store Settings & Passwords Restricted</h3>
        <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
          Basic store settings, order fulfillment parameters, and store passwords can only be changed and viewed by the Super Admin.
        </p>
        <div className="mt-4 pt-4 border-t border-[#E5EAF2] text-[11px] text-[#94A3B8]">
          Store POS and Staff POS can only operate menu, orders, table management, printer devices, add-ons, customer database, daily reports, and promotions.
        </div>
      </div>
    );
  }

  const handleChange = <K extends keyof StoreSettingsData>(field: K, value: StoreSettingsData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleGeocodeStore = async () => {
    setIsGeocoding(true);
    try {
      const geo = await geocodeAddressWithPostcode(formData.address, formData.postcode);
      if (geo) {
        updateStore(currentStore.id, {
          latitude: geo.lat,
          longitude: geo.lng,
        });
        alert(`Branch location GPS verified!\nLatitude: ${geo.lat}\nLongitude: ${geo.lng}`);
      } else {
        alert('Could not pinpoint GPS from this address. Please ensure postcode is valid.');
      }
    } catch {
      alert('Geocoding service unavailable.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleStorePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setStorePassMsg(null);

    if (!isAdmin) {
      setStorePassMsg({
        type: 'error',
        text: 'Access Denied: Only Super Admin / Owner has permission to alter Store passwords or PINs.',
      });
      return;
    }

    if (!storeNewPass || storeNewPass.length < 4) {
      setStorePassMsg({ type: 'error', text: 'New password must be at least 4 characters.' });
      return;
    }

    if (storeNewPass !== storeConfirmPass) {
      setStorePassMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    const cleanPin = storeNewPin.trim();
    if (cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
      setStorePassMsg({ type: 'error', text: 'Store PIN must be exactly 6 digits (numbers only).' });
      return;
    }

    const res = changeStorePassword(currentStore.id, storeNewPass, cleanPin);
    if (res.success) {
      setStorePassMsg({ type: 'success', text: `Credentials & 6-Digit PIN (${cleanPin}) updated for ${currentStore.businessName}!` });
      setStoreOldPass('');
      setStoreNewPass('');
      setStoreConfirmPass('');
    } else {
      setStorePassMsg({ type: 'error', text: res.message });
    }
    setTimeout(() => setStorePassMsg(null), 4000);
  };

  const handleResetDefaults = () => {
    if (confirm('Reset store settings to system defaults?')) {
      setFormData(INITIAL_STORE_SETTINGS);
      updateStoreSettings(INITIAL_STORE_SETTINGS);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6" id="store-settings-form">
      {/* Top Header & Save Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E5EAF2] rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-blue-600">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#172033] flex items-center gap-2">
              Store & Operational Settings
              {savedSuccess && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
                  Settings Saved
                </span>
              )}
            </h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Configure restaurant identity, fulfillment services, POS terminal defaults, and live ordering rules.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-[#64748B] hover:text-[#172033] rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Reset Defaults
          </button>
          <button
            type="submit"
            id="btn-save-store-settings"
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save Store Settings
          </button>
        </div>
      </div>

      {/* Two-Column Comprehensive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Identity, Contact, Media & Fulfillment */}
        {/* ========================================================================= */}
        <div className="space-y-6">
          {/* 1. Restaurant & Company Details */}
          <div className="bg-white border border-[#E5EAF2] rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#172033] flex items-center gap-2 pb-3 border-b border-[#E5EAF2]">
              <Building2 className="w-4 h-4 text-blue-600" />
              1. Restaurant & Company Identity
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[#64748B] font-bold mb-1">Trading Name *</label>
                <input
                  type="text"
                  required
                  value={formData.businessName || ''}
                  onChange={(e) => handleChange('businessName', e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600 font-bold"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">Legal Entity / Registered Ltd</label>
                <input
                  type="text"
                  value={formData.legalEntityName || ''}
                  onChange={(e) => handleChange('legalEntityName', e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">Branch Code</label>
                <input
                  type="text"
                  value={formData.branchCode || ''}
                  onChange={(e) => handleChange('branchCode', e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-blue-600 font-mono font-bold focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">Cuisine Type</label>
                <input
                  type="text"
                  value={formData.cuisineType || ''}
                  onChange={(e) => handleChange('cuisineType', e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">VAT / Tax ID Number</label>
                <input
                  type="text"
                  value={formData.taxNumber || ''}
                  onChange={(e) => handleChange('taxNumber', e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">Default Currency Symbol</label>
                <input
                  type="text"
                  value={formData.currencySymbol || '£'}
                  onChange={(e) => handleChange('currencySymbol', e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600 font-bold text-center"
                />
              </div>
            </div>
          </div>

          {/* 2. Contact & Physical Location */}
          <div className="bg-white border border-[#E5EAF2] rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#172033] flex items-center gap-2 pb-3 border-b border-[#E5EAF2]">
              <MapPin className="w-4 h-4 text-blue-600" />
              2. Contact & Physical Store Location
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[#64748B] font-bold mb-1">Store Phone Number *</label>
                <input
                  type="text"
                  required
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">Store Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[#64748B] font-bold mb-1">Custom Domain / Web URL</label>
                <input
                  type="text"
                  value={formData.domainUrl || ''}
                  onChange={(e) => handleChange('domainUrl', e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-blue-600 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[#64748B] font-bold mb-1">Street Address *</label>
                <input
                  type="text"
                  required
                  value={formData.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">City / Region *</label>
                <input
                  type="text"
                  required
                  value={formData.city || ''}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">Postcode *</label>
                <input
                  type="text"
                  required
                  value={formData.postcode || ''}
                  onChange={(e) => handleChange('postcode', e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600 uppercase font-bold"
                />
              </div>
            </div>
          </div>

          {/* 3. Media Assets & Brand Identity */}
          <div className="bg-white border border-[#E5EAF2] rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#172033] flex items-center gap-2 pb-3 border-b border-[#E5EAF2]">
              <Image className="w-4 h-4 text-blue-600" />
              3. Media Assets & Logos
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#64748B] font-bold mb-1">Store Logo URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.logoUrl}
                    onChange={(e) => handleChange('logoUrl', e.target.value)}
                    className="flex-1 bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600"
                  />
                  {formData.logoUrl && formData.logoUrl.trim() !== '' ? (
                    <img
                      src={formData.logoUrl.trim()}
                      alt="Logo preview"
                      className="w-9 h-9 rounded object-cover border border-[#E5EAF2] bg-[#F8FAFC]"
                    />
                  ) : null}
                </div>
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">Favicon URL</label>
                <input
                  type="url"
                  value={formData.faviconUrl || ''}
                  onChange={(e) => handleChange('faviconUrl', e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">Web Banner Image URL</label>
                <input
                  type="url"
                  value={formData.bannerImageUrl || ''}
                  onChange={(e) => handleChange('bannerImageUrl', e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* 4. Fulfillment & Services Toggles */}
          <div className="bg-white border border-[#E5EAF2] rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#172033] flex items-center gap-2 pb-3 border-b border-[#E5EAF2]">
              <Truck className="w-4 h-4 text-blue-600" />
              4. Google Maps Delivery Radius & Geofencing Control
            </h2>

            <div className="space-y-3 text-xs">
              {/* Delivery Service */}
              <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E5EAF2] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="font-bold text-[#172033] block">Delivery Service Active</span>
                      <span className="text-[11px] text-[#64748B]">
                        Enable door-to-door delivery order fulfillment with Google Maps validation
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isDeliveryEnabled}
                    onChange={(e) => handleChange('isDeliveryEnabled', e.target.checked)}
                    className="w-5 h-5 rounded text-blue-600 cursor-pointer"
                  />
                </div>

                {formData.isDeliveryEnabled && (
                  <div className="space-y-3 pt-2 border-t border-[#E5EAF2]">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[#64748B] font-bold mb-1">Standard Fee (£)</label>
                        <input
                          type="number"
                          step="0.10"
                          min="0"
                          value={formData.deliveryFee}
                          onChange={(e) => handleChange('deliveryFee', Number(e.target.value))}
                          className="w-full bg-white border border-[#E5EAF2] rounded px-2.5 py-1 text-[#172033] font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[#64748B] font-bold mb-1">Min Order (£)</label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={formData.minDeliveryOrder}
                          onChange={(e) => handleChange('minDeliveryOrder', Number(e.target.value))}
                          className="w-full bg-white border border-[#E5EAF2] rounded px-2.5 py-1 text-[#172033] font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[#64748B] font-bold mb-1">Free Delivery Over (£)</label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={formData.freeDeliveryThreshold}
                          onChange={(e) => handleChange('freeDeliveryThreshold', Number(e.target.value))}
                          className="w-full bg-white border border-[#E5EAF2] rounded px-2.5 py-1 text-blue-600 font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E5EAF2]">
                      <div>
                        <label className="block text-[#64748B] font-bold mb-1">
                          Delivery Radius Limit (Miles)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          max="50"
                          value={currentStore.deliveryRadiusMiles || 5}
                          onChange={(e) => updateStore(currentStore.id, { deliveryRadiusMiles: Number(e.target.value) })}
                          className="w-full bg-white border border-[#E5EAF2] rounded px-2.5 py-1.5 text-[#172033] font-bold"
                        />
                        <span className="text-[10px] text-[#64748B] block mt-0.5">
                          Calculated via live Google Maps coordinates
                        </span>
                      </div>

                      <div>
                        <label className="block text-[#64748B] font-bold mb-1">
                          Allowed Postcode Zones (Comma separated)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. W1, WC2, SW1, EC1, NW1"
                          value={(currentStore.allowedPostcodes || []).join(', ')}
                          onChange={(e) => {
                            const codes = e.target.value.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
                            updateStore(currentStore.id, { allowedPostcodes: codes });
                          }}
                          className="w-full bg-white border border-[#E5EAF2] rounded px-2.5 py-1.5 text-[#172033] font-bold font-mono uppercase"
                        />
                        <span className="text-[10px] text-[#64748B] block mt-0.5">
                          Leave empty to allow all addresses within radius
                        </span>
                      </div>
                    </div>

                    {/* Geocoding validation button */}
                    <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                        <div className="text-[11px]">
                          <span className="font-bold text-blue-900 block">Branch GPS Coordinates</span>
                          <span className="text-blue-700 font-mono">
                            Lat: {currentStore.latitude || 51.5074}, Lng: {currentStore.longitude || -0.1278}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleGeocodeStore}
                        disabled={isGeocoding}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {isGeocoding ? 'Locating...' : 'Verify GPS Location'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Pickup / Collection Service */}
              <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E5EAF2] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-4 h-4 text-blue-600" />
                  <div>
                    <span className="font-bold text-[#172033] block">Collection / Takeaway Active</span>
                    <span className="text-[11px] text-[#64748B]">
                      Enable in-store customer pickup orders
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isPickupEnabled}
                  onChange={(e) => handleChange('isPickupEnabled', e.target.checked)}
                  className="w-5 h-5 rounded text-blue-600 cursor-pointer"
                />
              </div>

              {/* Dine-In Table Service */}
              <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E5EAF2] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Utensils className="w-4 h-4 text-blue-600" />
                  <div>
                    <span className="font-bold text-[#172033] block">Dine-In Table Service Active</span>
                    <span className="text-[11px] text-[#64748B]">
                      Enable Table ordering & seat management
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isDineInEnabled}
                  onChange={(e) => handleChange('isDineInEnabled', e.target.checked)}
                  className="w-5 h-5 rounded text-blue-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: POS Display, Operations, CFD & Integrations */}
        {/* ========================================================================= */}
        <div className="space-y-6">
          {/* 5. Operational Waiting Times & Fees */}
          <div className="bg-white border border-[#E5EAF2] rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#172033] flex items-center gap-2 pb-3 border-b border-[#E5EAF2]">
              <Clock className="w-4 h-4 text-blue-600" />
              5. Operational Waiting Times & Order Surcharges
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[#64748B] font-bold mb-1">Delivery Time (mins)</label>
                <input
                  type="number"
                  min="5"
                  value={formData.deliveryWaitingTimeMins}
                  onChange={(e) => handleChange('deliveryWaitingTimeMins', Number(e.target.value))}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] font-bold"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">Pickup Time (mins)</label>
                <input
                  type="number"
                  min="5"
                  value={formData.pickupWaitingTimeMins}
                  onChange={(e) => handleChange('pickupWaitingTimeMins', Number(e.target.value))}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] font-bold"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">In-Store Prep (mins)</label>
                <input
                  type="number"
                  min="3"
                  value={formData.inStoreWaitingTimeMins}
                  onChange={(e) => handleChange('inStoreWaitingTimeMins', Number(e.target.value))}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-[#E5EAF2]">
              <div>
                <label className="block text-[#64748B] font-bold mb-1">Service Charge (%)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.serviceChargePercent}
                  onChange={(e) => handleChange('serviceChargePercent', Number(e.target.value))}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-blue-600 font-bold"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">Carrier Bag Charge (£)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  value={formData.bagChargeAmount}
                  onChange={(e) => handleChange('bagChargeAmount', Number(e.target.value))}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] font-bold"
                />
              </div>
            </div>
          </div>

          {/* 6. POS Terminal & Grid Layout Configuration */}
          <div className="bg-white border border-[#E5EAF2] rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#172033] flex items-center gap-2 pb-3 border-b border-[#E5EAF2]">
              <Layers className="w-4 h-4 text-blue-600" />
              6. POS Terminal Layout & Display Settings
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[#64748B] font-bold mb-1">Product Columns on POS Screen</label>
                <select
                  value={formData.posProductColumns}
                  onChange={(e) => handleChange('posProductColumns', Number(e.target.value) as 4 | 5 | 6)}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] font-bold focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value={4}>4 Columns (Large Cards)</option>
                  <option value={5}>5 Columns (Standard)</option>
                  <option value={6}>6 Columns (Compact Touch Grid)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">Web Ordering Display Mode</label>
                <select
                  value={formData.webOrderingLayout}
                  onChange={(e) =>
                    handleChange('webOrderingLayout', e.target.value as 'horizontal-tabs' | 'vertical-sidebar')
                  }
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] font-bold focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="horizontal-tabs">Horizontal Category Tabs</option>
                  <option value="vertical-sidebar">Vertical Category Sidebar</option>
                </select>
              </div>
            </div>

            {/* Customer Facing Display */}
            <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E5EAF2] space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tv className="w-4 h-4 text-blue-600" />
                  <div>
                    <span className="font-bold text-[#172033] block">Customer Facing Display (CFD)</span>
                    <span className="text-[11px] text-[#64748B]">
                      Secondary screen mirror for customer itemization & totals
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isCustomerFacingDisplayEnabled}
                  onChange={(e) =>
                    handleChange('isCustomerFacingDisplayEnabled', e.target.checked)
                  }
                  className="w-5 h-5 rounded text-blue-600 cursor-pointer"
                />
              </div>

              {formData.isCustomerFacingDisplayEnabled && (
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">CFD Screen Welcome Message</label>
                  <input
                    type="text"
                    value={formData.customerDisplayWelcomeText}
                    onChange={(e) => handleChange('customerDisplayWelcomeText', e.target.value)}
                    className="w-full bg-white border border-[#E5EAF2] rounded px-2.5 py-1.5 text-[#172033]"
                  />
                </div>
              )}
            </div>

            {/* Surprise Mystery Box Feature */}
            <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E5EAF2] space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-blue-600" />
                  <div>
                    <span className="font-bold text-[#172033] block">"Surprise Mystery Meal Box" Feature</span>
                    <span className="text-[11px] text-[#64748B]">
                      Offer discounted chef surprise items to reduce surplus food
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.surpriseBoxEnabled}
                  onChange={(e) => handleChange('surpriseBoxEnabled', e.target.checked)}
                  className="w-5 h-5 rounded text-blue-600 cursor-pointer"
                />
              </div>

              {formData.surpriseBoxEnabled && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E5EAF2]">
                  <div>
                    <label className="block text-[#64748B] font-bold mb-1">Mystery Box Price (£)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.surpriseBoxPrice}
                      onChange={(e) => handleChange('surpriseBoxPrice', Number(e.target.value))}
                      className="w-full bg-white border border-[#E5EAF2] rounded px-2.5 py-1 text-blue-600 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[#64748B] font-bold mb-1">Discount %</label>
                    <input
                      type="number"
                      value={formData.surpriseBoxDiscountPercent}
                      onChange={(e) =>
                        handleChange('surpriseBoxDiscountPercent', Number(e.target.value))
                      }
                      className="w-full bg-white border border-[#E5EAF2] rounded px-2.5 py-1 text-[#172033] font-bold"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 7. SEO, Analytics & Advanced Integrations */}
          <div className="bg-white border border-[#E5EAF2] rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#172033] flex items-center gap-2 pb-3 border-b border-[#E5EAF2]">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              7. SEO & Analytics Tracking
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#64748B] font-bold mb-1">Meta SEO Title</label>
                <input
                  type="text"
                  value={formData.seoMetaTitle || ''}
                  onChange={(e) => handleChange('seoMetaTitle', e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">Meta SEO Description</label>
                <textarea
                  rows={2}
                  value={formData.seoMetaDescription || ''}
                  onChange={(e) => handleChange('seoMetaDescription', e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Google Analytics ID</label>
                  <input
                    type="text"
                    placeholder="G-XXXXXXX"
                    value={formData.googleAnalyticsId || ''}
                    onChange={(e) => handleChange('googleAnalyticsId', e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Facebook Pixel ID</label>
                  <input
                    type="text"
                    placeholder="Pixel ID"
                    value={formData.facebookPixelId || ''}
                    onChange={(e) => handleChange('facebookPixelId', e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 8. Executive Administration, Store POS Password & CEO Details */}
          <div className="bg-white border border-[#E5EAF2] rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#172033] flex items-center gap-2 pb-3 border-b border-[#E5EAF2]">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              8. Store POS Security & CEO / Director Protected Profile
            </h2>

            <div className="space-y-4 text-xs">
              {/* Store POS Password & 6-Digit PIN Update Card */}
              <div className="p-4 bg-slate-50 border border-[#E5EAF2] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="font-bold text-[#172033] block">
                        Branch POS Password & 6-Digit PIN ({currentStore.businessName})
                      </span>
                      <span className="text-[11px] text-[#64748B]">
                        Super Admin control: modify login password and the 6-digit terminal PIN
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isAdmin
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {isAdmin ? 'ADMIN ONLY' : 'LOCKED (ADMIN REQUIRED)'}
                  </span>
                </div>

                {storePassMsg && (
                  <div
                    className={`p-2.5 rounded-lg text-xs font-semibold ${
                      storePassMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {storePassMsg.text}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[#64748B] font-bold mb-1">New Store Password</label>
                    <input
                      type="password"
                      placeholder="New password"
                      disabled={!isAdmin}
                      value={storeNewPass}
                      onChange={(e) => setStoreNewPass(e.target.value)}
                      className="w-full bg-white border border-[#E5EAF2] rounded px-2.5 py-1.5 text-[#172033] disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[#64748B] font-bold mb-1">Confirm Password</label>
                    <input
                      type="password"
                      placeholder="Confirm password"
                      disabled={!isAdmin}
                      value={storeConfirmPass}
                      onChange={(e) => setStoreConfirmPass(e.target.value)}
                      className="w-full bg-white border border-[#E5EAF2] rounded px-2.5 py-1.5 text-[#172033] disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[#64748B] font-bold mb-1">6-Digit Store PIN</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      disabled={!isAdmin}
                      value={storeNewPin}
                      onChange={(e) => setStoreNewPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-white border border-[#E5EAF2] rounded px-2.5 py-1.5 text-blue-700 font-mono font-bold tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-[#64748B]">
                    Current 6-Digit PIN: <strong className="font-mono text-[#172033]">{currentStore.storePin || '123456'}</strong>
                  </span>
                  <button
                    type="button"
                    disabled={!isAdmin}
                    onClick={handleStorePasswordChange}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-xs font-bold shadow-xs cursor-pointer disabled:cursor-not-allowed"
                  >
                    Save Credentials & PIN
                  </button>
                </div>
              </div>

              {/* Protected CEO Profile */}
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="font-bold text-blue-900 block">CEO / Director Information</span>
                      <span className="text-[11px] text-blue-700">
                        Protected by Super Admin authority & master permissions
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                    PROTECTED
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">CEO / Director Name</label>
                    <input
                      type="text"
                      readOnly
                      value="Styris Happy"
                      className="w-full bg-white/80 border border-blue-200 rounded-lg px-3 py-2 text-[#172033] font-bold cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">CEO Master Email</label>
                    <input
                      type="email"
                      readOnly
                      value="styrishaappy@gmail.com"
                      className="w-full bg-white/80 border border-blue-200 rounded-lg px-3 py-2 text-blue-700 font-medium cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">POS Visual Theme Mode</label>
                <div className="flex bg-[#F8FAFC] p-1 rounded-lg border border-[#E5EAF2]">
                  <button
                    type="button"
                    className="flex-1 py-1 text-center rounded text-xs font-bold bg-white text-blue-600 shadow-xs border border-blue-200"
                  >
                    Nexus Blue & White
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-1 text-center rounded text-xs font-medium text-[#64748B] hover:text-[#172033]"
                  >
                    High-Contrast Light
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

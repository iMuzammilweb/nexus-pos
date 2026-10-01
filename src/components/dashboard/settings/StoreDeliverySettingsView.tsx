import React, { useState, useEffect } from 'react';
import {
  Truck,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Save,
  Search,
  Check,
  Compass,
  DollarSign,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useNexus } from '../../../context/NexusContext';
import { DeliveryZone, StoreDeliverySettings, Store, DeliveryRuleType } from '../../../types';
import { parseUKPostcode, normalizeUKPostcode } from '../../../utils/postcodeHelper';
import { firestoreService } from '../../../services/firestoreService';
import { checkDeliveryAvailability } from '../../../services/deliveryService';

export const StoreDeliverySettingsView: React.FC = () => {
  const { currentStore, stores, setCurrentStore, currentUser, logActivity, addNotification } = useNexus();

  // Selected Store state (Admin can switch stores, Store role is fixed to their store)
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  // Delivery Settings state
  const [deliverySettings, setDeliverySettings] = useState<StoreDeliverySettings>({
    storeId: currentStore.id,
    enabled: currentStore.isDeliveryEnabled ?? true,
    method: 'postcode',
    radiusMiles: currentStore.deliveryRadiusMiles ?? 5.0,
    defaultFee: currentStore.deliveryFee ?? 2.5,
    defaultMinimumOrder: currentStore.minimumDeliveryOrder ?? 12.0,
    defaultEstimatedTime: '30–45 minutes',
    storeAddress: currentStore.address || '42 Old Compton Street, Soho, London',
    storeLatitude: currentStore.latitude || 51.5133,
    storeLongitude: currentStore.longitude || -0.1365,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Delivery Zones state
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New / Edit Zone Modal
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [zoneFormData, setZoneFormData] = useState({
    postcodeRule: '',
    ruleType: 'district' as DeliveryRuleType,
    deliveryFee: 2.5,
    minimumOrder: 15.0,
    estimatedTime: '30–45 minutes',
    active: true,
  });

  // Test Delivery Postcode Tool state
  const [testPostcode, setTestPostcode] = useState('HA9 8AB');
  const [testCartSubtotal, setTestCartSubtotal] = useState<number>(20.0);
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Restricted Postcodes & Addresses state
  const [newRestrictedPostcode, setNewRestrictedPostcode] = useState('');
  const [newRestrictedAddress, setNewRestrictedAddress] = useState('');

  const handleAddRestrictedPostcode = (e: React.FormEvent) => {
    e.preventDefault();
    const pc = newRestrictedPostcode.trim().toUpperCase();
    if (!pc) return;
    const currentList = deliverySettings.restrictedPostcodes || [];
    if (!currentList.includes(pc)) {
      setDeliverySettings((prev) => ({
        ...prev,
        restrictedPostcodes: [...currentList, pc],
      }));
    }
    setNewRestrictedPostcode('');
  };

  const handleRemoveRestrictedPostcode = (pcToRemove: string) => {
    setDeliverySettings((prev) => ({
      ...prev,
      restrictedPostcodes: (prev.restrictedPostcodes || []).filter((p) => p !== pcToRemove),
    }));
  };

  const handleAddRestrictedAddress = (e: React.FormEvent) => {
    e.preventDefault();
    const addr = newRestrictedAddress.trim();
    if (!addr) return;
    const currentList = deliverySettings.restrictedAddresses || [];
    if (!currentList.includes(addr)) {
      setDeliverySettings((prev) => ({
        ...prev,
        restrictedAddresses: [...currentList, addr],
      }));
    }
    setNewRestrictedAddress('');
  };

  const handleRemoveRestrictedAddress = (addrToRemove: string) => {
    setDeliverySettings((prev) => ({
      ...prev,
      restrictedAddresses: (prev.restrictedAddresses || []).filter((a) => a !== addrToRemove),
    }));
  };

  // Subscribe to real-time delivery settings & zones for all stores
  useEffect(() => {
    const unsubSettings = firestoreService.subscribeStoreDeliverySettings((map) => {
      if (map && map[currentStore.id]) {
        setDeliverySettings(map[currentStore.id]);
      } else {
        // Fallback default
        setDeliverySettings({
          storeId: currentStore.id,
          enabled: currentStore.isDeliveryEnabled ?? true,
          method: 'postcode',
          radiusMiles: currentStore.deliveryRadiusMiles ?? 5.0,
          defaultFee: currentStore.deliveryFee ?? 2.5,
          defaultMinimumOrder: currentStore.minimumDeliveryOrder ?? 12.0,
          defaultEstimatedTime: '30–45 minutes',
          storeAddress: currentStore.address || '',
          storeLatitude: currentStore.latitude || 51.5133,
          storeLongitude: currentStore.longitude || -0.1365,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    const unsubZones = firestoreService.subscribeDeliveryZones((allZones) => {
      if (allZones) {
        setZones(allZones.filter((z) => z.storeId === currentStore.id));
      }
    });

    return () => {
      unsubSettings();
      unsubZones();
    };
  }, [currentStore.id]);

  // Seed default zones for demo if none exist for current store
  useEffect(() => {
    if (zones.length === 0) {
      const defaultZones: DeliveryZone[] = [
        {
          id: `zone-${currentStore.id}-1`,
          storeId: currentStore.id,
          postcodeRule: 'HA0',
          ruleType: 'district',
          deliveryFee: 2.0,
          minimumOrder: 12.0,
          estimatedTime: '25–35 minutes',
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: `zone-${currentStore.id}-2`,
          storeId: currentStore.id,
          postcodeRule: 'HA9',
          ruleType: 'district',
          deliveryFee: 2.5,
          minimumOrder: 15.0,
          estimatedTime: '30–45 minutes',
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: `zone-${currentStore.id}-3`,
          storeId: currentStore.id,
          postcodeRule: 'NW10',
          ruleType: 'district',
          deliveryFee: 3.0,
          minimumOrder: 18.0,
          estimatedTime: '35–50 minutes',
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: `zone-${currentStore.id}-4`,
          storeId: currentStore.id,
          postcodeRule: 'NW9',
          ruleType: 'district',
          deliveryFee: 4.0,
          minimumOrder: 20.0,
          estimatedTime: '40–55 minutes',
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      setZones(defaultZones);
      // Persist defaults
      defaultZones.forEach((z) => firestoreService.saveDeliveryZone(z));
    }
  }, [currentStore.id, zones.length]);

  // Handle Save Settings
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const updated = {
        ...deliverySettings,
        storeId: currentStore.id,
        updatedAt: new Date().toISOString(),
      };
      await firestoreService.saveStoreDeliverySettings(updated);

      // Also update store object
      if (isSuperAdmin) {
        firestoreService.saveStoreToFirestore({
          ...currentStore,
          isDeliveryEnabled: updated.enabled,
          deliveryFee: updated.defaultFee,
          minimumDeliveryOrder: updated.defaultMinimumOrder,
          deliveryRadiusMiles: updated.radiusMiles,
          latitude: updated.storeLatitude,
          longitude: updated.storeLongitude,
          address: updated.storeAddress,
        });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      logActivity('Delivery Settings Updated', `Delivery settings updated for store: ${currentStore.businessName}`, 'Store');
      addNotification({
        title: 'Delivery Settings Saved',
        message: `Delivery configuration for ${currentStore.businessName} updated successfully.`,
        type: 'success',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Add / Edit Zone
  const handleOpenAddZone = () => {
    setEditingZone(null);
    setZoneFormData({
      postcodeRule: '',
      ruleType: 'district',
      deliveryFee: deliverySettings.defaultFee,
      minimumOrder: deliverySettings.defaultMinimumOrder,
      estimatedTime: deliverySettings.defaultEstimatedTime,
      active: true,
    });
    setIsZoneModalOpen(true);
  };

  const handleOpenEditZone = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setZoneFormData({
      postcodeRule: zone.postcodeRule,
      ruleType: zone.ruleType,
      deliveryFee: zone.deliveryFee,
      minimumOrder: zone.minimumOrder,
      estimatedTime: zone.estimatedTime,
      active: zone.active,
    });
    setIsZoneModalOpen(true);
  };

  // Auto-detect rule type from user typing
  const handleRuleInputChange = (val: string) => {
    // Don't trim while typing, or the space in "HA9 8" / "HA9 8AB" can never be entered
    const typed = val.toUpperCase().replace(/^\s+/, '').replace(/\s{2,}/g, ' ');
    const raw = typed.trim();
    const clean = raw.replace(/\s+/g, '');
    let detectedType: DeliveryRuleType = 'district';

    if (/^[A-Z]{1,2}$/.test(clean)) {
      detectedType = 'area'; // e.g. "HA" or "NW"
    } else if (/^[A-Z]{1,2}\d[A-Z\d]?$/.test(clean)) {
      detectedType = 'district'; // e.g. "HA9", "NW10", "W1D"
    } else if (/^[A-Z]{1,2}\d[A-Z\d]?\s*\d$/.test(raw)) {
      detectedType = 'sector'; // e.g. "HA9 8"
    } else if (clean.length >= 5 && clean.length <= 7) {
      detectedType = 'full'; // e.g. "HA9 8AB"
    }

    setZoneFormData((prev) => ({
      ...prev,
      postcodeRule: typed,
      ruleType: detectedType,
    }));
  };

  const handleSaveZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneFormData.postcodeRule.trim()) return;

    const normalizedRule = zoneFormData.postcodeRule.trim().toUpperCase();

    if (editingZone) {
      const updated: DeliveryZone = {
        ...editingZone,
        postcodeRule: normalizedRule,
        ruleType: zoneFormData.ruleType,
        deliveryFee: Number(zoneFormData.deliveryFee),
        minimumOrder: Number(zoneFormData.minimumOrder),
        estimatedTime: zoneFormData.estimatedTime,
        active: zoneFormData.active,
        updatedAt: new Date().toISOString(),
      };
      setZones((prev) => prev.map((z) => (z.id === updated.id ? updated : z)));
      await firestoreService.saveDeliveryZone(updated);
    } else {
      const newZone: DeliveryZone = {
        id: `zone-${Date.now()}`,
        storeId: currentStore.id,
        postcodeRule: normalizedRule,
        ruleType: zoneFormData.ruleType,
        deliveryFee: Number(zoneFormData.deliveryFee),
        minimumOrder: Number(zoneFormData.minimumOrder),
        estimatedTime: zoneFormData.estimatedTime,
        active: zoneFormData.active,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setZones((prev) => [newZone, ...prev]);
      await firestoreService.saveDeliveryZone(newZone);
    }

    setIsZoneModalOpen(false);
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (confirm('Delete this delivery zone?')) {
      setZones((prev) => prev.filter((z) => z.id !== zoneId));
      await firestoreService.deleteDeliveryZone(zoneId);
    }
  };

  const handleToggleZoneActive = async (zone: DeliveryZone) => {
    const updated = { ...zone, active: !zone.active, updatedAt: new Date().toISOString() };
    setZones((prev) => prev.map((z) => (z.id === updated.id ? updated : z)));
    await firestoreService.saveDeliveryZone(updated);
  };

  // Test Delivery Postcode Tool
  const handleRunDeliveryTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPostcode.trim()) return;

    setIsTesting(true);
    try {
      // 1. First call backend endpoint
      const response = await fetch('/api/delivery/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store: currentStore,
          settings: deliverySettings,
          zones,
          postcode: testPostcode,
          cartSubtotal: testCartSubtotal,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult(data);
      } else {
        // Fallback local execution
        const res = checkDeliveryAvailability({
          store: currentStore,
          settings: deliverySettings,
          zones,
          customerPostcode: testPostcode,
          cartSubtotal: testCartSubtotal,
        });
        setTestResult(res);
      }
    } catch {
      const res = checkDeliveryAvailability({
        store: currentStore,
        settings: deliverySettings,
        zones,
        customerPostcode: testPostcode,
        cartSubtotal: testCartSubtotal,
      });
      setTestResult(res);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Store Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E5EAF2] rounded-xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-blue-600">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#172033]">
                UK Delivery & Postcode Zones Configuration
              </h1>
              {saveSuccess && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Saved
                </span>
              )}
            </div>
            <p className="text-xs text-[#64748B]">
              Configure separate Foodhub-style postcode zones, radius limits, and minimum orders for each store.
            </p>
          </div>
        </div>

        {/* Store Selector & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748B] font-bold">Selected Store:</span>
            <select
              value={currentStore.id}
              disabled={!isSuperAdmin && currentUser?.role === 'STORE'}
              onChange={(e) => {
                const target = stores.find((s) => s.id === e.target.value);
                if (target) setCurrentStore(target);
              }}
              className="border border-[#E5EAF2] text-[#172033] text-xs rounded-lg px-3 py-2 font-bold bg-[#F8FAFC] focus:outline-none focus:border-blue-600"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.businessName}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Store Delivery Methods & Settings (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Main Delivery Switch & Method */}
          <div className="bg-white border border-[#E5EAF2] rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF2]">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-[#172033]">1. Store Delivery Method</h2>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={deliverySettings.enabled}
                  onChange={(e) =>
                    setDeliverySettings((prev) => ({ ...prev, enabled: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#172033]">
                Delivery Restriction Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDeliverySettings((p) => ({ ...p, method: 'postcode' }))}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    deliverySettings.method === 'postcode'
                      ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-2xs'
                      : 'bg-white border-[#E5EAF2] text-[#64748B] hover:bg-slate-50'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>Postcode Only</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliverySettings((p) => ({ ...p, method: 'radius' }))}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    deliverySettings.method === 'radius'
                      ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-2xs'
                      : 'bg-white border-[#E5EAF2] text-[#64748B] hover:bg-slate-50'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  <span>Radius Only</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDeliverySettings((p) => ({ ...p, method: 'postcode_and_radius' }))
                  }
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    deliverySettings.method === 'postcode_and_radius'
                      ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-2xs'
                      : 'bg-white border-[#E5EAF2] text-[#64748B] hover:bg-slate-50'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Postcode + Radius</span>
                </button>
              </div>
            </div>

            {/* Default Parameters */}
            <div className="space-y-3 pt-3 border-t border-[#E5EAF2] text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">
                    Default Delivery Fee (£)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-[#64748B] font-bold">£</span>
                    <input
                      type="number"
                      step="0.10"
                      min="0"
                      value={deliverySettings.defaultFee}
                      onChange={(e) =>
                        setDeliverySettings((p) => ({ ...p, defaultFee: Number(e.target.value) }))
                      }
                      className="w-full pl-6 pr-2.5 py-1.5 rounded-lg border border-[#E5EAF2] bg-[#F8FAFC] font-bold text-[#172033]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#64748B] font-bold mb-1">
                    Default Min Order (£)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-[#64748B] font-bold">£</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={deliverySettings.defaultMinimumOrder}
                      onChange={(e) =>
                        setDeliverySettings((p) => ({
                          ...p,
                          defaultMinimumOrder: Number(e.target.value),
                        }))
                      }
                      className="w-full pl-6 pr-2.5 py-1.5 rounded-lg border border-[#E5EAF2] bg-[#F8FAFC] font-bold text-[#172033]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">
                    Estimated Time
                  </label>
                  <input
                    type="text"
                    value={deliverySettings.defaultEstimatedTime}
                    onChange={(e) =>
                      setDeliverySettings((p) => ({ ...p, defaultEstimatedTime: e.target.value }))
                    }
                    placeholder="30–45 minutes"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#E5EAF2] bg-[#F8FAFC] font-bold text-[#172033]"
                  />
                </div>

                <div>
                  <label className="block text-[#64748B] font-bold mb-1">
                    Delivery Radius (miles)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="50"
                    value={deliverySettings.radiusMiles}
                    onChange={(e) =>
                      setDeliverySettings((p) => ({ ...p, radiusMiles: Number(e.target.value) }))
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#E5EAF2] bg-[#F8FAFC] font-bold text-[#172033]"
                  />
                </div>
              </div>
            </div>

            {/* Store Coordinates */}
            <div className="space-y-2 pt-3 border-t border-[#E5EAF2] text-xs">
              <label className="block text-[#64748B] font-bold">
                Store Origin Address & Geolocation Coordinates
              </label>
              <input
                type="text"
                value={deliverySettings.storeAddress}
                onChange={(e) =>
                  setDeliverySettings((p) => ({ ...p, storeAddress: e.target.value }))
                }
                placeholder="Store address (e.g. 12 High Street, London)"
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#E5EAF2] bg-[#F8FAFC] text-[#172033]"
              />
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div>
                  <label className="text-[#64748B]">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={deliverySettings.storeLatitude}
                    onChange={(e) =>
                      setDeliverySettings((p) => ({
                        ...p,
                        storeLatitude: Number(e.target.value),
                      }))
                    }
                    className="w-full px-2 py-1 rounded border border-[#E5EAF2] bg-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="text-[#64748B]">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={deliverySettings.storeLongitude}
                    onChange={(e) =>
                      setDeliverySettings((p) => ({
                        ...p,
                        storeLongitude: Number(e.target.value),
                      }))
                    }
                    className="w-full px-2 py-1 rounded border border-[#E5EAF2] bg-[#F8FAFC]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Admin Delivery Test Tool (#15 Requirements) */}
          <div className="bg-white border border-[#E5EAF2] rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E5EAF2]">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-[#172033]">
                Test Delivery Postcode Tool
              </h2>
            </div>
            <p className="text-xs text-[#64748B]">
              Simulate customer address checks in real-time against this store's configured rules.
            </p>

            <form onSubmit={handleRunDeliveryTest} className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Customer Postcode</label>
                  <input
                    type="text"
                    value={testPostcode}
                    onChange={(e) => setTestPostcode(e.target.value.toUpperCase())}
                    placeholder="e.g. HA9 8AB"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#E5EAF2] bg-[#F8FAFC] font-bold text-[#172033] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Cart Subtotal (£)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={testCartSubtotal}
                    onChange={(e) => setTestCartSubtotal(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#E5EAF2] bg-[#F8FAFC] font-bold text-[#172033]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isTesting}
                className="w-full py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{isTesting ? 'Verifying...' : 'Check Availability'}</span>
              </button>
            </form>

            {testResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-2 animate-in fade-in duration-150 ${
                  testResult.available
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50/70 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold">
                    {testResult.available ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600" />
                    )}
                    <span>
                      {testResult.available ? '✓ Delivery Available' : '✕ Delivery Unavailable'}
                    </span>
                  </div>
                  {testResult.matchedRuleType && (
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white border border-current font-bold">
                      Rule: {testResult.matchedRuleType}
                    </span>
                  )}
                </div>

                <div className="text-[11px] leading-relaxed">
                  {testResult.message}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-current/20 font-mono text-[11px]">
                  <div>
                    <span className="block text-[9px] uppercase opacity-75 font-sans">Matched Zone</span>
                    <span className="font-bold">{testResult.deliveryZone || 'Standard'}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase opacity-75 font-sans">Delivery Fee</span>
                    <span className="font-bold">£{Number(testResult.deliveryFee || 0).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase opacity-75 font-sans">Min Order</span>
                    <span className="font-bold">£{Number(testResult.minimumOrder || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Postcode Delivery Zones Management (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-[#E5EAF2] rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF2]">
              <div>
                <h2 className="text-sm font-bold text-[#172033] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>2. Configured Delivery Zones ({zones.length})</span>
                </h2>
                <p className="text-xs text-[#64748B]">
                  Precedence: Full Postcode → Sector → District → Area (Most specific rule applies).
                </p>
              </div>

              <button
                onClick={handleOpenAddZone}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Delivery Zone</span>
              </button>
            </div>

            {/* Zones Table */}
            <div className="rounded-xl border border-[#E5EAF2] overflow-hidden">
              <table className="w-full text-left text-xs text-[#172033]">
                <thead className="bg-[#F8FAFC] text-[#64748B] font-bold uppercase tracking-wider text-[10px] border-b border-[#E5EAF2]">
                  <tr>
                    <th className="px-3.5 py-2.5">Postcode Rule</th>
                    <th className="px-3.5 py-2.5">Precision Tier</th>
                    <th className="px-3.5 py-2.5">Fee</th>
                    <th className="px-3.5 py-2.5">Min Order</th>
                    <th className="px-3.5 py-2.5">ETA</th>
                    <th className="px-3.5 py-2.5 text-center">Active</th>
                    <th className="px-3.5 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EAF2]">
                  {zones.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-[#64748B]">
                        No delivery zones configured yet. Click "Add Delivery Zone" above.
                      </td>
                    </tr>
                  ) : (
                    zones.map((zone) => (
                      <tr
                        key={zone.id}
                        className={`hover:bg-blue-50/40 transition-colors ${
                          !zone.active ? 'opacity-50 bg-slate-50/50' : ''
                        }`}
                      >
                        <td className="px-3.5 py-2.5 font-mono font-bold text-[#172033]">
                          {zone.postcodeRule}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                              zone.ruleType === 'full'
                                ? 'bg-purple-100 text-purple-700'
                                : zone.ruleType === 'sector'
                                ? 'bg-blue-100 text-blue-700'
                                : zone.ruleType === 'district'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {zone.ruleType}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 font-mono font-bold text-blue-600">
                          £{Number(zone.deliveryFee).toFixed(2)}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono font-bold text-[#172033]">
                          £{Number(zone.minimumOrder).toFixed(2)}
                        </td>
                        <td className="px-3.5 py-2.5 text-[#64748B]">{zone.estimatedTime}</td>
                        <td className="px-3.5 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleZoneActive(zone)}
                            className={`w-5 h-5 rounded-full inline-flex items-center justify-center cursor-pointer transition-colors ${
                              zone.active
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-200 text-slate-400'
                            }`}
                            title={zone.active ? 'Disable zone' : 'Enable zone'}
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </td>
                        <td className="px-3.5 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditZone(zone)}
                              className="p-1 rounded text-[#64748B] hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Edit zone"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteZone(zone.id)}
                              className="p-1 rounded text-[#64748B] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete zone"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Precision Precedence Explainer Note */}
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Automatic UK Postcode Precision Precedence</span>
              </div>
              <p className="text-[11px] leading-relaxed text-blue-800">
                Nexus-POS checks rules in descending specificity: <strong>Full (HA9 8AB)</strong> →{' '}
                <strong>Sector (HA9 8)</strong> → <strong>District (HA9)</strong> →{' '}
                <strong>Area (HA)</strong>. If a customer enters <code>HA9 8AB</code> and both{' '}
                <code>HA9</code> (£2.50) and <code>HA9 8AB</code> (£1.50) are configured, the customer receives the £1.50 rate automatically.
              </p>
            </div>
          </div>

          {/* 3. Restricted / Blocked Delivery Areas (Admin Blocklist) */}
          <div className="bg-white border border-[#E5EAF2] rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF2]">
              <div>
                <h2 className="text-sm font-bold text-[#172033] flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>3. Restricted Delivery Postcodes & Addresses (Admin Blocklist)</span>
                </h2>
                <p className="text-xs text-[#64748B]">
                  Specific postcodes, sectors, or addresses where delivery orders are strictly prevented by Admin.
                </p>
              </div>
            </div>

            {/* Postcode Block Input */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-[#172033]">
                Block Specific Postcode (Area, District, or Full Postcode)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. HA9 8AB, SE1, SW1A..."
                  value={newRestrictedPostcode}
                  onChange={(e) => setNewRestrictedPostcode(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-[#E5EAF2] bg-[#F8FAFC] font-mono text-xs font-bold text-[#172033]"
                />
                <button
                  type="button"
                  onClick={handleAddRestrictedPostcode}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Block Postcode</span>
                </button>
              </div>

              {/* Blocked Postcodes Badges */}
              <div className="flex flex-wrap gap-2 pt-1">
                {(deliverySettings.restrictedPostcodes || []).length === 0 ? (
                  <span className="text-xs text-[#94A3B8] italic">No postcodes blocked yet.</span>
                ) : (
                  (deliverySettings.restrictedPostcodes || []).map((pc) => (
                    <span
                      key={pc}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono font-bold"
                    >
                      <span>{pc}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRestrictedPostcode(pc)}
                        className="text-rose-500 hover:text-rose-800 cursor-pointer"
                        title="Remove restriction"
                      >
                        ✕
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Address / Street Block Input */}
            <div className="space-y-2.5 pt-3 border-t border-[#E5EAF2]">
              <label className="block text-xs font-bold text-[#172033]">
                Block Specific Street or Building Address
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 10 Downing Street or High Street Block B..."
                  value={newRestrictedAddress}
                  onChange={(e) => setNewRestrictedAddress(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-[#E5EAF2] bg-[#F8FAFC] text-xs font-medium text-[#172033]"
                />
                <button
                  type="button"
                  onClick={handleAddRestrictedAddress}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Block Address</span>
                </button>
              </div>

              {/* Blocked Addresses Badges */}
              <div className="flex flex-wrap gap-2 pt-1">
                {(deliverySettings.restrictedAddresses || []).length === 0 ? (
                  <span className="text-xs text-[#94A3B8] italic">No addresses blocked yet.</span>
                ) : (
                  (deliverySettings.restrictedAddresses || []).map((addr) => (
                    <span
                      key={addr}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium"
                    >
                      <span>{addr}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRestrictedAddress(addr)}
                        className="text-rose-500 hover:text-rose-800 cursor-pointer"
                        title="Remove restriction"
                      >
                        ✕
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Zone Modal */}
      {isZoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl border border-[#E5EAF2] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF2]">
              <h3 className="font-bold text-base text-[#172033]">
                {editingZone ? 'Edit Delivery Zone' : 'Add New Delivery Zone'}
              </h3>
              <button
                type="button"
                onClick={() => setIsZoneModalOpen(false)}
                className="text-[#64748B] hover:text-[#172033] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveZone} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#172033] font-bold mb-1">
                  Postcode Rule (Area, District, Sector, or Full) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HA, HA9, HA9 8, or HA9 8AB"
                  value={zoneFormData.postcodeRule}
                  onChange={(e) => handleRuleInputChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E5EAF2] font-mono font-bold text-sm text-[#172033] focus:outline-none focus:border-blue-600"
                />
                <span className="text-[11px] text-[#64748B] mt-1 block">
                  Detected precision tier: <strong className="uppercase text-blue-600">{zoneFormData.ruleType}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#172033] font-bold mb-1">
                    Precision Rule Type
                  </label>
                  <select
                    value={zoneFormData.ruleType}
                    onChange={(e) =>
                      setZoneFormData((p) => ({ ...p, ruleType: e.target.value as DeliveryRuleType }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#E5EAF2] font-semibold text-[#172033] bg-[#F8FAFC]"
                  >
                    <option value="area">Area (e.g. HA)</option>
                    <option value="district">District (e.g. HA9)</option>
                    <option value="sector">Sector (e.g. HA9 8)</option>
                    <option value="full">Full Postcode (e.g. HA9 8AB)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#172033] font-bold mb-1">
                    Delivery Fee (£) *
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    required
                    value={zoneFormData.deliveryFee}
                    onChange={(e) =>
                      setZoneFormData((p) => ({ ...p, deliveryFee: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#E5EAF2] font-mono font-bold text-[#172033]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#172033] font-bold mb-1">
                    Minimum Order (£) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={zoneFormData.minimumOrder}
                    onChange={(e) =>
                      setZoneFormData((p) => ({ ...p, minimumOrder: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#E5EAF2] font-mono font-bold text-[#172033]"
                  />
                </div>

                <div>
                  <label className="block text-[#172033] font-bold mb-1">
                    Estimated Time *
                  </label>
                  <input
                    type="text"
                    required
                    value={zoneFormData.estimatedTime}
                    onChange={(e) =>
                      setZoneFormData((p) => ({ ...p, estimatedTime: e.target.value }))
                    }
                    placeholder="30–45 minutes"
                    className="w-full px-3 py-2 rounded-lg border border-[#E5EAF2] font-bold text-[#172033]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="zone-active-checkbox"
                  checked={zoneFormData.active}
                  onChange={(e) =>
                    setZoneFormData((p) => ({ ...p, active: e.target.checked }))
                  }
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
                <label htmlFor="zone-active-checkbox" className="font-bold text-[#172033] cursor-pointer">
                  Zone Active & Deliverable
                </label>
              </div>

              <div className="pt-3 border-t border-[#E5EAF2] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsZoneModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#64748B] font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  {editingZone ? 'Save Changes' : 'Create Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

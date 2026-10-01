import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Percent,
  DollarSign,
  Calendar,
  Sparkles,
  Megaphone,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Eye,
  ArrowRight,
  Gift,
  Zap,
} from 'lucide-react';
import { useNexus } from '../../../context/NexusContext';
import { Coupon, PresetDiscount, PromotionBanner } from '../../../types';

export const PromotionsManagementView: React.FC = () => {
  const {
    coupons,
    addCoupon,
    updateCoupon,
    deleteCoupon,
    toggleCoupon,
    presetDiscounts,
    addPresetDiscount,
    updatePresetDiscount,
    deletePresetDiscount,
    appliedPresetDiscount,
    applyPresetDiscount,
    promoBanner,
    updatePromoBanner,
  } = useNexus();

  const [activeTab, setActiveTab] = useState<'coupons' | 'presets' | 'banner'>('coupons');

  // Coupon Modal State
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponForm, setCouponForm] = useState<Coupon>({
    code: '',
    name: '',
    description: '',
    discountType: 'percentage',
    value: 15,
    minOrder: 15.0,
    maxDiscount: 10.0,
    validUntil: '2026-12-31',
    isActive: true,
    usageCount: 0,
    usageLimit: 100,
  });

  // Preset Discount Modal State
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<PresetDiscount | null>(null);
  const [presetForm, setPresetForm] = useState<{
    name: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    value: number;
    description: string;
    requiresManagerPin: boolean;
    color: string;
  }>({
    name: '',
    code: '',
    discountType: 'percentage',
    value: 10,
    description: '',
    requiresManagerPin: false,
    color: '#2563EB',
  });

  // Banner State
  const [bannerForm, setBannerForm] = useState<PromotionBanner>(promoBanner);

  // Handlers for Coupons
  const handleOpenCouponModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setCouponForm({ ...coupon });
    } else {
      setEditingCoupon(null);
      setCouponForm({
        code: '',
        name: '',
        description: '',
        discountType: 'percentage',
        value: 10,
        minOrder: 12.0,
        maxDiscount: 15.0,
        validUntil: '2026-12-31',
        isActive: true,
        usageCount: 0,
        usageLimit: 250,
      });
    }
    setIsCouponModalOpen(true);
  };

  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code.trim()) return;

    if (editingCoupon) {
      updateCoupon(editingCoupon.code, couponForm);
    } else {
      addCoupon(couponForm);
    }
    setIsCouponModalOpen(false);
  };

  // Handlers for Preset Discounts
  const handleOpenPresetModal = (preset?: PresetDiscount) => {
    if (preset) {
      setEditingPreset(preset);
      setPresetForm({
        name: preset.name,
        code: preset.code,
        discountType: preset.discountType,
        value: preset.value,
        description: preset.description || '',
        requiresManagerPin: !!preset.requiresManagerPin,
        color: preset.color || '#2563EB',
      });
    } else {
      setEditingPreset(null);
      setPresetForm({
        name: '',
        code: '',
        discountType: 'percentage',
        value: 10,
        description: '',
        requiresManagerPin: false,
        color: '#2563EB',
      });
    }
    setIsPresetModalOpen(true);
  };

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetForm.name.trim()) return;

    if (editingPreset) {
      updatePresetDiscount(editingPreset.id, presetForm);
    } else {
      addPresetDiscount(presetForm);
    }
    setIsPresetModalOpen(false);
  };

  // Handler for Saving Promo Banner
  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    updatePromoBanner(bannerForm);
  };

  return (
    <div className="space-y-6" id="promotions-management-root">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-[#E5EAF2] rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-blue-600">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#172033] flex items-center gap-2">
                Promotions, Coupons & Offers Engine
              </h1>
              <p className="text-xs text-[#64748B] mt-0.5">
                Manage promo voucher codes, preset staff & senior discounts, and real-time storefront offer banners.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-[#F8FAFC] p-1.5 rounded-xl border border-[#E5EAF2] gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'coupons'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-[#64748B] hover:text-[#172033] hover:bg-slate-100'
            }`}
          >
            <Tag className="w-4 h-4" />
            Coupon Codes ({coupons.length})
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-[#64748B] hover:text-[#172033] hover:bg-slate-100'
            }`}
          >
            <Zap className="w-4 h-4" />
            Preset Order Discounts ({presetDiscounts.length})
          </button>
          <button
            onClick={() => setActiveTab('banner')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'banner'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-[#64748B] hover:text-[#172033] hover:bg-slate-100'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            Store Offer Banner
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. COUPON CODES TAB */}
      {/* ========================================================================= */}
      {activeTab === 'coupons' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#172033]">Active Promo & Discount Coupons</h2>
            <button
              onClick={() => handleOpenCouponModal()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Coupon Code
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((coupon) => (
              <div
                key={coupon.code}
                className="bg-white border border-[#E5EAF2] rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-all relative overflow-hidden group"
              >
                {/* Visual discount ribbon */}
                <div
                  className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-extrabold rounded-bl-lg uppercase ${
                    coupon.isActive
                      ? 'bg-emerald-100 text-emerald-800 border-l border-b border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-l border-b border-slate-200'
                  }`}
                >
                  {coupon.isActive ? 'Active' : 'Disabled'}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base font-extrabold text-blue-600 font-mono tracking-wider bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                      {coupon.code}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#172033] mt-1">{coupon.name}</h3>
                  <p className="text-xs text-[#64748B] mt-1">{coupon.description}</p>

                  <div className="mt-3 pt-3 border-t border-[#E5EAF2] space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Benefit:</span>
                      <span className="font-bold text-blue-600">
                        {coupon.discountType === 'percentage' ? `${coupon.value}% OFF` : `£${coupon.value.toFixed(2)} OFF`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Min Order:</span>
                      <span className="font-semibold text-[#172033]">
                        £{(coupon.minOrder || 0).toFixed(2)}
                      </span>
                    </div>
                    {coupon.maxDiscount && (
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Max Discount Cap:</span>
                        <span className="font-semibold text-[#172033]">
                          £{coupon.maxDiscount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Valid Until:</span>
                      <span className="font-semibold text-[#64748B]">{coupon.validUntil || 'No expiry'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E5EAF2] flex items-center justify-between">
                  <button
                    onClick={() => toggleCoupon(coupon.code)}
                    className={`text-xs font-bold px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      coupon.isActive
                        ? 'text-rose-600 hover:bg-rose-50'
                        : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {coupon.isActive ? 'Deactivate' : 'Activate'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenCouponModal(coupon)}
                      className="p-1.5 hover:bg-slate-100 text-[#64748B] hover:text-blue-600 rounded-md transition-colors cursor-pointer"
                      title="Edit Coupon"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete coupon "${coupon.code}"?`)) {
                          deleteCoupon(coupon.code);
                        }
                      }}
                      className="p-1.5 hover:bg-rose-50 text-[#64748B] hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                      title="Delete Coupon"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PRESET DISCOUNTS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'presets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#172033]">Preset Order Discounts (POS Quick Keys)</h2>
              <p className="text-xs text-[#64748B]">
                Staff meals, senior citizen, VIP guest discounts triggered with 1-click in POS Cart
              </p>
            </div>
            <button
              onClick={() => handleOpenPresetModal()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Preset Discount
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {presetDiscounts.map((preset) => {
              const isCurrentlyApplied = appliedPresetDiscount?.id === preset.id;
              return (
                <div
                  key={preset.id}
                  className="bg-white border border-[#E5EAF2] rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: preset.color || '#2563EB' }}
                      />
                      <span className="text-[11px] font-bold text-[#64748B] font-mono">
                        {preset.code}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#172033]">{preset.name}</h3>
                    <p className="text-xs text-[#64748B] mt-1">{preset.description}</p>

                    <div className="mt-4 p-3 bg-[#F8FAFC] rounded-xl border border-[#E5EAF2] flex items-center justify-between">
                      <span className="text-xs text-[#64748B]">Reduction:</span>
                      <span className="text-sm font-extrabold text-blue-600">
                        {preset.discountType === 'percentage'
                          ? `${preset.value}% OFF`
                          : `£${preset.value.toFixed(2)} OFF`}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E5EAF2] flex items-center justify-between">
                    <button
                      onClick={() =>
                        applyPresetDiscount(isCurrentlyApplied ? null : preset)
                      }
                      className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                        isCurrentlyApplied
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-[#64748B] hover:text-[#172033]'
                      }`}
                    >
                      {isCurrentlyApplied ? 'Applied in POS' : 'Test Apply in POS'}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenPresetModal(preset)}
                        className="p-1.5 hover:bg-slate-100 text-[#64748B] hover:text-blue-600 rounded-md transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete discount preset "${preset.name}"?`)) {
                            deletePresetDiscount(preset.id);
                          }
                        }}
                        className="p-1.5 hover:bg-rose-50 text-[#64748B] hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. STORE OFFER BANNER TAB */}
      {/* ========================================================================= */}
      {activeTab === 'banner' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white border border-[#E5EAF2] rounded-xl p-5 shadow-sm">
              <h2 className="text-sm font-bold text-[#172033] mb-4 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-blue-600" />
                Storefront Top Offer Banner Settings
              </h2>

              <form onSubmit={handleSaveBanner} className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-xl border border-[#E5EAF2]">
                  <div>
                    <span className="font-bold text-[#172033] block">Enable Live Promotion Banner</span>
                    <span className="text-[11px] text-[#64748B]">
                      Displays across top of online ordering & POS header
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bannerForm.enabled}
                      onChange={(e) => setBannerForm({ ...bannerForm, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Banner Headline Message *</label>
                  <input
                    type="text"
                    required
                    value={bannerForm.message}
                    onChange={(e) => setBannerForm({ ...bannerForm, message: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#64748B] font-bold mb-1">Badge Text</label>
                    <input
                      type="text"
                      value={bannerForm.badgeText || ''}
                      onChange={(e) => setBannerForm({ ...bannerForm, badgeText: e.target.value })}
                      className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[#64748B] font-bold mb-1">Button / CTA Text</label>
                    <input
                      type="text"
                      value={bannerForm.linkText || ''}
                      onChange={(e) => setBannerForm({ ...bannerForm, linkText: e.target.value })}
                      className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#64748B] font-bold mb-1">Background Color</label>
                    <input
                      type="color"
                      value={bannerForm.backgroundColor || '#2563EB'}
                      onChange={(e) =>
                        setBannerForm({ ...bannerForm, backgroundColor: e.target.value })
                      }
                      className="w-full h-9 bg-white border border-[#E5EAF2] rounded-lg cursor-pointer px-1 py-1"
                    />
                  </div>
                  <div>
                    <label className="block text-[#64748B] font-bold mb-1">Text Color</label>
                    <input
                      type="color"
                      value={bannerForm.textColor || '#ffffff'}
                      onChange={(e) => setBannerForm({ ...bannerForm, textColor: e.target.value })}
                      className="w-full h-9 bg-white border border-[#E5EAF2] rounded-lg cursor-pointer px-1 py-1"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Save Banner Settings
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Live Real-time Visual Preview */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white border border-[#E5EAF2] rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-blue-600" />
                Live Customer Screen Banner Preview
              </h3>

              <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E5EAF2]">
                {bannerForm.enabled ? (
                  <div
                    className="p-3 rounded-lg flex items-center justify-between shadow-xs transition-all flex-wrap gap-2"
                    style={{
                      backgroundColor: bannerForm.backgroundColor || '#2563EB',
                      color: bannerForm.textColor || '#ffffff',
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      {bannerForm.badgeText && (
                        <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-extrabold rounded-md uppercase tracking-wider">
                          {bannerForm.badgeText}
                        </span>
                      )}
                      <span className="text-xs font-bold">{bannerForm.message}</span>
                    </div>

                    {bannerForm.linkText && (
                      <span className="text-xs font-bold underline flex items-center gap-1 cursor-pointer">
                        {bannerForm.linkText} <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-[#64748B] py-6 text-center">
                    Banner is currently disabled. Toggle switch to preview.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COUPON MODAL */}
      {/* ========================================================================= */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5EAF2] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF2]">
              <h3 className="text-sm font-bold text-[#172033]">
                {editingCoupon ? `Edit Coupon ${editingCoupon.code}` : 'Create New Coupon'}
              </h3>
              <button
                onClick={() => setIsCouponModalOpen(false)}
                className="text-[#64748B] hover:text-[#172033] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SAVE20"
                    value={couponForm.code}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })
                    }
                    className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-blue-600 font-mono font-bold focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Coupon Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 20% Weekend Promo"
                    value={couponForm.name}
                    onChange={(e) => setCouponForm({ ...couponForm, name: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. 20% off all orders over £15"
                  value={couponForm.description}
                  onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Discount Type</label>
                  <select
                    value={couponForm.discountType}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        discountType: e.target.value as 'percentage' | 'fixed',
                      })
                    }
                    className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600 cursor-pointer"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (£)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">
                    Value ({couponForm.discountType === 'percentage' ? '%' : '£'}) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={couponForm.value}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, value: Number(e.target.value) })
                    }
                    className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Min Order (£)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={couponForm.minOrder}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, minOrder: Number(e.target.value) })
                    }
                    className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Max Discount (£)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="Unlimited"
                    value={couponForm.maxDiscount || ''}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        maxDiscount: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">Valid Until Date</label>
                <input
                  type="date"
                  value={couponForm.validUntil || ''}
                  onChange={(e) => setCouponForm({ ...couponForm, validUntil: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#64748B] hover:text-[#172033] rounded-lg font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm cursor-pointer"
                >
                  {editingCoupon ? 'Update Coupon' : 'Save Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRESET DISCOUNT MODAL */}
      {/* ========================================================================= */}
      {isPresetModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5EAF2] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF2]">
              <h3 className="text-sm font-bold text-[#172033]">
                {editingPreset ? 'Edit Preset Discount' : 'New Preset Discount'}
              </h3>
              <button
                onClick={() => setIsPresetModalOpen(false)}
                className="text-[#64748B] hover:text-[#172033] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePreset} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#64748B] font-bold mb-1">Preset Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Staff Discount 20%"
                  value={presetForm.name}
                  onChange={(e) => setPresetForm({ ...presetForm, name: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Short Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="STAFF20"
                    value={presetForm.code}
                    onChange={(e) =>
                      setPresetForm({ ...presetForm, code: e.target.value.toUpperCase() })
                    }
                    className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-blue-600 font-mono focus:outline-none focus:border-blue-600 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Reduction Value *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={presetForm.value}
                    onChange={(e) =>
                      setPresetForm({ ...presetForm, value: Number(e.target.value) })
                    }
                    className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Employee benefit discount"
                  value={presetForm.description}
                  onChange={(e) => setPresetForm({ ...presetForm, description: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPresetModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#64748B] hover:text-[#172033] rounded-lg font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm cursor-pointer"
                >
                  Save Preset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

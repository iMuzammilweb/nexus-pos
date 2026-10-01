import React, { useState } from 'react';
import {
  X,
  Truck,
  ShoppingBag,
  Store as InStoreIcon,
  Percent,
  DollarSign,
  Tag,
  CreditCard,
  Banknote,
  Globe,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  User,
  MapPin,
  FileText,
  ShieldCheck,
  Search,
  Receipt,
  Sparkles,
  ChevronDown,
  Trash2,
  History,
} from 'lucide-react';
import { useNexus } from '../../context/NexusContext';
import { OrderType, PaymentMethod, CustomerRecord } from '../../types';
import { CustomerOrderHistoryModal } from './CustomerOrderHistoryModal';
import {
  lookupUKPostcode,
  isValidUKPostcode,
  formatUKPostcode,
  UKAddressSuggestion,
} from '../../services/postcodeService';
import { DeliveryAddressSearch } from './DeliveryAddressSearch';
import { StructuredAddress, DeliveryValidationResult } from '../../services/googleMapsService';

export const OrderCheckScreen: React.FC = () => {
  const {
    isOrderCheckModalOpen,
    setIsOrderCheckModalOpen,
    cartItems,
    customerInfo,
    setCustomerInfo,
    updateCustomerField,
    setOrderType,
    cartSubtotal,
    cartModifiersTotal,
    cartCouponDiscount,
    cartPresetDiscount,
    cartManualDiscount,
    cartTotalDiscount,
    cartDeliveryFee,
    cartServiceCharge,
    cartTax,
    cartGrandTotal,
    manualDiscount,
    applyManualDiscount,
    clearManualDiscount,
    createOrder,
    tables,
    currentStore,
    storeSettings,
    getNextOrderSequence,
    editingOrder,
    saveEditingOrder,
    cancelEditingOrder,
    isDeliveryRestrictedByAdmin,
    customers,
    orders,
    findCustomerByPhone,
  } = useNexus();

  // Selected Payment Method on the same screen (Reference 2)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('Cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  
  // Custom discount input state
  const [discountTypeInput, setDiscountTypeInput] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValueInput, setDiscountValueInput] = useState<string>('');

  // Customer order history & lookup states
  const [historyModalCustomer, setHistoryModalCustomer] = useState<CustomerRecord | null>(null);
  const [matchedCustomer, setMatchedCustomer] = useState<CustomerRecord | null>(null);
  const [phoneSuggestions, setPhoneSuggestions] = useState<CustomerRecord[]>([]);
  const [showPhoneSuggestions, setShowPhoneSuggestions] = useState<boolean>(false);

  // Postcode lookup state
  const [isLookingUpPostcode, setIsLookingUpPostcode] = useState(false);
  const [postcodeError, setPostcodeError] = useState<string | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<UKAddressSuggestion[]>([]);
  const [allergyConfirmed, setAllergyConfirmed] = useState<boolean>(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Handle customer phone input & automatic profile identification
  const handleCustomerPhoneChange = (val: string) => {
    updateCustomerField('phone', val);
    const cleanDigits = val.replace(/\D/g, '');
    if (cleanDigits.length >= 4) {
      const match = findCustomerByPhone(val, currentStore?.id);
      if (match) {
        setMatchedCustomer(match);
        // Automatically populate customer details if empty or default
        if (!customerInfo.firstName || customerInfo.firstName === 'Customer' || customerInfo.firstName === 'Valued Customer') {
          updateCustomerField('firstName', match.name);
        }
        if (!customerInfo.fullAddress && match.address) {
          updateCustomerField('fullAddress', match.address);
        }
        if (!customerInfo.ukPostcode && match.postcode) {
          updateCustomerField('ukPostcode', match.postcode);
        }
        if (!customerInfo.notes && match.notes) {
          updateCustomerField('notes', match.notes);
        }
      } else {
        setMatchedCustomer(null);
      }

      const q = val.toLowerCase().trim();
      const filtered = (customers || []).filter(
        (c) =>
          c.phone.toLowerCase().includes(q) ||
          c.phone.replace(/\D/g, '').includes(cleanDigits) ||
          c.name.toLowerCase().includes(q)
      ).slice(0, 5);
      setPhoneSuggestions(filtered);
      setShowPhoneSuggestions(filtered.length > 0);
    } else {
      setMatchedCustomer(null);
      setPhoneSuggestions([]);
      setShowPhoneSuggestions(false);
    }
  };

  const handleSelectSuggestedCustomer = (cust: CustomerRecord) => {
    updateCustomerField('phone', cust.phone);
    updateCustomerField('firstName', cust.name);
    if (cust.address) updateCustomerField('fullAddress', cust.address);
    if (cust.postcode) updateCustomerField('ukPostcode', cust.postcode);
    if (cust.notes) updateCustomerField('notes', cust.notes);
    setMatchedCustomer(cust);
    setShowPhoneSuggestions(false);
  };

  if (!isOrderCheckModalOpen) return null;

  // Handle Postcode Lookup
  const handleLookupPostcode = async () => {
    const rawPostcode = customerInfo.ukPostcode;
    if (!rawPostcode || !rawPostcode.trim()) {
      setPostcodeError('Please enter a UK postcode.');
      return;
    }

    setIsLookingUpPostcode(true);
    setPostcodeError(null);
    setAddressSuggestions([]);

    try {
      const res = await lookupUKPostcode(rawPostcode);
      if (res.success && res.addresses && res.addresses.length > 0) {
        setAddressSuggestions(res.addresses);
        if (res.postcode) {
          updateCustomerField('ukPostcode', res.postcode);
        }
      } else {
        setPostcodeError(res.error || 'No address records found for this postcode.');
      }
    } catch {
      setPostcodeError('Network error looking up UK postcode.');
    } finally {
      setIsLookingUpPostcode(false);
    }
  };

  const handleSelectAddress = (suggestion: UKAddressSuggestion) => {
    updateCustomerField('fullAddress', suggestion.formattedAddress || `${suggestion.buildingNameOrNumber} ${suggestion.thoroughfare}`);
    updateCustomerField('ukPostcode', suggestion.postcode);
    setAddressSuggestions([]);
  };

  // Handle Discount Application
  const handleApplyCustomDiscount = () => {
    const num = parseFloat(discountValueInput);
    if (isNaN(num) || num <= 0) {
      clearManualDiscount();
      return;
    }
    applyManualDiscount(discountTypeInput, num);
  };

  const handlePresetDiscountClick = (type: 'percentage' | 'fixed', val: number) => {
    setDiscountTypeInput(type);
    setDiscountValueInput(val.toString());
    applyManualDiscount(type, val);
  };

  // Cash change calculations
  const tenderedNum = parseFloat(cashTendered) || 0;
  // Compare in whole pence: the cart total can carry float noise (e.g. 8.991)
  const totalPence = Math.round(cartGrandTotal * 100);
  const tenderedPence = Math.round(tenderedNum * 100);
  const changeDue = tenderedPence >= totalPence ? (tenderedPence - totalPence) / 100 : 0;

  // Handle Order Finalization
  const handleConfirmOrder = () => {
    setOrderError(null);

    if (cartItems.length === 0) {
      setOrderError('Cannot complete an empty order. Please add menu items.');
      return;
    }

    if (customerInfo.orderType === 'Delivery') {
      if (!customerInfo.firstName.trim()) {
        setOrderError('Please enter the customer name for delivery.');
        return;
      }
      if (!customerInfo.phone.trim()) {
        setOrderError('Please enter the customer phone number for delivery.');
        return;
      }
      if (!customerInfo.fullAddress.trim() && !customerInfo.ukPostcode.trim()) {
        setOrderError('Please provide delivery address or postcode.');
        return;
      }
      const restriction = isDeliveryRestrictedByAdmin(
        currentStore.id,
        customerInfo.fullAddress,
        customerInfo.ukPostcode
      );
      if (restriction.isRestricted) {
        setOrderError(`Restricted Delivery Area: ${restriction.reason || 'This address or postcode has been restricted in Admin settings.'}`);
        return;
      }
    }

    if (selectedPaymentMethod === 'Cash' && tenderedPence > 0 && tenderedPence < totalPence) {
      setOrderError(`Cash tendered (£${tenderedNum.toFixed(2)}) is less than the total (£${cartGrandTotal.toFixed(2)}).`);
      return;
    }

    if (editingOrder) {
      saveEditingOrder();
      setIsOrderCheckModalOpen(false);
      return;
    }

    const order = createOrder(selectedPaymentMethod);
    if (order) {
      setIsOrderCheckModalOpen(false);
      // Receipt modal will automatically open from context
    } else {
      setOrderError('Failed to record order. Please review order details.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-white border border-[#E5EAF2] rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-white border-b border-[#E5EAF2] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOrderCheckModalOpen(false)}
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#172033] tracking-tight">
                  {editingOrder ? 'Update Order Details' : 'Order Checking & Checkout'}
                </h2>
                {editingOrder ? (
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-500 text-white font-mono text-xs font-black shadow-2xs">
                    Editing Order #{editingOrder.orderNumber || editingOrder.invoiceId?.replace(/[^0-9]/g, '')}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-600 text-white font-mono text-xs font-black shadow-2xs">
                    Order #{getNextOrderSequence().orderNumber}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-mono text-[11px] font-bold border border-blue-100">
                  {currentStore?.businessName || 'POS Terminal'}
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                {editingOrder
                  ? `Updating existing order (${editingOrder.invoiceId}) without duplicating order sequence`
                  : 'Confirm order fulfillment, customer address, discount, and payment method'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOrderCheckModalOpen(false)}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner if any */}
        {orderError && (
          <div className="bg-rose-50 border-b border-rose-200 px-5 py-2.5 flex items-center gap-2 text-rose-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{orderError}</span>
          </div>
        )}

        {/* Main 2-Column Content Layout (Reference 2) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#E5EAF2]">
          {/* Left Column: Fulfillment, Customer, Discounts, Payment (7 Cols) */}
          <div className="lg:col-span-7 p-5 space-y-5 overflow-y-auto bg-white">
            {/* 1. Order Type Selection (Tabs) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#172033] mb-2">
                1. Order Fulfillment Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType('Delivery')}
                  className={`py-2.5 px-3 rounded-lg border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer shadow-xs ${
                    customerInfo.orderType === 'Delivery'
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white hover:bg-slate-50 text-[#172033] border-[#E5EAF2]'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  <span>Delivery</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderType('Pickup')}
                  className={`py-2.5 px-3 rounded-lg border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer shadow-xs ${
                    customerInfo.orderType === 'Pickup'
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white hover:bg-slate-50 text-[#172033] border-[#E5EAF2]'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Pickup</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderType('In-Store')}
                  className={`py-2.5 px-3 rounded-lg border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer shadow-xs ${
                    customerInfo.orderType === 'In-Store'
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white hover:bg-slate-50 text-[#172033] border-[#E5EAF2]'
                  }`}
                >
                  <InStoreIcon className="w-4 h-4" />
                  <span>In-Store</span>
                </button>
              </div>
            </div>

            {/* 2. Customer Information (Dynamically Rendered based on Order Type) */}
            <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E5EAF2] space-y-3">
              <div className="flex items-center justify-between border-b border-[#E5EAF2] pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    2. {customerInfo.orderType === 'Delivery' ? 'Delivery & Customer Info' : customerInfo.orderType === 'Pickup' ? 'Pickup Details' : 'Table Details'}
                  </span>
                </h3>
                <span className="text-[11px] text-[#64748B]">
                  {customerInfo.orderType === 'Delivery' ? 'UK Postcode & Address required' : 'Fast counter entry'}
                </span>
              </div>

              {/* Delivery Specific Fields */}
              {customerInfo.orderType === 'Delivery' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#172033] mb-1">
                        First / Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. John Doe"
                        value={customerInfo.firstName || ''}
                        onChange={(e) => updateCustomerField('firstName', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E5EAF2] text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-blue-600 shadow-xs"
                      />
                    </div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-[#172033]">
                          Contact Phone *
                        </label>
                        {matchedCustomer && (
                          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Profile Loaded
                          </span>
                        )}
                      </div>
                      <input
                        type="tel"
                        placeholder="e.g. 07911 123456"
                        value={customerInfo.phone || ''}
                        onChange={(e) => handleCustomerPhoneChange(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E5EAF2] text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-blue-600 shadow-xs"
                      />

                      {/* Phone suggestions dropdown */}
                      {showPhoneSuggestions && phoneSuggestions.length > 0 && (
                        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                          {phoneSuggestions.map((sug) => (
                            <div
                              key={sug.id}
                              onClick={() => handleSelectSuggestedCustomer(sug)}
                              className="p-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-slate-900">{sug.name}</span>
                                <span className="text-[11px] text-slate-500 font-mono ml-2">{sug.phone}</span>
                              </div>
                              <span className="text-[10px] font-bold text-blue-600">
                                {sug.totalOrders} {sug.totalOrders === 1 ? 'order' : 'orders'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customer Profile Loaded Banner & Order History Link */}
                  {matchedCustomer && (
                    <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-900">{matchedCustomer.name}</span>
                          <span className="text-slate-500 text-[11px] ml-1.5">
                            • {matchedCustomer.totalOrders} previous {matchedCustomer.totalOrders === 1 ? 'order' : 'orders'} (£{(matchedCustomer.totalSpend || 0).toFixed(2)})
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHistoryModalCustomer(matchedCustomer)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-100 text-[11px] font-bold transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                      >
                        <History className="w-3.5 h-3.5 text-blue-600" />
                        <span>Order History</span>
                      </button>
                    </div>
                  )}

                  {/* Google Maps Delivery Address Search & Map Preview */}
                  <DeliveryAddressSearch
                    currentStore={currentStore}
                    selectedAddress={
                      customerInfo.fullAddress
                        ? {
                            houseNumber: customerInfo.houseNumber || '',
                            street: customerInfo.street || '',
                            town: customerInfo.town || '',
                            county: customerInfo.county || '',
                            postcode: customerInfo.ukPostcode || '',
                            country: 'United Kingdom',
                            fullAddress: customerInfo.fullAddress,
                            latitude: customerInfo.latitude || currentStore.latitude || 51.5133,
                            longitude: customerInfo.longitude || currentStore.longitude || -0.1365,
                            placeId: customerInfo.placeId || 'ch_default_1',
                          }
                        : null
                    }
                    onAddressSelect={(structured, validation) => {
                      updateCustomerField('fullAddress', structured.fullAddress);
                      updateCustomerField('ukPostcode', structured.postcode);
                      updateCustomerField('houseNumber', structured.houseNumber);
                      updateCustomerField('street', structured.street);
                      updateCustomerField('town', structured.town);
                      updateCustomerField('county', structured.county);
                      updateCustomerField('latitude', structured.latitude);
                      updateCustomerField('longitude', structured.longitude);
                      updateCustomerField('placeId', structured.placeId);
                      if (validation.distanceMiles !== undefined) {
                        updateCustomerField('distanceMiles', validation.distanceMiles);
                        updateCustomerField('deliveryDurationMins', validation.estimatedDriveMins);
                      }
                      if (!validation.isValid) {
                        setOrderError(validation.message);
                      } else {
                        setOrderError(null);
                      }
                    }}
                  />

                  {/* Driver & Order Instructions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#172033] mb-1">
                        Driver Delivery Instructions / Gate Code
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Ring buzzer 4, leave on doorstep..."
                        value={customerInfo.driverInstructions || ''}
                        onChange={(e) => updateCustomerField('driverInstructions', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E5EAF2] text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-blue-600 shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#172033] mb-1">
                        Kitchen / Order Instructions
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Extra napkins, no cutlery, mild sauce..."
                        value={customerInfo.notes || ''}
                        onChange={(e) => updateCustomerField('notes', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E5EAF2] text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-blue-600 shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Allergy Confirmation Checkbox */}
                  <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={allergyConfirmed}
                      onChange={(e) => setAllergyConfirmed(e.target.checked)}
                      className="w-4 h-4 rounded border-[#E5EAF2] text-blue-600 focus:ring-0"
                    />
                    <span className="text-[11px] text-[#172033] flex items-center gap-1 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Allergy requirements checked with customer</span>
                    </span>
                  </label>
                </div>
              )}

              {/* Pickup Specific Fields */}
              {customerInfo.orderType === 'Pickup' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#172033] mb-1">
                        Customer Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Sarah Connor"
                        value={customerInfo.firstName || ''}
                        onChange={(e) => updateCustomerField('firstName', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E5EAF2] text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-blue-600 shadow-xs"
                      />
                    </div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-[#172033]">
                          Contact Phone
                        </label>
                        {matchedCustomer && (
                          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Profile Loaded
                          </span>
                        )}
                      </div>
                      <input
                        type="tel"
                        placeholder="e.g. 07911 123456"
                        value={customerInfo.phone || ''}
                        onChange={(e) => handleCustomerPhoneChange(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E5EAF2] text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-blue-600 shadow-xs"
                      />

                      {/* Phone suggestions dropdown */}
                      {showPhoneSuggestions && phoneSuggestions.length > 0 && (
                        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                          {phoneSuggestions.map((sug) => (
                            <div
                              key={sug.id}
                              onClick={() => handleSelectSuggestedCustomer(sug)}
                              className="p-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-slate-900">{sug.name}</span>
                                <span className="text-[11px] text-slate-500 font-mono ml-2">{sug.phone}</span>
                              </div>
                              <span className="text-[10px] font-bold text-blue-600">
                                {sug.totalOrders} {sug.totalOrders === 1 ? 'order' : 'orders'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customer Profile Banner for Pickup */}
                  {matchedCustomer && (
                    <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-900">{matchedCustomer.name}</span>
                          <span className="text-slate-500 text-[11px] ml-1.5">
                            • {matchedCustomer.totalOrders} previous {matchedCustomer.totalOrders === 1 ? 'order' : 'orders'} (£{(matchedCustomer.totalSpend || 0).toFixed(2)})
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHistoryModalCustomer(matchedCustomer)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-100 text-[11px] font-bold transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                      >
                        <History className="w-3.5 h-3.5 text-blue-600" />
                        <span>Order History</span>
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-[#172033] mb-1">
                      Estimated Pickup Time
                    </label>
                    <div className="flex gap-2">
                      {['ASAP (10-15m)', '15-20 mins', '30 mins', '45 mins', '1 hour'].map((timeStr) => (
                        <button
                          key={timeStr}
                          type="button"
                          onClick={() => updateCustomerField('pickupTime', timeStr)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer shadow-xs ${
                            customerInfo.pickupTime === timeStr
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white text-[#64748B] border-[#E5EAF2] hover:text-[#172033]'
                          }`}
                        >
                          {timeStr}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#172033] mb-1">
                      Kitchen / Order Instructions
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Extra napkins, pack sauces separately, allergic to nuts..."
                      value={customerInfo.notes || ''}
                      onChange={(e) => updateCustomerField('notes', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E5EAF2] text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-blue-600 shadow-xs"
                    />
                  </div>
                </div>
              )}

              {/* In-Store Specific Fields */}
              {customerInfo.orderType === 'In-Store' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#172033] mb-1">
                      Select Table Reference
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {tables.slice(0, 12).map((tbl) => {
                        const isSelected = customerInfo.tableReference === tbl.tableNumber;
                        return (
                          <button
                            key={tbl.id}
                            type="button"
                            onClick={() => updateCustomerField('tableReference', tbl.tableNumber)}
                            className={`p-2 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer shadow-xs ${
                              isSelected
                                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                : 'bg-white text-[#172033] border-[#E5EAF2] hover:bg-slate-50'
                            }`}
                          >
                            <span>{tbl.tableNumber}</span>
                            <span className="block text-[9px] font-normal text-[#64748B]">
                              {tbl.zone}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#172033] mb-1">
                      Customer / Server Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. VIP guest, water for table..."
                      value={customerInfo.notes || ''}
                      onChange={(e) => updateCustomerField('notes', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E5EAF2] text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-blue-600 shadow-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3. Discount Section (Reference 2: On the SAME screen) */}
            <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E5EAF2] space-y-3">
              <div className="flex items-center justify-between border-b border-[#E5EAF2] pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033] flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-blue-600" />
                  <span>3. Order Discount</span>
                </h3>
                {manualDiscount && (
                  <button
                    type="button"
                    onClick={clearManualDiscount}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                  >
                    Clear Discount
                  </button>
                )}
              </div>

              {/* Discount Input & Type */}
              <div className="flex items-center gap-2">
                <div className="flex bg-white p-0.5 rounded-lg border border-[#E5EAF2] shadow-xs">
                  <button
                    type="button"
                    onClick={() => setDiscountTypeInput('percentage')}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                      discountTypeInput === 'percentage'
                        ? 'bg-blue-600 text-white'
                        : 'text-[#64748B] hover:text-[#172033]'
                    }`}
                  >
                    % Percent
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountTypeInput('fixed')}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                      discountTypeInput === 'fixed'
                        ? 'bg-blue-600 text-white'
                        : 'text-[#64748B] hover:text-[#172033]'
                    }`}
                  >
                    £ Amount
                  </button>
                </div>

                <div className="relative flex-1">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder={discountTypeInput === 'percentage' ? 'e.g. 10 (%)' : 'e.g. 5.00 (£)'}
                    value={discountValueInput}
                    onChange={(e) => setDiscountValueInput(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E5EAF2] text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleApplyCustomDiscount}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Apply
                </button>
              </div>

              {/* Preset Discount Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { type: 'percentage' as const, val: 5, label: '5%' },
                  { type: 'percentage' as const, val: 10, label: '10%' },
                  { type: 'percentage' as const, val: 15, label: '15%' },
                  { type: 'percentage' as const, val: 20, label: '20%' },
                  { type: 'percentage' as const, val: 50, label: '50%' },
                  { type: 'fixed' as const, val: 2, label: '£2 Off' },
                  { type: 'fixed' as const, val: 5, label: '£5 Off' },
                  { type: 'fixed' as const, val: 10, label: '£10 Off' },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePresetDiscountClick(preset.type, preset.val)}
                    className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 border border-[#E5EAF2] hover:border-blue-500 text-[11px] font-bold text-[#172033] transition-colors cursor-pointer shadow-xs"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {manualDiscount && (
                <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between text-xs text-blue-800">
                  <span>
                    Applied Discount: <strong>{manualDiscount.type === 'percentage' ? `${manualDiscount.value}%` : `£${manualDiscount.value.toFixed(2)}`}</strong>
                  </span>
                  <span className="font-mono font-bold">-£{cartManualDiscount.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* 4. Payment Method Selection (Reference 2: On the SAME screen) */}
            <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E5EAF2] space-y-3">
              <div className="flex items-center justify-between border-b border-[#E5EAF2] pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033] flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  <span>4. Payment Method</span>
                </h3>
                <span className="text-[11px] text-[#64748B]">Instant tender & change</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('Cash')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                    selectedPaymentMethod === 'Cash'
                      ? 'bg-blue-50 border-blue-600 text-blue-700 ring-1 ring-blue-600 font-bold'
                      : 'bg-white border-[#E5EAF2] text-[#172033] hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-blue-600" />
                  <span className="text-xs font-bold">Cash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('Card')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                    selectedPaymentMethod === 'Card'
                      ? 'bg-blue-50 border-blue-600 text-blue-700 ring-1 ring-blue-600 font-bold'
                      : 'bg-white border-[#E5EAF2] text-[#172033] hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span className="text-xs font-bold">Card / Terminal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('Online')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                    selectedPaymentMethod === 'Online'
                      ? 'bg-blue-50 border-blue-600 text-blue-700 ring-1 ring-blue-600 font-bold'
                      : 'bg-white border-[#E5EAF2] text-[#172033] hover:bg-slate-50'
                  }`}
                >
                  <Globe className="w-5 h-5 text-blue-600" />
                  <span className="text-xs font-bold">Online / QR</span>
                </button>
              </div>

              {/* If Cash Selected: Tendered and Change */}
              {selectedPaymentMethod === 'Cash' && (
                <div className="p-3 bg-white rounded-lg border border-[#E5EAF2] space-y-2 shadow-xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#64748B] font-bold">Amount Tendered:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-[#64748B]">£</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder={cartGrandTotal.toFixed(2)}
                        value={cashTendered}
                        onChange={(e) => setCashTendered(e.target.value)}
                        className="w-24 px-2 py-1 bg-[#F8FAFC] border border-[#E5EAF2] rounded text-right font-mono font-bold text-[#172033] text-xs focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  {/* Cash Presets */}
                  <div className="flex gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setCashTendered(cartGrandTotal.toFixed(2))}
                      className="px-2 py-1 bg-[#F8FAFC] hover:bg-slate-100 border border-[#E5EAF2] rounded text-[10px] font-bold text-[#172033] cursor-pointer"
                    >
                      Exact (£{cartGrandTotal.toFixed(2)})
                    </button>
                    {[10, 20, 50, 100].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCashTendered(amt.toString())}
                        className="px-2 py-1 bg-[#F8FAFC] hover:bg-slate-100 border border-[#E5EAF2] rounded text-[10px] font-mono font-bold text-[#172033] cursor-pointer"
                      >
                        £{amt}
                      </button>
                    ))}
                  </div>

                  {/* Change Due Display */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#E5EAF2] text-xs">
                    <span className="font-bold text-[#172033]">Change to Return:</span>
                    <span
                      className={`font-mono font-bold text-sm ${
                        changeDue > 0 ? 'text-amber-600' : 'text-[#64748B]'
                      }`}
                    >
                      £{changeDue.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Itemized Order Summary (5 Cols) */}
          <div className="lg:col-span-5 p-5 flex flex-col justify-between bg-[#F8FAFC]">
            <div>
              <div className="flex items-center justify-between border-b border-[#E5EAF2] pb-3 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033] flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-blue-600" />
                  <span>Order Items Review ({cartItems.length})</span>
                </h3>
                <span className="text-[11px] font-mono text-blue-600 font-bold px-2 py-0.5 rounded bg-blue-50 border border-blue-100">
                  {customerInfo.orderType}
                </span>
              </div>

              {/* Line Items List */}
              <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1">
                {cartItems.map((item) => {
                  const modsSum = (item.modifications || []).reduce((s, m) => s + (Number(m.price) || 0), 0);
                  const lineUnit = item.unitPrice + item.modifiersTotal + modsSum;
                  const lineTotal = lineUnit * item.quantity;
                  return (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-lg bg-white border border-[#E5EAF2] text-xs space-y-1 shadow-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-blue-50 text-blue-600 font-mono font-bold flex items-center justify-center text-[11px]">
                            {item.quantity}x
                          </span>
                          <span className="font-bold text-[#172033]">{item.productName}</span>
                        </div>
                        <span className="font-mono font-bold text-[#172033]">
                          £{lineTotal.toFixed(2)}
                        </span>
                      </div>

                      {/* Variant Badge */}
                      <div className="pl-7 flex items-center gap-1 text-[11px] text-blue-600 font-medium">
                        <span>Size: {item.variantName}</span>
                      </div>

                      {/* Modifiers List */}
                      {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                        <div className="pl-7 space-y-0.5">
                          {item.selectedModifiers.map((mod, i) => (
                            <div
                              key={i}
                              className="text-[10px] text-[#64748B] flex items-center justify-between"
                            >
                              <span>+ {mod.name}</span>
                              <span className="font-mono text-blue-600 font-bold">
                                +£{(mod.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Item Modifications List */}
                      {item.modifications && item.modifications.length > 0 && (
                        <div className="pl-7 space-y-0.5 pt-0.5">
                          {item.modifications.map((mod) => (
                            <div
                              key={mod.id}
                              className="text-[10px] text-blue-700 flex items-center justify-between font-medium"
                            >
                              <span>• {mod.name}</span>
                              <span className="font-mono font-bold">
                                {mod.price > 0 ? `+£${(mod.price * item.quantity).toFixed(2)}` : 'Free'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Kitchen Note */}
                      {(item.notes || item.specialInstructions) && (
                        <div className="pl-7 text-[10px] text-amber-900 bg-amber-50/90 rounded px-2 py-0.5 border border-amber-200/90 italic font-medium mt-0.5 inline-block">
                          Note: "{item.notes || item.specialInstructions}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="mt-4 pt-3 border-t border-[#E5EAF2] space-y-1.5 text-xs text-[#64748B]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono text-[#172033] font-bold">£{cartSubtotal.toFixed(2)}</span>
                </div>

                {cartModifiersTotal > 0 && (
                  <div className="flex justify-between">
                    <span>Add-ons / Extras:</span>
                    <span className="font-mono text-blue-600 font-bold">+£{cartModifiersTotal.toFixed(2)}</span>
                  </div>
                )}

                {customerInfo.orderType === 'Delivery' && (
                  <div className="flex justify-between">
                    <span>Delivery Fee:</span>
                    <span className="font-mono text-[#172033] font-bold">
                      {cartDeliveryFee === 0 ? 'FREE' : `£${cartDeliveryFee.toFixed(2)}`}
                    </span>
                  </div>
                )}

                {cartTotalDiscount > 0 && (
                  <div className="flex justify-between text-blue-600 font-bold">
                    <span>Total Discounts:</span>
                    <span className="font-mono">-£{cartTotalDiscount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>VAT (20% included):</span>
                  <span className="font-mono text-[#64748B]">£{cartTax.toFixed(2)}</span>
                </div>

                {/* Grand Total */}
                <div className="pt-2 border-t border-[#E5EAF2] flex items-center justify-between text-sm">
                  <span className="font-bold text-[#172033]">Grand Total:</span>
                  <span className="font-mono font-extrabold text-lg text-blue-600">
                    £{cartGrandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-5 space-y-2">
              <button
                type="button"
                onClick={handleConfirmOrder}
                className={`w-full py-3 rounded-lg text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer ${
                  editingOrder ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {editingOrder
                    ? `Save Changes to Order #${editingOrder.orderNumber || editingOrder.invoiceId?.replace(/[^0-9]/g, '')} (£${cartGrandTotal.toFixed(2)})`
                    : `Confirm & Place Order (£${cartGrandTotal.toFixed(2)})`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsOrderCheckModalOpen(false)}
                className="w-full py-2 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
              >
                Back to Menu
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Order History Modal */}
      {historyModalCustomer && (
        <CustomerOrderHistoryModal
          isOpen={Boolean(historyModalCustomer)}
          onClose={() => setHistoryModalCustomer(null)}
          customer={historyModalCustomer}
          orders={orders}
        />
      )}
    </div>
  );
};

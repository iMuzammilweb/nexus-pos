import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  Globe,
  CheckCircle2,
  AlertCircle,
  Receipt,
  QrCode,
  Smartphone,
  Send,
  Sparkles,
  ShoppingBag,
  Truck,
  Store,
  ArrowRight,
  Calculator,
  RotateCcw,
  Check,
  Split,
  Printer,
  ShieldCheck,
  User,
  Phone,
  MapPin,
} from 'lucide-react';
import { useNexus } from '../../context/NexusContext';
import { PaymentMethod } from '../../types';

export const CheckoutPaymentModal: React.FC = () => {
  const {
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    cartItems,
    customerInfo,
    updateCustomerField,
    cartSubtotal,
    cartModifiersTotal,
    cartCouponDiscount,
    cartPresetDiscount,
    cartDeliveryFee,
    cartServiceCharge,
    cartTax,
    cartGrandTotal,
    appliedCoupon,
    appliedPresetDiscount,
    createOrder,
    currentStore,
    currentEmployee,
  } = useNexus();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('Cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [cardType, setCardType] = useState<'Contactless' | 'Chip & PIN' | 'Apple/Google Pay'>('Contactless');
  const [onlineType, setOnlineType] = useState<'QR Code' | 'Payment Link' | 'Digital Wallet'>('QR Code');
  const [onlineRef, setOnlineRef] = useState<string>('');
  const [linkSent, setLinkSent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Split payment state
  const [splitCashAmount, setSplitCashAmount] = useState<string>('');
  const [splitCardAmount, setSplitCardAmount] = useState<string>('');

  // Reset or set defaults when modal opens
  useEffect(() => {
    if (isPaymentModalOpen) {
      setCashTendered((cartGrandTotal || 0).toFixed(2));
      setSplitCashAmount(((cartGrandTotal || 0) / 2).toFixed(2));
      setSplitCardAmount(((cartGrandTotal || 0) / 2).toFixed(2));
      setOnlineRef(`TX-${Math.floor(100000 + Math.random() * 900000)}`);
      setLinkSent(false);
      setIsProcessing(false);
      setValidationError(null);
    }
  }, [isPaymentModalOpen, cartGrandTotal]);

  if (!isPaymentModalOpen) return null;

  const grandTotal = cartGrandTotal || 0;
  const tenderedNumeric = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, tenderedNumeric - grandTotal);
  const remainingDue = Math.max(0, grandTotal - tenderedNumeric);

  // Quick cash denomination handlers
  const handleQuickCash = (amount: number) => {
    setCashTendered(amount.toFixed(2));
  };

  const handleExactCash = () => {
    setCashTendered(grandTotal.toFixed(2));
  };

  const handleNumpadPress = (val: string) => {
    if (val === 'C') {
      setCashTendered('');
      return;
    }
    if (val === 'BACK') {
      setCashTendered((prev) => prev.slice(0, -1));
      return;
    }
    if (val === '.' && cashTendered.includes('.')) return;
    setCashTendered((prev) => {
      if (prev === '0' && val !== '.') return val;
      return prev + val;
    });
  };

  const handleSendPaymentLink = () => {
    if (!customerInfo.phone) {
      setValidationError('Customer phone number is required to send payment link.');
      return;
    }
    setLinkSent(true);
    setValidationError(null);
  };

  const handleCompletePayment = () => {
    setValidationError(null);

    // Validate delivery requirements
    if (customerInfo.orderType === 'Delivery') {
      if (!customerInfo.phone || !customerInfo.firstName || !customerInfo.ukPostcode || !customerInfo.fullAddress) {
        setValidationError('Please complete all required delivery details (Name, Phone, Postcode, Address).');
        return;
      }
    }

    // Validate cash tender
    if (selectedMethod === 'Cash' && tenderedNumeric < grandTotal) {
      setValidationError(`Amount tendered (£${tenderedNumeric.toFixed(2)}) is less than total due (£${grandTotal.toFixed(2)}).`);
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      createOrder(selectedMethod);
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white border border-[#E5EAF2] rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-white border-b border-[#E5EAF2] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#172033]">Order Checkout & Payment</h3>
                <span
                  className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    customerInfo.orderType === 'Delivery'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : customerInfo.orderType === 'Pickup'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                >
                  {customerInfo.orderType}
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                Store: {currentStore?.businessName || 'Nexus POS'} • Cashier: {currentEmployee?.name || 'Administrator'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsPaymentModalOpen(false)}
            className="p-2 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Content: 2 Columns */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* LEFT COLUMN: Order Summary & Live Financials (5 cols) */}
          <div className="lg:col-span-5 p-5 bg-[#F8FAFC] border-b lg:border-b-0 lg:border-r border-[#E5EAF2] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Order Summary ({cartItems.length} items)
                </h4>
                <span className="text-[11px] font-mono text-[#64748B]">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Customer Info Card */}
              <div className="p-3 rounded-lg bg-white border border-[#E5EAF2] text-xs space-y-1 shadow-xs">
                <div className="flex items-center gap-1.5 font-bold text-[#172033]">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    {customerInfo.firstName ? `${customerInfo.firstName} ${customerInfo.lastName}` : 'Walk-in Guest'}
                  </span>
                </div>
                {customerInfo.phone && (
                  <div className="flex items-center gap-1.5 text-[#64748B] text-[11px] font-mono">
                    <Phone className="w-3 h-3 text-[#64748B]" />
                    <span>{customerInfo.phone}</span>
                  </div>
                )}
                {customerInfo.orderType === 'Delivery' && customerInfo.ukPostcode && (
                  <div className="flex items-center gap-1.5 text-[#64748B] text-[11px]">
                    <MapPin className="w-3 h-3 text-[#64748B]" />
                    <span className="truncate">{customerInfo.fullAddress || customerInfo.ukPostcode}</span>
                  </div>
                )}
                {customerInfo.orderType === 'In-Store' && customerInfo.tableReference && (
                  <div className="text-blue-600 font-semibold text-[11px]">
                    Table / Reference: {customerInfo.tableReference}
                  </div>
                )}
              </div>

              {/* Line Items Scrollable List */}
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg bg-white border border-[#E5EAF2] text-xs flex items-start justify-between gap-2 shadow-xs"
                  >
                    <div className="flex-1">
                      <div className="font-bold text-[#172033]">
                        {item.quantity}x {item.productName}
                      </div>
                      <div className="text-[11px] text-blue-600 font-medium">{item.variantName}</div>
                      {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                        <div className="text-[10px] text-[#64748B] space-x-1 mt-0.5">
                          {item.selectedModifiers.map((m, mi) => (
                            <span key={mi}>+{m.name} </span>
                          ))}
                        </div>
                      )}
                      {(item.notes || item.specialInstructions) && (
                        <div className="text-[10px] text-amber-900 bg-amber-50/90 rounded px-1.5 py-0.5 border border-amber-200/90 mt-1 italic font-medium">
                          Note: "{item.notes || item.specialInstructions}"
                        </div>
                      )}
                    </div>
                    <span className="font-mono font-bold text-[#172033]">
                      £{(item.totalPrice || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Calculations Box */}
            <div className="p-4 rounded-xl bg-white border border-[#E5EAF2] space-y-2 text-xs shadow-xs">
              <div className="flex justify-between text-[#64748B]">
                <span>Subtotal</span>
                <span className="font-mono text-[#172033]">£{(cartSubtotal || 0).toFixed(2)}</span>
              </div>

              {(cartModifiersTotal || 0) > 0 && (
                <div className="flex justify-between text-[#64748B]">
                  <span>Add-ons / Modifiers</span>
                  <span className="font-mono text-[#172033]">£{(cartModifiersTotal || 0).toFixed(2)}</span>
                </div>
              )}

              {(cartCouponDiscount || 0) > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Coupon ({appliedCoupon?.code})</span>
                  <span className="font-mono">-£{(cartCouponDiscount || 0).toFixed(2)}</span>
                </div>
              )}

              {(cartPresetDiscount || 0) > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount ({appliedPresetDiscount?.name})</span>
                  <span className="font-mono">-£{(cartPresetDiscount || 0).toFixed(2)}</span>
                </div>
              )}

              {customerInfo.orderType === 'Delivery' && (
                <div className="flex justify-between text-[#64748B]">
                  <span>Delivery Charge</span>
                  <span className="font-mono text-[#172033]">£{(cartDeliveryFee || 0).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-[#64748B]">
                <span>Service Charge (3%)</span>
                <span className="font-mono text-[#172033]">£{(cartServiceCharge || 0).toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-[11px] text-[#64748B]">
                <span>Incl. UK VAT (20%)</span>
                <span className="font-mono">£{(cartTax || 0).toFixed(2)}</span>
              </div>

              {/* Large Grand Total Highlight */}
              <div className="pt-2 border-t border-[#E5EAF2] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-[#64748B]">Total Due</span>
                  <div className="text-[10px] text-blue-600 font-medium">GBP Currency</div>
                </div>
                <div className="text-2xl font-black font-mono text-blue-600">
                  £{grandTotal.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Payment Method Selection & Interactive Input (7 cols) */}
          <div className="lg:col-span-7 p-5 flex flex-col justify-between space-y-4 bg-white">
            <div className="space-y-4">
              {/* Payment Method Selector Tabs */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('Cash')}
                    className={`p-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      selectedMethod === 'Cash'
                        ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-600'
                        : 'bg-white text-[#172033] hover:bg-slate-50 border border-[#E5EAF2]'
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('Card')}
                    className={`p-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      selectedMethod === 'Card'
                        ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-600'
                        : 'bg-white text-[#172033] hover:bg-slate-50 border border-[#E5EAF2]'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Card / PIN</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('Online')}
                    className={`p-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      selectedMethod === 'Online'
                        ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-600'
                        : 'bg-white text-[#172033] hover:bg-slate-50 border border-[#E5EAF2]'
                    }`}
                  >
                    <Globe className="w-5 h-5" />
                    <span>Online / QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('Split')}
                    className={`p-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      selectedMethod === 'Split'
                        ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-600'
                        : 'bg-white text-[#172033] hover:bg-slate-50 border border-[#E5EAF2]'
                    }`}
                  >
                    <Split className="w-5 h-5" />
                    <span>Split Pay</span>
                  </button>
                </div>
              </div>

              {/* METHOD-SPECIFIC PANELS */}

              {/* 1. CASH PAYMENT PANEL */}
              {selectedMethod === 'Cash' && (
                <div className="space-y-3 p-4 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2] animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#172033]">Amount Tendered</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={handleExactCash}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold border border-blue-200 cursor-pointer"
                      >
                        Exact (£{grandTotal.toFixed(2)})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickCash(5)}
                        className="px-2 py-1 rounded-lg bg-white hover:bg-slate-50 text-[#172033] text-xs font-bold border border-[#E5EAF2] cursor-pointer shadow-xs"
                      >
                        £5
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickCash(10)}
                        className="px-2 py-1 rounded-lg bg-white hover:bg-slate-50 text-[#172033] text-xs font-bold border border-[#E5EAF2] cursor-pointer shadow-xs"
                      >
                        £10
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickCash(20)}
                        className="px-2 py-1 rounded-lg bg-white hover:bg-slate-50 text-[#172033] text-xs font-bold border border-[#E5EAF2] cursor-pointer shadow-xs"
                      >
                        £20
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickCash(50)}
                        className="px-2 py-1 rounded-lg bg-white hover:bg-slate-50 text-[#172033] text-xs font-bold border border-[#E5EAF2] cursor-pointer shadow-xs"
                      >
                        £50
                      </button>
                    </div>
                  </div>

                  {/* Cash Input & Change Display */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-white border border-[#E5EAF2] shadow-xs">
                      <span className="text-[10px] uppercase font-bold text-[#64748B] block mb-1">
                        Cash Given (£)
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={cashTendered}
                        onChange={(e) => setCashTendered(e.target.value)}
                        placeholder="0.00"
                        className="w-full text-xl font-mono font-black text-[#172033] bg-transparent outline-none"
                      />
                    </div>

                    <div
                      className={`p-3 rounded-lg border flex flex-col justify-between ${
                        tenderedNumeric >= grandTotal
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-amber-50 border-amber-200 text-amber-700'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold tracking-wider block">
                        {tenderedNumeric >= grandTotal ? 'Change To Return' : 'Remaining Due'}
                      </span>
                      <span className="text-xl font-mono font-black">
                        £{tenderedNumeric >= grandTotal ? changeDue.toFixed(2) : remainingDue.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Touch Numpad for Cash */}
                  <div className="grid grid-cols-6 gap-1.5 pt-1">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.', 'BACK'].map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleNumpadPress(key)}
                        className="py-2.5 rounded-lg bg-white hover:bg-[#EFF6FF] text-[#172033] font-mono font-bold text-xs border border-[#E5EAF2] hover:border-blue-300 active:scale-95 transition-all cursor-pointer shadow-xs"
                      >
                        {key === 'BACK' ? '⌫' : key}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-[#64748B] pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Cash Drawer will automatically trigger and log sale transaction.</span>
                  </div>
                </div>
              )}

              {/* 2. CARD PAYMENT PANEL */}
              {selectedMethod === 'Card' && (
                <div className="space-y-3 p-4 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2] animate-in fade-in">
                  <div className="text-xs font-bold text-[#172033] mb-1">Select Card Mode</div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Contactless', 'Chip & PIN', 'Apple/Google Pay'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setCardType(mode)}
                        className={`p-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          cardType === mode
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white text-[#172033] hover:bg-slate-50 border border-[#E5EAF2]'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>

                  {/* Terminal Simulator Box */}
                  <div className="p-4 rounded-xl bg-white border border-[#E5EAF2] text-center space-y-2 shadow-xs">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto animate-pulse">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-sm text-[#172033]">
                      Terminal Ready: £{grandTotal.toFixed(2)}
                    </div>
                    <p className="text-xs text-[#64748B] max-w-xs mx-auto">
                      Customer may tap card/phone on terminal or insert chip. Status: Online & Integrated.
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                    <span>Card Reader: Castles Vega3000 (Connected)</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      Live Ready
                    </span>
                  </div>
                </div>
              )}

              {/* 3. ONLINE / QR PAYMENT PANEL */}
              {selectedMethod === 'Online' && (
                <div className="space-y-3 p-4 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2] animate-in fade-in">
                  <div className="grid grid-cols-3 gap-2">
                    {(['QR Code', 'Payment Link', 'Digital Wallet'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setOnlineType(opt)}
                        className={`p-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          onlineType === opt
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white text-[#172033] hover:bg-slate-50 border border-[#E5EAF2]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  {onlineType === 'QR Code' && (
                    <div className="p-4 rounded-xl bg-white border border-[#E5EAF2] flex flex-col items-center text-center space-y-2 shadow-xs">
                      <div className="p-3 bg-white rounded-xl shadow-xs border border-[#E5EAF2]">
                        <div className="w-28 h-28 bg-[#172033] p-2 rounded-lg flex items-center justify-center text-white">
                          <QrCode className="w-24 h-24 text-white" />
                        </div>
                      </div>
                      <div className="text-xs font-bold text-[#172033]">
                        Scan to Pay £{grandTotal.toFixed(2)}
                      </div>
                      <p className="text-[11px] text-[#64748B]">
                        Customer scans with banking app or camera to complete instant payment.
                      </p>
                    </div>
                  )}

                  {onlineType === 'Payment Link' && (
                    <div className="p-4 rounded-xl bg-white border border-[#E5EAF2] space-y-3 shadow-xs">
                      <div className="text-xs font-bold text-[#172033]">Send Payment Link via SMS</div>
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          placeholder="07700 900000"
                          value={customerInfo.phone || ''}
                          onChange={(e) => updateCustomerField('phone', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] text-xs font-mono focus:border-blue-600 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleSendPaymentLink}
                          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Link</span>
                        </button>
                      </div>
                      {linkSent && (
                        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>Payment link sent to {customerInfo.phone}! Customer opened checkout page.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {onlineType === 'Digital Wallet' && (
                    <div className="p-4 rounded-xl bg-white border border-[#E5EAF2] space-y-3 shadow-xs">
                      <div className="text-xs font-bold text-[#172033]">Online Reference / Gateway Code</div>
                      <input
                        type="text"
                        value={onlineRef}
                        onChange={(e) => setOnlineRef(e.target.value)}
                        placeholder="e.g. TX-948210"
                        className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] text-xs font-mono uppercase focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 4. SPLIT PAYMENT PANEL */}
              {selectedMethod === 'Split' && (
                <div className="space-y-3 p-4 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2] animate-in fade-in">
                  <div className="text-xs font-bold text-[#172033]">Split Bill Across Multiple Methods</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-white border border-[#E5EAF2] shadow-xs">
                      <span className="text-[10px] uppercase font-bold text-[#64748B] block mb-1">
                        Cash Portion (£)
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={splitCashAmount}
                        onChange={(e) => setSplitCashAmount(e.target.value)}
                        className="w-full text-lg font-mono font-bold text-[#172033] bg-transparent outline-none"
                      />
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-[#E5EAF2] shadow-xs">
                      <span className="text-[10px] uppercase font-bold text-[#64748B] block mb-1">
                        Card Portion (£)
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={splitCardAmount}
                        onChange={(e) => setSplitCardAmount(e.target.value)}
                        className="w-full text-lg font-mono font-bold text-[#172033] bg-transparent outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Inline Validation Alert */}
              {validationError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2 animate-in shake">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-[#E5EAF2] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-[#172033] border border-[#E5EAF2] font-bold text-xs transition-colors cursor-pointer"
              >
                Back to Cart
              </button>

              <button
                type="button"
                onClick={handleCompletePayment}
                disabled={isProcessing || cartItems.length === 0}
                className="flex-1 py-3 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>Processing Payment...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>
                      Complete Order & Pay £{grandTotal.toFixed(2)} ({selectedMethod})
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

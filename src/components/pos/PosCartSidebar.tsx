import React, { useState } from 'react';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Receipt,
  Sparkles,
  Tag,
  CheckCircle2,
  Truck,
  Store,
  Edit2,
  Check,
  X,
  PlusCircle,
  Pencil,
} from 'lucide-react';
import { useNexus } from '../../context/NexusContext';
import { CartItem, ItemModification } from '../../types';

interface CartItemModificationsProps {
  item: CartItem;
}

const CartItemModifications: React.FC<CartItemModificationsProps> = ({ item }) => {
  const { addCartItemModification, updateCartItemModification, removeCartItemModification } = useNexus();
  const [isAdding, setIsAdding] = useState(false);
  const [editingModId, setEditingModId] = useState<string | null>(null);
  const [modName, setModName] = useState('');
  const [modPrice, setModPrice] = useState('0.00');

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingModId(null);
    setModName('');
    setModPrice('0.00');
  };

  const handleStartEdit = (mod: ItemModification) => {
    setIsAdding(false);
    setEditingModId(mod.id);
    setModName(mod.name);
    setModPrice(mod.price.toFixed(2));
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingModId(null);
    setModName('');
    setModPrice('0.00');
  };

  const handleSave = () => {
    if (!modName.trim()) return;
    const parsedPrice = Math.max(0, parseFloat(modPrice) || 0);

    if (editingModId) {
      updateCartItemModification(item.id, editingModId, modName.trim(), parsedPrice);
    } else {
      addCartItemModification(item.id, modName.trim(), parsedPrice);
    }

    handleCancel();
  };

  const modifications = item.modifications || [];

  return (
    <div className="pt-1 text-[11px]">
      {/* Existing modifications list */}
      {modifications.length > 0 && (
        <div className="space-y-1 mb-1.5 pl-2 border-l-2 border-blue-200">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Modifications:
          </div>
          {modifications.map((mod) => (
            <div
              key={mod.id}
              className="flex items-center justify-between gap-1 bg-slate-50 hover:bg-blue-50/60 p-1 px-1.5 rounded border border-slate-200 transition-colors"
            >
              <div className="flex-1 truncate">
                <span className="font-medium text-slate-800">{mod.name}</span>
                <span className="ml-1 font-mono text-[10px] font-semibold text-blue-600">
                  {mod.price > 0 ? `+£${mod.price.toFixed(2)}` : 'Free'}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleStartEdit(mod)}
                  className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-white transition-colors cursor-pointer"
                  title="Edit modification"
                >
                  <Edit2 className="w-2.5 h-2.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeCartItemModification(item.id, mod.id)}
                  className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-white transition-colors cursor-pointer"
                  title="Remove modification"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inline Add / Edit Form */}
      {isAdding || editingModId ? (
        <div className="p-2 bg-blue-50/70 border border-blue-200 rounded-lg space-y-1.5 mt-1">
          <div className="text-[10px] font-bold text-blue-800">
            {editingModId ? 'Edit Modification' : 'Add Item Modification'}
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={modName}
              onChange={(e) => setModName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
              placeholder="e.g. Extra sauce, No onion"
              autoFocus
              className="flex-1 px-2 py-1 bg-white border border-blue-200 rounded text-[11px] text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
            <div className="w-20 relative">
              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">£</span>
              <input
                type="number"
                step="0.10"
                min="0"
                value={modPrice}
                onChange={(e) => setModPrice(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') handleCancel();
                }}
                placeholder="0.00"
                className="w-full pl-4 pr-1 py-1 bg-white border border-blue-200 rounded font-mono text-[11px] text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={handleCancel}
              className="px-2 py-0.5 rounded text-[10px] font-medium text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!modName.trim()}
              className="px-2.5 py-0.5 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
            >
              <Check className="w-3 h-3" />
              <span>{editingModId ? 'Update' : 'Add'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Minimal trigger button */
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-[10px] text-slate-400 font-medium">Modifications (Optional)</span>
          <button
            type="button"
            onClick={handleStartAdd}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200 transition-all cursor-pointer shadow-2xs"
          >
            <Plus className="w-2.5 h-2.5" />
            <span>Add</span>
          </button>
        </div>
      )}
    </div>
  );
};

export const PosCartSidebar: React.FC = () => {
  const {
    cartItems,
    updateCartItemQuantity,
    removeCartItem,
    clearCart,
    cartSubtotal,
    cartModifiersTotal,
    cartTotalDiscount,
    cartTax,
    cartGrandTotal,
    customerInfo,
    setOrderType,
    setIsOrderCheckModalOpen,
    getNextOrderSequence,
    editingOrder,
    cancelEditingOrder,
    saveEditingOrder,
  } = useNexus();

  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <aside className="w-80 lg:w-96 bg-white border-l border-[#E5EAF2] flex flex-col h-full shrink-0 select-none shadow-sm">
      {/* Edit Mode Alert Banner if active */}
      {editingOrder && (
        <div className="bg-amber-500 text-white px-3.5 py-2 flex items-center justify-between shadow-xs border-b border-amber-600">
          <div className="flex items-center gap-1.5 min-w-0">
            <Pencil className="w-3.5 h-3.5 shrink-0 animate-bounce" />
            <div className="truncate text-xs font-black">
              Editing Order #{editingOrder.orderNumber || editingOrder.invoiceId?.replace(/[^0-9]/g, '') || '1'}
            </div>
          </div>
          <button
            onClick={cancelEditingOrder}
            className="text-[11px] px-2 py-0.5 rounded bg-black/20 hover:bg-black/40 font-bold transition-all cursor-pointer shrink-0"
            title="Cancel order editing and discard changes"
          >
            Cancel Edit
          </button>
        </div>
      )}

      {/* 1. Cart Header */}
      <div className="px-4 py-3 bg-white border-b border-[#E5EAF2] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-[#172033] tracking-tight">
            {editingOrder ? 'Order Items' : 'Current Cart'}
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-mono text-[11px] font-bold border border-blue-100">
            {totalItemsCount}
          </span>
          <span className={`px-2 py-0.5 rounded-md text-white font-mono text-[11px] font-black shadow-2xs ${
            editingOrder ? 'bg-amber-600' : 'bg-blue-600'
          }`}>
            {editingOrder
              ? `Order #${editingOrder.orderNumber || editingOrder.invoiceId?.replace(/[^0-9]/g, '')}`
              : `Order #${getNextOrderSequence().orderNumber}`}
          </span>
        </div>

        {cartItems.length > 0 && !editingOrder && (
          <button
            onClick={clearCart}
            className="text-[11px] text-blue-600 hover:text-blue-700 font-bold transition-colors cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Quick Order Type Selector Pill Bar */}
      <div className="px-3 py-2 bg-slate-50 border-b border-[#E5EAF2] flex items-center justify-between gap-1.5 shrink-0">
        {(['Delivery', 'Pickup', 'In-Store'] as const).map((type) => {
          const isSelected = customerInfo.orderType === type;
          return (
            <button
              key={type}
              onClick={() => setOrderType(type)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-[#64748B] hover:text-[#172033] border-[#E5EAF2] hover:bg-slate-100'
              }`}
            >
              {type === 'Delivery' && <Truck className="w-3.5 h-3.5" />}
              {type === 'Pickup' && <ShoppingBag className="w-3.5 h-3.5" />}
              {type === 'In-Store' && <Store className="w-3.5 h-3.5" />}
              <span>{type}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#F8FAFC]">
        {cartItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#64748B]">
            <ShoppingBag className="w-10 h-10 stroke-1 mb-2 text-slate-400" />
            <p className="text-xs font-semibold text-[#172033]">Cart is empty</p>
            <p className="text-[11px] text-[#64748B] mt-1 max-w-[200px]">
              Tap any item on the menu to add it to this order.
            </p>
          </div>
        ) : (
          cartItems.map((item) => {
            const modsSum = (item.modifications || []).reduce((s, m) => s + (Number(m.price) || 0), 0);
            const lineUnit = item.unitPrice + item.modifiersTotal + modsSum;
            const lineTotal = lineUnit * item.quantity;

            return (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-white border border-[#E5EAF2] hover:border-blue-200 text-xs transition-colors space-y-1.5 shadow-sm"
              >
                {/* Item Name & Line Total */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-bold text-[#172033] text-xs leading-snug">{item.productName}</h4>
                    {/* Size / Variant badge */}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-semibold text-blue-600">
                        {item.variantName}
                      </span>
                      <span className="text-slate-400 text-[10px]">•</span>
                      <span className="font-mono text-[10px] text-[#64748B]">
                        £{item.unitPrice.toFixed(2)} ea
                      </span>
                    </div>
                  </div>

                  <span className="font-mono font-bold text-xs text-[#172033] shrink-0">
                    £{lineTotal.toFixed(2)}
                  </span>
                </div>

                {/* Selected Add-ons / Modifiers List */}
                {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                  <div className="pl-2 border-l border-[#E5EAF2] space-y-0.5 py-0.5">
                    {item.selectedModifiers.map((mod, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-[10px] text-[#64748B]"
                      >
                        <span className="truncate pr-1">+ {mod.name}</span>
                        <span className="font-mono text-blue-600 font-semibold shrink-0">
                          +£{(mod.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Special Kitchen Instructions / Notes */}
                {(item.notes || item.specialInstructions) && (
                  <div className="pl-2.5 py-1.5 pr-2 bg-amber-50/90 rounded-lg border border-amber-200/90 text-[11px] text-amber-950 flex items-start gap-1.5 my-1 shadow-2xs">
                    <span className="font-bold text-amber-800 shrink-0 uppercase text-[10px] tracking-wide bg-amber-200/70 px-1 py-0.2 rounded">
                      Note:
                    </span>
                    <span className="italic break-words leading-tight font-medium">
                      "{item.notes || item.specialInstructions}"
                    </span>
                  </div>
                )}

                {/* Modifications (Optional) Section */}
                <CartItemModifications item={item} />

                {/* Quantity Controls & Remove */}
                <div className="flex items-center justify-between pt-1.5 border-t border-[#E5EAF2] mt-1">
                  <div className="flex items-center gap-1 bg-[#F8FAFC] rounded-lg p-0.5 border border-[#E5EAF2]">
                    <button
                      onClick={() => updateCartItemQuantity(item.id, -1)}
                      className="w-6 h-6 rounded bg-white hover:bg-slate-100 text-[#172033] flex items-center justify-center transition-colors cursor-pointer border border-[#E5EAF2] shadow-xs"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-mono font-bold text-[#172033] text-xs">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartItemQuantity(item.id, 1)}
                      className="w-6 h-6 rounded bg-white hover:bg-slate-100 text-[#172033] flex items-center justify-center transition-colors cursor-pointer border border-[#E5EAF2] shadow-xs"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeCartItem(item.id)}
                    className="p-1 rounded-md text-[#64748B] hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                    title="Remove Item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. Cart Summary & Action Footer */}
      <div className="p-3.5 bg-white border-t border-[#E5EAF2] space-y-3">
        {/* Financial Breakdown */}
        <div className="space-y-1.5 text-xs text-[#64748B]">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-mono text-[#172033]">£{cartSubtotal.toFixed(2)}</span>
          </div>

          {cartModifiersTotal > 0 && (
            <div className="flex justify-between text-blue-600">
              <span>Extras / Add-ons:</span>
              <span className="font-mono font-semibold">+£{cartModifiersTotal.toFixed(2)}</span>
            </div>
          )}

          {cartTotalDiscount > 0 && (
            <div className="flex justify-between text-blue-600 font-semibold">
              <span>Discounts:</span>
              <span className="font-mono">-£{cartTotalDiscount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-[11px] text-[#64748B]">
            <span>VAT (20% incl):</span>
            <span className="font-mono">£{cartTax.toFixed(2)}</span>
          </div>

          <div className="pt-2 border-t border-[#E5EAF2] flex items-center justify-between text-sm">
            <span className="font-bold text-[#172033]">Total Amount:</span>
            <span className="font-mono font-extrabold text-base text-blue-600">
              £{cartGrandTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Primary Checkout Button / Save Changes in Edit Mode */}
        {editingOrder ? (
          <div className="space-y-2">
            <button
              onClick={() => saveEditingOrder()}
              disabled={cartItems.length === 0}
              className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:pointer-events-none text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Changes to Order #{editingOrder.orderNumber || editingOrder.invoiceId?.replace(/[^0-9]/g, '')}</span>
            </button>

            <button
              onClick={cancelEditingOrder}
              className="w-full py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-[#E5EAF2] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel Edit & Discard</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsOrderCheckModalOpen(true)}
            disabled={cartItems.length === 0}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            <span>Check Order / Checkout →</span>
          </button>
        )}
      </div>
    </aside>
  );
};

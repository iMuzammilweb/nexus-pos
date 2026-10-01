import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Minus, Check, Sparkles, Tag, Layers, PlusCircle, CheckSquare, Square, Info } from 'lucide-react';
import { useNexus } from '../../context/NexusContext';
import { Product, ProductVariant, SelectedModifier, Modifier, AddonGroup, AddonItem, ItemModification } from '../../types';

export const ProductOptionModal: React.FC = () => {
  const {
    selectedProductForCustomization,
    isProductOptionModalOpen,
    setIsProductOptionModalOpen,
    setSelectedProductForCustomization,
    categories,
    selectedCategoryId,
    modifierGroups,
    modifiers,
    addonGroups = [],
    addToCart,
  } = useNexus();

  const product = selectedProductForCustomization;

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedModifierIds, setSelectedModifierIds] = useState<string[]>([]);
  const [selectedAddonMap, setSelectedAddonMap] = useState<Record<string, AddonItem>>({});
  const [quantity, setQuantity] = useState<number>(1);
  const [specialNotes, setSpecialNotes] = useState<string>('');

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      const defaultVar =
        product.variants?.find((v) => v.isDefault) ||
        product.variants?.[0] || {
          id: `var-default-${product.id}`,
          name: 'Regular / Standard',
          price: product.basePrice,
          isDefault: true,
        };
      setSelectedVariant(defaultVar);
      setSelectedModifierIds([]);
      setSelectedAddonMap({});
      setQuantity(1);
      setSpecialNotes('');
    }
  }, [product]);

  // Find linked Add-on Groups specifically for this product
  const linkedAddonGroups = useMemo(() => {
    if (!product) return [];
    return (addonGroups || []).filter((g) => {
      if (g.isAvailable === false) return false;
      const linkedViaProd = product.addonGroupIds?.includes(g.id);
      const linkedViaGroup = g.linkedProductIds?.includes(product.id);
      return linkedViaProd || linkedViaGroup;
    });
  }, [addonGroups, product]);

  // Find linked legacy Modifier Groups for this product (only if explicitly linked)
  const relevantModifierGroups = useMemo(() => {
    if (!product || !product.modifierGroupIds || product.modifierGroupIds.length === 0) return [];
    return (modifierGroups || []).filter((g) => product.modifierGroupIds.includes(g.id));
  }, [modifierGroups, product]);

  if (!isProductOptionModalOpen || !product) return null;

  const currentCategory = categories?.find((c) => c.id === product.categoryId || c.id === selectedCategoryId);
  const currentSubcategory = currentCategory?.subcategories?.find((s) => s.id === product.subcategoryId);

  // Available variants
  const variants = product.variants && product.variants.length > 0 ? product.variants : [
    {
      id: `var-def-${product.id}`,
      name: 'Standard Portion',
      price: product.basePrice,
      isDefault: true,
    }
  ];

  // Toggle Addon Item in state with multi-select or single-select logic
  const handleToggleAddonItem = (group: AddonGroup, item: AddonItem) => {
    setSelectedAddonMap((prev) => {
      const next: Record<string, AddonItem> = { ...prev };
      const isAlreadySelected = !!next[item.id];

      if (isAlreadySelected) {
        delete next[item.id];
      } else {
        // If this group allows only single selection, remove other items from this same group
        if (group.allowMultiple === false || group.maxSelections === 1) {
          Object.keys(next).forEach((k) => {
            if (next[k]?.groupId === group.id) {
              delete next[k];
            }
          });
        } else if (group.maxSelections && group.maxSelections > 1) {
          // Check if max limit reached
          const currentInGroup = (Object.values(next) as AddonItem[]).filter((i) => i.groupId === group.id).length;
          if (currentInGroup >= group.maxSelections) {
            // Remove the first item in this group to allow the new one
            const firstInGroup = (Object.values(next) as AddonItem[]).find((i) => i.groupId === group.id);
            if (firstInGroup) {
              delete next[firstInGroup.id];
            }
          }
        }

        next[item.id] = item;
      }
      return next;
    });
  };

  // Toggle legacy modifier
  const toggleModifier = (modId: string) => {
    setSelectedModifierIds((prev) =>
      prev.includes(modId) ? prev.filter((id) => id !== modId) : [...prev, modId]
    );
  };

  // Price calculations
  const variantPrice = selectedVariant?.price ?? product.basePrice;
  const modifiersPriceTotal = selectedModifierIds.reduce((sum, modId) => {
    const mod = modifiers?.find((m) => m.id === modId);
    return sum + (mod ? mod.price : 0);
  }, 0);

  const selectedAddonsList = Object.values(selectedAddonMap) as AddonItem[];
  const addonsPriceTotal = selectedAddonsList.reduce((sum: number, item: AddonItem) => {
    return sum + (Number(item.price) || 0);
  }, 0);

  const unitTotal = variantPrice + modifiersPriceTotal + addonsPriceTotal;
  const grandTotal = unitTotal * quantity;

  const handleAddToCart = () => {
    if (!selectedVariant) return;

    // Convert legacy modifiers
    const chosenModifiers: SelectedModifier[] = selectedModifierIds
      .map((modId) => {
        const mod = modifiers?.find((m) => m.id === modId);
        if (!mod) return null;
        const group = modifierGroups?.find((g) => g.id === mod.groupId);
        return {
          modifierId: mod.id,
          groupId: mod.groupId,
          groupName: group?.name || 'Extras',
          name: mod.name,
          price: mod.price,
          quantity: 1,
        };
      })
      .filter((x): x is SelectedModifier => x !== null);

    // Convert selected add-on items to modifications
    const addonModifications: ItemModification[] = (Object.values(selectedAddonMap) as AddonItem[]).map((item: AddonItem) => {
      const parentGroup = linkedAddonGroups.find((g) => g.id === item.groupId);
      return {
        id: `mod-${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: item.name,
        price: item.price,
        type: 'addon',
        groupId: item.groupId,
        groupName: parentGroup?.name || 'Add-on',
      };
    });

    addToCart(
      product,
      selectedVariant,
      chosenModifiers,
      quantity,
      specialNotes.trim() || undefined,
      addonModifications
    );

    setSpecialNotes('');
    setIsProductOptionModalOpen(false);
    setSelectedProductForCustomization(null);
  };

  const handleClose = () => {
    setSpecialNotes('');
    setIsProductOptionModalOpen(false);
    setSelectedProductForCustomization(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white border border-[#E5EAF2] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-white border-b border-[#E5EAF2] flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-mono text-[11px] font-bold border border-blue-100">
                {product.code || '#ITEM'}
              </span>
              <span className="text-xs text-[#64748B] font-medium">
                {currentCategory?.name} {currentSubcategory ? `• ${currentSubcategory.name}` : ''}
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#172033] tracking-tight mt-0.5">
              {product.name}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#F8FAFC]">
          {/* Item Description if available */}
          {product.description && product.description.trim() !== '' && (
            <p className="text-xs text-[#64748B] bg-white p-2.5 rounded-xl border border-[#E5EAF2] shadow-xs">
              {product.description}
            </p>
          )}

          {/* Section 1: Size & Variant Selection */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>1. Select Size / Portion</span>
              </h3>
              <span className="text-[11px] text-blue-600 font-bold">Required (Choose 1)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {variants.map((v) => {
                const isSelected = selectedVariant?.id === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer shadow-xs ${
                      isSelected
                        ? 'bg-[#EFF6FF] border-blue-600 text-blue-600 ring-1 ring-blue-600'
                        : 'bg-white hover:bg-slate-50 border-[#E5EAF2] text-[#172033]'
                    }`}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="flex flex-col text-left pr-2">
                        <span className="font-bold text-sm">{v.name}</span>
                        {v.description && v.description.trim() !== '' && (
                          <span className="text-[11px] text-[#64748B] mt-0.5 line-clamp-1">{v.description}</span>
                        )}
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-blue-600 mt-2">
                      £{v.price.toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Dedicated Add-on Groups (Showing ONLY groups linked to this item) */}
          {linkedAddonGroups.length > 0 && (
            <div className="space-y-4">
              {linkedAddonGroups.map((group, gIdx) => {
                const activeItems = (group.items || []).filter((i) => i.isAvailable !== false);
                if (activeItems.length === 0) return null;

                const selectedCountInGroup = (Object.values(selectedAddonMap) as AddonItem[]).filter(
                  (i: AddonItem) => i.groupId === group.id
                ).length;

                return (
                  <div key={group.id} className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between border-t border-[#E5EAF2] pt-3">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033] flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          <span>{gIdx + 2}. {group.name}</span>
                        </h3>
                        {group.description && group.description.trim() !== '' && (
                          <p className="text-[11px] text-[#64748B] mt-0.5">{group.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedCountInGroup > 0 && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                            {selectedCountInGroup} selected
                          </span>
                        )}
                        <span className="text-[10px] text-[#64748B]">
                          {group.allowMultiple !== false ? 'Multi-select' : 'Choose 1'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeItems.map((item) => {
                        const isChecked = !!selectedAddonMap[item.id];
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleToggleAddonItem(group, item)}
                            className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer shadow-xs ${
                              isChecked
                                ? 'bg-[#EFF6FF] border-blue-600 text-blue-600 ring-1 ring-blue-600'
                                : 'bg-white hover:bg-slate-50 border-[#E5EAF2] text-[#172033]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate pr-1">
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                  isChecked
                                    ? 'border-blue-600 bg-blue-600 text-white font-bold'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <div className="flex flex-col text-left truncate">
                                <span className="text-xs font-bold truncate">{item.name}</span>
                                {item.description && item.description.trim() !== '' && (
                                  <span className="text-[10px] text-[#64748B] truncate">{item.description}</span>
                                )}
                              </div>
                            </div>
                            <span className="text-xs font-mono font-bold text-blue-600 shrink-0">
                              {item.price === 0 ? 'FREE' : `+£${item.price.toFixed(2)}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Section 3: Legacy Modifier Groups (If any linked) */}
          {relevantModifierGroups.length > 0 && (
            <div className="space-y-4">
              {relevantModifierGroups.map((grp) => {
                const groupMods = (modifiers || []).filter(
                  (m) => m.groupId === grp.id && m.isAvailable
                );
                if (groupMods.length === 0) return null;

                return (
                  <div key={grp.id} className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between border-t border-[#E5EAF2] pt-3">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033] flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-blue-600" />
                          <span>{grp.name}</span>
                        </h3>
                        {grp.description && grp.description.trim() !== '' && (
                          <p className="text-[11px] text-[#64748B] mt-0.5">{grp.description}</p>
                        )}
                      </div>
                      <span className="text-[11px] text-[#64748B]">
                        {grp.isRequired ? 'Required' : 'Optional'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {groupMods.map((mod) => {
                        const isChecked = selectedModifierIds.includes(mod.id);
                        return (
                          <button
                            key={mod.id}
                            onClick={() => toggleModifier(mod.id)}
                            className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer shadow-xs ${
                              isChecked
                                ? 'bg-[#EFF6FF] border-blue-600 text-blue-600 ring-1 ring-blue-600'
                                : 'bg-white hover:bg-slate-50 border-[#E5EAF2] text-[#172033]'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate pr-1">
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                  isChecked
                                    ? 'border-blue-600 bg-blue-600 text-white font-bold'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <div className="flex flex-col text-left truncate">
                                <span className="text-xs font-medium truncate">{mod.name}</span>
                                {mod.description && mod.description.trim() !== '' && (
                                  <span className="text-[10px] text-[#64748B] truncate">{mod.description}</span>
                                )}
                              </div>
                            </div>
                            <span className="text-[11px] font-mono font-bold text-blue-600 shrink-0">
                              +{mod.price === 0 ? 'Free' : `£${mod.price.toFixed(2)}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Section 4: Special Notes */}
          <div className="border-t border-[#E5EAF2] pt-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
              Special Kitchen Instructions / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Well done, no onions, extra crispy..."
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5EAF2] text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-blue-600 shadow-xs"
            />
          </div>
        </div>

        {/* Footer: Quantity & Add Button */}
        <div className="px-5 py-3.5 bg-white border-t border-[#E5EAF2] flex items-center justify-between gap-4">
          {/* Quantity Controls */}
          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-[#E5EAF2]">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 text-[#172033] flex items-center justify-center font-bold transition-colors cursor-pointer border border-[#E5EAF2]"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-mono font-bold text-[#172033]">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 text-[#172033] flex items-center justify-center font-bold transition-colors cursor-pointer border border-[#E5EAF2]"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Submit Button with Live Price */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-[#64748B] hover:text-[#172033] hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleAddToCart}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <span>Add to Cart</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-200"></span>
              <span className="font-mono font-extrabold text-sm">£{grandTotal.toFixed(2)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { X, Plus, Sparkles, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { useNexus } from '../../context/NexusContext';
import { ProductVariant } from '../../types';

export const VariantSelectionModal: React.FC = () => {
  const {
    selectedProductForCustomization,
    selectedVariantForCustomization,
    setSelectedVariantForCustomization,
    isVariantModalOpen,
    setIsVariantModalOpen,
    setIsModifierModalOpen,
    categories,
    selectedCategoryId,
    addToCart,
    setSelectedProductForCustomization,
  } = useNexus();

  if (!isVariantModalOpen || !selectedProductForCustomization) return null;

  const currentCategory = (categories || []).find((c) => c.id === selectedCategoryId);
  const currentSubcategory = currentCategory?.subcategories?.find(
    (s) => s.id === selectedProductForCustomization.subcategoryId
  );

  const handleSelectVariant = (variant: ProductVariant) => {
    setSelectedVariantForCustomization(variant);
  };

  const handleProceed = () => {
    if (!selectedVariantForCustomization) return;

    setIsVariantModalOpen(false);
    // If the product has modifiers configured, open Modifier screen
    if (
      selectedProductForCustomization.modifierGroupIds &&
      selectedProductForCustomization.modifierGroupIds.length > 0
    ) {
      setIsModifierModalOpen(true);
    } else {
      // Direct add to cart
      addToCart(selectedProductForCustomization, selectedVariantForCustomization, [], 1);
    }
  };

  const handleAddMore = () => {
    if (selectedVariantForCustomization) {
      // Quick add current variant with default settings, then keep browsing
      addToCart(selectedProductForCustomization, selectedVariantForCustomization, [], 1);
    }
    setIsVariantModalOpen(false);
    setSelectedProductForCustomization(null);
  };

  const handleClose = () => {
    setIsVariantModalOpen(false);
    setSelectedProductForCustomization(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white border border-[#E5EAF2] rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header with Dynamic Breadcrumb */}
        <div className="px-6 py-4 bg-white border-b border-[#E5EAF2] flex items-center justify-between">
          <div className="flex flex-col">
            <div className="text-xs font-bold text-blue-600 flex items-center gap-1.5 uppercase tracking-wider">
              <span>{selectedProductForCustomization.code} {selectedProductForCustomization.name}</span>
              <span className="text-[#64748B]">→</span>
              <span className="text-[#172033]">Variant & Size Selection</span>
            </div>
            <h3 className="text-lg font-bold text-[#172033] mt-0.5">
              Select Size & Crust Portion
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product summary strip */}
        <div className="px-6 py-3.5 bg-[#F8FAFC] border-b border-[#E5EAF2] flex items-center gap-4">
          {selectedProductForCustomization.image && typeof selectedProductForCustomization.image === 'string' && selectedProductForCustomization.image.trim() !== '' ? (
            <img
              src={selectedProductForCustomization.image.trim()}
              alt={selectedProductForCustomization.name}
              className="w-14 h-14 rounded-xl object-cover ring-1 ring-[#E5EAF2]"
            />
          ) : null}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#172033]">
                {selectedProductForCustomization.name}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold border border-blue-100">
                {currentSubcategory?.name || 'Main Group'}
              </span>
            </div>
            {selectedProductForCustomization.description && selectedProductForCustomization.description.trim() !== '' && (
              <p className="text-xs text-[#64748B] line-clamp-1 mt-0.5">
                {selectedProductForCustomization.description}
              </p>
            )}
          </div>
        </div>

        {/* Variant Cards Grid */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-[#F8FAFC]">
          <div className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
            Available Sizes & Variants
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {selectedProductForCustomization.variants.map((variant) => {
              const isSelected = selectedVariantForCustomization?.id === variant.id;
              return (
                <button
                  key={variant.id}
                  onClick={() => handleSelectVariant(variant)}
                  className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between min-h-[105px] cursor-pointer shadow-xs ${
                    isSelected
                      ? 'bg-[#EFF6FF] border-blue-600 ring-1 ring-blue-600'
                      : 'bg-white hover:bg-slate-50 border-[#E5EAF2]'
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex flex-col">
                      <span className="text-xs font-mono font-medium text-[#64748B]">
                        {variant.sku}
                      </span>
                      <span className="font-bold text-sm text-[#172033] mt-0.5">
                        {variant.name}
                      </span>
                      {variant.description && variant.description.trim() !== '' && (
                        <span className="text-[11px] text-[#64748B] mt-0.5 line-clamp-2">
                          {variant.description}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#E5EAF2]">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-[#64748B]">
                      {variant.sizeLabel}
                    </span>
                    <span className="text-base font-bold text-blue-600 font-mono">
                      £{(variant?.price ?? 0).toFixed(2)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-white border-t border-[#E5EAF2] flex items-center justify-between gap-3">
          {/* Add More Button (Section 21 Requirement) */}
          <button
            onClick={handleAddMore}
            disabled={!selectedVariantForCustomization}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-[#172033] font-bold text-xs border border-[#E5EAF2] transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            title="Quick add this item and return to product list to add more items"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            <span>Add & Pick More</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-[#64748B] hover:text-[#172033] font-bold text-xs transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleProceed}
              disabled={!selectedVariantForCustomization}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>
                {selectedProductForCustomization.modifierGroupIds?.length > 0
                  ? 'Customize Modifiers'
                  : 'Add to Order'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

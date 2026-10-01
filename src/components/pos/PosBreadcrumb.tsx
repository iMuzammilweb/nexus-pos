import React from 'react';
import { ChevronRight, Home, RefreshCw } from 'lucide-react';
import { useNexus } from '../../context/NexusContext';

export const PosBreadcrumb: React.FC = () => {
  const {
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedSubcategoryId,
    setSelectedSubcategoryId,
    selectedProductForCustomization,
    selectedVariantForCustomization,
    isVariantModalOpen,
    isModifierModalOpen,
    setIsVariantModalOpen,
    setIsModifierModalOpen,
    setSelectedProductForCustomization,
  } = useNexus();

  const currentCategory = categories.find((c) => c.id === selectedCategoryId);
  const currentSubcategory = currentCategory?.subcategories.find((s) => s.id === selectedSubcategoryId);

  const resetToRoot = () => {
    setSelectedSubcategoryId(null);
    setSelectedProductForCustomization(null);
    setIsVariantModalOpen(false);
    setIsModifierModalOpen(false);
  };

  return (
    <div className="bg-white border-b border-[#E5EAF2] px-4 py-2 flex items-center justify-between text-xs text-[#64748B] select-none">
      <div className="flex items-center gap-1.5 flex-wrap font-medium">
        <button
          onClick={resetToRoot}
          className="flex items-center gap-1 text-[#64748B] hover:text-blue-600 transition-colors cursor-pointer"
          title="All Categories"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Menu</span>
        </button>

        <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />

        {/* Category */}
        <button
          onClick={() => {
            setSelectedSubcategoryId(null);
            setIsVariantModalOpen(false);
            setIsModifierModalOpen(false);
          }}
          className={`hover:text-blue-600 transition-colors cursor-pointer ${
            !selectedSubcategoryId && !selectedProductForCustomization ? 'font-bold text-blue-600' : 'text-[#64748B]'
          }`}
        >
          {currentCategory?.name || 'Pizzas'}
        </button>

        {/* Subcategory */}
        {currentSubcategory && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <button
              onClick={() => {
                setIsVariantModalOpen(false);
                setIsModifierModalOpen(false);
              }}
              className={`hover:text-blue-600 transition-colors cursor-pointer ${
                !selectedProductForCustomization ? 'font-bold text-blue-600' : 'text-[#64748B]'
              }`}
            >
              {currentSubcategory.name}
            </button>
          </>
        )}

        {/* Product Variant Flow */}
        {selectedProductForCustomization && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <button
              onClick={() => {
                setIsModifierModalOpen(false);
                if (selectedProductForCustomization.variants.length > 1) {
                  setIsVariantModalOpen(true);
                }
              }}
              className="text-[#172033] hover:text-blue-600 transition-colors font-semibold cursor-pointer"
            >
              {selectedProductForCustomization.code} {selectedProductForCustomization.name}
            </button>

            {selectedVariantForCustomization && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-blue-600 font-bold">
                  {selectedVariantForCustomization.name}
                </span>
              </>
            )}

            {isModifierModalOpen && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 text-[11px] font-bold">
                  Add-ons & Modifiers (Multiple Choice)
                </span>
              </>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={resetToRoot}
          className="p-1 rounded-md text-[#64748B] hover:text-[#172033] hover:bg-slate-100 transition-colors cursor-pointer"
          title="Reset Menu View"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

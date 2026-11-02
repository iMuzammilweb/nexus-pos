import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Layers,
  UtensilsCrossed,
  Receipt,
  FileText,
  DollarSign,
  BarChart3,
  Lock,
  Printer,
  Sparkles,
  Tag,
  Check,
  CheckSquare,
  SlidersHorizontal,
  ChevronRight,
  Store as StoreIcon,
  Pencil,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useNexus } from '../../context/NexusContext';
import { Product } from '../../types';

export const PosMenuScreen: React.FC = () => {
  const {
    stores,
    currentStore,
    categories,
    products,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedSubcategoryId,
    setSelectedSubcategoryId,
    cartItems,
    setSelectedProductForCustomization,
    setIsProductOptionModalOpen,
    quickAddToCart,
    setIsOrderCheckModalOpen,
    setIsMenuManagementModalOpen,
    setIsReportsModalOpen,
    setIsCashDrawerModalOpen,
    setIsStaffLockModalOpen,
    setActiveAppView,
    testPrintPrinter,
    printers,
    latestPlacedOrder,
    setIsReceiptModalOpen,
    editingOrder,
    cancelEditingOrder,
    saveEditingOrder,
  } = useNexus();

  const [searchQuery, setSearchQuery] = useState('');
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  // Filter categories strictly for the active restaurant selected in header
  const storeCategories = useMemo(() => {
    return categories.filter((c) => c.storeId === currentStore.id);
  }, [categories, currentStore.id]);

  // Filter products strictly for the active restaurant selected in header
  const storeProducts = useMemo(() => {
    return products.filter((p) => p.storeId === currentStore.id);
  }, [products, currentStore.id]);

  // Effective selected category
  const effectiveCategoryId = useMemo(() => {
    if (selectedCategoryId && storeCategories.some((c) => c.id === selectedCategoryId)) {
      return selectedCategoryId;
    }
    return storeCategories[0]?.id || '';
  }, [selectedCategoryId, storeCategories]);

  const currentCategory =
    storeCategories.find((c) => c.id === effectiveCategoryId) || storeCategories[0];

  // When clicking a product card
  const handleProductClick = (product: Product) => {
    const hasVariants = product.variants && product.variants.length > 1;
    const hasModifiers = product.modifierGroupIds && product.modifierGroupIds.length > 0;

    // If options or add-ons exist, open the clean text-based option modal
    if (hasVariants || hasModifiers) {
      setSelectedProductForCustomization(product);
      setIsProductOptionModalOpen(true);
    } else {
      // 1-click quick add
      quickAddToCart(product);
      setJustAddedId(product.id);
      setTimeout(() => setJustAddedId(null), 600);
    }
  };

  const handlePrintLastReceipt = () => {
    if (latestPlacedOrder) {
      setIsReceiptModalOpen(true);
    } else {
      const defaultPrinter = printers.find((p) => p.isDefault) || printers[0];
      if (defaultPrinter) {
        testPrintPrinter(defaultPrinter.id);
      }
    }
  };

  // Filtered products list (text-only cards)
  const filteredProducts = storeProducts.filter((prod) => {
    if (effectiveCategoryId && prod.categoryId !== effectiveCategoryId) return false;
    if (selectedSubcategoryId && prod.subcategoryId !== selectedSubcategoryId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        prod.name.toLowerCase().includes(q) ||
        prod.code.toLowerCase().includes(q) ||
        (prod.description && prod.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] overflow-hidden select-none">
      {/* Edit Mode Notice Bar */}
      {editingOrder && (
        <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between shrink-0 shadow-xs border-b border-amber-600">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-black/20 text-white font-mono text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
              <Pencil className="w-3 h-3" />
              EDITING ORDER #{editingOrder.orderNumber || editingOrder.invoiceId?.replace(/[^0-9]/g, '')}
            </span>
            <span className="text-xs font-bold text-amber-50">
              {editingOrder.invoiceId} • Customer: {editingOrder.customer?.firstName || 'Guest'} {editingOrder.customer?.lastName || ''}
            </span>
            <span className="text-[11px] text-amber-100 hidden md:inline">
              (Click any menu item below to add products or variants)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => saveEditingOrder()}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-98"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
            <button
              onClick={cancelEditingOrder}
              className="px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/30 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. Category Bar */}
      <div className="bg-white border-b border-[#E5EAF2] px-3 py-2 flex items-start justify-between gap-2 shrink-0 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
          {storeCategories.length === 0 ? (
            <span className="text-xs text-[#64748B] italic py-1 px-2">
              No categories configured for {currentStore.businessName}
            </span>
          ) : (
            storeCategories.map((cat) => {
              const isActive = cat.id === effectiveCategoryId;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategoryId(cat.id);
                    setSelectedSubcategoryId(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white hover:bg-[#EFF6FF] text-[#64748B] hover:text-blue-600 border-[#E5EAF2]'
                  }`}
                >
                  <span>{cat.name}</span>
                </button>
              );
            })
          )}
        </div>

        {/* Quick Menu Manager Launcher */}
        <button
          onClick={() => setIsMenuManagementModalOpen(true)}
          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#EFF6FF] text-blue-600 border border-[#E5EAF2] text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer shadow-sm"
          title="Open Menu Editor"
        >
          <Plus className="w-3 h-3" />
          <span>Edit Menu</span>
        </button>
      </div>

      {/* 2. Subcategory Bar & Quick Filter */}
      <div className="bg-white/80 border-b border-[#E5EAF2] px-3 py-1.5 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setSelectedSubcategoryId(null)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedSubcategoryId === null
                ? 'bg-blue-50 text-blue-600 border border-blue-200'
                : 'text-[#64748B] hover:text-[#172033] bg-transparent hover:bg-slate-100 border border-transparent'
            }`}
          >
            All {currentCategory?.name || 'Items'}
          </button>
          {(currentCategory?.subcategories || []).map((sub) => {
            const isSubActive = sub.id === selectedSubcategoryId;
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubcategoryId(sub.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isSubActive
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'text-[#64748B] hover:text-[#172033] bg-transparent hover:bg-slate-100 border border-transparent'
                }`}
              >
                {sub.name}
              </button>
            );
          })}
        </div>

        {/* Compact Search Bar */}
        <div className="relative min-w-[150px] max-w-[200px] hidden sm:block">
          <Search className="w-3 h-3 text-[#64748B] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-2.5 py-1 rounded-lg bg-white border border-[#E5EAF2] text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* 3. Main Touchscreen Product Grid */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-[#F8FAFC]">
        {filteredProducts.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-6 bg-white rounded-xl border border-[#E5EAF2] shadow-sm">
            <UtensilsCrossed className="w-8 h-8 text-[#64748B] mb-2" />
            <h4 className="text-xs font-bold text-[#172033]">No items found in this section</h4>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Click "+ Edit Menu" to add products to {currentCategory?.name || 'this category'}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5">
            {filteredProducts.map((product) => {
              const inCartQty = cartItems
                .filter((item) => item.productId === product.id)
                .reduce((sum, item) => sum + item.quantity, 0);

              const hasVariants = product.variants && product.variants.length > 1;
              const hasModifiers = product.modifierGroupIds && product.modifierGroupIds.length > 0;
              const hasOptions = hasVariants || hasModifiers;
              const isJustAdded = justAddedId === product.id;

              return (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className={`group p-3 rounded-xl border flex flex-col justify-between text-left transition-all cursor-pointer active:scale-98 select-none relative min-h-[90px] sm:min-h-[96px] shadow-sm ${
                    isJustAdded
                      ? 'bg-blue-100 border-blue-600 ring-2 ring-blue-500'
                      : inCartQty > 0
                      ? 'bg-[#EFF6FF] border-blue-600 ring-1 ring-blue-400'
                      : 'bg-white hover:bg-[#F8FAFC] border-[#E5EAF2] hover:border-blue-300'
                  }`}
                >
                  {/* Top line: Code & In-cart badge */}
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-mono text-[10px] font-bold text-blue-600 truncate">
                      {product.code || '#ITEM'}
                    </span>
                    {inCartQty > 0 && (
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-mono text-[10px] font-extrabold flex items-center justify-center shrink-0 shadow-sm">
                        {inCartQty}
                      </span>
                    )}
                  </div>

                  {/* Center: Item Name */}
                  <div className="my-1.5">
                    <h3 className="font-bold text-xs sm:text-[13px] text-[#172033] line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                    {product.description && product.description.trim() !== '' && (
                      <p className="text-[10px] text-[#64748B] line-clamp-1 mt-0.5">
                        {product.description}
                      </p>
                    )}
                  </div>

                  {/* Bottom: Price and Options Flag */}
                  <div className="flex items-center justify-between pt-1 border-t border-[#E5EAF2] mt-auto">
                    <span className="font-mono font-bold text-xs sm:text-sm text-blue-600">
                      {hasVariants ? `From £${product.basePrice.toFixed(2)}` : `£${product.basePrice.toFixed(2)}`}
                    </span>

                    {hasOptions && (
                      <span className="text-[10px] font-semibold text-[#64748B] group-hover:text-blue-600 transition-colors">
                        Options →
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Bottom POS Utility / Action Buttons Bar */}
      <div className="bg-white border-t border-[#E5EAF2] px-3 py-2 flex items-center justify-between gap-2 shrink-0 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {/* Check Order / Checkout Button */}
          <button
            onClick={() => setIsOrderCheckModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Check Order / Checkout</span>
          </button>

          {/* Orders Queue */}
          <button
            onClick={() => setActiveAppView('pos-orders')}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#EFF6FF] text-[#172033] hover:text-blue-600 border border-[#E5EAF2] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Orders Queue</span>
          </button>

          {/* Cash Drawer */}
          <button
            onClick={() => setIsCashDrawerModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#EFF6FF] text-[#172033] hover:text-blue-600 border border-[#E5EAF2] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shadow-sm"
          >
            <DollarSign className="w-3.5 h-3.5 text-blue-600" />
            <span>Cash Drawer</span>
          </button>

          {/* Menu Editor */}
          <button
            onClick={() => setIsMenuManagementModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#EFF6FF] text-[#172033] hover:text-blue-600 border border-[#E5EAF2] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shadow-sm"
          >
            <UtensilsCrossed className="w-3.5 h-3.5 text-blue-600" />
            <span>Menu Editor</span>
          </button>

          {/* Reports */}
          <button
            onClick={() => setIsReportsModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#EFF6FF] text-[#172033] hover:text-blue-600 border border-[#E5EAF2] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shadow-sm"
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
            <span>Reports</span>
          </button>

          {/* Print Last Receipt */}
          <button
            onClick={handlePrintLastReceipt}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#EFF6FF] text-[#64748B] hover:text-blue-600 border border-[#E5EAF2] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shadow-sm"
            title="Print Last Receipt"
          >
            <Printer className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Print Ticket</span>
          </button>
        </div>

        {/* Right side utilities: Staff Lock & Management */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsStaffLockModalOpen(true)}
            className="p-1.5 rounded-lg bg-white hover:bg-[#EFF6FF] text-[#64748B] hover:text-blue-600 border border-[#E5EAF2] transition-colors cursor-pointer shadow-sm"
            title="Lock Terminal / Switch Staff"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setActiveAppView('dashboard')}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#EFF6FF] text-blue-600 border border-[#E5EAF2] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <span>Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};

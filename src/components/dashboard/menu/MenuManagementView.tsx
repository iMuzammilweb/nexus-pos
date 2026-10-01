import React, { useState, useMemo } from 'react';
import {
  UtensilsCrossed,
  Utensils,
  Folder,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  ArrowUpDown,
  DollarSign,
  Percent,
  Layers,
  Sparkles,
  Palette,
  Eye,
  Sliders,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Tag,
  Flame,
  Leaf,
  Star,
  CheckSquare,
  Square,
  RefreshCw,
  FolderPlus,
  Grid3X3,
  SlidersHorizontal,
  Store,
} from 'lucide-react';
import { useNexus } from '../../../context/NexusContext';
import { Category, Product, ProductVariant, ModifierGroup, Modifier, Subcategory, AddonGroup } from '../../../types';
import { AddonGroupsManagement } from './AddonGroupsManagement';

export const MenuManagementView: React.FC = () => {
  const {
    stores,
    currentStore,
    setCurrentStore,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    reorderProducts,
    bulkUpdatePrices,
    updateMenuOrganizer,
    modifierGroups,
    modifiers,
    addModifierGroup,
    updateModifierGroup,
    deleteModifierGroup,
    addModifier,
    updateModifier,
    deleteModifier,
    addonGroups = [],
  } = useNexus();

  const [selectedStoreId, setSelectedStoreId] = useState<string>(currentStore?.id || stores[0]?.id || 'store-1');
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'addon-groups' | 'organizer' | 'bulk-pricing' | 'modifiers'>('catalog');

  // Delete Confirmation Modal State
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{
    type: 'product' | 'category' | 'modifierGroup' | 'modifier' | 'subcategory';
    id: string;
    categoryId?: string;
    name: string;
    extraInfo?: string;
  } | null>(null);

  // Filter categories and products strictly for the selected restaurant
  const selectedStore = stores.find((s) => s.id === selectedStoreId) || currentStore || stores[0];

  const storeCategories = useMemo(() => {
    if (selectedStoreId === 'all') return categories;
    return categories.filter((c) => c.storeId === selectedStoreId);
  }, [categories, selectedStoreId]);

  const storeProducts = useMemo(() => {
    if (selectedStoreId === 'all') return products;
    return products.filter((p) => p.storeId === selectedStoreId);
  }, [products, selectedStoreId]);

  // -------------------------------------------------------------
  // 1. CATALOG TAB STATE & MODALS
  // -------------------------------------------------------------
  const [selectedCatId, setSelectedCatId] = useState<string>(categories[0]?.id || '');
  const [searchItemQuery, setSearchItemQuery] = useState<string>('');

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    slug: '',
    iconName: 'Utensils',
    image: '',
    bgColor: '#ffffff',
    badgeText: '',
  });

  // Subcategory Quick Add
  const [isAddingSubcat, setIsAddingSubcat] = useState(false);
  const [newSubcatName, setNewSubcatName] = useState('');
  const [newSubcatDesc, setNewSubcatDesc] = useState('');

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<{
    categoryId: string;
    subcategoryId: string;
    code: string;
    name: string;
    description: string;
    image: string;
    basePrice: number;
    cardBgColor: string;
    customBadge: string;
    isVegetarian: boolean;
    isSpicy: boolean;
    isPopular: boolean;
    isAvailable: boolean;
    variants: ProductVariant[];
    modifierGroupIds: string[];
    addonGroupIds: string[];
    addonOverrides: Record<string, number>;
  }>({
    categoryId: categories[0]?.id || '',
    subcategoryId: '',
    code: '',
    name: '',
    description: '',
    image: '',
    basePrice: 5.0,
    cardBgColor: '#ffffff',
    customBadge: '',
    isVegetarian: false,
    isSpicy: false,
    isPopular: false,
    isAvailable: true,
    variants: [],
    modifierGroupIds: [],
    addonGroupIds: [],
    addonOverrides: {},
  });

  // Variant editing within Product Modal
  const [variantForm, setVariantForm] = useState({
    name: '',
    description: '',
    sizeLabel: '',
    price: 5.0,
    sku: '',
    isDefault: false,
  });

  // -------------------------------------------------------------
  // 2. MENU ORGANIZER STATE
  // -------------------------------------------------------------
  const [organizerCategories, setOrganizerCategories] = useState<Category[]>(storeCategories);
  const [organizerProducts, setOrganizerProducts] = useState<Product[]>(storeProducts);
  const [organizerSelectedCat, setOrganizerSelectedCat] = useState<string>(storeCategories[0]?.id || '');
  const [organizerCardColor, setOrganizerCardColor] = useState<string>('#ffffff');
  const [organizerHasChanges, setOrganizerHasChanges] = useState(false);

  // Sync organizer when switching store or when categories/products update
  React.useEffect(() => {
    setOrganizerCategories(storeCategories);
    setOrganizerProducts(storeProducts);
    if (!storeCategories.some((c) => c.id === organizerSelectedCat)) {
      setOrganizerSelectedCat(storeCategories[0]?.id || '');
    }
  }, [storeCategories, storeProducts]);

  // Preset color swatches
  const PRESET_SWATCHES = [
    { label: 'Pure White', hex: '#ffffff' },
    { label: 'Blue Ice', hex: '#eff6ff' },
    { label: 'Slate Soft', hex: '#f8fafc' },
    { label: 'Emerald Mint', hex: '#ecfdf5' },
    { label: 'Amber Warm', hex: '#fffbeb' },
    { label: 'Rose Blush', hex: '#fff1f2' },
    { label: 'Purple Mist', hex: '#faf5ff' },
    { label: 'Indigo Tint', hex: '#eef2ff' },
  ];

  // -------------------------------------------------------------
  // 3. BULK PRICE UPDATE STATE
  // -------------------------------------------------------------
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkAdjustmentType, setBulkAdjustmentType] = useState<'percentage' | 'fixed'>('percentage');
  const [bulkAmount, setBulkAmount] = useState<number>(10);
  const [bulkDirection, setBulkDirection] = useState<'increase' | 'decrease'>('increase');
  const [bulkApplyVariants, setBulkApplyVariants] = useState<boolean>(true);
  const [bulkSearchQuery, setBulkSearchQuery] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    categories.forEach((c) => (init[c.id] = true));
    return init;
  });
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);

  // -------------------------------------------------------------
  // 4. MODIFIERS & ADD-ONS STATE
  // -------------------------------------------------------------
  const [isModifierGroupModalOpen, setIsModifierGroupModalOpen] = useState(false);
  const [editingModifierGroup, setEditingModifierGroup] = useState<ModifierGroup | null>(null);
  const [modGroupForm, setModGroupForm] = useState({
    name: '',
    description: '',
    minSelections: 0,
    maxSelections: 1,
    isRequired: false,
    allowMultiple: false,
    modifierIds: [] as string[],
  });

  const [isModifierItemModalOpen, setIsModifierItemModalOpen] = useState(false);
  const [editingModifierItem, setEditingModifierItem] = useState<Modifier | null>(null);
  const [modItemForm, setModItemForm] = useState({
    name: '',
    description: '',
    price: 0.8,
    category: 'Extras',
    isAvailable: true,
  });

  // Current selected Category for Catalog view
  const currentCategory =
    storeCategories.find((c) => c.id === selectedCatId) || storeCategories[0];
  const categoryProducts = useMemo(() => {
    return storeProducts
      .filter((p) => p.categoryId === (currentCategory?.id || selectedCatId))
      .filter(
        (p) =>
          p.name.toLowerCase().includes(searchItemQuery.toLowerCase()) ||
          p.code.toLowerCase().includes(searchItemQuery.toLowerCase())
      )
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [storeProducts, currentCategory?.id, selectedCatId, searchItemQuery]);

  // Handlers for Category CRUD
  const handleOpenCategoryModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryForm({
        name: cat.name,
        description: cat.description || '',
        slug: cat.slug,
        iconName: cat.iconName || 'Utensils',
        image: cat.image,
        bgColor: cat.bgColor || '#ffffff',
        badgeText: cat.badgeText || '',
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        description: '',
        slug: '',
        iconName: 'Utensils',
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80',
        bgColor: '#ffffff',
        badgeText: '',
      });
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: categoryForm.name,
        description: categoryForm.description.trim() || undefined,
        slug: categoryForm.slug || categoryForm.name.toLowerCase().replace(/\s+/g, '-'),
        iconName: categoryForm.iconName,
        image: categoryForm.image,
        bgColor: categoryForm.bgColor,
        badgeText: categoryForm.badgeText,
      });
    } else {
      addCategory({
        storeId: selectedStoreId === 'all' ? currentStore.id : selectedStoreId,
        name: categoryForm.name,
        description: categoryForm.description.trim() || undefined,
        slug: categoryForm.slug || categoryForm.name.toLowerCase().replace(/\s+/g, '-'),
        iconName: categoryForm.iconName,
        image: categoryForm.image,
        bgColor: categoryForm.bgColor,
        badgeText: categoryForm.badgeText,
        displayOrder: categories.length + 1,
        subcategories: [],
      });
    }
    setIsCategoryModalOpen(false);
  };

  // Handlers for Product CRUD
  const handleOpenProductModal = (prod?: Product) => {
    if (!prod && storeCategories.length === 0) {
      handleOpenCategoryModal();
      return;
    }

    if (prod) {
      setEditingProduct(prod);
      // Collect linked addon group IDs from both prod.addonGroupIds and addonGroups that have this prod.id
      const linkedFromProd = prod.addonGroupIds || [];
      const linkedFromGroups = addonGroups.filter((g) => g.linkedProductIds?.includes(prod.id)).map((g) => g.id);
      const combinedAddonGroupIds = Array.from(new Set([...linkedFromProd, ...linkedFromGroups]));

      setProductForm({
        categoryId: prod.categoryId,
        subcategoryId: prod.subcategoryId || '',
        code: prod.code,
        name: prod.name,
        description: prod.description,
        image: prod.image,
        basePrice: prod.basePrice,
        cardBgColor: prod.cardBgColor || '#ffffff',
        customBadge: prod.customBadge || '',
        isVegetarian: !!prod.isVegetarian,
        isSpicy: !!prod.isSpicy,
        isPopular: !!prod.isPopular,
        isAvailable: prod.isAvailable,
        variants: prod.variants ? [...prod.variants] : [],
        modifierGroupIds: prod.modifierGroupIds ? [...prod.modifierGroupIds] : [],
        addonGroupIds: combinedAddonGroupIds,
        addonOverrides: prod.addonOverrides ? { ...prod.addonOverrides } : {},
      });
    } else {
      setEditingProduct(null);
      const nextCode = `(${String(products.length + 1).padStart(2, '0')})`;
      setProductForm({
        categoryId: currentCategory?.id || selectedCatId || storeCategories[0]?.id || '',
        subcategoryId: currentCategory?.subcategories?.[0]?.id || '',
        code: nextCode,
        name: '',
        description: '',
        image: '',
        basePrice: 0,
        cardBgColor: '#ffffff',
        customBadge: '',
        isVegetarian: false,
        isSpicy: false,
        isPopular: false,
        isAvailable: true,
        variants: [],
        modifierGroupIds: [],
        addonGroupIds: [],
        addonOverrides: {},
      });
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) return;

    const basePriceNum = Number(productForm.basePrice) || 0;
    const variantsToSave =
      productForm.variants.length > 0
        ? productForm.variants.map((v) => {
            if (productForm.variants.length === 1 || (v.isDefault && (v.price === 5.0 || v.price === 0) && basePriceNum !== 5.0)) {
              return { ...v, price: basePriceNum };
            }
            return v;
          })
        : [
            {
              id: `var-${Date.now()}`,
              productId: editingProduct?.id || '',
              name: productForm.name || 'Standard Portion',
              sizeLabel: 'Standard',
              price: basePriceNum,
              sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
              isDefault: true,
            },
          ];

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        ...productForm,
        variants: variantsToSave,
      });
    } else {
      addProduct({
        storeId: selectedStoreId === 'all' ? currentStore.id : selectedStoreId,
        ...productForm,
        variants: variantsToSave,
      });
    }
    setIsProductModalOpen(false);
  };

  // Add Variant helper in form
  const handleAddVariantToForm = () => {
    if (!variantForm.name || !variantForm.price) return;
    const newV: ProductVariant = {
      id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      productId: editingProduct?.id || '',
      name: variantForm.name,
      description: variantForm.description.trim() || undefined,
      sizeLabel: variantForm.sizeLabel || variantForm.name,
      price: Number(variantForm.price),
      sku: variantForm.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      isDefault: variantForm.isDefault || productForm.variants.length === 0,
    };

    setProductForm((prev) => ({
      ...prev,
      variants: [...prev.variants, newV],
    }));
    setVariantForm({
      name: '',
      description: '',
      sizeLabel: '',
      price: 5.0,
      sku: '',
      isDefault: false,
    });
  };

  const handleRemoveVariantFromForm = (varId: string) => {
    setProductForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((v) => v.id !== varId),
    }));
  };

  // Toggle modifier group link
  const handleToggleModGroup = (groupId: string) => {
    setProductForm((prev) => {
      const exists = prev.modifierGroupIds.includes(groupId);
      return {
        ...prev,
        modifierGroupIds: exists
          ? prev.modifierGroupIds.filter((id) => id !== groupId)
          : [...prev.modifierGroupIds, groupId],
      };
    });
  };

  // Toggle Add-on group link
  const handleToggleAddonGroup = (groupId: string) => {
    setProductForm((prev) => {
      const exists = prev.addonGroupIds.includes(groupId);
      return {
        ...prev,
        addonGroupIds: exists
          ? prev.addonGroupIds.filter((id) => id !== groupId)
          : [...prev.addonGroupIds, groupId],
      };
    });
  };

  // -------------------------------------------------------------
  // ORGANIZER ACTIONS
  // -------------------------------------------------------------
  const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= organizerCategories.length) return;

    const newCats = [...organizerCategories];
    const temp = newCats[index];
    newCats[index] = newCats[targetIdx];
    newCats[targetIdx] = temp;

    setOrganizerCategories(newCats);
    setOrganizerHasChanges(true);
  };

  const handleMoveProduct = (catId: string, itemIdx: number, direction: 'up' | 'down') => {
    const catProds = organizerProducts.filter((p) => p.categoryId === catId);
    const targetIdx = direction === 'up' ? itemIdx - 1 : itemIdx + 1;
    if (targetIdx < 0 || targetIdx >= catProds.length) return;

    const reorderedCatProds = [...catProds];
    const temp = reorderedCatProds[itemIdx];
    reorderedCatProds[itemIdx] = reorderedCatProds[targetIdx];
    reorderedCatProds[targetIdx] = temp;

    // Merge back into organizerProducts
    const updated = organizerProducts.map((p) => {
      if (p.categoryId !== catId) return p;
      const idxInReordered = reorderedCatProds.findIndex((rp) => rp.id === p.id);
      return { ...p, displayOrder: idxInReordered };
    });

    setOrganizerProducts(updated);
    setOrganizerHasChanges(true);
  };

  const handleApplyColorToCategoryProducts = (catId: string, colorHex: string) => {
    setOrganizerProducts((prev) =>
      prev.map((p) => (p.categoryId === catId ? { ...p, cardBgColor: colorHex } : p))
    );
    setOrganizerHasChanges(true);
  };

  const handleSaveOrganizer = () => {
    // reorderCategories replaces the whole list, so pass full category objects and keep
    // the categories that aren't part of this organizer view (e.g. other stores)
    const organizerIds = new Set(organizerCategories.map((c) => c.id));
    reorderCategories([...organizerCategories, ...categories.filter((c) => !organizerIds.has(c.id))]);
    organizerProducts.forEach((p) => {
      updateProduct(p.id, {
        displayOrder: p.displayOrder,
        cardBgColor: p.cardBgColor,
      });
    });
    setOrganizerHasChanges(false);
  };

  const handleCancelOrganizer = () => {
    setOrganizerCategories(storeCategories);
    setOrganizerProducts(storeProducts);
    setOrganizerHasChanges(false);
  };

  // -------------------------------------------------------------
  // BULK PRICING ACTIONS
  // -------------------------------------------------------------
  const allFilteredBulkProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedStoreId !== 'all' && p.storeId && p.storeId !== selectedStoreId && p.storeId !== 'all') {
        return false;
      }
      if (bulkSearchQuery.trim()) {
        const q = bulkSearchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
      }
      return true;
    });
  }, [products, selectedStoreId, bulkSearchQuery]);

  const handleSelectAllBulk = () => {
    if (selectedProductIds.length === allFilteredBulkProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(allFilteredBulkProducts.map((p) => p.id));
    }
  };

  const handleToggleProductBulk = (prodId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(prodId) ? prev.filter((id) => id !== prodId) : [...prev, prodId]
    );
  };

  const handleToggleCategoryBulk = (catId: string) => {
    const catProdIds = products.filter((p) => p.categoryId === catId).map((p) => p.id);
    const allSelected = catProdIds.every((id) => selectedProductIds.includes(id));
    if (allSelected) {
      setSelectedProductIds((prev) => prev.filter((id) => !catProdIds.includes(id)));
    } else {
      setSelectedProductIds((prev) => Array.from(new Set([...prev, ...catProdIds])));
    }
  };

  const calculatePreviewPrice = (currentPrice: number) => {
    let multiplier = 1;
    if (bulkAdjustmentType === 'percentage') {
      multiplier = bulkDirection === 'increase' ? 1 + bulkAmount / 100 : Math.max(0.01, 1 - bulkAmount / 100);
      return Number((currentPrice * multiplier).toFixed(2));
    } else {
      const delta = bulkDirection === 'increase' ? bulkAmount : -bulkAmount;
      return Math.max(0.1, Number((currentPrice + delta).toFixed(2)));
    }
  };

  const handleExecuteBulkPriceUpdate = () => {
    selectedProductIds.forEach((prodId) => {
      const prod = products.find((p) => p.id === prodId);
      if (!prod) return;

      const newBase = calculatePreviewPrice(prod.basePrice);
      const updatedVariants = bulkApplyVariants
        ? prod.variants?.map((v) => ({
            ...v,
            price: calculatePreviewPrice(v.price),
          }))
        : prod.variants;

      updateProduct(prod.id, {
        basePrice: newBase,
        variants: updatedVariants,
      });
    });

    setShowBulkConfirmModal(false);
    setSelectedProductIds([]);
  };

  return (
    <div className="space-y-6 text-[#172033]" id="menu-management-root">
      {/* Top Header & Sub-Tabs Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-[#E5EAF2] rounded-2xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-600 font-black">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#172033] flex items-center gap-2">
                Menu Management & POS Catalog
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Single Source of Truth
                </span>
              </h1>
              <p className="text-xs text-[#64748B] mt-0.5">
                Category → Subcategory → Item → Size/Variant → Modifiers/Add-ons → POS Cart
              </p>
            </div>
          </div>
        </div>

        {/* Sub-Tabs Pills */}
        <div className="flex items-center bg-[#F8FAFC] p-1.5 rounded-xl border border-[#E5EAF2] overflow-x-auto gap-1">
          <button
            id="tab-catalog"
            onClick={() => setActiveSubTab('catalog')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'catalog'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#172033] hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            Categories & Items
          </button>
          <button
            id="tab-addon-groups"
            onClick={() => setActiveSubTab('addon-groups')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'addon-groups'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#172033] hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4 text-blue-400" />
            Add-on Groups ({addonGroups.length})
          </button>
          <button
            id="tab-organizer"
            onClick={() => setActiveSubTab('organizer')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'organizer'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#172033] hover:bg-slate-100'
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
            Menu Organizer
          </button>
          <button
            id="tab-bulk-pricing"
            onClick={() => setActiveSubTab('bulk-pricing')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'bulk-pricing'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#172033] hover:bg-slate-100'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Bulk Price Update
          </button>
          <button
            id="tab-modifiers"
            onClick={() => setActiveSubTab('modifiers')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'modifiers'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#172033] hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Modifiers Library
          </button>
        </div>
      </div>

      {/* Restaurant Scope Filter Banner */}
      <div className="bg-white border border-[#E5EAF2] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-600">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-bold text-[#172033]">Selected Restaurant Scope:</span>
              <select
                value={selectedStoreId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setSelectedStoreId(newId);
                  const matchingCat = categories.find(
                    (c) => !c.storeId || c.storeId === 'all' || c.storeId === newId
                  );
                  if (matchingCat) setSelectedCatId(matchingCat.id);
                }}
                className="bg-[#F8FAFC] border border-[#E5EAF2] text-[#172033] font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                {stores.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.businessName} • {st.city || st.branchName || 'Branch'}
                  </option>
                ))}
                <option value="all">🌐 All Restaurants (Franchise-wide)</option>
              </select>
            </div>
            <p className="text-[11px] text-[#64748B] mt-1">
              Currently filtering menu to show items assigned to{' '}
              <strong className="text-[#172033]">
                {selectedStoreId === 'all' ? 'All Restaurants' : selectedStore?.businessName}
              </strong>
              .
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <span className="text-xs font-mono text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl font-bold">
            {storeCategories.length} Categories • {storeProducts.length} Items
          </span>
          {currentStore.id !== selectedStoreId && selectedStoreId !== 'all' && (
            <button
              onClick={() => {
                if (selectedStore) setCurrentStore(selectedStore);
              }}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Set this store as active in the POS Register"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Set as Active POS</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. CATEGORIES & ITEMS CATALOG VIEW */}
      {/* ========================================================================= */}
      {activeSubTab === 'catalog' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Categories List */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-[#E5EAF2] rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF2] mb-3">
                <div>
                  <h2 className="text-sm font-bold text-[#172033]">Menu Categories</h2>
                  <p className="text-xs text-[#64748B]">{storeCategories.length} Categories active</p>
                </div>
                <button
                  id="btn-add-category"
                  onClick={() => handleOpenCategoryModal()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Category
                </button>
              </div>

              {/* Category Cards List */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {storeCategories.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-[#E5EAF2] rounded-2xl bg-slate-50/50">
                    <Folder className="w-8 h-8 text-[#94A3B8] mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold text-[#172033]">No Categories Yet</p>
                    <p className="text-[11px] text-[#64748B] mt-1 mb-3">Create your first category to start building your menu catalog.</p>
                    <button
                      type="button"
                      onClick={() => handleOpenCategoryModal()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create Category
                    </button>
                  </div>
                ) : (
                  storeCategories.map((cat, idx) => {
                    const isSelected = cat.id === selectedCatId;
                    const count = storeProducts.filter((p) => p.categoryId === cat.id).length;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => setSelectedCatId(cat.id)}
                        className={`group p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-50 border-blue-300 shadow-xs ring-1 ring-blue-400'
                            : 'bg-white border-[#E5EAF2] hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {cat.image && cat.image.trim() !== '' ? (
                            <img
                              src={cat.image.trim()}
                              alt={cat.name}
                              className="w-11 h-11 rounded-lg object-cover border border-[#E5EAF2] shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-lg bg-slate-100 border border-[#E5EAF2] flex items-center justify-center text-[#64748B] shrink-0">
                              <Folder className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#64748B]">#{idx + 1}</span>
                              <h3 className="text-sm font-bold text-[#172033] truncate">{cat.name}</h3>
                            </div>
                            {cat.description && cat.description.trim() !== '' && (
                              <p className="text-[11px] text-[#64748B] mt-0.5 line-clamp-1">{cat.description}</p>
                            )}
                            <p className="text-xs text-[#64748B] mt-0.5 truncate">
                              {count} items • {cat.subcategories?.length || 0} subcategories
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCategoryModal(cat);
                            }}
                            className="p-1.5 hover:bg-slate-100 text-[#64748B] hover:text-blue-600 rounded-md transition-colors cursor-pointer"
                            title="Edit Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmItem({
                                type: 'category',
                                id: cat.id,
                                name: cat.name,
                                extraInfo: `${count} items in this category will be removed or unassigned.`,
                              });
                            }}
                            className="p-1.5 hover:bg-rose-50 text-[#64748B] hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Subcategories Management Box */}
            {currentCategory && (
              <div className="bg-white border border-[#E5EAF2] rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF2] mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-[#172033]">
                      Subcategories for <span className="text-blue-600">{currentCategory.name}</span>
                    </h3>
                    <p className="text-[11px] text-[#64748B]">Subcategory grouping for POS filter bar</p>
                  </div>
                  <button
                    onClick={() => setIsAddingSubcat(!isAddingSubcat)}
                    className="p-1 bg-[#F8FAFC] hover:bg-slate-100 text-[#64748B] hover:text-[#172033] rounded-md text-xs border border-[#E5EAF2] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {isAddingSubcat && (
                  <div className="space-y-2 mb-3 bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E5EAF2]">
                    <input
                      type="text"
                      placeholder="Subcategory name (e.g. Deep Pan)"
                      value={newSubcatName}
                      onChange={(e) => setNewSubcatName(e.target.value)}
                      className="w-full bg-white border border-[#E5EAF2] rounded-lg px-2.5 py-1.5 text-xs text-[#172033] placeholder:text-slate-400 focus:outline-none focus:border-blue-600 font-bold"
                    />
                    <textarea
                      rows={2}
                      placeholder="Subcategory description (optional)..."
                      value={newSubcatDesc}
                      onChange={(e) => setNewSubcatDesc(e.target.value)}
                      className="w-full bg-white border border-[#E5EAF2] rounded-lg px-2.5 py-1.5 text-xs text-[#172033] placeholder:text-slate-400 focus:outline-none focus:border-blue-600 resize-y"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNewSubcatName('');
                          setNewSubcatDesc('');
                          setIsAddingSubcat(false);
                        }}
                        className="px-2.5 py-1 bg-white border border-[#E5EAF2] hover:bg-slate-50 text-[#172033] rounded-lg text-xs font-medium cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (newSubcatName.trim()) {
                            addSubcategory(currentCategory.id, newSubcatName.trim(), newSubcatDesc.trim() || undefined);
                            setNewSubcatName('');
                            setNewSubcatDesc('');
                            setIsAddingSubcat(false);
                          }
                        }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer shadow-xs"
                      >
                        Add Subcategory
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  {currentCategory.subcategories && currentCategory.subcategories.length > 0 ? (
                    currentCategory.subcategories.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between px-3 py-2 bg-[#F8FAFC] border border-[#E5EAF2] rounded-xl text-xs"
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="text-[#172033] font-bold truncate">{sub.name}</span>
                          {sub.description && sub.description.trim() !== '' && (
                            <span className="text-[11px] text-[#64748B] mt-0.5 line-clamp-1">{sub.description}</span>
                          )}
                        </div>
                        <button
                          onClick={() => deleteSubcategory(currentCategory.id, sub.id)}
                          className="text-[#64748B] hover:text-rose-600 transition-colors p-1 cursor-pointer shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#64748B] py-2 text-center">No subcategories created yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Menu Items under selected Category */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white border border-[#E5EAF2] rounded-2xl p-4 shadow-sm">
              {/* Filter & Add Item bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E5EAF2] mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder={`Search ${currentCategory?.name || 'items'}...`}
                      value={searchItemQuery}
                      onChange={(e) => setSearchItemQuery(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#172033] placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <span className="text-xs text-[#64748B] font-medium">
                    Showing <strong className="text-[#172033]">{categoryProducts.length}</strong> items
                  </span>
                </div>

                <button
                  id="btn-add-product"
                  onClick={() => handleOpenProductModal()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add New Item
                </button>
              </div>

              {/* Items Grid */}
              {categoryProducts.length === 0 ? (
                <div className="py-16 text-center">
                  <UtensilsCrossed className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-[#172033]">No menu items found</h3>
                  <p className="text-xs text-[#64748B] mt-1">
                    Click "Add New Item" to create a dish in {currentCategory?.name}.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {categoryProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="bg-white border border-[#E5EAF2] rounded-2xl p-3.5 hover:border-blue-300 transition-all flex flex-col justify-between shadow-xs"
                      style={prod.cardBgColor && prod.cardBgColor !== '#ffffff' && prod.cardBgColor !== '#0f172a' ? { backgroundColor: prod.cardBgColor } : undefined}
                    >
                      <div className="flex gap-3">
                        {prod.image && prod.image.trim() !== '' ? (
                          <img
                            src={prod.image.trim()}
                            alt={prod.name}
                            className="w-16 h-16 rounded-xl object-cover border border-[#E5EAF2] shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-slate-100 border border-[#E5EAF2] flex items-center justify-center text-[#64748B] shrink-0">
                            <Utensils className="w-6 h-6" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-blue-600 font-mono">{prod.code}</span>
                            <h4 className="text-sm font-bold text-[#172033] truncate">{prod.name}</h4>
                          </div>

                          {prod.description && prod.description.trim() !== '' && (
                            <p className="text-[11px] text-[#64748B] line-clamp-2 mt-1">{prod.description}</p>
                          )}

                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            {prod.isVegetarian && (
                              <span className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] rounded font-bold flex items-center gap-0.5">
                                <Leaf className="w-2.5 h-2.5" /> Veg
                              </span>
                            )}
                            {prod.isSpicy && (
                              <span className="px-1.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] rounded font-bold flex items-center gap-0.5">
                                <Flame className="w-2.5 h-2.5" /> Spicy
                              </span>
                            )}
                            {prod.isPopular && (
                              <span className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] rounded font-bold flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5" /> Popular
                              </span>
                            )}
                            {prod.customBadge && (
                              <span className="px-1.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] rounded font-bold">
                                {prod.customBadge}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Variants & Pricing Bottom bar */}
                      <div className="mt-3 pt-2.5 border-t border-[#E5EAF2] flex items-center justify-between">
                        <div>
                          <span className="text-xs font-black font-mono text-blue-600">
                            £{(prod.basePrice || 0).toFixed(2)}
                          </span>
                          {prod.variants && prod.variants.length > 1 && (
                            <span className="text-[11px] text-[#64748B] ml-1.5">
                              ({prod.variants.length} Sizes)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateProduct(prod.id, { isAvailable: !prod.isAvailable })
                            }
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                              prod.isAvailable
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-[#64748B] border border-[#E5EAF2]'
                            }`}
                          >
                            {prod.isAvailable ? 'In Stock' : 'Out of Stock'}
                          </button>

                          <button
                            onClick={() => handleOpenProductModal(prod)}
                            className="p-1.5 hover:bg-slate-100 text-[#64748B] hover:text-blue-600 rounded-md transition-colors cursor-pointer"
                            title="Edit Item"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() =>
                              setDeleteConfirmItem({
                                type: 'product',
                                id: prod.id,
                                name: prod.name,
                                extraInfo: `Item code: ${prod.code}`,
                              })
                            }
                            className="p-1.5 hover:bg-rose-50 text-[#64748B] hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ADD-ON GROUPS MANAGEMENT TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'addon-groups' && (
        <div id="addon-groups-subtab-container">
          <AddonGroupsManagement />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MENU ORGANIZER VIEW */}
      {/* ========================================================================= */}
      {activeSubTab === 'organizer' && (
        <div className="space-y-6" id="organizer-panel">
          {/* Organizer Control Bar */}
          <div className="bg-white border border-[#E5EAF2] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-black text-[#172033] flex items-center gap-2">
                <Grid3X3 className="w-4 h-4 text-blue-600" />
                POS Visual Menu Organizer & Layout Manager
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Reorder category positions, reorder dish cards, customize background colors and badges.
                <strong className="text-amber-700 ml-1">Organizer never deletes items.</strong>
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {organizerHasChanges && (
                <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl animate-pulse">
                  Unsaved Changes
                </span>
              )}
              <button
                id="btn-cancel-organizer"
                onClick={handleCancelOrganizer}
                disabled={!organizerHasChanges}
                className="px-3.5 py-1.5 bg-white border border-[#E5EAF2] hover:bg-slate-50 disabled:opacity-50 text-[#64748B] hover:text-[#172033] rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Reset
              </button>
              <button
                id="btn-save-organizer"
                onClick={handleSaveOrganizer}
                disabled={!organizerHasChanges}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Save Organizer to POS
              </button>
            </div>
          </div>

          {/* Reorder Categories Row */}
          <div className="bg-white border border-[#E5EAF2] rounded-2xl p-4 shadow-sm">
            <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3">
              1. Category Display Order (POS Tab Order)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {organizerCategories.map((cat, idx) => (
                <div
                  key={cat.id}
                  onClick={() => setOrganizerSelectedCat(cat.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    organizerSelectedCat === cat.id
                      ? 'bg-blue-50 border-blue-400 shadow-xs ring-1 ring-blue-300'
                      : 'bg-white border-[#E5EAF2] hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black text-blue-600">Position #{idx + 1}</span>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleMoveCategory(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 bg-[#F8FAFC] hover:bg-slate-200 border border-[#E5EAF2] disabled:opacity-30 rounded text-[#172033] cursor-pointer"
                        title="Move Left"
                      >
                        ←
                      </button>
                      <button
                        onClick={() => handleMoveCategory(idx, 'down')}
                        disabled={idx === organizerCategories.length - 1}
                        className="p-1 bg-[#F8FAFC] hover:bg-slate-200 border border-[#E5EAF2] disabled:opacity-30 rounded text-[#172033] cursor-pointer"
                        title="Move Right"
                      >
                        →
                      </button>
                    </div>
                  </div>
                  {cat.image && cat.image.trim() !== '' ? (
                    <img
                      src={cat.image.trim()}
                      alt={cat.name}
                      className="w-full h-16 object-cover rounded-xl mb-1.5 border border-[#E5EAF2]"
                    />
                  ) : null}
                  <h4 className="text-xs font-bold text-[#172033] truncate text-center">{cat.name}</h4>
                </div>
              ))}
            </div>
          </div>

          {/* Card Design & Color Styling Palette */}
          <div className="bg-white border border-[#E5EAF2] rounded-2xl p-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-[#E5EAF2] mb-4">
              <div>
                <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-2">
                  <Palette className="w-4 h-4 text-blue-600" />
                  2. Card Background & Palette for Selected Category (
                  <span className="text-[#172033] font-black">
                    {organizerCategories.find((c) => c.id === organizerSelectedCat)?.name}
                  </span>
                  )
                </h3>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Apply a modern color tint to this category's cards on the POS terminal screen.
                </p>
              </div>

              {/* Swatches */}
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.hex}
                    onClick={() => {
                      setOrganizerCardColor(swatch.hex);
                      handleApplyColorToCategoryProducts(organizerSelectedCat, swatch.hex);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border border-[#E5EAF2] hover:scale-105 transition-all text-[#172033] cursor-pointer shadow-xs"
                    style={{ backgroundColor: swatch.hex }}
                  >
                    {swatch.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reordering Items in Selected Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {organizerProducts
                .filter((p) => p.categoryId === organizerSelectedCat)
                .map((prod, pIdx, arr) => (
                  <div
                    key={prod.id}
                    className="p-3.5 rounded-2xl border border-[#E5EAF2] shadow-xs flex flex-col justify-between transition-all bg-white"
                    style={prod.cardBgColor && prod.cardBgColor !== '#ffffff' && prod.cardBgColor !== '#0f172a' ? { backgroundColor: prod.cardBgColor } : undefined}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-blue-600 font-mono">{prod.code}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleMoveProduct(prod.categoryId, pIdx, 'up')}
                            disabled={pIdx === 0}
                            className="px-2 py-0.5 bg-[#F8FAFC] hover:bg-slate-200 border border-[#E5EAF2] disabled:opacity-30 rounded text-[11px] text-[#172033] cursor-pointer"
                            title="Move Up in POS Grid"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => handleMoveProduct(prod.categoryId, pIdx, 'down')}
                            disabled={pIdx === arr.length - 1}
                            className="px-2 py-0.5 bg-[#F8FAFC] hover:bg-slate-200 border border-[#E5EAF2] disabled:opacity-30 rounded text-[11px] text-[#172033] cursor-pointer"
                            title="Move Down in POS Grid"
                          >
                            ↓
                          </button>
                        </div>
                      </div>

                      {prod.image && prod.image.trim() !== '' ? (
                        <img
                          src={prod.image.trim()}
                          alt={prod.name}
                          className="w-full h-24 object-cover rounded-xl mb-2 border border-[#E5EAF2]"
                        />
                      ) : null}
                      <h4 className="text-xs font-bold text-[#172033] truncate">{prod.name}</h4>
                      <p className="text-[11px] text-blue-600 font-mono font-black mt-0.5">
                        £{(prod.basePrice || 0).toFixed(2)}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#E5EAF2] flex items-center justify-between text-[11px] text-[#64748B]">
                      <span>Order #{pIdx + 1}</span>
                      <span className="font-medium">{prod.variants?.length || 1} sizes</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. BULK MENU PRICE UPDATE VIEW */}
      {/* ========================================================================= */}
      {activeSubTab === 'bulk-pricing' && (
        <div className="space-y-6" id="bulk-pricing-panel">
          {/* Bulk Update Control Banner */}
          <div className="bg-white border border-[#E5EAF2] rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E5EAF2]">
              <div>
                <h2 className="text-base font-black text-[#172033] flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  Bulk Menu Price Adjustment Engine
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Select menu items or entire categories to adjust prices in batch. Updates base prices and
                  all variant sizes safely.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 font-mono">
                  {selectedProductIds.length} items selected
                </span>
                <button
                  id="btn-clear-selection"
                  onClick={() => setSelectedProductIds([])}
                  disabled={selectedProductIds.length === 0}
                  className="px-3 py-1.5 bg-white border border-[#E5EAF2] hover:bg-slate-50 disabled:opacity-40 text-[#64748B] hover:text-[#172033] rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Clear Selection
                </button>
                <button
                  id="btn-preview-bulk"
                  onClick={() => setShowBulkConfirmModal(true)}
                  disabled={selectedProductIds.length === 0}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  Preview & Apply ({selectedProductIds.length})
                </button>
              </div>
            </div>

            {/* Adjustment Form Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-[#64748B] mb-1.5">Action Direction</label>
                <div className="grid grid-cols-2 gap-1 bg-[#F8FAFC] p-1 rounded-xl border border-[#E5EAF2]">
                  <button
                    onClick={() => setBulkDirection('increase')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      bulkDirection === 'increase'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-[#64748B] hover:text-[#172033]'
                    }`}
                  >
                    + Increase Price
                  </button>
                  <button
                    onClick={() => setBulkDirection('decrease')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      bulkDirection === 'decrease'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-[#64748B] hover:text-[#172033]'
                    }`}
                  >
                    - Decrease Price
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#64748B] mb-1.5">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-1 bg-[#F8FAFC] p-1 rounded-xl border border-[#E5EAF2]">
                  <button
                    onClick={() => setBulkAdjustmentType('percentage')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      bulkAdjustmentType === 'percentage'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-[#64748B] hover:text-[#172033]'
                    }`}
                  >
                    % Percentage
                  </button>
                  <button
                    onClick={() => setBulkAdjustmentType('fixed')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      bulkAdjustmentType === 'fixed'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-[#64748B] hover:text-[#172033]'
                    }`}
                  >
                    £ Fixed Amount
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#64748B] mb-1.5">
                  Adjustment Value ({bulkAdjustmentType === 'percentage' ? '%' : '£'})
                </label>
                <input
                  type="number"
                  min="0.1"
                  step={bulkAdjustmentType === 'percentage' ? '1' : '0.10'}
                  value={bulkAmount}
                  onChange={(e) => setBulkAmount(Math.max(0.1, Number(e.target.value)))}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-xl px-3 py-1.5 text-xs text-[#172033] focus:outline-none focus:border-blue-600 font-bold"
                />
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    checked={bulkApplyVariants}
                    onChange={(e) => setBulkApplyVariants(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-[#E5EAF2] focus:ring-0"
                  />
                  <span className="text-xs font-semibold text-[#172033]">
                    Apply to all product size variants
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Categories & Products Selection Table */}
          <div className="bg-white border border-[#E5EAF2] rounded-2xl p-4 space-y-4 shadow-sm">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#E5EAF2]">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter items for bulk pricing..."
                  value={bulkSearchQuery}
                  onChange={(e) => setBulkSearchQuery(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#172033] placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <button
                onClick={handleSelectAllBulk}
                className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E5EAF2] hover:bg-slate-100 text-xs font-bold text-[#172033] rounded-xl transition-colors cursor-pointer"
              >
                {selectedProductIds.length === allFilteredBulkProducts.length
                  ? 'Deselect All'
                  : 'Select All Items'}
              </button>
            </div>

            {/* Category accordions */}
            <div className="space-y-3">
              {categories.map((cat) => {
                const catProds = products.filter((p) => p.categoryId === cat.id);
                if (catProds.length === 0) return null;

                const isExpanded = expandedCategories[cat.id] ?? true;
                const catProdIds = catProds.map((p) => p.id);
                const allSelected = catProdIds.every((id) => selectedProductIds.includes(id));
                const someSelected = catProdIds.some((id) => selectedProductIds.includes(id));

                return (
                  <div key={cat.id} className="border border-[#E5EAF2] rounded-2xl overflow-hidden bg-white shadow-xs">
                    <div className="flex items-center justify-between p-3.5 bg-[#F8FAFC] border-b border-[#E5EAF2]">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleCategoryBulk(cat.id)}
                          className="text-[#64748B] hover:text-[#172033] cursor-pointer"
                        >
                          {allSelected ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : someSelected ? (
                            <div className="w-5 h-5 border-2 border-blue-600 bg-blue-100 rounded flex items-center justify-center">
                              <div className="w-2 h-2 bg-blue-600 rounded-sm" />
                            </div>
                          ) : (
                            <Square className="w-5 h-5 text-slate-400" />
                          )}
                        </button>

                        <div
                          className="flex items-center gap-2 cursor-pointer"
                          onClick={() =>
                            setExpandedCategories((prev) => ({
                              ...prev,
                              [cat.id]: !prev[cat.id],
                            }))
                          }
                        >
                          {cat.image && cat.image.trim() !== '' ? (
                            <img
                              src={cat.image.trim()}
                              alt={cat.name}
                              className="w-7 h-7 rounded-lg object-cover border border-[#E5EAF2]"
                            />
                          ) : null}
                          <h4 className="text-sm font-bold text-[#172033]">{cat.name}</h4>
                          <span className="text-xs text-[#64748B] font-medium">
                            ({catProds.length} items)
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          setExpandedCategories((prev) => ({
                            ...prev,
                            [cat.id]: !prev[cat.id],
                          }))
                        }
                        className="text-[#64748B] hover:text-[#172033] p-1 cursor-pointer"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="divide-y divide-[#E5EAF2]">
                        {catProds.map((prod) => {
                          const isSelected = selectedProductIds.includes(prod.id);
                          const previewBase = calculatePreviewPrice(prod.basePrice);
                          const diff = previewBase - prod.basePrice;

                          return (
                            <div
                              key={prod.id}
                              className={`p-3 flex items-center justify-between transition-colors ${
                                isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleToggleProductBulk(prod.id)}
                                  className="text-[#64748B] hover:text-[#172033] cursor-pointer"
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-blue-600" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-400" />
                                  )}
                                </button>
                                {prod.image && prod.image.trim() !== '' ? (
                                  <img
                                    src={prod.image.trim()}
                                    alt={prod.name}
                                    className="w-9 h-9 rounded-lg object-cover border border-[#E5EAF2]"
                                  />
                                ) : null}
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-black text-blue-600 font-mono">{prod.code}</span>
                                    <h5 className="text-xs font-bold text-[#172033]">{prod.name}</h5>
                                  </div>
                                  <p className="text-[11px] text-[#64748B]">
                                    {prod.variants?.length || 1} variants registered
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-6 text-right">
                                <div>
                                  <span className="text-xs text-[#64748B] block font-medium">Current Price</span>
                                  <span className="text-xs font-bold font-mono text-[#172033]">
                                    £{(prod.basePrice || 0).toFixed(2)}
                                  </span>
                                </div>

                                <div className="min-w-[100px]">
                                  <span className="text-xs text-[#64748B] block font-medium">New Preview</span>
                                  <span
                                    className={`text-xs font-black font-mono ${
                                      diff > 0
                                        ? 'text-emerald-600'
                                        : diff < 0
                                        ? 'text-rose-600'
                                        : 'text-[#172033]'
                                    }`}
                                  >
                                    £{previewBase.toFixed(2)}{' '}
                                    <span className="text-[10px] font-normal">
                                      ({diff >= 0 ? `+£${diff.toFixed(2)}` : `-£${Math.abs(diff).toFixed(2)}`})
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bulk Update Confirm Modal */}
          {showBulkConfirmModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-[#E5EAF2] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF2]">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[#172033]">Confirm Bulk Price Update</h3>
                      <p className="text-xs text-[#64748B]">Review changes before saving permanently</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowBulkConfirmModal(false)}
                    className="text-[#64748B] hover:text-[#172033] cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E5EAF2] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Total Items Selected:</span>
                    <span className="font-bold text-[#172033] font-mono">{selectedProductIds.length} items</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Operation:</span>
                    <span className="font-bold text-blue-600 uppercase">
                      {bulkDirection} by {bulkAmount}
                      {bulkAdjustmentType === 'percentage' ? '%' : '£'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Apply to All Variant Sizes:</span>
                    <span className="font-bold text-[#172033]">{bulkApplyVariants ? 'Yes' : 'No (Base Only)'}</span>
                  </div>
                </div>

                <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200">
                  ⚠️ Note: This change takes immediate effect on the POS Menu, Cart, and Online Ordering.
                </p>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowBulkConfirmModal(false)}
                    className="px-4 py-2 bg-white border border-[#E5EAF2] hover:bg-slate-50 text-[#172033] rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-apply-bulk-price-now"
                    onClick={handleExecuteBulkPriceUpdate}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Apply Price Update
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODIFIERS & ADD-ONS LIBRARY VIEW */}
      {/* ========================================================================= */}
      {activeSubTab === 'modifiers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="modifiers-library-panel">
          {/* Left Column: Reusable Modifier Groups */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white border border-[#E5EAF2] rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF2] mb-4">
                <div>
                  <h3 className="text-sm font-black text-[#172033]">Reusable Modifier Groups</h3>
                  <p className="text-xs text-[#64748B]">Rules (Min/Max choices, Required/Optional)</p>
                </div>
                <button
                  onClick={() => {
                    setEditingModifierGroup(null);
                    setModGroupForm({
                      name: '',
                      description: '',
                      minSelections: 0,
                      maxSelections: 1,
                      isRequired: false,
                      allowMultiple: false,
                      modifierIds: [],
                    });
                    setIsModifierGroupModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Group
                </button>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {modifierGroups.map((grp) => (
                  <div key={grp.id} className="p-3.5 bg-[#F8FAFC] border border-[#E5EAF2] rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#172033]">{grp.name}</h4>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingModifierGroup(grp);
                            setModGroupForm({
                              name: grp.name,
                              description: grp.description || '',
                              minSelections: grp.minSelections,
                              maxSelections: grp.maxSelections,
                              isRequired: grp.isRequired,
                              allowMultiple: grp.allowMultiple,
                              modifierIds: grp.modifierIds || [],
                            });
                            setIsModifierGroupModalOpen(true);
                          }}
                          className="p-1 hover:bg-slate-200 text-[#64748B] hover:text-blue-600 rounded cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirmItem({
                              type: 'modifierGroup',
                              id: grp.id,
                              name: grp.name,
                              extraInfo: `${grp.modifierIds?.length || 0} modifier options are linked to this group.`,
                            })
                          }
                          className="p-1 hover:bg-rose-100 text-[#64748B] hover:text-rose-600 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-[#64748B]">{grp.description || 'No description'}</p>

                    <div className="flex items-center gap-2 flex-wrap text-[10px]">
                      <span className="px-2 py-0.5 bg-white border border-[#E5EAF2] text-[#172033] rounded font-semibold">
                        Min: {grp.minSelections} | Max: {grp.maxSelections}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-semibold ${
                          grp.isRequired
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {grp.isRequired ? 'Mandatory' : 'Optional'}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-semibold">
                        {grp.modifierIds?.length || 0} Options linked
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Individual Modifiers / Add-on Options */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white border border-[#E5EAF2] rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF2] mb-4">
                <div>
                  <h3 className="text-sm font-black text-[#172033]">Add-on & Modifier Options Library</h3>
                  <p className="text-xs text-[#64748B]">Items, Sauces, Toppings and Extra ingredients</p>
                </div>
                <button
                  onClick={() => {
                    setEditingModifierItem(null);
                    setModItemForm({
                      name: '',
                      description: '',
                      price: 0.8,
                      category: 'Extras',
                      isAvailable: true,
                    });
                    setIsModifierItemModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Option
                </button>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {modifiers.map((mod) => (
                  <div
                    key={mod.id}
                    className="p-2.5 bg-[#F8FAFC] border border-[#E5EAF2] rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#172033]">{mod.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-white border border-[#E5EAF2] rounded text-[#64748B]">
                          {mod.category || 'Extras'}
                        </span>
                      </div>
                      {mod.description && mod.description.trim() !== '' && (
                        <p className="text-[11px] text-[#64748B] mt-0.5 line-clamp-2">{mod.description}</p>
                      )}
                      <span className="text-blue-600 font-bold font-mono">
                        {mod.price === 0 ? 'FREE' : `+£${mod.price.toFixed(2)}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateModifier(mod.id, { isAvailable: !mod.isAvailable })}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                          mod.isAvailable
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-[#64748B] border border-[#E5EAF2]'
                        }`}
                      >
                        {mod.isAvailable ? 'Available' : 'Disabled'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingModifierItem(mod);
                          setModItemForm({
                            name: mod.name,
                            description: mod.description || '',
                            price: mod.price,
                            category: mod.category || 'Extras',
                            isAvailable: mod.isAvailable,
                          });
                          setIsModifierItemModalOpen(true);
                        }}
                        className="p-1 hover:bg-slate-200 text-[#64748B] hover:text-blue-600 rounded cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirmItem({
                            type: 'modifier',
                            id: mod.id,
                            name: mod.name,
                            extraInfo: `Category: ${mod.category || 'Extras'}, Price: £${mod.price.toFixed(2)}`,
                          })
                        }
                        className="p-1 hover:bg-rose-100 text-[#64748B] hover:text-rose-600 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CATEGORY ADD/EDIT MODAL */}
      {/* ========================================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5EAF2] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF2]">
              <h3 className="text-sm font-black text-[#172033]">
                {editingCategory ? 'Edit Category' : 'Create Menu Category'}
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-[#64748B] hover:text-[#172033] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#172033] font-bold mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gourmet Burgers"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-xl px-3 py-2 text-[#172033] placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[#172033] font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Category overview or cuisine notes..."
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-xl px-3 py-2 text-[#172033] placeholder:text-slate-400 focus:outline-none focus:border-blue-600 resize-y"
                />
              </div>

              <div>
                <label className="block text-[#172033] font-bold mb-1">Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={categoryForm.image}
                  onChange={(e) => setCategoryForm({ ...categoryForm, image: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-xl px-3 py-2 text-[#172033] placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[#172033] font-bold mb-1">Badge Text (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. CHEF SPECIAL, 20% OFF"
                  value={categoryForm.badgeText}
                  onChange={(e) => setCategoryForm({ ...categoryForm, badgeText: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-xl px-3 py-2 text-[#172033] placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5EAF2]">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 bg-white border border-[#E5EAF2] hover:bg-slate-50 text-[#172033] rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRODUCT / DISH ADD/EDIT MODAL */}
      {/* ========================================================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E5EAF2] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF2]">
              <div>
                <h3 className="text-base font-black text-[#172033]">
                  {editingProduct ? `Edit ${editingProduct.name}` : 'Add Menu Item'}
                </h3>
                <p className="text-xs text-[#64748B]">Configure item details, sizes, and modifier links</p>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-[#64748B] hover:text-[#172033] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#172033] font-bold mb-1">Category *</label>
                  <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#172033] font-bold mb-1">Subcategory</label>
                  <select
                    value={productForm.subcategoryId}
                    onChange={(e) => setProductForm({ ...productForm, subcategoryId: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600"
                  >
                    <option value="">None / General</option>
                    {categories
                      .find((c) => c.id === productForm.categoryId)
                      ?.subcategories.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#172033] font-bold mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="(01)"
                    value={productForm.code}
                    onChange={(e) => setProductForm({ ...productForm, code: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-xl px-3 py-2 text-blue-600 font-black font-mono focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#172033] font-bold mb-1">Dish Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Margherita Supreme"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600 font-bold"
                />
              </div>

              <div>
                <label className="block text-[#172033] font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Ingredients, culinary notes, allergen details..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600 resize-y"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#172033] font-bold mb-1">Base Price (£) *</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    required
                    value={productForm.basePrice || ''}
                    onChange={(e) => {
                      const newPrice = parseFloat(e.target.value) || 0;
                      setProductForm((prev) => ({
                        ...prev,
                        basePrice: newPrice,
                        variants:
                          prev.variants.length <= 1
                            ? prev.variants.map((v) => ({ ...v, price: newPrice }))
                            : prev.variants,
                      }));
                    }}
                    className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600 font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#172033] font-bold mb-1">Image URL</label>
                  <input
                    type="url"
                    value={productForm.image}
                    onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Dietary Flags & Badges */}
              <div className="flex items-center gap-4 flex-wrap bg-[#F8FAFC] p-3 rounded-xl border border-[#E5EAF2]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isVegetarian}
                    onChange={(e) =>
                      setProductForm({ ...productForm, isVegetarian: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-blue-600 border-[#E5EAF2]"
                  />
                  <span className="text-[#172033] font-medium">Vegetarian</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isSpicy}
                    onChange={(e) =>
                      setProductForm({ ...productForm, isSpicy: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-blue-600 border-[#E5EAF2]"
                  />
                  <span className="text-[#172033] font-medium">Spicy</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isPopular}
                    onChange={(e) =>
                      setProductForm({ ...productForm, isPopular: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-blue-600 border-[#E5EAF2]"
                  />
                  <span className="text-[#172033] font-medium">Popular / Signature</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isAvailable}
                    onChange={(e) =>
                      setProductForm({ ...productForm, isAvailable: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-blue-600 border-[#E5EAF2]"
                  />
                  <span className="text-[#172033] font-medium">In Stock</span>
                </label>
              </div>

              {/* Sizes / Multiple Variants Management */}
              <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E5EAF2] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#E5EAF2]">
                  <h4 className="text-xs font-bold text-[#172033]">Sizes & Price Variants</h4>
                  <span className="text-[11px] text-[#64748B]">
                    {productForm.variants.length} Variant(s) registered
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <input
                      type="text"
                      placeholder="Variant name (e.g. 12 Inch)"
                      value={variantForm.name}
                      onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                      className="bg-white border border-[#E5EAF2] rounded-xl px-2.5 py-1.5 text-xs text-[#172033]"
                    />
                    <input
                      type="text"
                      placeholder="Size label (e.g. 12&quot; Medium)"
                      value={variantForm.sizeLabel}
                      onChange={(e) => setVariantForm({ ...variantForm, sizeLabel: e.target.value })}
                      className="bg-white border border-[#E5EAF2] rounded-xl px-2.5 py-1.5 text-xs text-[#172033]"
                    />
                    <input
                      type="number"
                      step="0.05"
                      placeholder="Price (£)"
                      value={variantForm.price}
                      onChange={(e) => setVariantForm({ ...variantForm, price: Number(e.target.value) })}
                      className="bg-white border border-[#E5EAF2] rounded-xl px-2.5 py-1.5 text-xs text-[#172033] font-bold font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleAddVariantToForm}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Size
                    </button>
                  </div>
                  <textarea
                    rows={1}
                    placeholder="Variant description (optional)..."
                    value={variantForm.description}
                    onChange={(e) => setVariantForm({ ...variantForm, description: e.target.value })}
                    className="w-full bg-white border border-[#E5EAF2] rounded-xl px-2.5 py-1.5 text-xs text-[#172033] placeholder:text-slate-400 focus:outline-none focus:border-blue-600 resize-y"
                  />
                </div>

                <div className="space-y-1.5">
                  {productForm.variants.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between px-3 py-2 bg-white border border-[#E5EAF2] rounded-xl text-xs"
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#172033]">{v.name}</span>
                          <span className="text-[#64748B]">({v.sizeLabel})</span>
                          {v.isDefault && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-bold">
                              Default
                            </span>
                          )}
                        </div>
                        {v.description && v.description.trim() !== '' && (
                          <span className="text-[11px] text-[#64748B] mt-0.5 line-clamp-1">{v.description}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-black font-mono text-blue-600">£{v.price.toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariantFromForm(v.id)}
                          className="text-[#64748B] hover:text-rose-600 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Linked Add-on Groups (New Dedicated Groups System) */}
              <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-blue-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-600" />
                    Linked Add-on Groups (Pizza Add-ons, Burger Add-ons, etc.)
                  </h4>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {productForm.addonGroupIds.length} Linked
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B]">
                  Select which custom Add-on Groups belong to this menu item. Only linked groups will appear in the POS register.
                </p>

                {addonGroups.length === 0 ? (
                  <div className="p-3 bg-white rounded-xl border border-[#E5EAF2] text-center text-xs text-[#64748B]">
                    No Add-on Groups created yet. Create them in the &quot;Add-on Groups&quot; tab.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {addonGroups.map((grp) => {
                      const isLinked = productForm.addonGroupIds.includes(grp.id);
                      return (
                        <div
                          key={grp.id}
                          onClick={() => handleToggleAddonGroup(grp.id)}
                          className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                            isLinked
                              ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200'
                              : 'bg-white border-[#E5EAF2] hover:border-slate-300'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <span className="font-bold text-xs text-[#172033] block truncate">
                              {grp.name}
                            </span>
                            <span className="text-[10px] text-[#64748B]">
                              {grp.items?.length || 0} modifiers • {grp.allowMultiple !== false ? 'Multi-select' : 'Single'}
                            </span>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 ${
                              isLinked
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-[#64748B] bg-white'
                            }`}
                          >
                            {isLinked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Linked Modifier Groups */}
              <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E5EAF2] space-y-2">
                <h4 className="text-xs font-bold text-[#172033]">Legacy Modifier Groups (Optional)</h4>
                <p className="text-[11px] text-[#64748B]">
                  Standard modifier option choices
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {modifierGroups.map((grp) => {
                    const isLinked = productForm.modifierGroupIds.includes(grp.id);
                    return (
                      <div
                        key={grp.id}
                        onClick={() => handleToggleModGroup(grp.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                          isLinked
                            ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200'
                            : 'bg-white border-[#E5EAF2] hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <span className="font-bold text-[#172033] block">{grp.name}</span>
                          <span className="text-[10px] text-[#64748B]">
                            {grp.isRequired ? 'Mandatory' : 'Optional'} • {grp.modifierIds?.length || 0} options
                          </span>
                        </div>
                        {isLinked && <Check className="w-4 h-4 text-blue-600 font-bold" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5EAF2]">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 bg-white border border-[#E5EAF2] hover:bg-slate-50 text-[#172033] rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  {editingProduct ? 'Save Item Changes' : 'Create Menu Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODIFIER GROUP MODAL */}
      {/* ========================================================================= */}
      {isModifierGroupModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5EAF2] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF2]">
              <h3 className="text-sm font-black text-[#172033]">
                {editingModifierGroup ? 'Edit Modifier Group' : 'New Modifier Group'}
              </h3>
              <button
                onClick={() => setIsModifierGroupModalOpen(false)}
                className="text-[#64748B] hover:text-[#172033] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!modGroupForm.name.trim()) return;
                if (editingModifierGroup) {
                  updateModifierGroup(editingModifierGroup.id, modGroupForm);
                } else {
                  addModifierGroup(modGroupForm);
                }
                setIsModifierGroupModalOpen(false);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-[#172033] font-bold mb-1">Group Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Extra Pizza Toppings"
                  value={modGroupForm.name}
                  onChange={(e) => setModGroupForm({ ...modGroupForm, name: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[#172033] font-bold mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Choose up to 10 additional gourmet toppings"
                  value={modGroupForm.description}
                  onChange={(e) => setModGroupForm({ ...modGroupForm, description: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#172033] font-bold mb-1">Min Choices</label>
                  <input
                    type="number"
                    min="0"
                    value={modGroupForm.minSelections}
                    onChange={(e) =>
                      setModGroupForm({ ...modGroupForm, minSelections: Number(e.target.value) })
                    }
                    className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#172033] font-bold mb-1">Max Choices</label>
                  <input
                    type="number"
                    min="1"
                    value={modGroupForm.maxSelections}
                    onChange={(e) =>
                      setModGroupForm({ ...modGroupForm, maxSelections: Number(e.target.value) })
                    }
                    className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 bg-[#F8FAFC] p-3 rounded-xl border border-[#E5EAF2]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modGroupForm.isRequired}
                    onChange={(e) =>
                      setModGroupForm({ ...modGroupForm, isRequired: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-blue-600 border-[#E5EAF2]"
                  />
                  <span className="text-[#172033] font-medium">Required by Cashier</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modGroupForm.allowMultiple}
                    onChange={(e) =>
                      setModGroupForm({ ...modGroupForm, allowMultiple: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-blue-600 border-[#E5EAF2]"
                  />
                  <span className="text-[#172033] font-medium">Allow Multiples</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5EAF2]">
                <button
                  type="button"
                  onClick={() => setIsModifierGroupModalOpen(false)}
                  className="px-4 py-2 bg-white border border-[#E5EAF2] hover:bg-slate-50 text-[#172033] rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Save Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODIFIER ITEM MODAL */}
      {/* ========================================================================= */}
      {isModifierItemModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5EAF2] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF2]">
              <h3 className="text-sm font-black text-[#172033]">
                {editingModifierItem ? 'Edit Option' : 'New Add-on Option'}
              </h3>
              <button
                onClick={() => setIsModifierItemModalOpen(false)}
                className="text-[#64748B] hover:text-[#172033] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!modItemForm.name.trim()) return;
                const payload = {
                  ...modItemForm,
                  description: modItemForm.description.trim() || undefined,
                };
                if (editingModifierItem) {
                  updateModifier(editingModifierItem.id, payload);
                } else {
                  addModifier(payload);
                }
                setIsModifierItemModalOpen(false);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-[#172033] font-bold mb-1">Option Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Extra Mozzarella Cheese"
                  value={modItemForm.name}
                  onChange={(e) => setModItemForm({ ...modItemForm, name: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600 font-bold"
                />
              </div>

              <div>
                <label className="block text-[#172033] font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Portion notes, ingredient details (optional)..."
                  value={modItemForm.description}
                  onChange={(e) => setModItemForm({ ...modItemForm, description: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-xl px-3 py-2 text-[#172033] placeholder:text-slate-400 focus:outline-none focus:border-blue-600 resize-y"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#172033] font-bold mb-1">Extra Price (£)</label>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    value={modItemForm.price}
                    onChange={(e) => setModItemForm({ ...modItemForm, price: Number(e.target.value) })}
                    className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600 font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#172033] font-bold mb-1">Category Type</label>
                  <select
                    value={modItemForm.category}
                    onChange={(e) => setModItemForm({ ...modItemForm, category: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600"
                  >
                    <option value="Sauce">Sauce</option>
                    <option value="Veg">Vegetable</option>
                    <option value="Meat">Meat & Premium</option>
                    <option value="Cheese">Cheese</option>
                    <option value="Dips">Dips & Pots</option>
                    <option value="Extras">Extras</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5EAF2]">
                <button
                  type="button"
                  onClick={() => setIsModifierItemModalOpen(false)}
                  className="px-4 py-2 bg-white border border-[#E5EAF2] hover:bg-slate-50 text-[#172033] rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Save Option
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GLOBAL DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#E5EAF2] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-200">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#172033]">
                  Confirm Delete{' '}
                  {deleteConfirmItem.type === 'category'
                    ? 'Category'
                    : deleteConfirmItem.type === 'product'
                    ? 'Menu Item'
                    : deleteConfirmItem.type === 'modifierGroup'
                    ? 'Modifier Group'
                    : deleteConfirmItem.type === 'modifier'
                    ? 'Modifier Option'
                    : 'Subcategory'}
                </h3>
                <p className="text-xs text-[#64748B]">
                  This action will immediately update the active POS catalog
                </p>
              </div>
            </div>

            <p className="text-xs text-[#172033] bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E5EAF2] leading-relaxed">
              Are you sure you want to delete{' '}
              <strong className="text-[#172033] font-black">{deleteConfirmItem.name}</strong>?
              {deleteConfirmItem.extraInfo && (
                <span className="block mt-1.5 text-amber-700 text-[11px] font-medium">
                  ℹ️ {deleteConfirmItem.extraInfo}
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E5EAF2]">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2 rounded-xl bg-white border border-[#E5EAF2] hover:bg-slate-50 text-[#172033] text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirmItem.type === 'product') {
                    deleteProduct(deleteConfirmItem.id);
                  } else if (deleteConfirmItem.type === 'category') {
                    deleteCategory(deleteConfirmItem.id);
                  } else if (deleteConfirmItem.type === 'modifierGroup') {
                    deleteModifierGroup(deleteConfirmItem.id);
                  } else if (deleteConfirmItem.type === 'modifier') {
                    deleteModifier(deleteConfirmItem.id);
                  } else if (deleteConfirmItem.type === 'subcategory' && deleteConfirmItem.categoryId) {
                    deleteSubcategory(deleteConfirmItem.categoryId, deleteConfirmItem.id);
                  }
                  setDeleteConfirmItem(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

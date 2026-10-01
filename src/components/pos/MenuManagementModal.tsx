import React, { useState } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Check,
  Search,
  UtensilsCrossed,
  Tag,
  Layers,
  Sparkles,
  AlertCircle,
  PlusCircle,
} from 'lucide-react';
import { useNexus } from '../../context/NexusContext';
import { Category, Product, ModifierGroup, Modifier, ProductVariant } from '../../types';

export const MenuManagementModal: React.FC = () => {
  const {
    isMenuManagementModalOpen,
    setIsMenuManagementModalOpen,
    stores,
    currentStore,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    deleteSubcategory,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    modifierGroups,
    modifiers,
    addModifierGroup,
    deleteModifierGroup,
    addModifier,
    updateModifier,
    deleteModifier,
  } = useNexus();

  const [activeTab, setActiveTab] = useState<'items' | 'categories' | 'addons'>('items');
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Delete Target State
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'product' | 'category' | 'modifierGroup' | 'modifier';
    id: string;
    name: string;
  } | null>(null);

  // Filter strictly for active store only
  const storeCategories = React.useMemo(() => {
    return categories.filter((c) => c.storeId === currentStore.id);
  }, [categories, currentStore.id]);

  const storeProducts = React.useMemo(() => {
    return products.filter((p) => p.storeId === currentStore.id);
  }, [products, currentStore.id]);

  // Item Form Modal state
  const [isItemEditorOpen, setIsItemEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    code: '',
    categoryId: storeCategories[0]?.id || categories[0]?.id || '',
    subcategoryId: '',
    basePrice: 0,
    description: '',
    variants: [] as ProductVariant[],
  });

  // Category Form Modal state
  const [isCategoryEditorOpen, setIsCategoryEditorOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({
    name: '',
    slug: '',
    iconName: 'Pizza',
    description: '',
  });

  // Addon / Modifier Form state
  const [isAddonEditorOpen, setIsAddonEditorOpen] = useState(false);
  const [addonForm, setAddonForm] = useState({
    name: '',
    description: '',
    price: 1.5,
    groupId: modifierGroups[0]?.id || '',
  });

  if (!isMenuManagementModalOpen) return null;

  // Open Item Editor
  const handleOpenNewItem = () => {
    setEditingProduct(null);
    setItemForm({
      name: '',
      code: `#${Math.floor(10 + Math.random() * 90)}`,
      categoryId: storeCategories[0]?.id || categories[0]?.id || '',
      subcategoryId: '',
      basePrice: 0,
      description: '',
      variants: [],
    });
    setIsItemEditorOpen(true);
  };

  const handleEditItem = (prod: Product) => {
    setEditingProduct(prod);
    setItemForm({
      name: prod.name,
      code: prod.code,
      categoryId: prod.categoryId,
      subcategoryId: prod.subcategoryId || '',
      basePrice: prod.basePrice,
      description: prod.description || '',
      variants: prod.variants && prod.variants.length > 0 ? [...prod.variants] : [
        { id: `v-${Date.now()}`, name: 'Regular', price: prod.basePrice, isDefault: true }
      ],
    });
    setIsItemEditorOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name.trim()) return;

    const basePriceNum = Number(itemForm.basePrice) || 0;
    const variantsToSave =
      itemForm.variants.length > 0
        ? itemForm.variants.map((v) => {
            if (itemForm.variants.length === 1 || (v.isDefault && (v.price === 5.0 || v.price === 0) && basePriceNum !== 5.0)) {
              return { ...v, price: basePriceNum };
            }
            return v;
          })
        : [
            {
              id: `v-${Date.now()}`,
              name: itemForm.name || 'Regular',
              price: basePriceNum,
              isDefault: true,
            },
          ];

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: itemForm.name,
        code: itemForm.code,
        categoryId: itemForm.categoryId,
        subcategoryId: itemForm.subcategoryId || undefined,
        basePrice: basePriceNum,
        description: itemForm.description,
        variants: variantsToSave,
      });
    } else {
      addProduct({
        storeId: currentStore.id,
        categoryId: itemForm.categoryId,
        subcategoryId: itemForm.subcategoryId || undefined,
        code: itemForm.code || '#01',
        name: itemForm.name,
        description: itemForm.description,
        image: '',
        basePrice: basePriceNum,
        isAvailable: true,
        displayOrder: storeProducts.length + 1,
        variants: variantsToSave,
        modifierGroupIds: modifierGroups.map((g) => g.id),
      });
    }
    setIsItemEditorOpen(false);
  };

  // Open Category Editor
  const handleOpenNewCategory = () => {
    setEditingCategory(null);
    setCatForm({
      name: '',
      slug: '',
      iconName: 'Pizza',
      description: '',
    });
    setIsCategoryEditorOpen(true);
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatForm({
      name: cat.name,
      slug: cat.slug,
      iconName: cat.iconName,
      description: cat.description || '',
    });
    setIsCategoryEditorOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name.trim()) return;

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: catForm.name,
        slug: catForm.slug || catForm.name.toLowerCase().replace(/\s+/g, '-'),
        iconName: catForm.iconName,
        description: catForm.description.trim() || undefined,
      });
    } else {
      addCategory({
        storeId: currentStore.id,
        name: catForm.name,
        slug: catForm.slug || catForm.name.toLowerCase().replace(/\s+/g, '-'),
        iconName: catForm.iconName,
        description: catForm.description.trim() || undefined,
        image: '',
        displayOrder: storeCategories.length + 1,
        isActive: true,
        subcategories: [
          { id: `sub-${Date.now()}-1`, name: 'Standard' },
          { id: `sub-${Date.now()}-2`, name: 'Special' },
        ],
      });
    }
    setIsCategoryEditorOpen(false);
  };

  // Save Modifier Addon
  const handleSaveAddon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addonForm.name.trim() || !addonForm.groupId) return;

    addModifier({
      groupId: addonForm.groupId,
      name: addonForm.name,
      description: addonForm.description.trim() || undefined,
      price: Number(addonForm.price),
      isAvailable: true,
      displayOrder: modifiers.length + 1,
    });

    setAddonForm({
      name: '',
      description: '',
      price: 1.5,
      groupId: addonForm.groupId,
    });
    setIsAddonEditorOpen(false);
  };

  // Filtered Products
  const filteredProducts = storeProducts.filter((p) => {
    if (selectedCatFilter !== 'all' && p.categoryId !== selectedCatFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-white border border-[#E5EAF2] rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-white border-b border-[#E5EAF2] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#172033] tracking-tight">
                POS Menu & Catalog Manager
              </h2>
              <p className="text-xs text-[#64748B]">
                Managing menu for: <strong className="text-blue-600 font-bold">{currentStore.businessName}</strong> ({currentStore.branchName})
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsMenuManagementModalOpen(false)}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation & Search */}
        <div className="px-5 py-2.5 bg-[#F8FAFC] border-b border-[#E5EAF2] flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1.5 bg-white p-1 rounded-lg border border-[#E5EAF2]">
            <button
              onClick={() => setActiveTab('items')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'items'
                  ? 'bg-blue-600 text-white'
                  : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              Menu Items ({storeProducts.length})
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-blue-600 text-white'
                  : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              Categories ({storeCategories.length})
            </button>
            <button
              onClick={() => setActiveTab('addons')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'addons'
                  ? 'bg-blue-600 text-white'
                  : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              Add-ons & Modifiers ({modifiers.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'items' && (
              <>
                <select
                  value={selectedCatFilter}
                  onChange={(e) => setSelectedCatFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-[#E5EAF2] rounded-lg text-xs text-[#172033] focus:outline-none focus:border-blue-600 shadow-xs"
                >
                  <option value="all">All Categories</option>
                  {storeCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search menu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-white border border-[#E5EAF2] rounded-lg text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>

                <button
                  onClick={handleOpenNewItem}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Item</span>
                </button>
              </>
            )}

            {activeTab === 'categories' && (
              <button
                onClick={handleOpenNewCategory}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Category</span>
              </button>
            )}

            {activeTab === 'addons' && (
              <button
                onClick={() => setIsAddonEditorOpen(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Add-on</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 bg-[#F8FAFC]">
          {/* TAB 1: Menu Items */}
          {activeTab === 'items' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredProducts.map((prod) => {
                  const cat = storeCategories.find((c) => c.id === prod.categoryId) || categories.find((c) => c.id === prod.categoryId);
                  return (
                    <div
                      key={prod.id}
                      className="p-3.5 rounded-xl bg-white border border-[#E5EAF2] hover:border-blue-400 flex flex-col justify-between text-xs transition-colors shadow-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-start justify-between">
                          <span className="font-bold text-sm text-[#172033]">{prod.name}</span>
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-mono text-[10px] font-bold border border-blue-100">
                            {prod.code}
                          </span>
                        </div>
                        {prod.description && prod.description.trim() !== '' && (
                          <p className="text-[11px] text-[#64748B] line-clamp-2">
                            {prod.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
                          <span className="text-blue-600 font-bold">{cat?.name}</span>
                          <span>•</span>
                          <span className="font-mono text-[#172033] font-bold">
                            £{prod.basePrice.toFixed(2)}
                          </span>
                        </div>
                        {prod.variants && prod.variants.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {prod.variants.map((v) => (
                              <span
                                key={v.id}
                                className="px-1.5 py-0.5 rounded bg-[#F8FAFC] border border-[#E5EAF2] text-[10px] text-[#64748B] font-mono"
                              >
                                {v.name}: £{v.price.toFixed(2)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-[#E5EAF2] mt-2">
                        <button
                          onClick={() => handleEditItem(prod)}
                          className="px-2 py-1 rounded bg-white hover:bg-slate-50 border border-[#E5EAF2] text-[#172033] text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3 text-blue-600" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() =>
                            setDeleteTarget({
                              type: 'product',
                              id: prod.id,
                              name: prod.name,
                            })
                          }
                          className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Categories */}
          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {storeCategories.map((cat) => {
                const count = storeProducts.filter((p) => p.categoryId === cat.id).length;
                return (
                  <div
                    key={cat.id}
                    className="p-4 rounded-xl bg-white border border-[#E5EAF2] flex flex-col justify-between space-y-3 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[#172033]">{cat.name}</span>
                        <span className="text-[11px] text-blue-600 font-mono font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                          {count} items
                        </span>
                      </div>
                      {cat.description && cat.description.trim() !== '' && (
                        <p className="text-[11px] text-[#64748B] mt-1 line-clamp-2">
                          {cat.description}
                        </p>
                      )}
                      <p className="text-[11px] text-[#64748B] font-mono mt-0.5">
                        /{cat.slug}
                      </p>
                      {cat.subcategories && cat.subcategories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {cat.subcategories.map((sub) => (
                            <span
                              key={sub.id}
                              className="px-1.5 py-0.5 rounded bg-[#F8FAFC] text-[10px] text-[#64748B] border border-[#E5EAF2] font-medium"
                            >
                              {sub.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5EAF2]">
                      <button
                        onClick={() => handleEditCategory(cat)}
                        className="px-2.5 py-1 rounded bg-white hover:bg-slate-50 border border-[#E5EAF2] text-[#172033] text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3 text-blue-600" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() =>
                          setDeleteTarget({
                            type: 'category',
                            id: cat.id,
                            name: cat.name,
                          })
                        }
                        disabled={storeCategories.length <= 1}
                        className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 border border-rose-200 disabled:opacity-40 text-rose-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: Add-ons & Modifiers */}
          {activeTab === 'addons' && (
            <div className="space-y-4">
              {modifierGroups.map((grp) => {
                const grpMods = modifiers.filter((m) => m.groupId === grp.id);
                return (
                  <div
                    key={grp.id}
                    className="p-4 rounded-xl bg-white border border-[#E5EAF2] space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between border-b border-[#E5EAF2] pb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-sm text-[#172033]">{grp.name}</span>
                        <span className="text-[11px] text-[#64748B]">
                          ({grpMods.length} extras)
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          setDeleteTarget({
                            type: 'modifierGroup',
                            id: grp.id,
                            name: grp.name,
                          })
                        }
                        className="text-rose-600 hover:text-rose-700 text-xs font-bold cursor-pointer"
                      >
                        Delete Group
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {grpMods.map((m) => (
                        <div
                          key={m.id}
                          className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E5EAF2] flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-[#172033] block truncate">
                              {m.name}
                            </span>
                            {m.description && m.description.trim() !== '' && (
                              <span className="text-[10px] text-[#64748B] block line-clamp-1">
                                {m.description}
                              </span>
                            )}
                            <span className="font-mono text-[11px] text-blue-600 font-bold">
                              +£{m.price.toFixed(2)}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              setDeleteTarget({
                                type: 'modifier',
                                id: m.id,
                                name: m.name,
                              })
                            }
                            className="p-1 rounded hover:bg-rose-100 text-[#64748B] hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Inner Item Editor Modal */}
        {isItemEditorOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <form
              onSubmit={handleSaveItem}
              className="w-full max-w-md bg-white border border-[#E5EAF2] rounded-xl p-5 space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-[#E5EAF2] pb-2">
                <h3 className="font-bold text-sm text-[#172033]">
                  {editingProduct ? 'Edit Menu Item' : 'Add New Menu Item'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsItemEditorOpen(false)}
                  className="text-[#64748B] hover:text-[#172033] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#172033] font-bold mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg text-[#172033] focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[#172033] font-bold mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Item ingredients, description, allergen notes..."
                    value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg text-[#172033] placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white resize-y"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[#172033] font-bold mb-1">Category</label>
                    <select
                      value={itemForm.categoryId}
                      onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                      className="w-full px-2 py-1.5 bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg text-[#172033] focus:outline-none focus:border-blue-600 focus:bg-white"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#172033] font-bold mb-1">Base Price (£) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={itemForm.basePrice || ''}
                      onChange={(e) => {
                        const newPrice = parseFloat(e.target.value) || 0;
                        setItemForm((prev) => ({
                          ...prev,
                          basePrice: newPrice,
                          variants:
                            prev.variants.length <= 1
                              ? prev.variants.map((v) => ({ ...v, price: newPrice }))
                              : prev.variants,
                        }));
                      }}
                      className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg text-[#172033] font-mono focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Variants Editor */}
                <div className="border-t border-[#E5EAF2] pt-2">
                  <span className="block text-[#172033] font-bold mb-1.5">
                    Sizes / Variants (e.g. Small, Medium, Large)
                  </span>
                  <div className="space-y-1.5">
                    {itemForm.variants.map((v, i) => (
                      <div key={v.id} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={v.name}
                          onChange={(e) => {
                            const copy = [...itemForm.variants];
                            copy[i].name = e.target.value;
                            setItemForm({ ...itemForm, variants: copy });
                          }}
                          className="flex-1 px-2 py-1 bg-[#F8FAFC] border border-[#E5EAF2] rounded text-xs text-[#172033] focus:outline-none focus:border-blue-600 focus:bg-white"
                          placeholder="Size Name"
                        />
                        <input
                          type="text"
                          value={v.description || ''}
                          onChange={(e) => {
                            const copy = [...itemForm.variants];
                            copy[i].description = e.target.value;
                            setItemForm({ ...itemForm, variants: copy });
                          }}
                          className="flex-1 px-2 py-1 bg-[#F8FAFC] border border-[#E5EAF2] rounded text-xs text-[#172033] focus:outline-none focus:border-blue-600 focus:bg-white"
                          placeholder="Variant Description"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={v.price}
                          onChange={(e) => {
                            const copy = [...itemForm.variants];
                            copy[i].price = parseFloat(e.target.value) || 0;
                            setItemForm({ ...itemForm, variants: copy });
                          }}
                          className="w-20 px-2 py-1 bg-[#F8FAFC] border border-[#E5EAF2] rounded text-xs text-[#172033] font-mono focus:outline-none focus:border-blue-600 focus:bg-white"
                          placeholder="£ Price"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E5EAF2]">
                <button
                  type="button"
                  onClick={() => setIsItemEditorOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#E5EAF2] text-[#64748B] hover:text-[#172033] text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-sm"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Inner Category Editor Modal */}
        {isCategoryEditorOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <form
              onSubmit={handleSaveCategory}
              className="w-full max-w-sm bg-white border border-[#E5EAF2] rounded-xl p-5 space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-[#E5EAF2] pb-2">
                <h3 className="font-bold text-sm text-[#172033]">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCategoryEditorOpen(false)}
                  className="text-[#64748B] hover:text-[#172033] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#172033] font-bold mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={catForm.name}
                    onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg text-[#172033] focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[#172033] font-bold mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Category overview, food type or special notes..."
                    value={catForm.description}
                    onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg text-[#172033] placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white resize-y"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E5EAF2]">
                <button
                  type="button"
                  onClick={() => setIsCategoryEditorOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#E5EAF2] text-[#64748B] hover:text-[#172033] text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-sm"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Inner Add-on Editor Modal */}
        {isAddonEditorOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <form
              onSubmit={handleSaveAddon}
              className="w-full max-w-sm bg-white border border-[#E5EAF2] rounded-xl p-5 space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-[#E5EAF2] pb-2">
                <h3 className="font-bold text-sm text-[#172033]">Add New Modifier / Add-on</h3>
                <button
                  type="button"
                  onClick={() => setIsAddonEditorOpen(false)}
                  className="text-[#64748B] hover:text-[#172033] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#172033] font-bold mb-1">Add-on Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Extra Mozzarella, Pepperoni..."
                    value={addonForm.name}
                    onChange={(e) => setAddonForm({ ...addonForm, name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg text-[#172033] focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[#172033] font-bold mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Modifier or add-on notes, ingredients..."
                    value={addonForm.description}
                    onChange={(e) => setAddonForm({ ...addonForm, description: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg text-[#172033] placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white resize-y"
                  />
                </div>

                <div>
                  <label className="block text-[#172033] font-bold mb-1">Target Group</label>
                  <select
                    value={addonForm.groupId}
                    onChange={(e) => setAddonForm({ ...addonForm, groupId: e.target.value })}
                    className="w-full px-2 py-1.5 bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg text-[#172033] focus:outline-none focus:border-blue-600 focus:bg-white"
                  >
                    {modifierGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#172033] font-bold mb-1">Price (+£)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={addonForm.price}
                    onChange={(e) => setAddonForm({ ...addonForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg text-[#172033] font-mono focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E5EAF2]">
                <button
                  type="button"
                  onClick={() => setIsAddonEditorOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#E5EAF2] text-[#64748B] hover:text-[#172033] text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-sm"
                >
                  Save Add-on
                </button>
              </div>
            </form>
          </div>
        )}
        {/* Inner Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white border border-[#E5EAF2] rounded-xl max-w-sm w-full p-5 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg border border-rose-200">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#172033]">
                    Confirm Delete {deleteTarget.type === 'category' ? 'Category' : deleteTarget.type === 'product' ? 'Menu Item' : deleteTarget.type === 'modifierGroup' ? 'Modifier Group' : 'Modifier'}
                  </h3>
                  <p className="text-[11px] text-[#64748B]">This action will immediately update your menu catalog</p>
                </div>
              </div>

              <p className="text-xs text-[#172033] bg-[#F8FAFC] p-3 rounded-lg border border-[#E5EAF2]">
                Are you sure you want to delete <strong className="text-rose-600">{deleteTarget.name}</strong>?
              </p>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-white border border-[#E5EAF2] hover:bg-slate-50 text-[#172033] text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (deleteTarget.type === 'product') {
                      deleteProduct(deleteTarget.id);
                    } else if (deleteTarget.type === 'category') {
                      deleteCategory(deleteTarget.id);
                    } else if (deleteTarget.type === 'modifierGroup') {
                      deleteModifierGroup(deleteTarget.id);
                    } else if (deleteTarget.type === 'modifier') {
                      deleteModifier(deleteTarget.id);
                    }
                    setDeleteTarget(null);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Yes, Delete</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

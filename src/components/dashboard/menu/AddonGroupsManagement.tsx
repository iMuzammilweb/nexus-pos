import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  Sliders,
  UtensilsCrossed,
  Link,
  Tag,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  Filter,
} from 'lucide-react';
import { useNexus } from '../../../context/NexusContext';
import { AddonGroup, AddonItem, Product } from '../../../types';

export const AddonGroupsManagement: React.FC = () => {
  const {
    addonGroups = [],
    addAddonGroup,
    updateAddonGroup,
    deleteAddonGroup,
    toggleAddonGroupActive,
    addAddonToGroup,
    updateAddonInGroup,
    deleteAddonFromGroup,
    toggleAddonItemActive,
    linkAddonGroupToProducts,
    products = [],
    categories = [],
    currentStore,
  } = useNexus();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [expandedGroupIds, setExpandedGroupIds] = useState<Record<string, boolean>>({});

  // Group Create / Edit Modal State
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AddonGroup | null>(null);
  const [groupFormData, setGroupFormData] = useState<{
    name: string;
    description: string;
    minSelections: number;
    maxSelections: number;
    allowMultiple: boolean;
    isAvailable: boolean;
    linkedProductIds: string[];
  }>({
    name: '',
    description: '',
    minSelections: 0,
    maxSelections: 10,
    allowMultiple: true,
    isAvailable: true,
    linkedProductIds: [],
  });

  // Link Menu Items Modal State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [targetGroupForLinking, setTargetGroupForLinking] = useState<AddonGroup | null>(null);
  const [tempLinkedProductIds, setTempLinkedProductIds] = useState<string[]>([]);
  const [linkSearchQuery, setLinkSearchQuery] = useState('');
  const [linkCategoryFilter, setLinkCategoryFilter] = useState<string>('all');

  // Add / Edit Addon Item Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [targetGroupIdForItem, setTargetGroupIdForItem] = useState<string>('');
  const [editingItem, setEditingItem] = useState<AddonItem | null>(null);
  const [itemFormData, setItemFormData] = useState<{
    name: string;
    description: string;
    price: number;
    isAvailable: boolean;
  }>({
    name: '',
    description: '',
    price: 0,
    isAvailable: true,
  });

  // Inline quick-add state per group (map of groupId -> { name, price })
  const [quickAddState, setQuickAddState] = useState<Record<string, { name: string; price: string }>>({});

  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'group' | 'item';
    groupId: string;
    itemId?: string;
    title: string;
    subtitle?: string;
  } | null>(null);

  // Filtered Add-on Groups
  const filteredGroups = useMemo(() => {
    return (addonGroups || []).filter((grp) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        grp.name.toLowerCase().includes(q) ||
        (grp.description && grp.description.toLowerCase().includes(q)) ||
        (grp.items && grp.items.some((i) => i.name.toLowerCase().includes(q)));

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && grp.isAvailable !== false) ||
        (statusFilter === 'inactive' && grp.isAvailable === false);

      return matchesSearch && matchesStatus;
    });
  }, [addonGroups, searchQuery, statusFilter]);

  // Calculate statistics
  const totalOptionsCount = useMemo(() => {
    return (addonGroups || []).reduce((sum, g) => sum + (g.items?.length || 0), 0);
  }, [addonGroups]);

  const activeGroupsCount = useMemo(() => {
    return (addonGroups || []).filter((g) => g.isAvailable !== false).length;
  }, [addonGroups]);

  // Toggle group accordion expanded
  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroupIds((prev) => ({
      ...prev,
      [groupId]: prev[groupId] === undefined ? false : !prev[groupId],
    }));
  };

  // Group Create / Edit Handlers
  const handleOpenCreateGroup = () => {
    setEditingGroup(null);
    setGroupFormData({
      name: '',
      description: '',
      minSelections: 0,
      maxSelections: 10,
      allowMultiple: true,
      isAvailable: true,
      linkedProductIds: [],
    });
    setIsGroupModalOpen(true);
  };

  const handleOpenEditGroup = (group: AddonGroup) => {
    setEditingGroup(group);
    setGroupFormData({
      name: group.name,
      description: group.description || '',
      minSelections: group.minSelections ?? 0,
      maxSelections: group.maxSelections ?? 10,
      allowMultiple: group.allowMultiple !== false,
      isAvailable: group.isAvailable !== false,
      linkedProductIds: group.linkedProductIds || [],
    });
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupFormData.name.trim()) return;

    if (editingGroup) {
      await updateAddonGroup(editingGroup.id, {
        name: groupFormData.name.trim(),
        description: groupFormData.description.trim(),
        minSelections: Number(groupFormData.minSelections) || 0,
        maxSelections: Number(groupFormData.maxSelections) || 10,
        allowMultiple: groupFormData.allowMultiple,
        isAvailable: groupFormData.isAvailable,
        linkedProductIds: groupFormData.linkedProductIds,
      });
    } else {
      await addAddonGroup({
        name: groupFormData.name.trim(),
        description: groupFormData.description.trim(),
        minSelections: Number(groupFormData.minSelections) || 0,
        maxSelections: Number(groupFormData.maxSelections) || 10,
        allowMultiple: groupFormData.allowMultiple,
        isAvailable: groupFormData.isAvailable,
        items: [],
        linkedProductIds: groupFormData.linkedProductIds,
      });
    }

    setIsGroupModalOpen(false);
  };

  // Link Menu Items Handlers
  const handleOpenLinkModal = (group: AddonGroup) => {
    setTargetGroupForLinking(group);
    // Gather all products currently linked to this group (check both group.linkedProductIds and product.addonGroupIds)
    const productIdsFromGroup = group.linkedProductIds || [];
    const productIdsFromProducts = products.filter((p) => p.addonGroupIds?.includes(group.id)).map((p) => p.id);
    const combined = Array.from(new Set([...productIdsFromGroup, ...productIdsFromProducts]));
    setTempLinkedProductIds(combined);
    setLinkSearchQuery('');
    setLinkCategoryFilter('all');
    setIsLinkModalOpen(true);
  };

  const handleToggleProductLink = (productId: string) => {
    setTempLinkedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleSelectAllCategoryProducts = (catId: string) => {
    const catProds = products.filter((p) => p.categoryId === catId).map((p) => p.id);
    const allCatSelected = catProds.every((id) => tempLinkedProductIds.includes(id));
    if (allCatSelected) {
      setTempLinkedProductIds((prev) => prev.filter((id) => !catProds.includes(id)));
    } else {
      setTempLinkedProductIds((prev) => Array.from(new Set([...prev, ...catProds])));
    }
  };

  const handleSaveLinkedProducts = async () => {
    if (!targetGroupForLinking) return;
    await linkAddonGroupToProducts(targetGroupForLinking.id, tempLinkedProductIds);
    setIsLinkModalOpen(false);
  };

  // Item Create / Edit Handlers
  const handleOpenCreateItem = (groupId: string) => {
    setTargetGroupIdForItem(groupId);
    setEditingItem(null);
    setItemFormData({
      name: '',
      description: '',
      price: 1.0,
      isAvailable: true,
    });
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (groupId: string, item: AddonItem) => {
    setTargetGroupIdForItem(groupId);
    setEditingItem(item);
    setItemFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      isAvailable: item.isAvailable !== false,
    });
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemFormData.name.trim() || !targetGroupIdForItem) return;

    if (editingItem) {
      await updateAddonInGroup(targetGroupIdForItem, editingItem.id, {
        name: itemFormData.name.trim(),
        description: itemFormData.description.trim() || undefined,
        price: Math.max(0, Number(itemFormData.price) || 0),
        isAvailable: itemFormData.isAvailable,
      });
    } else {
      await addAddonToGroup(targetGroupIdForItem, {
        name: itemFormData.name.trim(),
        description: itemFormData.description.trim() || undefined,
        price: Math.max(0, Number(itemFormData.price) || 0),
        isAvailable: itemFormData.isAvailable,
      });
    }

    setIsItemModalOpen(false);
  };

  // Quick inline add handler
  const handleQuickAdd = async (groupId: string) => {
    const quick = quickAddState[groupId];
    if (!quick || !quick.name.trim()) return;

    const priceNum = Math.max(0, parseFloat(quick.price) || 0);
    await addAddonToGroup(groupId, {
      name: quick.name.trim(),
      price: priceNum,
      isAvailable: true,
    });

    setQuickAddState((prev) => ({
      ...prev,
      [groupId]: { name: '', price: '' },
    }));
  };

  // Delete Action Executor
  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'group') {
      await deleteAddonGroup(deleteConfirm.groupId);
    } else if (deleteConfirm.type === 'item' && deleteConfirm.itemId) {
      await deleteAddonFromGroup(deleteConfirm.groupId, deleteConfirm.itemId);
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6" id="addon-groups-management-root">
      {/* Top Banner & Stat Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5EAF2] shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black border border-blue-200">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#172033] flex items-center gap-2">
                Add-on Groups & Item Modifiers
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {addonGroups.length} Groups Active
                </span>
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Create custom modifier groups (e.g. Pizza Add-ons, Burger Add-ons, Kebab Add-ons), add unlimited modifiers with individual prices, and link them to menu items.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-create-addon-group"
            onClick={handleOpenCreateGroup}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Add-on Group</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#E5EAF2] flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
              Total Add-on Groups
            </span>
            <span className="text-2xl font-black text-[#172033] mt-1 block">
              {addonGroups.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E5EAF2] flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
              Total Modifier Options
            </span>
            <span className="text-2xl font-black text-[#172033] mt-1 block">
              {totalOptionsCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold">
            <Tag className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E5EAF2] flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
              Linked Menu Items
            </span>
            <span className="text-2xl font-black text-[#172033] mt-1 block">
              {products.filter((p) => (p.addonGroupIds?.length || 0) > 0).length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 font-bold">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E5EAF2] shadow-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search add-on groups or modifier options..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#E5EAF2] text-[#172033] text-xs focus:outline-none focus:border-blue-600 focus:bg-white placeholder:text-[#64748B]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#E5EAF2] text-[#172033] text-xs font-bold focus:outline-none focus:border-blue-600 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#64748B]">
          <span>Showing <b>{filteredGroups.length}</b> of <b>{addonGroups.length}</b> Groups</span>
        </div>
      </div>

      {/* Add-on Groups List */}
      {filteredGroups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5EAF2] p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#172033]">No Add-on Groups Found</h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto mt-1 mb-4">
            {searchQuery
              ? 'No groups or modifiers match your current search keywords.'
              : 'Get started by creating your first custom Add-on Group (e.g. Pizza Add-ons, Burger Add-ons, Kebab Add-ons).'}
          </p>
          <button
            onClick={handleOpenCreateGroup}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Add-on Group
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map((group) => {
            const isExpanded = expandedGroupIds[group.id] ?? true;
            const items = group.items || [];
            
            // Find which products are linked to this group
            const linkedProducts = products.filter(
              (p) => group.linkedProductIds?.includes(p.id) || p.addonGroupIds?.includes(group.id)
            );

            const quick = quickAddState[group.id] || { name: '', price: '' };

            return (
              <div
                key={group.id}
                className={`bg-white rounded-2xl border transition-all shadow-xs overflow-hidden ${
                  group.isAvailable === false
                    ? 'border-slate-200 bg-slate-50/50 opacity-90'
                    : 'border-[#E5EAF2]'
                }`}
              >
                {/* Group Header Card */}
                <div className="p-4 sm:p-5 border-b border-[#E5EAF2] bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <button
                      onClick={() => toggleGroupExpand(group.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-[#64748B] hover:text-[#172033] transition-colors mt-0.5 cursor-pointer"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-blue-600" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#64748B]" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-sm font-black text-[#172033]">{group.name}</h3>
                        <button
                          onClick={() => toggleAddonGroupActive(group.id)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                            group.isAvailable !== false
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                          title="Click to toggle group active/inactive status"
                        >
                          {group.isAvailable !== false ? 'Active' : 'Deactivated'}
                        </button>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                          {items.length} modifier option{items.length === 1 ? '' : 's'}
                        </span>
                      </div>

                      {group.description && (
                        <p className="text-xs text-[#64748B] mt-1">{group.description}</p>
                      )}

                      {/* Selection rules & linked summary */}
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-[#64748B] flex-wrap">
                        <span>
                          Rules:{' '}
                          <b className="text-[#172033]">
                            Min {group.minSelections ?? 0}, Max {group.maxSelections ?? 10}
                          </b>
                        </span>
                        <span>•</span>
                        <span>
                          Multi-select:{' '}
                          <b className="text-[#172033]">
                            {group.allowMultiple !== false ? 'Allowed' : 'Single Only'}
                          </b>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Link className="w-3 h-3 text-blue-600" />
                          <span>
                            Linked to{' '}
                            <b className="text-blue-700">
                              {linkedProducts.length} menu item{linkedProducts.length === 1 ? '' : 's'}
                            </b>
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Header Toolbar */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <button
                      onClick={() => handleOpenLinkModal(group)}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Link or unlink menu items to this add-on group"
                    >
                      <Link className="w-3.5 h-3.5" />
                      <span>Link Menu Items ({linkedProducts.length})</span>
                    </button>

                    <button
                      onClick={() => handleOpenCreateItem(group.id)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-[#172033] font-bold text-xs border border-[#E5EAF2] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      title="Add a new modifier/add-on item to this group"
                    >
                      <Plus className="w-3.5 h-3.5 text-blue-600" />
                      <span>Add Modifier</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditGroup(group)}
                      className="p-2 rounded-lg bg-white hover:bg-slate-50 text-[#64748B] hover:text-[#172033] border border-[#E5EAF2] transition-colors cursor-pointer shadow-xs"
                      title="Edit Group Settings"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                    </button>

                    <button
                      onClick={() =>
                        setDeleteConfirm({
                          type: 'group',
                          groupId: group.id,
                          title: `Delete Add-on Group "${group.name}"?`,
                          subtitle: `This group has ${items.length} modifier options and is linked to ${linkedProducts.length} menu items.`,
                        })
                      }
                      className="p-2 rounded-lg bg-white hover:bg-rose-50 text-[#64748B] hover:text-rose-600 border border-[#E5EAF2] hover:border-rose-200 transition-colors cursor-pointer shadow-xs"
                      title="Delete Add-on Group"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Group Body: Linked Items Chips + Modifiers Table */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 space-y-4 bg-[#F8FAFC]">
                    {/* Linked Products Preview Badges */}
                    {linkedProducts.length > 0 ? (
                      <div className="p-3 bg-white rounded-xl border border-[#E5EAF2] text-xs">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-[11px] uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                            <UtensilsCrossed className="w-3.5 h-3.5 text-blue-600" />
                            Active on {linkedProducts.length} Menu Item{linkedProducts.length === 1 ? '' : 's'}
                          </span>
                          <button
                            onClick={() => handleOpenLinkModal(group)}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          >
                            Manage Linked Items
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {linkedProducts.map((prod) => (
                            <span
                              key={prod.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-[#E5EAF2] text-xs font-bold text-[#172033]"
                            >
                              <span>{prod.name}</span>
                              <span className="text-[10px] text-[#64748B] font-normal">
                                (£{prod.basePrice.toFixed(2)})
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs flex items-center justify-between text-amber-900">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <span>
                            This group is not linked to any menu items yet. It will not appear on POS until linked.
                          </span>
                        </div>
                        <button
                          onClick={() => handleOpenLinkModal(group)}
                          className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 cursor-pointer"
                        >
                          Link Now
                        </button>
                      </div>
                    )}

                    {/* Modifiers List */}
                    <div className="rounded-xl border border-[#E5EAF2] bg-white overflow-hidden shadow-xs">
                      <div className="p-3 bg-slate-50 border-b border-[#E5EAF2] flex items-center justify-between text-xs">
                        <span className="font-bold text-[#172033]">
                          Modifier Options & Prices ({items.length})
                        </span>
                        <span className="text-[11px] text-[#64748B]">
                          Unlimited add-ons allowed
                        </span>
                      </div>

                      {items.length === 0 ? (
                        <div className="p-8 text-center text-[#64748B] text-xs">
                          No add-on modifiers added to this group yet. Add your first modifier below.
                        </div>
                      ) : (
                        <div className="divide-y divide-[#E5EAF2]">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className={`p-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-blue-50/30 transition-colors ${
                                item.isAvailable === false ? 'opacity-60 bg-slate-50' : ''
                              }`}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <button
                                  onClick={() => toggleAddonItemActive(group.id, item.id)}
                                  className={`p-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                                    item.isAvailable !== false
                                      ? 'text-emerald-600 hover:bg-emerald-50'
                                      : 'text-slate-400 hover:bg-slate-100'
                                  }`}
                                  title={item.isAvailable !== false ? 'Active (Click to disable)' : 'Disabled (Click to enable)'}
                                >
                                  {item.isAvailable !== false ? (
                                    <ToggleRight className="w-5 h-5" />
                                  ) : (
                                    <ToggleLeft className="w-5 h-5" />
                                  )}
                                </button>

                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs text-[#172033]">
                                      {item.name}
                                    </span>
                                    {item.isAvailable === false && (
                                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                                        Sold Out
                                      </span>
                                    )}
                                  </div>
                                  {item.description && item.description.trim() !== '' && (
                                    <span className="text-[11px] text-[#64748B] mt-0.5 line-clamp-1">
                                      {item.description}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <span className="font-black text-xs font-mono text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                                  {item.price === 0 ? 'FREE' : `+£${item.price.toFixed(2)}`}
                                </span>

                                <button
                                  onClick={() => handleOpenEditItem(group.id, item)}
                                  className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-slate-100 cursor-pointer"
                                  title="Edit modifier"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                                </button>

                                <button
                                  onClick={() =>
                                    setDeleteConfirm({
                                      type: 'item',
                                      groupId: group.id,
                                      itemId: item.id,
                                      title: `Delete Modifier "${item.name}"?`,
                                      subtitle: `Price: +£${item.price.toFixed(2)}`,
                                    })
                                  }
                                  className="p-1.5 rounded-lg text-[#64748B] hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                  title="Delete modifier"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Quick Inline Add Form */}
                      <div className="p-3 bg-[#F8FAFC] border-t border-[#E5EAF2] flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs">
                        <input
                          type="text"
                          placeholder="Quick add modifier name (e.g. Extra Cheese)..."
                          value={quick.name}
                          onChange={(e) =>
                            setQuickAddState((prev) => ({
                              ...prev,
                              [group.id]: { ...quick, name: e.target.value },
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleQuickAdd(group.id);
                            }
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] focus:outline-none focus:border-blue-600 placeholder:text-[#64748B]"
                        />

                        <div className="flex items-center gap-2">
                          <div className="relative w-28">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748B] font-bold">
                              £
                            </span>
                            <input
                              type="number"
                              step="0.10"
                              min="0"
                              placeholder="0.00"
                              value={quick.price}
                              onChange={(e) =>
                                setQuickAddState((prev) => ({
                                  ...prev,
                                  [group.id]: { ...quick, price: e.target.value },
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleQuickAdd(group.id);
                                }
                              }}
                              className="w-full pl-6 pr-2 py-1.5 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] font-bold font-mono focus:outline-none focus:border-blue-600"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleQuickAdd(group.id)}
                            disabled={!quick.name.trim()}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 1. CREATE / EDIT ADD-ON GROUP MODAL */}
      {/* ===================================================================== */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white border border-[#E5EAF2] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-white border-b border-[#E5EAF2] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-200">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#172033]">
                  {editingGroup ? 'Edit Add-on Group' : 'Create Custom Add-on Group'}
                </h3>
              </div>
              <button
                onClick={() => setIsGroupModalOpen(false)}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGroup} className="p-6 overflow-y-auto flex-1 space-y-4 bg-[#F8FAFC]">
              <div>
                <label className="block text-xs font-bold text-[#172033] uppercase mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pizza Add-ons, Burger Add-ons, Kebab Add-ons"
                  value={groupFormData.name}
                  onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] text-xs focus:outline-none focus:border-blue-600 shadow-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] uppercase mb-1">
                  Description / Customer Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Extra crusts, cheeses, gourmet toppings, sauces"
                  value={groupFormData.description}
                  onChange={(e) => setGroupFormData({ ...groupFormData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] text-xs focus:outline-none focus:border-blue-600 shadow-xs resize-y"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-[#E5EAF2]">
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Min Selections
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={groupFormData.minSelections}
                    onChange={(e) =>
                      setGroupFormData({ ...groupFormData, minSelections: Math.max(0, parseInt(e.target.value) || 0) })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E5EAF2] text-[#172033] text-xs font-bold font-mono focus:outline-none focus:border-blue-600"
                  />
                  <span className="text-[10px] text-[#64748B] mt-0.5 block">0 = Optional choice</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Max Selections
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={groupFormData.maxSelections}
                    onChange={(e) =>
                      setGroupFormData({ ...groupFormData, maxSelections: Math.max(1, parseInt(e.target.value) || 1) })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E5EAF2] text-[#172033] text-xs font-bold font-mono focus:outline-none focus:border-blue-600"
                  />
                  <span className="text-[10px] text-[#64748B] mt-0.5 block">Maximum choices allowed</span>
                </div>
              </div>

              <div className="space-y-2 bg-white p-3.5 rounded-xl border border-[#E5EAF2]">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-[#172033] block">Allow Multiple Selections</span>
                    <span className="text-[11px] text-[#64748B]">Let customers pick more than 1 modifier in this group</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={groupFormData.allowMultiple}
                    onChange={(e) => setGroupFormData({ ...groupFormData, allowMultiple: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 border-[#E5EAF2]"
                  />
                </label>

                <div className="border-t border-[#E5EAF2] pt-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-[#172033] block">Group Active Status</span>
                      <span className="text-[11px] text-[#64748B]">Enable to show this add-on group in POS registers</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={groupFormData.isAvailable}
                      onChange={(e) => setGroupFormData({ ...groupFormData, isAvailable: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 border-[#E5EAF2]"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E5EAF2]">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  {editingGroup ? 'Save Group Changes' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. LINK / UNLINK MENU ITEMS MODAL */}
      {/* ===================================================================== */}
      {isLinkModalOpen && targetGroupForLinking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-white border border-[#E5EAF2] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-white border-b border-[#E5EAF2] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-200">
                  <Link className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#172033]">
                    Link Add-ons: {targetGroupForLinking.name}
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    Select which menu items should display this Add-on Group in the POS register
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLinkModalOpen(false)}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter bar */}
            <div className="p-4 bg-[#F8FAFC] border-b border-[#E5EAF2] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search menu items by name or SKU code..."
                    value={linkSearchQuery}
                    onChange={(e) => setLinkSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>

                <select
                  value={linkCategoryFilter}
                  onChange={(e) => setLinkCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] text-xs font-bold focus:outline-none focus:border-blue-600"
                >
                  <option value="all">All Categories ({categories.length})</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const allFiltered = products
                      .filter((p) => {
                        const matchCat = linkCategoryFilter === 'all' || p.categoryId === linkCategoryFilter;
                        const matchQ =
                          !linkSearchQuery.trim() ||
                          p.name.toLowerCase().includes(linkSearchQuery.toLowerCase()) ||
                          p.code.toLowerCase().includes(linkSearchQuery.toLowerCase());
                        return matchCat && matchQ;
                      })
                      .map((p) => p.id);
                    setTempLinkedProductIds(Array.from(new Set([...tempLinkedProductIds, ...allFiltered])));
                  }}
                  className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold border border-blue-200 cursor-pointer"
                >
                  Select Visible
                </button>
                <button
                  type="button"
                  onClick={() => setTempLinkedProductIds([])}
                  className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-[#64748B] text-xs font-bold border border-[#E5EAF2] cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Menu Items by Category Accordion List */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-white">
              {categories
                .filter((cat) => linkCategoryFilter === 'all' || cat.id === linkCategoryFilter)
                .map((cat) => {
                  const catProds = products.filter((p) => {
                    if (p.categoryId !== cat.id) return false;
                    if (!linkSearchQuery.trim()) return true;
                    return (
                      p.name.toLowerCase().includes(linkSearchQuery.toLowerCase()) ||
                      p.code.toLowerCase().includes(linkSearchQuery.toLowerCase())
                    );
                  });

                  if (catProds.length === 0) return null;

                  const allCatSelected = catProds.every((p) => tempLinkedProductIds.includes(p.id));
                  const someCatSelected = catProds.some((p) => tempLinkedProductIds.includes(p.id));

                  return (
                    <div key={cat.id} className="border border-[#E5EAF2] rounded-xl overflow-hidden shadow-xs">
                      <div className="p-3 bg-[#F8FAFC] border-b border-[#E5EAF2] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleSelectAllCategoryProducts(cat.id)}
                            className="text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            {allCatSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : someCatSelected ? (
                              <div className="w-4 h-4 border-2 border-blue-600 bg-blue-100 rounded flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-xs" />
                              </div>
                            ) : (
                              <Square className="w-4 h-4 text-[#64748B]" />
                            )}
                          </button>
                          <span className="font-bold text-xs text-[#172033]">{cat.name}</span>
                          <span className="text-[10px] text-[#64748B] font-mono">
                            ({catProds.length} items)
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectAllCategoryProducts(cat.id)}
                          className="text-[11px] text-blue-600 font-bold hover:underline cursor-pointer"
                        >
                          {allCatSelected ? 'Deselect Category' : 'Select All in Category'}
                        </button>
                      </div>

                      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 bg-white">
                        {catProds.map((prod) => {
                          const isChecked = tempLinkedProductIds.includes(prod.id);
                          return (
                            <label
                              key={prod.id}
                              onClick={() => handleToggleProductLink(prod.id)}
                              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200'
                                  : 'bg-white border-[#E5EAF2] hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                                    isChecked
                                      ? 'bg-blue-600 border-blue-600 text-white'
                                      : 'border-[#64748B] bg-white'
                                  }`}
                                >
                                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <div className="truncate">
                                  <span className="font-bold text-xs text-[#172033] block truncate">
                                    {prod.name}
                                  </span>
                                  <span className="text-[10px] text-[#64748B] font-mono">
                                    £{prod.basePrice.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-[#E5EAF2] flex items-center justify-between">
              <span className="text-xs font-bold text-[#172033]">
                <b>{tempLinkedProductIds.length}</b> total menu items linked to this group
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveLinkedProducts}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Save Linked Items
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. ADD / EDIT ADD-ON MODIFIER ITEM MODAL */}
      {/* ===================================================================== */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-[#E5EAF2] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-white border-b border-[#E5EAF2] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-200">
                  <Tag className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#172033]">
                  {editingItem ? 'Edit Modifier Option' : 'Add Modifier / Add-on Option'}
                </h3>
              </div>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4 bg-[#F8FAFC]">
              <div>
                <label className="block text-xs font-bold text-[#172033] uppercase mb-1">
                  Modifier / Add-on Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Extra Mozzarella, Jalapenos, Garlic Sauce"
                  value={itemFormData.name}
                  onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] text-xs focus:outline-none focus:border-blue-600 shadow-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Details, ingredients, culinary notes..."
                  value={itemFormData.description}
                  onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] text-xs focus:outline-none focus:border-blue-600 shadow-xs resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] uppercase mb-1">
                  Individual Price (£)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] font-bold">
                    £
                  </span>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    required
                    value={itemFormData.price}
                    onChange={(e) =>
                      setItemFormData({ ...itemFormData, price: Math.max(0, parseFloat(e.target.value) || 0) })
                    }
                    className="w-full pl-7 pr-3 py-2 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] text-xs font-bold font-mono focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>
                <span className="text-[10px] text-[#64748B] mt-1 block">
                  Set to 0.00 for free modification / options.
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#E5EAF2]">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-[#172033] block">Item In-Stock / Active</span>
                    <span className="text-[11px] text-[#64748B]">Uncheck if temporarily sold out</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={itemFormData.isAvailable}
                    onChange={(e) => setItemFormData({ ...itemFormData, isAvailable: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 border-[#E5EAF2]"
                  />
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E5EAF2]">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  {editingItem ? 'Save Option' : 'Add Option to Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. DELETE CONFIRMATION DIALOG */}
      {/* ===================================================================== */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white border border-[#E5EAF2] rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="text-center">
              <h4 className="text-sm font-bold text-[#172033]">{deleteConfirm.title}</h4>
              {deleteConfirm.subtitle && (
                <p className="text-xs text-[#64748B] mt-1">{deleteConfirm.subtitle}</p>
              )}
              <p className="text-[11px] text-rose-600 font-bold mt-2">
                This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

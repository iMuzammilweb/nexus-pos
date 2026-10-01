import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Check,
  Plus,
  Minus,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  ShoppingBag,
  Info,
} from 'lucide-react';
import { useNexus } from '../../context/NexusContext';
import { SelectedModifier, Modifier, ModifierGroup } from '../../types';

export const ModifierSelectionModal: React.FC = () => {
  const {
    selectedProductForCustomization,
    selectedVariantForCustomization,
    isModifierModalOpen,
    setIsModifierModalOpen,
    setIsVariantModalOpen,
    modifierGroups,
    modifiers,
    addToCart,
    setSelectedProductForCustomization,
  } = useNexus();

  const [selectedModifiersState, setSelectedModifiersState] = useState<SelectedModifier[]>(() => {
    // Auto-select default options for required single-choice groups like tomato sauce
    return [
      {
        modifierId: 'mod-tomato-base',
        modifierGroupId: 'grp-sauce-base',
        name: 'Classic Tomato Puree Base',
        price: 0.0,
        quantity: 1,
      },
      {
        modifierId: 'mod-dip-garlic',
        modifierGroupId: 'grp-free-dip',
        name: 'Garlic & Herb Dip (100ml)',
        price: 0.0,
        quantity: 1,
      },
    ];
  });

  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemNotes, setItemNotes] = useState<string>('');
  const [activeGroupId, setActiveGroupId] = useState<string>('grp-sauce-base');

  // Reset notes and quantity when modal opens for a new product
  useEffect(() => {
    if (isModifierModalOpen) {
      setItemNotes('');
      setItemQuantity(1);
    }
  }, [isModifierModalOpen, selectedProductForCustomization?.id]);

  // Get active groups for this product (memoized, always called in same order)
  const relevantGroups = useMemo<ModifierGroup[]>(() => {
    if (!selectedProductForCustomization?.modifierGroupIds) return [];
    return selectedProductForCustomization.modifierGroupIds
      .map((gid) => modifierGroups.find((g) => g.id === gid))
      .filter((g): g is ModifierGroup => Boolean(g));
  }, [selectedProductForCustomization, modifierGroups]);

  // Check validation rules across all required groups (memoized, always called in same order)
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    relevantGroups.forEach((group) => {
      const selections = selectedModifiersState.filter((s) => s.modifierGroupId === group.id);
      const totalCount = selections.reduce((sum, s) => sum + s.quantity, 0);

      if (group.isRequired && totalCount < group.minSelections) {
        errors.push(`Please select at least ${group.minSelections} option in "${group.name}".`);
      }
      if (group.maxSelections && totalCount > group.maxSelections) {
        errors.push(`Maximum ${group.maxSelections} options exceeded in "${group.name}".`);
      }
    });
    return errors;
  }, [relevantGroups, selectedModifiersState]);

  // Conditional early return ONLY after all hooks are evaluated
  if (!isModifierModalOpen || !selectedProductForCustomization || !selectedVariantForCustomization) {
    return null;
  }

  // If no activeGroupId set or not in relevant, default to first
  const currentGroup = relevantGroups.find((g) => g.id === activeGroupId) || relevantGroups[0];

  // Modifiers inside current group
  const groupModifiers: Modifier[] = currentGroup
    ? (currentGroup.modifierIds || [])
        .map((mid) => modifiers.find((m) => m.id === mid))
        .filter((m): m is Modifier => Boolean(m))
    : [];

  // Toggle or adjust modifier selection
  const handleToggleModifier = (mod: Modifier, group: ModifierGroup) => {
    const existing = selectedModifiersState.find(
      (s) => s.modifierId === mod.id && s.modifierGroupId === group.id
    );

    if (!group.allowMultiple) {
      // Single choice group: replace existing in this group
      const others = selectedModifiersState.filter((s) => s.modifierGroupId !== group.id);
      setSelectedModifiersState([
        ...others,
        {
          modifierId: mod.id,
          modifierGroupId: group.id,
          name: mod.name,
          price: mod.price,
          quantity: 1,
        },
      ]);
    } else {
      // Multiple choice group
      if (existing) {
        // Deselect
        setSelectedModifiersState((prev) =>
          prev.filter((s) => !(s.modifierId === mod.id && s.modifierGroupId === group.id))
        );
      } else {
        // Check max selections
        const currentGroupSelectionsCount = selectedModifiersState
          .filter((s) => s.modifierGroupId === group.id)
          .reduce((sum, s) => sum + s.quantity, 0);

        if (currentGroupSelectionsCount >= group.maxSelections) {
          alert(`Maximum ${group.maxSelections} choices allowed in ${group.name}.`);
          return;
        }

        setSelectedModifiersState((prev) => [
          ...prev,
          {
            modifierId: mod.id,
            modifierGroupId: group.id,
            name: mod.name,
            price: mod.price,
            quantity: 1,
          },
        ]);
      }
    }
  };

  const isValid = validationErrors.length === 0;

  // Real-time totals
  const modifiersTotal = selectedModifiersState.reduce(
    (sum, m) => sum + m.price * m.quantity,
    0
  );
  const singleUnitTotal = selectedVariantForCustomization.price + modifiersTotal;
  const lineItemTotal = singleUnitTotal * itemQuantity;

  const handleAddToCart = () => {
    if (!isValid) return;

    addToCart(
      selectedProductForCustomization,
      selectedVariantForCustomization,
      selectedModifiersState,
      itemQuantity,
      itemNotes.trim() || undefined
    );

    setItemNotes('');
    setIsModifierModalOpen(false);
    setSelectedProductForCustomization(null);
  };

  const handleBackToVariants = () => {
    setIsModifierModalOpen(false);
    if (selectedProductForCustomization.variants.length > 1) {
      setIsVariantModalOpen(true);
    }
  };

  const handleClose = () => {
    setItemNotes('');
    setIsModifierModalOpen(false);
    setSelectedProductForCustomization(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white border border-[#E5EAF2] rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Dynamic Header & Breadcrumbs (Section 22) */}
        <div className="px-6 py-4 bg-white border-b border-[#E5EAF2] flex items-center justify-between">
          <div className="flex flex-col">
            <div className="text-[11px] font-bold text-blue-600 flex items-center gap-1.5 flex-wrap uppercase tracking-wider font-mono">
              <span>{selectedProductForCustomization.code} {selectedProductForCustomization.name}</span>
              <span className="text-[#64748B]">→</span>
              <span className="text-[#64748B]">{selectedVariantForCustomization.name}</span>
              <span className="text-[#64748B]">→</span>
              <span className="text-blue-600 font-bold">Add-ons & Modifiers</span>
            </div>
            <h3 className="text-lg font-bold text-[#172033] mt-1 flex items-center gap-2">
              <span>Custom Recipe & Extras</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-semibold font-mono">
                Base: £{(selectedVariantForCustomization?.price ?? 0).toFixed(2)}
              </span>
            </h3>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Group Selection Tabs */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-[#F8FAFC] border-b border-[#E5EAF2] overflow-x-auto">
          {relevantGroups.map((group) => {
            const groupSelections = selectedModifiersState.filter(
              (s) => s.modifierGroupId === group.id
            );
            const count = groupSelections.reduce((sum, s) => sum + s.quantity, 0);
            const isGroupActive = group.id === (currentGroup?.id || relevantGroups[0]?.id);
            const isComplete = !group.isRequired || count >= group.minSelections;

            return (
              <button
                key={group.id}
                onClick={() => setActiveGroupId(group.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border cursor-pointer shadow-xs ${
                  isGroupActive
                    ? 'bg-blue-600 text-white border-blue-600'
                    : isComplete
                    ? 'bg-white text-[#172033] border-[#E5EAF2] hover:bg-slate-50'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                <span>{group.name}</span>
                {count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isGroupActive ? 'bg-white text-blue-600' : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    {count}
                  </span>
                )}
                {group.isRequired && !isComplete && (
                  <span className="text-[10px] text-amber-600 font-bold">*Required</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Main Body: Group Modifiers Grid & Selection Summary */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 bg-[#F8FAFC]">
          {/* Modifiers Grid (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            {currentGroup && (
              <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-[#E5EAF2] shadow-xs">
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-[#172033]">{currentGroup.name}</span>
                  {currentGroup.description && currentGroup.description.trim() !== '' && (
                    <span className="text-xs text-[#64748B]">{currentGroup.description}</span>
                  )}
                </div>
                <div className="text-right">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      currentGroup.isRequired
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-[#64748B]'
                    }`}
                  >
                    {currentGroup.isRequired ? `Required (Pick ${currentGroup.minSelections})` : 'Optional Add-ons'}
                  </span>
                </div>
              </div>
            )}

            {/* Modifier Cards / Buttons (Section 23) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {groupModifiers.map((mod) => {
                const isSelected = selectedModifiersState.some(
                  (s) => s.modifierId === mod.id && s.modifierGroupId === currentGroup.id
                );
                const isFree = mod.price === 0;

                return (
                  <button
                    key={mod.id}
                    onClick={() => handleToggleModifier(mod, currentGroup)}
                    className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between min-h-[85px] group cursor-pointer shadow-xs ${
                      isSelected
                        ? 'bg-[#EFF6FF] text-blue-600 border-blue-600 ring-1 ring-blue-600'
                        : 'bg-white hover:bg-slate-50 border-[#E5EAF2] text-[#172033]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 w-full">
                      <div className="flex flex-col text-left min-w-0 pr-1">
                        <span className="font-bold text-xs leading-snug line-clamp-2">
                          {mod.name}
                        </span>
                        {mod.description && mod.description.trim() !== '' && (
                          <span className="text-[10px] text-[#64748B] line-clamp-1 mt-0.5">
                            {mod.description}
                          </span>
                        )}
                      </div>
                      {isSelected ? (
                        <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 group-hover:border-slate-400 flex-shrink-0" />
                      )}
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold ${
                          isSelected ? 'text-blue-600' : 'text-[#64748B]'
                        }`}
                      >
                        {mod.category || 'Choice'}
                      </span>
                      <span
                        className={`text-xs font-bold font-mono ${
                          isSelected ? 'text-blue-600' : 'text-[#172033]'
                        }`}
                      >
                        {isFree ? 'Free' : `+£${(mod.price ?? 0).toFixed(2)}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Special Chef Notes Input */}
            <div className="mt-4 pt-3 border-t border-[#E5EAF2]">
              <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
                Special Kitchen Instructions / Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Well done crust, no oregano, extra crispy..."
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-white border border-[#E5EAF2] text-[#172033] text-xs focus:outline-none focus:border-blue-600 placeholder:text-[#64748B] shadow-xs"
              />
            </div>
          </div>

          {/* Right Column: Dynamic Recipe Summary & Selections Pill Basket */}
          <div className="bg-white rounded-xl border border-[#E5EAF2] p-4 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF2]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Custom Recipe Basket
                </span>
                <span className="text-xs font-mono font-bold text-blue-600">
                  {selectedModifiersState.length} active add-ons
                </span>
              </div>

              {/* Selected List */}
              <div className="py-3 space-y-2 max-h-56 overflow-y-auto">
                <div className="flex items-center justify-between text-xs py-1 text-[#172033] font-medium">
                  <span>{selectedVariantForCustomization?.name || 'Item'}</span>
                  <span className="font-mono font-bold text-[#172033]">
                    £{(selectedVariantForCustomization?.price ?? 0).toFixed(2)}
                  </span>
                </div>

                {selectedModifiersState.map((sel) => (
                  <div
                    key={`${sel.modifierGroupId}-${sel.modifierId}`}
                    className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-[#F8FAFC] border border-[#E5EAF2]"
                  >
                    <span className="text-blue-600 font-medium truncate max-w-[170px]">
                      + {sel.name}
                    </span>
                    <span className="font-mono text-[#64748B] text-[11px]">
                      {(sel.price ?? 0) === 0 ? 'Free' : `+£${(sel.price ?? 0).toFixed(2)}`}
                    </span>
                  </div>
                ))}

                {selectedModifiersState.length === 0 && (
                  <div className="text-center py-6 text-[#64748B] text-xs italic">
                    No extra toppings selected yet
                  </div>
                )}
              </div>
            </div>

            {/* Quantity Selector & Live Total Price */}
            <div className="pt-3 border-t border-[#E5EAF2] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748B]">Item Quantity</span>
                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-[#E5EAF2]">
                  <button
                    onClick={() => setItemQuantity((q) => Math.max(1, q - 1))}
                    className="w-7 h-7 rounded-md bg-white border border-[#E5EAF2] text-[#172033] hover:bg-slate-100 flex items-center justify-center font-bold cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-bold text-sm text-[#172033] font-mono">
                    {itemQuantity}
                  </span>
                  <button
                    onClick={() => setItemQuantity((q) => q + 1)}
                    className="w-7 h-7 rounded-md bg-white border border-[#E5EAF2] text-[#172033] hover:bg-slate-100 flex items-center justify-center font-bold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-2.5 bg-[#EFF6FF] px-3 rounded-lg border border-blue-100">
                <span className="text-xs font-bold text-blue-900">Total Item Price</span>
                <span className="text-lg font-extrabold text-blue-600 font-mono">
                  £{(lineItemTotal ?? 0).toFixed(2)}
                </span>
              </div>

              {/* Validation alert banner if rules violated */}
              {validationErrors.length > 0 && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span className="leading-tight">{validationErrors[0]}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="px-6 py-4 bg-white border-t border-[#E5EAF2] flex items-center justify-between gap-3">
          <button
            onClick={handleBackToVariants}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 border border-[#E5EAF2] text-[#172033] font-bold text-xs transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-blue-600" />
            <span>Back to Sizes</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-[#64748B] hover:text-[#172033] font-bold text-xs transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleAddToCart}
              disabled={!isValid}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Order (£{(lineItemTotal ?? 0).toFixed(2)})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

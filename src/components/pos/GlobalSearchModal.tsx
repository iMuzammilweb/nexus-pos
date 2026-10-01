import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  ShoppingBag,
  Utensils,
  User,
  Hash,
  ChevronRight,
  Pizza,
} from 'lucide-react';
import { useNexus } from '../../context/NexusContext';

export const GlobalSearchModal: React.FC = () => {
  const {
    isSearchModalOpen,
    setIsSearchModalOpen,
    products,
    categories,
    orders,
    currentStore,
    openProductConfig,
    setActiveAppView,
    setLatestPlacedOrder,
    setIsReceiptModalOpen,
  } = useNexus();

  const [query, setQuery] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  // Close search when clicking anywhere outside
  useEffect(() => {
    if (!isSearchModalOpen) return;

    const handlePointerDownOutside = (event: MouseEvent | TouchEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsSearchModalOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchModalOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDownOutside);
    document.addEventListener('touchstart', handlePointerDownOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutside);
      document.removeEventListener('touchstart', handlePointerDownOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSearchModalOpen, setIsSearchModalOpen]);

  if (!isSearchModalOpen) return null;

  const clean = query.trim().toLowerCase();

  // Search Results across products, categories, orders, customers for the active restaurant
  const matchingProducts = clean
    ? products
        .filter((p) => p.storeId === currentStore.id || (!p.storeId && currentStore.id === 'store-1'))
        .filter(
          (p) =>
            p.name.toLowerCase().includes(clean) ||
            p.code.toLowerCase().includes(clean) ||
            p.description?.toLowerCase().includes(clean)
        )
    : [];

  const matchingCategories = clean
    ? categories
        .filter((c) => c.storeId === currentStore.id || (!c.storeId && currentStore.id === 'store-1'))
        .filter((c) => c.name.toLowerCase().includes(clean))
    : [];

  const matchingOrders = clean
    ? orders
        .filter((o) => o.storeId === currentStore.id)
        .filter(
          (o) =>
            o.invoiceId.toLowerCase().includes(clean) ||
            o.customer.firstName.toLowerCase().includes(clean) ||
            o.customer.lastName.toLowerCase().includes(clean) ||
            o.customer.phone.includes(clean)
        )
    : [];

  const totalResultsCount =
    matchingProducts.length + matchingCategories.length + matchingOrders.length;

  return (
    <div
      id="global-search-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setIsSearchModalOpen(false);
        }
      }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white border border-[#E5EAF2] rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Search Input Bar */}
        <div className="p-4 bg-white border-b border-[#E5EAF2] flex items-center gap-3">
          <Search className="w-5 h-5 text-blue-600 flex-shrink-0 ml-1" />
          <input
            type="text"
            autoFocus
            placeholder="Search products, orders, customers, invoices (#NEX-...)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-[#172033] placeholder:text-[#64748B] text-sm font-semibold focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-[#64748B] hover:text-[#172033] p-1 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsSearchModalOpen(false)}
            className="px-2.5 py-1 rounded-md bg-slate-100 text-[#64748B] hover:text-[#172033] text-xs font-bold cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 bg-[#F8FAFC]">
          {!clean && (
            <div className="py-8 text-center text-[#64748B] text-xs">
              Type to search items, customer names, telephone numbers, or invoice numbers...
            </div>
          )}

          {clean && totalResultsCount === 0 && (
            <div className="py-8 text-center text-[#64748B] text-xs">
              No matching records found for "{query}".
            </div>
          )}

          {/* Matching Products */}
          {matchingProducts.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-2 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-blue-600" />
                <span>Menu Products ({matchingProducts.length})</span>
              </div>
              <div className="space-y-1.5">
                {matchingProducts.map((prod) => (
                  <button
                    key={prod.id}
                    onClick={() => {
                      setIsSearchModalOpen(false);
                      setActiveAppView('pos-menu');
                      openProductConfig(prod);
                    }}
                    className="w-full p-2.5 rounded-lg bg-white hover:bg-slate-50 text-left border border-[#E5EAF2] hover:border-blue-500 flex items-center justify-between transition-colors group cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      {prod.image && typeof prod.image === 'string' && prod.image.trim() !== '' ? (
                        <img
                          src={prod.image.trim()}
                          alt={prod.name}
                          className="w-10 h-10 rounded-lg object-cover border border-[#E5EAF2]"
                        />
                      ) : null}
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-blue-600">
                            {prod.code}
                          </span>
                          <span className="font-bold text-xs text-[#172033] group-hover:text-blue-600">
                            {prod.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#64748B] line-clamp-1">
                          {prod.description}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-blue-600">
                        £{(prod.basePrice || 0).toFixed(2)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:text-blue-600" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matching Orders / Invoices */}
          {matchingOrders.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-2 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                <span>Orders & Customers ({matchingOrders.length})</span>
              </div>
              <div className="space-y-1.5">
                {matchingOrders.map((ord) => (
                  <button
                    key={ord.id}
                    onClick={() => {
                      setIsSearchModalOpen(false);
                      setLatestPlacedOrder(ord);
                      setIsReceiptModalOpen(true);
                    }}
                    className="w-full p-2.5 rounded-lg bg-white hover:bg-slate-50 text-left border border-[#E5EAF2] hover:border-blue-500 flex items-center justify-between transition-colors group cursor-pointer shadow-xs"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-blue-600">
                          {ord.invoiceId}
                        </span>
                        <span className="font-bold text-xs text-[#172033]">
                          {ord.customer.firstName} {ord.customer.lastName}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-[#64748B] font-bold">
                          {ord.orderType}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#64748B] font-mono mt-0.5">
                        {ord.customer.phone} • {ord.items.length} items • Status: {ord.orderStatus}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-blue-600">
                        £{(ord.grandTotal || 0).toFixed(2)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:text-blue-600" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

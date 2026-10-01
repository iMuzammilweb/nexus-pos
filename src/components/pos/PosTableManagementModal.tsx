import React, { useState } from 'react';
import {
  X,
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Coffee,
  Clock,
  Sparkles,
  Search,
  Users,
  Store as StoreIcon,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { useNexus } from '../../context/NexusContext';
import { TableRecord } from '../../types';

export const PosTableManagementModal: React.FC = () => {
  const {
    isTableManagementModalOpen,
    setIsTableManagementModalOpen,
    tables,
    addTable,
    updateTable,
    deleteTable,
    updateTableStatus,
    currentStore,
  } = useNexus();

  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Table Add / Edit Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableRecord | null>(null);
  const [tableForm, setTableForm] = useState<{
    tableNumber: string;
    zone: string;
    capacity: number;
    status: TableRecord['status'];
    notes: string;
  }>({
    tableNumber: '',
    zone: 'Main Dining',
    capacity: 4,
    status: 'Available',
    notes: '',
  });

  if (!isTableManagementModalOpen) return null;

  // Filter tables strictly for current store
  const storeTables = (tables || []).filter(
    (t) => !t.storeId || t.storeId === currentStore?.id
  );

  const zones = ['All', 'Main Dining', 'Window Patio', 'Bar Lounge', 'Upstairs Mezzanine'];
  const statuses = ['All', 'Available', 'Occupied', 'Reserved', 'Cleaning'];

  // Real-time table stats
  const totalCount = storeTables.length;
  const availableCount = storeTables.filter((t) => t.status === 'Available').length;
  const occupiedCount = storeTables.filter((t) => t.status === 'Occupied').length;
  const reservedCount = storeTables.filter((t) => t.status === 'Reserved').length;
  const cleaningCount = storeTables.filter((t) => t.status === 'Cleaning').length;

  const filteredTables = storeTables.filter((t) => {
    const matchesZone = selectedZone === 'All' || t.zone === selectedZone;
    const matchesStatus = selectedStatus === 'All' || t.status === selectedStatus;
    const matchesSearch =
      !searchQuery.trim() ||
      t.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.currentOrderId && t.currentOrderId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesZone && matchesStatus && matchesSearch;
  });

  const handleOpenAdd = () => {
    setEditingTable(null);
    const nextNum = `Table ${(storeTables.length + 1).toString().padStart(2, '0')}`;
    setTableForm({
      tableNumber: nextNum,
      zone: 'Main Dining',
      capacity: 4,
      status: 'Available',
      notes: '',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (t: TableRecord) => {
    setEditingTable(t);
    setTableForm({
      tableNumber: t.tableNumber,
      zone: t.zone || 'Main Dining',
      capacity: t.capacity || 4,
      status: t.status,
      notes: t.notes || '',
    });
    setIsFormOpen(true);
  };

  const handleSaveTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableForm.tableNumber.trim()) return;

    if (editingTable) {
      updateTable(editingTable.id, {
        ...tableForm,
        storeId: currentStore?.id || 'store-1',
      });
    } else {
      addTable({
        ...tableForm,
        storeId: currentStore?.id || 'store-1',
      });
    }
    setIsFormOpen(false);
  };

  const getStatusBadge = (status: TableRecord['status']) => {
    switch (status) {
      case 'Available':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          border: 'border-emerald-200 hover:border-emerald-300',
          cardBg: 'bg-white',
          dot: 'bg-emerald-500',
          btnBg: 'bg-emerald-600 hover:bg-emerald-700',
        };
      case 'Occupied':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          border: 'border-rose-200 hover:border-rose-300',
          cardBg: 'bg-rose-50/20',
          dot: 'bg-rose-500',
          btnBg: 'bg-rose-600 hover:bg-rose-700',
        };
      case 'Reserved':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          border: 'border-amber-200 hover:border-amber-300',
          cardBg: 'bg-amber-50/20',
          dot: 'bg-amber-500',
          btnBg: 'bg-amber-600 hover:bg-amber-700',
        };
      case 'Cleaning':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          border: 'border-blue-200 hover:border-blue-300',
          cardBg: 'bg-blue-50/20',
          dot: 'bg-blue-500',
          btnBg: 'bg-blue-600 hover:bg-blue-700',
        };
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setIsTableManagementModalOpen(false);
        }
      }}
    >
      <div className="w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl border border-[#E5EAF2] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-white border-b border-[#E5EAF2] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#172033]">
                  Dine-In Table Management
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                  {currentStore.businessName}
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Real-time table floorplan & live occupancy status for {currentStore.businessName}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Table</span>
            </button>
            <button
              onClick={() => setIsTableManagementModalOpen(false)}
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="px-6 py-3 bg-[#F8FAFC] border-b border-[#E5EAF2] grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="bg-white p-2.5 rounded-xl border border-[#E5EAF2] flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[11px] text-[#64748B] font-semibold">Total Tables</span>
              <p className="text-lg font-black text-[#172033]">{totalCount}</p>
            </div>
            <Layers className="w-4 h-4 text-[#64748B]" />
          </div>

          <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[11px] text-emerald-800 font-semibold">Available</span>
              <p className="text-lg font-black text-emerald-700">{availableCount}</p>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="bg-rose-50/60 p-2.5 rounded-xl border border-rose-200 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[11px] text-rose-800 font-semibold">Occupied</span>
              <p className="text-lg font-black text-rose-700">{occupiedCount}</p>
            </div>
            <Coffee className="w-4 h-4 text-rose-600" />
          </div>

          <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[11px] text-amber-800 font-semibold">Reserved</span>
              <p className="text-lg font-black text-amber-700">{reservedCount}</p>
            </div>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>

          <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-200 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[11px] text-blue-800 font-semibold">Cleaning</span>
              <p className="text-lg font-black text-blue-700">{cleaningCount}</p>
            </div>
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="px-6 py-3 bg-white border-b border-[#E5EAF2] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs text-[#64748B] font-bold mr-1 shrink-0">Zone:</span>
            {zones.map((z) => (
              <button
                key={z}
                onClick={() => setSelectedZone(z)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedZone === z
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#172033] border border-[#E5EAF2]'
                }`}
              >
                {z}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search table, zone, ticket..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E5EAF2] text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Modal Form Overlay (Add / Edit) */}
        {isFormOpen && (
          <form
            onSubmit={handleSaveTable}
            className="p-5 bg-blue-50/40 border-b border-blue-200 animate-in fade-in duration-150 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                {editingTable ? `Edit ${editingTable.tableNumber}` : 'Add New Dining Table'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-xs text-[#64748B] hover:text-[#172033] font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#172033] mb-1">
                  Table Number / Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Table 01, Patio 02"
                  value={tableForm.tableNumber}
                  onChange={(e) => setTableForm({ ...tableForm, tableNumber: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E5EAF2] text-xs text-[#172033] focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#172033] mb-1">
                  Floor Zone *
                </label>
                <select
                  value={tableForm.zone}
                  onChange={(e) => setTableForm({ ...tableForm, zone: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E5EAF2] text-xs text-[#172033] focus:outline-none focus:border-blue-600"
                >
                  <option value="Main Dining">Main Dining</option>
                  <option value="Window Patio">Window Patio</option>
                  <option value="Bar Lounge">Bar Lounge</option>
                  <option value="Upstairs Mezzanine">Upstairs Mezzanine</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#172033] mb-1">
                  Seating Capacity (Guests)
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={tableForm.capacity}
                  onChange={(e) => setTableForm({ ...tableForm, capacity: parseInt(e.target.value) || 2 })}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E5EAF2] text-xs text-[#172033] focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#172033] mb-1">
                  Initial Status
                </label>
                <select
                  value={tableForm.status}
                  onChange={(e) => setTableForm({ ...tableForm, status: e.target.value as any })}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E5EAF2] text-xs text-[#172033] focus:outline-none focus:border-blue-600"
                >
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Reserved">Reserved</option>
                  <option value="Cleaning">Cleaning</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-white border border-[#E5EAF2] text-xs font-semibold text-[#64748B] hover:text-[#172033] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                {editingTable ? 'Update Table' : 'Save Table'}
              </button>
            </div>
          </form>
        )}

        {/* Tables Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC]">
          {filteredTables.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center bg-white rounded-xl border border-[#E5EAF2] p-6">
              <UtensilsCrossed className="w-10 h-10 text-[#64748B] mb-2" />
              <p className="text-sm font-bold text-[#172033]">No dining tables found</p>
              <p className="text-xs text-[#64748B] mt-1">
                Click "Add Table" to create tables for this store.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTables.map((table) => {
                const styling = getStatusBadge(table.status);
                return (
                  <div
                    key={table.id}
                    className={`rounded-2xl border p-4 shadow-sm flex flex-col justify-between transition-all ${styling.cardBg} ${styling.border}`}
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-[#E5EAF2]">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${styling.dot}`} />
                          <span className="text-sm font-black text-[#172033]">
                            {table.tableNumber}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${styling.bg}`}
                        >
                          {table.status}
                        </span>
                      </div>

                      <div className="py-2 text-xs space-y-1 text-[#64748B]">
                        <div className="flex justify-between">
                          <span>Zone:</span>
                          <span className="font-semibold text-[#172033]">{table.zone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Capacity:</span>
                          <span className="font-semibold text-[#172033] flex items-center gap-1">
                            <Users className="w-3 h-3 text-[#64748B]" />
                            {table.capacity} Seats
                          </span>
                        </div>
                        {table.currentOrderId && (
                          <div className="flex justify-between pt-1 border-t border-[#E5EAF2] text-blue-600 font-bold">
                            <span>Ticket:</span>
                            <span>{table.currentOrderId}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick 1-Tap Status Toggles */}
                    <div className="pt-3 border-t border-[#E5EAF2] space-y-2">
                      <div className="grid grid-cols-2 gap-1.5">
                        {table.status !== 'Available' ? (
                          <button
                            onClick={() => updateTableStatus(table.id, 'Available')}
                            className="py-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200 transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Free Table</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => updateTableStatus(table.id, 'Occupied')}
                            className="py-1 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold border border-rose-200 transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Coffee className="w-3 h-3" />
                            <span>Occupy</span>
                          </button>
                        )}

                        {table.status !== 'Cleaning' ? (
                          <button
                            onClick={() => updateTableStatus(table.id, 'Cleaning')}
                            className="py-1 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold border border-blue-200 transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Cleaning</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => updateTableStatus(table.id, 'Available')}
                            className="py-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200 transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Cleaned</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-1">
                        <button
                          onClick={() => handleOpenEdit(table)}
                          className="p-1 rounded text-[#64748B] hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit table"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete ${table.tableNumber}?`)) {
                              deleteTable(table.id);
                            }
                          }}
                          className="p-1 rounded text-[#64748B] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete table"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

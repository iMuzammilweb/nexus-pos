import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Users,
  Clock,
  Layers,
  Sparkles,
  AlertCircle,
  Coffee,
  CheckCircle2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useNexus } from '../../../context/NexusContext';
import { TableRecord } from '../../../types';

export const TableManagementView: React.FC = () => {
  const { tables, addTable, updateTable, deleteTable, updateTableStatus } = useNexus();

  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Table Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const zones = ['All', 'Main Dining', 'Window Patio', 'Bar Lounge', 'Upstairs Mezzanine'];
  const statuses = ['All', 'Available', 'Occupied', 'Reserved', 'Cleaning'];

  // Stats calculation
  const safeTables = tables || [];
  const totalCount = safeTables.length;
  const availableCount = safeTables.filter((t) => t.status === 'Available').length;
  const occupiedCount = safeTables.filter((t) => t.status === 'Occupied').length;
  const reservedCount = safeTables.filter((t) => t.status === 'Reserved').length;
  const cleaningCount = safeTables.filter((t) => t.status === 'Cleaning').length;

  const filteredTables = safeTables.filter((t) => {
    const matchesZone = selectedZone === 'All' || t.zone === selectedZone;
    const matchesStatus = selectedStatus === 'All' || t.status === selectedStatus;
    const matchesSearch =
      !searchQuery.trim() ||
      t.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.currentOrderId && t.currentOrderId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesZone && matchesStatus && matchesSearch;
  });

  const handleOpenModal = (table?: TableRecord) => {
    if (table) {
      setEditingTable(table);
      setTableForm({
        tableNumber: table.tableNumber,
        zone: table.zone,
        capacity: table.capacity,
        status: table.status,
        notes: table.notes || '',
      });
    } else {
      setEditingTable(null);
      const nextNum = `T-${(safeTables.length + 1).toString().padStart(2, '0')}`;
      setTableForm({
        tableNumber: nextNum,
        zone: 'Main Dining',
        capacity: 4,
        status: 'Available',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableForm.tableNumber.trim()) return;

    if (editingTable) {
      updateTable(editingTable.id, tableForm);
    } else {
      addTable(tableForm);
    }
    setIsModalOpen(false);
  };

  const getStatusColor = (status: TableRecord['status']) => {
    switch (status) {
      case 'Available':
        return {
          bg: 'bg-emerald-50/70',
          border: 'border-emerald-200',
          badge: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
          text: 'text-emerald-700',
        };
      case 'Occupied':
        return {
          bg: 'bg-rose-50/70',
          border: 'border-rose-200',
          badge: 'bg-rose-100 text-rose-800 border border-rose-200',
          text: 'text-rose-700',
        };
      case 'Reserved':
        return {
          bg: 'bg-amber-50/70',
          border: 'border-amber-200',
          badge: 'bg-amber-100 text-amber-800 border border-amber-200',
          text: 'text-amber-700',
        };
      case 'Cleaning':
        return {
          bg: 'bg-blue-50/70',
          border: 'border-blue-200',
          badge: 'bg-blue-100 text-blue-800 border border-blue-200',
          text: 'text-blue-700',
        };
    }
  };

  return (
    <div className="space-y-6" id="table-management-root">
      {/* Header & Stats Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-[#E5EAF2] rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-blue-600">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#172033] flex items-center gap-2">
                Dine-In Table Management
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Live Floorplan
                </span>
              </h1>
              <p className="text-xs text-[#64748B] mt-0.5">
                Track real-time table statuses, capacity, guest counts, and active POS dine-in ticket orders.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Dining Table
        </button>
      </div>

      {/* Quick Status KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border border-[#E5EAF2] rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-[#64748B] font-medium">Total Tables</span>
            <h3 className="text-xl font-extrabold text-[#172033] mt-0.5">{totalCount}</h3>
          </div>
          <Layers className="w-5 h-5 text-slate-400" />
        </div>

        <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-emerald-800 font-medium">Available</span>
            <h3 className="text-xl font-extrabold text-emerald-700 mt-0.5">{availableCount}</h3>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        </div>

        <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-rose-800 font-medium">Occupied</span>
            <h3 className="text-xl font-extrabold text-rose-700 mt-0.5">{occupiedCount}</h3>
          </div>
          <Coffee className="w-5 h-5 text-rose-600" />
        </div>

        <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-amber-800 font-medium">Reserved</span>
            <h3 className="text-xl font-extrabold text-amber-700 mt-0.5">{reservedCount}</h3>
          </div>
          <Clock className="w-5 h-5 text-amber-600" />
        </div>

        <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-blue-800 font-medium">Cleaning</span>
            <h3 className="text-xl font-extrabold text-blue-700 mt-0.5">{cleaningCount}</h3>
          </div>
          <Sparkles className="w-5 h-5 text-blue-600" />
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-[#E5EAF2] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        {/* Zone Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-[#64748B] font-bold mr-1 shrink-0">Zone:</span>
          {zones.map((z) => (
            <button
              key={z}
              onClick={() => setSelectedZone(z)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedZone === z
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#172033] border border-[#E5EAF2] hover:bg-slate-100'
              }`}
            >
              {z}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search table number, zone, invoice..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#172033] placeholder-[#64748B] focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* Tables Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTables.map((table) => {
          const colors = getStatusColor(table.status);
          return (
            <div
              key={table.id}
              className={`rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition-all relative ${colors.bg} ${colors.border}`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base font-extrabold text-[#172033] tracking-wide">
                    {table.tableNumber}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${colors.badge}`}>
                    {table.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[#64748B]">
                    <span className="text-[#64748B] font-medium">Zone Section:</span>
                    <span className="font-bold text-[#172033]">{table.zone}</span>
                  </div>

                  <div className="flex items-center justify-between text-[#64748B]">
                    <span className="text-[#64748B] font-medium">Capacity:</span>
                    <span className="font-bold text-[#172033] flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#64748B]" /> {table.capacity} Seats
                    </span>
                  </div>

                  {table.status === 'Occupied' && (
                    <div className="p-2.5 bg-white rounded-xl border border-rose-200 space-y-1 shadow-xs">
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Guests:</span>
                        <span className="font-bold text-rose-700">{table.guestCount || 2} Seated</span>
                      </div>
                      {table.currentOrderId && (
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">Active Order:</span>
                          <span className="font-mono font-bold text-blue-600">
                            {table.currentOrderId}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {table.notes && (
                    <p className="text-[11px] text-[#64748B] italic bg-white/80 p-2 rounded-lg border border-[#E5EAF2]">
                      "{table.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Status Selector & Actions */}
              <div className="mt-4 pt-3 border-t border-[#E5EAF2] flex items-center justify-between gap-2">
                <select
                  value={table.status}
                  onChange={(e) =>
                    updateTableStatus(table.id, e.target.value as TableRecord['status'])
                  }
                  className="bg-white border border-[#E5EAF2] rounded-lg px-2 py-1 text-xs text-[#172033] font-bold focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Reserved">Reserved</option>
                  <option value="Cleaning">Cleaning</option>
                </select>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenModal(table)}
                    className="p-1.5 hover:bg-white text-[#64748B] hover:text-blue-600 rounded-md transition-colors cursor-pointer"
                    title="Edit Table"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Remove ${table.tableNumber}?`)) {
                        deleteTable(table.id);
                      }
                    }}
                    className="p-1.5 hover:bg-rose-50 text-[#64748B] hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                    title="Delete Table"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD/EDIT TABLE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5EAF2] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF2]">
              <h3 className="text-sm font-bold text-[#172033]">
                {editingTable ? `Edit ${editingTable.tableNumber}` : 'Add Dining Table'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#64748B] hover:text-[#172033] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#64748B] font-bold mb-1">Table Number / Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Table 05 or Patio A"
                  value={tableForm.tableNumber}
                  onChange={(e) => setTableForm({ ...tableForm, tableNumber: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Zone Area</label>
                  <select
                    value={tableForm.zone}
                    onChange={(e) => setTableForm({ ...tableForm, zone: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600 cursor-pointer"
                  >
                    <option value="Main Dining">Main Dining</option>
                    <option value="Window Patio">Window Patio</option>
                    <option value="Bar Lounge">Bar Lounge</option>
                    <option value="Upstairs Mezzanine">Upstairs Mezzanine</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Seat Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={tableForm.capacity}
                    onChange={(e) => setTableForm({ ...tableForm, capacity: Number(e.target.value) })}
                    className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] font-bold focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">Initial Status</label>
                <select
                  value={tableForm.status}
                  onChange={(e) =>
                    setTableForm({ ...tableForm, status: e.target.value as TableRecord['status'] })
                  }
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Reserved">Reserved</option>
                  <option value="Cleaning">Cleaning</option>
                </select>
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">Staff Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Near power socket, VIP corner"
                  value={tableForm.notes}
                  onChange={(e) => setTableForm({ ...tableForm, notes: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#64748B] hover:text-[#172033] rounded-lg font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm cursor-pointer"
                >
                  Save Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

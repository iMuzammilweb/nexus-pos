import React, { useState } from 'react';
import {
  Printer,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Wifi,
  Usb,
  Bluetooth,
  Network,
  Play,
  CheckCircle2,
  AlertCircle,
  FileText,
  Copy,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useNexus } from '../../../context/NexusContext';
import { PrinterDevice } from '../../../types';

export const PrinterDevicesView: React.FC = () => {
  const { printers, addPrinter, updatePrinter, deletePrinter, setDefaultPrinter, testPrintPrinter } =
    useNexus();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<PrinterDevice | null>(null);
  const [printerForm, setPrinterForm] = useState<{
    name: string;
    type: PrinterDevice['type'];
    connection: PrinterDevice['connection'];
    ipAddress: string;
    port: number;
    macAddress: string;
    paperWidth: PrinterDevice['paperWidth'];
    isDefault: boolean;
    status: PrinterDevice['status'];
    autoCut: boolean;
    openDrawerOnPrint: boolean;
  }>({
    name: '',
    type: 'Receipt 80mm',
    connection: 'LAN',
    ipAddress: '192.168.1.200',
    port: 9100,
    macAddress: '',
    paperWidth: '80mm',
    isDefault: false,
    status: 'Ready',
    autoCut: true,
    openDrawerOnPrint: true,
  });

  // Test Ticket Modal State
  const [testSlipData, setTestSlipData] = useState<{
    printerName: string;
    content: string;
  } | null>(null);
  const [isPrintingTest, setIsPrintingTest] = useState<string | null>(null);

  const handleOpenModal = (printer?: PrinterDevice) => {
    if (printer) {
      setEditingPrinter(printer);
      setPrinterForm({
        name: printer.name,
        type: printer.type,
        connection: printer.connection,
        ipAddress: printer.ipAddress || '192.168.1.200',
        port: printer.port || 9100,
        macAddress: printer.macAddress || '',
        paperWidth: printer.paperWidth,
        isDefault: printer.isDefault,
        status: printer.status,
        autoCut: printer.autoCut ?? true,
        openDrawerOnPrint: printer.openDrawerOnPrint ?? false,
      });
    } else {
      setEditingPrinter(null);
      setPrinterForm({
        name: '',
        type: 'Receipt 80mm',
        connection: 'LAN',
        ipAddress: `192.168.1.${100 + (printers?.length || 0)}`,
        port: 9100,
        macAddress: '',
        paperWidth: '80mm',
        isDefault: (printers?.length || 0) === 0,
        status: 'Ready',
        autoCut: true,
        openDrawerOnPrint: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSavePrinter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!printerForm.name.trim()) return;

    if (editingPrinter) {
      updatePrinter(editingPrinter.id, printerForm);
    } else {
      addPrinter(printerForm);
    }
    setIsModalOpen(false);
  };

  const handleTriggerTestPrint = async (printer: PrinterDevice) => {
    setIsPrintingTest(printer.id);
    const res = await testPrintPrinter(printer.id);
    setIsPrintingTest(null);

    if (res.success && res.receiptSlip) {
      setTestSlipData({
        printerName: printer.name,
        content: res.receiptSlip,
      });
    }
  };

  const getConnectionIcon = (connection: PrinterDevice['connection']) => {
    switch (connection) {
      case 'LAN':
        return <Network className="w-4 h-4 text-emerald-600" />;
      case 'Wi-Fi':
        return <Wifi className="w-4 h-4 text-blue-600" />;
      case 'USB':
        return <Usb className="w-4 h-4 text-amber-600" />;
      case 'Bluetooth':
        return <Bluetooth className="w-4 h-4 text-purple-600" />;
    }
  };

  return (
    <div className="space-y-6" id="printer-devices-root">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E5EAF2] rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-blue-600">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#172033] flex items-center gap-2">
                Hardware Printers & Thermal Devices
              </h1>
              <p className="text-xs text-[#64748B] mt-0.5">
                Manage ESC/POS receipt thermal printers, Kitchen Order Ticket (KOT) stations, and Bar printers.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Printer Device
        </button>
      </div>

      {/* Printer Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(printers || []).map((printer) => (
          <div
            key={printer.id}
            className={`rounded-2xl border p-4 shadow-sm flex flex-col justify-between transition-all bg-white ${
              printer.isDefault
                ? 'border-blue-500 ring-1 ring-blue-500/20'
                : 'border-[#E5EAF2] hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[#F8FAFC] rounded-lg border border-[#E5EAF2]">
                    <Printer className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#172033] flex items-center gap-1.5">
                      {printer.name}
                      {printer.isDefault && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md border border-blue-200">
                          Default Primary
                        </span>
                      )}
                    </h3>
                    <span className="text-[11px] text-[#64748B]">{printer.type}</span>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    printer.status === 'Ready'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {printer.status}
                </span>
              </div>

              <div className="space-y-2 text-xs bg-[#F8FAFC] p-3 rounded-xl border border-[#E5EAF2]">
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B] flex items-center gap-1.5">
                    {getConnectionIcon(printer.connection)} {printer.connection}
                  </span>
                  <span className="font-mono text-[#172033] font-bold">
                    {printer.connection === 'LAN' || printer.connection === 'Wi-Fi'
                      ? `${printer.ipAddress}:${printer.port || 9100}`
                      : printer.connection === 'Bluetooth'
                      ? printer.macAddress || 'Paired'
                      : 'COM1 / Serial'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Paper Width:</span>
                  <span className="font-bold text-[#172033]">{printer.paperWidth} Roll</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Receipts Printed:</span>
                  <span className="font-bold text-blue-600">#{printer.receiptCount || 0} tickets</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Hardware Features:</span>
                  <span className="text-[11px] text-[#172033]">
                    {printer.autoCut ? 'Auto-cutter' : 'Manual tear'} •{' '}
                    {printer.openDrawerOnPrint ? 'Drawer Kick' : 'No Drawer'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="mt-4 pt-3 border-t border-[#E5EAF2] flex items-center justify-between gap-2">
              <button
                onClick={() => handleTriggerTestPrint(printer)}
                disabled={isPrintingTest === printer.id}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                {isPrintingTest === printer.id ? 'Testing...' : 'Test Print'}
              </button>

              <div className="flex items-center gap-1">
                {!printer.isDefault && (
                  <button
                    onClick={() => setDefaultPrinter(printer.id)}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-[#64748B] hover:text-[#172033] text-[11px] font-bold rounded-md transition-colors cursor-pointer"
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => handleOpenModal(printer)}
                  className="p-1.5 hover:bg-slate-100 text-[#64748B] hover:text-blue-600 rounded-md transition-colors cursor-pointer"
                  title="Edit Printer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Remove printer "${printer.name}"?`)) {
                      deletePrinter(printer.id);
                    }
                  }}
                  className="p-1.5 hover:bg-rose-50 text-[#64748B] hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                  title="Delete Printer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ADD/EDIT PRINTER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5EAF2] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF2]">
              <h3 className="text-sm font-bold text-[#172033]">
                {editingPrinter ? `Edit ${editingPrinter.name}` : 'Add New Printer Device'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#64748B] hover:text-[#172033] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePrinter} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#64748B] font-bold mb-1">Printer Device Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Front Cashier Epson TM-T88"
                  value={printerForm.name}
                  onChange={(e) => setPrinterForm({ ...printerForm, name: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Printer Purpose</label>
                  <select
                    value={printerForm.type}
                    onChange={(e) =>
                      setPrinterForm({
                        ...printerForm,
                        type: e.target.value as PrinterDevice['type'],
                      })
                    }
                    className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600 cursor-pointer"
                  >
                    <option value="Receipt 80mm">Customer Receipt 80mm</option>
                    <option value="Receipt 58mm">Compact Receipt 58mm</option>
                    <option value="Kitchen KOT">Kitchen Order (KOT)</option>
                    <option value="Bar Ticket">Bar Drinks Ticket</option>
                    <option value="Label 4x6">Sticky Food Label</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Interface Connection</label>
                  <select
                    value={printerForm.connection}
                    onChange={(e) =>
                      setPrinterForm({
                        ...printerForm,
                        connection: e.target.value as PrinterDevice['connection'],
                      })
                    }
                    className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600 cursor-pointer"
                  >
                    <option value="LAN">Ethernet (LAN)</option>
                    <option value="Wi-Fi">Wireless (Wi-Fi)</option>
                    <option value="USB">USB Direct</option>
                    <option value="Bluetooth">Bluetooth Wireless</option>
                  </select>
                </div>
              </div>

              {(printerForm.connection === 'LAN' || printerForm.connection === 'Wi-Fi') && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[#64748B] font-bold mb-1">Static IP Address</label>
                    <input
                      type="text"
                      placeholder="192.168.1.200"
                      value={printerForm.ipAddress}
                      onChange={(e) => setPrinterForm({ ...printerForm, ipAddress: e.target.value })}
                      className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] font-mono focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[#64748B] font-bold mb-1">Port</label>
                    <input
                      type="number"
                      value={printerForm.port}
                      onChange={(e) => setPrinterForm({ ...printerForm, port: Number(e.target.value) })}
                      className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] font-mono focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              )}

              {printerForm.connection === 'Bluetooth' && (
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Bluetooth MAC Address</label>
                  <input
                    type="text"
                    placeholder="00:11:22:33:44:55"
                    value={printerForm.macAddress}
                    onChange={(e) => setPrinterForm({ ...printerForm, macAddress: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] font-mono focus:outline-none focus:border-blue-600"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Thermal Paper Roll</label>
                  <select
                    value={printerForm.paperWidth}
                    onChange={(e) =>
                      setPrinterForm({
                        ...printerForm,
                        paperWidth: e.target.value as PrinterDevice['paperWidth'],
                      })
                    }
                    className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600 cursor-pointer"
                  >
                    <option value="80mm">80mm (Standard)</option>
                    <option value="58mm">58mm (Small)</option>
                    <option value="100mm">100mm (Wide)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Default Output</label>
                  <select
                    value={printerForm.isDefault ? 'yes' : 'no'}
                    onChange={(e) =>
                      setPrinterForm({ ...printerForm, isDefault: e.target.value === 'yes' })
                    }
                    className="w-full bg-[#F8FAFC] border border-[#E5EAF2] rounded-lg px-3 py-2 text-[#172033] focus:outline-none focus:border-blue-600 cursor-pointer"
                  >
                    <option value="no">Secondary Device</option>
                    <option value="yes">Primary Default</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-[#F8FAFC] p-3 rounded-lg border border-[#E5EAF2]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printerForm.autoCut}
                    onChange={(e) => setPrinterForm({ ...printerForm, autoCut: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span className="text-[#172033] font-medium">Automatic Paper Guillotine Cut</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printerForm.openDrawerOnPrint}
                    onChange={(e) =>
                      setPrinterForm({ ...printerForm, openDrawerOnPrint: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span className="text-[#172033] font-medium">Kick Cash Drawer</span>
                </label>
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
                  Save Printer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIAGNOSTIC TEST TICKET MODAL */}
      {testSlipData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5EAF2] rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF2]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-[#172033]">Diagnostic Slip Ejected</h3>
              </div>
              <button onClick={() => setTestSlipData(null)} className="text-[#64748B] hover:text-[#172033] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Realistic Thermal Receipt Slip */}
            <div
              id="printable-slip"
              className="bg-[#F8FAFC] text-slate-950 p-4 rounded-lg shadow-xs font-mono text-[11px] leading-tight select-all border border-[#E5EAF2]"
            >
              <pre className="whitespace-pre-wrap font-mono">{testSlipData.content}</pre>
            </div>

            <div className="flex items-center justify-between gap-2 no-print">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print to Thermal Printer</span>
              </button>

              <button
                onClick={() => setTestSlipData(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#172033] rounded-lg text-xs font-bold cursor-pointer"
              >
                Close Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

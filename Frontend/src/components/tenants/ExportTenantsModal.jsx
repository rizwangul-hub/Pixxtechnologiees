import React, { useState } from 'react';
import { X, Download } from 'lucide-react';

export function ExportTenantsModal({ isOpen, onClose, onExport }) {
  const [options, setOptions] = useState({
    selectAll: false,
    mainInfo: true,
    tenancies: true,
    occupation: false,
    identity: false,
    referees: false,
  });

  if (!isOpen) return null;

  const handleSelectAll = (checked) => {
    setOptions({
      selectAll: checked,
      mainInfo: checked,
      tenancies: checked,
      occupation: checked,
      identity: checked,
      referees: checked,
    });
  };

  const handleOptionChange = (field, checked) => {
    const updated = { ...options, [field]: checked };
    const allChecked =
      updated.mainInfo &&
      updated.tenancies &&
      updated.occupation &&
      updated.identity &&
      updated.referees;
    updated.selectAll = allChecked;
    setOptions(updated);
  };

  const handleExportSubmit = () => {
    onExport(options);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden text-left transform transition-all border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Export Tenants</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-4 text-xs font-semibold text-slate-700">
          <label className="flex items-center gap-3 cursor-pointer select-none pb-2 border-b border-slate-100">
            <input
              type="checkbox"
              checked={options.selectAll}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="w-4 h-4 rounded text-[#00a36f] focus:ring-[#00a36f]/30 border-slate-300 accent-[#00a36f]"
            />
            <span className="font-extrabold text-slate-900">Select All</span>
          </label>

          <div className="space-y-3 pl-1">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={options.mainInfo}
                onChange={(e) => handleOptionChange('mainInfo', e.target.checked)}
                className="w-4 h-4 rounded text-[#00a36f] focus:ring-[#00a36f]/30 border-slate-300 accent-[#00a36f]"
              />
              <span>Tenant Main Information</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={options.tenancies}
                onChange={(e) => handleOptionChange('tenancies', e.target.checked)}
                className="w-4 h-4 rounded text-[#00a36f] focus:ring-[#00a36f]/30 border-slate-300 accent-[#00a36f]"
              />
              <span>Tenancies</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={options.occupation}
                onChange={(e) => handleOptionChange('occupation', e.target.checked)}
                className="w-4 h-4 rounded text-[#00a36f] focus:ring-[#00a36f]/30 border-slate-300 accent-[#00a36f]"
              />
              <span>Tenant Occupation</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={options.identity}
                onChange={(e) => handleOptionChange('identity', e.target.checked)}
                className="w-4 h-4 rounded text-[#00a36f] focus:ring-[#00a36f]/30 border-slate-300 accent-[#00a36f]"
              />
              <span>Identity, Addresses & Other Information</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={options.referees}
                onChange={(e) => handleOptionChange('referees', e.target.checked)}
                className="w-4 h-4 rounded text-[#00a36f] focus:ring-[#00a36f]/30 border-slate-300 accent-[#00a36f]"
              />
              <span>Referees & Contacts</span>
            </label>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/80 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-200/80 hover:bg-slate-300/80 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExportSubmit}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-extrabold text-white bg-[#00a36f] hover:bg-[#008f61] active:bg-[#007a53] rounded-lg transition-all cursor-pointer shadow-xs focus:ring-2 focus:ring-[#00a36f]"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>
    </div>
  );
}

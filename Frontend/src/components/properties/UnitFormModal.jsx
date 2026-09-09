import React, { useState, useEffect } from 'react';
import { X, Save, Building, DollarSign, Layers } from 'lucide-react';
import { unitTypes, unitStatuses, priceTypes } from '../../data/propertiesData';

export function UnitFormModal({ isOpen, onClose, onSave, propertyId, initialData = null }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Flat',
    floor: '',
    size: '',
    price: '',
    priceType: 'monthly_rent',
    status: 'Available',
    customerName: '',
    description: '',
    notes: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        type: initialData.type || 'Flat',
        floor: initialData.floor || '',
        size: initialData.size || '',
        price: initialData.price || '',
        priceType: initialData.priceType || 'monthly_rent',
        status: initialData.status || 'Available',
        customerName: initialData.customerName || '',
        description: initialData.description || '',
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        name: '',
        type: 'Flat',
        floor: '',
        size: '',
        price: '',
        priceType: 'monthly_rent',
        status: 'Available',
        customerName: '',
        description: '',
        notes: '',
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a Unit Name / Number.');
      return;
    }

    const unitPayload = {
      id: initialData ? initialData.id : `unit-${Date.now()}`,
      propertyId,
      name: formData.name.trim(),
      type: formData.type,
      floor: formData.floor.trim(),
      size: formData.size.trim(),
      price: Number(formData.price) || 0,
      priceType: formData.priceType,
      status: formData.status,
      customerName: formData.status === 'Occupied' ? (formData.customerName || 'Assigned Customer') : (formData.status === 'Available' ? null : formData.customerName),
      description: formData.description.trim(),
      notes: formData.notes.trim(),
      createdAt: initialData ? initialData.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(unitPayload);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden text-left border border-slate-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building className="w-5 h-5 text-[#04A26F]" />
            <span>{initialData ? 'Edit Unit' : 'Add Unit'}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORM BODY */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-semibold text-slate-700 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* UNIT NAME */}
            <div className="space-y-1 sm:col-span-1">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Unit Name / Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Shop 01, Office 101, Flat 2A"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20 focus:border-[#04A26F] font-bold text-slate-900"
              />
            </div>

            {/* UNIT TYPE */}
            <div className="space-y-1 sm:col-span-1">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Unit Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20 focus:border-[#04A26F] bg-white cursor-pointer"
              >
                {unitTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* FLOOR */}
            <div className="space-y-1 sm:col-span-1">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Floor
              </label>
              <input
                type="text"
                placeholder="e.g. Ground, 1st Floor, 2nd Floor"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20 focus:border-[#04A26F]"
              />
            </div>

            {/* SIZE */}
            <div className="space-y-1 sm:col-span-1">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Size
              </label>
              <input
                type="text"
                placeholder="e.g. 1,200 sq ft, 85 sq m"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20 focus:border-[#04A26F]"
              />
            </div>

            {/* RENT AMOUNT & RENT TYPE */}
            <div className="space-y-1 sm:col-span-1">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Monthly Rent (£)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">£</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20 focus:border-[#04A26F] font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1 sm:col-span-1">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Rent Type
              </label>
              <select
                value={formData.priceType}
                onChange={(e) => setFormData({ ...formData, priceType: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20 focus:border-[#04A26F] bg-white cursor-pointer font-bold text-slate-900"
              >
                <option value="monthly_rent">Monthly Rent</option>
                <option value="quarterly_rent">Quarterly Rent</option>
                <option value="annual_rent">Annual Rent</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* STATUS */}
            <div className="space-y-1 sm:col-span-1">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20 focus:border-[#04A26F] bg-white cursor-pointer font-bold text-slate-900"
              >
                {unitStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* CUSTOMER NAME (when occupied/reserved) */}
            <div className="space-y-1 sm:col-span-1">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Current Customer (if assigned)
              </label>
              <input
                type="text"
                placeholder="Customer Name"
                disabled={formData.status === 'Available'}
                value={formData.customerName || ''}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20 focus:border-[#04A26F] disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>

            {/* DESCRIPTION */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Description
              </label>
              <textarea
                rows={2}
                placeholder="Unit description or key features..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20 focus:border-[#04A26F]"
              />
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-extrabold text-white bg-[#04A26F] hover:bg-[#038b5e] rounded-lg transition-all cursor-pointer shadow-xs focus:ring-2 focus:ring-[#04A26F]"
            >
              <Save className="w-4 h-4" />
              <span>Save Unit</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

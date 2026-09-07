import React from 'react';
import { FileText, Calendar, User, Hash } from 'lucide-react';
import { demoContacts } from '../../data/incomeData';

/**
 * InvoiceInformation Component
 * Section 1: Contact, Dates, Invoice Number matching screenshot 3.
 */
export function InvoiceInformation({ formData, setFormData, errors }) {
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-left">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <FileText className="w-5 h-5 text-[#00a36f]" />
        <h3 className="text-base font-extrabold text-slate-900">Invoice Information</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Contact */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>Contact</span>
            <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.contact || ''}
            onChange={(e) => handleChange('contact', e.target.value)}
            className={`w-full h-9 px-3 text-xs bg-slate-50 border rounded-lg text-slate-900 focus:bg-white focus:border-[#00a36f] focus:ring-1 focus:ring-[#00a36f] outline-none cursor-pointer transition-all ${
              errors.contact ? 'border-red-500 bg-red-50/50' : 'border-slate-200'
            }`}
          >
            <option value="">- Select -</option>
            {demoContacts.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.contact && (
            <p className="text-[11px] font-bold text-red-600 mt-0.5">{errors.contact}</p>
          )}
        </div>

        {/* Date */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Date</span>
            <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.date || ''}
            onChange={(e) => handleChange('date', e.target.value)}
            className={`w-full h-9 px-3 text-xs bg-slate-50 border rounded-lg text-slate-900 focus:bg-white focus:border-[#00a36f] outline-none cursor-pointer ${
              errors.date ? 'border-red-500 bg-red-50/50' : 'border-slate-200'
            }`}
          />
          {errors.date && (
            <p className="text-[11px] font-bold text-red-600 mt-0.5">{errors.date}</p>
          )}
        </div>

        {/* Due Date */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Due Date</span>
            <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.dueDate || ''}
            onChange={(e) => handleChange('dueDate', e.target.value)}
            className={`w-full h-9 px-3 text-xs bg-slate-50 border rounded-lg text-slate-900 focus:bg-white focus:border-[#00a36f] outline-none cursor-pointer ${
              errors.dueDate ? 'border-red-500 bg-red-50/50' : 'border-slate-200'
            }`}
          />
          {errors.dueDate && (
            <p className="text-[11px] font-bold text-red-600 mt-0.5">{errors.dueDate}</p>
          )}
        </div>

        {/* End Date (Optional) */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>End Date</span>
          </label>
          <input
            type="date"
            value={formData.endDate || ''}
            onChange={(e) => handleChange('endDate', e.target.value)}
            className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#00a36f] outline-none cursor-pointer"
          />
        </div>

        {/* Invoice Number */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <Hash className="w-3.5 h-3.5 text-slate-400" />
            <span>Invoice Number</span>
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.invoiceNumber || ''}
            onChange={(e) => handleChange('invoiceNumber', e.target.value)}
            placeholder="INV-1275"
            className={`w-full h-9 px-3 text-xs bg-amber-50/60 border rounded-lg text-slate-900 font-bold focus:bg-white focus:border-[#00a36f] outline-none ${
              errors.invoiceNumber ? 'border-red-500 bg-red-50/50' : 'border-amber-200'
            }`}
          />
          {errors.invoiceNumber && (
            <p className="text-[11px] font-bold text-red-600 mt-0.5">{errors.invoiceNumber}</p>
          )}
        </div>
      </div>
    </div>
  );
}

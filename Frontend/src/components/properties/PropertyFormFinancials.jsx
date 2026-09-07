import React from 'react';
import { PoundSterling } from 'lucide-react';
import { paymentTerms } from '../../data/propertiesData';

/**
 * PropertyFormFinancials Component
 * Projected Rents, Purchase Details, and Selling Details sections matching screenshot 2.
 */
export function PropertyFormFinancials({ formData, setFormData }) {
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value },
    }));
  };

  return (
    <div className="space-y-6 text-left">
      {/* 1. PROJECTED RENTS */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
        <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
          Projected Rents
        </h4>
        <p className="text-[11px] font-medium text-slate-500">
          Enter expected rents for this property.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Target Rent */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Target Rent</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">£</span>
              <input
                type="number"
                value={formData.targetRent || ''}
                onChange={(e) => handleChange('targetRent', e.target.value)}
                placeholder="0.00"
                className="w-full h-9 pl-7 pr-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-[#00a36f] outline-none"
              />
            </div>
          </div>

          {/* Payment Term */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Payment Term</label>
            <select
              value={formData.paymentTerm || 'Monthly'}
              onChange={(e) => handleChange('paymentTerm', e.target.value)}
              className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-[#00a36f] outline-none cursor-pointer"
            >
              <option value="">- Select -</option>
              {paymentTerms.map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. PURCHASE DETAILS */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
        <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
          Purchase Details
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Purchase Date */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Purchase Date</label>
            <input
              type="date"
              value={formData.purchase?.date || ''}
              onChange={(e) => handleNestedChange('purchase', 'date', e.target.value)}
              className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-[#00a36f] outline-none cursor-pointer"
            />
          </div>

          {/* Purchase Price */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Purchase Price</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">£</span>
              <input
                type="number"
                value={formData.purchase?.price || ''}
                onChange={(e) => handleNestedChange('purchase', 'price', e.target.value)}
                placeholder="0.00"
                className="w-full h-9 pl-7 pr-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-[#00a36f] outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. SELLING DETAILS */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
        <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
          Selling Details
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Selling Date */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Selling Date</label>
            <input
              type="date"
              value={formData.selling?.date || ''}
              onChange={(e) => handleNestedChange('selling', 'date', e.target.value)}
              className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-[#00a36f] outline-none cursor-pointer"
            />
          </div>

          {/* Selling Price */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Selling Price</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">£</span>
              <input
                type="number"
                value={formData.selling?.price || ''}
                onChange={(e) => handleNestedChange('selling', 'price', e.target.value)}
                placeholder="0.00"
                className="w-full h-9 pl-7 pr-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-[#00a36f] outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

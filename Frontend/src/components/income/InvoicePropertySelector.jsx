import React from 'react';
import { Building } from 'lucide-react';
import { demoPropertiesList } from '../../data/propertiesData';

/**
 * InvoicePropertySelector Component
 * Section 2: Property dropdown selector matching screenshot 3.
 */
export function InvoicePropertySelector({ formData, setFormData, errors }) {
  const handleChange = (value) => {
    setFormData((prev) => ({ ...prev, property: value }));
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-left">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <Building className="w-5 h-5 text-[#00a36f]" />
        <h3 className="text-base font-extrabold text-slate-900">Property</h3>
      </div>

      <div className="space-y-1 max-w-md">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
          <span>Property</span>
          <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.property || ''}
          onChange={(e) => handleChange(e.target.value)}
          className={`w-full h-9 px-3 text-xs bg-slate-50 border rounded-lg text-slate-900 focus:bg-white focus:border-[#00a36f] focus:ring-1 focus:ring-[#00a36f] outline-none cursor-pointer transition-all ${
            errors.property ? 'border-red-500 bg-red-50/50' : 'border-slate-200'
          }`}
        >
          <option value="">- Select Property -</option>
          {demoPropertiesList.map((prop) => (
            <option key={prop.id} value={prop.name || prop.reference}>
              {prop.name || prop.reference}
            </option>
          ))}
        </select>
        {errors.property && (
          <p className="text-[11px] font-bold text-red-600 mt-0.5">{errors.property}</p>
        )}
      </div>
    </div>
  );
}

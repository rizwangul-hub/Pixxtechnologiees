import React from 'react';
import { AlignLeft, Calendar, Tag } from 'lucide-react';
import { propertyTypes, furnishingTypes } from '../../data/propertiesData';

/**
 * PropertyFormDetails Component
 * Property Details section matching screenshot 2.
 */
export function PropertyFormDetails({ formData, setFormData, errors }) {
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
        <AlignLeft className="w-5 h-5 text-[#00a36f]" />
        <h3 className="text-base font-extrabold text-slate-900">Property Details</h3>
      </div>

      {/* Property Type */}
      <div className="space-y-1 text-left">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
          <span>Property Type</span>
          <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.propertyType || ''}
          onChange={(e) => handleChange('propertyType', e.target.value)}
          className={`w-full h-9 px-3 text-xs bg-slate-50 border rounded-lg text-slate-900 focus:bg-white focus:border-[#00a36f] focus:ring-1 focus:ring-[#00a36f] outline-none transition-all cursor-pointer ${
            errors.propertyType ? 'border-red-500 bg-red-50/50' : 'border-slate-200'
          }`}
        >
          <option value="">- Select -</option>
          {propertyTypes.filter((t) => t !== 'All').map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        {errors.propertyType && (
          <p className="text-[11px] font-bold text-red-600 mt-0.5">{errors.propertyType}</p>
        )}
      </div>

      {/* Furnishing */}
      <div className="space-y-1 text-left">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
          <span>Furnishing</span>
        </label>
        <select
          value={formData.furnishing || ''}
          onChange={(e) => handleChange('furnishing', e.target.value)}
          className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#00a36f] focus:ring-1 focus:ring-[#00a36f] outline-none transition-all cursor-pointer"
        >
          <option value="">- Select -</option>
          {furnishingTypes.filter((f) => f !== 'All').map((furn) => (
            <option key={furn} value={furn}>
              {furn}
            </option>
          ))}
        </select>
      </div>

      {/* Construction Date */}
      <div className="space-y-1 text-left">
        <label className="text-xs font-bold text-slate-700">Construction Date</label>
        <input
          type="date"
          value={formData.constructionDate || ''}
          onChange={(e) => handleChange('constructionDate', e.target.value)}
          className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#00a36f] outline-none cursor-pointer"
        />
      </div>
    </div>
  );
}

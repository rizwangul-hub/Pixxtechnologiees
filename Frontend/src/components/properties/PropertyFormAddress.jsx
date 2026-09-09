import React from 'react';
import { MapPin } from 'lucide-react';

/**
 * PropertyFormAddress Component
 * Address section matching screenshot 2.
 */
export function PropertyFormAddress({ formData, setFormData }) {
  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
        <MapPin className="w-5 h-5 text-[#00a36f]" />
        <h3 className="text-base font-extrabold text-slate-900">Address</h3>
      </div>

      {/* Street Address */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-700">Street Address</label>
        <textarea
          rows={3}
          value={formData.address?.streetAddress || ''}
          onChange={(e) => handleChange('streetAddress', e.target.value)}
          placeholder="Building number, street name..."
          className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#00a36f] outline-none transition-all resize-y"
        />
      </div>

      {/* Town / City */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-700">Town/City</label>
        <input
          type="text"
          value={formData.address?.townCity || ''}
          onChange={(e) => handleChange('townCity', e.target.value)}
          placeholder="e.g. Grays"
          className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#00a36f] outline-none"
        />
      </div>

      {/* County / Region */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-700">County/Region</label>
        <input
          type="text"
          value={formData.address?.countyRegion || ''}
          onChange={(e) => handleChange('countyRegion', e.target.value)}
          placeholder="e.g. Essex"
          className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#00a36f] outline-none"
        />
      </div>

      {/* Postcode */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-700">Postcode</label>
        <input
          type="text"
          value={formData.address?.postcode || ''}
          onChange={(e) => handleChange('postcode', e.target.value)}
          placeholder="e.g. RM17 5HF"
          className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#00a36f] outline-none uppercase"
        />
      </div>

      {/* Country */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-700">Country</label>
        <select
          value={formData.address?.country || 'United Kingdom'}
          onChange={(e) => handleChange('country', e.target.value)}
          className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#00a36f] outline-none cursor-pointer"
        >
          <option value="United Kingdom">United Kingdom</option>
          <option value="Ireland">Ireland</option>
          <option value="United States">United States</option>
          <option value="Other">Other</option>
        </select>
      </div>
    </div>
  );
}

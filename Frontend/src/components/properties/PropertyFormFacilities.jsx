import React from 'react';
import { Wrench, Car, ShieldCheck, Flame, Bell } from 'lucide-react';

/**
 * PropertyFormFacilities Component
 * Facilities section matching screenshot 2.
 */
export function PropertyFormFacilities({ formData, setFormData }) {
  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      facilities: { ...prev.facilities, [field]: value },
    }));
  };

  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
        <Wrench className="w-5 h-5 text-[#00a36f]" />
        <h3 className="text-base font-extrabold text-slate-900">Facilities</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-800">
        {/* Parking Spaces */}
        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <label className="flex items-center gap-2">
            <Car className="w-4 h-4 text-slate-500" />
            <span>Parking Spaces</span>
          </label>
          <input
            type="number"
            min="0"
            value={formData.facilities?.parkingSpaces ?? 0}
            onChange={(e) => handleChange('parkingSpaces', Number(e.target.value))}
            className="w-16 h-8 text-center bg-white border border-slate-300 rounded-md font-bold text-slate-900 focus:border-[#00a36f] outline-none"
          />
        </div>

        {/* Garage Checkbox */}
        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Car className="w-4 h-4 text-slate-500" />
            <span>Garage</span>
          </label>
          <input
            type="checkbox"
            checked={Boolean(formData.facilities?.garage)}
            onChange={(e) => handleChange('garage', e.target.checked)}
            className="w-4 h-4 rounded-md border-slate-300 text-[#00a36f] focus:ring-[#00a36f] cursor-pointer"
          />
        </div>

        {/* Smoke Alarm */}
        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <label className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-slate-500" />
            <span>Smoke Alarm</span>
          </label>
          <input
            type="number"
            min="0"
            value={formData.facilities?.smokeAlarm ?? 0}
            onChange={(e) => handleChange('smokeAlarm', Number(e.target.value))}
            className="w-16 h-8 text-center bg-white border border-slate-300 rounded-md font-bold text-slate-900 focus:border-[#00a36f] outline-none"
          />
        </div>

        {/* CO Alarm */}
        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <label className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            <span>CO Alarm</span>
          </label>
          <input
            type="number"
            min="0"
            value={formData.facilities?.coAlarm ?? 0}
            onChange={(e) => handleChange('coAlarm', Number(e.target.value))}
            className="w-16 h-8 text-center bg-white border border-slate-300 rounded-md font-bold text-slate-900 focus:border-[#00a36f] outline-none"
          />
        </div>

        {/* House Alarm Checkbox */}
        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200 sm:col-span-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Bell className="w-4 h-4 text-slate-500" />
            <span>House Alarm</span>
          </label>
          <input
            type="checkbox"
            checked={Boolean(formData.facilities?.houseAlarm)}
            onChange={(e) => handleChange('houseAlarm', e.target.checked)}
            className="w-4 h-4 rounded-md border-slate-300 text-[#00a36f] focus:ring-[#00a36f] cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}

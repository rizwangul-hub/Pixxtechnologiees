import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, X, Filter, Building, Flag, Tag } from 'lucide-react';
import { propertyTypes, furnishingTypes } from '../../data/propertiesData';

/**
 * PropertyFilters Component
 * Filter section matching screenshot 1 layout and fields.
 */
export function PropertyFilters({ filters, setFilters, onSearch, onClear }) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-left"
    >
      {/* BASIC FILTERS ROW: Search, Status, Property Type */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleChange('search', e.target.value)}
              placeholder="Search..."
              className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#00a36f] focus:ring-1 focus:ring-[#00a36f] outline-none transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Flag className="w-3.5 h-3.5 text-slate-400" />
            <span>Status</span>
          </label>
          <select
            value={filters.status || 'Any'}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#00a36f] focus:ring-1 focus:ring-[#00a36f] outline-none transition-all cursor-pointer"
          >
            <option value="Any">- Any -</option>
            <option value="Occupied">Occupied</option>
            <option value="Vacant">Vacant</option>
            <option value="Partially Occupied">Partially Occupied</option>
          </select>
        </div>

        {/* Property Type */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span>Property Type</span>
          </label>
          <select
            value={filters.propertyType || 'All'}
            onChange={(e) => handleChange('propertyType', e.target.value)}
            className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#00a36f] focus:ring-1 focus:ring-[#00a36f] outline-none transition-all cursor-pointer"
          >
            {propertyTypes.map((type) => (
              <option key={type} value={type}>
                {type === 'All' ? '- All -' : type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ADVANCED SEARCH TOGGLE LINK */}
      <div>
        <button
          type="button"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="inline-flex items-center gap-1 text-xs font-extrabold text-[#00a36f] hover:underline cursor-pointer focus:outline-none"
        >
          <span>{isAdvancedOpen ? 'Hide Advanced Search' : 'Show Advanced Search'}</span>
          {isAdvancedOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* COLLAPSIBLE ADVANCED FILTERS SECTION */}
      {isAdvancedOpen && (
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
          {/* Furnishing */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Furnishing</span>
            </label>
            <select
              value={filters.furnishing || 'All'}
              onChange={(e) => handleChange('furnishing', e.target.value)}
              className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#00a36f] focus:ring-1 focus:ring-[#00a36f] outline-none transition-all cursor-pointer"
            >
              {furnishingTypes.map((furn) => (
                <option key={furn} value={furn}>
                  {furn === 'All' ? '- All -' : furn}
                </option>
              ))}
            </select>
          </div>

          {/* Min Target Rent */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Min Target Rent (£)</label>
            <input
              type="number"
              value={filters.minTargetRent || ''}
              onChange={(e) => handleChange('minTargetRent', e.target.value)}
              placeholder="e.g. 1000"
              className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#00a36f] outline-none"
            />
          </div>

          {/* Max Target Rent */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Max Target Rent (£)</label>
            <input
              type="number"
              value={filters.maxTargetRent || ''}
              onChange={(e) => handleChange('maxTargetRent', e.target.value)}
              placeholder="e.g. 5000"
              className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#00a36f] outline-none"
            />
          </div>
        </div>
      )}

      {/* BUTTONS ROW: Clear Filter & Search */}
      <div className="flex items-center justify-start gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-all border border-slate-200 cursor-pointer shadow-2xs"
        >
          <X className="w-3.5 h-3.5" />
          <span>Clear Filter</span>
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-extrabold text-white bg-[#00a36f] hover:bg-[#008f61] active:bg-[#007a53] transition-all cursor-pointer shadow-xs focus:ring-2 focus:ring-[#00a36f]"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Search</span>
        </button>
      </div>
    </form>
  );
}

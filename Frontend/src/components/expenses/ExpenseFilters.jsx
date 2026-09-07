import React from 'react';
import { Search, Calendar, Building, User, PoundSterling, X, Filter } from 'lucide-react';
import { demoSuppliers, demoProperties } from '../../data/expensesData';

/**
 * ExpenseFilters Component
 * Filter form matching screenshot layout and fields.
 */
export function ExpenseFilters({ filters, setFilters, onSearch, onClear }) {
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
      {/* FILTER GRID ROW 1: Search, Supplier, Property */}
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
              placeholder="Search supplier, ref or property..."
              className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#00a36f] focus:ring-1 focus:ring-[#00a36f] outline-none transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Supplier */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>Supplier</span>
          </label>
          <select
            value={filters.supplier || 'All'}
            onChange={(e) => handleChange('supplier', e.target.value)}
            className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#00a36f] focus:ring-1 focus:ring-[#00a36f] outline-none transition-all cursor-pointer"
          >
            {demoSuppliers.map((sup) => (
              <option key={sup} value={sup}>
                {sup === 'All' ? '- All -' : sup}
              </option>
            ))}
          </select>
        </div>

        {/* Property */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span>Property</span>
          </label>
          <select
            value={filters.property || 'All'}
            onChange={(e) => handleChange('property', e.target.value)}
            className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#00a36f] focus:ring-1 focus:ring-[#00a36f] outline-none transition-all cursor-pointer"
          >
            {demoProperties.map((prop) => (
              <option key={prop} value={prop}>
                {prop === 'All' ? '- All -' : prop}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* FILTER GRID ROW 2: Date, Due Date, Paid Amount */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Date From & To */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Date</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => handleChange('dateFrom', e.target.value)}
              aria-label="Date From"
              className="w-full h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#00a36f] focus:ring-1 focus:ring-[#00a36f] outline-none transition-all cursor-pointer"
            />
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => handleChange('dateTo', e.target.value)}
              aria-label="Date To"
              className="w-full h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#00a36f] focus:ring-1 focus:ring-[#00a36f] outline-none transition-all cursor-pointer"
            />
          </div>
        </div>

        {/* Due Date From & To */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Due Date</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={filters.dueDateFrom || ''}
              onChange={(e) => handleChange('dueDateFrom', e.target.value)}
              aria-label="Due Date From"
              className="w-full h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#00a36f] focus:ring-1 focus:ring-[#00a36f] outline-none transition-all cursor-pointer"
            />
            <input
              type="date"
              value={filters.dueDateTo || ''}
              onChange={(e) => handleChange('dueDateTo', e.target.value)}
              aria-label="Due Date To"
              className="w-full h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#00a36f] focus:ring-1 focus:ring-[#00a36f] outline-none transition-all cursor-pointer"
            />
          </div>
        </div>

        {/* Paid Amount £ From & To */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <PoundSterling className="w-3.5 h-3.5 text-slate-400" />
            <span>Paid Amount</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={filters.paidAmountFrom ?? ''}
              onChange={(e) => handleChange('paidAmountFrom', e.target.value)}
              placeholder="£ From"
              className="w-full h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#00a36f] focus:ring-1 focus:ring-[#00a36f] outline-none transition-all"
            />
            <input
              type="number"
              value={filters.paidAmountTo ?? ''}
              onChange={(e) => handleChange('paidAmountTo', e.target.value)}
              placeholder="£ To"
              className="w-full h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#00a36f] focus:ring-1 focus:ring-[#00a36f] outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* FILTER GRID ROW 3: Due Amount & Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-1">
        {/* Due Amount £ From & To */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <PoundSterling className="w-3.5 h-3.5 text-slate-400" />
            <span>Due Amount</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={filters.dueAmountFrom ?? ''}
              onChange={(e) => handleChange('dueAmountFrom', e.target.value)}
              placeholder="£ From"
              className="w-full h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#00a36f] focus:ring-1 focus:ring-[#00a36f] outline-none transition-all"
            />
            <input
              type="number"
              value={filters.dueAmountTo ?? ''}
              onChange={(e) => handleChange('dueAmountTo', e.target.value)}
              placeholder="£ To"
              className="w-full h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#00a36f] focus:ring-1 focus:ring-[#00a36f] outline-none transition-all"
            />
          </div>
        </div>

        {/* Filler col for alignment on desktop */}
        <div className="hidden md:block" />

        {/* Filter Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 md:pt-0">
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
      </div>
    </form>
  );
}

import React from 'react';
import { Search as SearchIcon, RotateCcw, Calendar, DollarSign, Tag } from 'lucide-react';

export function PaymentFilters({ filters, setFilters, onSearch, onClear, isIncomeTab }) {
  const handleChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const searchByOptions = [
    '- All -',
    isIncomeTab ? 'Payer' : 'Supplier',
    'Reference',
    'Property',
    'Account',
  ];

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4 text-left">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <SearchIcon className="w-3.5 h-3.5 text-slate-400" />
            <span>Search</span>
          </label>
          <input
            type="text"
            placeholder="Search..."
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a36f]/20 focus:border-[#00a36f]"
          />
        </div>

        {/* Search By */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span>Search By</span>
          </label>
          <select
            value={filters.searchBy || '- All -'}
            onChange={(e) => handleChange('searchBy', e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a36f]/20 focus:border-[#00a36f] bg-white cursor-pointer"
          >
            {searchByOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Date From & To */}
        <div className="space-y-1 md:col-span-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Date Range</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              placeholder="From"
              value={filters.dateFrom || ''}
              onChange={(e) => handleChange('dateFrom', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a36f]/20 focus:border-[#00a36f]"
            />
            <input
              type="date"
              placeholder="To"
              value={filters.dateTo || ''}
              onChange={(e) => handleChange('dateTo', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a36f]/20 focus:border-[#00a36f]"
            />
          </div>
        </div>

        {/* Amount From & To */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
            <span>Amount (£)</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-bold">£</span>
              <input
                type="number"
                placeholder="From"
                value={filters.amountFrom || ''}
                onChange={(e) => handleChange('amountFrom', e.target.value)}
                className="w-full pl-6 pr-2 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a36f]/20 focus:border-[#00a36f]"
              />
            </div>
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-bold">£</span>
              <input
                type="number"
                placeholder="To"
                value={filters.amountTo || ''}
                onChange={(e) => handleChange('amountTo', e.target.value)}
                className="w-full pl-6 pr-2 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a36f]/20 focus:border-[#00a36f]"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-end gap-2 md:col-span-3 pt-1">
          <button
            type="button"
            onClick={onClear}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Filter</span>
          </button>
          <button
            type="button"
            onClick={onSearch}
            className="px-5 py-2 text-xs font-extrabold text-white bg-[#00a36f] hover:bg-[#008f61] active:bg-[#007a53] rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
          >
            <SearchIcon className="w-3.5 h-3.5 stroke-[3]" />
            <span>Search</span>
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Search as SearchIcon, RotateCcw, Tag, Calendar, UserCheck, Building } from 'lucide-react';

const alphabetList = [
  'All',
  '123',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
];

export function TenantFilters({ filters, setFilters, onSearch, onClear, properties = [] }) {
  const handleChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4 text-left">
      {/* TOP ROW FILTER CONTROLS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
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
            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a36f]/20 focus:border-[#00a36f]"
          />
        </div>

        {/* Search By */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span>Search By</span>
          </label>
          <select
            value={filters.searchBy || 'All'}
            onChange={(e) => handleChange('searchBy', e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a36f]/20 focus:border-[#00a36f] bg-white cursor-pointer"
          >
            <option value="All">All</option>
            <option value="Tenant Name">Tenant Name</option>
            <option value="Tenant Email">Tenant Email</option>
            <option value="Tenant Phone">Tenant Phone</option>
            <option value="Property Name">Property Name</option>
          </select>
        </div>

        {/* Birthday */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Birthday</span>
          </label>
          <select
            value={filters.birthday || '- Any -'}
            onChange={(e) => handleChange('birthday', e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a36f]/20 focus:border-[#00a36f] bg-white cursor-pointer"
          >
            <option value="- Any -">- Any -</option>
            <option value="This Month">This Month</option>
            <option value="Next Month">Next Month</option>
          </select>
        </div>

        {/* Tenant Status */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Tenant Status</span>
          </label>
          <select
            value={filters.status || '- Any -'}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a36f]/20 focus:border-[#00a36f] bg-white cursor-pointer"
          >
            <option value="- Any -">- Any -</option>
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
          </select>
        </div>

        {/* Property */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span>Property</span>
          </label>
          <select
            value={filters.property || '- Any -'}
            onChange={(e) => handleChange('property', e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a36f]/20 focus:border-[#00a36f] bg-white cursor-pointer truncate"
          >
            <option value="- Any -">- Any -</option>
            {properties.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ALPHABET BAR */}
      <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-slate-100 text-xs">
        {alphabetList.map((char) => {
          const isActive = (filters.alphabet || 'All') === char;
          return (
            <button
              key={char}
              type="button"
              onClick={() => handleChange('alphabet', char)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-50 text-[#00a36f] border border-emerald-200'
                  : 'text-sky-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {char}
            </button>
          );
        })}
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onClear}
          className="px-4 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear Filter</span>
        </button>

        <button
          type="button"
          onClick={onSearch}
          className="px-5 py-1.5 text-xs font-extrabold text-white bg-[#00a36f] hover:bg-[#008f61] active:bg-[#007a53] rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
        >
          <SearchIcon className="w-3.5 h-3.5 stroke-[3]" />
          <span>Search</span>
        </button>
      </div>
    </div>
  );
}

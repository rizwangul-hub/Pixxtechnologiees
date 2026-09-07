import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Briefcase, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function PortfolioSelector() {
  const { selectedPortfolio, setSelectedPortfolio, portfolios } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Selector Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 px-4 bg-slate-800/80 hover:bg-slate-700/80 active:bg-slate-700 text-white rounded-lg border border-slate-700/80 transition-all flex items-center gap-2.5 cursor-pointer outline-none focus:ring-2 focus:ring-[#00a36f] focus:ring-offset-2 focus:ring-offset-slate-900 shadow-xs"
        aria-label="Select property portfolio"
        aria-expanded={isOpen}
      >
        <Briefcase className="w-4 h-4 text-[#00a36f]" />
        <span className="text-xs sm:text-sm font-bold tracking-tight">{selectedPortfolio}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 rounded-xl bg-white text-slate-900 shadow-2xl border border-slate-200 z-50 overflow-hidden animate-fade-in py-1">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            Select Portfolio
          </div>
          <div className="py-1">
            {portfolios.map((portfolio) => {
              const isSelected = portfolio.name === selectedPortfolio;
              return (
                <button
                  key={portfolio.id}
                  type="button"
                  onClick={() => {
                    setSelectedPortfolio(portfolio.name);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3.5 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 text-[#00a36f]'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="truncate">{portfolio.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold">
                      {portfolio.count}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#00a36f]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

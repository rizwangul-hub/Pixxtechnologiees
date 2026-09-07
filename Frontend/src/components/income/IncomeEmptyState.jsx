import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';

/**
 * IncomeEmptyState Component
 * Centered empty state matching user specification.
 */
export function IncomeEmptyState() {
  return (
    <div className="min-h-[420px] bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center p-8 text-center space-y-4 my-4">
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#00a36f] flex items-center justify-center shadow-xs">
        <FileText className="w-8 h-8" />
      </div>

      <div className="max-w-md space-y-1.5">
        <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
          No Non-Rental Income Invoices
        </h3>
        <p className="text-xs sm:text-sm font-medium text-slate-500 leading-relaxed">
          There are no non-rental income invoices recorded in this portfolio.
        </p>
      </div>

      <div className="pt-2">
        <Link
          to="/income/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-[#00a36f] hover:bg-[#008f61] active:bg-[#007a53] transition-all cursor-pointer shadow-xs focus:ring-2 focus:ring-[#00a36f]"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Income</span>
        </Link>
      </div>
    </div>
  );
}

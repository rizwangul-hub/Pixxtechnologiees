import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, RefreshCw, FileText, Download } from 'lucide-react';

/**
 * ExpenseActionBar Component
 * Action buttons matching screenshot requirements using LandlordVision brand green #04A26F.
 */
export function ExpenseActionBar({ onExport }) {
  const handleExportClick = () => {
    if (onExport) {
      onExport();
    } else {
      alert('Exporting expense data to Excel file...');
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2.5">
      <Link
        to="/expenses/create"
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-extrabold text-white bg-[#00a36f] hover:bg-[#008f61] active:bg-[#007a53] transition-all cursor-pointer shadow-xs focus:ring-2 focus:ring-[#00a36f]"
      >
        <Plus className="w-4 h-4 stroke-[3]" />
        <span>Add Expense</span>
      </Link>

      <Link
        to="/expenses/repeating/create"
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-extrabold text-white bg-[#00a36f] hover:bg-[#008f61] active:bg-[#007a53] transition-all cursor-pointer shadow-xs focus:ring-2 focus:ring-[#00a36f]"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Add Repeating Expense</span>
      </Link>

      <Link
        to="/expenses/credit-note/create"
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-extrabold text-white bg-[#00a36f] hover:bg-[#008f61] active:bg-[#007a53] transition-all cursor-pointer shadow-xs focus:ring-2 focus:ring-[#00a36f]"
      >
        <FileText className="w-3.5 h-3.5" />
        <span>Add Credit Note</span>
      </Link>

      <button
        type="button"
        onClick={handleExportClick}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-extrabold text-white bg-[#00a36f] hover:bg-[#008f61] active:bg-[#007a53] transition-all cursor-pointer shadow-xs focus:ring-2 focus:ring-[#00a36f]"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Export to Excel</span>
      </button>
    </div>
  );
}

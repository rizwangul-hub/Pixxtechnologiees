import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * ExpensePagination Component
 * Pagination control with records-per-page dropdown selector.
 */
export function ExpensePagination({
  currentPage,
  totalPages,
  pageSize,
  totalRecords,
  onPageChange,
  onPageSizeChange,
}) {
  if (totalRecords === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 text-xs font-semibold text-slate-600">
      {/* Records Per Page Dropdown */}
      <div className="flex items-center gap-2">
        <span>Show</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="h-8 px-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-extrabold focus:border-[#00a36f] focus:ring-1 focus:ring-[#00a36f] outline-none cursor-pointer"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span>records on screen</span>
        <span className="text-slate-400 hidden sm:inline">|</span>
        <span className="text-slate-500 font-medium">
          Showing {Math.min((currentPage - 1) * pageSize + 1, totalRecords)} -{' '}
          {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} records
        </span>
      </div>

      {/* Page Navigation Controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`
                w-8 h-8 rounded-lg font-bold transition-all cursor-pointer text-xs
                ${
                  currentPage === page
                    ? 'bg-[#00a36f] text-white shadow-2xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }
              `}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

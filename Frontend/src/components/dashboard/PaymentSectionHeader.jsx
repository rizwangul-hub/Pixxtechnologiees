import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyFormatter';

/**
 * PaymentSectionHeader Component
 * Collapsible section header matching screenshot information architecture.
 */
export function PaymentSectionHeader({
  title,
  subtitle,
  count,
  totalAmount,
  isExpanded,
  onToggle,
  type = 'overdue',
}) {
  const isOverdue = type === 'overdue';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 text-left">
      {/* Title + Subtitle + Dynamic Count Badge + Chevron Toggle */}
      <div
        onClick={onToggle}
        className="flex items-center gap-2 cursor-pointer group select-none"
      >
        <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight group-hover:text-[#00a36f] transition-colors flex items-center gap-2">
          <span>{title}</span>
          {subtitle && (
            <span className="text-xs sm:text-sm font-semibold text-slate-500 font-sans">
              ({subtitle})
            </span>
          )}
          <span className="text-xs sm:text-sm font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
            ({count})
          </span>
        </h2>

        {/* Small Chevron Dropdown Toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="p-1 rounded-md text-slate-500 hover:text-slate-900 group-hover:bg-slate-100 transition-colors"
          aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 stroke-[2.5]" />
          ) : (
            <ChevronDown className="w-5 h-5 stroke-[2.5]" />
          )}
        </button>
      </div>

      {/* Top Right Summary Total (Shown at section header level) */}
      <div className="text-xs sm:text-sm font-semibold text-slate-600 flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/80 shrink-0">
        <span>{isOverdue ? 'Total Amount Overdue:' : 'Total Amount Upcoming:'}</span>
        <span className="font-black text-slate-900 text-sm sm:text-base">
          {formatCurrency(totalAmount)}
        </span>
      </div>
    </div>
  );
}

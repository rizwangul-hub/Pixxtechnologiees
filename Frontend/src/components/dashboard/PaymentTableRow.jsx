import React from 'react';
import { User, ChevronRight, Building } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyFormatter';
import { PaymentStatusBadge } from './PaymentStatusBadge';

/**
 * PaymentTableRow Component
 * Renders individual payment rows for desktop tables & cards for mobile screens.
 */
export function PaymentTableRow({ item, type, isExpense, onClickRow }) {
  const totalAmount =
    item.totalAmount ||
    item.amount ||
    (item.rentOverdue || 0) + (item.chargesOverdue || 0) ||
    (item.rent || 0) + (item.charges || 0);

  const handleRowClick = () => {
    if (onClickRow) onClickRow(item);
  };

  return (
    <>
      {/* DESKTOP / TABLET TR VIEW (hidden on small mobile screens) */}
      <tr
        onClick={handleRowClick}
        className="hidden md:table-row hover:bg-emerald-50/40 transition-colors duration-150 cursor-pointer group border-b border-slate-100 last:border-0"
      >
        {/* Payer / Supplier */}
        <td className="py-3.5 px-4 text-xs font-bold text-slate-800 text-left align-middle max-w-[240px] whitespace-normal leading-relaxed">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-slate-100 group-hover:bg-emerald-100 text-slate-600 group-hover:text-[#00a36f] transition-colors shrink-0">
              {isExpense ? <Building className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
            </span>
            <span className="group-hover:text-[#00a36f] transition-colors">
              {item.payer || item.supplier}
            </span>
          </div>
        </td>

        {/* Property (if applicable) */}
        {!isExpense && (
          <td className="py-3.5 px-4 text-xs font-medium text-slate-600 text-left align-middle max-w-[220px] whitespace-normal leading-relaxed">
            {item.property || '—'}
          </td>
        )}

        {/* Latest Days Overdue OR Due Date */}
        {type === 'overdue' ? (
          <td className="py-3.5 px-4 text-xs font-extrabold text-slate-900 text-center align-middle">
            {item.daysOverdue}
          </td>
        ) : (
          <td className="py-3.5 px-4 text-xs font-semibold text-slate-700 text-center align-middle">
            {item.dueDate}
          </td>
        )}

        {/* Overdue Rents / Upcoming Rent (if not expense) */}
        {!isExpense && type === 'overdue' && (
          <td className="py-3.5 px-4 text-xs font-bold text-slate-800 text-right align-middle whitespace-nowrap">
            <div className="flex items-center justify-end gap-1.5">
              <span>{formatCurrency(item.rentOverdue)}</span>
              <PaymentStatusBadge type="overdue" />
            </div>
          </td>
        )}

        {!isExpense && type === 'upcoming' && (
          <td className="py-3.5 px-4 text-xs font-bold text-slate-800 text-right align-middle whitespace-nowrap">
            {formatCurrency(item.rent)}
          </td>
        )}

        {/* Overdue Charges / Upcoming Charges (if not expense) */}
        {!isExpense && (
          <td className="py-3.5 px-4 text-xs font-medium text-slate-600 text-right align-middle whitespace-nowrap">
            {formatCurrency(type === 'overdue' ? item.chargesOverdue : item.charges)}
          </td>
        )}

        {/* Total Amount Overdue / Total Amount (Clickable) */}
        <td className="py-3.5 px-4 text-xs font-extrabold text-[#00a36f] text-right align-middle whitespace-nowrap group-hover:underline">
          {formatCurrency(totalAmount)}
        </td>

        {/* Status (For Upcoming) */}
        {type === 'upcoming' && (
          <td className="py-3.5 px-4 text-xs text-center align-middle">
            <PaymentStatusBadge type="upcoming" statusText={item.status} />
          </td>
        )}

        {/* Action Chevron */}
        <td className="py-3.5 px-3 text-center align-middle">
          <button
            type="button"
            className="p-1 rounded-md text-slate-400 group-hover:text-[#00a36f] group-hover:bg-emerald-100/50 transition-all cursor-pointer"
            aria-label="View payment details"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </td>
      </tr>

      {/* MOBILE CARD VIEW (shown on mobile screens < 768px) */}
      <div
        onClick={handleRowClick}
        className="md:hidden bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 cursor-pointer hover:border-[#00a36f] transition-all text-left"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-[#00a36f] shrink-0">
              {isExpense ? <Building className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </span>
            <div>
              <p className="text-xs font-extrabold text-slate-900 leading-snug">
                {item.payer || item.supplier}
              </p>
              {!isExpense && item.property && (
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">{item.property}</p>
              )}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {type === 'overdue' ? 'Days Overdue' : 'Due Date'}
            </span>
            <span className="font-extrabold text-slate-800">
              {type === 'overdue' ? `${item.daysOverdue} days` : item.dueDate}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Amount
            </span>
            <span className="font-black text-sm text-[#00a36f]">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

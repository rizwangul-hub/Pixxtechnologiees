import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyFormatter';
import { ExpenseStatusBadge } from './ExpenseStatusBadge';

/**
 * ExpenseTableRow Component
 * Desktop table row & mobile card layout renderer.
 */
export function ExpenseTableRow({ expense, isSelected, onToggleSelect }) {
  const navigate = useNavigate();

  const handleRowClick = (e) => {
    // Avoid triggering navigation if checkbox or supplier link is clicked
    if (e.target.closest('input[type="checkbox"]') || e.target.closest('a')) {
      return;
    }
    navigate(`/expenses/${expense.id}`);
  };

  const isOverdue = expense.amountDue > 0 && new Date(expense.dueDate) < new Date();

  return (
    <>
      {/* DESKTOP TABLE ROW (hidden on mobile < 768px) */}
      <tr
        onClick={handleRowClick}
        className={`
          hidden md:table-row hover:bg-emerald-50/40 transition-colors duration-150 cursor-pointer group border-b border-slate-100 last:border-0
          ${isSelected ? 'bg-emerald-50/70' : ''}
        `}
      >
        {/* Checkbox */}
        <td className="py-3 px-4 text-center align-middle w-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(expense.id)}
            className="w-4 h-4 rounded-md border-slate-300 text-[#00a36f] focus:ring-[#00a36f] cursor-pointer"
            aria-label={`Select expense ${expense.reference}`}
          />
        </td>

        {/* Supplier (Document icon + Supplier link) */}
        <td className="py-3.5 px-4 text-xs font-bold text-slate-900 text-left align-middle max-w-[200px] whitespace-normal">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400 group-hover:text-[#00a36f] shrink-0 transition-colors" />
            <Link
              to={`/suppliers/${expense.supplierId}`}
              className="text-[#00a36f] hover:underline truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {expense.supplierName}
            </Link>
          </div>
        </td>

        {/* Reference */}
        <td className="py-3.5 px-4 text-xs font-semibold text-slate-700 text-left align-middle">
          {expense.reference || '—'}
        </td>

        {/* Property */}
        <td className="py-3.5 px-4 text-xs font-medium text-slate-600 text-left align-middle max-w-[220px] whitespace-normal leading-relaxed">
          {expense.propertyName || '—'}
        </td>

        {/* Date */}
        <td className="py-3.5 px-4 text-xs font-medium text-slate-600 text-center align-middle whitespace-nowrap">
          {expense.date}
        </td>

        {/* Due Date */}
        <td className="py-3.5 px-4 text-xs font-bold text-center align-middle whitespace-nowrap">
          <span className={isOverdue ? 'text-red-600 font-extrabold' : 'text-slate-700'}>
            {expense.dueDate}
          </span>
        </td>

        {/* Amount Paid */}
        <td className="py-3.5 px-4 text-xs font-bold text-slate-900 text-right align-middle whitespace-nowrap">
          {formatCurrency(expense.amountPaid, expense.currency)}
        </td>

        {/* Amount Due */}
        <td className="py-3.5 px-4 text-xs font-extrabold text-right align-middle whitespace-nowrap">
          <span className={expense.amountDue > 0 ? 'text-red-600' : 'text-slate-500'}>
            {formatCurrency(expense.amountDue, expense.currency)}
          </span>
        </td>

        {/* Status */}
        <td className="py-3.5 px-4 text-center align-middle whitespace-nowrap">
          <ExpenseStatusBadge status={expense.status} isRepeating={expense.isRepeating} />
        </td>

        {/* Action */}
        <td className="py-3.5 px-3 text-center align-middle">
          <button
            type="button"
            className="p-1 rounded-md text-slate-400 group-hover:text-[#00a36f] group-hover:bg-emerald-100/50 transition-all cursor-pointer"
            aria-label="View expense details"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </td>
      </tr>

      {/* MOBILE CARD VIEW (shown on mobile screens < 768px) */}
      <div
        onClick={handleRowClick}
        className={`
          md:hidden bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 cursor-pointer hover:border-[#00a36f] transition-all text-left
          ${isSelected ? 'border-[#00a36f] bg-emerald-50/40' : ''}
        `}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(expense.id)}
              className="mt-0.5 w-4 h-4 rounded-md border-slate-300 text-[#00a36f] focus:ring-[#00a36f]"
            />
            <div>
              <Link
                to={`/suppliers/${expense.supplierId}`}
                className="text-xs font-black text-[#00a36f] hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {expense.supplierName}
              </Link>
              <p className="text-[11px] font-bold text-slate-800 mt-0.5">{expense.reference}</p>
              <p className="text-[11px] font-medium text-slate-500">{expense.propertyName}</p>
            </div>
          </div>
          <ExpenseStatusBadge status={expense.status} isRepeating={expense.isRepeating} />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Date / Due Date
            </span>
            <span className="font-semibold text-slate-700">
              {expense.date} /{' '}
              <span className={isOverdue ? 'text-red-600 font-bold' : ''}>{expense.dueDate}</span>
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Paid / Due
            </span>
            <span className="font-bold text-slate-900">
              {formatCurrency(expense.amountPaid)}{' '}
              <span className={expense.amountDue > 0 ? 'text-red-600 font-extrabold block' : 'text-slate-400'}>
                ({formatCurrency(expense.amountDue)} due)
              </span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

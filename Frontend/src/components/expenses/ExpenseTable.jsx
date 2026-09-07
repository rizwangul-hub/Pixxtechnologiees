import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { ExpenseTableRow } from './ExpenseTableRow';

/**
 * ExpenseTable Component
 * Responsive table container supporting sortable Date column and Select All checkbox.
 */
export function ExpenseTable({
  expenses = [],
  selectedIds = [],
  onToggleSelectAll,
  onToggleSelect,
  sortOrder = 'desc',
  onToggleSort,
}) {
  const isAllSelected = expenses.length > 0 && selectedIds.length === expenses.length;

  if (expenses.length === 0) {
    return null; // Empty state handles this cleanly
  }

  return (
    <div className="w-full">
      {/* DESKTOP TABLE */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 shadow-2xs bg-white">
        <table className="w-full text-left border-collapse min-w-[850px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              {/* Select All Checkbox */}
              <th className="py-3 px-4 text-center w-10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  className="w-4 h-4 rounded-md border-slate-300 text-[#00a36f] focus:ring-[#00a36f] cursor-pointer"
                  aria-label="Select all expenses"
                />
              </th>

              <th className="py-3 px-4 text-left">Supplier</th>
              <th className="py-3 px-4 text-left">Reference</th>
              <th className="py-3 px-4 text-left">Property</th>

              {/* Sortable Date Column */}
              <th className="py-3 px-4 text-center">
                <button
                  type="button"
                  onClick={onToggleSort}
                  className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <span>Date</span>
                  {sortOrder === 'asc' ? (
                    <ArrowUp className="w-3.5 h-3.5 text-[#00a36f]" />
                  ) : sortOrder === 'desc' ? (
                    <ArrowDown className="w-3.5 h-3.5 text-[#00a36f]" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </th>

              <th className="py-3 px-4 text-center">Due Date</th>
              <th className="py-3 px-4 text-right">Amount Paid</th>
              <th className="py-3 px-4 text-right">Amount Due</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-3 text-center w-12">
                <span className="sr-only">Action</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map((expense) => (
              <ExpenseTableRow
                key={expense.id}
                expense={expense}
                isSelected={selectedIds.includes(expense.id)}
                onToggleSelect={onToggleSelect}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARD LIST */}
      <div className="md:hidden space-y-3">
        {expenses.map((expense) => (
          <ExpenseTableRow
            key={expense.id}
            expense={expense}
            isSelected={selectedIds.includes(expense.id)}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>
    </div>
  );
}

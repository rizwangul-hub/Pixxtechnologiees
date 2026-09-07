import React from 'react';
import { PaymentTable } from './PaymentTable';
import { ViewAllButton } from './ViewAllButton';
import { formatCurrency } from '../../utils/currencyFormatter';

/**
 * PaymentSubsection Component
 * Subsection container for "Rents and Charges" and "Property Expenses"
 */
export function PaymentSubsection({
  title,
  totalAmount,
  items = [],
  type = 'overdue',
  isExpense = false,
  viewAllRoute,
  onClickRow,
}) {
  const isOverdue = type === 'overdue';

  return (
    <div className="space-y-3 pt-2 text-left">
      {/* Subsection Header Bar */}
      <div className="bg-slate-100/80 px-4 py-2.5 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 tracking-tight">
          {title}
        </h4>

        <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
          <span>{isOverdue ? 'Total Amount Overdue:' : 'Total Amount Upcoming:'}</span>
          <span className="font-extrabold text-slate-900 text-sm">
            {formatCurrency(totalAmount)}
          </span>
        </div>
      </div>

      {/* Subsection Table / Cards */}
      <PaymentTable
        items={items}
        type={type}
        isExpense={isExpense}
        onClickRow={onClickRow}
      />

      {/* View All Action Button */}
      {viewAllRoute && items.length > 0 && <ViewAllButton to={viewAllRoute} />}
    </div>
  );
}

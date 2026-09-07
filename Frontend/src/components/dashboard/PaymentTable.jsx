import React from 'react';
import { PaymentTableRow } from './PaymentTableRow';

/**
 * PaymentTable Component
 * Responsive table layout for desktop and adaptive card list for mobile viewports.
 */
export function PaymentTable({ items = [], type = 'overdue', isExpense = false, onClickRow }) {
  if (!items || items.length === 0) {
    return (
      <div className="py-8 px-4 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 my-2">
        <p className="text-xs font-bold text-slate-500">
          {type === 'overdue'
            ? isExpense
              ? 'No overdue property expenses. You are all caught up.'
              : 'No overdue rent payments. You are all caught up.'
            : isExpense
              ? 'No upcoming property expenses.'
              : 'No upcoming rent payments in the next 30 days.'}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* DESKTOP & TABLET TABLE (hidden on small mobile screens) */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 shadow-2xs bg-white">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4 text-left">
                {isExpense ? 'Supplier' : 'Payer'}
              </th>

              {!isExpense && <th className="py-3 px-4 text-left">Property</th>}

              <th className="py-3 px-4 text-center">
                {type === 'overdue' ? 'Latest Days Overdue' : 'Due Date'}
              </th>

              {!isExpense && (
                <th className="py-3 px-4 text-right">
                  {type === 'overdue' ? 'Rents Overdue' : 'Rent'}
                </th>
              )}

              {!isExpense && (
                <th className="py-3 px-4 text-right">
                  {type === 'overdue' ? 'Charges Overdue' : 'Charges'}
                </th>
              )}

              <th className="py-3 px-4 text-right">
                {type === 'overdue' ? 'Total Amount Overdue' : 'Total Amount'}
              </th>

              {type === 'upcoming' && <th className="py-3 px-4 text-center">Status</th>}

              <th className="py-3 px-3 text-center w-12">
                <span className="sr-only">Action</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <PaymentTableRow
                key={item.id}
                item={item}
                type={type}
                isExpense={isExpense}
                onClickRow={onClickRow}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARD LIST (shown on screens < 768px) */}
      <div className="md:hidden space-y-3">
        {items.map((item) => (
          <PaymentTableRow
            key={item.id}
            item={item}
            type={type}
            isExpense={isExpense}
            onClickRow={onClickRow}
          />
        ))}
      </div>
    </div>
  );
}

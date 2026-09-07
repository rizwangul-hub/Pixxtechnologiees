import React from 'react';
import { IncomeTableRow } from './IncomeTableRow';

/**
 * IncomeTable Component
 * Responsive table container for displaying saved non-rental income invoices.
 */
export function IncomeTable({ invoices = [] }) {
  if (invoices.length === 0) return null;

  return (
    <div className="w-full space-y-3">
      {/* DESKTOP TABLE */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 shadow-2xs bg-white">
        <table className="w-full text-left border-collapse min-w-[750px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4 text-left">Invoice Number</th>
              <th className="py-3 px-4 text-left">Contact</th>
              <th className="py-3 px-4 text-left">Property</th>
              <th className="py-3 px-4 text-center">Date</th>
              <th className="py-3 px-4 text-center">Due Date</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map((inv) => (
              <IncomeTableRow key={inv.id} invoice={inv} />
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARD LIST */}
      <div className="md:hidden space-y-3">
        {invoices.map((inv) => (
          <IncomeTableRow key={inv.id} invoice={inv} />
        ))}
      </div>
    </div>
  );
}

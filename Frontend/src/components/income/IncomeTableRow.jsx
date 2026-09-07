import React from 'react';
import { FileText, CheckCircle2, Clock } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyFormatter';

/**
 * IncomeTableRow Component
 * Renders individual row for saved income invoices.
 */
export function IncomeTableRow({ invoice }) {
  const isPaid = invoice.isPaid || invoice.status === 'Paid';

  return (
    <>
      {/* DESKTOP ROW */}
      <tr className="hidden md:table-row hover:bg-emerald-50/40 transition-colors duration-150 border-b border-slate-100 last:border-0">
        <td className="py-3.5 px-4 text-xs font-black text-slate-900 text-left align-middle">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#00a36f] shrink-0" />
            <span>{invoice.invoiceNumber}</span>
          </div>
        </td>

        <td className="py-3.5 px-4 text-xs font-bold text-slate-800 text-left align-middle">
          {invoice.contact}
        </td>

        <td className="py-3.5 px-4 text-xs font-medium text-slate-600 text-left align-middle max-w-[220px] truncate">
          {invoice.property}
        </td>

        <td className="py-3.5 px-4 text-xs font-medium text-slate-600 text-center align-middle">
          {invoice.date}
        </td>

        <td className="py-3.5 px-4 text-xs font-bold text-slate-700 text-center align-middle">
          {invoice.dueDate}
        </td>

        <td className="py-3.5 px-4 text-xs font-black text-[#00a36f] text-right align-middle">
          {formatCurrency(invoice.total, invoice.currency)}
        </td>

        <td className="py-3.5 px-4 text-center align-middle">
          {isPaid ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Paid</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-3.5 h-3.5" />
              <span>Awaiting Payment</span>
            </span>
          )}
        </td>
      </tr>

      {/* MOBILE CARD */}
      <div className="md:hidden bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-left">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-xs font-black text-[#00a36f] flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              {invoice.invoiceNumber}
            </span>
            <p className="text-xs font-bold text-slate-900 mt-0.5">{invoice.contact}</p>
            <p className="text-[11px] font-medium text-slate-500">{invoice.property}</p>
          </div>

          {isPaid ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Paid
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              Awaiting
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Date / Due Date
            </span>
            <span className="font-semibold text-slate-700">
              {invoice.date} / {invoice.dueDate}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Amount
            </span>
            <span className="font-black text-sm text-[#00a36f]">
              {formatCurrency(invoice.total)}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

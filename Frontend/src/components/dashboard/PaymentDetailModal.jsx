import React from 'react';
import { X, User, Building, Calendar, AlertTriangle, CheckCircle2, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyFormatter';

/**
 * PaymentDetailModal Component
 * Interactive placeholder modal displaying payment item details when clicking table rows.
 */
export function PaymentDetailModal({ item, onClose }) {
  if (!item) return null;

  const isExpense = Boolean(item.supplier);
  const totalAmount = item.totalAmount || item.amount || (item.rentOverdue || 0) + (item.chargesOverdue || 0) || (item.rent || 0) + (item.charges || 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#00a36f]" />
            <h3 className="text-base font-extrabold tracking-tight">
              {isExpense ? 'Expense Payment Record' : 'Rent Payment Details'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-left text-slate-800">
          {/* Main Hero Amount Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Outstanding
              </p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">
                {formatCurrency(totalAmount)}
              </p>
            </div>
            {item.daysOverdue ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                {item.daysOverdue} Days Overdue
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-[#00a36f] border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Due {item.dueDate}
              </span>
            )}
          </div>

          {/* Grid Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
            <div className="space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider block">
                {isExpense ? 'Supplier' : 'Payer / Tenant'}
              </span>
              <p className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-500 shrink-0" />
                {item.payer || item.supplier}
              </p>
            </div>

            {item.property && (
              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider block">
                  Property
                </span>
                <p className="text-sm font-semibold text-slate-800 flex items-start gap-1.5">
                  <Building className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  {item.property}
                </p>
              </div>
            )}

            {!isExpense && item.rentOverdue !== undefined && (
              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider block">
                  Rents Overdue
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {formatCurrency(item.rentOverdue)}
                </p>
              </div>
            )}

            {!isExpense && item.chargesOverdue !== undefined && (
              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider block">
                  Charges Overdue
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {formatCurrency(item.chargesOverdue)}
                </p>
              </div>
            )}

            {!isExpense && item.rent !== undefined && (
              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider block">
                  Upcoming Rent
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {formatCurrency(item.rent)}
                </p>
              </div>
            )}

            {item.dueDate && (
              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider block">
                  Due Date
                </span>
                <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                  {item.dueDate}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg shadow-2xs hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              alert(`Action: Recording payment for ${item.payer || item.supplier}`);
              onClose();
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-[#00a36f] hover:bg-[#008f61] rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            Record Payment
          </button>
        </div>
      </div>
    </div>
  );
}

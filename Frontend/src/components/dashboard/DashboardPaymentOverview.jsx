import React from 'react';
import { formatCurrency } from '../../utils/currencyFormatter';
import { DollarSign, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export function DashboardPaymentOverview({ expected, paid, pending, overdue }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
      <div>
        <h3 className="text-base font-bold text-gray-900">Payment Overview</h3>
        <p className="text-xs text-gray-500">Current month collection & dues status</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Expected This Month
          </span>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(expected)}</p>
        </div>

        <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
          <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Paid This Month</span>
          </span>
          <p className="text-lg font-bold text-emerald-700">{formatCurrency(paid)}</p>
        </div>

        <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
          <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Amount</span>
          </span>
          <p className="text-lg font-bold text-amber-700">{formatCurrency(pending)}</p>
        </div>

        <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 space-y-1">
          <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider block flex items-center space-x-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Overdue Amount</span>
          </span>
          <p className="text-lg font-bold text-rose-700">{formatCurrency(overdue)}</p>
        </div>
      </div>
    </div>
  );
}

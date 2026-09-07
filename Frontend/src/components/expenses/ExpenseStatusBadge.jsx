import React from 'react';
import { CheckCircle2, Clock, RefreshCw } from 'lucide-react';

/**
 * ExpenseStatusBadge Component
 * Renders clear status badges (Fully Paid, Awaiting Payment, Repeating).
 */
export function ExpenseStatusBadge({ status, isRepeating }) {
  if (isRepeating || status === 'repeating') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-teal-50 text-[#00a36f] border border-teal-200">
        <RefreshCw className="w-3 h-3" />
        <span>Repeating</span>
      </span>
    );
  }

  if (status === 'awaiting_payment') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3 h-3" />
        <span>Awaiting Payment</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle2 className="w-3 h-3" />
      <span>Fully Paid</span>
    </span>
  );
}

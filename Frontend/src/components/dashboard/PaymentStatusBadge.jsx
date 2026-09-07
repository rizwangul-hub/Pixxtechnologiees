import React from 'react';

/**
 * PaymentStatusBadge Component
 * Renders clear, subtle status indicators (red dot for overdue, badges for upcoming/due soon).
 */
export function PaymentStatusBadge({ type, statusText }) {
  if (type === 'overdue') {
    return (
      <span className="inline-flex items-center gap-1 text-slate-700" title="Payment overdue">
        <span
          className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-xs"
          aria-hidden="true"
        />
        <span className="sr-only">Payment overdue</span>
      </span>
    );
  }

  if (statusText === 'Due Soon') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
        Due Soon
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
      Upcoming
    </span>
  );
}

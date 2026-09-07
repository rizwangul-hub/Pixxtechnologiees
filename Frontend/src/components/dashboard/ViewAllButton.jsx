import React from 'react';
import { Link } from 'react-router-dom';

/**
 * ViewAllButton Component
 * Subtle, professional link button for expanding to complete routes.
 */
export function ViewAllButton({ to, label = 'View All' }) {
  return (
    <div className="flex justify-end pt-3 pb-1">
      <Link
        to={to}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-all border border-slate-200 cursor-pointer shadow-2xs focus:ring-2 focus:ring-[#00a36f] outline-none"
      >
        <span>{label}</span>
      </Link>
    </div>
  );
}

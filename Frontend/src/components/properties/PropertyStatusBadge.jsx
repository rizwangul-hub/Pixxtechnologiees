import React from 'react';

/**
 * PropertyStatusBadge Component
 * Renders status badges for Occupied, Vacant, Partially Occupied, and Not Available.
 */
export function PropertyStatusBadge({ status }) {
  if (status === 'Occupied') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        Occupied
      </span>
    );
  }

  if (status === 'Vacant') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
        Vacant
      </span>
    );
  }

  if (status === 'Partially Occupied') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
        Partially Occupied
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
      Not Available
    </span>
  );
}

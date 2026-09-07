import React from 'react';

/**
 * PaymentSkeleton Component
 * Skeleton loader state for future API integration.
 */
export function PaymentSkeleton() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-6 w-64 bg-slate-200 rounded-md" />
        <div className="h-6 w-40 bg-slate-200 rounded-md" />
      </div>
      <div className="space-y-2 pt-4">
        <div className="h-10 w-full bg-slate-100 rounded-xl" />
        <div className="h-12 w-full bg-slate-100 rounded-xl" />
        <div className="h-12 w-full bg-slate-100 rounded-xl" />
        <div className="h-12 w-full bg-slate-100 rounded-xl" />
      </div>
    </div>
  );
}

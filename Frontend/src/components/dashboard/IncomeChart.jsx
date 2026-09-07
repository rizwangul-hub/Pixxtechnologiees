import React from 'react';

export function IncomeChart() {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between text-left space-y-4">
      <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
        Rental Income within Last Month
      </h3>

      {/* SVG Ring Chart */}
      <div className="relative flex items-center justify-center py-2">
        <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-slate-100"
            strokeWidth="4"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            stroke="#00a36f"
            strokeWidth="5"
            strokeDasharray="92, 100"
            strokeLinecap="round"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-xl font-extrabold text-slate-900">&pound;48,250</span>
          <span className="text-[10px] font-semibold uppercase text-slate-400">Total Collected</span>
        </div>
      </div>

      {/* Legend / Subtitle */}
      <div className="flex items-center justify-center gap-2 text-xs font-semibold pt-2 border-t border-slate-100">
        <span className="w-3 h-3 rounded-full bg-[#00a36f]" />
        <span className="text-slate-700">127 Southend Road (Shop &amp; Flats)</span>
      </div>
    </div>
  );
}

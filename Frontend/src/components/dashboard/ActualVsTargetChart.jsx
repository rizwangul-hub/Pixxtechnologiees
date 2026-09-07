import React from 'react';

export function ActualVsTargetChart() {
  const data = [
    { label: 'Lower than Target', percentage: 6, color: '#f97316' },
    { label: 'Exceeds Target', percentage: 8, color: '#f59e0b' },
    { label: 'Non-Comparable', percentage: 86, color: '#2563eb' },
  ];

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between text-left space-y-4">
      <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
        Actual Rents vs Target Rents
      </h3>

      {/* SVG Donut Chart */}
      <div className="relative flex items-center justify-center py-2">
        <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-slate-100"
            strokeWidth="4"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          {/* Non-Comparable (86%) */}
          <path
            stroke="#2563eb"
            strokeWidth="4.5"
            strokeDasharray="86, 100"
            strokeLinecap="round"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          {/* Exceeds Target (8%) */}
          <path
            stroke="#f59e0b"
            strokeWidth="4.5"
            strokeDasharray="8, 100"
            strokeDashoffset="-86"
            strokeLinecap="round"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          {/* Lower than Target (6%) */}
          <path
            stroke="#f97316"
            strokeWidth="4.5"
            strokeDasharray="6, 100"
            strokeDashoffset="-94"
            strokeLinecap="round"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-xl font-extrabold text-slate-900">86%</span>
          <span className="text-[10px] font-semibold uppercase text-slate-400">On Target</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 text-[11px] font-semibold pt-2 border-t border-slate-100">
        {data.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-slate-700">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

import React from 'react';

export function OccupancyChart() {
  const data = [
    { label: 'Occupied', count: 124, percentage: 74, color: '#00a36f' },
    { label: 'Vacant', count: 44, percentage: 26, color: '#f97316' },
  ];

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between text-left space-y-4">
      <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
        Property Occupancy Overview
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
          {/* Occupied Slice (74%) */}
          <path
            stroke="#00a36f"
            strokeWidth="4.5"
            strokeDasharray="74, 100"
            strokeLinecap="round"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          {/* Vacant Slice (26%) */}
          <path
            stroke="#f97316"
            strokeWidth="4.5"
            strokeDasharray="26, 100"
            strokeDashoffset="-74"
            strokeLinecap="round"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-extrabold text-slate-900">74%</span>
          <span className="text-[10px] font-semibold uppercase text-slate-400">Occupied</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs font-semibold pt-2 border-t border-slate-100">
        {data.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-slate-700">{item.label}</span>
            <span className="text-slate-400 font-normal">({item.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

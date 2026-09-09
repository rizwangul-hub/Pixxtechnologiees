import React from 'react';
import { Home, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export function DashboardOccupancyChart({ totalUnits, occupied, available, reserved }) {
  const total = totalUnits || 1;
  const occupiedPct = Math.round((occupied / total) * 100) || 0;
  const availablePct = Math.round((available / total) * 100) || 0;
  const reservedPct = Math.round((reserved / total) * 100) || 0;

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900">Occupancy Overview</h3>
          <p className="text-xs text-gray-500">Unit availability ratio across portfolio</p>
        </div>
        <span className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
          Total Units: {totalUnits}
        </span>
      </div>

      {/* Visual Bar */}
      <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex">
        <div
          style={{ width: `${occupiedPct}%` }}
          className="bg-[#04A26F] h-full transition-all duration-500"
          title={`Occupied: ${occupied} (${occupiedPct}%)`}
        />
        <div
          style={{ width: `${availablePct}%` }}
          className="bg-amber-400 h-full transition-all duration-500"
          title={`Available: ${available} (${availablePct}%)`}
        />
        <div
          style={{ width: `${reservedPct}%` }}
          className="bg-blue-400 h-full transition-all duration-500"
          title={`Reserved: ${reserved} (${reservedPct}%)`}
        />
      </div>

      {/* Legend Stats Grid */}
      <div className="grid grid-cols-3 gap-2 text-center pt-2">
        <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
          <div className="text-xs font-semibold text-emerald-800 flex items-center justify-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Occupied</span>
          </div>
          <p className="text-lg font-bold text-emerald-900 mt-1">{occupied}</p>
          <p className="text-[11px] text-emerald-700 font-medium">{occupiedPct}%</p>
        </div>

        <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-100">
          <div className="text-xs font-semibold text-amber-800 flex items-center justify-center space-x-1">
            <Home className="w-3.5 h-3.5" />
            <span>Available</span>
          </div>
          <p className="text-lg font-bold text-amber-900 mt-1">{available}</p>
          <p className="text-[11px] text-amber-700 font-medium">{availablePct}%</p>
        </div>

        <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100">
          <div className="text-xs font-semibold text-blue-800 flex items-center justify-center space-x-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Reserved</span>
          </div>
          <p className="text-lg font-bold text-blue-900 mt-1">{reserved}</p>
          <p className="text-[11px] text-blue-700 font-medium">{reservedPct}%</p>
        </div>
      </div>
    </div>
  );
}

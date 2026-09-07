import React from 'react';
import { PropertyTableRow } from './PropertyTableRow';

/**
 * PropertyTable Component
 * Responsive table container for properties list.
 */
export function PropertyTable({ properties = [] }) {
  if (properties.length === 0) return null;

  return (
    <div className="w-full">
      {/* DESKTOP TABLE */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 shadow-2xs bg-white">
        <table className="w-full text-left border-collapse min-w-[750px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4 text-left">Property</th>
              <th className="py-3 px-4 text-left">Furnishing</th>
              <th className="py-3 px-4 text-center">Construction Date</th>
              <th className="py-3 px-4 text-center">Habitable Rooms</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Number of Tenancies</th>
              <th className="py-3 px-3 text-center w-12">
                <span className="sr-only">Action</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {properties.map((prop) => (
              <PropertyTableRow key={prop.id} property={prop} />
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARD LIST */}
      <div className="md:hidden space-y-3">
        {properties.map((prop) => (
          <PropertyTableRow key={prop.id} property={prop} />
        ))}
      </div>
    </div>
  );
}

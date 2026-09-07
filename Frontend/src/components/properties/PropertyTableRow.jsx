import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { PropertyStatusBadge } from './PropertyStatusBadge';

/**
 * PropertyTableRow Component
 * Desktop table row and mobile card view.
 */
export function PropertyTableRow({ property }) {
  const navigate = useNavigate();

  const handleRowClick = (e) => {
    // Avoid re-navigating if inner link is clicked
    if (e.target.closest('a')) return;
    navigate(`/properties/${property.id}`);
  };

  const tenancyDisplay = `${property.activeTenanciesCount || 0} (${property.totalUnitsCount || 0})`;

  return (
    <>
      {/* DESKTOP TABLE ROW (hidden on mobile < 768px) */}
      <tr
        onClick={handleRowClick}
        className="hidden md:table-row hover:bg-emerald-50/40 transition-colors duration-150 cursor-pointer group border-b border-slate-100 last:border-0"
      >
        {/* Property Reference (Link) */}
        <td className="py-3.5 px-4 text-xs font-extrabold text-slate-900 text-left align-middle max-w-[280px] whitespace-normal leading-relaxed">
          <div className="flex items-start gap-2">
            <Home className="w-4 h-4 text-slate-400 group-hover:text-[#00a36f] shrink-0 mt-0.5 transition-colors" />
            <Link
              to={`/properties/${property.id}`}
              className="text-[#00a36f] hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {property.reference}
            </Link>
          </div>
        </td>

        {/* Furnishing */}
        <td className="py-3.5 px-4 text-xs font-semibold text-slate-700 text-left align-middle whitespace-nowrap">
          {property.furnishing || '—'}
        </td>

        {/* Construction Date */}
        <td className="py-3.5 px-4 text-xs font-medium text-slate-600 text-center align-middle whitespace-nowrap">
          {property.constructionDate || 'N/A'}
        </td>

        {/* Habitable Rooms */}
        <td className="py-3.5 px-4 text-xs font-bold text-slate-800 text-center align-middle whitespace-nowrap">
          {property.habitableRooms || 0}
        </td>

        {/* Status */}
        <td className="py-3.5 px-4 text-center align-middle whitespace-nowrap">
          <PropertyStatusBadge status={property.status} />
        </td>

        {/* Number of Tenancies */}
        <td className="py-3.5 px-4 text-xs font-extrabold text-slate-800 text-right align-middle whitespace-nowrap">
          <div className="flex items-center justify-end gap-1">
            <span>{tenancyDisplay}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#00a36f]" />
          </div>
        </td>

        {/* Action */}
        <td className="py-3.5 px-3 text-center align-middle">
          <button
            type="button"
            className="p-1 rounded-md text-slate-400 group-hover:text-[#00a36f] group-hover:bg-emerald-100/50 transition-all cursor-pointer"
            aria-label="View property details"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </td>
      </tr>

      {/* MOBILE CARD VIEW (shown on mobile screens < 768px) */}
      <div
        onClick={handleRowClick}
        className="md:hidden bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 cursor-pointer hover:border-[#00a36f] transition-all text-left"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <Home className="w-4 h-4 text-[#00a36f] shrink-0 mt-0.5" />
            <Link
              to={`/properties/${property.id}`}
              className="text-xs font-black text-[#00a36f] hover:underline leading-snug"
              onClick={(e) => e.stopPropagation()}
            >
              {property.reference}
            </Link>
          </div>
          <PropertyStatusBadge status={property.status} />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Furnishing / Rooms
            </span>
            <span className="font-semibold text-slate-700">
              {property.furnishing || 'None'} ({property.habitableRooms || 0} rooms)
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Tenancies
            </span>
            <span className="font-extrabold text-[#00a36f]">
              {tenancyDisplay}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

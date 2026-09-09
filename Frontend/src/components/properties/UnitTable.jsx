import React from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyFormatter';

export function UnitTable({ units, onViewUnit, onEditUnit, onDeleteUnit }) {
  const getBadgeStyle = (status) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Occupied':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Reserved':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Maintenance':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden text-left">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Unit</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Floor</th>
              <th className="py-3 px-4">Rent</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Tenant</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {units.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                  No units found in this property. Click "+ Add Unit" above to add one.
                </td>
              </tr>
            ) : (
              units.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{u.name}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-600">{u.type}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-600">{u.floor || '—'}</td>
                  <td className="py-3.5 px-4 font-extrabold text-[#04A26F]">
                    {formatCurrency(u.price)}
                    {u.priceType === 'monthly_rent' || !u.priceType ? (
                      <span className="text-[10px] font-normal text-slate-400 block">/month</span>
                    ) : u.priceType === 'quarterly_rent' ? (
                      <span className="text-[10px] font-normal text-slate-400 block">/quarter</span>
                    ) : u.priceType === 'annual_rent' ? (
                      <span className="text-[10px] font-normal text-slate-400 block">/year</span>
                    ) : null}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getBadgeStyle(
                        u.status
                      )}`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">
                    {u.customerName ? (
                      <span className="font-bold text-blue-900">{u.customerName}</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onViewUnit(u)}
                        className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1"
                        title="View Unit"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditUnit(u)}
                        className="p-1 text-slate-500 hover:text-[#04A26F] hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                        title="Edit Unit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteUnit(u.id)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                        title="Delete Unit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

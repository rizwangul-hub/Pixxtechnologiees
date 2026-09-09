import React from 'react';
import { X, Building, UserCheck, User, Calendar, DollarSign, Tag, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyFormatter';

export function UnitDetailsModal({ isOpen, onClose, unit, propertyName, onAssignCustomer }) {
  if (!isOpen || !unit) return null;

  const isAvailable = unit.status === 'Available';
  const isOccupied = unit.status === 'Occupied';
  const isReserved = unit.status === 'Reserved';
  const isMaintenance = unit.status === 'Maintenance';

  const getBadgeClass = (status) => {
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
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden text-left border border-slate-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-[#04A26F]">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">{unit.name}</h2>
              <p className="text-xs font-semibold text-slate-500">{propertyName || 'Property Unit'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 space-y-6 text-xs text-slate-700 overflow-y-auto flex-1">
          {/* UNIT SUMMARY GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Unit Type</span>
              <span className="font-bold text-slate-900">{unit.type}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Floor</span>
              <span className="font-bold text-slate-900">{unit.floor || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Size</span>
              <span className="font-bold text-slate-900">{unit.size || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Rent</span>
              <span className="font-extrabold text-[#04A26F]">
                {formatCurrency(unit.price)}
                <span className="text-[10px] font-semibold text-slate-500 block">
                  {unit.priceType === 'quarterly_rent' ? 'per quarter' : unit.priceType === 'annual_rent' ? 'per year' : 'per month'}
                </span>
              </span>
            </div>
          </div>

          {/* STATUS & CUSTOMER ASSIGNMENT CARD */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Current Status
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black border ${getBadgeClass(
                  unit.status
                )}`}
              >
                {unit.status}
              </span>
            </div>

            {isAvailable && (
              <div className="py-4 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#04A26F] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">This unit is currently available.</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                    No active tenancy assigned. You can assign a tenant to start tracking payments.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onAssignCustomer?.(unit)}
                  className="px-5 py-2 text-xs font-extrabold text-white bg-[#04A26F] hover:bg-[#038b5e] rounded-lg transition-all cursor-pointer shadow-xs"
                >
                  Assign Tenant
                </button>
              </div>
            )}

            {isOccupied && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-3 p-3 bg-blue-50/60 rounded-lg border border-blue-100">
                  <UserCheck className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-blue-500 uppercase block">Active Tenant</span>
                    <span className="text-sm font-extrabold text-blue-950">
                      {unit.customerName || 'Assigned Tenant'}
                    </span>
                  </div>
                </div>

                {(unit.agentName || unit.agentId?.fullName) && (
                  <div className="flex items-center gap-3 p-3 bg-emerald-50/60 rounded-lg border border-emerald-100">
                    <User className="w-5 h-5 text-[#04A26F] shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-[#04A26F] uppercase block">Assigned Agent</span>
                      <span className="text-sm font-extrabold text-slate-900">
                        {unit.agentName || unit.agentId?.fullName}
                      </span>
                      {unit.companyMonthlyAmount !== undefined && (
                        <span className="text-[11px] font-medium text-slate-600 block">
                          Company Amount: {formatCurrency(unit.companyMonthlyAmount)} / mo
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-slate-500 font-medium italic">
                  Note: A unit can have only ONE active tenant at a time.
                </p>
              </div>
            )}

            {isReserved && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Reserved for prospect: <strong>{unit.customerName || 'Holding Deposit Paid'}</strong></span>
              </div>
            )}

            {isMaintenance && (
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-purple-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Unit is currently undergoing maintenance and inspection.</span>
              </div>
            )}
          </div>

          {/* DESCRIPTION & NOTES */}
          {unit.description && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Description</span>
              <p className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 font-medium">
                {unit.description}
              </p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-end px-6 py-4 bg-slate-50 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-200/80 hover:bg-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

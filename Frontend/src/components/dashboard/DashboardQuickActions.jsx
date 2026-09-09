import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Building2, UserPlus, PoundSterling } from 'lucide-react';

export function DashboardQuickActions({ onRecordPaymentClick }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center space-x-2 text-gray-800 font-bold text-sm">
        <span className="w-2 h-2 rounded-full bg-[#04A26F] animate-pulse"></span>
        <span>Quick Management Actions:</span>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        <Link
          to="/properties/create"
          className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#04A26F] text-white text-xs font-bold rounded-lg hover:bg-[#03885c] transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
        >
          <Building2 className="w-4 h-4" />
          <span>+ Add Property</span>
        </Link>

        <Link
          to="/tenants/create"
          className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-50 text-[#04A26F] border border-emerald-200 text-xs font-bold rounded-lg hover:bg-emerald-100 transition-colors flex items-center justify-center space-x-1.5"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add Tenant</span>
        </Link>

        <button
          type="button"
          onClick={onRecordPaymentClick}
          className="flex-1 sm:flex-initial px-4 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
        >
          <PoundSterling className="w-4 h-4" />
          <span>+ Record Payment</span>
        </button>
      </div>
    </div>
  );
}

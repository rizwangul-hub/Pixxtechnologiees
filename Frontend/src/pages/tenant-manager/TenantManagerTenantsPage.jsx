import React from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Users, UserPlus } from 'lucide-react';

export function TenantManagerTenantsPage() {
  return (
    <AppLayout>
      <div className="space-y-6 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-7 h-7 text-[#00a36f]" />
              <span>Tenants</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              View tenant records, contact details, guarantor info, and lease assignments.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00a36f] text-white text-xs font-extrabold shadow-xs hover:bg-[#008f61] cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Tenant</span>
          </button>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#00a36f] flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Tenants Register</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Tenant screening, contract profiles, and occupant details will be rendered here.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}

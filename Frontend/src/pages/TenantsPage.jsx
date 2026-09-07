import React from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Users, UserPlus } from 'lucide-react';

export function TenantsPage() {
  return (
    <AppLayout>
      <div className="space-y-6 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-7 h-7 text-[#00a36f]" />
              <span>Tenant Manager</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              View active tenancies, tenant screening, lease agreements, and payment histories.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00a36f] text-white text-xs font-bold uppercase tracking-wide shadow-sm hover:bg-[#008f61]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Tenant</span>
          </button>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#00a36f] flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Tenant Management Module</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            118 active tenants loaded. Full tenant screening, deposit protection records, and AST contract tools will be rendered here.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}

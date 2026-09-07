import React from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Plus, UserCheck } from 'lucide-react';

export function CreateTenancyPage() {
  return (
    <AppLayout>
      <div className="space-y-6 text-left">
        <div className="pb-4 border-b border-slate-200">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Plus className="w-7 h-7 text-[#00a36f]" />
            <span>Create New Tenancy</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Setup new Assured Shorthold Tenancy (AST), assign tenant, rent amount &amp; deposit terms.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#00a36f] flex items-center justify-center mx-auto">
            <UserCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">New Tenancy Wizard</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Multi-step tenancy setup wizard for assigning tenants to units, setting rent payment schedules, and generating tenancy agreements.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}

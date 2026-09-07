import React from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';

export function CreateExpensePage() {
  return (
    <AppLayout>
      <div className="space-y-6 text-left">
        <div className="flex items-center gap-3">
          <Link
            to="/expenses"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-[#00a36f] shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Expenses</span>
          </Link>
          <span className="text-xs text-slate-400">/</span>
          <span className="text-xs font-bold text-slate-900">Add New Expense</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-[#00a36f]">
              <Plus className="w-6 h-6 stroke-[3]" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">Create New Expense</h1>
              <p className="text-xs text-slate-500 font-medium">Record a new supplier invoice or property charge.</p>
            </div>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Form Placeholder (Form fields will be built in the next step)
          </p>
        </div>
      </div>
    </AppLayout>
  );
}

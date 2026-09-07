import React from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { FileText, Download } from 'lucide-react';

export function ReportsPage() {
  return (
    <AppLayout>
      <div className="space-y-6 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-7 h-7 text-[#00a36f]" />
              <span>Reports &amp; Tax (SA105)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Generate UK Self Assessment tax reports, profit &amp; loss, and tenancy yield statements.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00a36f] text-white text-xs font-bold uppercase tracking-wide shadow-sm hover:bg-[#008f61]"
          >
            <Download className="w-4 h-4" />
            <span>Export SA105</span>
          </button>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#00a36f] flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Tax Reports &amp; Financial Analytics</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            HMRC SA105 property tax reporting generator and financial yield analytics will be rendered here.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}

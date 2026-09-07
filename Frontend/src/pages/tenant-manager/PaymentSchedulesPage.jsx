import React from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { CalendarClock, Plus } from 'lucide-react';

export function PaymentSchedulesPage() {
  return (
    <AppLayout>
      <div className="space-y-6 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <CalendarClock className="w-7 h-7 text-[#00a36f]" />
              <span>Payment Schedules</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Track recurring rent schedules, instalment due dates, and automated payment triggers.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00a36f] text-white text-xs font-extrabold shadow-xs hover:bg-[#008f61] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Schedule</span>
          </button>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#00a36f] flex items-center justify-center mx-auto">
            <CalendarClock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Payment Schedules Register</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Upcoming payment schedules, rent frequency schedules, and standing order tracking will be rendered here.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}

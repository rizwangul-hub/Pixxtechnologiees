import React from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Link } from 'react-router-dom';
import { ArrowLeft, Wallet } from 'lucide-react';
import { PaymentTable } from '../components/dashboard/PaymentTable';
import { dashboardPaymentsData } from '../data/dashboardPaymentsData';

export function UpcomingExpensesPage() {
  return (
    <AppLayout>
      <div className="space-y-6 text-left">
        {/* Top Breadcrumbs / Back button */}
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-[#00a36f] hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <span className="text-xs font-semibold text-slate-400">/</span>
          <span className="text-xs font-bold text-slate-900">Upcoming Property Expenses</span>
        </div>

        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Upcoming Property Expenses</span>
              <Wallet className="w-5 h-5 text-sky-500" />
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Scheduled property maintenance and vendor expenses due in the next 30 days.
            </p>
          </div>

          <div className="text-xs font-bold text-slate-600 bg-sky-50 px-3.5 py-2 rounded-xl border border-sky-200">
            Total Expenses: <span className="text-sm font-black text-sky-700">£0.00</span>
          </div>
        </div>

        {/* Table List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <PaymentTable
            items={dashboardPaymentsData.upcoming.propertyExpenses}
            type="upcoming"
            isExpense={true}
          />
        </div>
      </div>
    </AppLayout>
  );
}

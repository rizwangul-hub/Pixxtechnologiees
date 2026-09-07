import React from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building2 } from 'lucide-react';
import { PaymentTable } from '../components/dashboard/PaymentTable';
import { dashboardPaymentsData } from '../data/dashboardPaymentsData';

export function OverdueExpensesPage() {
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
          <span className="text-xs font-bold text-slate-900">Overdue Property Expenses</span>
        </div>

        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Overdue Property Expenses</span>
              <Building2 className="w-5 h-5 text-amber-500" />
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Supplier invoices and maintenance expenses pending settlement.
            </p>
          </div>

          <div className="text-xs font-bold text-slate-600 bg-amber-50 px-3.5 py-2 rounded-xl border border-amber-200">
            Total Overdue: <span className="text-sm font-black text-amber-800">£850.00</span>
          </div>
        </div>

        {/* Table List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <PaymentTable
            items={dashboardPaymentsData.overdue.propertyExpenses}
            type="overdue"
            isExpense={true}
          />
        </div>
      </div>
    </AppLayout>
  );
}

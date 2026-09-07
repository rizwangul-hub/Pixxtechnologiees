import React from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { demoExpenses } from '../data/expensesData';
import { formatCurrency } from '../utils/currencyFormatter';

export function ExpenseDetailPage() {
  const { expenseId } = useParams();
  const expense = demoExpenses.find((e) => e.id === expenseId) || demoExpenses[0];

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
          <span className="text-xs font-bold text-slate-900">Expense Details ({expense.reference})</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-[#00a36f]">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">{expense.supplierName}</h1>
              <p className="text-xs text-slate-500 font-medium">Reference: {expense.reference} | Property: {expense.propertyName}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date / Due Date</span>
              <span className="text-sm font-extrabold text-slate-800">{expense.date} / {expense.dueDate}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Amount Paid</span>
              <span className="text-sm font-extrabold text-emerald-700">{formatCurrency(expense.amountPaid)}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Amount Due</span>
              <span className="text-sm font-extrabold text-red-600">{formatCurrency(expense.amountDue)}</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

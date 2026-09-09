import React from 'react';
import { Link } from 'react-router-dom';

export function PaymentTabs({ activeTab, setActiveTab }) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-100/60 p-1.5 rounded-t-xl">
      <button
        type="button"
        onClick={() => setActiveTab('income')}
        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
          activeTab === 'income'
            ? 'bg-white text-[#04A26F] shadow-xs border border-slate-200/80'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
        }`}
      >
        Customer Rent & Income Receipts
      </button>

      <button
        type="button"
        onClick={() => setActiveTab('expenses')}
        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
          activeTab === 'expenses'
            ? 'bg-white text-[#04A26F] shadow-xs border border-slate-200/80'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
        }`}
      >
        Supplier & Expense Payments
      </button>

      <Link
        to="/payments/schedules"
        className="px-4 py-2 text-xs font-bold rounded-lg transition-all text-slate-600 hover:text-slate-900 hover:bg-white/50 ml-auto flex items-center space-x-1"
      >
        <span>📅 View Due Schedules & Reminders &rarr;</span>
      </Link>
    </div>
  );
}


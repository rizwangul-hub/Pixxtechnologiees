import React from 'react';

export function PaymentTabs({ activeTab, setActiveTab }) {
  return (
    <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-100/60 p-1 rounded-t-xl">
      <button
        type="button"
        onClick={() => setActiveTab('expenses')}
        className={`px-5 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
          activeTab === 'expenses'
            ? 'bg-white text-[#00a36f] shadow-xs border border-slate-200/80'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
        }`}
      >
        Expenses Payments
      </button>
      <button
        type="button"
        onClick={() => setActiveTab('income')}
        className={`px-5 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
          activeTab === 'income'
            ? 'bg-white text-[#00a36f] shadow-xs border border-slate-200/80'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
        }`}
      >
        Income Payments
      </button>
    </div>
  );
}

import React from 'react';

/**
 * ExpenseStatusTabs Component
 * Status filter tab bar (All, Awaiting Payment, Fully Paid, Repeating).
 */
export function ExpenseStatusTabs({ activeTab, onSelectTab, counts = {} }) {
  const tabs = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'awaiting_payment', label: 'Awaiting Payment', count: counts.awaiting_payment },
    { key: 'fully_paid', label: 'Fully Paid', count: counts.fully_paid },
    { key: 'repeating', label: 'Repeating', count: counts.repeating },
  ];

  return (
    <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSelectTab(tab.key)}
            className={`
              px-4 py-2.5 rounded-t-xl text-xs font-extrabold transition-all duration-150 whitespace-nowrap cursor-pointer flex items-center gap-2 border-b-2
              ${
                isActive
                  ? 'bg-white text-[#00a36f] border-[#00a36f] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-50'
              }
            `}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`
                  px-1.5 py-0.5 rounded-full text-[10px] font-bold
                  ${
                    isActive
                      ? 'bg-emerald-50 text-[#00a36f] border border-emerald-200'
                      : 'bg-slate-100 text-slate-500'
                  }
                `}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

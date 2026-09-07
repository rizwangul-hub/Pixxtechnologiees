import React from 'react';

export function SummaryCard({ title, value, icon: Icon, subtext, trend, highlight = false }) {
  return (
    <div
      className={`
        p-4 sm:p-5 rounded-2xl border transition-all duration-200 text-left relative overflow-hidden group
        ${
          highlight
            ? 'bg-[#00a36f] text-white border-[#00a36f] shadow-md shadow-[#00a36f]/20'
            : 'bg-white text-slate-900 border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300'
        }
      `}
    >
      <div className="flex items-center justify-between gap-2 pb-2">
        <span
          className={`text-xs font-extrabold uppercase tracking-wider ${
            highlight ? 'text-emerald-100' : 'text-slate-500'
          }`}
        >
          {title}
        </span>
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shrink-0 ${
            highlight
              ? 'bg-white/20 text-white'
              : 'bg-emerald-50 text-[#00a36f] border border-emerald-100'
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-1">
        <h3
          className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
            highlight ? 'text-white' : 'text-slate-900'
          }`}
        >
          {value}
        </h3>
        {subtext && (
          <p
            className={`text-xs font-medium ${
              highlight ? 'text-emerald-100/90' : 'text-slate-500'
            }`}
          >
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}

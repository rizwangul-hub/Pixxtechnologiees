import React, { useState } from 'react';
import { RefreshCw, Calendar, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function DashboardHeader() {
  const { user, selectedPortfolio } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 mb-6 text-left">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.name || 'Pixx Manager'}
          </h1>
          <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400" />
        </div>
        <p className="text-xs sm:text-sm font-medium text-slate-500 flex items-center gap-1.5 flex-wrap">
          <span>Here's an overview of your Pixx Technologies property management portal:</span>
          <span className="font-extrabold text-[#04A26F] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
            {selectedPortfolio}
          </span>
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Updated today</span>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="p-2 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-[#04A26F] border border-slate-200 transition-all cursor-pointer"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#04A26F]' : ''}`} />
        </button>
      </div>
    </div>
  );
}

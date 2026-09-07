import React, { useState, useEffect } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Link } from 'react-router-dom';
import { Plus, DollarSign } from 'lucide-react';
import { IncomeEmptyState } from '../components/income/IncomeEmptyState';
import { IncomeTable } from '../components/income/IncomeTable';
import { getSavedInvoices } from '../data/incomeData';

export function IncomePage() {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const data = getSavedInvoices();
    setInvoices(data);
    setIsLoading(false);
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6 pb-12 text-left">
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Non-Rental Income</span>
              <DollarSign className="w-6 h-6 text-[#00a36f]" />
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Record secondary revenue, management fees, maintenance charges, and miscellaneous income.
            </p>
          </div>

          {invoices.length > 0 && (
            <Link
              to="/income/create"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-extrabold text-white bg-[#00a36f] hover:bg-[#008f61] active:bg-[#007a53] transition-all cursor-pointer shadow-xs focus:ring-2 focus:ring-[#00a36f] self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Income</span>
            </Link>
          )}
        </div>

        {/* CONTENT VIEW: EMPTY STATE OR SAVED INVOICES LIST */}
        {!isLoading && (
          <>
            {invoices.length === 0 ? (
              <IncomeEmptyState />
            ) : (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <IncomeTable invoices={invoices} />
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

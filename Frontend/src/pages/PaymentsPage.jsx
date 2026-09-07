import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { PaymentTabs } from '../components/payments/PaymentTabs';
import { PaymentFilters } from '../components/payments/PaymentFilters';
import { PaymentTable } from '../components/payments/PaymentTable';
import {
  getSavedExpensePayments,
  getSavedIncomePayments,
  filterPayments,
} from '../data/paymentsData';

export function PaymentsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(
    location.state?.activeTab || 'expenses'
  );

  const [expensePayments, setExpensePayments] = useState([]);
  const [incomePayments, setIncomePayments] = useState([]);

  const [filters, setFilters] = useState({
    search: '',
    searchBy: '- All -',
    dateFrom: '',
    dateTo: '',
    amountFrom: '',
    amountTo: '',
  });

  useEffect(() => {
    setExpensePayments(getSavedExpensePayments());
    setIncomePayments(getSavedIncomePayments());
  }, []);

  const isIncomeTab = activeTab === 'income';

  const rawRecords = isIncomeTab ? incomePayments : expensePayments;

  const filteredRecords = useMemo(() => {
    return filterPayments(rawRecords, filters, isIncomeTab);
  }, [rawRecords, filters, isIncomeTab]);

  const handleClearFilters = () => {
    setFilters({
      search: '',
      searchBy: '- All -',
      dateFrom: '',
      dateTo: '',
      amountFrom: '',
      amountTo: '',
    });
  };

  const handleSearch = () => {
    // Filter calculation triggers automatically via useMemo
  };

  const handleAddPaymentClick = () => {
    if (isIncomeTab) {
      navigate('/payments/income/create');
    } else {
      navigate('/payments/expenses/create');
    }
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    handleClearFilters();
  };

  return (
    <AppLayout>
      <div className="space-y-6 text-left pb-12">
        {/* PAGE TOP TITLE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Payments Register
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              View, record, and reconcile incoming rent receipts and outgoing supplier payments.
            </p>
          </div>
        </div>

        {/* CONTAINER FOR TABS, FILTERS & TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* TAB SWITCHER */}
          <PaymentTabs activeTab={activeTab} setActiveTab={handleTabSwitch} />

          <div className="p-4 sm:p-6 space-y-6">
            {/* FILTERS BAR */}
            <PaymentFilters
              filters={filters}
              setFilters={setFilters}
              onSearch={handleSearch}
              onClear={handleClearFilters}
              isIncomeTab={isIncomeTab}
            />

            {/* PAYMENTS TABLE */}
            <PaymentTable
              payments={filteredRecords}
              isIncomeTab={isIncomeTab}
              onAddPaymentClick={handleAddPaymentClick}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

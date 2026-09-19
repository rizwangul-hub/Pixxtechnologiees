import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { PaymentTabs } from '../components/payments/PaymentTabs';
import { PaymentFilters } from '../components/payments/PaymentFilters';
import { PaymentTable } from '../components/payments/PaymentTable';
import EditPaymentModal from '../components/payments/EditPaymentModal';
import {
  getSavedExpensePayments,
  filterPayments,
} from '../data/paymentsData';
import { fetchPaymentsAPI, deletePaymentAPI, resetPaymentAPI } from '../services/apiData';

export function PaymentsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(
    location.state?.activeTab || 'income'
  );

  const [expensePayments, setExpensePayments] = useState([]);
  const [incomePayments, setIncomePayments] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedPaymentForEdit, setSelectedPaymentForEdit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    searchBy: '- All -',
    dateFrom: '',
    dateTo: '',
    amountFrom: '',
    amountTo: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Load Expense Payments from local storage / fallback
      setExpensePayments(getSavedExpensePayments());

      // 2. Load Real Tenant Payments from Backend API
      const apiPayments = await fetchPaymentsAPI();
      if (Array.isArray(apiPayments)) {
        // Map backend Payment documents to PaymentTable format
        const mappedIncome = apiPayments
          .filter((p) => (p.paidAmount && p.paidAmount > 0) || p.status === 'Paid' || p.status === 'Received' || p.status === 'Partially Received' || p.status === 'Partially Paid')
          .map((p) => {
            const custName = p.customerId?.fullName || p.customerId?.name || p.customerId?.tenantName || p.customerName || 'Tenant';
            const propName = p.propertyId?.propertyName || p.propertyId?.name || p.propertyId?.address || p.propertyName || 'Property';
            return {
              id: p._id || p.id,
              _id: p._id || p.id,
              payer: custName,
              property: propName,
              date: (p.paidDate || p.dueDate || '').slice(0, 10),
              dueDate: p.dueDate,
              paidDate: p.paidDate,
              account: p.paymentMethod || 'Bank Transfer',
              paymentMethod: p.paymentMethod,
              reference: p.reference || '',
              notes: p.notes || '',
              paymentAmount: Number(p.paidAmount || p.amount || 0),
              allocatedAmount: Number(p.paidAmount || 0),
              unallocatedAmount: Number(p.remainingAmount || 0),
              status: p.status,
              raw: p,
            };
          });

        setIncomePayments(mappedIncome);
      }
    } catch (err) {
      console.warn('[PaymentsPage] Failed to fetch live payments:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      navigate('/payments/schedules');
    } else {
      navigate('/payments/expenses/create');
    }
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    handleClearFilters();
  };

  const handleEditPayment = (paymentRecord) => {
    setSelectedPaymentForEdit(paymentRecord.raw || paymentRecord);
    setIsEditModalOpen(true);
  };

  const handleDeletePayment = async (paymentRecord) => {
    const raw = paymentRecord.raw || paymentRecord;
    const targetId = raw._id || raw.id;
    const tenantName = raw.customerId?.fullName || raw.payer || 'Tenant';

    const action = window.confirm(
      `Manage Received Payment for "${tenantName}":\n\n• Click OK to RESET this payment back to unpaid (restoring remaining rent obligation).\n• Click Cancel if you do not want to change anything.`
    );

    if (action) {
      try {
        await resetPaymentAPI(targetId);
        loadData();
      } catch (err) {
        alert(err.message || 'Failed to reset payment');
      }
    }
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
              View, edit, and reconcile incoming tenant rent receipts and outgoing expenses.
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
              onEditPayment={handleEditPayment}
              onDeletePayment={handleDeletePayment}
            />
          </div>
        </div>
      </div>

      {/* EDIT PAYMENT MODAL */}
      <EditPaymentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        payment={selectedPaymentForEdit}
        onSuccess={loadData}
      />
    </AppLayout>
  );
}

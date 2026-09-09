import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardQuickActions } from '../components/dashboard/DashboardQuickActions';
import RecordPaymentModal from '../components/payments/RecordPaymentModal';
import {
  getTotalPropertiesCount,
  getTotalUnitsCount,
  getOccupiedUnitsCount,
  getAvailableUnitsCount,
  getTotalCustomersCount,
  getFinancialOverview,
  getRecentPaymentsList,
  getUpcomingPaymentsList,
  getOverduePaymentsList,
  getAvailableUnitsList,
} from '../services/metricsService';
import { formatCurrency } from '../utils/currencyFormatter';
import {
  fetchUnifiedDashboardAPI,
  fetchDashboardSummaryAPI,
  fetchFinancialSummaryAPI,
  fetchPaymentsAPI,
  fetchExpiringDocumentsAPI,
  fetchAgentDashboardSummaryAPI,
  fetchMortgageSummaryAPI,
  fetchUpcomingMortgagesAPI,
} from '../services/apiData';
import {
  Building2,
  Layers,
  CheckCircle2,
  Home,
  Users,
  PoundSterling,
  AlertTriangle,
  ArrowRight,
  Plus,
  Loader2,
  FileText,
  ExternalLink,
  Briefcase,
  Wallet,
  Receipt,
  Landmark,
} from 'lucide-react';

export function DashboardPage() {
  const navigate = useNavigate();

  const getCachedDashboard = () => {
    try {
      const cached = localStorage.getItem('pixx_dashboard_cache');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  };

  const initialCache = getCachedDashboard();

  const [loading, setLoading] = useState(!initialCache);
  const [propertiesCount, setPropertiesCount] = useState(
    initialCache?.propertyInfo?.totalProperties ?? getTotalPropertiesCount()
  );
  const [unitsCount, setUnitsCount] = useState(
    initialCache?.propertyInfo?.totalUnits ?? getTotalUnitsCount()
  );
  const [occupiedCount, setOccupiedCount] = useState(
    initialCache?.propertyInfo?.occupiedUnits ?? getOccupiedUnitsCount()
  );
  const [availableCount, setAvailableCount] = useState(
    initialCache?.propertyInfo?.availableUnits ?? getAvailableUnitsCount()
  );
  const [customersCount, setCustomersCount] = useState(
    initialCache?.tenantInfo?.totalCustomers ?? getTotalCustomersCount()
  );
  const [financials, setFinancials] = useState(
    initialCache?.financialInfo
      ? {
          monthlyExpectedRent: initialCache.financialInfo.monthlyExpectedRent || 0,
          paymentsReceivedThisMonth: initialCache.financialInfo.monthlyCollectedRent || 0,
          pendingAmount: initialCache.financialInfo.monthlyOutstandingRent || 0,
          overdueAmount: initialCache.financialInfo.totalOverdue || 0,
          totalPendingAndOverdue: initialCache.financialInfo.monthlyOutstandingRent || 0,
          totalExpenses: initialCache.financialInfo.totalExpenses || 0,
        }
      : getFinancialOverview()
  );

  const [recentPayments, setRecentPayments] = useState(
    initialCache?.recentPayments || getRecentPaymentsList(5)
  );
  const [upcomingPayments, setUpcomingPayments] = useState(
    initialCache?.upcomingPayments || getUpcomingPaymentsList(5)
  );
  const [overduePayments, setOverduePayments] = useState(
    initialCache?.overduePayments || getOverduePaymentsList(10)
  );
  const [availableUnits, setAvailableUnits] = useState(
    getAvailableUnitsList(5)
  );
  const [expiringDocuments, setExpiringDocuments] = useState(
    initialCache?.expiringDocuments || []
  );
  const [expiredDocuments, setExpiredDocuments] = useState(
    initialCache?.expiredDocuments || []
  );
  const [agentSummary, setAgentSummary] = useState(null);
  const [mortgageSummary, setMortgageSummary] = useState(null);
  const [upcomingMortgages, setUpcomingMortgages] = useState([]);

  const [selectedScheduleForPayment, setSelectedScheduleForPayment] = useState(null);
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);

  const loadDashboardData = async () => {
    try {
      // Load Agent & Mortgage summary in parallel
      fetchAgentDashboardSummaryAPI().then((data) => {
        if (data) setAgentSummary(data);
      });
      fetchMortgageSummaryAPI().then((data) => {
        if (data) setMortgageSummary(data);
      });
      fetchUpcomingMortgagesAPI().then((data) => {
        if (Array.isArray(data)) setUpcomingMortgages(data);
      });

      // Fetch Live Backend Data first
      const dash = await fetchUnifiedDashboardAPI();
      if (dash) {
        setPropertiesCount(dash.propertyInfo?.totalProperties || 0);
        setUnitsCount(dash.propertyInfo?.totalUnits || 0);
        setOccupiedCount(dash.propertyInfo?.occupiedUnits || 0);
        setAvailableCount(dash.propertyInfo?.availableUnits || 0);

        setCustomersCount(dash.tenantInfo?.totalCustomers || 0);

        setFinancials({
          monthlyExpectedRent: dash.financialInfo?.monthlyExpectedRent || 0,
          paymentsReceivedThisMonth: dash.financialInfo?.monthlyCollectedRent || 0,
          pendingAmount: dash.financialInfo?.monthlyOutstandingRent || 0,
          overdueAmount: dash.financialInfo?.totalOverdue || 0,
          totalPendingAndOverdue: dash.financialInfo?.monthlyOutstandingRent || 0,
          totalExpenses: dash.financialInfo?.totalExpenses || 0,
        });

        if (dash.recentPayments) setRecentPayments(dash.recentPayments);
        if (dash.overduePayments) setOverduePayments(dash.overduePayments);
        if (dash.upcomingPayments) setUpcomingPayments(dash.upcomingPayments);
        if (dash.expiringDocuments) setExpiringDocuments(dash.expiringDocuments);
        if (dash.expiredDocuments) setExpiredDocuments(dash.expiredDocuments);
        setLoading(false);
        return;
      }

      // Legacy API Fallback
      const [summary, paymentSummary, payments] = await Promise.all([
        fetchDashboardSummaryAPI(),
        fetchFinancialSummaryAPI(),
        fetchPaymentsAPI(),
      ]);

      if (summary || paymentSummary) {
        if (summary) {
          setPropertiesCount(summary.totalProperties || 0);
          setUnitsCount(summary.totalUnits || 0);
          setOccupiedCount(summary.occupiedUnits || 0);
          setAvailableCount(summary.availableUnits || 0);
          setCustomersCount(summary.totalCustomers || 0);
        }
        if (paymentSummary) {
          setFinancials({
            monthlyExpectedRent: paymentSummary.totalRentExpected || 0,
            paymentsReceivedThisMonth: paymentSummary.totalRentCollected || 0,
            pendingAmount: paymentSummary.totalOutstanding || 0,
            overdueAmount: paymentSummary.totalOverdue || 0,
            totalPendingAndOverdue: paymentSummary.totalOutstanding || 0,
          });
        }
        if (Array.isArray(payments)) {
          const unpaid = payments.filter((p) => p.status !== 'Paid');
          const today = new Date().toISOString().slice(0, 10);
          setUpcomingPayments(unpaid.filter((p) => p.dueDate >= today).slice(0, 5));
          setOverduePayments(unpaid.filter((p) => p.status === 'Overdue').slice(0, 10));
          setRecentPayments(payments.filter((p) => (p.paidAmount || 0) > 0).slice(0, 5));
        }
        setLoading(false);
        return;
      }
    } catch (error) {
      console.warn('[Dashboard API Notice]', error.message);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleOpenRecordPaymentModal = (scheduleItem = null) => {
    if (scheduleItem) {
      setSelectedScheduleForPayment(scheduleItem);
    } else if (upcomingPayments.length > 0) {
      setSelectedScheduleForPayment(upcomingPayments[0]);
    } else if (overduePayments.length > 0) {
      setSelectedScheduleForPayment(overduePayments[0]);
    } else {
      navigate('/payments/schedules');
      return;
    }
    setIsRecordPaymentModalOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12 text-left">
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-xs sm:text-sm font-medium text-gray-500 mt-1">
              Pixx Technologies Property Management & Real-time Financial Tracking.
            </p>
          </div>
          {loading && !initialCache && (
            <div className="flex items-center space-x-2 text-xs font-semibold text-[#04A26F] bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Syncing with Live Database...</span>
            </div>
          )}
        </div>

        {/* 1. QUICK ACTIONS AT TOP */}
        <DashboardQuickActions onRecordPaymentClick={() => handleOpenRecordPaymentModal()} />

        {/* 2. SUMMARY CARDS (9 REAL DATA METRIC CARDS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Properties</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{propertiesCount}</h3>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Properties</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{unitsCount}</h3>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 text-[#04A26F] flex items-center justify-center font-bold text-xl shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Occupied</p>
              <h3 className="text-2xl font-bold text-emerald-800 mt-0.5">{occupiedCount}</h3>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl shrink-0">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Available</p>
              <h3 className="text-2xl font-bold text-amber-700 mt-0.5">{availableCount}</h3>
            </div>
          </div>

          {/* Card 5 */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xl shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Tenants</p>
              <h3 className="text-2xl font-bold text-purple-900 mt-0.5">{customersCount}</h3>
            </div>
          </div>

          {/* Card 6 */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 text-[#04A26F] flex items-center justify-center font-bold text-xl shrink-0">
              <PoundSterling className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Monthly Expected Rent</p>
              <h3 className="text-xl font-bold text-gray-900 mt-0.5">
                {formatCurrency(financials.monthlyExpectedRent)}
              </h3>
            </div>
          </div>

          {/* Card 7 */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Received This Month</p>
              <h3 className="text-xl font-bold text-emerald-700 mt-0.5">
                {formatCurrency(financials.paymentsReceivedThisMonth)}
              </h3>
            </div>
          </div>

          {/* Card 8 */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xl shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Expenses</p>
              <h3 className="text-xl font-bold text-rose-600 mt-0.5">
                {formatCurrency(financials.totalExpenses)}
              </h3>
            </div>
          </div>
        </div>

        {/* AGENT FINANCIAL SUMMARY WIDGET */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#04A26F] flex items-center justify-center font-bold">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Agent Financial Summary</h3>
                <p className="text-xs text-gray-500">Monthly overview of agent collection settlements and maintenance deductions</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/agents/expenses"
                className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 hover:bg-amber-100 flex items-center gap-1"
              >
                <Receipt className="w-3.5 h-3.5" /> Agent Expenses
              </Link>
              <Link
                to="/agents"
                className="text-xs font-semibold text-[#04A26F] hover:underline flex items-center gap-1"
              >
                Manage Agents <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
            {/* 1. Expected from Agents */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Company Expected</p>
              <h4 className="text-lg font-bold text-gray-900 mt-1">
                {formatCurrency(agentSummary?.totalExpectedAmount ?? agentSummary?.totalExpected ?? 0)}
              </h4>
              <span className="text-[11px] text-gray-400">Agreed monthly agent target</span>
            </div>

            {/* 2. Approved Expenses */}
            <div className="bg-amber-50/60 p-4 rounded-lg border border-amber-100">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Agent Expenses</p>
              <h4 className="text-lg font-bold text-amber-800 mt-1">
                {formatCurrency(agentSummary?.totalApprovedExpenses ?? agentSummary?.totalExpenses ?? agentSummary?.expensesThisMonth ?? 0)}
              </h4>
              <span className="text-[11px] text-amber-600">Deducted repairs & maintenance</span>
            </div>

            {/* 3. Net Amount */}
            <div className="bg-blue-50/60 p-4 rounded-lg border border-blue-100">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Net Amount</p>
              <h4 className="text-lg font-bold text-blue-900 mt-1">
                {formatCurrency(agentSummary?.totalNetAmount ?? agentSummary?.netAmount ?? 0)}
              </h4>
              <span className="text-[11px] text-blue-600">Expected - Approved Expenses</span>
            </div>

            {/* 4. Received from Agents */}
            <div className="bg-emerald-50/60 p-4 rounded-lg border border-emerald-100">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Total Received</p>
              <h4 className="text-lg font-bold text-emerald-800 mt-1">
                {formatCurrency(agentSummary?.totalPaidAmount ?? agentSummary?.totalReceived ?? 0)}
              </h4>
              <span className="text-[11px] text-emerald-600">Payments collected from agents</span>
            </div>

            {/* 5. Outstanding */}
            <div className="bg-rose-50/60 p-4 rounded-lg border border-rose-100">
              <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Outstanding</p>
              <h4 className="text-lg font-bold text-rose-800 mt-1">
                {formatCurrency(agentSummary?.totalRemainingAmount ?? agentSummary?.totalOutstanding ?? 0)}
              </h4>
              <span className="text-[11px] text-rose-600">Remaining agent balance</span>
            </div>
          </div>
        </div>

        {/* MORTGAGE FINANCIAL SUMMARY & UPCOMING PAYMENTS WIDGET */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#04A26F] flex items-center justify-center font-bold">
                <Landmark className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Property Mortgage & Financing Summary</h3>
                <p className="text-xs text-gray-500">Overview of landlord property loans, outstanding balances, and monthly commitments</p>
              </div>
            </div>
            <Link
              to="/mortgages"
              className="text-xs font-semibold text-[#04A26F] hover:underline flex items-center gap-1"
            >
              Mortgage Manager <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Mortgages</p>
              <h4 className="text-xl font-bold text-slate-900 mt-1">
                {mortgageSummary?.activeMortgagesCount || 0}
              </h4>
              <span className="text-[11px] text-slate-400">Total properties with active loans</span>
            </div>

            <div className="bg-amber-50/60 p-4 rounded-lg border border-amber-100">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Total Outstanding Balance</p>
              <h4 className="text-xl font-bold text-amber-900 mt-1">
                {formatCurrency(mortgageSummary?.totalOutstanding || 0)}
              </h4>
              <span className="text-[11px] text-amber-600">Remaining bank balance</span>
            </div>

            <div className="bg-blue-50/60 p-4 rounded-lg border border-blue-100">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Monthly Commitment</p>
              <h4 className="text-xl font-bold text-blue-900 mt-1">
                {formatCurrency(mortgageSummary?.monthlyPaymentsTotal || 0)}
              </h4>
              <span className="text-[11px] text-blue-600">Total monthly mortgage payments</span>
            </div>

            <div className="bg-purple-50/60 p-4 rounded-lg border border-purple-100">
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Upcoming Payments</p>
              <h4 className="text-xl font-bold text-purple-900 mt-1">
                {mortgageSummary?.upcomingPaymentsCount || 0}
              </h4>
              <span className="text-[11px] text-purple-600">Payments due in next 30 days</span>
            </div>
          </div>

          {/* Upcoming Mortgage Payments Sub-table if any */}
          {upcomingMortgages.length > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Upcoming Mortgage Payments Due
              </span>
              <div className="space-y-2">
                {upcomingMortgages.slice(0, 3).map((m) => (
                  <div
                    key={m._id || m.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-extrabold text-slate-900">{m.propertyId?.name || 'Property'}</span>
                      <span className="text-slate-500 font-medium ml-2">({m.lenderName})</span>
                      <p className="text-[11px] text-slate-500">
                        Due Date: <strong className="text-slate-800">{new Date(m.nextPaymentDate).toLocaleDateString()}</strong> | Landlord: {m.landlordId?.fullName || 'N/A'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-slate-900">{formatCurrency(m.monthlyPayment)}</span>
                      <Link
                        to={`/mortgages/${m._id || m.id}`}
                        className="px-3 py-1 bg-[#04A26F] text-white font-bold rounded-lg hover:bg-[#03885c] transition-colors"
                      >
                        View & Pay
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* EMPTY STATE WARNING FOR FIRST TIME MANAGERS */}
        {!loading && propertiesCount === 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#04A26F] flex items-center justify-center mx-auto">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">No properties added yet</h3>
              <p className="text-xs text-gray-600 mt-1 max-w-md mx-auto">
                Add your first property to start managing units, customers, agreements, and automated rent schedules.
              </p>
            </div>
            <Link
              to="/properties/create"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#04A26F] text-white text-sm font-semibold rounded-lg hover:bg-[#03885c] transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Property</span>
            </Link>
          </div>
        )}

        {/* TENANT DOCUMENT EXPIRY MONITORING SYSTEM */}
        {(expiringDocuments.length > 0 || expiredDocuments.length > 0) && (
          <div className="space-y-4">
            {/* Expiring Soon Table */}
            {expiringDocuments.length > 0 && (
              <div className="bg-white rounded-xl border-2 border-amber-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Documents Expiring Soon</h2>
                      <p className="text-xs text-amber-700 font-medium">Tenant documents expiring within 30 days — Reminders auto-sent to Agent or Fallback Email</p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-amber-50/50 border-b border-amber-100 text-xs font-bold text-gray-700 uppercase tracking-wider">
                        <th className="py-3 px-4">Tenant</th>
                        <th className="py-3 px-4">Property / Unit</th>
                        <th className="py-3 px-4">Document Name</th>
                        <th className="py-3 px-4">Expiry Date</th>
                        <th className="py-3 px-4">Days Left</th>
                        <th className="py-3 px-4">Recipient / Agent Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {expiringDocuments.map((doc, idx) => {
                        const tenantName = doc.tenantName || doc.tenantId?.name || doc.tenantId?.fullName || 'N/A';
                        const tenantId = doc.tenantId?._id || doc.tenantId || '';
                        const propUnit = `${doc.propertyName || 'N/A'} - ${doc.unitName || 'N/A'}`;
                        const daysLeft = doc.daysRemaining ?? (doc.expiryDate ? Math.ceil((new Date(doc.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0);
                        const isFallback = doc.isFallbackRecipient;

                        return (
                          <tr key={doc._id || idx} className="hover:bg-amber-50/30 transition-colors">
                            <td className="py-3 px-4 font-bold text-gray-900">
                              {tenantId ? (
                                <Link to={`/tenants/${tenantId}`} className="text-[#04A26F] hover:underline">
                                  {tenantName}
                                </Link>
                              ) : (
                                tenantName
                              )}
                            </td>
                            <td className="py-3 px-4 text-gray-700 text-xs">{propUnit}</td>
                            <td className="py-3 px-4 text-gray-800 font-medium">{doc.documentName}</td>
                            <td className="py-3 px-4 font-mono text-xs text-gray-700">
                              {doc.expiryDate ? new Date(doc.expiryDate).toISOString().split('T')[0] : 'N/A'}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                {daysLeft} day{daysLeft === 1 ? '' : 's'} left
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs">
                              {!isFallback && (
                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                                  Agent: {doc.agentName} ({doc.recipientEmail})
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right space-x-2">
                              {tenantId && (
                                <Link
                                  to={`/tenants/${tenantId}`}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded transition-colors"
                                >
                                  <span>View Tenant</span>
                                </Link>
                              )}
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-600 text-white text-xs font-semibold rounded hover:bg-amber-700 transition-colors"
                              >
                                <span>View Document</span>
                                <ExternalLink className="w-3 h-3 ml-1" />
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Expired Documents Table */}
            {expiredDocuments.length > 0 && (
              <div className="bg-white rounded-xl border-2 border-rose-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Expired Documents</h2>
                      <p className="text-xs text-rose-700 font-medium">Documents past their expiry date — Requires tenant document renewal</p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-rose-50/50 border-b border-rose-100 text-xs font-bold text-gray-700 uppercase tracking-wider">
                        <th className="py-3 px-4">Tenant</th>
                        <th className="py-3 px-4">Property / Unit</th>
                        <th className="py-3 px-4">Document Name</th>
                        <th className="py-3 px-4">Expiry Date</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {expiredDocuments.map((doc, idx) => {
                        const tenantName = doc.tenantName || doc.tenantId?.name || doc.tenantId?.fullName || 'N/A';
                        const tenantId = doc.tenantId?._id || doc.tenantId || '';
                        const propUnit = `${doc.propertyName || 'N/A'} - ${doc.unitName || 'N/A'}`;
                        const overdueDays = Math.abs(doc.daysRemaining || 0);

                        return (
                          <tr key={doc._id || idx} className="hover:bg-rose-50/30 transition-colors">
                            <td className="py-3 px-4 font-bold text-gray-900">
                              {tenantId ? (
                                <Link to={`/tenants/${tenantId}`} className="text-[#04A26F] hover:underline">
                                  {tenantName}
                                </Link>
                              ) : (
                                tenantName
                              )}
                            </td>
                            <td className="py-3 px-4 text-gray-700 text-xs">{propUnit}</td>
                            <td className="py-3 px-4 text-gray-800 font-medium">{doc.documentName}</td>
                            <td className="py-3 px-4 font-mono text-xs text-gray-700">
                              {doc.expiryDate ? new Date(doc.expiryDate).toISOString().split('T')[0] : 'N/A'}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                                Expired ({overdueDays} day{overdueDays === 1 ? '' : 's'} ago)
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right space-x-2">
                              {tenantId && (
                                <Link
                                  to={`/tenants/${tenantId}`}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded transition-colors"
                                >
                                  <span>View Tenant</span>
                                </Link>
                              )}
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-rose-600 text-white text-xs font-semibold rounded hover:bg-rose-700 transition-colors"
                              >
                                <span>View Document</span>
                                <ExternalLink className="w-3 h-3 ml-1" />
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. OVERDUE PAYMENTS SECTION */}
        <div className="bg-white rounded-xl border-2 border-rose-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Overdue Payments</h2>
                <p className="text-xs text-rose-600 font-medium">Requires immediate manager follow-up</p>
              </div>
            </div>
            <Link
              to="/payments/schedules"
              className="text-xs font-semibold text-rose-600 hover:underline flex items-center space-x-1"
            >
              <span>View All Schedules</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-rose-50/50 border-b border-rose-100 text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <th className="py-3 px-4">Tenant</th>
                  <th className="py-3 px-4">Property</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">Expected</th>
                  <th className="py-3 px-4">Paid</th>
                  <th className="py-3 px-4">Remaining</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Days Overdue</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {overduePayments.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="py-6 text-center text-emerald-700 font-medium text-sm bg-emerald-50/50">
                      ✓ No overdue payments! All accounts are up to date.
                    </td>
                  </tr>
                ) : (
                  overduePayments.map((item, index) => {
                    const key = item._id || item.id || `overdue-${index}`;
                    const custName = item.customerId?.fullName || item.customerId?.name || item.customerName || 'N/A';
                    const propName = item.propertyId?.propertyName || item.propertyId?.name || item.propertyName || 'N/A';
                    const unitName = item.unitId?.unitName || item.unitId?.name || item.unitName || 'N/A';

                    return (
                      <tr key={key} className="hover:bg-rose-50/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-gray-900">{custName}</td>
                        <td className="py-3 px-4 text-gray-700">{propName}</td>
                        <td className="py-3 px-4 font-medium text-gray-800">{unitName}</td>
                        <td className="py-3 px-4 font-semibold text-gray-900">
                          {formatCurrency(item.amount || item.expectedAmount || 0)}
                        </td>
                        <td className="py-3 px-4 text-emerald-700 font-medium">
                          {formatCurrency(item.paidAmount || 0)}
                        </td>
                        <td className="py-3 px-4 font-bold text-rose-600">
                          {formatCurrency(item.remainingAmount || item.expectedAmount || 0)}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-gray-700">{item.dueDate}</td>
                        <td className="py-3 px-4 font-bold text-rose-600">
                          <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-xs">
                            {item.daysOverdue || 0} days
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                            Overdue
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenRecordPaymentModal(item)}
                            className="px-3 py-1 bg-rose-600 text-white text-xs font-semibold rounded hover:bg-rose-700 transition-colors cursor-pointer"
                          >
                            Record Payment
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. UPCOMING PAYMENTS & RECENT PAYMENTS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Payments */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Upcoming Payments (Next 30 Days)</h2>
              <Link
                to="/payments/schedules"
                className="text-xs font-semibold text-[#04A26F] hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 font-bold text-gray-500 uppercase">
                    <th className="py-2.5 px-3">Tenant</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {upcomingPayments.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-gray-500">
                        No payments due in the next 30 days.
                      </td>
                    </tr>
                  ) : (
                    upcomingPayments.map((item, index) => {
                      const key = item._id || item.id || `upcoming-${index}`;
                      const custName = item.customerId?.fullName || item.customerId?.name || item.customerName || 'N/A';
                      const unitName = item.unitId?.unitName || item.unitId?.name || item.unitName || 'N/A';

                      return (
                        <tr key={key} className="hover:bg-gray-50">
                          <td className="py-2.5 px-3 font-semibold text-gray-900">{custName}</td>
                          <td className="py-2.5 px-3 text-gray-600">{unitName}</td>
                          <td className="py-2.5 px-3 font-bold text-gray-900">
                            {formatCurrency(item.remainingAmount || item.amount || item.expectedAmount || 0)}
                          </td>
                          <td className="py-2.5 px-3 font-mono">{item.dueDate}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                              {item.status || 'Pending'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Payments (Receipts) */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Recent Payment Receipts</h2>
              <Link
                to="/payments"
                className="text-xs font-semibold text-[#04A26F] hover:underline"
              >
                View All Payments
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 font-bold text-gray-500 uppercase">
                    <th className="py-2.5 px-3">Tenant</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentPayments.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-gray-500">
                        No payments recorded yet.
                      </td>
                    </tr>
                  ) : (
                    recentPayments.map((p, index) => {
                      const key = p._id || p.id || `recent-${index}`;
                      const custName = p.customerId?.fullName || p.customerId?.name || p.customerName || 'N/A';
                      const unitName = p.unitId?.unitName || p.unitId?.name || p.unitName || 'N/A';

                      return (
                        <tr key={key} className="hover:bg-gray-50">
                          <td className="py-2.5 px-3 font-semibold text-gray-900">{custName}</td>
                          <td className="py-2.5 px-3 text-gray-600">{unitName}</td>
                          <td className="py-2.5 px-3 font-bold text-emerald-700">
                            {formatCurrency(p.paidAmount || p.amountPaid || 0)}
                          </td>
                          <td className="py-2.5 px-3 font-mono">{p.paidDate || p.paymentDate || ''}</td>
                          <td className="py-2.5 px-3 text-gray-700">{p.paymentMethod || 'Cash'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 6. AVAILABLE UNITS SECTION */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Available Units (Ready to Let/Sell)</h2>
            <Link
              to="/properties"
              className="text-xs font-semibold text-[#04A26F] hover:underline"
            >
              View Properties
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                  <th className="py-3 px-4">Property</th>
                  <th className="py-3 px-4">Unit Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Agreed Price</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {availableUnits.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-gray-500">
                      All units are currently occupied or reserved.
                    </td>
                  </tr>
                ) : (
                  availableUnits.map((u, index) => {
                    const key = u._id || u.id || `unit-${index}`;
                    const propName = u.propertyName || u.propertyId?.name || 'N/A';
                    const unitName = u.name || u.unitName || 'N/A';

                    return (
                      <tr key={key} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-semibold text-gray-900">{propName}</td>
                        <td className="py-3 px-4 font-medium text-gray-800">{unitName}</td>
                        <td className="py-3 px-4 text-gray-600">{u.type || u.unitType || ''}</td>
                        <td className="py-3 px-4 font-bold text-gray-900">
                          {formatCurrency(u.price || u.monthlyRent || 0)}{' '}
                          <span className="text-xs text-gray-500 font-normal">
                            {u.priceType === 'sale' ? 'Sale Price' : '/month'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            Available
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to="/tenants"
                            className="px-3 py-1 bg-[#04A26F] text-white text-xs font-semibold rounded hover:bg-[#03885c] transition-colors"
                          >
                            + Assign Tenant
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isRecordPaymentModalOpen}
        onClose={() => setIsRecordPaymentModalOpen(false)}
        scheduleItem={selectedScheduleForPayment}
        onSuccess={loadDashboardData}
      />
    </AppLayout>
  );
}

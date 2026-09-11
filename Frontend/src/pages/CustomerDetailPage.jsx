import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Building2,
  Home,
  DollarSign,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  History,
} from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { EntityReportDownloadBar } from '../components/common/EntityReportDownloadBar';
import AssignUnitModal from '../components/customers/AssignUnitModal';
import RecordPaymentModal from '../components/payments/RecordPaymentModal';
import { TenantDocumentSection } from '../components/tenants/TenantDocumentSection';
import {
  getSavedCustomers,
} from '../data/customersData';
import {
  fetchCustomerByIdAPI,
  fetchPaymentsAPI,
  fetchTenanciesAPI,
  endTenancyAPI,
} from '../services/apiData';
import { formatCurrency } from '../utils/currencyFormatter';

export default function CustomerDetailPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tenancies from backend (replaces localStorage agreements)
  const [tenancies, setTenancies] = useState([]);
  // Payment schedules from backend (replaces localStorage schedules)
  const [schedules, setSchedules] = useState([]);
  // All payments from backend
  const [apiPayments, setApiPayments] = useState([]);

  const [openingBalance, setOpeningBalance] = useState(0);

  // Computed metrics from API data
  const [metrics, setMetrics] = useState({
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
  });

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedScheduleForPayment, setSelectedScheduleForPayment] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const loadCustomerData = async () => {
    setLoading(true);
    try {
      // 1. Load customer profile
      let cust = null;
      try {
        cust = await fetchCustomerByIdAPI(customerId);
      } catch (e) {
        // fallback to localStorage
        const localCustomers = getSavedCustomers();
        cust = localCustomers.find((c) => c.id === customerId || c._id === customerId) || null;
      }
      setCustomer(cust);

      // 2. Load tenancies for this customer from backend
      const tenancyList = await fetchTenanciesAPI({ customerId });
      setTenancies(Array.isArray(tenancyList) ? tenancyList : []);

      // 3. Load all payment schedules for this customer from backend
      const payList = await fetchPaymentsAPI({ customer: customerId });
      const allPays = Array.isArray(payList) ? payList : [];
      setApiPayments(allPays);

      // Separate schedules (non-opening balance) and opening balances
      const regularSchedules = allPays.filter((p) => p.paymentType !== 'Opening Balance');
      setSchedules(regularSchedules);

      // 4. Compute metrics from backend data
      const obTotal = allPays
        .filter((p) => p.paymentType === 'Opening Balance')
        .reduce((sum, p) => sum + (p.remainingAmount || 0), 0);
      setOpeningBalance(obTotal);

      const totalPaid = regularSchedules.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
      const totalPending = regularSchedules
        .filter((p) => p.status === 'Pending' || p.status === 'Upcoming')
        .reduce((sum, p) => sum + (p.remainingAmount || p.amount || 0), 0);
      const totalOverdue = regularSchedules
        .filter((p) => p.status === 'Overdue' || p.status === 'Partially Paid')
        .reduce((sum, p) => sum + (p.remainingAmount || 0), 0);

      setMetrics({ totalPaid, totalPending, totalOverdue });
    } catch (e) {
      console.warn('[CustomerDetailPage] Load error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerData();
  }, [customerId]);

  const handleTerminateTenancy = async (tenancyId, propertyName) => {
    if (
      window.confirm(
        `Are you sure you want to end the tenancy for "${propertyName}"? The property will be marked as Available.`
      )
    ) {
      try {
        await endTenancyAPI(tenancyId);
        loadCustomerData();
      } catch (e) {
        alert('Failed to end tenancy: ' + e.message);
      }
    }
  };


  if (loading) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-gray-500">
          <p className="text-lg">Loading tenant profile...</p>
        </div>
      </AppLayout>
    );
  }

  if (!customer) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-gray-500">
          <p className="text-lg">Tenant profile not found.</p>
          <Link to="/tenants" className="mt-4 text-[#04A26F] font-semibold hover:underline inline-block">
            &larr; Back to Tenants List
          </Link>
        </div>
      </AppLayout>
    );
  }

  const customerName = customer.fullName || customer.name || 'Unknown Tenant';
  const targetTenantId = (customer._id || customer.id || customerId)?.toString();

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Link
              to="/tenants"
              className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">{customerName}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  {customer.type || customer.customerType || 'Tenant'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {customer.city ? `${customer.city} • ` : ''}Added on {customer.createdAt}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="px-4 py-2 bg-emerald-50 text-[#04A26F] border border-emerald-200 text-sm font-semibold rounded-lg hover:bg-emerald-100 transition-colors flex items-center space-x-2"
            >
              <Home className="w-4 h-4" />
              <span>Assign Property</span>
            </button>
            <Link
              to={`/tenants/${customer._id || customer.id}/edit`}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Date Range Report & Statement Download Bar */}
        <EntityReportDownloadBar entityType="tenant" entityId={targetTenantId} entityName={customerName} />

        {/* Customer Details & Metrics Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Information Card */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3.5">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-2 border-b border-gray-100">
              Tenant Details
            </h3>

            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center space-x-2">
                <Phone className="text-gray-400 w-4 h-4" />
                <span>{customer.phone || 'No phone provided'}</span>
              </div>

              <div className="flex items-center space-x-2">
                <Mail className="text-gray-400 w-4 h-4" />
                <span>{customer.email || 'No email provided'}</span>
              </div>

              <div className="flex items-center space-x-2">
                <FileText className="text-gray-400 w-4 h-4" />
                <span>NINO/Reg: {customer.cnicOrReg || '—'}</span>
              </div>

              <div className="flex items-start space-x-2">
                <MapPin className="text-gray-400 w-4 h-4 mt-0.5" />
                <span>{customer.address || 'No address details'}</span>
              </div>
            </div>

            {customer.notes && (
              <div className="pt-2 border-t border-gray-100 text-xs text-gray-500 italic">
                "{customer.notes}"
              </div>
            )}
          </div>

          {/* Metrics Overview */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Received</p>
                <h3 className="text-2xl font-bold text-emerald-700 mt-2">{formatCurrency(metrics.totalPaid)}</h3>
              </div>
              <p className="text-xs text-emerald-600 font-medium mt-3 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Cleared Payments</span>
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Dues</p>
                <h3 className="text-2xl font-bold text-amber-600 mt-2">{formatCurrency(metrics.totalPending)}</h3>
              </div>
              <p className="text-xs text-amber-600 font-medium mt-3 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Upcoming Schedules</span>
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Overdue Balance</p>
                <h3 className="text-2xl font-bold text-rose-600 mt-2">{formatCurrency(metrics.totalOverdue)}</h3>
              </div>
              <p className="text-xs text-rose-600 font-medium mt-3 flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Action Required</span>
              </p>
            </div>

            {/* Opening Balance card — shows prior period unpaid debt */}
            <div className={`p-5 rounded-xl border shadow-sm flex flex-col justify-between ${openingBalance > 0 ? 'bg-amber-50 border-amber-300' : 'bg-white border-gray-200'}`}>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Opening Balance</p>
                <h3 className={`text-2xl font-bold mt-2 ${openingBalance > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
                  {formatCurrency(openingBalance)}
                </h3>
              </div>
              <p className={`text-xs font-medium mt-3 flex items-center space-x-1 ${openingBalance > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
                <History className="w-3.5 h-3.5" />
                <span>Prior Unpaid Rent</span>
              </p>
            </div>
          </div>
        </div>

        {/* Assigned Properties & Tenancies */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Property Assignments & Tenancies</h2>
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="text-xs font-semibold text-[#04A26F] hover:underline flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" /> <span>Assign Another Property</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                  <th className="py-3 px-4">Property</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4">Monthly Rent</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">End Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tenancies.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-6 text-center text-gray-500 text-sm">
                      No properties currently assigned to this tenant.
                    </td>
                  </tr>
                ) : (
                  tenancies.map((t) => {
                    const prop = t.propertyId;
                    const propName = prop?.propertyName || prop?.name || t.propertyName || '—';
                    const propAddress = prop?.address || prop?.city || '—';
                    return (
                      <tr key={t._id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-semibold text-gray-900">{propName}</td>
                        <td className="py-3 px-4 text-gray-600 text-xs">{propAddress}</td>
                        <td className="py-3 px-4 font-bold text-gray-900">
                          {formatCurrency(t.monthlyRent)}
                          <span className="text-xs font-normal text-gray-500">/mo</span>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-600">{t.startDate?.slice(0, 10) || '—'}</td>
                        <td className="py-3 px-4 text-xs text-gray-600">{t.endDate?.slice(0, 10) || 'Ongoing'}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              t.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {t.status === 'Active' && (
                            <button
                              onClick={() => handleTerminateTenancy(t._id, propName)}
                              className="text-xs font-medium text-rose-600 hover:bg-rose-50 px-2.5 py-1 rounded transition-colors"
                            >
                              End Tenancy
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Schedules Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Payment Schedules & Due Obligations</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                  <th className="py-3 px-4">Period / Obligation</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Expected</th>
                  <th className="py-3 px-4">Paid</th>
                  <th className="py-3 px-4">Remaining</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {schedules.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-6 text-center text-gray-500 text-sm">
                      No payment schedules generated.
                    </td>
                  </tr>
                ) : (
                  schedules.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-semibold text-gray-900">{s.periodName}</td>
                      <td className="py-3 px-4 text-xs text-gray-600">{s.unitName}</td>
                      <td className="py-3 px-4 text-xs font-mono">{s.dueDate}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        {formatCurrency(s.expectedAmount)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-700">
                        {formatCurrency(s.paidAmount)}
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-600">
                        {formatCurrency(s.remainingAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            s.status === 'Paid' || s.status === 'Received'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.status === 'Overdue'
                              ? 'bg-rose-100 text-rose-800'
                              : s.status === 'Partially Paid' || s.status === 'Partially Received'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {s.status === 'Paid' ? 'Received' : s.status === 'Partially Paid' ? 'Partially Received' : s.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {s.status !== 'Paid' && s.status !== 'Received' && (
                          <button
                            onClick={() => {
                              setSelectedScheduleForPayment(s);
                              setIsPaymentModalOpen(true);
                            }}
                            className="px-3 py-1 bg-[#04A26F] text-white text-xs font-semibold rounded hover:bg-[#03885c] transition-colors"
                          >
                            Record Payment
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Opening Balance rows from API — shown when present */}
          {apiPayments.filter((p) => p.paymentType === 'Opening Balance').length > 0 && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-extrabold text-amber-800">Opening Balance — Prior Unpaid Rent</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-amber-100 text-amber-900 font-bold uppercase">
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3">Total Owed</th>
                      <th className="py-2 px-3">Paid</th>
                      <th className="py-2 px-3">Remaining</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiPayments
                      .filter((p) => p.paymentType === 'Opening Balance')
                      .map((p) => (
                        <tr key={p._id} className="border-t border-amber-200">
                          <td className="py-2 px-3 font-semibold text-amber-900">{p.notes || 'Opening Balance'}</td>
                          <td className="py-2 px-3 font-bold text-amber-800">{formatCurrency(p.amount)}</td>
                          <td className="py-2 px-3 font-bold text-emerald-700">{formatCurrency(p.paidAmount)}</td>
                          <td className="py-2 px-3 font-bold text-rose-700">{formatCurrency(p.remainingAmount)}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.remainingAmount <= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'}`}>
                              {p.remainingAmount <= 0 ? 'Cleared' : 'Outstanding'}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Payment Receipts History */}
        {/* TENANT DOCUMENTS SECTION */}
        <TenantDocumentSection tenantId={customerId} />

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Recorded Payment Receipts History</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Amount Due</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Remaining</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {apiPayments.filter((p) => p.paymentType !== 'Opening Balance' && (p.paidAmount || 0) > 0).length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-gray-500 text-sm">
                      No payment receipts recorded yet.
                    </td>
                  </tr>
                ) : (
                  apiPayments
                    .filter((p) => p.paymentType !== 'Opening Balance' && (p.paidAmount || 0) > 0)
                    .map((p) => (
                      <tr key={p._id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-semibold text-gray-900">{p.periodName || `Month ${p.billingMonth}/${p.billingYear}`}</td>
                        <td className="py-3 px-4 text-xs font-mono">{p.dueDate?.slice(0, 10) || '—'}</td>
                        <td className="py-3 px-4 text-gray-700">{formatCurrency(p.amount)}</td>
                        <td className="py-3 px-4 font-bold text-emerald-700">{formatCurrency(p.paidAmount)}</td>
                        <td className="py-3 px-4 font-bold text-amber-600">{formatCurrency(p.remainingAmount)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            p.status === 'Paid' || p.status === 'Received'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'Partially Paid'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}>
                            {p.status === 'Paid' ? 'Received' : p.status === 'Partially Paid' ? 'Partially Received' : p.status}
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AssignUnitModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        customer={customer}
        onSuccess={loadCustomerData}
      />

      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        scheduleItem={selectedScheduleForPayment}
        onSuccess={loadCustomerData}
      />
    </AppLayout>
  );
}

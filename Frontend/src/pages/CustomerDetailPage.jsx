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
} from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { EntityReportDownloadBar } from '../components/common/EntityReportDownloadBar';
import AssignUnitModal from '../components/customers/AssignUnitModal';
import RecordPaymentModal from '../components/payments/RecordPaymentModal';
import { TenantDocumentSection } from '../components/tenants/TenantDocumentSection';
import {
  getSavedCustomers,
  getAgreementsByCustomer,
  getSavedPaymentSchedules,
  getSavedRecordedPayments,
  getCustomerMetrics,
  terminateAgreement,
} from '../data/customersData';
import { formatCurrency } from '../utils/currencyFormatter';

export default function CustomerDetailPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [agreements, setAgreements] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [payments, setPayments] = useState([]);
  const [metrics, setMetrics] = useState({
    activeAgreementsCount: 0,
    totalExpected: 0,
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
  });

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedScheduleForPayment, setSelectedScheduleForPayment] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const loadCustomerData = () => {
    const customers = getSavedCustomers();
    const found = customers.find((c) => c.id === customerId);
    setCustomer(found || null);

    if (found) {
      const agrs = getAgreementsByCustomer(customerId);
      setAgreements(agrs);

      const allScheds = getSavedPaymentSchedules().filter((s) => s.customerId === customerId);
      setSchedules(allScheds);

      const allPays = getSavedRecordedPayments().filter((p) => p.customerId === customerId);
      setPayments(allPays);

      setMetrics(getCustomerMetrics(customerId));
    }
  };

  useEffect(() => {
    loadCustomerData();
  }, [customerId]);

  const handleTerminateAgreement = (agreementId, unitName) => {
    if (
      window.confirm(
        `Are you sure you want to end this agreement for unit "${unitName}"? The unit will be marked as Available.`
      )
    ) {
      terminateAgreement(agreementId);
      loadCustomerData();
    }
  };

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
                <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  {customer.type}
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
              <span>Assign Unit</span>
            </button>
            <Link
              to={`/tenants/${customer.id}/edit`}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Date Range Report & Statement Download Bar */}
        <EntityReportDownloadBar entityType="tenant" entityId={targetTenantId} entityName={customer.name} />

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
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          </div>
        </div>

        {/* Assigned Units & Agreements */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Agreements & Unit Assignments</h2>
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="text-xs font-semibold text-[#04A26F] hover:underline flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" /> <span>Assign Another Unit</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                  <th className="py-3 px-4">Property</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">Agreement Type</th>
                  <th className="py-3 px-4">Agreed Price</th>
                  <th className="py-3 px-4">Start / End Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {agreements.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-6 text-center text-gray-500 text-sm">
                      No units currently assigned to this tenant.
                    </td>
                  </tr>
                ) : (
                  agreements.map((agr) => (
                    <tr key={agr.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-semibold text-gray-900">{agr.propertyName}</td>
                      <td className="py-3 px-4 font-medium text-gray-800">{agr.unitName}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            agr.agreementType === 'Rent'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-purple-50 text-purple-700'
                          }`}
                        >
                          {agr.agreementType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-900">
                        {formatCurrency(agr.monthlyOrSalePrice)}
                        <span className="text-xs font-normal text-gray-500">
                          {agr.agreementType === 'Rent' ? '/mo' : ''}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600">
                        {agr.startDate} {agr.endDate ? `to ${agr.endDate}` : ''}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            agr.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {agr.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {agr.status === 'Active' && (
                          <button
                            onClick={() => handleTerminateAgreement(agr.id, agr.unitName)}
                            className="text-xs font-medium text-rose-600 hover:bg-rose-50 px-2.5 py-1 rounded transition-colors"
                          >
                            End Agreement
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
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
                  <th className="py-3 px-4">Payment ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Reference / Txn</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-gray-500 text-sm">
                      No payment receipts recorded yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-xs text-gray-600">{p.id}</td>
                      <td className="py-3 px-4 text-xs font-mono">{p.paymentDate}</td>
                      <td className="py-3 px-4 font-bold text-emerald-700">
                        {formatCurrency(p.amountPaid)}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-800">{p.paymentMethod}</td>
                      <td className="py-3 px-4 text-xs font-mono text-gray-600">
                        {p.referenceNo || '—'}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">{p.notes || '—'}</td>
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

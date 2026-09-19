import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  RotateCcw,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { fetchPaymentsAPI, resetPaymentAPI, deletePaymentAPI } from '../../services/apiData';
import { formatCurrency } from '../../utils/currencyFormatter';
import EditPaymentModal from '../../components/payments/EditPaymentModal';
import RecordPaymentModal from '../../components/payments/RecordPaymentModal';

export function TenantPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [selectedPaymentForEdit, setSelectedPaymentForEdit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [selectedScheduleForRecord, setSelectedScheduleForRecord] = useState(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPaymentsAPI();
      if (Array.isArray(data)) {
        setPayments(data);
      }
    } catch (err) {
      console.warn('[TenantPaymentsPage] Failed to fetch payments:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // Status filter
      if (statusFilter !== 'All') {
        if (statusFilter === 'Received' && p.status !== 'Received' && p.status !== 'Paid') return false;
        if (statusFilter === 'Partially Received' && p.status !== 'Partially Received' && p.status !== 'Partially Paid') return false;
        if (statusFilter === 'Pending' && p.status !== 'Pending') return false;
        if (statusFilter === 'Overdue' && p.status !== 'Overdue') return false;
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const cust = p.customerId;
        const custName = (cust?.fullName || cust?.name || cust?.tenantName || p.customerName || '').toLowerCase();
        const prop = p.propertyId;
        const propName = (prop?.propertyName || prop?.name || prop?.address || p.propertyName || '').toLowerCase();
        const ref = (p.reference || '').toLowerCase();
        const notes = (p.notes || '').toLowerCase();
        const method = (p.paymentMethod || '').toLowerCase();

        return (
          custName.includes(q) ||
          propName.includes(q) ||
          ref.includes(q) ||
          notes.includes(q) ||
          method.includes(q)
        );
      }

      return true;
    });
  }, [payments, statusFilter, search]);

  const metrics = useMemo(() => {
    let totalCollected = 0;
    let totalPending = 0;
    let totalOverdue = 0;

    payments.forEach((p) => {
      totalCollected += Number(p.paidAmount || 0);
      if (p.status === 'Overdue') {
        totalOverdue += Number(p.remainingAmount || 0);
      } else if (p.remainingAmount > 0) {
        totalPending += Number(p.remainingAmount || 0);
      }
    });

    return { totalCollected, totalPending, totalOverdue };
  }, [payments]);

  const handleResetPayment = async (p) => {
    const custName = p.customerId?.fullName || p.customerId?.name || 'Tenant';
    if (
      window.confirm(
        `Are you sure you want to reset this received payment of ${formatCurrency(p.paidAmount)} for "${custName}" back to unpaid?\n\nThis will restore their remaining rent balance. Use this if the payment was added by mistake or was a duplicate.`
      )
    ) {
      try {
        await resetPaymentAPI(p._id);
        loadPayments();
      } catch (err) {
        alert(err.message || 'Failed to reset payment');
      }
    }
  };

  const handleDeleteRecord = async (p) => {
    const custName = p.customerId?.fullName || p.customerId?.name || 'Tenant';
    if (
      window.confirm(
        `Are you sure you want to permanently DELETE this payment record for "${custName}"?`
      )
    ) {
      try {
        await deletePaymentAPI(p._id);
        loadPayments();
      } catch (err) {
        alert(err.message || 'Failed to delete payment');
      }
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 text-left pb-12">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <CreditCard className="w-7 h-7 text-[#00a36f]" />
              <span>Tenant Payments & Ledger</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              View, record, edit, and reconcile all rent payments collected from tenants.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              // Open first available unpaid schedule or open modal
              const firstUnpaid = payments.find((p) => p.remainingAmount > 0);
              setSelectedScheduleForRecord(firstUnpaid || null);
              setIsRecordModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00a36f] text-white text-xs font-extrabold shadow-xs hover:bg-[#008f61] cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Record Payment</span>
          </button>
        </div>

        {/* METRICS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Rent Collected</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">
                {formatCurrency(metrics.totalCollected)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Outstanding Dues</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">
                {formatCurrency(metrics.totalPending)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overdue Balance</p>
              <h3 className="text-2xl font-black text-rose-600 mt-1">
                {formatCurrency(metrics.totalOverdue)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* FILTERS & SEARCH */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tenant, property, reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#00a36f] focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#00a36f]"
            >
              <option value="All">All Statuses</option>
              <option value="Received">Received / Cleared</option>
              <option value="Partially Received">Partially Received</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>

        {/* PAYMENTS TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Period</th>
                  <th className="py-3.5 px-4">Tenant</th>
                  <th className="py-3.5 px-4">Property</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Paid Date</th>
                  <th className="py-3.5 px-4 text-right">Rent Due</th>
                  <th className="py-3.5 px-4 text-right">Paid Amount</th>
                  <th className="py-3.5 px-4 text-right">Remaining</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="10" className="py-12 text-center text-slate-400 font-medium">
                      Loading tenant payments ledger...
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="py-12 text-center text-slate-400 font-medium">
                      No payment records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => {
                    const custName =
                      p.customerId?.fullName ||
                      p.customerId?.name ||
                      p.customerId?.tenantName ||
                      p.customerName ||
                      'Tenant';
                    const propName =
                      p.propertyId?.propertyName ||
                      p.propertyId?.name ||
                      p.propertyId?.address ||
                      p.propertyName ||
                      'Property';

                    const hasPaid = (p.paidAmount || 0) > 0;

                    return (
                      <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {p.periodName || (p.billingMonth ? `Month ${p.billingMonth}/${p.billingYear}` : 'Rent Obligation')}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {custName}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-600 truncate max-w-xs">
                          {propName}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono">
                          {p.dueDate?.slice(0, 10) || '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono">
                          {p.paidDate?.slice(0, 10) || '—'}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700 text-right">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="py-3 px-4 font-extrabold text-emerald-600 text-right">
                          {formatCurrency(p.paidAmount)}
                        </td>
                        <td className="py-3 px-4 font-bold text-amber-600 text-right">
                          {formatCurrency(p.remainingAmount)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              p.status === 'Paid' || p.status === 'Received'
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.status === 'Partially Received' || p.status === 'Partially Paid'
                                ? 'bg-amber-100 text-amber-800'
                                : p.status === 'Overdue'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {p.status === 'Paid' ? 'Received' : p.status === 'Partially Paid' ? 'Partially Received' : p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Record Rent button if remaining > 0 */}
                            {p.remainingAmount > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedScheduleForRecord(p);
                                  setIsRecordModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                                title="Record Rent Received"
                              >
                                Record
                              </button>
                            )}

                            {/* Edit button */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPaymentForEdit(p);
                                setIsEditModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit payment details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Reset or Delete button */}
                            {hasPaid ? (
                              <button
                                type="button"
                                onClick={() => handleResetPayment(p)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                title="Reset received amount back to unpaid"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDeleteRecord(p)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete payment record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
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

      {/* MODALS */}
      <EditPaymentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        payment={selectedPaymentForEdit}
        onSuccess={loadPayments}
      />

      <RecordPaymentModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        scheduleItem={selectedScheduleForRecord}
        onSuccess={loadPayments}
      />
    </AppLayout>
  );
}

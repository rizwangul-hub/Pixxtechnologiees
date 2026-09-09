import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  Search,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Receipt,
  X,
  Loader2,
  Calendar,
} from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { formatCurrency } from '../utils/currencyFormatter';
import { fetchAgentPaymentsAPI, recordAgentPaymentAPI, fetchAgentsAPI } from '../services/apiData';
import { downloadFileAPI } from '../services/api';

export default function AgentPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({});
  const [agentsList, setAgentsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Record Payment Modal State
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [amountPaidInput, setAmountPaidInput] = useState('');
  const [paymentMethodInput, setPaymentMethodInput] = useState('Cash');
  const [referenceInput, setReferenceInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedAgent) params.agentId = selectedAgent;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedMonth) params.billingMonth = selectedMonth;
      if (selectedYear) params.billingYear = selectedYear;

      const res = await fetchAgentPaymentsAPI(params);
      setPayments(res.data || []);
      setSummary(res.summary || {});

      const agents = await fetchAgentsAPI();
      setAgentsList(agents || []);
    } catch (e) {
      console.warn('[Agent Payments Load Notice]', e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedAgent, selectedStatus, selectedMonth, selectedYear]);

  const handleOpenPayModal = (payment) => {
    setSelectedPayment(payment);
    setAmountPaidInput(payment.remainingAmount || payment.netAmount || 0);
    setPaymentMethodInput('Cash');
    setReferenceInput('');
    setNotesInput('');
    setIsPayModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedPayment) return;
    const amountNum = parseFloat(amountPaidInput);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    setSubmittingPayment(true);
    try {
      await recordAgentPaymentAPI(selectedPayment._id || selectedPayment.id, {
        amountPaid: amountNum,
        paymentMethod: paymentMethodInput,
        reference: referenceInput,
        notes: notesInput,
      });

      setIsPayModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to record payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto text-left">
        {/* TOP HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Agent Payments & Settlements
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Track monthly company rent expected from agents, approved maintenance expenses, and record money received.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => downloadFileAPI('/export/agent-payments', `Agent_Payments_${Date.now()}.csv`).catch((e) => alert(e.message))}
              className="px-3 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center space-x-1.5 shadow-xs cursor-pointer"
              title="Export Agent Payments to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={() => downloadFileAPI('/export/agent-payments/excel', `Agent_Payments_${Date.now()}.xlsx`).catch((e) => alert(e.message))}
              className="px-3 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center space-x-1.5 shadow-xs cursor-pointer"
              title="Export Agent Payments to Excel"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel</span>
            </button>
          </div>
        </div>

        {/* AGENT MANAGER SUB-NAVIGATION TABS */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <Link
            to="/agents"
            className="px-4 py-2 text-xs font-extrabold rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Agents Directory
          </Link>
          <Link
            to="/agents/payments"
            className="px-4 py-2 text-xs font-extrabold rounded-xl bg-[#04A26F] text-white shadow-xs"
          >
            Agent Payments / Settlements
          </Link>
          <Link
            to="/agents/expenses"
            className="px-4 py-2 text-xs font-extrabold rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Agent Expenses
          </Link>
        </div>

        {/* METRICS SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Company Expected</p>
            <h3 className="text-xl font-black text-slate-900 mt-1">{formatCurrency(summary.totalExpected || 0)}</h3>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider">Agent Expenses</p>
            <h3 className="text-xl font-black text-amber-700 mt-1">{formatCurrency(summary.totalExpenses || 0)}</h3>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Net to Company</p>
            <h3 className="text-xl font-black text-slate-900 mt-1">{formatCurrency(summary.totalNet || 0)}</h3>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs bg-emerald-50/40">
            <p className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">Amount Received</p>
            <h3 className="text-xl font-black text-emerald-800 mt-1">{formatCurrency(summary.totalPaid || 0)}</h3>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs bg-rose-50/40">
            <p className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider">Outstanding</p>
            <h3 className="text-xl font-black text-rose-600 mt-1">{formatCurrency(summary.totalRemaining || 0)}</h3>
          </div>
        </div>

        {/* FILTERS BAR */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <label className="font-extrabold text-slate-400 uppercase tracking-wider">Agent:</label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-[#04A26F]"
            >
              <option value="">All Agents</option>
              {agentsList.map((a) => (
                <option key={a._id || a.id} value={a._id || a.id}>
                  {a.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="font-extrabold text-slate-400 uppercase tracking-wider">Status:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-[#04A26F]"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="font-extrabold text-slate-400 uppercase tracking-wider">Month:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-[#04A26F]"
            >
              <option value="">All Months</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  Month {m}
                </option>
              ))}
            </select>
          </div>

          {(selectedAgent || selectedStatus || selectedMonth) && (
            <button
              onClick={() => {
                setSelectedAgent('');
                setSelectedStatus('');
                setSelectedMonth('');
              }}
              className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* PAYMENTS TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Agent</th>
                  <th className="py-3.5 px-4">Property</th>
                  <th className="py-3.5 px-4">Unit</th>
                  <th className="py-3.5 px-4">Tenant</th>
                  <th className="py-3.5 px-4">Month/Year</th>
                  <th className="py-3.5 px-4">Company Amount</th>
                  <th className="py-3.5 px-4">Agent Expense</th>
                  <th className="py-3.5 px-4">Net Amount</th>
                  <th className="py-3.5 px-4">Received</th>
                  <th className="py-3.5 px-4">Remaining</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="py-8 text-center text-slate-500">
                      {loading ? 'Loading agent settlements...' : 'No agent payments found.'}
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => {
                    const agentName = p.agentId?.fullName || 'N/A';
                    const propName = p.propertyId?.propertyName || p.propertyId?.name || 'N/A';
                    const unitName = p.unitId?.unitName || p.unitId?.name || 'N/A';
                    const tenantName = p.tenantId?.fullName || p.tenantId?.name || 'N/A';

                    return (
                      <tr key={p._id || p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4 font-black text-slate-900">
                          <Link to={`/agents/${p.agentId?._id || p.agentId}`} className="text-[#04A26F] hover:underline">
                            {agentName}
                          </Link>
                        </td>
                        <td className="py-4 px-4 text-slate-800 font-bold">{propName}</td>
                        <td className="py-4 px-4 text-slate-700 font-semibold">{unitName}</td>
                        <td className="py-4 px-4 text-slate-800 font-medium">{tenantName}</td>
                        <td className="py-4 px-4 font-mono font-extrabold text-slate-700">
                          {p.billingMonth}/{p.billingYear}
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-900">{formatCurrency(p.expectedAmount || 0)}</td>
                        <td className="py-4 px-4 font-bold text-amber-700">{formatCurrency(p.expenseAmount || 0)}</td>
                        <td className="py-4 px-4 font-black text-slate-900">{formatCurrency(p.netAmount || 0)}</td>
                        <td className="py-4 px-4 font-black text-emerald-700">{formatCurrency(p.paidAmount || 0)}</td>
                        <td className="py-4 px-4 font-black text-rose-600">{formatCurrency(p.remainingAmount || 0)}</td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              p.status === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.status === 'Partially Paid'
                                ? 'bg-amber-100 text-amber-800'
                                : p.status === 'Overdue'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {p.status || 'Pending'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          {p.remainingAmount > 0 ? (
                            <button
                              onClick={() => handleOpenPayModal(p)}
                              className="px-3 py-1.5 bg-[#04A26F] text-white text-xs font-extrabold rounded-lg hover:bg-[#03885c] transition-colors cursor-pointer shadow-2xs"
                            >
                              Record Payment
                            </button>
                          ) : (
                            <span className="text-[11px] font-bold text-emerald-700">Settled ✓</span>
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

        {/* RECORD PAYMENT MODAL */}
        {isPayModalOpen && selectedPayment && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-[#04A26F]" />
                  <span>Record Agent Payment</span>
                </h3>
                <button
                  onClick={() => setIsPayModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* SETTLEMENT BREAKDOWN CARD */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between text-slate-600 font-semibold">
                  <span>Agent:</span>
                  <span className="font-bold text-slate-900">{selectedPayment.agentId?.fullName}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-semibold">
                  <span>Unit / Property:</span>
                  <span className="font-bold text-slate-900">
                    {selectedPayment.unitId?.unitName || selectedPayment.unitId?.name} ({selectedPayment.propertyId?.propertyName || selectedPayment.propertyId?.name})
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 font-semibold">
                  <span>Billing Period:</span>
                  <span className="font-bold text-slate-900">{selectedPayment.billingMonth}/{selectedPayment.billingYear}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-semibold pt-1 border-t border-slate-200">
                  <span>Company Amount:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(selectedPayment.expectedAmount)}</span>
                </div>
                <div className="flex justify-between text-amber-700 font-semibold">
                  <span>Approved Agent Expenses:</span>
                  <span className="font-bold">- {formatCurrency(selectedPayment.expenseAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-black text-sm pt-1 border-t border-slate-200">
                  <span>Net Amount to Company:</span>
                  <span className="text-[#04A26F]">{formatCurrency(selectedPayment.netAmount)}</span>
                </div>
                <div className="flex justify-between text-rose-600 font-bold text-xs">
                  <span>Currently Outstanding:</span>
                  <span>{formatCurrency(selectedPayment.remainingAmount)}</span>
                </div>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Amount Received from Agent (£) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amountPaidInput}
                    onChange={(e) => setAmountPaidInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-[#04A26F]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethodInput}
                    onChange={(e) => setPaymentMethodInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-[#04A26F]"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Check">Check / Cheque</option>
                    <option value="Online / Mobile Wallet">Online / Mobile Wallet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Transaction / Reference Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TRX-992211"
                    value={referenceInput}
                    onChange={(e) => setReferenceInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[#04A26F]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Settlement Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Received full monthly payment from Ali Khan"
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[#04A26F]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsPayModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayment}
                    className="px-5 py-2 bg-[#04A26F] text-white text-xs font-black rounded-xl hover:bg-[#03885c] flex items-center gap-1.5 shadow-sm"
                  >
                    {submittingPayment && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Confirm & Save Settlement</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

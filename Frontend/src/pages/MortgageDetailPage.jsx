import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Landmark,
  Building2,
  UserCheck,
  CreditCard,
  Calendar,
  DollarSign,
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileText,
  Eye,
  Plus,
  TrendingDown,
  CheckCircle,
  Clock,
  Trash2,
} from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import {
  fetchMortgageByIdAPI,
  fetchMortgagePaymentsAPI,
  recordMortgagePaymentAPI,
  deleteMortgageAPI,
} from '../services/apiData';

export function MortgageDetailPage() {
  const { mortgageId } = useParams();
  const navigate = useNavigate();

  const [mortgage, setMortgage] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    totalPayment: '',
    principalAmount: '',
    interestAmount: '',
    paymentMethod: 'Bank Transfer',
    reference: '',
    notes: '',
    nextPaymentDate: '',
  });

  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  useEffect(() => {
    loadMortgageData();
  }, [mortgageId]);

  const loadMortgageData = async () => {
    setLoading(true);
    setError('');
    try {
      const [mData, pData] = await Promise.all([
        fetchMortgageByIdAPI(mortgageId),
        fetchMortgagePaymentsAPI(mortgageId),
      ]);

      if (!mData) {
        setError('Mortgage record not found');
      } else {
        setMortgage(mData);
        setPayments(pData || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load mortgage details');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPaymentModal = () => {
    setPaymentError('');
    const todayStr = new Date().toISOString().split('T')[0];
    let defaultNextDate = '';
    if (mortgage?.nextPaymentDate) {
      const nextDate = new Date(mortgage.nextPaymentDate);
      nextDate.setMonth(nextDate.getMonth() + 1);
      defaultNextDate = nextDate.toISOString().split('T')[0];
    }

    setPaymentForm({
      paymentDate: todayStr,
      totalPayment: mortgage?.monthlyPayment ? String(mortgage.monthlyPayment) : '',
      principalAmount: '',
      interestAmount: '',
      paymentMethod: 'Bank Transfer',
      reference: '',
      notes: '',
      nextPaymentDate: defaultNextDate,
    });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPaymentError('');

    const tot = Number(paymentForm.totalPayment);
    if (!tot || tot <= 0) {
      setPaymentError('Total Payment amount must be greater than 0.');
      return;
    }

    setPaymentSubmitting(true);
    try {
      await recordMortgagePaymentAPI(mortgageId, paymentForm);
      setIsPaymentModalOpen(false);
      loadMortgageData();
    } catch (err) {
      setPaymentError(err.message || 'Failed to record mortgage payment.');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleDeleteMortgage = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete mortgage record for "${mortgage.propertyId?.name || 'Property'}"?`
      )
    ) {
      return;
    }

    try {
      await deleteMortgageAPI(mortgageId);
      navigate('/mortgages');
    } catch (err) {
      alert(err.message || 'Failed to delete mortgage');
    }
  };

  const formatCurrency = (val) => {
    return `£${(Number(val) || 0).toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-12 text-center text-slate-400 space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-[#04A26F] mx-auto" />
          <p className="text-xs font-bold">Loading Mortgage Details...</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !mortgage) {
    return (
      <AppLayout>
        <div className="p-12 text-center text-slate-600 space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <p className="font-extrabold text-slate-800">{error || 'Mortgage record not found'}</p>
          <button
            type="button"
            onClick={() => navigate('/mortgages')}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Back to Mortgages List
          </button>
        </div>
      </AppLayout>
    );
  }

  const propName = mortgage.propertyId?.name || 'Unassigned Property';
  const propAddress = mortgage.propertyId?.address || '';
  const landlordName = mortgage.landlordId?.fullName || 'Unassigned Landlord';

  return (
    <AppLayout>
      <div className="space-y-6 text-left pb-12">
        {/* BACK BUTTON & TOP TITLE */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/mortgages')}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 cursor-pointer shadow-2xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">{propName}</h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    mortgage.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : mortgage.status === 'Paid Off'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {mortgage.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">{propAddress || 'Mortgage Financial Record'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenPaymentModal}
              className="px-4 py-2.5 bg-[#04A26F] hover:bg-[#03885c] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <DollarSign className="w-4 h-4" />
              <span>Record Bank Payment</span>
            </button>

            <button
              type="button"
              onClick={handleDeleteMortgage}
              className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              title="Delete Record"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MORTGAGE OVERVIEW KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Original Loan Amount
            </span>
            <p className="text-2xl font-black text-slate-900">{formatCurrency(mortgage.originalLoanAmount)}</p>
            <p className="text-[11px] text-slate-400 font-medium">Lender: {mortgage.lenderName}</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Current Outstanding Balance
            </span>
            <p className="text-2xl font-black text-amber-900">{formatCurrency(mortgage.currentOutstandingBalance)}</p>
            <p className="text-[11px] text-slate-400 font-medium">
              Remaining to pay off
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Monthly Payment
            </span>
            <p className="text-2xl font-black text-slate-900">{formatCurrency(mortgage.monthlyPayment)}</p>
            <p className="text-[11px] text-slate-400 font-medium">
              Interest Rate: {mortgage.interestRate ? `${mortgage.interestRate}%` : '0%'}
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Next Due Date
            </span>
            <p className="text-2xl font-black text-slate-900">
              {mortgage.nextPaymentDate ? new Date(mortgage.nextPaymentDate).toLocaleDateString() : '-'}
            </p>
            <p className="text-[11px] text-slate-400 font-medium">
              Frequency: {mortgage.paymentFrequency || 'Monthly'}
            </p>
          </div>
        </div>

        {/* DETAILED INFORMATION PANEL */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Landmark className="w-4 h-4 text-[#04A26F]" />
            <span>Mortgage Specification Details</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs pt-2">
            <div className="space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Property</span>
              <p className="font-extrabold text-slate-900">{propName}</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Landlord</span>
              <p className="font-extrabold text-slate-900">{landlordName}</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Lender Bank</span>
              <p className="font-extrabold text-slate-900">{mortgage.lenderName}</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Account Reference</span>
              <p className="font-mono font-bold text-slate-800">{mortgage.mortgageAccountNumber || 'N/A'}</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Start Date</span>
              <p className="font-bold text-slate-800">
                {mortgage.startDate ? new Date(mortgage.startDate).toLocaleDateString() : '-'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Term Months</span>
              <p className="font-bold text-slate-800">
                {mortgage.termMonths ? `${mortgage.termMonths} months (${Math.round(mortgage.termMonths / 12)} years)` : '-'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Mortgage End Date / Maturity</span>
              <p className="font-bold text-slate-800">
                {mortgage.maturityDate || mortgage.endDate
                  ? new Date(mortgage.maturityDate || mortgage.endDate).toLocaleDateString()
                  : '-'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Status</span>
              <p className="font-extrabold text-emerald-700">{mortgage.status}</p>
            </div>
          </div>

          {mortgage.notes && (
            <div className="pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">Remarks & Notes</span>
              <p className="text-slate-700 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                {mortgage.notes}
              </p>
            </div>
          )}
        </div>

        {/* PAYMENT HISTORY TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <h3 className="text-sm font-extrabold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Mortgage Payment History ({payments.length})</span>
            </h3>

            <button
              type="button"
              onClick={handleOpenPaymentModal}
              className="px-3 py-1 bg-[#04A26F] hover:bg-[#03885c] text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              + Record Payment
            </button>
          </div>

          {payments.length === 0 ? (
            <div className="p-10 text-center text-slate-500 space-y-2">
              <DollarSign className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold text-xs text-slate-700">No Payments Recorded Yet</p>
              <p className="text-[11px] text-slate-400">
                Click "+ Record Payment" above to add mortgage payments made to the bank.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Payment Date</th>
                    <th className="py-3 px-4">Total Paid</th>
                    <th className="py-3 px-4">Principal</th>
                    <th className="py-3 px-4">Interest</th>
                    <th className="py-3 px-4">Remaining Balance</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {payments.map((p) => (
                    <tr key={p._id || p.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {new Date(p.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-mono font-black text-emerald-700">
                        {formatCurrency(p.totalPayment)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {p.principalAmount ? formatCurrency(p.principalAmount) : '-'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {p.interestAmount ? formatCurrency(p.interestAmount) : '-'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-900">
                        {formatCurrency(p.remainingBalance)}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{p.paymentMethod || 'Bank Transfer'}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{p.reference || '-'}</td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{p.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RECORD PAYMENT MODAL */}
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-left animate-fade-in">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#04A26F]" />
                  <span className="font-extrabold text-sm">Record Mortgage Payment</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
                {paymentError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{paymentError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-extrabold text-slate-700 uppercase mb-1">
                      Payment Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={paymentForm.paymentDate}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-800 bg-white cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block font-extrabold text-slate-700 uppercase mb-1">
                      Total Payment (£) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="any"
                      placeholder="e.g. 1200"
                      value={paymentForm.totalPayment}
                      onChange={(e) => setPaymentForm({ ...paymentForm, totalPayment: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-extrabold text-slate-700 uppercase mb-1">
                      Principal Amount (£) (Optional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 700"
                      value={paymentForm.principalAmount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, principalAmount: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-800 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-extrabold text-slate-700 uppercase mb-1">
                      Interest Amount (£) (Optional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 500"
                      value={paymentForm.interestAmount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, interestAmount: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-800 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-extrabold text-slate-700 uppercase mb-1">
                      Payment Method
                    </label>
                    <select
                      value={paymentForm.paymentMethod}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-800 bg-white cursor-pointer"
                    >
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Direct Debit">Direct Debit</option>
                      <option value="Standing Order">Standing Order</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-extrabold text-slate-700 uppercase mb-1">
                      Reference / Transaction ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BANK-PAY-8821"
                      value={paymentForm.reference}
                      onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-800 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 uppercase mb-1">
                    Advance Next Due Date To:
                  </label>
                  <input
                    type="date"
                    value={paymentForm.nextPaymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, nextPaymentDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-800 bg-white cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={paymentSubmitting}
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-extrabold text-white bg-[#04A26F] hover:bg-[#03885c] rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {paymentSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Confirm & Record Payment</span>
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

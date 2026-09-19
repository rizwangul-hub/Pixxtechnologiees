import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { updatePaymentAPI, resetPaymentAPI, deletePaymentAPI } from '../../services/apiData';
import { formatCurrency } from '../../utils/currencyFormatter';

export default function EditPaymentModal({ isOpen, onClose, payment, onSuccess }) {
  const [formData, setFormData] = useState({
    amountPaid: '',
    paidDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer',
    reference: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && payment) {
      setFormData({
        amountPaid: payment.paidAmount !== undefined ? payment.paidAmount : (payment.paymentAmount || payment.amount || ''),
        paidDate: (payment.paidDate || payment.paymentDate || payment.date || new Date().toISOString().split('T')[0]).slice(0, 10),
        paymentMethod: payment.paymentMethod || payment.account || 'Bank Transfer',
        reference: payment.reference || payment.referenceNo || '',
        notes: payment.notes || '',
      });
      setError('');
    }
  }, [isOpen, payment]);

  if (!isOpen || !payment) return null;

  const tenantName =
    payment.customerId?.fullName ||
    payment.customerId?.name ||
    payment.customerId?.tenantName ||
    payment.customerName ||
    payment.payer ||
    'Tenant';

  const propertyName =
    payment.propertyId?.propertyName ||
    payment.propertyId?.name ||
    payment.propertyName ||
    payment.property ||
    'Property';

  const billingPeriod =
    payment.periodName ||
    (payment.billingMonth ? `Month ${payment.billingMonth}/${payment.billingYear}` : 'Rent Obligation');

  const totalDue = Number(payment.amount || payment.expectedAmount || payment.paymentAmount || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const paidVal = parseFloat(formData.amountPaid);
    if (isNaN(paidVal) || paidVal < 0) {
      setError('Please enter a valid received payment amount (0 or greater).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const paymentId = payment._id || payment.id;
      await updatePaymentAPI(paymentId, {
        paidAmount: paidVal,
        paidDate: formData.paidDate,
        paymentMethod: formData.paymentMethod,
        reference: formData.reference,
        notes: formData.notes,
      });

      setLoading(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to update payment');
    }
  };

  const handleResetToUnpaid = async () => {
    if (
      !window.confirm(
        'Are you sure you want to reset this payment back to UNPAID?\n\nThis will remove the received amount and restore the full remaining rent balance. Use this if the payment was added by mistake or was a duplicate.'
      )
    ) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const paymentId = payment._id || payment.id;
      await resetPaymentAPI(paymentId);
      setLoading(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to reset payment');
    }
  };

  const handleDeletePermanently = async () => {
    if (
      !window.confirm(
        'Are you sure you want to completely DELETE this payment record?\n\nIf this was an automated monthly schedule, resetting it back to unpaid is recommended instead. Click OK to proceed with deletion.'
      )
    ) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const paymentId = payment._id || payment.id;
      await deletePaymentAPI(paymentId);
      setLoading(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to delete payment');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 text-left">
        {/* HEADER */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Edit Received Payment</h3>
            <p className="text-xs text-slate-500 mt-0.5">Correct wrong amounts, duplicate entries, or update receipt details</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* INFO SUMMARY */}
        <div className="px-6 py-3.5 bg-blue-50/70 border-b border-blue-100 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Tenant</span>
            <span className="font-bold text-slate-800">{tenantName}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Property</span>
            <span className="font-bold text-slate-800 truncate block">{propertyName}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Period</span>
            <span className="font-medium text-slate-700">{billingPeriod}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Total Due Obligation</span>
            <span className="font-extrabold text-slate-900">{formatCurrency(totalDue)}</span>
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Amount Received (£) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">£</span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.amountPaid}
                onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                className="w-full pl-8 pr-4 py-2 text-sm border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Enter 0 or use the Reset button below if this payment was recorded by mistake.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Received Date *
              </label>
              <input
                type="date"
                required
                value={formData.paidDate}
                onChange={(e) => setFormData({ ...formData, paidDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Method *
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Online">Online</option>
                <option value="Direct Debit">Direct Debit</option>
                <option value="Standing Order">Standing Order</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Reference / Transaction ID
            </label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              placeholder="e.g. TXN-94827 or Bank statement ref"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Notes / Correction Reason
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Corrected typo in amount from bank statement"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />
          </div>

          {/* DANGER / ROLLBACK ACTIONS */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleResetToUnpaid}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200 cursor-pointer"
              title="Reset payment to £0 paid and restore unpaid balance"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Unpaid</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleDeletePermanently}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200 cursor-pointer"
              title="Permanently delete this payment record"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Record</span>
            </button>
          </div>

          {/* FOOTER BUTTONS */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

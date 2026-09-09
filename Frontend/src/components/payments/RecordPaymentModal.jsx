import React, { useState, useEffect } from 'react';
import { X, Check, DollarSign } from 'lucide-react';
import { paymentMethods, recordPayment as recordLocalPayment } from '../../data/customersData';
import { recordPaymentAPI } from '../../services/apiData';
import { formatCurrency } from '../../utils/currencyFormatter';

export default function RecordPaymentModal({ isOpen, onClose, scheduleItem, onSuccess }) {
  const [formData, setFormData] = useState({
    scheduleId: '',
    customerId: '',
    customerName: '',
    propertyId: '',
    propertyName: '',
    unitId: '',
    unitName: '',
    amountPaid: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer',
    referenceNo: '',
    notes: '',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && scheduleItem) {
      const remaining = Number(scheduleItem.remainingAmount) || (Number(scheduleItem.expectedAmount || scheduleItem.amount) - Number(scheduleItem.paidAmount || 0));
      const targetId = scheduleItem._id || scheduleItem.id || scheduleItem.scheduleId;
      const custName = scheduleItem.customerId?.fullName || scheduleItem.customerId?.name || scheduleItem.customerName || '';
      const propName = scheduleItem.propertyId?.propertyName || scheduleItem.propertyId?.name || scheduleItem.propertyName || '';
      const uName = scheduleItem.unitId?.unitName || scheduleItem.unitId?.name || scheduleItem.unitName || '';

      setFormData({
        scheduleId: targetId,
        customerId: scheduleItem.customerId?._id || scheduleItem.customerId || '',
        customerName: custName,
        propertyId: scheduleItem.propertyId?._id || scheduleItem.propertyId || '',
        propertyName: propName,
        unitId: scheduleItem.unitId?._id || scheduleItem.unitId || '',
        unitName: uName,
        amountPaid: remaining > 0 ? remaining : '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'Bank Transfer',
        referenceNo: '',
        notes: scheduleItem.periodName ? `Payment for ${scheduleItem.periodName}` : '',
      });
      setError('');
    }
  }, [isOpen, scheduleItem]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amountPaid || Number(formData.amountPaid) <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }

    setSubmitting(true);

    const targetId = scheduleItem._id || scheduleItem.id || scheduleItem.scheduleId;
    const isMongoId = targetId && typeof targetId === 'string' && /^[0-9a-fA-F]{24}$/.test(targetId);

    try {
      if (isMongoId) {
        await recordPaymentAPI(targetId, {
          amountPaid: Number(formData.amountPaid),
          paymentDate: formData.paymentDate,
          paymentMethod: formData.paymentMethod === 'Cheque' ? 'Other' : formData.paymentMethod,
          reference: formData.referenceNo,
          notes: formData.notes,
        });
      } else {
        // Fallback for local sample items (e.g. sched-103)
        recordLocalPayment({
          scheduleId: targetId,
          customerId: formData.customerId,
          customerName: formData.customerName,
          propertyId: formData.propertyId,
          propertyName: formData.propertyName,
          unitId: formData.unitId,
          unitName: formData.unitName,
          amountPaid: Number(formData.amountPaid),
          paymentDate: formData.paymentDate,
          paymentMethod: formData.paymentMethod,
          referenceNo: formData.referenceNo,
          notes: formData.notes,
        });
      }

      setSubmitting(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.warn('[Record Payment Notice]', err.message);
      // Fallback local save if backend API failed
      recordLocalPayment({
        scheduleId: targetId,
        customerId: formData.customerId,
        customerName: formData.customerName,
        propertyId: formData.propertyId,
        propertyName: formData.propertyName,
        unitId: formData.unitId,
        unitName: formData.unitName,
        amountPaid: Number(formData.amountPaid),
        paymentDate: formData.paymentDate,
        paymentMethod: formData.paymentMethod,
        referenceNo: formData.referenceNo,
        notes: formData.notes,
      });
      setSubmitting(false);
      onClose();
      if (onSuccess) onSuccess();
    }
  };

  if (!isOpen || !scheduleItem) return null;

  const expected = Number(scheduleItem.expectedAmount || scheduleItem.amount) || 0;
  const alreadyPaid = Number(scheduleItem.paidAmount) || 0;
  const remaining = Math.max(0, expected - alreadyPaid);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative text-left">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center space-x-3 mb-5 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#04A26F] flex items-center justify-center font-bold text-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Record Payment</h2>
            <p className="text-xs text-gray-500">
              Record receipt for <span className="font-semibold text-gray-700">{scheduleItem.periodName || 'Rent Payment'}</span>
            </p>
          </div>
        </div>

        {/* Payment Target Summary */}
        <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 mb-5 text-sm space-y-1.5">
          <div className="flex justify-between">
            <span className="text-gray-500">Tenant:</span>
            <span className="font-medium text-gray-800">{formData.customerName || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Property / Unit:</span>
            <span className="font-medium text-gray-800">
              {formData.propertyName} {formData.unitName ? `- ${formData.unitName}` : ''}
            </span>
          </div>
          <div className="flex justify-between pt-1 border-t border-gray-200">
            <span className="text-gray-500">Expected Total:</span>
            <span className="font-semibold text-gray-900">{formatCurrency(expected)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Already Received:</span>
            <span className="font-semibold text-emerald-600">{formatCurrency(alreadyPaid)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Remaining Balance:</span>
            <span className="font-bold text-amber-600">{formatCurrency(remaining)}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Amount Received (£) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 font-semibold text-sm">
                £
              </span>
              <input
                type="number"
                min="1"
                step="any"
                value={formData.amountPaid}
                onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm font-semibold text-gray-900"
                placeholder="0"
                required
              />
            </div>
            {remaining > 0 && Number(formData.amountPaid) < remaining && Number(formData.amountPaid) > 0 && (
              <p className="text-xs text-amber-600 mt-1">
                Partial payment: Remaining balance after payment will be {formatCurrency(remaining - Number(formData.amountPaid))}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Payment Method *
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm"
                required
              >
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Transaction / Reference No
            </label>
            <input
              type="text"
              value={formData.referenceNo}
              onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm"
              placeholder="e.g. TXN-882211, Cheque # 4521"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Payment Notes
            </label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm"
              placeholder="Additional payment details..."
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-medium text-white bg-[#04A26F] hover:bg-[#03885c] rounded-lg transition-colors flex items-center space-x-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{submitting ? 'Recording...' : 'Confirm & Save Payment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

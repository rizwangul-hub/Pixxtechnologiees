import React, { useState, useEffect } from 'react';
import { X, Check, DollarSign, UserCheck, Receipt, Upload, Trash2, FileText, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { paymentMethods, recordPayment as recordLocalPayment } from '../../data/customersData';
import { recordPaymentAPI, fetchAgentsAPI, uploadFileToCloudinaryAPI } from '../../services/apiData';
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
    // Agent Fee details
    agentId: '',
    agentFee: '',
    // Property Expense details
    includeExpense: false,
    expenseAmount: '',
    expenseDescription: '',
    expenseCategory: 'Maintenance',
    expenseSupplier: '',
    expenseReceiptUrl: '',
    expenseReceiptName: '',
  });

  const [agentsList, setAgentsList] = useState([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load available agents on modal open
  useEffect(() => {
    if (isOpen) {
      setLoadingAgents(true);
      fetchAgentsAPI({ status: 'Active' })
        .then((data) => {
          if (Array.isArray(data)) {
            setAgentsList(data);
          }
        })
        .catch((err) => console.warn('[RecordPaymentModal] Error fetching agents:', err.message))
        .finally(() => setLoadingAgents(false));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && scheduleItem) {
      const remaining = Number(scheduleItem.remainingAmount) || (Number(scheduleItem.expectedAmount || scheduleItem.amount) - Number(scheduleItem.paidAmount || 0));
      const targetId = scheduleItem._id || scheduleItem.id || scheduleItem.scheduleId;
      const custName = scheduleItem.customerId?.fullName || scheduleItem.customerId?.name || scheduleItem.customerName || '';
      const propName = scheduleItem.propertyId?.propertyName || scheduleItem.propertyId?.name || scheduleItem.propertyName || '';
      const uName = scheduleItem.unitId?.unitName || scheduleItem.unitId?.name || scheduleItem.unitName || '';

      // Determine attached agent and agent fee from payment, tenancy, or property
      const attachedAgentId =
        scheduleItem.agentId?._id ||
        scheduleItem.agentId ||
        scheduleItem.tenancyId?.agentId?._id ||
        scheduleItem.tenancyId?.agentId ||
        scheduleItem.propertyId?.agentId?._id ||
        scheduleItem.propertyId?.agentId ||
        '';

      const initialAgentFee =
        scheduleItem.agentFee !== undefined && scheduleItem.agentFee !== null && scheduleItem.agentFee !== 0
          ? scheduleItem.agentFee
          : scheduleItem.tenancyId?.companyMonthlyAmount || scheduleItem.propertyId?.agentFee || '';

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
        agentId: attachedAgentId,
        agentFee: initialAgentFee ? String(initialAgentFee) : '',
        includeExpense: false,
        expenseAmount: '',
        expenseDescription: '',
        expenseCategory: 'Maintenance',
        expenseSupplier: '',
        expenseReceiptUrl: '',
        expenseReceiptName: '',
      });
      setError('');
    }
  }, [isOpen, scheduleItem]);

  // Handle receipt file upload (Picture or PDF)
  const handleReceiptUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 15MB
    if (file.size > 15 * 1024 * 1024) {
      setError('Receipt file size exceeds 15MB limit.');
      return;
    }

    setUploadingReceipt(true);
    setError('');

    try {
      const uploadRes = await uploadFileToCloudinaryAPI(file, 'pixxtechnologies/expenses');
      const fileUrl = uploadRes?.url || uploadRes?.secure_url || uploadRes?.fileUrl;

      if (!fileUrl) {
        throw new Error('Upload succeeded but no file URL was returned.');
      }

      setFormData((prev) => ({
        ...prev,
        expenseReceiptUrl: fileUrl,
        expenseReceiptName: file.name,
      }));
    } catch (err) {
      console.error('[Receipt Upload Error]', err);
      setError(err.message || 'Failed to upload receipt file.');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const removeReceipt = () => {
    setFormData((prev) => ({
      ...prev,
      expenseReceiptUrl: '',
      expenseReceiptName: '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const rentVal = Number(formData.amountPaid);
    if (!rentVal || isNaN(rentVal) || rentVal <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }

    const agentFeeNum = Number(formData.agentFee) || 0;
    const expenseNum = formData.includeExpense ? Number(formData.expenseAmount) || 0 : 0;

    if (formData.includeExpense && expenseNum > 0 && !formData.expenseDescription.trim()) {
      setError('Please enter a description for the property expense.');
      return;
    }

    if (agentFeeNum + expenseNum > rentVal) {
      setError('The total deduction (Agent Fee + Expense) exceeds the rent amount received.');
      return;
    }

    setSubmitting(true);

    const targetId = scheduleItem._id || scheduleItem.id || scheduleItem.scheduleId;
    const isMongoId = targetId && typeof targetId === 'string' && /^[0-9a-fA-F]{24}$/.test(targetId);

    const payload = {
      amountPaid: rentVal,
      paymentDate: formData.paymentDate,
      paymentMethod: formData.paymentMethod === 'Cheque' ? 'Other' : formData.paymentMethod,
      reference: formData.referenceNo,
      notes: formData.notes,
      agentId: formData.agentId || undefined,
      agentFee: agentFeeNum,
      expenseAmount: expenseNum,
      expenseDescription: formData.includeExpense ? formData.expenseDescription : '',
      expenseCategory: formData.includeExpense ? formData.expenseCategory : 'Maintenance',
      expenseSupplier: formData.includeExpense ? formData.expenseSupplier : '',
      expenseReceiptUrl: formData.includeExpense ? formData.expenseReceiptUrl : '',
    };

    try {
      if (isMongoId) {
        await recordPaymentAPI(targetId, payload);
      } else {
        // Fallback for local sample items
        recordLocalPayment({
          scheduleId: targetId,
          customerId: formData.customerId,
          customerName: formData.customerName,
          propertyId: formData.propertyId,
          propertyName: formData.propertyName,
          unitId: formData.unitId,
          unitName: formData.unitName,
          amountPaid: rentVal,
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
      // Local fallback save if backend was unreachable
      recordLocalPayment({
        scheduleId: targetId,
        customerId: formData.customerId,
        customerName: formData.customerName,
        propertyId: formData.propertyId,
        propertyName: formData.propertyName,
        unitId: formData.unitId,
        unitName: formData.unitName,
        amountPaid: rentVal,
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

  const rentVal = Number(formData.amountPaid) || 0;
  const agentFeeVal = Number(formData.agentFee) || 0;
  const expenseVal = formData.includeExpense ? Number(formData.expenseAmount) || 0 : 0;
  const netLandlord = Math.max(0, rentVal - agentFeeVal - expenseVal);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-60 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-7 relative text-left my-8 max-h-[92vh] flex flex-col">
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#04A26F] flex items-center justify-center font-bold text-xl shadow-xs border border-emerald-100">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Record Rent Payment</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Receipt for <span className="font-semibold text-gray-700">{scheduleItem.periodName || 'Rent Payment'}</span> with auto-deductions & disbursement breakdown.
            </p>
          </div>
        </div>

        <div className="overflow-y-auto pr-1 space-y-5 flex-1">
          {/* Payment Target Summary */}
          <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-200 text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-500">Tenant:</span>
              <span className="font-semibold text-gray-900">{formData.customerName || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Property / Unit:</span>
              <span className="font-medium text-gray-800">
                {formData.propertyName} {formData.unitName ? `- ${formData.unitName}` : ''}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
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
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form id="recordPaymentForm" onSubmit={handleSubmit} className="space-y-4">
            {/* Rent Amount */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Amount Received from Tenant (£) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 font-semibold text-sm">
                  £
                </span>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={formData.amountPaid}
                  onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-base font-bold text-gray-900"
                  placeholder="0.00"
                  required
                />
              </div>
              {remaining > 0 && Number(formData.amountPaid) < remaining && Number(formData.amountPaid) > 0 && (
                <p className="text-xs text-amber-600 mt-1 font-medium">
                  Partial payment: Remaining balance after this payment will be {formatCurrency(remaining - Number(formData.amountPaid))}
                </p>
              )}
            </div>

            {/* Date & Payment Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm font-medium"
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

            {/* Reference & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm"
                  placeholder="e.g. Monthly rent received"
                />
              </div>
            </div>

            {/* --- SECTION: AGENT & AGENT FEE DEDUCTION --- */}
            <div className="border border-indigo-100 bg-indigo-50/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-2 text-indigo-900">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold uppercase tracking-wider">Agent Fee Deduction & Ledger Credit</span>
              </div>
              <p className="text-xs text-indigo-700">
                Deduct the agent commission fee directly from this rent collection. The fee will automatically credit to the Agent's settlement ledger.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Assigned Agent
                  </label>
                  <select
                    value={formData.agentId}
                    onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                  >
                    <option value="">-- No Agent Attached --</option>
                    {agentsList.map((ag) => (
                      <option key={ag._id || ag.id} value={ag._id || ag.id}>
                        {ag.fullName || ag.name} {ag.phone ? `(${ag.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Agent Fee (£)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 font-semibold text-sm">
                      £
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formData.agentFee}
                      onChange={(e) => setFormData({ ...formData, agentFee: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-indigo-900 bg-white"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* --- SECTION: PROPERTY EXPENSE DEDUCTION --- */}
            <div className="border border-amber-200 bg-amber-50/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-amber-900">
                  <Receipt className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold uppercase tracking-wider">Property Expense Deduction & Receipt</span>
                </div>
                <label className="inline-flex items-center cursor-pointer space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.includeExpense}
                    onChange={(e) => setFormData({ ...formData, includeExpense: e.target.checked })}
                    className="rounded border-gray-300 text-[#04A26F] focus:ring-[#04A26F] w-4 h-4"
                  />
                  <span className="text-xs font-bold text-amber-900">Deduct Expense</span>
                </label>
              </div>

              {formData.includeExpense && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-amber-800 font-medium">
                    Record any maintenance, repair, or utility expense paid from this rent. The amount will be deducted, an Expense logged in the system, and your uploaded receipt saved.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Expense Amount (£) *
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 font-semibold text-sm">
                          £
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={formData.expenseAmount}
                          onChange={(e) => setFormData({ ...formData, expenseAmount: e.target.value })}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-semibold text-amber-900 bg-white"
                          placeholder="0.00"
                          required={formData.includeExpense}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={formData.expenseCategory}
                        onChange={(e) => setFormData({ ...formData, expenseCategory: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white"
                      >
                        <option value="Maintenance">Maintenance</option>
                        <option value="Repairs">Repairs</option>
                        <option value="Utilities">Utilities</option>
                        <option value="Insurance">Insurance</option>
                        <option value="Tax">Tax</option>
                        <option value="Management Fee">Management Fee</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Expense Description *
                      </label>
                      <input
                        type="text"
                        value={formData.expenseDescription}
                        onChange={(e) => setFormData({ ...formData, expenseDescription: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white"
                        placeholder="e.g. Boiler repair, Lock replacement"
                        required={formData.includeExpense}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Supplier / Contractor
                      </label>
                      <input
                        type="text"
                        value={formData.expenseSupplier}
                        onChange={(e) => setFormData({ ...formData, expenseSupplier: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white"
                        placeholder="e.g. Fast Plumbing Ltd"
                      />
                    </div>
                  </div>

                  {/* Receipt Upload (Image or PDF) */}
                  <div className="pt-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Upload Expense Receipt (Picture or PDF)
                    </label>

                    {formData.expenseReceiptUrl ? (
                      <div className="flex items-center justify-between p-3 bg-white border border-emerald-300 rounded-lg">
                        <div className="flex items-center space-x-2 overflow-hidden">
                          <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span className="text-xs font-medium text-gray-800 truncate max-w-xs">
                            {formData.expenseReceiptName || 'Uploaded Receipt Document'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <a
                            href={formData.expenseReceiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded"
                            title="View Receipt"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            type="button"
                            onClick={removeReceipt}
                            className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded cursor-pointer"
                            title="Remove Receipt"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 hover:border-amber-400 bg-white hover:bg-amber-50/20 rounded-xl cursor-pointer transition-colors">
                        {uploadingReceipt ? (
                          <div className="flex items-center space-x-2 text-xs font-semibold text-amber-700">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Uploading receipt to Cloudinary...</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-gray-400 mb-1" />
                            <span className="text-xs font-semibold text-gray-700">Click to upload Receipt Image or PDF</span>
                            <span className="text-[11px] text-gray-400 mt-0.5">PNG, JPG, JPEG, or PDF up to 15MB</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleReceiptUpload}
                          disabled={uploadingReceipt}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* --- LIVE FINANCIAL BREAKDOWN SUMMARY BANNER --- */}
            <div className="bg-gradient-to-br from-gray-900 to-slate-800 text-white rounded-xl p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-300 font-semibold border-b border-gray-700 pb-2">
                <span>Total Rent Received:</span>
                <span className="text-sm font-bold text-emerald-400">{formatCurrency(rentVal)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-300">
                <span>Less Agent Fee:</span>
                <span className="font-semibold text-rose-300">-{formatCurrency(agentFeeVal)}</span>
              </div>
              {formData.includeExpense && (
                <div className="flex items-center justify-between text-xs text-gray-300">
                  <span>Less Property Expense:</span>
                  <span className="font-semibold text-rose-300">-{formatCurrency(expenseVal)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm font-extrabold text-white pt-2 border-t border-gray-700">
                <span className="flex items-center space-x-1.5">
                  <span>Net Rent to Landlord:</span>
                </span>
                <span className="text-base text-emerald-300">{formatCurrency(netLandlord)}</span>
              </div>
            </div>
          </form>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100 shrink-0 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="recordPaymentForm"
            disabled={submitting || uploadingReceipt}
            className="px-6 py-2.5 text-sm font-bold text-white bg-[#04A26F] hover:bg-[#03885c] rounded-lg transition-colors flex items-center space-x-2 cursor-pointer shadow-sm disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Confirm & Record Payment</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

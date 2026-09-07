import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { ArrowLeft, Save, Copy, DollarSign } from 'lucide-react';
import { demoPayers, bankAccounts, paymentTypes, saveIncomePayment } from '../data/paymentsData';

export function AddIncomePaymentPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    payer: '',
    date: new Date().toISOString().split('T')[0],
    paymentAmount: '0.00',
    reference: '',
    paymentType: 'Bank Transfer',
    account: 'My Bank Account',
    property: '82 COMO STREET', // Default property reference
  });

  const [outstandingBalance, setOutstandingBalance] = useState('0.00');

  const handlePayerChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, payer: val }));

    if (val === 'John Smith') {
      setOutstandingBalance('1,450.00');
    } else if (val === 'Sarah Williams') {
      setOutstandingBalance('850.00');
    } else if (val === 'ABC Properties Ltd') {
      setOutstandingBalance('620.00');
    } else {
      setOutstandingBalance('0.00');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.payer) {
      alert('Please select a Payer / Tenant.');
      return;
    }

    const numAmount = parseFloat(formData.paymentAmount) || 0;

    const newPayment = {
      id: `inc-pay-${Date.now()}`,
      payer: formData.payer,
      reference: formData.reference || `Income payment from ${formData.payer}`,
      property: formData.property,
      date: formData.date,
      account: formData.account,
      paymentAmount: numAmount,
      allocatedAmount: numAmount,
      unallocatedAmount: 0.0,
      paymentType: formData.paymentType,
    };

    saveIncomePayment(newPayment);
    navigate('/payments', { state: { activeTab: 'income' } });
  };

  return (
    <AppLayout>
      <div className="space-y-6 text-left pb-12 max-w-5xl mx-auto">
        {/* BREADCRUMB */}
        <div className="flex items-center gap-3">
          <Link
            to="/payments"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-[#00a36f] shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Payments</span>
          </Link>
          <span className="text-xs text-slate-400">/</span>
          <span className="text-xs font-bold text-slate-900">Add Payment (Income)</span>
        </div>

        {/* MAIN CONTAINER */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Add Payment (Income)</span>
              <DollarSign className="w-6 h-6 text-[#00a36f]" />
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Record a rent payment, tenant receipt, or non-rental income transaction.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {/* PAYER / TENANT + OUTSTANDING BALANCE */}
              <div className="space-y-1 md:col-span-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-700">Payer / Tenant *</label>
                  <span className="text-[11px] font-bold text-slate-500">
                    Outstanding Balance: <strong className="text-slate-900">£{outstandingBalance}</strong>
                  </span>
                </div>
                <select
                  required
                  value={formData.payer}
                  onChange={handlePayerChange}
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a36f]/20 focus:border-[#00a36f] bg-amber-50/30 cursor-pointer"
                >
                  <option value="">- Select -</option>
                  {demoPayers.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* DATE OF PAYMENT */}
              <div className="space-y-1 md:col-span-1">
                <label className="text-xs font-extrabold text-slate-700">Date of Payment *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a36f]/20 focus:border-[#00a36f] bg-amber-50/30"
                />
              </div>

              {/* PAYMENT AMOUNT */}
              <div className="space-y-1 md:col-span-1">
                <label className="text-xs font-extrabold text-slate-700">Payment Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">£</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.paymentAmount}
                    onChange={(e) => setFormData({ ...formData, paymentAmount: e.target.value })}
                    className="w-full pl-7 pr-3 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a36f]/20 focus:border-[#00a36f] bg-amber-50/30 font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* PAYMENT REFERENCE */}
              <div className="space-y-1 md:col-span-1">
                <label className="text-xs font-extrabold text-slate-700">Payment Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly Rent Apt 4B"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a36f]/20 focus:border-[#00a36f]"
                />
              </div>

              {/* PAYMENT TYPE */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-extrabold text-slate-700">Payment Type</label>
                <select
                  value={formData.paymentType}
                  onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a36f]/20 focus:border-[#00a36f] bg-amber-50/30 cursor-pointer"
                >
                  {paymentTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* BANK ACCOUNT */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-extrabold text-slate-700">Bank Account</label>
                <div className="flex items-center gap-2">
                  <select
                    value={formData.account}
                    onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a36f]/20 focus:border-[#00a36f] bg-amber-50/30 cursor-pointer"
                  >
                    {bankAccounts.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    title="Copy bank details"
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-600 cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate('/payments')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-extrabold text-white bg-[#00a36f] hover:bg-[#008f61] active:bg-[#007a53] rounded-lg transition-all cursor-pointer shadow-xs focus:ring-2 focus:ring-[#00a36f]"
              >
                <Save className="w-4 h-4 stroke-[2.5]" />
                <span>Save</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}

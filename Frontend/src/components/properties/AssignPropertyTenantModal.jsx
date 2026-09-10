import React, { useState, useEffect } from 'react';
import { X, Building2, User, Users, Calendar, DollarSign, ShieldCheck } from 'lucide-react';
import { fetchCustomersFromAPI, fetchAgentsAPI, assignTenancyAPI } from '../../services/apiData';
import { getSavedCustomers, saveAgreement } from '../../data/customersData';

export function AssignPropertyTenantModal({
  isOpen,
  onClose,
  property,
  onSuccess,
}) {
  const [customers, setCustomers] = useState([]);
  const [agents, setAgents] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    agentId: '',
    companyMonthlyAmount: '',
    agentPaymentDueDay: 1,
    agreementType: 'Rent',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    monthlyRent: '',
    paymentDueDay: 1,
    securityDeposit: '',
    openingBalance: '',
    billingStartDate: '2026-01-01',
    notes: '',
  });

  useEffect(() => {
    if (isOpen && property) {
      setError('');
      setFormData({
        customerId: '',
        customerName: '',
        agentId: '',
        companyMonthlyAmount: '',
        agentPaymentDueDay: 1,
        agreementType: property.priceType === 'sale' ? 'Sale' : 'Rent',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        monthlyRent: property.monthlyRent || property.price || '',
        paymentDueDay: 1,
        securityDeposit: '',
        openingBalance: '',
        billingStartDate: '2026-01-01',
        notes: '',
      });

      const loadOptions = async () => {
        try {
          const [apiCusts, apiAgents] = await Promise.all([
            fetchCustomersFromAPI(),
            fetchAgentsAPI(),
          ]);

          const localCusts = getSavedCustomers();
          const activeCusts = (apiCusts && apiCusts.length > 0 ? apiCusts : localCusts).filter(
            (c) => !c.isArchived && c.status !== 'Archived'
          );

          setCustomers(activeCusts || []);
          setAgents(apiAgents || []);
        } catch (e) {
          console.warn('[Assign Modal Load Warning]', e.message);
        }
      };

      loadOptions();
    }
  }, [isOpen, property]);

  if (!isOpen || !property) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerId) {
      setError('Please select a tenant.');
      return;
    }

    if (!formData.monthlyRent || Number(formData.monthlyRent) <= 0) {
      setError('Please enter a valid monthly rent amount.');
      return;
    }

    setSubmitting(true);
    setError('');

    const targetPropertyId = property._id || property.id;

    try {
      // 1. Assign tenancy in Backend REST API
      try {
        await assignTenancyAPI({
          customerId: formData.customerId,
          propertyId: targetPropertyId,
          agentId: formData.agentId || null,
          companyMonthlyAmount: Number(formData.companyMonthlyAmount) || 0,
          agentPaymentDueDay: Number(formData.agentPaymentDueDay) || 1,
          startDate: formData.startDate,
          endDate: formData.endDate,
          monthlyRent: Number(formData.monthlyRent) || 0,
          paymentDueDay: Number(formData.paymentDueDay) || 1,
          securityDeposit: Number(formData.securityDeposit) || 0,
          openingBalance: Number(formData.openingBalance) || 0,
          billingStartDate: formData.billingStartDate || '',
          notes: formData.notes,
        });
      } catch (apiErr) {
        console.warn('[API Warning] Tenancy API error, falling back locally:', apiErr.message);
      }

      // 2. Save locally for offline/instant UI sync
      saveAgreement({
        customerId: formData.customerId,
        customerName: formData.customerName,
        propertyId: targetPropertyId,
        propertyName: property.name || property.propertyName,
        agreementType: formData.agreementType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        monthlyOrSalePrice: formData.monthlyRent,
        securityDeposit: formData.securityDeposit,
        dueDayOfMonth: formData.paymentDueDay,
        notes: formData.notes,
      });

      setSubmitting(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('[Assign Tenant Error]', err);
      setError(err.message || 'Failed to assign tenant to property.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 relative text-left border border-slate-100 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#04A26F] flex items-center justify-center font-bold shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Assign Tenant to Property</h2>
            <p className="text-xs font-semibold text-slate-500">
              Create an active rental agreement for <span className="text-slate-800 font-extrabold">{property.name || property.propertyName}</span>.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Property Overview summary badge */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Property</span>
              <span className="font-extrabold text-slate-900 text-sm">{property.name || property.propertyName}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Property Type</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-white border border-slate-200 text-slate-700">
                {property.assetType || property.propertyType || property.type}
              </span>
            </div>
          </div>

          {/* Tenant Selection */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Select Tenant *
            </label>
            <select
              value={formData.customerId}
              onChange={(e) => {
                const cid = e.target.value;
                const cust = customers.find((c) => (c._id || c.id)?.toString() === cid);
                setFormData((prev) => ({
                  ...prev,
                  customerId: cid,
                  customerName: cust ? (cust.fullName || cust.name) : '',
                }));
              }}
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] bg-white font-medium"
            >
              <option value="">-- Choose Tenant --</option>
              {customers.map((c) => {
                const cid = c._id || c.id;
                const cname = c.fullName || c.name;
                return (
                  <option key={cid} value={cid}>
                    {cname} {c.phone ? `(${c.phone})` : ''} {c.email ? `- ${c.email}` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Managing Agent Selection (Optional) */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Managing Agent / Agency</span>
              <span className="text-[10px] font-normal text-slate-400">Optional</span>
            </label>
            <select
              value={formData.agentId}
              onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] bg-white font-medium"
            >
              <option value="">-- No Agent (Direct Management) --</option>
              {agents.map((a) => {
                const aid = a._id || a.id;
                const aname = a.fullName || a.name || a.agencyName;
                return (
                  <option key={aid} value={aid}>
                    {aname} {a.agencyName && a.agencyName !== aname ? `(${a.agencyName})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* If Agent selected, show agent fee */}
          {formData.agentId && (
            <div className="grid grid-cols-2 gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-emerald-900">Agent Monthly Fee (£)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 100"
                  value={formData.companyMonthlyAmount}
                  onChange={(e) => setFormData({ ...formData, companyMonthlyAmount: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-emerald-900">Payment Due Day</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.agentPaymentDueDay}
                  onChange={(e) => setFormData({ ...formData, agentPaymentDueDay: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]"
                />
              </div>
            </div>
          )}

          {/* Rent & Deposit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Monthly Rent (£) *</label>
              <input
                type="number"
                min="0"
                required
                value={formData.monthlyRent}
                onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]"
                placeholder="e.g. 1200"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Rent Due Day of Month</label>
              <input
                type="number"
                min="1"
                max="31"
                value={formData.paymentDueDay}
                onChange={(e) => setFormData({ ...formData, paymentDueDay: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Security Deposit (£)</label>
              <input
                type="number"
                min="0"
                value={formData.securityDeposit}
                onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]"
                placeholder="e.g. 1200"
              />
            </div>
          </div>

          {/* Start Date & End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Agreement Start Date *</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Agreement End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Notes / Agreement Details</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]"
              placeholder="Any specific agreement terms or notes..."
            />
          </div>

          {/* Opening Balance — for historical tenancies */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 text-amber-600">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div>
                <p className="text-xs font-extrabold text-amber-800">Opening Balance (Prior Unpaid Rent)</p>
                <p className="text-[10px] text-amber-700 leading-snug mt-0.5">
                  For tenants who have been renting for years — enter the total unpaid rent
                  from <strong>before the billing start date</strong>. System will only generate
                  monthly records from the billing start date onwards.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-amber-900">Opening Balance (£)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.openingBalance}
                  onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                  placeholder="e.g. 3600 (leave 0 if none)"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-amber-900">Billing Start Date</label>
                <input
                  type="date"
                  value={formData.billingStartDate}
                  onChange={(e) => setFormData({ ...formData, billingStartDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                />
                <p className="text-[10px] text-amber-700">Monthly records generated from this date (default: Jan 2026)</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-[#04A26F] hover:bg-[#03885c] rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Assigning...' : 'Confirm & Assign Tenant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

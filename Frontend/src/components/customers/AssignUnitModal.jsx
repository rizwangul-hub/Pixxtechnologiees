import React, { useState, useEffect } from 'react';
import { X, Check, Building2, User, Users } from 'lucide-react';
import { fetchPropertiesFromAPI, fetchUnitsFromAPI, assignTenancyAPI, fetchAgentsAPI, fetchCustomersFromAPI } from '../../services/apiData';
import { getSavedProperties, getSavedUnits } from '../../data/propertiesData';
import { getSavedCustomers, saveAgreement } from '../../data/customersData';

export default function AssignUnitModal({ isOpen, onClose, customer, initialPropertyId, initialUnitId, onSuccess }) {
  const [properties, setProperties] = useState([]);
  const [allUnits, setAllUnits] = useState([]);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [agents, setAgents] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    propertyId: '',
    propertyName: '',
    unitId: '',
    unitName: '',
    agentId: '',
    companyMonthlyAmount: '',
    agentPaymentDueDay: 1,
    agreementType: 'Rent',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    monthlyOrSalePrice: '',
    securityDeposit: '',
    paymentFrequency: 'Monthly',
    dueDayOfMonth: 5,
    notes: '',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const loadInitialData = async () => {
        let props = await fetchPropertiesFromAPI();
        let units = await fetchUnitsFromAPI();
        let agentData = await fetchAgentsAPI();
        let custData = await fetchCustomersFromAPI();

        const localProps = getSavedProperties();
        const localUnits = getSavedUnits();
        const localCusts = getSavedCustomers();

        const combinedProps = (props && props.length > 0) ? props : localProps;
        const combinedUnits = (units && Array.isArray(units) && units.length > 0) ? units : localUnits;

        setProperties(combinedProps || []);
        setAllUnits(combinedUnits || []);
        setAgents(agentData || []);
        
        const activeCustomers = (custData && custData.length > 0 ? custData : localCusts).filter(
          (c) => !c.isArchived && c.status !== 'Archived'
        );
        setCustomers(activeCustomers);
      };
      loadInitialData();

      const initialCustId = customer ? (customer.id || customer._id) : '';
      const initialCustName = customer ? (customer.name || customer.fullName) : '';
      const selectedPropId = initialPropertyId ? initialPropertyId.toString() : '';
      const selectedUnitId = initialUnitId ? initialUnitId.toString() : '';

      setFormData((prev) => ({
        ...prev,
        customerId: initialCustId,
        customerName: initialCustName,
        propertyId: selectedPropId,
        unitId: selectedUnitId,
      }));

      setError('');
    }
  }, [isOpen, customer, initialPropertyId, initialUnitId]);

  // When Property selection changes, fetch fresh units directly from backend or filter allUnits/localUnits
  useEffect(() => {
    if (formData.propertyId) {
      const propIdStr = formData.propertyId.toString();

      const loadPropertyUnits = async () => {
        try {
          const apiUnits = await fetchUnitsFromAPI(propIdStr);
          const localUnits = getSavedUnits();

          // Merge API units and local units
          let unitsList = [];
          if (Array.isArray(apiUnits) && apiUnits.length > 0) {
            unitsList = apiUnits;
          } else {
            unitsList = allUnits.length > 0 ? allUnits : localUnits;
          }

          let filtered = unitsList.filter((u) => {
            const uPropId = u.propertyId?._id 
              ? u.propertyId._id.toString() 
              : u.propertyId 
              ? u.propertyId.toString() 
              : u.property?.id || u.property?._id || '';
            const isMatch = uPropId === propIdStr || (!uPropId && unitsList.length === 1);
            const isAvail = u.status === 'Available' || u.status === 'Reserved' || !u.status || u.status === 'available';
            return isMatch && isAvail;
          });

          // Fallback if filtered is empty: check localUnits directly
          if (filtered.length === 0 && localUnits.length > 0) {
            filtered = localUnits.filter((u) => {
              const uPropId = u.propertyId?._id ? u.propertyId._id.toString() : u.propertyId ? u.propertyId.toString() : '';
              const isMatch = uPropId === propIdStr;
              const isAvail = u.status === 'Available' || u.status === 'Reserved' || !u.status;
              return isMatch && isAvail;
            });
          }

          setAvailableUnits(filtered);

          // If initialUnitId was passed, auto-select that unit
          if (formData.unitId) {
            const activeList = filtered.length > 0 ? filtered : unitsList;
            const matchingUnit = activeList.find((u) => (u._id || u.id)?.toString() === formData.unitId.toString());
            if (matchingUnit) {
              setFormData((prev) => ({
                ...prev,
                unitName: matchingUnit.name || matchingUnit.unitName || '',
                agreementType: matchingUnit.priceType === 'sale' ? 'Sale' : 'Rent',
                monthlyOrSalePrice: matchingUnit.price || matchingUnit.monthlyRent || '',
              }));
            }
          }
        } catch (e) {
          console.warn('[Units Fetch Notice]', e.message);
          const localUnits = getSavedUnits();
          const filtered = (allUnits.length > 0 ? allUnits : localUnits).filter((u) => {
            const uPropId = u.propertyId?._id ? u.propertyId._id.toString() : u.propertyId ? u.propertyId.toString() : '';
            return uPropId === propIdStr && (u.status === 'Available' || u.status === 'Reserved' || !u.status);
          });
          setAvailableUnits(filtered);
        }
      };

      loadPropertyUnits();

      const propObj = properties.find((p) => (p.id || p._id)?.toString() === propIdStr);
      if (propObj) {
        setFormData((prev) => ({
          ...prev,
          propertyName: propObj.name || propObj.propertyName,
        }));
      }
    } else {
      setAvailableUnits([]);
    }
  }, [formData.propertyId, properties, allUnits]);

  // When Unit selection changes, prefill unit price and type
  const handleUnitChange = (e) => {
    const selectedUnitId = e.target.value;
    const selectedUnit = availableUnits.find((u) => (u.id || u._id)?.toString() === selectedUnitId);

    if (selectedUnit) {
      setFormData((prev) => ({
        ...prev,
        unitId: selectedUnit.id || selectedUnit._id,
        unitName: selectedUnit.name || selectedUnit.unitName,
        agreementType: selectedUnit.priceType === 'sale' ? 'Sale' : 'Rent',
        monthlyOrSalePrice: selectedUnit.price || selectedUnit.monthlyRent || '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        unitId: '',
        unitName: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerId || !formData.propertyId || !formData.unitId) {
      setError('Please select a Tenant, Property, and Unit.');
      return;
    }

    if (!formData.monthlyOrSalePrice || Number(formData.monthlyOrSalePrice) <= 0) {
      setError('Please enter a valid agreed price/rent.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Backend REST API Tenancy Assignment
      try {
        await assignTenancyAPI({
          customerId: formData.customerId,
          propertyId: formData.propertyId,
          unitId: formData.unitId,
          agentId: formData.agentId || null,
          companyMonthlyAmount: Number(formData.companyMonthlyAmount) || 0,
          agentPaymentDueDay: Number(formData.agentPaymentDueDay) || 1,
          startDate: formData.startDate,
          endDate: formData.endDate,
          monthlyRent: Number(formData.monthlyOrSalePrice) || 0,
          paymentDueDay: Number(formData.dueDayOfMonth) || 1,
          securityDeposit: Number(formData.securityDeposit) || 0,
          notes: formData.notes,
        });
      } catch (e) {
        console.warn('[API Warning] Falling back to local agreement save:', e.message);
      }

      // 2. Local fallback save
      saveAgreement(formData);
      setSubmitting(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError('Failed to assign unit. Please try again.');
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 relative text-left">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#04A26F] flex items-center justify-center font-bold text-xl">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Assign Unit & Create Agreement</h2>
            <p className="text-xs text-gray-500">
              Assign {formData.customerName ? `"${formData.customerName}"` : 'a Tenant'} to an available property unit.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Tenant Selection */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Select Tenant / Customer *
            </label>
            {customer && (customer.name || customer.fullName) ? (
              <div className="flex items-center justify-between bg-white px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-800">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#04A26F]" />
                  <span>{customer.name || customer.fullName}</span>
                </div>
                <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-medium">Pre-selected</span>
              </div>
            ) : (
              <select
                value={formData.customerId}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const selectedCust = customers.find((c) => (c._id || c.id)?.toString() === selectedId);
                  setFormData((prev) => ({
                    ...prev,
                    customerId: selectedId,
                    customerName: selectedCust ? (selectedCust.name || selectedCust.fullName) : '',
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm bg-white"
                required
              >
                <option value="">-- Choose Tenant --</option>
                {customers.map((c) => {
                  const cid = c._id || c.id;
                  const cname = c.name || c.fullName;
                  return (
                    <option key={cid} value={cid}>
                      {cname} {c.phone ? `(${c.phone})` : ''} {c.email ? `- ${c.email}` : ''}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Property & Unit Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Select Property *
              </label>
              <select
                value={formData.propertyId}
                onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm"
                required
              >
                <option value="">-- Choose Property --</option>
                {properties.map((p) => {
                  const pid = p._id || p.id;
                  const pname = p.name || p.propertyName;
                  return (
                    <option key={pid} value={pid}>
                      {pname} ({p.type})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Select Available Unit *
              </label>
              <select
                value={formData.unitId}
                onChange={handleUnitChange}
                disabled={!formData.propertyId}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                required
              >
                <option value="">-- Choose Unit --</option>
                {availableUnits.map((u) => {
                  const uid = u._id || u.id;
                  const uname = u.name || u.unitName;
                  const uprice = u.price || u.monthlyRent || 0;
                  return (
                    <option key={uid} value={uid}>
                      {uname} ({u.type || u.unitType || 'Unit'} - £{uprice.toLocaleString()} {u.priceType === 'sale' ? 'Sale' : '/mo'})
                    </option>
                  );
                })}
              </select>
              {formData.propertyId && availableUnits.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">No available units in this property.</p>
              )}
            </div>
          </div>

          {/* Agreement Type & Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Agreement Type *
              </label>
              <select
                value={formData.agreementType}
                onChange={(e) => setFormData({ ...formData, agreementType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm"
                required
              >
                <option value="Rent">Rent Agreement</option>
                <option value="Sale">Sale Agreement</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                {formData.agreementType === 'Rent' ? 'Monthly Rent (£) *' : 'Total Sale Price (£) *'}
              </label>
              <input
                type="number"
                min="0"
                value={formData.monthlyOrSalePrice}
                onChange={(e) => setFormData({ ...formData, monthlyOrSalePrice: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm"
                placeholder="e.g. 1250"
                required
              />
            </div>

            {formData.agreementType === 'Rent' ? (
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Security Deposit (£)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.securityDeposit}
                  onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm"
                  placeholder="e.g. 1500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Payment Frequency
                </label>
                <select
                  value={formData.paymentFrequency}
                  onChange={(e) => setFormData({ ...formData, paymentFrequency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm"
                >
                  <option value="One-Time">Lump Sum / One-Time</option>
                  <option value="Monthly">Monthly Installments</option>
                </select>
              </div>
            )}
          </div>

          {/* Agent Assignment (Optional) */}
          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#04A26F]" /> Agent Assignment (Optional)
              </h4>
              <span className="text-[11px] text-gray-500">If rent is collected by an Agent</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Assign Agent
                </label>
                <select
                  value={formData.agentId}
                  onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm bg-white"
                >
                  <option value="">-- No Agent (Direct) --</option>
                  {agents.map((ag) => (
                    <option key={ag._id} value={ag._id}>
                      {ag.fullName} {ag.region ? `(${ag.region})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Company Monthly Amount (£)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.companyMonthlyAmount}
                  onChange={(e) => setFormData({ ...formData, companyMonthlyAmount: e.target.value })}
                  disabled={!formData.agentId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Agreed amount for company"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Agent Due Day of Month
                </label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={formData.agentPaymentDueDay}
                  onChange={(e) => setFormData({ ...formData, agentPaymentDueDay: e.target.value })}
                  disabled={!formData.agentId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Day 1-28"
                />
              </div>
            </div>
          </div>

          {/* Dates & Due Day */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                End / Expiry Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm"
              />
            </div>

            {formData.agreementType === 'Rent' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Rent Due Day of Month
                </label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={formData.dueDayOfMonth}
                  onChange={(e) => setFormData({ ...formData, dueDayOfMonth: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm"
                  placeholder="Day 1-28"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Agreement Notes & Terms
            </label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm"
              placeholder="Special conditions, advance rent notes..."
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
              <span>{submitting ? 'Creating...' : 'Assign Unit & Generate Schedule'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

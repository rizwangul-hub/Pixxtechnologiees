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
  Layers,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import {
  fetchMortgageByIdAPI,
  fetchMortgagePaymentsAPI,
  recordMortgagePaymentAPI,
  deleteMortgageAPI,
  addPropertyToMortgageAPI,
  removePropertyFromMortgageAPI,
  fetchPropertiesFromAPI,
} from '../services/apiData';

export function MortgageDetailPage() {
  const { mortgageId } = useParams();
  const navigate = useNavigate();

  const [mortgage, setMortgage] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [landlordProperties, setLandlordProperties] = useState([]);

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

  // Add property modal state (for collective mortgages)
  const [isAddPropModalOpen, setIsAddPropModalOpen] = useState(false);
  const [addPropForm, setAddPropForm] = useState({
    propertyId: '',
    allocatedAmount: '',
    notes: '',
  });
  const [addPropSubmitting, setAddPropSubmitting] = useState(false);
  const [addPropError, setAddPropError] = useState('');
  const [releasingPropId, setReleasingPropId] = useState(null);

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

        // Load landlord properties for possible additions
        const lId = mData.landlordId?._id || mData.landlordId;
        if (lId) {
          try {
            const allProps = await fetchPropertiesFromAPI();
            const filtered = (allProps || []).filter(
              (p) => (p.landlordId?._id || p.landlordId)?.toString() === lId.toString()
            );
            setLandlordProperties(filtered);
          } catch (e) {
            console.warn('Failed to load landlord properties for modal', e);
          }
        }
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

  const handleAddPropertySubmit = async (e) => {
    e.preventDefault();
    setAddPropError('');

    if (!addPropForm.propertyId) {
      setAddPropError('Please select a property to secure under this facility.');
      return;
    }

    setAddPropSubmitting(true);
    try {
      await addPropertyToMortgageAPI(mortgageId, {
        propertyId: addPropForm.propertyId,
        allocatedAmount: Number(addPropForm.allocatedAmount) || 0,
        notes: addPropForm.notes,
      });
      setIsAddPropModalOpen(false);
      setAddPropForm({ propertyId: '', allocatedAmount: '', notes: '' });
      loadMortgageData();
    } catch (err) {
      setAddPropError(err.message || 'Failed to secure property under facility.');
    } finally {
      setAddPropSubmitting(false);
    }
  };

  const handleReleaseProperty = async (propId, propName) => {
    if (
      !window.confirm(
        `Are you sure you want to release "${propName}" from this mortgage facility? Its historical record will be preserved as Released.`
      )
    ) {
      return;
    }

    setReleasingPropId(propId);
    try {
      await removePropertyFromMortgageAPI(mortgageId, propId);
      loadMortgageData();
    } catch (err) {
      alert(err.message || 'Failed to release property');
    } finally {
      setReleasingPropId(null);
    }
  };

  const handleDeleteMortgage = async () => {
    const isCollective = mortgage.mortgageType === 'Collective / Group';
    const label = isCollective
      ? `collective mortgage facility "${mortgage.mortgageReference || mortgage.lenderName}"`
      : `mortgage record for "${mortgage.propertyId?.name || 'Property'}"`;

    if (!window.confirm(`Are you sure you want to delete ${label}? This cannot be undone.`)) {
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

  const isCollective = mortgage.mortgageType === 'Collective / Group';
  const securedList = mortgage.properties || [];
  const activeSecured = securedList.filter((p) => p.status !== 'Released');
  const releasedSecured = securedList.filter((p) => p.status === 'Released');

  const totalAllocated = activeSecured.reduce((sum, p) => sum + (Number(p.allocatedAmount) || 0), 0);
  const remainingUnallocated = Math.max(0, (mortgage.originalLoanAmount || 0) - totalAllocated);

  const primaryPropName =
    mortgage.propertyId?.name ||
    activeSecured[0]?.propertyId?.name ||
    'Unassigned Property';
  const landlordName = mortgage.landlordId?.fullName || 'Unassigned Landlord';

  // Properties already secured (to disable or filter from add modal)
  const activeSecuredPropIds = new Set(
    activeSecured.map((p) => (p.propertyId?._id || p.propertyId?.id || p.propertyId)?.toString())
  );
  const availableToAdd = landlordProperties.filter(
    (p) => !activeSecuredPropIds.has((p._id || p.id)?.toString())
  );

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
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  {isCollective
                    ? `Collective Facility: ${mortgage.mortgageReference || mortgage.lenderName}`
                    : primaryPropName}
                </h1>

                {/* Mortgage Type Badge */}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                    isCollective
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  {isCollective ? 'Collective Facility' : 'Individual Property'}
                </span>

                {/* Status Badge */}
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

              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {isCollective
                  ? `Secured against ${activeSecured.length} properties • Landlord: ${landlordName} • Lender: ${mortgage.lenderName}`
                  : `${mortgage.propertyId?.address || 'Individual Mortgage'} • Landlord: ${landlordName}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenPaymentModal}
              className="px-4 py-2.5 bg-[#04A26F] hover:bg-[#03885c] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <DollarSign className="w-4 h-4" />
              <span>Record Facility Payment</span>
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

        {/* FACILITY OVERVIEW KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Facility Original Loan
            </span>
            <p className="text-2xl font-black text-slate-900">{formatCurrency(mortgage.originalLoanAmount)}</p>
            <p className="text-[11px] text-slate-400 font-medium">Lender: {mortgage.lenderName}</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Outstanding Facility Debt
            </span>
            <p className="text-2xl font-black text-amber-900">{formatCurrency(mortgage.currentOutstandingBalance)}</p>
            <p className="text-[11px] text-slate-400 font-medium">Single liability across all properties</p>
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
              {isCollective ? 'Secured Properties' : 'Next Due Date'}
            </span>
            <p className="text-2xl font-black text-slate-900">
              {isCollective
                ? `${activeSecured.length} Active`
                : mortgage.nextPaymentDate
                ? new Date(mortgage.nextPaymentDate).toLocaleDateString()
                : '-'}
            </p>
            <p className="text-[11px] text-slate-400 font-medium">
              {isCollective
                ? `${releasedSecured.length} Released • Freq: ${mortgage.paymentFrequency || 'Monthly'}`
                : `Frequency: ${mortgage.paymentFrequency || 'Monthly'}`}
            </p>
          </div>
        </div>

        {/* SECURED PROPERTIES & ALLOCATIONS PANEL */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-extrabold">
                Secured Properties & Allocations ({activeSecured.length} Active
                {releasedSecured.length > 0 ? `, ${releasedSecured.length} Released` : ''})
              </h3>
            </div>

            {isCollective && (
              <button
                type="button"
                onClick={() => {
                  setAddPropError('');
                  setIsAddPropModalOpen(true);
                }}
                className="px-3 py-1 bg-[#04A26F] hover:bg-[#03885c] text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Secured Property</span>
              </button>
            )}
          </div>

          {/* Allocation summary banner if collective */}
          {isCollective && (
            <div className="bg-purple-50/70 border-b border-purple-100 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-purple-600 font-bold block uppercase text-[10px]">Total Facility</span>
                  <span className="font-extrabold text-slate-900">{formatCurrency(mortgage.originalLoanAmount)}</span>
                </div>
                <div>
                  <span className="text-purple-600 font-bold block uppercase text-[10px]">Allocated to Properties</span>
                  <span className="font-extrabold text-purple-900">
                    {formatCurrency(totalAllocated)} ({((totalAllocated / (mortgage.originalLoanAmount || 1)) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div>
                  <span className="text-purple-600 font-bold block uppercase text-[10px]">General / Unallocated</span>
                  <span className="font-extrabold text-slate-700">{formatCurrency(remainingUnallocated)}</span>
                </div>
              </div>
              <p className="text-[11px] text-purple-800 italic max-w-sm">
                * Allocations divide the facility for internal accounting. Total company liability remains strictly {formatCurrency(mortgage.currentOutstandingBalance)}.
              </p>
            </div>
          )}

          {securedList.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <p className="text-xs font-semibold">No property relationships recorded.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Property Name</th>
                    <th className="py-3 px-4">Address</th>
                    <th className="py-3 px-4">Allocated Amount (£)</th>
                    <th className="py-3 px-4">Share of Facility</th>
                    <th className="py-3 px-4">Secured Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Notes</th>
                    {isCollective && <th className="py-3 px-4 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {securedList.map((item, idx) => {
                    const pObj = item.propertyId || {};
                    const pid = pObj._id || pObj.id || (typeof pObj === 'string' ? pObj : `prop-${idx}`);
                    const pName = pObj.name || (typeof pObj === 'string' ? pObj : 'Property');
                    const pAddr = [pObj.address, pObj.city].filter(Boolean).join(', ') || '—';
                    const alloc = Number(item.allocatedAmount) || 0;
                    const allocPct = mortgage.originalLoanAmount > 0 ? ((alloc / mortgage.originalLoanAmount) * 100).toFixed(1) : 0;
                    const isReleased = item.status === 'Released';

                    return (
                      <tr key={item._id || pid} className={isReleased ? 'bg-slate-50/60 opacity-60' : 'hover:bg-slate-50/80'}>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {pObj._id ? (
                            <Link to={`/properties/${pObj._id}`} className="hover:text-[#04A26F] hover:underline flex items-center gap-1">
                              <span>{pName}</span>
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                            </Link>
                          ) : (
                            pName
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{pAddr}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {alloc > 0 ? formatCurrency(alloc) : <span className="text-slate-400 font-normal italic">General Security</span>}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {alloc > 0 ? `${allocPct}%` : '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {item.securedAt ? new Date(item.securedAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              isReleased
                                ? 'bg-slate-100 text-slate-600 border border-slate-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {item.status || 'Active'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                          {item.notes || '—'}
                        </td>
                        {isCollective && (
                          <td className="py-3 px-4 text-right">
                            {!isReleased && (
                              <button
                                type="button"
                                disabled={releasingPropId === (pObj._id || pObj)}
                                onClick={() => handleReleaseProperty(pObj._id || pObj, pName)}
                                className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 cursor-pointer disabled:opacity-50"
                              >
                                {releasingPropId === (pObj._id || pObj) ? 'Releasing...' : 'Release'}
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* DETAILED INFORMATION PANEL */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Landmark className="w-4 h-4 text-[#04A26F]" />
            <span>Facility Specification & Terms</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs pt-2">
            <div className="space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Facility Reference</span>
              <p className="font-mono font-bold text-slate-900">{mortgage.mortgageReference || 'N/A'}</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Mortgage Type</span>
              <p className="font-extrabold text-purple-700">{mortgage.mortgageType || 'Individual Property'}</p>
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
              <span className="text-slate-400 font-bold uppercase text-[10px]">Bank Account Ref</span>
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
              <span className="text-slate-400 font-bold uppercase text-[10px]">Maturity Date</span>
              <p className="font-bold text-slate-800">
                {mortgage.maturityDate || mortgage.endDate
                  ? new Date(mortgage.maturityDate || mortgage.endDate).toLocaleDateString()
                  : '-'}
              </p>
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
              <span>Mortgage Facility Payment Ledger ({payments.length})</span>
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
                Payments recorded here decrease the facility outstanding balance once per bank transaction.
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
                    <th className="py-3 px-4">Facility Remaining Balance</th>
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
                  <span className="font-extrabold text-sm">
                    Record Facility Payment {isCollective ? '(Collective Facility)' : ''}
                  </span>
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

                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] text-emerald-800">
                  Recording a payment decreases this facility liability from{' '}
                  <strong className="font-bold">{formatCurrency(mortgage.currentOutstandingBalance)}</strong>. A single transaction reduces facility debt once.
                </div>

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

        {/* ADD SECURED PROPERTY MODAL (COLLECTIVE) */}
        {isAddPropModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-left animate-fade-in">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                  <span className="font-extrabold text-sm">Add Property to Facility</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddPropModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddPropertySubmit} className="p-6 space-y-4">
                {addPropError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{addPropError}</span>
                  </div>
                )}

                <div className="space-y-1 text-xs">
                  <label className="block font-extrabold text-slate-700 uppercase">
                    Select Property ({landlordName}) *
                  </label>
                  {availableToAdd.length === 0 ? (
                    <p className="text-slate-500 italic p-3 bg-slate-50 rounded-xl">
                      All properties for this landlord are already secured under this facility.
                    </p>
                  ) : (
                    <select
                      required
                      value={addPropForm.propertyId}
                      onChange={(e) => setAddPropForm({ ...addPropForm, propertyId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-800 bg-white cursor-pointer"
                    >
                      <option value="">-- Choose Property --</option>
                      {availableToAdd.map((p) => (
                        <option key={p._id || p.id} value={p._id || p.id}>
                          {p.name} ({p.address || p.city || 'Property'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-1 text-xs">
                  <label className="block font-extrabold text-slate-700 uppercase">
                    Allocated Amount (£) (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="e.g. 150000"
                    value={addPropForm.allocatedAmount}
                    onChange={(e) => setAddPropForm({ ...addPropForm, allocatedAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-800 bg-white"
                  />
                  <p className="text-[10px] text-slate-400">
                    Optional accounting breakdown. Remaining unallocated facility: {formatCurrency(remainingUnallocated)}
                  </p>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="block font-extrabold text-slate-700 uppercase">
                    Notes / Charge Details (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. First legal charge registered with Land Registry"
                    value={addPropForm.notes}
                    onChange={(e) => setAddPropForm({ ...addPropForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-800 bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddPropModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addPropSubmitting || availableToAdd.length === 0}
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-extrabold text-white bg-[#04A26F] hover:bg-[#03885c] rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {addPropSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Add to Facility</span>
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

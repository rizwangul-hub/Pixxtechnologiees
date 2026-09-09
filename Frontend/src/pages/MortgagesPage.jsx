import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Landmark,
  Plus,
  Search,
  Filter,
  Building2,
  UserCheck,
  CreditCard,
  Calendar,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  Loader2,
  AlertCircle,
  TrendingDown,
  CheckCircle,
  X,
  FileText,
  Upload,
} from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import {
  fetchMortgagesAPI,
  fetchMortgageSummaryAPI,
  createMortgageAPI,
  updateMortgageAPI,
  deleteMortgageAPI,
  recordMortgagePaymentAPI,
  fetchPropertiesFromAPI,
  fetchLandlordsFromAPI,
} from '../services/apiData';

export function MortgagesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Primary state
  const [mortgages, setMortgages] = useState([]);
  const [summary, setSummary] = useState(null);
  const [properties, setProperties] = useState([]);
  const [landlords, setLandlords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(searchParams.get('propertyId') || '');
  const [selectedLandlord, setSelectedLandlord] = useState(searchParams.get('landlordId') || '');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMortgage, setEditingMortgage] = useState(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTargetMortgage, setPaymentTargetMortgage] = useState(null);

  // Form states for Add / Edit Mortgage
  const [formData, setFormData] = useState({
    propertyId: '',
    landlordName: '',
    lenderName: '',
    mortgageAccountNumber: '',
    originalLoanAmount: '',
    currentOutstandingBalance: '',
    interestRate: '4.5',
    monthlyPayment: '',
    paymentFrequency: 'Monthly',
    startDate: new Date().toISOString().split('T')[0],
    termMonths: '300',
    maturityDate: '',
    nextPaymentDate: '',
    status: 'Active',
    notes: '',
  });

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Payment form state
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
    loadData();
  }, [selectedProperty, selectedLandlord, selectedStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mList, mSummary, pList, lList] = await Promise.all([
        fetchMortgagesAPI({
          propertyId: selectedProperty,
          landlordId: selectedLandlord,
          status: selectedStatus,
        }),
        fetchMortgageSummaryAPI(),
        fetchPropertiesFromAPI(),
        fetchLandlordsFromAPI(),
      ]);

      setMortgages(mList || []);
      setSummary(mSummary);
      setProperties(pList || []);
      setLandlords(lList || []);
    } catch (err) {
      console.error('[Load Mortgages Error]', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter mortgages locally by search query
  const filteredMortgages = mortgages.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const lender = (m.lenderName || '').toLowerCase();
    const ref = (m.mortgageAccountNumber || '').toLowerCase();
    const propName = (m.propertyId?.name || '').toLowerCase();
    const landlordName = (m.landlordId?.fullName || '').toLowerCase();
    return lender.includes(q) || ref.includes(q) || propName.includes(q) || landlordName.includes(q);
  });

  // Handle Property Select in Add/Edit Form to auto-populate Landlord
  const handlePropertyChangeInForm = (propId) => {
    const selectedProp = properties.find((p) => (p._id || p.id) === propId);
    let landlordName = '';
    if (selectedProp) {
      if (selectedProp.landlordId?.fullName) {
        landlordName = selectedProp.landlordId.fullName;
      } else if (selectedProp.landlordId) {
        const foundL = landlords.find((l) => (l._id || l.id) === selectedProp.landlordId);
        if (foundL) landlordName = foundL.fullName;
      }
    }

    setFormData((prev) => ({
      ...prev,
      propertyId: propId,
      landlordName: landlordName || (selectedProp ? 'Landlord Assigned' : ''),
    }));
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingMortgage(null);
    setFormError('');
    const defaultProp = properties[0];
    let lName = '';
    if (defaultProp) {
      if (defaultProp.landlordId?.fullName) lName = defaultProp.landlordId.fullName;
      else {
        const found = landlords.find((l) => (l._id || l.id) === defaultProp.landlordId);
        if (found) lName = found.fullName;
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().split('T')[0];

    setFormData({
      propertyId: defaultProp ? (defaultProp._id || defaultProp.id) : '',
      landlordName: lName,
      lenderName: '',
      mortgageAccountNumber: '',
      originalLoanAmount: '',
      currentOutstandingBalance: '',
      interestRate: '4.5',
      monthlyPayment: '',
      paymentFrequency: 'Monthly',
      startDate: todayStr,
      termMonths: '300',
      maturityDate: '',
      endDate: '',
      nextPaymentDate: nextMonthStr,
      status: 'Active',
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (m, e) => {
    if (e) e.stopPropagation();
    setEditingMortgage(m);
    setFormError('');
    const matDateStr = m.maturityDate ? new Date(m.maturityDate).toISOString().split('T')[0] : (m.endDate ? new Date(m.endDate).toISOString().split('T')[0] : '');
    setFormData({
      propertyId: m.propertyId?._id || m.propertyId || '',
      landlordName: m.landlordId?.fullName || '',
      lenderName: m.lenderName || '',
      mortgageAccountNumber: m.mortgageAccountNumber || '',
      originalLoanAmount: m.originalLoanAmount || '',
      currentOutstandingBalance: m.currentOutstandingBalance || '',
      interestRate: m.interestRate !== undefined ? String(m.interestRate) : '4.5',
      monthlyPayment: m.monthlyPayment || '',
      paymentFrequency: m.paymentFrequency || 'Monthly',
      startDate: m.startDate ? new Date(m.startDate).toISOString().split('T')[0] : '',
      termMonths: m.termMonths || '',
      maturityDate: matDateStr,
      endDate: matDateStr,
      nextPaymentDate: m.nextPaymentDate ? new Date(m.nextPaymentDate).toISOString().split('T')[0] : '',
      status: m.status || 'Active',
      notes: m.notes || '',
    });
    setIsAddModalOpen(true);
  };

  // Submit Add / Edit Form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.propertyId) {
      setFormError('Please select a Property.');
      return;
    }
    if (!formData.lenderName.trim()) {
      setFormError('Please enter Lender / Bank name.');
      return;
    }
    if (!formData.originalLoanAmount || Number(formData.originalLoanAmount) <= 0) {
      setFormError('Original Loan Amount must be greater than 0.');
      return;
    }

    setFormSubmitting(true);
    try {
      if (editingMortgage) {
        await updateMortgageAPI(editingMortgage._id || editingMortgage.id, formData);
      } else {
        await createMortgageAPI(formData);
      }
      setIsAddModalOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to save mortgage record.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Payment Modal
  const handleOpenPaymentModal = (m, e) => {
    if (e) e.stopPropagation();
    setPaymentTargetMortgage(m);
    setPaymentError('');

    const todayStr = new Date().toISOString().split('T')[0];
    let defaultNextDate = '';
    if (m.nextPaymentDate) {
      const nextDate = new Date(m.nextPaymentDate);
      nextDate.setMonth(nextDate.getMonth() + 1);
      defaultNextDate = nextDate.toISOString().split('T')[0];
    }

    setPaymentForm({
      paymentDate: todayStr,
      totalPayment: m.monthlyPayment ? String(m.monthlyPayment) : '',
      principalAmount: '',
      interestAmount: '',
      paymentMethod: 'Bank Transfer',
      reference: '',
      notes: '',
      nextPaymentDate: defaultNextDate,
    });
    setIsPaymentModalOpen(true);
  };

  // Submit Payment Form
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
      await recordMortgagePaymentAPI(paymentTargetMortgage._id || paymentTargetMortgage.id, paymentForm);
      setIsPaymentModalOpen(false);
      loadData();
    } catch (err) {
      setPaymentError(err.message || 'Failed to record mortgage payment.');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // Delete Mortgage
  const handleDeleteMortgage = async (m, e) => {
    if (e) e.stopPropagation();
    if (
      !window.confirm(
        `Are you sure you want to delete mortgage for "${m.propertyId?.name || 'Property'}" (${m.lenderName})? This will also remove payment records.`
      )
    ) {
      return;
    }

    try {
      await deleteMortgageAPI(m._id || m.id);
      loadData();
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

  return (
    <AppLayout>
      <div className="space-y-6 text-left pb-12">
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 text-[#04A26F] border border-emerald-100">
                <Landmark className="w-6 h-6" />
              </div>
              <span>Mortgage Management</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Track property mortgage loans, outstanding balances, monthly bank payments, and property financing.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#04A26F] hover:bg-[#03885c] text-white text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Mortgage</span>
          </button>
        </div>

        {/* SUMMARY KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>Active Mortgages</span>
              <Building2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">
              {summary?.activeMortgagesCount || 0}
            </p>
            <p className="text-[11px] text-slate-400 font-medium">
              Out of {summary?.totalMortgages || 0} total records
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>Total Outstanding Balance</span>
              <TrendingDown className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-amber-900">
              {formatCurrency(summary?.totalOutstanding)}
            </p>
            <p className="text-[11px] text-slate-400 font-medium">
              Original: {formatCurrency(summary?.totalOriginalLoans)}
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>Monthly Mortgage Payments</span>
              <CreditCard className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">
              {formatCurrency(summary?.monthlyPaymentsTotal)}
            </p>
            <p className="text-[11px] text-slate-400 font-medium">Total active monthly commitment</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>Upcoming Payments Due</span>
              <Calendar className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">
              {summary?.upcomingPaymentsCount || 0}
            </p>
            <p className="text-[11px] text-slate-400 font-medium">Due in next 30 days</p>
          </div>
        </div>

        {/* CONTROLS BAR: SEARCH & FILTERS */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search property, lender, ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20 text-slate-800"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Property Filter */}
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#04A26F]/20 text-slate-700 cursor-pointer"
            >
              <option value="">All Properties</option>
              {properties.map((p) => (
                <option key={p._id || p.id} value={p._id || p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Landlord Filter */}
            <select
              value={selectedLandlord}
              onChange={(e) => setSelectedLandlord(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#04A26F]/20 text-slate-700 cursor-pointer"
            >
              <option value="">All Landlords</option>
              {landlords.map((l) => (
                <option key={l._id || l.id} value={l._id || l.id}>
                  {l.fullName}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#04A26F]/20 text-slate-700 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Paid Off">Paid Off</option>
              <option value="Closed">Closed</option>
              <option value="Pending">Pending</option>
            </select>

            {(selectedProperty || selectedLandlord || selectedStatus !== 'All' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedProperty('');
                  setSelectedLandlord('');
                  setSelectedStatus('All');
                  setSearchQuery('');
                }}
                className="px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* MORTGAGE LIST TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-[#04A26F] mx-auto" />
              <p className="text-xs font-bold">Loading Mortgages...</p>
            </div>
          ) : filteredMortgages.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <Landmark className="w-10 h-10 text-slate-300 mx-auto" />
              <div>
                <p className="font-extrabold text-slate-800 text-sm">No Mortgages Found</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {searchQuery || selectedProperty || selectedLandlord || selectedStatus !== 'All'
                    ? 'No mortgage records matched your search or filters.'
                    : 'Click "Add Mortgage" above to record a new mortgage loan for a property.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white font-extrabold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Property</th>
                    <th className="py-3.5 px-4">Landlord</th>
                    <th className="py-3.5 px-4">Lender / Bank</th>
                    <th className="py-3.5 px-4">Original Loan</th>
                    <th className="py-3.5 px-4">Outstanding</th>
                    <th className="py-3.5 px-4">Monthly Payment</th>
                    <th className="py-3.5 px-4">Interest Rate</th>
                    <th className="py-3.5 px-4">Next Payment</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {filteredMortgages.map((m) => {
                    const mId = m._id || m.id;
                    const propName = m.propertyId?.name || 'Unassigned';
                    const landlordName = m.landlordId?.fullName || 'Unassigned';

                    return (
                      <tr
                        key={mId}
                        onClick={() => navigate(`/mortgages/${mId}`)}
                        className="hover:bg-slate-50/80 transition cursor-pointer"
                      >
                        {/* Property */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="font-extrabold text-slate-900">{propName}</span>
                          </div>
                        </td>

                        {/* Landlord */}
                        <td className="py-3.5 px-4 text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{landlordName}</span>
                          </div>
                        </td>

                        {/* Lender */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900">{m.lenderName}</span>
                          {m.mortgageAccountNumber && (
                            <span className="block text-[10px] text-slate-400 font-mono">
                              Ref: {m.mortgageAccountNumber}
                            </span>
                          )}
                        </td>

                        {/* Original Amount */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          {formatCurrency(m.originalLoanAmount)}
                        </td>

                        {/* Outstanding Balance */}
                        <td className="py-3.5 px-4 font-mono font-black text-amber-900">
                          {formatCurrency(m.currentOutstandingBalance)}
                        </td>

                        {/* Monthly Payment */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {formatCurrency(m.monthlyPayment)}
                        </td>

                        {/* Interest Rate */}
                        <td className="py-3.5 px-4 text-slate-600">
                          {m.interestRate ? `${m.interestRate}%` : '0%'}
                        </td>

                        {/* Next Payment */}
                        <td className="py-3.5 px-4 text-slate-600">
                          {m.nextPaymentDate
                            ? new Date(m.nextPaymentDate).toLocaleDateString()
                            : '-'}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                              m.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : m.status === 'Paid Off'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                m.status === 'Active'
                                  ? 'bg-emerald-500'
                                  : m.status === 'Paid Off'
                                  ? 'bg-blue-500'
                                  : 'bg-slate-400'
                              }`}
                            />
                            <span>{m.status}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => handleOpenPaymentModal(m, e)}
                              title="Record Payment"
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#04A26F] rounded-lg font-extrabold text-[11px] transition-colors border border-emerald-200 cursor-pointer"
                            >
                              + Pay
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditModal(m, e)}
                              title="Edit Mortgage"
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteMortgage(m, e)}
                              title="Delete Mortgage"
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL 1: ADD / EDIT MORTGAGE MODAL */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-left animate-fade-in max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-[#04A26F]" />
                  <span className="font-extrabold text-sm">
                    {editingMortgage ? 'Edit Mortgage Record' : 'Add New Mortgage'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleFormSubmit} className="p-6 space-y-4 overflow-y-auto">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Property Selector */}
                  <div>
                    <label className="block font-extrabold text-slate-700 uppercase mb-1">
                      Property *
                    </label>
                    <select
                      required
                      value={formData.propertyId}
                      onChange={(e) => handlePropertyChangeInForm(e.target.value)}
                      disabled={Boolean(editingMortgage)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20 cursor-pointer"
                    >
                      <option value="">Select Property...</option>
                      {properties.map((p) => (
                        <option key={p._id || p.id} value={p._id || p.id}>
                          {p.name} ({p.city || 'London'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Landlord Name (Auto-filled) */}
                  <div>
                    <label className="block font-extrabold text-slate-700 uppercase mb-1">
                      Landlord (Auto-Assigned)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formData.landlordName || 'Select property first'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 bg-slate-100 outline-none"
                    />
                  </div>

                  {/* Lender / Bank Name */}
                  <div>
                    <label className="block font-extrabold text-slate-700 uppercase mb-1">
                      Lender / Bank Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Barclays, HSBC, Lloyds Bank"
                      value={formData.lenderName}
                      onChange={(e) => setFormData({ ...formData, lenderName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20"
                    />
                  </div>

                  {/* Mortgage Account / Reference */}
                  <div>
                    <label className="block font-extrabold text-slate-700 uppercase mb-1">
                      Mortgage Account / Ref (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MTG-98421-UK"
                      value={formData.mortgageAccountNumber}
                      onChange={(e) => setFormData({ ...formData, mortgageAccountNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20"
                    />
                  </div>

                  {/* Original Loan Amount */}
                  <div>
                    <label className="block font-extrabold text-slate-700 uppercase mb-1">
                      Original Loan Amount (£) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      placeholder="e.g. 240000"
                      value={formData.originalLoanAmount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          originalLoanAmount: val,
                          currentOutstandingBalance: prev.currentOutstandingBalance || val,
                        }));
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20"
                    />
                  </div>

                  {/* Current Outstanding Balance */}
                  <div>
                    <label className="block font-extrabold text-slate-700 uppercase mb-1">
                      Current Outstanding Balance (£) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      placeholder="e.g. 198500"
                      value={formData.currentOutstandingBalance}
                      onChange={(e) => setFormData({ ...formData, currentOutstandingBalance: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-amber-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20"
                    />
                  </div>

                  {/* Monthly Payment */}
                  <div>
                    <label className="block font-extrabold text-slate-700 uppercase mb-1">
                      Monthly Payment (£) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      placeholder="e.g. 1200"
                      value={formData.monthlyPayment}
                      onChange={(e) => setFormData({ ...formData, monthlyPayment: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20"
                    />
                  </div>

                  {/* Interest Rate */}
                  <div>
                    <label className="block font-extrabold text-slate-700 uppercase mb-1">
                      Interest Rate (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 4.5"
                      value={formData.interestRate}
                      onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20"
                    />
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block font-extrabold text-slate-700 uppercase mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-800 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20"
                    />
                  </div>

                  {/* Mortgage End Date / Maturity Date */}
                  <div>
                    <label className="block font-extrabold text-slate-700 uppercase mb-1">
                      Mortgage End Date / Maturity Date
                    </label>
                    <input
                      type="date"
                      value={formData.maturityDate || formData.endDate || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          maturityDate: e.target.value,
                          endDate: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-800 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20"
                    />
                  </div>

                  {/* Next Payment Date */}
                  <div>
                    <label className="block font-extrabold text-slate-700 uppercase mb-1">
                      Next Payment Due Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.nextPaymentDate}
                      onChange={(e) => setFormData({ ...formData, nextPaymentDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-800 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block font-extrabold text-slate-700 uppercase mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-800 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20"
                    >
                      <option value="Active">Active</option>
                      <option value="Paid Off">Paid Off</option>
                      <option value="Closed">Closed</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>

                  {/* Term Months */}
                  <div>
                    <label className="block font-extrabold text-slate-700 uppercase mb-1">
                      Term (Months)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 300 (25 years)"
                      value={formData.termMonths}
                      onChange={(e) => setFormData({ ...formData, termMonths: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block font-extrabold text-slate-700 uppercase mb-1">
                    Notes & Remarks
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Additional mortgage notes, fix rate expiry, bank contact details..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20"
                  />
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-extrabold text-white bg-[#04A26F] hover:bg-[#03885c] rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {formSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingMortgage ? 'Save Changes' : 'Create Mortgage'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: RECORD MORTGAGE PAYMENT MODAL */}
        {isPaymentModalOpen && paymentTargetMortgage && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-left animate-fade-in">
              {/* Header */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#04A26F]" />
                  <span className="font-extrabold text-sm">
                    Record Bank Payment for {paymentTargetMortgage.propertyId?.name || 'Property'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Current Status Banner */}
              <div className="p-4 bg-amber-50 border-b border-amber-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Current Outstanding Balance:</span>
                  <p className="text-base font-black text-amber-900">
                    {formatCurrency(paymentTargetMortgage.currentOutstandingBalance)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 font-medium">Lender:</span>
                  <p className="font-bold text-slate-800">{paymentTargetMortgage.lenderName}</p>
                </div>
              </div>

              {/* Payment Form */}
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
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-800 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20"
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
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20"
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
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20"
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
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20"
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

                {/* Footer Buttons */}
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
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-extrabold text-white bg-[#04A26F] hover:bg-[#03885c] rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
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

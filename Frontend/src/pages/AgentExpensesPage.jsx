import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Receipt,
  Plus,
  Search,
  Download,
  Eye,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Building2,
  User,
  DollarSign,
  Upload,
} from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { formatCurrency } from '../utils/currencyFormatter';
import { downloadFileAPI } from '../services/api';
import {
  fetchAgentExpensesAPI,
  createAgentExpenseAPI,
  deleteAgentExpenseAPI,
  fetchAgentsAPI,
} from '../services/apiData';

const EXPENSE_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'AC',
  'Door',
  'Cleaning',
  'Maintenance',
  'Replacement item',
  'Emergency repair',
  'Other',
];

export default function AgentExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedAgent, setSelectedAgent] = useState('All');

  // Add Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalForm, setModalForm] = useState({
    agentId: '',
    expenseCategory: 'Maintenance',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [receiptFile, setReceiptFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Receipt Preview Modal state
  const [previewReceipt, setPreviewReceipt] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [expData, agentData] = await Promise.all([
        fetchAgentExpensesAPI(),
        fetchAgentsAPI(),
      ]);
      setExpenses(expData || []);
      setAgents(agentData || []);
    } catch (e) {
      console.warn('[Agent Expenses Load Notice]', e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id, desc) => {
    if (!window.confirm(`Are you sure you want to delete expense "${desc}"?`)) return;
    try {
      await deleteAgentExpenseAPI(id);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete expense');
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!modalForm.agentId) {
      setModalError('Please select an agent');
      return;
    }
    if (!modalForm.description.trim()) {
      setModalError('Please enter a description');
      return;
    }
    if (!modalForm.amount || Number(modalForm.amount) <= 0) {
      setModalError('Please enter a valid amount');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('agentId', modalForm.agentId);
      formData.append('expenseCategory', modalForm.expenseCategory);
      formData.append('description', modalForm.description);
      formData.append('amount', modalForm.amount);
      formData.append('date', modalForm.date);
      if (modalForm.notes) formData.append('notes', modalForm.notes);
      if (receiptFile) formData.append('receipt', receiptFile);

      await createAgentExpenseAPI(formData);
      setShowAddModal(false);
      setModalForm({
        agentId: '',
        expenseCategory: 'Maintenance',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setReceiptFile(null);
      loadData();
    } catch (err) {
      setModalError(err.message || 'Failed to create expense');
    }
    setSubmitting(false);
  };

  // Filtered expenses
  const filteredExpenses = expenses.filter((item) => {
    const agentName = item.agentId?.fullName || '';
    const propertyName = item.propertyId?.title || item.propertyId?.name || '';
    const unitName = item.unitId?.name || '';
    const tenantName = item.tenantId?.fullName || item.tenantId?.name || '';
    const matchSearch =
      search === '' ||
      item.description?.toLowerCase().includes(search.toLowerCase()) ||
      agentName.toLowerCase().includes(search.toLowerCase()) ||
      propertyName.toLowerCase().includes(search.toLowerCase()) ||
      unitName.toLowerCase().includes(search.toLowerCase()) ||
      tenantName.toLowerCase().includes(search.toLowerCase());

    const matchCategory =
      selectedCategory === 'All' || item.expenseCategory === selectedCategory;
    const matchStatus =
      selectedStatus === 'All' || item.status === selectedStatus;
    const matchAgent =
      selectedAgent === 'All' || item.agentId?._id === selectedAgent;

    return matchSearch && matchCategory && matchStatus && matchAgent;
  });

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
          </span>
        );
      case 'Deducted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Deducted
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3 h-3 mr-1" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Receipt className="w-7 h-7 text-[#04A26F]" />
              Agent Expenses
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Track repairs, maintenance, and expenses handled by agents for properties & units
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                downloadFileAPI('/exports/agent-expenses/csv', 'Agent_Expenses.csv').catch((e) => alert(e.message))
              }
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition"
            >
              <Download className="w-4 h-4 mr-1 text-gray-500" /> Export CSV
            </button>
            <button
              onClick={() =>
                downloadFileAPI('/exports/agent-expenses/excel', 'Agent_Expenses.xlsx').catch((e) => alert(e.message))
              }
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition"
            >
              <Download className="w-4 h-4 mr-1 text-emerald-600" /> Export Excel
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-[#04A26F] text-white text-sm font-medium rounded-lg hover:bg-[#038d61] shadow-sm transition"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Agent Expense
            </button>
          </div>
        </div>

        {/* Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Total Expenses Logged</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{filteredExpenses.length}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-[#04A26F]">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Total Amount</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {formatCurrency(totalAmount)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-[#04A26F]">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Active Agents</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{agents.length}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <User className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3 md:space-y-0 md:flex md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by description, agent, property, unit or tenant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#04A26F] focus:border-transparent outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Category */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#04A26F] focus:border-transparent outline-none bg-white"
              >
                <option value="All">All Categories</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#04A26F] focus:border-transparent outline-none bg-white"
              >
                <option value="All">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Deducted">Deducted</option>
                <option value="Pending">Pending</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Agent */}
            <div>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#04A26F] focus:border-transparent outline-none bg-white"
              >
                <option value="All">All Agents</option>
                {agents.map((ag) => (
                  <option key={ag._id} value={ag._id}>
                    {ag.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#04A26F] mb-2" />
              Loading agent expenses...
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="font-semibold text-gray-700 text-base">No agent expenses found</p>
              <p className="text-sm text-gray-500 mt-1">
                Try adjusting your filters or click "+ Add Agent Expense" to record a new one.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Agent</th>
                    <th className="py-3 px-4">Property / Unit</th>
                    <th className="py-3 px-4">Tenant</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4 text-center">Receipt</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {filteredExpenses.map((exp) => {
                    const agent = exp.agentId || {};
                    const property = exp.propertyId || {};
                    const unit = exp.unitId || {};
                    const tenant = exp.tenantId || {};

                    return (
                      <tr key={exp._id} className="hover:bg-gray-50 transition">
                        <td className="py-3 px-4 font-medium text-gray-900 whitespace-nowrap">
                          {exp.date}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Link
                            to={`/agents/${agent._id}`}
                            className="font-medium text-[#04A26F] hover:underline flex items-center gap-1.5"
                          >
                            <User className="w-3.5 h-3.5" />
                            {agent.fullName || 'Unassigned'}
                          </Link>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {property.title || property.name || 'N/A'}
                          </div>
                          {unit.name && (
                            <div className="text-xs text-gray-500">Unit: {unit.name}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                          {tenant.fullName || tenant.name || 'N/A'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            {exp.expenseCategory}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700 max-w-xs truncate">
                          {exp.description}
                          {exp.notes && (
                            <span className="block text-xs text-gray-400 truncate">
                              {exp.notes}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-900 whitespace-nowrap">
                          {formatCurrency(exp.amount)}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {exp.receiptUrl ? (
                            <button
                              onClick={() => setPreviewReceipt(exp.receiptUrl)}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium text-[#04A26F] bg-emerald-50 hover:bg-emerald-100 rounded transition"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" /> View Receipt
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">No Receipt</span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {getStatusBadge(exp.status)}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleDelete(exp._id, exp.description)}
                            className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Agent Expense Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#04A26F]" /> Add Agent Expense
              </h2>

              {modalError && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {modalError}
                </div>
              )}

              <form onSubmit={handleAddSubmit} className="space-y-4">
                {/* Agent Selection */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Select Agent <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={modalForm.agentId}
                    onChange={(e) =>
                      setModalForm({ ...modalForm, agentId: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#04A26F] focus:border-transparent outline-none"
                    required
                  >
                    <option value="">-- Choose Agent --</option>
                    {agents.map((ag) => (
                      <option key={ag._id} value={ag._id}>
                        {ag.fullName} {ag.region ? `(${ag.region})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Expense Category */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Expense Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={modalForm.expenseCategory}
                    onChange={(e) =>
                      setModalForm({ ...modalForm, expenseCategory: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#04A26F] focus:border-transparent outline-none"
                    required
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount & Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Amount (£) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 150"
                      value={modalForm.amount}
                      onChange={(e) =>
                        setModalForm({ ...modalForm, amount: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#04A26F] focus:border-transparent outline-none"
                      required
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Expense Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={modalForm.date}
                      onChange={(e) =>
                        setModalForm({ ...modalForm, date: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#04A26F] focus:border-transparent outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Description / Details <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Fixed leaking pipe in bathroom..."
                    value={modalForm.description}
                    onChange={(e) =>
                      setModalForm({ ...modalForm, description: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#04A26F] focus:border-transparent outline-none"
                    required
                  />
                </div>

                {/* Receipt Upload */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Upload Receipt (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setReceiptFile(e.target.files[0] || null)}
                    className="w-full text-xs text-gray-500 border border-gray-300 rounded-lg p-1.5 focus:outline-none"
                  />
                  {receiptFile && (
                    <p className="text-xs text-emerald-600 mt-1">
                      Selected: {receiptFile.name}
                    </p>
                  )}
                </div>

                {/* Submit button */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-[#04A26F] text-white text-sm font-medium rounded-lg hover:bg-[#038d61] shadow-sm disabled:opacity-50 transition flex items-center gap-1.5"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Expense
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Receipt Preview Modal */}
        {previewReceipt && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-4 relative max-h-[90vh] overflow-hidden flex flex-col">
              <button
                onClick={() => setPreviewReceipt(null)}
                className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 bg-gray-100 rounded-full p-1 z-10"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-sm font-bold text-gray-900 mb-3">Receipt Document</h3>
              <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-50 rounded-lg p-2">
                {previewReceipt.endsWith('.pdf') ? (
                  <iframe
                    src={previewReceipt}
                    title="Receipt PDF"
                    className="w-full h-[500px] border-0"
                  />
                ) : (
                  <img
                    src={previewReceipt}
                    alt="Receipt"
                    className="max-h-[500px] object-contain rounded"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

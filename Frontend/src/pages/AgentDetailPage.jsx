import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Globe,
  FileText,
  Building2,
  Home,
  DollarSign,
  Receipt,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Edit,
  Trash2,
  Eye,
  Plus,
  Loader2,
} from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { EntityReportDownloadBar } from '../components/common/EntityReportDownloadBar';
import { formatCurrency } from '../utils/currencyFormatter';
import { fetchAgentByIdAPI, deleteAgentAPI } from '../services/apiData';

export default function AgentDetailPage() {
  const { agentId } = useParams();
  const navigate = useNavigate();

  const [agentData, setAgentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('units');

  const loadDetails = async () => {
    setLoading(true);
    try {
      const data = await fetchAgentByIdAPI(agentId);
      setAgentData(data);
    } catch (e) {
      console.warn('[Agent Detail Load Notice]', e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (agentId) {
      loadDetails();
    }
  }, [agentId]);

  const handleDelete = async () => {
    const name = agentData?.agent?.fullName || 'this agent';
    if (!window.confirm(`Are you sure you want to delete agent "${name}"?`)) return;
    try {
      await deleteAgentAPI(agentId);
      navigate('/agents');
    } catch (err) {
      alert(err.message || 'Failed to delete agent');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-12 text-center text-slate-500 flex items-center justify-center space-x-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#04A26F]" />
          <span>Loading agent profile and financial summary...</span>
        </div>
      </AppLayout>
    );
  }

  if (!agentData || !agentData.agent) {
    return (
      <AppLayout>
        <div className="p-6 max-w-4xl mx-auto text-left space-y-4">
          <Link to="/agents" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Agents</span>
          </Link>
          <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
            <h2 className="text-lg font-black text-rose-800">Agent Not Found</h2>
            <p className="text-xs text-rose-600">The requested agent profile does not exist or was removed.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const { agent, summary, assignedTenancies, recentPayments, recentExpenses } = agentData;
  const targetAgentId = (agent._id || agent.id || agentId)?.toString();

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6 text-left">
        {/* TOP HEADER */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              to="/agents"
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-900">{agent.fullName}</h1>
              <p className="text-xs text-slate-500 font-medium">
                Agent Profile, Assigned Units, and Monthly Company Rent Settlements.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              to={`/agents/${agent._id || agent.id}/edit`}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-extrabold rounded-xl hover:bg-slate-50 transition-colors flex items-center space-x-1.5 shadow-2xs"
            >
              <Edit className="w-3.5 h-3.5 text-blue-600" />
              <span>Edit Agent</span>
            </Link>
            <button
              onClick={handleDelete}
              className="px-3 py-2 bg-white border border-rose-200 text-rose-600 text-xs font-extrabold rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
              title="Delete Agent"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Date Range Report & Statement Download Bar */}
        <EntityReportDownloadBar entityType="agent" entityId={targetAgentId} entityName={agent.fullName} />

        {/* AGENT PROFILE CARD */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {agent.profileImage ? (
              <img
                src={agent.profileImage}
                alt={agent.fullName}
                className="w-16 h-16 rounded-full object-cover border-2 border-[#04A26F] shadow-xs"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#04A26F] flex items-center justify-center font-black text-2xl border-2 border-emerald-200">
                {agent.fullName ? agent.fullName.charAt(0).toUpperCase() : 'A'}
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900">{agent.fullName}</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                    agent.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {agent.status || 'Active'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <div className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{agent.phone}</span>
                </div>
                {agent.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{agent.email}</span>
                  </div>
                )}
                {agent.region && (
                  <div className="flex items-center gap-1 font-bold text-slate-800">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Region: {agent.region}</span>
                  </div>
                )}
              </div>
              {agent.address && <p className="text-xs text-slate-500">{agent.address}</p>}
            </div>
          </div>

          <div className="text-right border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Assigned Operating Units</span>
            <div className="text-3xl font-black text-[#04A26F] mt-0.5">{summary.assignedUnitsCount || 0}</div>
            <span className="text-xs text-slate-500 font-bold">Monthly Company Rent: {formatCurrency(summary.monthlyCompanyAmount || 0)}</span>
          </div>
        </div>

        {/* AGENT FINANCIAL SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Company Expected</p>
            <h3 className="text-xl font-black text-slate-900 mt-1">{formatCurrency(summary.totalExpected || 0)}</h3>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider">Agent Expenses</p>
            <h3 className="text-xl font-black text-amber-700 mt-1">{formatCurrency(summary.totalExpenses || 0)}</h3>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Net Amount</p>
            <h3 className="text-xl font-black text-slate-900 mt-1">{formatCurrency(summary.netAmount || 0)}</h3>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs bg-emerald-50/40">
            <p className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">Received Amount</p>
            <h3 className="text-xl font-black text-emerald-800 mt-1">{formatCurrency(summary.totalReceived || 0)}</h3>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs bg-rose-50/40">
            <p className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider">Outstanding</p>
            <h3 className="text-xl font-black text-rose-600 mt-1">{formatCurrency(summary.pendingAmount || 0)}</h3>
          </div>
        </div>

        {/* TABS HEADER */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('units')}
            className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
              activeTab === 'units' ? 'bg-[#04A26F] text-white shadow-xs' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            Assigned Units ({assignedTenancies.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
              activeTab === 'payments' ? 'bg-[#04A26F] text-white shadow-xs' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            Monthly Settlements ({recentPayments.length})
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
              activeTab === 'expenses' ? 'bg-[#04A26F] text-white shadow-xs' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            Agent Expenses ({recentExpenses.length})
          </button>
        </div>

        {/* TAB 1: ASSIGNED UNITS */}
        {activeTab === 'units' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Property</th>
                    <th className="py-3 px-4">Unit</th>
                    <th className="py-3 px-4">Tenant</th>
                    <th className="py-3 px-4">Company Monthly Amount</th>
                    <th className="py-3 px-4">Tenant Actual Rent</th>
                    <th className="py-3 px-4">Start Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {assignedTenancies.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-6 text-center text-slate-500">
                        No active units currently assigned to this agent.
                      </td>
                    </tr>
                  ) : (
                    assignedTenancies.map((t) => {
                      const propName = t.propertyId?.propertyName || t.propertyId?.name || 'N/A';
                      const unitName = t.unitId?.unitName || t.unitId?.name || 'N/A';
                      const tenantName = t.customerId?.fullName || t.customerId?.name || 'N/A';
                      return (
                        <tr key={t._id || t.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-bold text-slate-900">{propName}</td>
                          <td className="py-3 px-4 text-slate-700 font-semibold">{unitName}</td>
                          <td className="py-3 px-4 font-bold text-[#04A26F]">{tenantName}</td>
                          <td className="py-3 px-4 font-black text-slate-900">
                            {formatCurrency(t.companyMonthlyAmount || 0)}
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {formatCurrency(t.monthlyRent || 0)}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{t.startDate}</td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              to={`/tenants/${t.customerId?._id || t.customerId}`}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                            >
                              View Tenant
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: MONTHLY SETTLEMENTS */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Property</th>
                    <th className="py-3 px-4">Unit</th>
                    <th className="py-3 px-4">Tenant</th>
                    <th className="py-3 px-4">Month/Year</th>
                    <th className="py-3 px-4">Expected</th>
                    <th className="py-3 px-4">Expenses</th>
                    <th className="py-3 px-4">Net Amount</th>
                    <th className="py-3 px-4">Paid</th>
                    <th className="py-3 px-4">Remaining</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {recentPayments.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="py-6 text-center text-slate-500">
                        No monthly settlements recorded yet.
                      </td>
                    </tr>
                  ) : (
                    recentPayments.map((p) => {
                      const propName = p.propertyId?.propertyName || p.propertyId?.name || 'N/A';
                      const unitName = p.unitId?.unitName || p.unitId?.name || 'N/A';
                      const tenantName = p.tenantId?.fullName || p.tenantId?.name || 'N/A';
                      return (
                        <tr key={p._id || p.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-bold text-slate-900">{propName}</td>
                          <td className="py-3 px-4 text-slate-700 font-semibold">{unitName}</td>
                          <td className="py-3 px-4 text-slate-800">{tenantName}</td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-700">
                            {p.billingMonth}/{p.billingYear}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">{formatCurrency(p.expectedAmount || 0)}</td>
                          <td className="py-3 px-4 font-bold text-amber-700">{formatCurrency(p.expenseAmount || 0)}</td>
                          <td className="py-3 px-4 font-black text-slate-900">{formatCurrency(p.netAmount || 0)}</td>
                          <td className="py-3 px-4 font-bold text-emerald-700">{formatCurrency(p.paidAmount || 0)}</td>
                          <td className="py-3 px-4 font-bold text-rose-600">{formatCurrency(p.remainingAmount || 0)}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                p.status === 'Paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : p.status === 'Partially Paid'
                                  ? 'bg-amber-100 text-amber-800'
                                  : p.status === 'Overdue'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {p.status || 'Pending'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: AGENT EXPENSES */}
        {activeTab === 'expenses' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Property</th>
                    <th className="py-3 px-4">Unit</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {recentExpenses.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-6 text-center text-slate-500">
                        No agent expenses recorded yet.
                      </td>
                    </tr>
                  ) : (
                    recentExpenses.map((exp) => {
                      const propName = exp.propertyId?.propertyName || exp.propertyId?.name || 'N/A';
                      const unitName = exp.unitId?.unitName || exp.unitId?.name || 'N/A';
                      return (
                        <tr key={exp._id || exp.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono text-slate-600">{exp.date}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{propName}</td>
                          <td className="py-3 px-4 text-slate-700 font-semibold">{unitName}</td>
                          <td className="py-3 px-4 font-bold text-amber-800">{exp.expenseCategory}</td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{exp.description}</td>
                          <td className="py-3 px-4 font-black text-rose-600">{formatCurrency(exp.amount || 0)}</td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                              {exp.status || 'Approved'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {exp.receiptUrl ? (
                              <a
                                href={exp.receiptUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3 text-[#04A26F]" />
                                <span>Receipt</span>
                              </a>
                            ) : (
                              <span className="text-[11px] text-slate-400">None</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

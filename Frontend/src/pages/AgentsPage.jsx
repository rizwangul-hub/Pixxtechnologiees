import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Download,
  Briefcase,
  Users,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Edit,
  Archive,
  RotateCcw,
  DollarSign,
  Receipt,
  Wallet,
  Phone,
  Mail,
  MapPin,
  X,
} from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { formatCurrency } from '../utils/currencyFormatter';
import { fetchAgentsAPI, archiveAgentAPI, restoreAgentAPI } from '../services/apiData';
import { downloadFileAPI } from '../services/api';

export default function AgentsPage() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'archived'

  // Archive Modal State
  const [archiveModalTarget, setArchiveModalTarget] = useState(null);
  const [archiveReason, setArchiveReason] = useState('');
  const [isArchiving, setIsArchiving] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState('');

  const loadAgents = async () => {
    setLoading(true);
    try {
      const data = await fetchAgentsAPI(activeTab === 'archived' ? { archived: 'true' } : {});
      setAgents(data || []);
    } catch (e) {
      console.warn('[Agents Load Notice]', e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAgents();
  }, [activeTab]);

  const handleOpenArchiveModal = (agent) => {
    setArchiveModalTarget(agent);
    setArchiveReason('');
  };

  const handleConfirmArchive = async () => {
    if (!archiveModalTarget) return;
    setIsArchiving(true);
    try {
      await archiveAgentAPI(archiveModalTarget._id || archiveModalTarget.id, archiveReason);
      setArchiveModalTarget(null);
      setNoticeMessage(`Agent "${archiveModalTarget.fullName}" archived successfully.`);
      loadAgents();
    } catch (err) {
      alert(`Archive failed: ${err.message}`);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleRestore = async (agent) => {
    try {
      const res = await restoreAgentAPI(agent._id || agent.id);
      setNoticeMessage(res.message || `Agent "${agent.fullName}" restored successfully.`);
      loadAgents();
    } catch (err) {
      alert(`Restore failed: ${err.message}`);
    }
  };

  const regions = Array.from(
    new Set(agents.map((a) => a.region).filter(Boolean))
  );

  const filteredAgents = agents.filter((a) => {
    const isArch = a.isArchived || a.status === 'Archived';
    if (activeTab === 'active' && isArch) return false;
    if (activeTab === 'archived' && !isArch) return false;

    const matchesRegion = selectedRegion === 'All' || a.region === selectedRegion;
    const matchesStatus = selectedStatus === 'All' || a.status === selectedStatus;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (a.fullName && a.fullName.toLowerCase().includes(q)) ||
      (a.phone && a.phone.toLowerCase().includes(q)) ||
      (a.email && a.email.toLowerCase().includes(q)) ||
      (a.region && a.region.toLowerCase().includes(q));

    return matchesRegion && matchesStatus && matchesSearch;
  });

  // Calculate Summary Metrics
  const totalAgents = agents.length;
  let totalAssignedUnits = 0;
  let totalMonthlyCompanyAmount = 0;
  let totalReceived = 0;
  let totalExpenses = 0;

  agents.forEach((a) => {
    totalAssignedUnits += a.assignedUnitsCount || 0;
    totalMonthlyCompanyAmount += a.monthlyAmount || 0;
    totalReceived += a.totalReceived || 0;
    totalExpenses += a.totalExpenses || 0;
  });

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto text-left">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Agent Manager
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Manage field agents, company monthly rent settlements, and agent maintenance expenses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => downloadFileAPI('/export/agents', `Agents_Export_${Date.now()}.csv`).catch((e) => alert(e.message))}
              className="px-3 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center space-x-1.5 shadow-xs cursor-pointer"
              title="Export Agents to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={() => downloadFileAPI('/export/agents/excel', `Agents_Export_${Date.now()}.xlsx`).catch((e) => alert(e.message))}
              className="px-3 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center space-x-1.5 shadow-xs cursor-pointer"
              title="Export Agents to Excel"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel</span>
            </button>
            <Link
              to="/agents/create"
              className="px-4 py-2.5 bg-[#04A26F] text-white text-xs sm:text-sm font-extrabold rounded-xl hover:bg-[#03885c] transition-colors flex items-center space-x-2 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Agent</span>
            </Link>
          </div>
        </div>

        {/* Notice Banner */}
        {noticeMessage && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-semibold shadow-xs">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>{noticeMessage}</span>
            </div>
            <button onClick={() => setNoticeMessage('')} className="text-blue-500 hover:text-blue-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* AGENT MANAGER SUB-NAVIGATION TABS */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-colors ${
              activeTab === 'active'
                ? 'bg-[#04A26F] text-white shadow-xs'
                : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            Active Agents Directory
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-colors ${
              activeTab === 'archived'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            Archived Agents
          </button>
          <Link
            to="/agents/payments"
            className="px-4 py-2 text-xs font-extrabold rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors ml-auto"
          >
            Agent Settlements
          </Link>
        </div>

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#04A26F] flex items-center justify-center font-bold text-xl shrink-0">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Agents</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{totalAgents}</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Assigned Units</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{totalAssignedUnits}</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl shrink-0">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Agent Expenses</p>
              <h3 className="text-xl font-bold text-amber-700 mt-0.5">{formatCurrency(totalExpenses)}</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xl shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Net Received</p>
              <h3 className="text-xl font-bold text-emerald-800 mt-0.5">{formatCurrency(totalReceived)}</h3>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by agent name, phone, email, region..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#04A26F]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Region:</label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#04A26F]"
              >
                <option value="All">All Regions</option>
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Agents Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Agent</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Region</th>
                  <th className="py-3.5 px-4">Assigned Units</th>
                  <th className="py-3.5 px-4">Company Amount</th>
                  <th className="py-3.5 px-4">Expenses</th>
                  <th className="py-3.5 px-4">Net Received</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {filteredAgents.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-slate-500">
                      {loading
                        ? 'Loading agents...'
                        : activeTab === 'archived'
                        ? 'No archived agents found.'
                        : 'No active agents found matching criteria.'}
                    </td>
                  </tr>
                ) : (
                  filteredAgents.map((agent) => (
                    <tr key={agent._id || agent.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {agent.profileImage ? (
                            <img
                              src={agent.profileImage}
                              alt={agent.fullName}
                              crossOrigin="anonymous"
                              referrerPolicy="no-referrer"
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#04A26F] flex items-center justify-center font-black text-sm shrink-0">
                              {agent.fullName ? agent.fullName.charAt(0).toUpperCase() : 'A'}
                            </div>
                          )}
                          <div>
                            <Link
                              to={`/agents/${agent._id || agent.id}`}
                              className="text-[#04A26F] hover:underline font-black text-sm"
                            >
                              {agent.fullName}
                            </Link>
                            <div className="text-[11px] text-slate-400 font-semibold">{agent.country || 'United Kingdom'}</div>
                            {agent.archiveReason && (
                              <div className="text-[11px] text-amber-700 italic mt-0.5">
                                Reason: {agent.archiveReason}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-slate-700">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{agent.phone}</span>
                        </div>
                        {agent.email && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{agent.email}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 font-bold text-slate-800">
                        {agent.region ? (
                          <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span>{agent.region}</span>
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="py-4 px-4 font-extrabold text-slate-900">
                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100">
                          {agent.assignedUnitsCount || 0} unit{(agent.assignedUnitsCount || 0) === 1 ? '' : 's'}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-bold text-slate-900">
                        {formatCurrency(agent.monthlyAmount || 0)}
                      </td>

                      <td className="py-4 px-4 font-bold text-amber-700">
                        {formatCurrency(agent.totalExpenses || 0)}
                      </td>

                      <td className="py-4 px-4 font-black text-emerald-700">
                        {formatCurrency(agent.totalReceived || 0)}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                            agent.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : agent.status === 'Archived' || agent.isArchived
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {agent.isArchived ? 'Archived' : agent.status || 'Active'}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/agents/${agent._id || agent.id}`}
                            title="View Agent Details"
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {activeTab === 'active' ? (
                            <>
                              <Link
                                to={`/agents/${agent._id || agent.id}/edit`}
                                title="Edit Agent"
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>

                              <button
                                onClick={() => handleOpenArchiveModal(agent)}
                                title="Archive Agent"
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleRestore(agent)}
                              title="Restore Agent"
                              className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restore</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Archive Modal */}
      {archiveModalTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-600">
                <Archive className="w-5 h-5" />
                <h3 className="text-lg font-bold text-gray-900">Archive Agent</h3>
              </div>
              <button onClick={() => setArchiveModalTarget(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600">
              Are you sure you want to archive agent <strong>{archiveModalTarget.fullName}</strong>?
            </p>

            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-lg text-xs space-y-1">
              <p className="font-bold">What happens when you archive:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Agent will be moved to the Archived list.</li>
                <li>They will be hidden from new assignment dropdowns.</li>
                <li>All historical settlements, expenses, and payment records remain 100% intact.</li>
              </ul>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for Archiving (Optional):</label>
              <input
                type="text"
                placeholder="e.g. Contract ended, no longer working with company"
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setArchiveModalTarget(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmArchive}
                disabled={isArchiving}
                className="px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-colors flex items-center space-x-1.5"
              >
                <Archive className="w-4 h-4" />
                <span>{isArchiving ? 'Archiving...' : 'Archive Agent'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

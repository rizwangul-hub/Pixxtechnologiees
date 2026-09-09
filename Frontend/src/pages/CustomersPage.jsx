import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Download,
  Users,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Edit,
  Archive,
  RotateCcw,
  Home,
  DollarSign,
  FileText,
  X,
} from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import AssignUnitModal from '../components/customers/AssignUnitModal';
import {
  getSavedCustomers,
  deleteCustomer,
  getAgreementsByCustomer,
  getCustomerMetrics,
  exportCustomersToFile,
  customerTypes,
} from '../data/customersData';
import { formatCurrency } from '../utils/currencyFormatter';
import { fetchCustomersFromAPI, archiveCustomerAPI, restoreCustomerAPI } from '../services/apiData';

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState(() => getSavedCustomers());
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'archived'
  const [selectedCustomerForAssign, setSelectedCustomerForAssign] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Archive Modal State
  const [archiveModalTarget, setArchiveModalTarget] = useState(null);
  const [archiveReason, setArchiveReason] = useState('');
  const [isArchiving, setIsArchiving] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState('');

  const loadData = async () => {
    try {
      const apiList = await fetchCustomersFromAPI(activeTab === 'archived' ? { archived: 'true' } : {});
      if (apiList && Array.isArray(apiList)) {
        setCustomers(apiList);
      } else {
        setCustomers(getSavedCustomers());
      }
    } catch (e) {
      console.warn('[Tenants API Sync Notice]', e.message);
      setCustomers(getSavedCustomers());
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleOpenArchiveModal = (cust) => {
    setArchiveModalTarget(cust);
    setArchiveReason('');
  };

  const handleConfirmArchive = async () => {
    if (!archiveModalTarget) return;
    setIsArchiving(true);
    try {
      await archiveCustomerAPI(archiveModalTarget.id || archiveModalTarget._id, archiveReason);
      deleteCustomer(archiveModalTarget.id || archiveModalTarget._id);
      setArchiveModalTarget(null);
      setNoticeMessage(`Tenant "${archiveModalTarget.name}" archived successfully. Active tenancy ended and unit released.`);
      loadData();
    } catch (e) {
      alert(`Archive failed: ${e.message}`);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleRestore = async (cust) => {
    try {
      const res = await restoreCustomerAPI(cust.id || cust._id);
      setNoticeMessage(res.message || `Tenant "${cust.name}" restored successfully.`);
      loadData();
    } catch (e) {
      alert(`Restore failed: ${e.message}`);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const isArch = c.isArchived || c.status === 'Archived';
    if (activeTab === 'active' && isArch) return false;
    if (activeTab === 'archived' && !isArch) return false;

    const matchesType = selectedType === 'All' || c.type === selectedType;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.cnicOrReg && c.cnicOrReg.toLowerCase().includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q));

    return matchesType && matchesSearch;
  });

  // Calculate high-level summary cards data
  const totalCustomers = customers.length;
  let totalActiveAgreements = 0;
  let totalCollected = 0;
  let totalOverdue = 0;

  customers.forEach((c) => {
    const m = getCustomerMetrics(c.id || c._id);
    totalActiveAgreements += m.activeAgreementsCount;
    totalCollected += m.totalPaid;
    totalOverdue += m.totalOverdue;
  });

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tenants</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage all property tenants, active lease agreements, and archived tenant records.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={async () => {
                try {
                  await downloadFileAPI('/export/customers?format=csv', `Customers_Export_${Date.now()}.csv`);
                } catch (e) {
                  exportCustomersToFile(filteredCustomers, 'csv');
                }
              }}
              className="px-3 py-2 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-1.5 shadow-sm"
              title="Export to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              onClick={async () => {
                try {
                  await downloadFileAPI('/export/customers/excel', `Customers_Export_${Date.now()}.xlsx`);
                } catch (e) {
                  exportCustomersToFile(filteredCustomers, 'xlsx');
                }
              }}
              className="px-3 py-2 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-1.5 shadow-sm"
              title="Export to Excel"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel</span>
            </button>
            <Link
              to="/tenants/create"
              className="px-4 py-2.5 bg-[#04A26F] text-white text-sm font-semibold rounded-lg hover:bg-[#03885c] transition-colors flex items-center space-x-2 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add Tenant</span>
            </Link>
          </div>
        </div>

        {/* Notice Alert Banner */}
        {noticeMessage && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl flex items-center justify-between text-sm shadow-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span>{noticeMessage}</span>
            </div>
            <button onClick={() => setNoticeMessage('')} className="text-blue-500 hover:text-blue-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 text-[#04A26F] flex items-center justify-center font-bold text-xl">
              <Users />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Tenants</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{totalCustomers}</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl">
              <Building2 />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Agreements</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{totalActiveAgreements}</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl">
              <CheckCircle2 />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Collected</p>
              <h3 className="text-xl font-bold text-emerald-700 mt-0.5">{formatCurrency(totalCollected)}</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xl">
              <AlertTriangle />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Overdue Dues</p>
              <h3 className="text-xl font-bold text-rose-600 mt-0.5">{formatCurrency(totalOverdue)}</h3>
            </div>
          </div>
        </div>

        {/* Tab Navigation: Active vs Archived Tenants */}
        <div className="border-b border-gray-200 flex space-x-8">
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'active'
                ? 'border-[#04A26F] text-[#04A26F]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Active Tenants</span>
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'archived'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>Archived Tenants</span>
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, phone, email, NINO..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#04A26F]"
            />
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
              Type:
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#04A26F]"
            >
              <option value="All">All Tenant Types</option>
              {customerTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Tenant</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Identity / NINO</th>
                  <th className="py-3.5 px-4">Assigned Units</th>
                  <th className="py-3.5 px-4">Payment Summary</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-gray-500">
                      {activeTab === 'archived'
                        ? 'No archived tenants found.'
                        : 'No active tenants found matching criteria.'}
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => {
                    const agreements = getAgreementsByCustomer(cust.id || cust._id);
                    const metrics = getCustomerMetrics(cust.id || cust._id);
                    const activeAgreements = agreements.filter((a) => a.status === 'Active');

                    return (
                      <tr key={cust.id || cust._id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 font-semibold text-gray-900">
                          <Link
                            to={`/tenants/${cust.id || cust._id}`}
                            className="text-[#04A26F] hover:underline font-bold"
                          >
                            {cust.name || cust.fullName}
                          </Link>
                          <div className="text-xs text-gray-500 font-normal">{cust.type}</div>
                          {cust.archiveReason && (
                            <div className="text-[11px] text-amber-700 italic mt-0.5">
                              Reason: {cust.archiveReason}
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4 text-gray-700">
                          <div>{cust.phone || '—'}</div>
                          <div className="text-xs text-gray-500">{cust.email || '—'}</div>
                        </td>

                        <td className="py-4 px-4 text-gray-600 font-mono text-xs">
                          {cust.cnicOrReg || '—'}
                        </td>

                        <td className="py-4 px-4">
                          {activeAgreements.length === 0 ? (
                            activeTab === 'active' ? (
                              <button
                                onClick={() => {
                                  setSelectedCustomerForAssign(cust);
                                  setIsAssignModalOpen(true);
                                }}
                                className="text-xs font-semibold text-[#04A26F] bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md transition-colors"
                              >
                                + Assign Unit
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400 font-medium">None</span>
                            )
                          ) : (
                            <div className="space-y-1">
                              {activeAgreements.map((agr) => (
                                <div
                                  key={agr.id}
                                  className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded font-medium inline-block mr-1"
                                >
                                  {agr.propertyName} ({agr.unitName}) -{' '}
                                  <span className="text-emerald-700">{agr.agreementType}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <div className="text-xs space-y-0.5">
                            <div className="text-emerald-700 font-medium">
                              Paid: {formatCurrency(metrics.totalPaid)}
                            </div>
                            {metrics.totalOverdue > 0 && (
                              <div className="text-rose-600 font-bold">
                                Overdue: {formatCurrency(metrics.totalOverdue)}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              cust.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : cust.status === 'Archived' || cust.isArchived
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {cust.isArchived ? 'Archived' : cust.status || 'Active'}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              to={`/tenants/${cust.id || cust._id}`}
                              title="View Tenant Details"
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>

                            {activeTab === 'active' ? (
                              <>
                                <Link
                                  to={`/tenants/${cust.id || cust._id}/edit`}
                                  title="Edit Tenant"
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </Link>

                                <button
                                  onClick={() => handleOpenArchiveModal(cust)}
                                  title="Archive Tenant"
                                  className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                                >
                                  <Archive className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleRestore(cust)}
                                title="Restore Tenant"
                                className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Restore</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
                <h3 className="text-lg font-bold text-gray-900">Archive Tenant</h3>
              </div>
              <button onClick={() => setArchiveModalTarget(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600">
              Are you sure you want to archive <strong>{archiveModalTarget.name}</strong>?
            </p>

            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-lg text-xs space-y-1">
              <p className="font-bold">What happens when you archive:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Tenant will be moved to the Archived list.</li>
                <li>Any active tenancy will be safely ended.</li>
                <li>Their unit will become Available for new tenants.</li>
                <li>All historical payments, invoices, and documents are kept 100% intact.</li>
              </ul>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for Archiving (Optional):</label>
              <input
                type="text"
                placeholder="e.g. Moved out, lease ended, change of property"
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
                <span>{isArchiving ? 'Archiving...' : 'Archive Tenant'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Unit Modal */}
      <AssignUnitModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        customer={selectedCustomerForAssign}
        onSuccess={loadData}
      />
    </AppLayout>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
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
  ExternalLink,
} from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import AssignUnitModal from '../components/customers/AssignUnitModal';
import {
  getSavedCustomers,
  deleteCustomer,
  exportCustomersToFile,
  customerTypes,
} from '../data/customersData';
import { getSavedProperties } from '../data/propertiesData';
import { formatCurrency } from '../utils/currencyFormatter';
import { downloadFileAPI } from '../services/api';
import {
  fetchCustomersFromAPI,
  archiveCustomerAPI,
  restoreCustomerAPI,
  fetchPropertiesFromAPI,
  fetchTenanciesAPI,
  fetchPaymentsAPI,
} from '../services/apiData';

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [properties, setProperties] = useState([]);
  // Map: customerId (string) → active tenancy object from API
  const [tenancyMap, setTenancyMap] = useState({});
  // Map: customerId (string) → { totalPaid, totalOverdue }
  const [paymentMetrics, setPaymentMetrics] = useState({});

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedProperty, setSelectedProperty] = useState('All');
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
      const [apiList, propsList, tenancyList, payList] = await Promise.all([
        fetchCustomersFromAPI(activeTab === 'archived' ? { archived: 'true' } : {}),
        fetchPropertiesFromAPI(),
        fetchTenanciesAPI({ status: 'Active' }),
        fetchPaymentsAPI(),
      ]);

      setCustomers(Array.isArray(apiList) ? apiList : getSavedCustomers());
      setProperties(Array.isArray(propsList) ? propsList : getSavedProperties());

      // Build tenancy lookup: customerId → tenancy
      const tMap = {};
      if (Array.isArray(tenancyList)) {
        tenancyList.forEach((t) => {
          const cid = (t.customerId?._id || t.customerId)?.toString();
          if (cid) {
            if (!tMap[cid] || t.status === 'Active') {
              tMap[cid] = t;
            }
          }
        });
      }
      setTenancyMap(tMap);

      // Build payment metrics: customerId → { totalPaid, totalOverdue }
      const pMap = {};
      if (Array.isArray(payList)) {
        payList.forEach((p) => {
          const cid = (p.customerId?._id || p.customerId)?.toString();
          if (!cid) return;
          if (!pMap[cid]) pMap[cid] = { totalPaid: 0, totalOverdue: 0 };
          pMap[cid].totalPaid += p.paidAmount || 0;
          if (p.status === 'Overdue' || p.status === 'Partially Paid') {
            pMap[cid].totalOverdue += p.remainingAmount || 0;
          }
        });
      }
      setPaymentMetrics(pMap);
    } catch (e) {
      console.warn('[Tenants API Sync Notice]', e.message);
      setCustomers(getSavedCustomers());
      setProperties(getSavedProperties());
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
      setNoticeMessage(`Tenant "${archiveModalTarget.name || archiveModalTarget.fullName}" archived successfully. Active tenancy ended and unit released.`);
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
      setNoticeMessage(res.message || `Tenant "${cust.name || cust.fullName}" restored successfully.`);
      loadData();
    } catch (e) {
      alert(`Restore failed: ${e.message}`);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const isArch = c.isArchived || c.status === 'Archived';
      if (activeTab === 'active' && isArch) return false;
      if (activeTab === 'archived' && !isArch) return false;

      const matchesType = selectedType === 'All' || c.type === selectedType || c.customerType === selectedType;
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.fullName && c.fullName.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.cnicOrReg && c.cnicOrReg.toLowerCase().includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q));

      return matchesType && matchesSearch;
    });
  }, [customers, activeTab, selectedType, search]);

  // Group filtered customers by assigned property (from API tenancyMap)
  const groupedData = useMemo(() => {
    const propMap = new Map();
    const unassigned = [];

    filteredCustomers.forEach((cust) => {
      const cid = (cust._id || cust.id)?.toString();
      const tenancy = tenancyMap[cid];

      if (tenancy) {
        const prop = tenancy.propertyId;
        const pId = (prop?._id || prop)?.toString() || 'unknown';
        const pName = prop?.propertyName || prop?.name || tenancy.propertyName || 'Property';

        if (selectedProperty !== 'All' && selectedProperty !== pId && selectedProperty !== pName) return;

        if (!propMap.has(pId)) {
          propMap.set(pId, { id: pId, name: pName, tenants: [] });
        }
        const group = propMap.get(pId);
        if (!group.tenants.some((t) => (t._id || t.id)?.toString() === cid)) {
          group.tenants.push(cust);
        }
      } else {
        if (selectedProperty === 'All' || selectedProperty === 'Unassigned') {
          if (!unassigned.some((t) => (t._id || t.id)?.toString() === cid)) {
            unassigned.push(cust);
          }
        }
      }
    });

    return { groups: Array.from(propMap.values()), unassigned };
  }, [filteredCustomers, tenancyMap, selectedProperty]);

  // High-level metrics from API data
  const totalCustomers = customers.length;
  const totalActiveAgreements = Object.keys(tenancyMap).length;
  const totalCollected = Object.values(paymentMetrics).reduce((s, m) => s + m.totalPaid, 0);
  const totalOverdue = Object.values(paymentMetrics).reduce((s, m) => s + m.totalOverdue, 0);

  const renderTenantRow = (cust) => {
    const cid = (cust._id || cust.id)?.toString();
    const tenancy = tenancyMap[cid];
    const metrics = paymentMetrics[cid] || { totalPaid: 0, totalOverdue: 0 };
    const prop = tenancy?.propertyId;
    const propName = prop?.propertyName || prop?.name || tenancy?.propertyName || null;

    return (
      <tr key={cid} className="hover:bg-gray-50 transition-colors">
        <td className="py-3.5 px-4 font-semibold text-gray-900">
          <Link
            to={`/tenants/${cid}`}
            className="text-[#04A26F] hover:underline font-bold"
          >
            {cust.fullName || cust.name}
          </Link>
          <div className="text-xs text-gray-500 font-normal">{cust.type || cust.customerType || 'Individual'}</div>
          {cust.archiveReason && (
            <div className="text-[11px] text-amber-700 italic mt-0.5">
              Reason: {cust.archiveReason}
            </div>
          )}
        </td>

        <td className="py-3.5 px-4 text-gray-700">
          <div>{cust.phone || '—'}</div>
          <div className="text-xs text-gray-500">{cust.email || '—'}</div>
        </td>

        <td className="py-3.5 px-4 text-gray-600 font-mono text-xs">
          {cust.cnicOrReg || '—'}
        </td>

        <td className="py-3.5 px-4">
          {tenancy && propName ? (
            <div className="space-y-1">
              <div className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-medium inline-block">
                {propName}
              </div>
              <div className="text-[10px] text-gray-500">
                {formatCurrency(tenancy.monthlyRent)}/mo · {tenancy.status}
              </div>
            </div>
          ) : (
            activeTab === 'active' ? (
              <button
                onClick={() => {
                  setSelectedCustomerForAssign(cust);
                  setIsAssignModalOpen(true);
                }}
                className="text-xs font-semibold text-[#04A26F] bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md transition-colors"
              >
                + Assign Property
              </button>
            ) : (
              <span className="text-xs text-gray-400 font-medium">None</span>
            )
          )}
        </td>

        <td className="py-3.5 px-4">
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

        <td className="py-3.5 px-4">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              cust.isArchived
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {cust.isArchived ? 'Archived' : 'Active'}
          </span>
        </td>

        <td className="py-3.5 px-4 text-right">
          <div className="flex items-center justify-end space-x-2">
            <Link
              to={`/tenants/${cid}`}
              title="View Tenant Details"
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Eye className="w-4 h-4" />
            </Link>

            {activeTab === 'active' ? (
              <>
                <Link
                  to={`/tenants/${cid}/edit`}
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
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto text-left">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tenants Directory</h1>
            <p className="text-sm text-gray-500 mt-1">
              Property-wise breakdown of all active tenants, lease agreements, and payment records.
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
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tenant name, phone, NINO..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#04A26F]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Property Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Property:
              </label>
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#04A26F] bg-white font-medium"
              >
                <option value="All">All Properties</option>
                {propertyOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
                <option value="Unassigned">Unassigned Tenants</option>
              </select>
            </div>

            {/* Tenant Type Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Type:
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#04A26F] bg-white font-medium"
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
        </div>

        {/* PROPERTY-BY-PROPERTY TENANTS DISPLAY */}
        <div className="space-y-8">
          {groupedData.groups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
            >
              {/* Property Group Card Header */}
              <div className="bg-slate-900 text-white p-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      {group.name}
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {group.tenants.length} {group.tenants.length === 1 ? 'Tenant' : 'Tenants'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300">Property Tenant Roster & Active Lease Agreements</p>
                  </div>
                </div>

                {group.id && group.id !== 'Unassigned' && (
                  <Link
                    to={`/properties/${group.id}`}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 bg-slate-800 px-3.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors shrink-0 self-start sm:self-auto"
                  >
                    <span>View Property</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              {/* Property Tenants Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Tenant</th>
                      <th className="py-3 px-4">Contact Info</th>
                      <th className="py-3 px-4">Identity / NINO</th>
                      <th className="py-3 px-4">Assigned Units</th>
                      <th className="py-3 px-4">Payment Summary</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-sm">
                    {group.tenants.map((cust) => renderTenantRow(cust))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* UNASSIGNED TENANTS SECTION */}
          {groupedData.unassigned.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-slate-800 text-white p-4 px-5 flex items-center justify-between border-b border-slate-700">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      Unassigned / Independent Tenants
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {groupedData.unassigned.length} {groupedData.unassigned.length === 1 ? 'Tenant' : 'Tenants'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300">Tenants pending active property lease assignment</p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Tenant</th>
                      <th className="py-3 px-4">Contact Info</th>
                      <th className="py-3 px-4">Identity / NINO</th>
                      <th className="py-3 px-4">Assigned Units</th>
                      <th className="py-3 px-4">Payment Summary</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-sm">
                    {groupedData.unassigned.map((cust) => renderTenantRow(cust))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* EMPTY STATE */}
          {groupedData.groups.length === 0 && groupedData.unassigned.length === 0 && (
            <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900">No Tenants Found</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                {activeTab === 'archived'
                  ? 'No archived tenants found matching your search or filters.'
                  : 'No active tenants found matching your selected property or search criteria.'}
              </p>
            </div>
          )}
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
              Are you sure you want to archive <strong>{archiveModalTarget.name || archiveModalTarget.fullName}</strong>?
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

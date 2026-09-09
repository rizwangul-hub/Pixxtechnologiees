import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Search,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  ArrowLeft,
  Filter,
} from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import RecordPaymentModal from '../components/payments/RecordPaymentModal';
import {
  getSavedPaymentSchedules,
  getOverallPaymentMetrics,
  exportPaymentSchedulesToFile,
  scheduleStatuses,
} from '../data/customersData';
import { getSavedProperties } from '../data/propertiesData';
import { formatCurrency } from '../utils/currencyFormatter';
import { fetchPaymentsAPI, fetchPropertiesFromAPI } from '../services/apiData';
import { downloadFileAPI } from '../services/api';

export default function PaymentSchedulesPage() {
  const [schedules, setSchedules] = useState(() => getSavedPaymentSchedules());
  const [properties, setProperties] = useState(() => getSavedProperties());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [propertyFilter, setPropertyFilter] = useState('All');

  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const loadData = async () => {
    const [list, remoteProperties] = await Promise.all([fetchPaymentsAPI(), fetchPropertiesFromAPI()]);
    if (list && Array.isArray(list) && list.length > 0) setSchedules(list);
    if (remoteProperties && Array.isArray(remoteProperties) && remoteProperties.length > 0) setProperties(remoteProperties);
  };

  useEffect(() => {
    loadData();
  }, []);

  const metrics = getOverallPaymentMetrics();

  const filteredSchedules = schedules.filter((s) => {
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    const matchesProperty = propertyFilter === 'All' || s.propertyId === propertyFilter;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (s.customerName && s.customerName.toLowerCase().includes(q)) ||
      (s.propertyName && s.propertyName.toLowerCase().includes(q)) ||
      (s.unitName && s.unitName.toLowerCase().includes(q)) ||
      (s.periodName && s.periodName.toLowerCase().includes(q));

    return matchesStatus && matchesProperty && matchesSearch;
  });

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payment Schedules & Dues</h1>
            <p className="text-sm text-gray-500 mt-1">
              Automated recurring monthly dues, rent obligations, and sale installments across all units.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={async () => {
                try {
                  await downloadFileAPI('/export/payments?format=csv', `Payment_Schedules_${Date.now()}.csv`);
                } catch (e) {
                  exportPaymentSchedulesToFile(filteredSchedules, 'csv');
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
                  await downloadFileAPI('/export/payments/excel', `Payment_Schedules_${Date.now()}.xlsx`);
                } catch (e) {
                  exportPaymentSchedulesToFile(filteredSchedules, 'xlsx');
                }
              }}
              className="px-3 py-2 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-1.5 shadow-sm"
              title="Export to Excel"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel</span>
            </button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl">
              <CheckCircle2 />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Received</p>
              <h3 className="text-xl font-bold text-emerald-700 mt-0.5">
                {formatCurrency(metrics.totalCollected)}
              </h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl">
              <Clock />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Dues</p>
              <h3 className="text-xl font-bold text-amber-600 mt-0.5">{formatCurrency(metrics.totalPending)}</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xl">
              <AlertTriangle />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Overdue Dues</p>
              <h3 className="text-xl font-bold text-rose-600 mt-0.5">{formatCurrency(metrics.totalOverdue)}</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl">
              <Calendar />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Schedules</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{metrics.totalSchedulesCount}</h3>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tenant, unit, property..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#04A26F]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="flex items-center space-x-2">
              <label className="text-xs font-semibold text-gray-500 uppercase">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#04A26F]"
              >
                <option value="All">All Statuses</option>
                {scheduleStatuses.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-xs font-semibold text-gray-500 uppercase">Property:</label>
              <select
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#04A26F]"
              >
                <option value="All">All Properties</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Schedules Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Period / Obligation</th>
                  <th className="py-3.5 px-4">Tenant</th>
                  <th className="py-3.5 px-4">Property & Unit</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Expected</th>
                  <th className="py-3.5 px-4">Paid</th>
                  <th className="py-3.5 px-4">Remaining</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSchedules.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-gray-500">
                      No payment schedules found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredSchedules.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-gray-900">{s.periodName}</td>
                      <td className="py-3.5 px-4 font-medium text-gray-800">
                        <Link
                          to={`/tenants/${s.customerId}`}
                          className="text-[#04A26F] hover:underline"
                        >
                          {s.customerName}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-gray-700">
                        <div>{s.propertyName}</div>
                        <div className="text-xs text-gray-500">{s.unitName}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-gray-700">{s.dueDate}</td>
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        {formatCurrency(s.expectedAmount)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-700">
                        {formatCurrency(s.paidAmount)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-amber-600">
                        {formatCurrency(s.remainingAmount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            s.status === 'Paid' || s.status === 'Received'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.status === 'Overdue'
                              ? 'bg-rose-100 text-rose-800'
                              : s.status === 'Partially Paid' || s.status === 'Partially Received'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {s.status === 'Paid' ? 'Received' : s.status === 'Partially Paid' ? 'Partially Received' : s.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {s.status !== 'Paid' && s.status !== 'Received' && (
                          <button
                            onClick={() => {
                              setSelectedSchedule(s);
                              setIsPaymentModalOpen(true);
                            }}
                            className="px-3 py-1 bg-[#04A26F] text-white text-xs font-semibold rounded hover:bg-[#03885c] transition-colors shadow-xs"
                          >
                            Record Payment
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        scheduleItem={selectedSchedule}
        onSuccess={loadData}
      />
    </AppLayout>
  );
}

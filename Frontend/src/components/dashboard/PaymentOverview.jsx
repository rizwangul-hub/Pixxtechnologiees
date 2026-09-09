import React, { useState } from 'react';
import { Search, AlertTriangle, CheckCircle2, Clock, ChevronDown } from 'lucide-react';

export function PaymentOverview() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'overdue' | 'pending' | 'paid'

  const payments = [
    {
      id: 'PAY-101',
      payer: 'Ahmed Khan',
      property: '127 Southend Road',
      unit: 'Flat A-102',
      daysOverdue: 42,
      rentsOverdue: 1450.0,
      chargesOverdue: 50.0,
      totalOverdue: 1500.0,
      status: 'Overdue',
      dueDate: '2026-08-01',
    },
    {
      id: 'PAY-102',
      payer: 'Sarah Jenkins',
      property: 'Parkview Heights',
      unit: 'Unit B-204',
      daysOverdue: 14,
      rentsOverdue: 1200.0,
      chargesOverdue: 0.0,
      totalOverdue: 1200.0,
      status: 'Overdue',
      dueDate: '2026-08-24',
    },
    {
      id: 'PAY-103',
      payer: 'David & Emma Taylor',
      property: 'Willow Creek Apartments',
      unit: 'Apt 4B',
      daysOverdue: 0,
      rentsOverdue: 0.0,
      chargesOverdue: 0.0,
      totalOverdue: 0.0,
      status: 'Paid',
      dueDate: '2026-09-01',
    },
    {
      id: 'PAY-104',
      payer: 'Michael Roberts',
      property: '127 Southend Road',
      unit: 'Retail Shop Unit 1',
      daysOverdue: 5,
      rentsOverdue: 3250.0,
      chargesOverdue: 120.0,
      totalOverdue: 3370.0,
      status: 'Pending',
      dueDate: '2026-09-02',
    },
    {
      id: 'PAY-105',
      payer: 'Victoria Sterling',
      property: 'High Street Commercial Centre',
      unit: 'Suite 301',
      daysOverdue: 60,
      rentsOverdue: 4500.0,
      chargesOverdue: 250.0,
      totalOverdue: 4750.0,
      status: 'Overdue',
      dueDate: '2026-07-08',
    },
  ];

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.payer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.property.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.unit.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : p.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden text-left space-y-4">
      {/* HEADER BAR MATCHING SCREENSHOT */}
      <div className="bg-slate-800 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-extrabold tracking-tight">
              Overdue Payments (more than 0 days)
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
              107 total
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Rents and charges pending collection across current portfolio.
          </p>
        </div>

        {/* Total Overdue Badge */}
        <div className="bg-slate-900/90 border border-slate-700 px-4 py-2 rounded-xl text-left sm:text-right shrink-0">
          <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
            Total Amount Overdue
          </p>
          <p className="text-lg font-extrabold text-rose-400">&pound;188,231.21</p>
        </div>
      </div>

      {/* SEARCH & FILTER ROW */}
      <div className="px-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Search Input */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search tenant or property..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#00a36f] focus:bg-white transition-all placeholder-slate-400"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('overdue')}
            className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              statusFilter === 'overdue'
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Overdue
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Pending
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              statusFilter === 'paid'
                ? 'bg-[#00a36f] text-white border-[#00a36f]'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Paid
          </button>
        </div>
      </div>

      {/* RESPONSIVE TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-medium border-t border-slate-200/80">
          <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200/80">
            <tr>
              <th className="py-3 px-4 sm:px-5">Payer / Tenant</th>
              <th className="py-3 px-4">Property &amp; Unit</th>
              <th className="py-3 px-4">Latest Days Overdue</th>
              <th className="py-3 px-4">Rents Overdue</th>
              <th className="py-3 px-4">Charges Overdue</th>
              <th className="py-3 px-4">Total Amount Overdue</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredPayments.length > 0 ? (
              filteredPayments.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 sm:px-5 font-bold text-slate-900">
                    <div>{item.payer}</div>
                    <div className="text-[10px] text-slate-400 font-normal">ID: {item.id}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">{item.property}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{item.unit}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    {item.daysOverdue > 0 ? (
                      <span className="font-extrabold text-rose-600">
                        {item.daysOverdue} days
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">On time</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    &pound;{item.rentsOverdue.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-500">
                    &pound;{item.chargesOverdue.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-slate-900">
                    &pound;{item.totalOverdue.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {item.status === 'Overdue' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        Overdue
                      </span>
                    )}
                    {item.status === 'Pending' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Pending
                      </span>
                    )}
                    {(item.status === 'Paid' || item.status === 'Received') && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-[#00a36f] border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-[#00a36f]" />
                        Received
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-400 font-medium">
                  No payment records found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Printer, ChevronRight, CheckSquare, Square } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyFormatter';

export function PaymentTable({ payments, isIncomeTab, onAddPaymentClick }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const totalRecords = payments.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const paginatedRecords = payments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedRecords.map((p) => p.id));
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="space-y-4 text-left">
      {/* TOP ACTION BAR ABOVE TABLE */}
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-bold text-slate-500">
          Showing {paginatedRecords.length} of {totalRecords} records
        </span>

        <button
          type="button"
          onClick={onAddPaymentClick}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white bg-[#00a36f] hover:bg-[#008f61] active:bg-[#007a53] rounded-lg transition-all cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{isIncomeTab ? 'Add Income Payment' : 'Add Payment'}</span>
        </button>
      </div>

      {/* TABLE VIEW (DESKTOP) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5 w-10 text-center">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {selectedIds.length > 0 && selectedIds.length === paginatedRecords.length ? (
                      <CheckSquare className="w-4 h-4 text-[#00a36f]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">{isIncomeTab ? 'Payer / Tenant' : 'Supplier'}</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Property</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4 text-right">Payment Amount</th>
                <th className="py-3 px-4 text-right">Allocated Amount</th>
                <th className="py-3 px-4 text-right">Unallocated Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                    No payment records found matching criteria.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const partyName = isIncomeTab ? item.payer : item.supplier;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(item.id)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#00a36f]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{partyName || '-'}</td>
                      <td className="py-3 px-4 font-medium text-slate-600 max-w-xs truncate">
                        {item.reference || '-'}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">{item.property || '-'}</td>
                      <td className="py-3 px-4 font-medium text-slate-600">{formatDate(item.date)}</td>
                      <td className="py-3 px-4 font-medium text-slate-600">{item.account || '-'}</td>
                      <td className="py-3 px-4 font-bold text-sky-700 text-right">
                        {formatCurrency(item.paymentAmount)}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800 text-right flex items-center justify-end gap-1">
                        <span>{formatCurrency(item.allocatedAmount)}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 inline" />
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-600 text-right">
                        {formatCurrency(item.unallocatedAmount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="space-y-3 md:hidden">
        {paginatedRecords.length === 0 ? (
          <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-xs text-slate-400 font-medium">
            No payment records found.
          </div>
        ) : (
          paginatedRecords.map((item) => {
            const partyName = isIncomeTab ? item.payer : item.supplier;
            return (
              <div
                key={item.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2.5 text-left"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-900">{partyName || '-'}</span>
                  <span className="text-xs font-extrabold text-sky-700">
                    {formatCurrency(item.paymentAmount)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Property</span>
                    <span className="text-slate-700 font-medium">{item.property || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Date</span>
                    <span className="text-slate-700 font-medium">{formatDate(item.date)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Account</span>
                    <span className="text-slate-700 font-medium">{item.account || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Allocated</span>
                    <span className="text-slate-700 font-bold">{formatCurrency(item.allocatedAmount)}</span>
                  </div>
                </div>
                {item.reference && (
                  <div className="pt-1 text-[11px] text-slate-500 italic border-t border-slate-50">
                    Ref: {item.reference}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER CONTROL BAR (Records count, Bulk Options, Print, Add Payment) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center gap-3">
          <label className="text-slate-600 font-medium">
            Show
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="mx-1 px-2 py-1 border border-slate-200 rounded-md font-bold text-slate-800 bg-slate-50"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            records on screen
          </label>

          <button
            type="button"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-md transition-colors cursor-pointer"
          >
            Bulk Options ▾
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-md transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={onAddPaymentClick}
            className="px-4 py-1.5 text-xs font-extrabold text-white bg-[#00a36f] hover:bg-[#008f61] active:bg-[#007a53] rounded-md transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>{isIncomeTab ? 'Add Income Payment' : 'Add Payment'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Plus, Download, ChevronRight, ChevronDown, ChevronLeft, ChevronsLeft, ChevronsRight } from 'lucide-react';

export function TenantTable({ tenants, onAddTenantClick, onExportClick }) {
  const [expandedIds, setExpandedIds] = useState({});
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const totalRecords = tenants.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const paginatedTenants = tenants.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const toggleExpand = (id) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-4 text-left">
      {/* TOP ACTION BAR */}
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-bold text-slate-500">
          Showing {paginatedTenants.length} of {totalRecords} records
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAddTenantClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white bg-[#00a36f] hover:bg-[#008f61] active:bg-[#007a53] rounded-lg transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Tenant</span>
          </button>

          <button
            type="button"
            onClick={onExportClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white bg-[#00a36f] hover:bg-[#008f61] active:bg-[#007a53] rounded-lg transition-all cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Export to Excel ▾</span>
          </button>
        </div>
      </div>

      {/* TABLE VIEW (DESKTOP) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Tenant ^</th>
                <th className="py-3 px-4">Tenant E-mail</th>
                <th className="py-3 px-4">Tenant Phone</th>
                <th className="py-3 px-4">Property Name</th>
                <th className="py-3 px-4 text-right">Number of Tenancies</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                    No tenant records found matching criteria.
                  </td>
                </tr>
              ) : (
                paginatedTenants.map((t) => {
                  const isExpanded = Boolean(expandedIds[t.id]);
                  const activeCount = t.tenancies?.filter((tn) => tn.status === 'Active Tenancies').length || 0;
                  const totalCount = t.tenancies?.length || 0;

                  return (
                    <React.Fragment key={t.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-sky-700 hover:underline cursor-pointer">
                          {t.name}
                        </td>
                        <td className="py-3 px-4 font-medium text-sky-700 hover:underline">
                          {t.email1 || t.email2 || '-'}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-600">
                          {t.phone1 || t.phone2 || '-'}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {t.property || '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => toggleExpand(t.id)}
                            className="inline-flex items-center gap-1 font-bold text-sky-700 hover:text-sky-900 cursor-pointer"
                          >
                            <span>
                              {activeCount} ({totalCount})
                            </span>
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-[#00a36f]" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-sky-700" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* EXPANDABLE TENANCY SUB-ROW */}
                      {isExpanded && t.tenancies && t.tenancies.length > 0 && (
                        <tr className="bg-emerald-50/30">
                          <td colSpan={5} className="p-4 border-t border-b border-emerald-100">
                            <div className="space-y-3 pl-4 border-l-2 border-[#00a36f]">
                              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                                Tenancy Records ({t.name})
                              </p>
                              <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                      <th className="py-2 px-3">Property</th>
                                      <th className="py-2 px-3">Direct Debit</th>
                                      <th className="py-2 px-3">Tenant Type</th>
                                      <th className="py-2 px-3">Payment Term</th>
                                      <th className="py-2 px-3">Rent</th>
                                      <th className="py-2 px-3">Start Date</th>
                                      <th className="py-2 px-3">Expiry Date</th>
                                      <th className="py-2 px-3">Days Left / Status</th>
                                      <th className="py-2 px-3">Rolling</th>
                                      <th className="py-2 px-3">Extend By</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {t.tenancies.map((tn, idx) => (
                                      <tr key={idx} className="hover:bg-slate-50">
                                        <td className="py-2 px-3 font-bold text-slate-800">{tn.property}</td>
                                        <td className="py-2 px-3 text-slate-600">{tn.directDebit || 'No'}</td>
                                        <td className="py-2 px-3 text-slate-600">{tn.tenantType}</td>
                                        <td className="py-2 px-3 text-slate-600">{tn.paymentTerm}</td>
                                        <td className="py-2 px-3 font-bold text-[#00a36f]">{tn.rent}</td>
                                        <td className="py-2 px-3 text-slate-600">{tn.startDate}</td>
                                        <td className="py-2 px-3 text-slate-600">{tn.expiryDate}</td>
                                        <td className="py-2 px-3">
                                          {tn.daysLeft ? (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                              {tn.daysLeft} days left
                                            </span>
                                          ) : (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                              {tn.expired || 'Expired'}
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-2 px-3 text-slate-600">{tn.rolling || 'No'}</td>
                                        <td className="py-2 px-3 text-slate-600">{tn.extendBy || '-'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="space-y-3 md:hidden">
        {paginatedTenants.length === 0 ? (
          <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-xs text-slate-400 font-medium">
            No tenant records found.
          </div>
        ) : (
          paginatedTenants.map((t) => {
            const isExpanded = Boolean(expandedIds[t.id]);
            return (
              <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2 text-left">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-sky-700">{t.name}</span>
                  <button
                    type="button"
                    onClick={() => toggleExpand(t.id)}
                    className="p-1 text-sky-700 text-xs font-bold cursor-pointer"
                  >
                    {isExpanded ? 'Hide Tenancies ▴' : 'View Tenancies ▾'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Property</span>
                    <span className="text-slate-700 font-medium">{t.property || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Contact</span>
                    <span className="text-slate-700 font-medium">{t.email1 || t.phone1 || '-'}</span>
                  </div>
                </div>

                {isExpanded && t.tenancies && (
                  <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                    <p className="font-extrabold text-[#00a36f] text-[11px]">Tenancies:</p>
                    {t.tenancies.map((tn, idx) => (
                      <div key={idx} className="p-2 bg-slate-50 rounded-lg space-y-1">
                        <p className="font-bold text-slate-800">{tn.property}</p>
                        <p className="text-slate-500">Rent: <strong className="text-slate-800">{tn.rent}</strong> ({tn.paymentTerm})</p>
                        <p className="text-slate-500">Dates: {tn.startDate} - {tn.expiryDate}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER BAR (Application Form, Pagination, Records selector, Add & Export buttons) */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3 rounded-xl border border-slate-200 text-xs">
        <button
          type="button"
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-md transition-colors cursor-pointer"
        >
          Application Form
        </button>

        {/* PAGINATION CONTROLS */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-600 rounded font-bold cursor-pointer"
          >
            <ChevronsLeft className="w-3.5 h-3.5 inline" /> First
          </button>
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-600 rounded font-bold cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5 inline" /> Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              onClick={() => setCurrentPage(pageNum)}
              className={`px-2.5 py-1 rounded font-bold cursor-pointer ${
                currentPage === pageNum
                  ? 'bg-[#00a36f] text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {pageNum}
            </button>
          ))}

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-600 rounded font-bold cursor-pointer"
          >
            Next <ChevronRight className="w-3.5 h-3.5 inline" />
          </button>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(totalPages)}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-600 rounded font-bold cursor-pointer"
          >
            Last <ChevronsRight className="w-3.5 h-3.5 inline" />
          </button>

          <label className="ml-3 text-slate-600 font-medium">
            Show
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="mx-1 px-2 py-1 border border-slate-200 rounded font-bold text-slate-800 bg-slate-50"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            records on screen
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAddTenantClick}
            className="px-4 py-1.5 text-xs font-extrabold text-white bg-[#00a36f] hover:bg-[#008f61] active:bg-[#007a53] rounded-md transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Add Tenant</span>
          </button>

          <button
            type="button"
            onClick={onExportClick}
            className="px-4 py-1.5 text-xs font-extrabold text-white bg-[#00a36f] hover:bg-[#008f61] active:bg-[#007a53] rounded-md transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Export to Excel ▾</span>
          </button>
        </div>
      </div>
    </div>
  );
}

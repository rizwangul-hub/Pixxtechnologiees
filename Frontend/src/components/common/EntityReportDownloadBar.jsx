import React, { useState } from 'react';
import { Calendar, Download, FileText, Loader2, Sparkles } from 'lucide-react';
import { downloadFileAPI } from '../../services/api';
import { exportPropertyReport, exportCustomerReport } from '../../services/reportExportService';

/**
 * Reusable Date-Range Excel & PDF Statement/Report Download Control
 * Allows managers to pick From Date and To Date for an individual Tenant, Landlord, Agent, or Property
 * and automatically calculates financial metrics & generates professional UK business Excel/PDF reports.
 */
export function EntityReportDownloadBar({ entityType, entityId, entityName = 'Report' }) {
  const currentYear = new Date().getFullYear();
  const [fromDate, setFromDate] = useState(`${currentYear}-01-01`);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const getEndpoint = (format) => {
    const dates = `fromDate=${fromDate}&toDate=${toDate}`;
    switch (entityType) {
      case 'tenant':
      case 'customer':
        return `/reports/tenant-statement/${entityId}/${format}?${dates}`;
      case 'landlord':
        return `/reports/landlord/${entityId}/${format}?${dates}`;
      case 'agent':
        return `/reports/agent/${entityId}/${format}?${dates}`;
      case 'property':
        return `/reports/property/${entityId}/${format}?${dates}`;
      default:
        return `/reports/tenant-statement/${entityId}/${format}?${dates}`;
    }
  };

  const handleDownloadExcel = async () => {
    if (!entityId) return;
    setLoadingExcel(true);
    try {
      const endpoint = getEndpoint('excel');
      const cleanName = (entityName || 'Report').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${entityType.toUpperCase()}_Statement_${cleanName}_${fromDate}_to_${toDate}.xlsx`;
      await downloadFileAPI(endpoint, filename);
    } catch (err) {
      console.warn('[Excel Download API Fallback]', err.message);
      try {
        if (entityType === 'property') {
          exportPropertyReport({ propertyId: entityId, dateFrom: fromDate, dateTo: toDate });
        } else if (entityType === 'landlord') {
          exportPropertyReport({ landlordId: entityId, dateFrom: fromDate, dateTo: toDate });
        } else if (entityType === 'tenant' || entityType === 'customer') {
          exportCustomerReport({ tenantId: entityId, dateFrom: fromDate, dateTo: toDate });
        } else {
          exportPropertyReport({ dateFrom: fromDate, dateTo: toDate });
        }
      } catch (localErr) {
        alert(err.message || 'Failed to generate Excel report');
      }
    } finally {
      setLoadingExcel(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!entityId) return;
    setLoadingPdf(true);
    try {
      const endpoint = getEndpoint('pdf');
      const cleanName = (entityName || 'Report').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${entityType.toUpperCase()}_Statement_${cleanName}_${fromDate}_to_${toDate}.pdf`;
      await downloadFileAPI(endpoint, filename);
    } catch (err) {
      alert(err.message || 'Failed to generate PDF report from server.');
    } finally {
      setLoadingPdf(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-4 sm:p-5 rounded-2xl border border-emerald-800/30 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Title & Info */}
      <div className="flex items-center space-x-3">
        <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-black tracking-wide text-emerald-300 uppercase">
            Individual Financial Report & Statement
          </h4>
          <p className="text-xs text-slate-300 mt-0.5">
            Select custom date range to auto-calculate all ledger balances, payments, and statement totals for{' '}
            <span className="font-bold text-white">{entityName}</span>.
          </p>
        </div>
      </div>

      {/* Date Pickers & Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center space-x-2 bg-slate-800/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs">
          <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-slate-400 font-semibold">From:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
          />
        </div>

        <div className="flex items-center space-x-2 bg-slate-800/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs">
          <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-slate-400 font-semibold">To:</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
          />
        </div>

        <div className="flex items-center space-x-2">
          {/* Excel Download Button */}
          <button
            type="button"
            onClick={handleDownloadExcel}
            disabled={loadingExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all flex items-center space-x-1.5 shadow-md disabled:opacity-50 cursor-pointer"
            title="Download formatted Excel report for selected date range"
          >
            {loadingExcel ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Excel (.xlsx)</span>
          </button>

          {/* PDF Download Button */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={loadingPdf}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-600 text-slate-200 text-xs font-extrabold rounded-xl transition-all flex items-center space-x-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
            title="Download PDF report statement for selected date range"
          >
            {loadingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
            ) : (
              <FileText className="w-4 h-4 text-rose-400" />
            )}
            <span>PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default EntityReportDownloadBar;

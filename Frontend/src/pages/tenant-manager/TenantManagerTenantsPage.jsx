import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout';
import { Users, UserPlus, Download } from 'lucide-react';
import { TenantFilters } from '../../components/tenants/TenantFilters';
import { TenantTable } from '../../components/tenants/TenantTable';
import { ExportTenantsModal } from '../../components/tenants/ExportTenantsModal';
import {
  getSavedTenants,
  filterTenants,
  exportTenantsToExcel,
} from '../../data/tenantsData';
import { downloadFileAPI } from '../../services/api';

export function TenantManagerTenantsPage() {
  const navigate = useNavigate();

  const [tenants, setTenants] = useState([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    searchBy: 'All',
    alphabet: 'All',
    birthday: '- Any -',
    status: '- Any -',
    property: '- Any -',
  });

  useEffect(() => {
    setTenants(getSavedTenants());
  }, []);

  // Extract unique property names for dropdown
  const propertiesList = useMemo(() => {
    const set = new Set();
    tenants.forEach((t) => {
      if (t.property) set.add(t.property);
      if (t.tenancies) {
        t.tenancies.forEach((tn) => {
          if (tn.property) set.add(tn.property);
        });
      }
    });
    return Array.from(set);
  }, [tenants]);

  const filteredData = useMemo(() => {
    return filterTenants(tenants, filters);
  }, [tenants, filters]);

  const handleClearFilters = () => {
    setFilters({
      search: '',
      searchBy: 'All',
      alphabet: 'All',
      birthday: '- Any -',
      status: '- Any -',
      property: '- Any -',
    });
  };

  const handleSearch = () => {
    // Automatically re-filtered via useMemo
  };

  const handleExport = async (exportOptions) => {
    try {
      await downloadFileAPI('/export/customers/excel', `Tenants_Export_${Date.now()}.xlsx`);
    } catch (e) {
      exportTenantsToExcel(filteredData, exportOptions);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 text-left pb-12">
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Tenants Register</span>
              <Users className="w-6 h-6 text-[#00a36f]" />
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              View tenant contact details, active and expired tenancies, screening records, and lease terms.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => navigate('/tenant-manager/tenants/create')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white bg-[#00a36f] hover:bg-[#008f61] active:bg-[#007a53] rounded-lg transition-all cursor-pointer shadow-xs focus:ring-2 focus:ring-[#00a36f]"
            >
              <UserPlus className="w-4 h-4 stroke-[3]" />
              <span>Add Tenant</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white bg-[#00a36f] hover:bg-[#008f61] active:bg-[#007a53] rounded-lg transition-all cursor-pointer shadow-xs focus:ring-2 focus:ring-[#00a36f]"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Export to Excel ▾</span>
            </button>
          </div>
        </div>

        {/* FILTERS BAR */}
        <TenantFilters
          filters={filters}
          setFilters={setFilters}
          onSearch={handleSearch}
          onClear={handleClearFilters}
          properties={propertiesList}
        />

        {/* TENANTS TABLE */}
        <TenantTable
          tenants={filteredData}
          onAddTenantClick={() => navigate('/tenant-manager/tenants/create')}
          onExportClick={() => setIsExportModalOpen(true)}
        />

        {/* EXPORT MODAL */}
        <ExportTenantsModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          onExport={handleExport}
        />
      </div>
    </AppLayout>
  );
}

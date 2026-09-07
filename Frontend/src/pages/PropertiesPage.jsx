import React, { useState, useMemo } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Link } from 'react-router-dom';
import { Plus, Download, Building, Home } from 'lucide-react';
import { PropertyFilters } from '../components/properties/PropertyFilters';
import { PropertyTable } from '../components/properties/PropertyTable';
import { PropertyPagination } from '../components/properties/PropertyPagination';
import { demoPropertiesList, filterProperties } from '../data/propertiesData';

export function PropertiesPage() {
  const [properties, setProperties] = useState(() => {
    // Combine demo list with any newly created properties stored in localStorage
    const saved = localStorage.getItem('landlordvision_properties');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return [...parsed, ...demoPropertiesList];
      } catch (e) {
        return demoPropertiesList;
      }
    }
    return demoPropertiesList;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter State
  const [filters, setFilters] = useState({
    search: '',
    status: 'Any',
    propertyType: 'All',
    furnishing: 'All',
    minTargetRent: '',
    maxTargetRent: '',
  });

  // Calculate filtered properties
  const filteredData = useMemo(() => {
    return filterProperties(properties, filters);
  }, [properties, filters]);

  // Pagination calculation
  const totalRecords = filteredData.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const currentRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Handlers
  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: 'Any',
      propertyType: 'All',
      furnishing: 'All',
      minTargetRent: '',
      maxTargetRent: '',
    });
    setCurrentPage(1);
  };

  const handleSearchSubmit = () => {
    setCurrentPage(1);
  };

  const handleExportClick = () => {
    alert(`Exporting ${totalRecords} property records to Excel file...`);
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-12 text-left">
        {/* 1. PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Properties
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Manage your real estate portfolio, residential units, shops, and commercial buildings.
            </p>
          </div>
        </div>

        {/* 2. FILTER AREA */}
        <PropertyFilters
          filters={filters}
          setFilters={setFilters}
          onSearch={handleSearchSubmit}
          onClear={handleClearFilters}
        />

        {/* 3. ACTION BUTTONS ROW */}
        <div className="flex flex-wrap items-center justify-end gap-2.5">
          <Link
            to="/properties/create"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-extrabold text-white bg-[#00a36f] hover:bg-[#008f61] active:bg-[#007a53] transition-all cursor-pointer shadow-xs focus:ring-2 focus:ring-[#00a36f]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Property</span>
          </Link>

          <button
            type="button"
            onClick={handleExportClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-extrabold text-white bg-[#00a36f] hover:bg-[#008f61] active:bg-[#007a53] transition-all cursor-pointer shadow-xs focus:ring-2 focus:ring-[#00a36f]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export to Excel</span>
          </button>
        </div>

        {/* 4. PROPERTY TABLE & PAGINATION CONTAINER */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          {filteredData.length > 0 ? (
            <>
              <PropertyTable properties={currentRecords} />

              {/* PAGINATION */}
              <PropertyPagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalRecords={totalRecords}
                onPageChange={(page) => setCurrentPage(page)}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
              />
            </>
          ) : (
            /* EMPTY STATE */
            <div className="py-12 px-4 text-center space-y-3 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
              <Building className="w-10 h-10 text-slate-400 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-extrabold text-slate-800">No properties found</p>
                <p className="text-xs font-medium text-slate-500">
                  Add your first property to get started.
                </p>
              </div>
              <Link
                to="/properties/create"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#00a36f] hover:bg-[#008f61] transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Property</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

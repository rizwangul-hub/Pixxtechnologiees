import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Plus, Download, Search, Eye, Edit, Trash2, Building2, MapPin, UserCheck } from 'lucide-react';
import {
  getSavedProperties,
  deleteProperty,
  exportPropertiesToFile,
} from '../data/propertiesData';
import { archivePropertyAPI, fetchPropertiesFromAPI } from '../services/apiData';
import { downloadFileAPI } from '../services/api';

export function PropertiesPage() {
  const navigate = useNavigate();

  const [properties, setProperties] = useState(() => getSavedProperties());
  const [searchTerm, setSearchTerm] = useState('');

  const loadProperties = async () => {
    try {
      const apiProps = await fetchPropertiesFromAPI();
      if (apiProps && Array.isArray(apiProps)) {
        setProperties(apiProps);
      }
    } catch (e) {
      console.warn('[Properties Page API Notice]', e.message);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const filteredProperties = useMemo(() => {
    if (!searchTerm || !searchTerm.trim()) return properties;
    const q = searchTerm.toLowerCase().trim();
    return properties.filter((p) => {
      const name = p.name || p.propertyName || '';
      const address = p.address || '';
      const city = p.city || '';
      const area = p.area || '';
      const type = p.type || '';
      const landlord = p.landlordId?.fullName || p.landlordName || '';
      return (
        name.toLowerCase().includes(q) ||
        address.toLowerCase().includes(q) ||
        city.toLowerCase().includes(q) ||
        area.toLowerCase().includes(q) ||
        type.toLowerCase().includes(q) ||
        landlord.toLowerCase().includes(q)
      );
    });
  }, [properties, searchTerm]);

  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' or 'flat'

  const groupedByLandlord = useMemo(() => {
    const groupsMap = {};

    filteredProperties.forEach((p) => {
      const landlordObj = p.landlordId || {};
      const landlordName = landlordObj.fullName || p.landlordName || 'General Portfolio (Unassigned)';
      const landlordId = landlordObj._id || landlordObj.id || 'unassigned';
      const landlordLogoUrl = landlordObj.logo?.url || landlordObj.logoUrl || p.landlordLogo || '';

      if (!groupsMap[landlordId]) {
        groupsMap[landlordId] = {
          landlordId,
          landlordName,
          landlordLogoUrl,
          landlordObj,
          properties: [],
        };
      }
      groupsMap[landlordId].properties.push(p);
    });

    return Object.values(groupsMap);
  }, [filteredProperties]);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? All associated units will also be deleted.`)) {
      try {
        await archivePropertyAPI(id);
        setProperties((current) => current.filter((property) => property.id !== id && property._id !== id));
        deleteProperty(id);
      } catch (error) {
        window.alert(`Unable to delete property: ${error.message}`);
      }
    }
  };

  const handleExport = async (format) => {
    try {
      const endpoint = format === 'csv' ? '/export/properties' : '/export/properties/excel';
      const ext = format === 'csv' ? 'csv' : 'xlsx';
      await downloadFileAPI(endpoint, `Properties_Export_${Date.now()}.${ext}`);
    } catch (e) {
      exportPropertiesToFile(filteredProperties, format);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 text-left pb-12">
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Properties</span>
              <Building2 className="w-6 h-6 text-[#04A26F]" />
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Manage your commercial, residential, and mixed property assets grouped by Landlord.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              to="/properties/create"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white bg-[#04A26F] hover:bg-[#038b5e] active:bg-[#02754e] rounded-lg transition-all cursor-pointer shadow-xs focus:ring-2 focus:ring-[#04A26F]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Property</span>
            </Link>

            <button
              type="button"
              onClick={() => handleExport('xlsx')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-extrabold text-white bg-[#04A26F] hover:bg-[#038b5e] rounded-lg transition-all cursor-pointer shadow-xs"
              title="Export to Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>

            <button
              type="button"
              onClick={() => handleExport('csv')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-extrabold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-all cursor-pointer shadow-2xs"
              title="Export to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* SEARCH & VIEW TOGGLE BAR */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by property name, landlord, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20 focus:border-[#04A26F]"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-bold shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'grouped'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80 font-extrabold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Grouped by Landlord
            </button>
            <button
              type="button"
              onClick={() => setViewMode('flat')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'flat'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80 font-extrabold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All Properties List
            </button>
          </div>
        </div>

        {/* PROPERTIES DISPLAY SECTION */}
        {viewMode === 'grouped' ? (
          /* GROUPED BY LANDLORD VIEW */
          <div className="space-y-6">
            {groupedByLandlord.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 font-medium">
                No properties found matching your search.
              </div>
            ) : (
              groupedByLandlord.map((group) => (
                <div key={group.landlordId} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  {/* LANDLORD HEADER BANNER */}
                  <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {group.landlordLogoUrl ? (
                        <img
                          src={group.landlordLogoUrl}
                          alt={group.landlordName}
                          className="w-8 h-8 rounded-lg object-contain bg-white p-0.5 border border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-[#04A26F] text-white flex items-center justify-center font-bold shrink-0">
                          <UserCheck className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-white">
                            {group.landlordName}
                          </span>
                          {group.landlordId !== 'unassigned' && (
                            <Link
                              to={`/landlords/${group.landlordId}`}
                              className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 hover:underline"
                            >
                              View Landlord Profile &rarr;
                            </Link>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">
                          Landlord Portfolio
                        </p>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-slate-800 text-emerald-400 border border-slate-700">
                      {group.properties.length} {group.properties.length === 1 ? 'Property' : 'Properties'}
                    </span>
                  </div>

                  {/* PROPERTIES TABLE FOR THIS LANDLORD */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700 border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[11px]">
                          <th className="py-3 px-4">Property Name</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Address</th>
                          <th className="py-3 px-4">Monthly Rent</th>
                          <th className="py-3 px-4">Tenant</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {group.properties.map((p) => {
                          const pid = p._id || p.id;
                          const propName = p.name || p.propertyName;
                          const monthlyRent = p.monthlyRent || p.price || 0;
                          const tenantName = p.activeTenancy?.customerId?.fullName
                            || p.activeTenancy?.tenantName
                            || p.customerName
                            || (p.status === 'Occupied' ? 'Occupied' : '—');
                          const displayStatus = p.assetStatus || (p.status === 'Active' ? 'Available' : p.status);
                          const statusColor = displayStatus === 'Occupied'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : displayStatus === 'Available'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : displayStatus === 'Maintenance'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-50 text-slate-800 border-slate-200';

                          const agent = (p.agentId && typeof p.agentId === 'object') ? p.agentId : p.agent;
                          const agentName = agent?.fullName || agent?.name || agent?.agencyName || p.agentName;

                          return (
                            <tr key={pid} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3.5 px-4 font-extrabold text-slate-900">
                                <Link to={`/properties/${pid}`} className="hover:text-[#04A26F] transition-colors">
                                  {propName}
                                </Link>
                              </td>
                              <td className="py-3.5 px-4 font-semibold text-slate-600">
                                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px]">
                                  {p.assetType || p.propertyType || p.type}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-medium text-slate-600">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>{[p.address, p.city].filter(Boolean).join(', ') || '-'}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-bold text-slate-900">
                                £{monthlyRent.toLocaleString()}/mo
                              </td>
                              <td className="py-3.5 px-4 font-medium text-slate-600 text-xs">
                                <div>{tenantName}</div>
                                {agentName && (
                                  <div className="text-[10px] text-purple-700 font-bold flex items-center gap-1 mt-0.5">
                                    <span className="px-1.5 py-0.5 rounded bg-purple-50 border border-purple-200/60">
                                      Agent: {agentName}
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${statusColor}`}>
                                  {displayStatus}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/properties/${pid}`)}
                                    className="px-2.5 py-1 text-xs font-bold text-[#04A26F] bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1 border border-emerald-200/80"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>View</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/properties/${pid}/edit`)}
                                    className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                    title="Edit Property"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(pid, propName)}
                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                    title="Delete Property"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* ALL PROPERTIES FLAT VIEW */
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Property Name</th>
                    <th className="py-3 px-4">Landlord</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Address</th>
                    <th className="py-3 px-4">Monthly Rent</th>
                    <th className="py-3 px-4">Tenant</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProperties.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                        No properties found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredProperties.map((p) => {
                      const pid = p._id || p.id;
                      const propName = p.name || p.propertyName;
                      const landlordObj = p.landlordId || {};
                      const landlordName = landlordObj.fullName || p.landlordName || '—';
                      const monthlyRent = p.monthlyRent || p.price || 0;
                      const tenantName = p.activeTenancy?.customerId?.fullName
                        || p.activeTenancy?.tenantName
                        || p.customerName
                        || (p.status === 'Occupied' ? 'Occupied' : '—');
                      const displayStatus = p.assetStatus || (p.status === 'Active' ? 'Available' : p.status);
                      const statusColor = displayStatus === 'Occupied'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : displayStatus === 'Available'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : displayStatus === 'Maintenance'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-slate-50 text-slate-800 border-slate-200';

                      const agent = (p.agentId && typeof p.agentId === 'object') ? p.agentId : p.agent;
                      const agentName = agent?.fullName || agent?.name || agent?.agencyName || p.agentName;

                      return (
                        <tr key={pid} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-extrabold text-slate-900">
                            <Link to={`/properties/${pid}`} className="hover:text-[#04A26F] transition-colors">
                              {propName}
                            </Link>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[#04A26F]">
                            {landlordObj._id ? (
                              <Link to={`/landlords/${landlordObj._id}`} className="hover:underline flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5 text-[#04A26F] shrink-0" />
                                <span>{landlordName}</span>
                              </Link>
                            ) : (
                              <span>{landlordName}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-600">
                            <span className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px]">
                              {p.assetType || p.propertyType || p.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-600">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{[p.address, p.city].filter(Boolean).join(', ') || '-'}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            £{monthlyRent.toLocaleString()}/mo
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-600 text-xs">
                            <div>{tenantName}</div>
                            {agentName && (
                              <div className="text-[10px] text-purple-700 font-bold flex items-center gap-1 mt-0.5">
                                <span className="px-1.5 py-0.5 rounded bg-purple-50 border border-purple-200/60">
                                  Agent: {agentName}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${statusColor}`}>
                              {displayStatus}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => navigate(`/properties/${pid}`)}
                                className="px-2.5 py-1 text-xs font-bold text-[#04A26F] bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1 border border-emerald-200/80"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => navigate(`/properties/${pid}/edit`)}
                                className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                title="Edit Property"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(pid, propName)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                title="Delete Property"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
        )}
      </div>
    </AppLayout>
  );
}

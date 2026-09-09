import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Download,
  Building,
  Building2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Mail,
  UserCheck,
} from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import {
  getSavedLandlords,
  deleteLandlord as deleteLocalLandlord,
  exportLandlordsToFile,
} from '../data/landlordsData';
import { fetchLandlordsFromAPI, deleteLandlordAPI, getExportDownloadURL } from '../services/apiData';
import { downloadFileAPI } from '../services/api';

export default function LandlordsPage() {
  const navigate = useNavigate();
  const [landlords, setLandlords] = useState(() => getSavedLandlords());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(() => {
    const saved = getSavedLandlords();
    return !saved || saved.length === 0;
  });
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    setErrorMsg('');
    try {
      const apiList = await fetchLandlordsFromAPI();
      if (apiList && Array.isArray(apiList)) {
        setLandlords(apiList);
        setLoading(false);
        return;
      }
    } catch (e) {
      console.warn('[Landlords Page API Notice]', e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete landlord "${name}"?`)) {
      setErrorMsg('');
      try {
        const res = await deleteLandlordAPI(id);
        if (res && res.success === false) {
          setErrorMsg(res.message || 'Failed to delete landlord.');
          return;
        }
        await loadData();
      } catch (err) {
        if (err.status === 400 || (err.data && err.data.message)) {
          setErrorMsg(err.data.message || err.message);
        } else {
          // Fallback to local delete
          deleteLocalLandlord(id);
          await loadData();
        }
      }
    }
  };

  const filteredLandlords = landlords.filter((l) => {
    const q = search.toLowerCase().trim();
    const name = l.fullName || l.name || '';
    const email = l.email || '';
    const phone = l.phone || l.contactNumber || '';
    const address = l.address || '';
    const country = l.country || '';

    return (
      !q ||
      name.toLowerCase().includes(q) ||
      email.toLowerCase().includes(q) ||
      phone.toLowerCase().includes(q) ||
      address.toLowerCase().includes(q) ||
      country.toLowerCase().includes(q)
    );
  });

  // Calculate metrics
  const totalLandlords = landlords.length;
  let totalPropertiesOwned = 0;
  landlords.forEach((l) => {
    totalPropertiesOwned += l.propertiesCount || 0;
  });

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto text-left">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Landlords</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage property owners, owner profiles, contact details, logos, and assigned property portfolios.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={async () => {
                try {
                  const query = search ? `?search=${encodeURIComponent(search)}` : '';
                  await downloadFileAPI(`/export/landlords${query}`, `Landlords_Export_${Date.now()}.csv`);
                } catch (e) {
                  exportLandlordsToFile(filteredLandlords, 'csv');
                }
              }}
              className="px-3 py-2 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-1.5 shadow-sm cursor-pointer"
              title="Export to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  const query = search ? `?search=${encodeURIComponent(search)}` : '';
                  await downloadFileAPI(`/export/landlords/excel${query}`, `Landlords_Export_${Date.now()}.xlsx`);
                } catch (e) {
                  exportLandlordsToFile(filteredLandlords, 'xlsx');
                }
              }}
              className="px-3 py-2 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-1.5 shadow-sm cursor-pointer"
              title="Export to Excel"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel</span>
            </button>
            <Link
              to="/landlords/create"
              className="px-4 py-2.5 bg-[#04A26F] text-white text-sm font-semibold rounded-lg hover:bg-[#03885c] transition-colors flex items-center space-x-2 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add Landlord</span>
            </Link>
          </div>
        </div>

        {/* Error Notification Alert */}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 text-[#04A26F] flex items-center justify-center font-bold text-xl">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Landlords</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{totalLandlords}</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Properties Owned</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{totalPropertiesOwned}</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xl">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Regions</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">
                {new Set(landlords.map((l) => l.country || 'United Kingdom')).size} Countries
              </h3>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, phone, email, country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#04A26F]"
            />
          </div>

          <div className="text-xs text-slate-500 font-semibold">
            Showing <span className="font-extrabold text-slate-900">{filteredLandlords.length}</span> landlords
          </div>
        </div>

        {/* Landlords Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Logo</th>
                  <th className="py-3.5 px-4">Landlord Name</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4 text-center">Properties Owned</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {filteredLandlords.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-500">
                      No landlords found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLandlords.map((l) => {
                    const lid = l._id || l.id;
                    const logoUrl = l.logo?.url || l.logoUrl;
                    const name = l.fullName || l.name;

                    return (
                      <tr key={lid} className="hover:bg-gray-50 transition-colors">
                        {/* Logo */}
                        <td className="py-3.5 px-4">
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt={name}
                              crossOrigin="anonymous"
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-2xs"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#04A26F] font-black text-sm flex items-center justify-center border border-emerald-100">
                              {name ? name[0].toUpperCase() : 'L'}
                            </div>
                          )}
                        </td>

                        {/* Name */}
                        <td className="py-3.5 px-4 font-semibold text-gray-900">
                          <Link
                            to={`/landlords/${lid}`}
                            className="text-[#04A26F] hover:underline font-bold text-sm"
                          >
                            {name}
                          </Link>
                          {l.notes && (
                            <div className="text-[11px] text-gray-400 truncate max-w-xs">{l.notes}</div>
                          )}
                        </td>

                        {/* Contact Info */}
                        <td className="py-3.5 px-4 text-gray-700">
                          <div className="flex items-center gap-1.5 text-xs font-semibold">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{l.phone || l.contactNumber || '—'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{l.email || '—'}</span>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-3.5 px-4 text-gray-600 text-xs">
                          <div className="font-semibold text-gray-800">{l.country || 'United Kingdom'}</div>
                          <div className="text-[11px] text-gray-500">{l.region || l.city || '—'}</div>
                        </td>

                        {/* Properties Count */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-800 border border-blue-200 inline-flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-blue-600" />
                            <span>{l.propertiesCount || 0}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              to={`/landlords/${lid}`}
                              title="View Landlord Details"
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>

                            <Link
                              to={`/landlords/${lid}/edit`}
                              title="Edit Landlord"
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleDelete(lid, name)}
                              title="Delete Landlord"
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
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
      </div>
    </AppLayout>
  );
}

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  Globe,
  FileText,
  Building2,
  Plus,
  Edit,
  CheckCircle2,
  Home,
  Layers,
  ArrowRight,
  Landmark,
} from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { EntityReportDownloadBar } from '../components/common/EntityReportDownloadBar';
import { getSavedLandlords } from '../data/landlordsData';
import { getSavedProperties } from '../data/propertiesData';
import { fetchLandlordByIdAPI, fetchLandlordPropertiesAPI, fetchMortgagesAPI } from '../services/apiData';

export default function LandlordDetailPage() {
  const { landlordId } = useParams();
  const navigate = useNavigate();

  const [landlord, setLandlord] = useState(() => {
    const localLandlords = getSavedLandlords();
    return localLandlords.find((l) => l.id === landlordId || l._id === landlordId) || null;
  });

  const [properties, setProperties] = useState(() => {
    const allProps = getSavedProperties();
    return allProps.filter((p) => p.landlordId === landlordId || p.landlordId?._id === landlordId);
  });

  const [loading, setLoading] = useState(() => !landlord);
  const [landlordMortgages, setLandlordMortgages] = useState([]);

  const loadData = async () => {
    try {
      const [apiLandlord, apiProperties, apiMortgages] = await Promise.all([
        fetchLandlordByIdAPI(landlordId),
        fetchLandlordPropertiesAPI(landlordId),
        fetchMortgagesAPI({ landlordId }),
      ]);

      if (apiLandlord) {
        setLandlord(apiLandlord);
        setProperties(apiProperties || []);
        setLandlordMortgages(apiMortgages || []);
        setLoading(false);
        return;
      }
    } catch (e) {
      console.warn('[Landlord Detail API Notice]', e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [landlordId]);

  if (!landlord && !loading) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-gray-500">
          <p className="text-lg font-bold">Landlord profile not found.</p>
          <Link to="/landlords" className="mt-4 text-[#04A26F] font-semibold hover:underline inline-block">
            &larr; Back to Landlords List
          </Link>
        </div>
      </AppLayout>
    );
  }

  const name = landlord?.fullName || landlord?.name || 'Landlord Profile';
  const logoUrl = landlord?.logo?.url || landlord?.logoUrl;
  const targetId = (landlord?._id || landlord?.id || landlordId)?.toString();

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6 text-left">
        {/* Top Navigation & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Link
              to="/landlords"
              className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
              <p className="text-xs text-gray-500">
                {landlord?.country ? `${landlord.country} • ` : ''}Landlord Profile Overview
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to={`/properties/create?landlordId=${landlordId}`}
              className="px-4 py-2 bg-[#04A26F] text-white text-sm font-semibold rounded-lg hover:bg-[#03885c] transition-colors flex items-center space-x-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Property for Landlord</span>
            </Link>
            <Link
              to={`/landlords/${landlordId}/edit`}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-1.5"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Profile</span>
            </Link>
          </div>
        </div>

        {/* Date Range Report & Statement Download Bar */}
        <EntityReportDownloadBar entityType="landlord" entityId={targetId} entityName={name} />

        {/* Landlord Profile Details Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6">
          {/* Logo preview */}
          <div className="shrink-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={name}
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                className="w-28 h-28 rounded-2xl object-cover border-2 border-emerald-200 shadow-md"
              />
            ) : (
              <div className="w-28 h-28 rounded-2xl bg-emerald-50 text-[#04A26F] font-black text-3xl flex items-center justify-center border-2 border-emerald-100 shadow-xs">
                {name[0]?.toUpperCase()}
              </div>
            )}
          </div>

          {/* Detailed Info */}
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{name}</h2>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md inline-block mt-1">
                  Registered Landlord
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Properties Owned</span>
                <span className="text-2xl font-black text-slate-900">{properties.length}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs text-gray-700">
              <div className="flex items-center space-x-2">
                <Phone className="text-gray-400 w-4 h-4 shrink-0" />
                <span className="font-semibold">{landlord?.phone || landlord?.contactNumber || 'No phone provided'}</span>
              </div>

              <div className="flex items-center space-x-2">
                <Mail className="text-gray-400 w-4 h-4 shrink-0" />
                <span className="font-semibold">{landlord?.email || 'No email provided'}</span>
              </div>

              <div className="flex items-center space-x-2">
                <Globe className="text-gray-400 w-4 h-4 shrink-0" />
                <span className="font-semibold">{landlord?.country || 'United Kingdom'} {landlord?.region ? `(${landlord.region})` : ''}</span>
              </div>

              <div className="flex items-start space-x-2 col-span-1 sm:col-span-2">
                <MapPin className="text-gray-400 w-4 h-4 mt-0.5 shrink-0" />
                <span>{landlord?.address || 'No office address recorded'}</span>
              </div>
            </div>

            {landlord?.notes && (
              <div className="pt-2 text-xs text-gray-500 italic bg-gray-50 p-3 rounded-lg border border-gray-100">
                "{landlord.notes}"
              </div>
            )}
          </div>
        </div>

        {/* PROPERTIES OWNED SECTION */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#04A26F]" />
                <span>Properties Owned</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                All real estate properties belonging to {name}.
              </p>
            </div>
            <Link
              to={`/properties/create?landlordId=${landlordId}`}
              className="text-xs font-bold text-[#04A26F] hover:underline flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Property</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.length === 0 ? (
              <div className="col-span-full py-10 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 space-y-3">
                <Building2 className="w-10 h-10 text-gray-400 mx-auto" />
                <p className="text-sm font-semibold text-gray-600">No properties currently assigned to this landlord.</p>
                <Link
                  to={`/properties/create?landlordId=${landlordId}`}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#04A26F] text-white text-xs font-bold rounded-lg hover:bg-[#03885c] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Assign New Property</span>
                </Link>
              </div>
            ) : (
              properties.map((prop) => {
                const pid = prop._id || prop.id;
                const propName = prop.propertyName || prop.name;
                const rent = prop.monthlyRent || prop.price || 0;
                const isOccupied = Boolean(
                  prop.status === 'Occupied' ||
                  prop.assetStatus === 'Occupied' ||
                  prop.customerName ||
                  prop.activeTenancy ||
                  prop.tenantName
                );
                const status = prop.isArchived
                  ? 'Archived'
                  : (isOccupied
                    ? 'Occupied'
                    : (prop.assetStatus === 'Occupied' ? 'Occupied' : (prop.assetStatus || (prop.status === 'Active' ? 'Available' : prop.status) || 'Available')));
                const statusColor = status === 'Occupied'
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : status === 'Available'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : status === 'Maintenance'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-slate-50 text-slate-800 border-slate-200';

                return (
                  <div
                    key={pid}
                    className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold text-gray-900 text-base">{propName}</h3>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                          {prop.assetType || prop.propertyType || prop.type}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{[prop.address, prop.city].filter(Boolean).join(', ') || 'No address'}</span>
                      </p>
                    </div>

                    {/* Rent & Status Info */}
                    <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2.5 rounded-lg text-center text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Monthly Rent</span>
                        <span className="font-extrabold text-gray-900">£{Number(rent).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Status</span>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-extrabold border ${statusColor} mt-0.5`}>
                          {status}
                        </span>
                      </div>
                    </div>

                    <Link
                      to={`/properties/${pid}`}
                      className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-[#04A26F] text-xs font-bold rounded-lg transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <span>View Property Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* LANDLORD PROPERTY MORTGAGES & FINANCING SECTION */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#04A26F] flex items-center justify-center font-bold">
                <Landmark className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Property Financing & Mortgages</h2>
                <p className="text-xs text-gray-500">Individual & Collective mortgage facilities registered for this landlord</p>
              </div>
            </div>

            <Link
              to={`/mortgages?landlordId=${landlordId}`}
              className="text-xs font-bold text-[#04A26F] hover:underline flex items-center gap-1"
            >
              Mortgage Manager <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {landlordMortgages.length === 0 ? (
            <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-xs font-semibold">No mortgages currently recorded for this landlord's properties.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Landlord Mortgage KPI summary cards */}
              {(() => {
                const activeM = landlordMortgages.filter((m) => m.status === 'Active');
                const indCount = activeM.filter((m) => (m.mortgageType || 'Individual Property') === 'Individual Property').length;
                const colCount = activeM.filter((m) => m.mortgageType === 'Collective / Group').length;
                const totalDebt = activeM.reduce((sum, m) => sum + (Number(m.currentOutstandingBalance) || 0), 0);
                const totalMonthly = activeM.reduce((sum, m) => sum + (Number(m.monthlyPayment) || 0), 0);

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Mortgage Facilities
                      </span>
                      <p className="text-lg font-black text-gray-900 mt-0.5">
                        {activeM.length} Active {activeM.length === 1 ? 'Facility' : 'Facilities'}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {indCount} Individual • {colCount} Collective
                      </p>
                    </div>

                    <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Total Outstanding Debt
                      </span>
                      <p className="text-lg font-black text-amber-900 mt-0.5">
                        £{totalDebt.toLocaleString()}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Calculated strictly once per facility
                      </p>
                    </div>

                    <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Total Monthly Outflow
                      </span>
                      <p className="text-lg font-black text-emerald-800 mt-0.5">
                        £{totalMonthly.toLocaleString()}/mo
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Combined active mortgage payments
                      </p>
                    </div>
                  </div>
                );
              })()}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 text-gray-600 font-extrabold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Facility / Property</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Secured Properties</th>
                      <th className="py-2.5 px-3">Lender / Bank</th>
                      <th className="py-2.5 px-3">Facility Loan</th>
                      <th className="py-2.5 px-3">Outstanding</th>
                      <th className="py-2.5 px-3">Monthly Payment</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                    {landlordMortgages.map((m) => {
                      const isCollective = m.mortgageType === 'Collective / Group' || (m.properties && m.properties.length > 1);
                      const securedProps = (m.properties || [])
                        .filter((p) => p.status !== 'Released')
                        .map((p) => p.propertyId?.name || 'Property');
                      const primaryName = m.propertyId?.name || securedProps[0] || 'Unassigned';

                      return (
                        <tr key={m._id || m.id} className="hover:bg-gray-50">
                          <td className="py-3 px-3 font-bold text-gray-900">
                            <div>
                              <span>{isCollective ? (m.mortgageReference || 'Collective Facility') : primaryName}</span>
                              {m.mortgageAccountNumber && (
                                <span className="block font-mono font-normal text-[10px] text-gray-400">
                                  Acc: {m.mortgageAccountNumber}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isCollective
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              }`}
                            >
                              {isCollective ? 'Collective' : 'Individual'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-gray-800">
                            {isCollective ? (
                              <div>
                                <span className="font-extrabold text-purple-900">{securedProps.length} Properties</span>
                                <p className="text-[10px] text-gray-500 max-w-xs truncate" title={securedProps.join(', ')}>
                                  {securedProps.join(', ') || 'None'}
                                </p>
                              </div>
                            ) : (
                              <span>{primaryName}</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-gray-800">{m.lenderName}</td>
                          <td className="py-3 px-3 font-mono font-bold text-gray-800">
                            £{(m.originalLoanAmount || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 font-mono font-black text-amber-900">
                            £{(m.currentOutstandingBalance || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-gray-900">
                            £{(m.monthlyPayment || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                m.status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {m.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <Link
                              to={`/mortgages/${m._id || m.id}`}
                              className="text-xs font-bold text-[#04A26F] hover:underline"
                            >
                              View Details
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

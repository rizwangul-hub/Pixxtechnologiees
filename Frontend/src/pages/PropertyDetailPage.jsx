import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Building2,
  MapPin,
  CheckCircle2,
  UserCheck,
  AlertTriangle,
  Landmark,
  User,
  Users,
  Calendar,
  DollarSign,
  FileText,
  Mail,
  Phone,
  Globe,
  Tag,
  Maximize2,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import {
  fetchPropertyByIdAPI,
  fetchTenanciesAPI,
  fetchMortgagesAPI,
  deletePropertyAPI,
  endTenancyAPI,
} from '../services/apiData';
import { getSavedProperties, deleteProperty } from '../data/propertiesData';
import { EntityReportDownloadBar } from '../components/common/EntityReportDownloadBar';
import { AssignPropertyTenantModal } from '../components/properties/AssignPropertyTenantModal';
import { formatCurrency } from '../utils/currencyFormatter';

export function PropertyDetailPage() {
  const { propertyId } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [tenancy, setTenancy] = useState(null);
  const [mortgage, setMortgage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [endingTenancy, setEndingTenancy] = useState(false);

  const loadPropertyData = async () => {
    try {
      const [apiProperty, allTenancies, mortgages] = await Promise.all([
        fetchPropertyByIdAPI(propertyId),
        fetchTenanciesAPI({ propertyId }),
        fetchMortgagesAPI({ propertyId }),
      ]);

      if (apiProperty) {
        setProperty(apiProperty);
        if (apiProperty.activeTenancy) {
          setTenancy(apiProperty.activeTenancy);
        } else if (Array.isArray(allTenancies) && allTenancies.length > 0) {
          const active = allTenancies.find((t) => t.status === 'Active') || allTenancies[0];
          setTenancy(active);
        }
      } else {
        // Fallback to local properties
        const localProps = getSavedProperties();
        const found = localProps.find((p) => p.id === propertyId || p._id === propertyId);
        if (found) {
          setProperty(found);
        }
      }

      if (Array.isArray(mortgages) && mortgages.length > 0) {
        setMortgage(mortgages[0]);
      }
    } catch (err) {
      console.warn('[Property Detail Load Notice]', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPropertyData();
  }, [propertyId]);

  if (loading) {
    return (
      <AppLayout>
        <div className="p-12 text-center text-slate-500 font-bold">
          Loading property details...
        </div>
      </AppLayout>
    );
  }

  if (!property) {
    return (
      <AppLayout>
        <div className="p-8 text-center space-y-4">
          <p className="text-slate-500 font-bold text-base">Property not found.</p>
          <Link to="/properties" className="text-[#04A26F] font-extrabold hover:underline inline-block">
            &larr; Back to Properties
          </Link>
        </div>
      </AppLayout>
    );
  }

  const targetPropertyId = (property._id || property.id || propertyId)?.toString();
  const propName = property.name || property.propertyName || 'Property Details';
  const monthlyRent = property.monthlyRent || property.price || 0;
  const isPropertyOccupied = Boolean(
    tenancy ||
    property.status === 'Occupied' ||
    property.assetStatus === 'Occupied' ||
    property.customerName
  );
  const status = property.isArchived
    ? 'Archived'
    : (isPropertyOccupied
      ? 'Occupied'
      : (property.assetStatus === 'Occupied' ? 'Occupied' : (property.assetStatus || (property.status === 'Active' ? 'Available' : property.status) || 'Available')));

  const statusColor = status === 'Occupied'
    ? 'bg-blue-50 text-blue-800 border-blue-200'
    : status === 'Available'
    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
    : status === 'Maintenance'
    ? 'bg-amber-50 text-amber-800 border-amber-200'
    : 'bg-slate-50 text-slate-800 border-slate-200';

  const landlord = property.landlordId && typeof property.landlordId === 'object' ? property.landlordId : null;
  const landlordName = landlord?.fullName || landlord?.name || property.landlordName || 'Unassigned';

  const tenant = tenancy?.customerId && typeof tenancy.customerId === 'object' ? tenancy.customerId : property.tenant;
  const tenantName = tenant?.fullName || tenant?.name || tenancy?.tenantName || property.customerName;

  const agent = (tenancy?.agentId && typeof tenancy.agentId === 'object')
    ? tenancy.agentId
    : (property.agentId && typeof property.agentId === 'object')
    ? property.agentId
    : property.agent;
  const agentName = agent?.fullName || agent?.name || agent?.agencyName || property.agentName;
  const agentFee = Number(property.agentFee || tenancy?.companyMonthlyAmount || 0);

  const handleDeleteProperty = async () => {
    if (window.confirm(`Are you sure you want to delete "${propName}"?`)) {
      try {
        await deletePropertyAPI(targetPropertyId);
      } catch (e) {
        console.warn('API delete error, deleting locally:', e.message);
      }
      deleteProperty(targetPropertyId);
      navigate('/properties');
    }
  };

  const handleEndTenancy = async () => {
    if (!tenancy?._id) return;
    if (window.confirm(`Are you sure you want to end the tenancy for "${tenantName}"? The property will become Available.`)) {
      setEndingTenancy(true);
      try {
        await endTenancyAPI(tenancy._id);
        setTenancy(null);
        setProperty((prev) => ({ ...prev, status: 'Available', customerName: null }));
      } catch (e) {
        alert('Failed to end tenancy: ' + e.message);
      } finally {
        setEndingTenancy(false);
      }
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 text-left pb-12 max-w-7xl mx-auto">
        {/* BREADCRUMB */}
        <div className="flex items-center gap-3">
          <Link
            to="/properties"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-[#04A26F] shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Properties</span>
          </Link>
          <span className="text-xs text-slate-400">/</span>
          <span className="text-xs font-bold text-slate-900">{propName}</span>
        </div>

        {/* Date Range Report & Statement Download Bar */}
        <EntityReportDownloadBar entityType="property" entityId={targetPropertyId} entityName={propName} />

        {/* MAIN PROPERTY HEADER CARD */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50 text-[#04A26F] shrink-0 shadow-2xs">
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {propName}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-xs font-extrabold text-slate-700">
                    {property.assetType || property.propertyType || property.type || 'Shop'}
                  </span>
                  <span className={`px-3 py-0.5 rounded-full text-xs font-black border ${statusColor}`}>
                    {status}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-1.5 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{[property.address, property.city, property.county, property.postcode, property.country || 'United Kingdom'].filter(Boolean).join(', ') || 'Address not specified'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {status !== 'Occupied' ? (
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white bg-[#04A26F] hover:bg-[#038b5e] rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <UserCheck className="w-4 h-4 stroke-[2.5]" />
                  <span>Assign Tenant</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={endingTenancy}
                  onClick={handleEndTenancy}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                >
                  <span>{endingTenancy ? 'Ending...' : 'End Tenancy'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate(`/properties/${targetPropertyId}/edit`)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteProperty}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Delete Property"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* KEY FINANCIAL & PHYSICAL ATTRIBUTES */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monthly Rent</span>
              <div className="text-2xl font-black text-[#04A26F]">
                £{Number(monthlyRent).toLocaleString()}
                <span className="text-xs font-semibold text-slate-500 block">/ month</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Floor</span>
              <div className="text-xl font-black text-slate-900">
                {property.floor || 'Ground'}
              </div>
              <span className="text-[10px] font-semibold text-slate-400 block">Level</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Floor Area</span>
              <div className="text-xl font-black text-slate-900">
                {property.size ? `${property.size} ${property.sizeUnit || 'sq ft'}` : 'Standard'}
              </div>
              <span className="text-[10px] font-semibold text-slate-400 block">Dimensions</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Status</span>
              <div className="pt-0.5">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-black border ${statusColor}`}>
                  {status}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 block">Occupancy</span>
            </div>
          </div>

          {property.description && (
            <div className="text-xs text-slate-600 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Description</span>
              <p className="font-medium leading-relaxed">{property.description}</p>
            </div>
          )}
        </div>

        {/* 2-COLUMN GRID: LANDLORD & TENANT DETAILS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LANDLORD INFORMATION CARD */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#04A26F] flex items-center justify-center font-bold">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Property Landlord</h2>
                  <p className="text-[11px] text-slate-500 font-medium">Owner of this property asset</p>
                </div>
              </div>
              {landlord?._id && (
                <Link
                  to={`/landlords/${landlord._id}`}
                  className="text-xs font-bold text-[#04A26F] hover:underline"
                >
                  View Profile &rarr;
                </Link>
              )}
            </div>

            <div className="flex items-start gap-3 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/80">
              {landlord?.logo?.url ? (
                <img
                  src={landlord.logo.url}
                  alt={landlordName}
                  className="w-12 h-12 rounded-xl object-contain bg-white p-1 border border-emerald-200 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-[#04A26F] text-white font-black text-base flex items-center justify-center shrink-0">
                  {landlordName[0]?.toUpperCase()}
                </div>
              )}
              <div className="space-y-1 text-xs">
                <div className="font-extrabold text-slate-900 text-sm">{landlordName}</div>
                <div className="text-slate-600 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{landlord?.email || 'No email recorded'}</span>
                </div>
                <div className="text-slate-600 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{landlord?.phone || 'No phone recorded'}</span>
                </div>
                {landlord?.country && (
                  <div className="text-slate-600 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span>{landlord.country} {landlord.region ? `(${landlord.region})` : ''}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TENANT INFORMATION CARD */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Current Tenant</h2>
                  <p className="text-[11px] text-slate-500 font-medium">Renting party & active tenancy</p>
                </div>
              </div>
              {tenant?._id && (
                <Link
                  to={`/tenants/${tenant._id}`}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  View Tenant &rarr;
                </Link>
              )}
            </div>

            {tenantName ? (
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/80 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-slate-900 text-sm">{tenantName}</div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">
                    Active Tenancy
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{tenant?.email || '—'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{tenant?.phone || '—'}</span>
                  </div>
                </div>

                {tenancy && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-blue-100/80 text-[11px]">
                    <div>
                      <span className="text-slate-400 font-bold block uppercase text-[9px]">Start Date</span>
                      <span className="font-bold text-slate-800">{tenancy.startDate || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block uppercase text-[9px]">Due Day</span>
                      <span className="font-bold text-slate-800">Day {tenancy.paymentDueDay || 1} of month</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block uppercase text-[9px]">Agreed Rent</span>
                      <span className="font-mono font-extrabold text-[#04A26F]">
                        £{Number(tenancy.monthlyRent || monthlyRent).toLocaleString()}/mo
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                <p className="text-xs font-semibold text-slate-500">No tenant currently occupying this property.</p>
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#04A26F] text-white text-xs font-bold rounded-lg hover:bg-[#038b5e] transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assign Tenant</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2-COLUMN GRID: MANAGING AGENT & MORTGAGE/FINANCING */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* MANAGING AGENT CARD */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Managing Agent / Agency</h2>
                  <p className="text-[11px] text-slate-500 font-medium">Assigned managing agent details</p>
                </div>
              </div>
              {agent?._id && (
                <Link
                  to={`/agents/${agent._id}`}
                  className="text-xs font-bold text-purple-600 hover:underline"
                >
                  Agent Profile &rarr;
                </Link>
              )}
            </div>

            {agentName ? (
              <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100/80 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-slate-900 text-sm">{agentName}</div>
                  {agent?.agencyName && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                      {agent.agencyName}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{agent?.email || '—'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{agent?.phone || '—'}</span>
                  </div>
                </div>
                {agentFee > 0 && (
                  <div className="pt-2 border-t border-purple-100/80 text-[11px] flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Monthly Management / Agent Fee:</span>
                    <span className="font-mono font-bold text-slate-900">
                      £{agentFee.toLocaleString()}/mo
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs font-semibold text-slate-500">
                  No managing agent assigned (direct landlord management).
                </p>
              </div>
            )}
          </div>

          {/* MORTGAGE & PROPERTY FINANCING CARD */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#04A26F] flex items-center justify-center font-bold">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Mortgage & Financing</h2>
                  <p className="text-[11px] text-slate-500 font-medium">Bank loans and financing records</p>
                </div>
              </div>

              {mortgage ? (
                <Link
                  to={`/mortgages/${mortgage._id || mortgage.id}`}
                  className="text-xs font-bold text-[#04A26F] hover:underline"
                >
                  View Mortgage &rarr;
                </Link>
              ) : (
                <Link
                  to={`/mortgages?propertyId=${targetPropertyId}`}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  + Add Mortgage
                </Link>
              )}
            </div>

            {mortgage ? (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-sm">{mortgage.lenderName}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {mortgage.status || 'Active'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Original Loan</span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatCurrency(mortgage.originalLoanAmount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Outstanding</span>
                    <span className="font-mono font-black text-amber-900">
                      {formatCurrency(mortgage.currentOutstandingBalance)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Monthly Pay</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(mortgage.monthlyPayment)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Interest Rate</span>
                    <span className="font-bold text-slate-800">{mortgage.interestRate ? `${mortgage.interestRate}%` : '0%'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Next Due Date</span>
                    <span className="font-bold text-slate-800">
                      {mortgage.nextPaymentDate ? new Date(mortgage.nextPaymentDate).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs font-semibold text-slate-500">No mortgage recorded for this property.</p>
              </div>
            )}
          </div>
        </div>

        {/* ASSIGN TENANT MODAL */}
        <AssignPropertyTenantModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          property={property}
          onSuccess={() => {
            loadPropertyData();
            setIsAssignModalOpen(false);
          }}
        />
      </div>
    </AppLayout>
  );
}


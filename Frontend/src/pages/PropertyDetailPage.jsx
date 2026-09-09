import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import {
  ArrowLeft,
  Plus,
  Download,
  Edit,
  Trash2,
  Building2,
  MapPin,
  Search,
  CheckCircle2,
  UserCheck,
  AlertTriangle,
  Layers,
  Landmark,
  CreditCard,
} from 'lucide-react';
import { fetchMortgagesAPI } from '../services/apiData';
import {
  getSavedProperties,
  getUnitsByProperty,
  getPropertyMetrics,
  deleteProperty,
  saveUnit,
  updateUnit,
  deleteUnit,
  exportUnitsToFile,
} from '../data/propertiesData';
import { UnitTable } from '../components/properties/UnitTable';
import { UnitFormModal } from '../components/properties/UnitFormModal';
import { UnitDetailsModal } from '../components/properties/UnitDetailsModal';
import AssignUnitModal from '../components/customers/AssignUnitModal';
import { EntityReportDownloadBar } from '../components/common/EntityReportDownloadBar';
import { formatCurrency } from '../utils/currencyFormatter';

export function PropertyDetailPage() {
  const { propertyId } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [units, setUnits] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isUnitFormOpen, setIsUnitFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);

  const [isUnitDetailsOpen, setIsUnitDetailsOpen] = useState(false);
  const [viewingUnit, setViewingUnit] = useState(null);
  const [propertyMortgage, setPropertyMortgage] = useState(null);

  const [isAssignUnitModalOpen, setIsAssignUnitModalOpen] = useState(false);
  const [assigningUnit, setAssigningUnit] = useState(null);

  useEffect(() => {
    const properties = getSavedProperties();
    const found = properties.find((p) => p.id === propertyId);
    if (found) {
      setProperty(found);
      setUnits(getUnitsByProperty(propertyId));
    }

    // Fetch Mortgage Record for this property
    fetchMortgagesAPI({ propertyId }).then((list) => {
      if (Array.isArray(list) && list.length > 0) {
        setPropertyMortgage(list[0]);
      }
    });
  }, [propertyId]);

  const metrics = useMemo(() => {
    if (!property) return null;
    return getPropertyMetrics(property.id);
  }, [property, units]);

  const filteredUnits = useMemo(() => {
    if (!searchTerm || !searchTerm.trim()) return units;
    const q = searchTerm.toLowerCase().trim();
    return units.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.type && u.type.toLowerCase().includes(q)) ||
        (u.customerName && u.customerName.toLowerCase().includes(q))
    );
  }, [units, searchTerm]);

  if (!property) {
    return (
      <AppLayout>
        <div className="p-8 text-center space-y-4">
          <p className="text-slate-500 font-bold">Property not found.</p>
          <Link to="/properties" className="text-[#04A26F] font-extrabold hover:underline">
            ← Back to Properties
          </Link>
        </div>
      </AppLayout>
    );
  }

  const targetPropertyId = (property._id || property.id || propertyId)?.toString();

  const handleDeleteProperty = () => {
    if (window.confirm(`Are you sure you want to delete "${property.name}"? All associated units will also be deleted.`)) {
      deleteProperty(property.id);
      navigate('/properties');
    }
  };

  const handleSaveUnit = (unitData) => {
    if (editingUnit) {
      updateUnit(unitData.id, unitData);
    } else {
      saveUnit(unitData);
    }
    setUnits(getUnitsByProperty(property.id));
  };

  const handleDeleteUnit = (unitId) => {
    if (window.confirm('Are you sure you want to delete this unit?')) {
      deleteUnit(unitId);
      setUnits(getUnitsByProperty(property.id));
    }
  };

  const handleExportUnits = (format = 'xlsx') => {
    exportUnitsToFile(filteredUnits, property.name, format);
  };

  const handleAssignCustomer = (unit) => {
    setIsUnitDetailsOpen(false);
    setAssigningUnit(unit);
    setIsAssignUnitModalOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6 text-left pb-12">
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
          <span className="text-xs font-bold text-slate-900">{property.name}</span>
        </div>

        {/* Date Range Report & Statement Download Bar */}
        <EntityReportDownloadBar entityType="property" entityId={targetPropertyId} entityName={property.name} />

        {/* HEADER CARD */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-emerald-50 text-[#04A26F] shrink-0">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {property.name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
                    {property.type}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{[property.address, property.city, property.area].filter(Boolean).join(', ')}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => navigate(`/properties/${property.id}/edit`)}
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

          {property.description && (
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {property.description}
            </p>
          )}

          {/* LANDLORD INFORMATION CARD */}
          {(property.landlordId || property.landlordName) && (
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100">
              <div className="flex items-center gap-3">
                {property.landlordId?.logo?.url ? (
                  <img
                    src={property.landlordId.logo.url}
                    alt={property.landlordId.fullName}
                    className="w-10 h-10 rounded-lg object-cover border border-emerald-200 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-[#04A26F] text-white font-black text-sm flex items-center justify-center shrink-0">
                    {(property.landlordId?.fullName || property.landlordName || 'L')[0]}
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                    Property Landlord
                  </span>
                  {property.landlordId?._id ? (
                    <Link
                      to={`/landlords/${property.landlordId._id}`}
                      className="font-extrabold text-slate-900 hover:text-[#04A26F] hover:underline text-sm"
                    >
                      {property.landlordId.fullName || property.landlordName}
                    </Link>
                  ) : (
                    <span className="font-extrabold text-slate-900 text-sm">
                      {property.landlordName || 'Assigned Landlord'}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-slate-600 font-medium text-xs">
                {property.landlordId?.email && (
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Email</span>
                    <span>{property.landlordId.email}</span>
                  </div>
                )}
                {property.landlordId?.phone && (
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Phone</span>
                    <span>{property.landlordId.phone}</span>
                  </div>
                )}
                {property.landlordId?.country && (
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Location</span>
                    <span>{property.landlordId.country}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MORTGAGE & PROPERTY FINANCING CARD */}
          <div className="pt-4 border-t border-slate-100">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-[#04A26F]" />
                  <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                    Mortgage & Financing
                  </span>
                </div>

                {propertyMortgage ? (
                  <Link
                    to={`/mortgages/${propertyMortgage._id || propertyMortgage.id}`}
                    className="px-3 py-1.5 bg-[#04A26F] hover:bg-[#03885c] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
                  >
                    View Mortgage
                  </Link>
                ) : (
                  <Link
                    to={`/mortgages?propertyId=${property.id}`}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    + Add Mortgage
                  </Link>
                )}
              </div>

              {propertyMortgage ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Lender</span>
                    <span className="font-extrabold text-slate-900">{propertyMortgage.lenderName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Original Amount</span>
                    <span className="font-mono font-bold text-slate-800">{formatCurrency(propertyMortgage.originalLoanAmount)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Outstanding Balance</span>
                    <span className="font-mono font-black text-amber-900">{formatCurrency(propertyMortgage.currentOutstandingBalance)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Monthly Payment</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(propertyMortgage.monthlyPayment)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Interest Rate</span>
                    <span className="font-bold text-slate-800">{propertyMortgage.interestRate ? `${propertyMortgage.interestRate}%` : '0%'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Next Payment</span>
                    <span className="font-bold text-slate-800">
                      {propertyMortgage.nextPaymentDate ? new Date(propertyMortgage.nextPaymentDate).toLocaleDateString() : '-'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 font-medium">
                  No mortgage recorded for this property.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* METRICS SUMMARY CARDS GRID */}
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Units</span>
              <div className="text-2xl font-black text-slate-900">{metrics.totalUnits}</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Occupied</span>
              <div className="text-2xl font-black text-blue-700">{metrics.occupiedUnits}</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Available</span>
              <div className="text-2xl font-black text-emerald-700">{metrics.availableUnits}</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Reserved</span>
              <div className="text-2xl font-black text-amber-700">{metrics.reservedUnits}</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1 col-span-2 sm:col-span-1 lg:col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#04A26F]">Expected Rent</span>
              <div className="text-xl font-black text-[#04A26F]">
                {formatCurrency(metrics.expectedMonthlyRent)}
                <span className="text-[10px] text-slate-400 font-semibold block">/ month</span>
              </div>
            </div>
          </div>
        )}

        {/* UNITS SECTION HEADER & SEARCH */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#04A26F]" />
                <span>Units in {property.name}</span>
              </h2>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                Buildings, shops, offices, flats, and rooms registered inside this property.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingUnit(null);
                  setIsUnitFormOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white bg-[#04A26F] hover:bg-[#038b5e] active:bg-[#02754e] rounded-lg transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Unit</span>
              </button>

              <button
                type="button"
                onClick={() => handleExportUnits('xlsx')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-extrabold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Export Units to Excel"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* SEARCH UNITS */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search units by name, type, or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20 focus:border-[#04A26F]"
            />
          </div>

          {/* UNITS TABLE */}
          <UnitTable
            units={filteredUnits}
            onViewUnit={(unit) => {
              setViewingUnit(unit);
              setIsUnitDetailsOpen(true);
            }}
            onEditUnit={(unit) => {
              setEditingUnit(unit);
              setIsUnitFormOpen(true);
            }}
            onDeleteUnit={handleDeleteUnit}
          />
        </div>

        {/* UNIT FORM MODAL */}
        <UnitFormModal
          isOpen={isUnitFormOpen}
          onClose={() => setIsUnitFormOpen(false)}
          onSave={handleSaveUnit}
          propertyId={property.id}
          initialData={editingUnit}
        />

        {/* UNIT DETAILS MODAL */}
        <UnitDetailsModal
          isOpen={isUnitDetailsOpen}
          onClose={() => setIsUnitDetailsOpen(false)}
          unit={viewingUnit}
          propertyName={property.name}
          onAssignCustomer={handleAssignCustomer}
        />

        {/* ASSIGN UNIT MODAL */}
        <AssignUnitModal
          isOpen={isAssignUnitModalOpen}
          onClose={() => {
            setIsAssignUnitModalOpen(false);
            setAssigningUnit(null);
          }}
          customer={null}
          initialPropertyId={property?.id || property?._id}
          initialUnitId={assigningUnit?.id || assigningUnit?._id}
          onSuccess={() => {
            setUnits(getUnitsByProperty(property.id));
            setIsAssignUnitModalOpen(false);
            setAssigningUnit(null);
          }}
        />
      </div>
    </AppLayout>
  );
}

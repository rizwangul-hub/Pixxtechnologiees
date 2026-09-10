import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { ArrowLeft, Save, Building, UserCheck } from 'lucide-react';
import {
  propertyTypes,
  getSavedProperties,
  saveProperty,
  updateProperty,
} from '../data/propertiesData';
import { getSavedLandlords } from '../data/landlordsData';
import { fetchLandlordsFromAPI, createPropertyAPI, updatePropertyAPI, fetchPropertyByIdAPI } from '../services/apiData';

export function CreatePropertyPage() {
  const navigate = useNavigate();
  const { propertyId } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(propertyId);

  const initialLandlordId = searchParams.get('landlordId') || '';

  const [landlords, setLandlords] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Shop',
    landlordId: initialLandlordId,
    address: '',
    city: '',
    area: '',
    county: '',
    postcode: '',
    floor: '',
    size: '',
    price: '',
    monthlyRent: '',
    status: 'Available',
    description: '',
    notes: '',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadLandlords = async () => {
      try {
        const apiLandlords = await fetchLandlordsFromAPI();
        if (apiLandlords && Array.isArray(apiLandlords)) {
          setLandlords(apiLandlords);
          return;
        }
      } catch (e) {
        console.warn('[Create Property API Notice]', e.message);
      }
      setLandlords(getSavedLandlords());
    };
    loadLandlords();

    if (isEditing) {
      const loadExisting = async () => {
        let existing = null;
        try {
          existing = await fetchPropertyByIdAPI(propertyId);
        } catch (e) {}

        if (!existing) {
          const properties = getSavedProperties();
          existing = properties.find((p) => p.id === propertyId || p._id === propertyId);
        }

        if (existing) {
          setFormData({
            name: existing.name || existing.propertyName || '',
            type: existing.assetType || existing.propertyType || existing.type || 'Shop',
            landlordId: existing.landlordId?._id || existing.landlordId || '',
            address: existing.address || '',
            city: existing.city || '',
            area: existing.area || '',
            county: existing.county || '',
            postcode: existing.postcode || '',
            floor: existing.floor || '',
            size: existing.size || '',
            price: existing.monthlyRent || existing.price || '',
            monthlyRent: existing.monthlyRent || existing.price || '',
            status: existing.assetStatus || (existing.status === 'Active' ? 'Available' : existing.status) || 'Available',
            description: existing.description || '',
            notes: existing.notes || '',
          });
        }
      };
      loadExisting();
    }
  }, [propertyId, isEditing]);

  const mapToLegacyType = (t) => {
    switch (t) {
      case 'Shop':
      case 'Office':
        return 'Commercial';
      case 'Flat':
      case 'Apartment':
      case 'House':
      case 'Room':
        return 'Residential';
      case 'Building':
        return 'Mixed';
      default:
        return 'Commercial';
    }
  };

  const mapToLegacyStatus = (s) => {
    switch (s) {
      case 'Available':
      case 'Occupied':
      case 'Reserved':
        return 'Active';
      case 'Maintenance':
        return 'Under Construction';
      case 'Archived':
        return 'Archived';
      default:
        return 'Active';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Please enter a Property Name.');
      return;
    }

    if (!formData.landlordId) {
      setError('Please select a landlord.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const selectedL = landlords.find((l) => (l._id || l.id) === formData.landlordId);
      const payload = {
        name: formData.name.trim(),
        // Send legacy enum value so servers with older schema never reject
        type: mapToLegacyType(formData.type),
        assetType: formData.type,
        propertyType: formData.type,
        status: mapToLegacyStatus(formData.status),
        assetStatus: formData.status || 'Available',
        landlordId: formData.landlordId,
        landlordName: selectedL?.fullName || selectedL?.name || '',
        address: formData.address.trim(),
        city: formData.city.trim(),
        area: formData.area.trim(),
        county: formData.county.trim(),
        postcode: formData.postcode.trim(),
        floor: formData.floor.trim(),
        size: formData.size.trim(),
        price: Number(formData.monthlyRent || formData.price) || 0,
        monthlyRent: Number(formData.monthlyRent || formData.price) || 0,
        description: formData.description.trim(),
        notes: formData.notes.trim(),
      };

      if (isEditing) {
        try {
          await updatePropertyAPI(propertyId, payload);
        } catch (apiErr) {
          console.warn('[API Update Warning]', apiErr.message);
        }
        updateProperty(propertyId, payload);
        setSubmitting(false);
        navigate(`/properties/${propertyId}`);
      } else {
        const resData = await createPropertyAPI(payload);
        if (resData) {
          saveProperty(resData);
        }
        setSubmitting(false);
        navigate('/properties');
      }
    } catch (err) {
      console.error('[Save Property Error]', err);
      setError(err.message || 'Failed to save property to server.');
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 text-left pb-12 max-w-4xl mx-auto">
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
          <span className="text-xs font-bold text-slate-900">
            {isEditing ? 'Edit Property' : 'Add Property'}
          </span>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold rounded-xl">
            {error}
          </div>
        )}

        {/* MAIN FORM CARD */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Building className="w-6 h-6 text-[#04A26F]" />
              <span>{isEditing ? 'Edit Property' : 'Add Property'}</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Register an individual rentable property asset (Shop, Flat, Office, House, etc.) directly under a Landlord.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-semibold text-slate-700">
              {/* LANDLORD SELECTION (REQUIRED) */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-[#04A26F]" />
                  <span>Landlord *</span>
                </label>
                <select
                  required
                  value={formData.landlordId}
                  onChange={(e) => setFormData({ ...formData, landlordId: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20 focus:border-[#04A26F] font-bold text-slate-900 bg-white cursor-pointer"
                >
                  <option value="">[ Select Landlord ▼ ]</option>
                  {landlords.map((l) => {
                    const lid = l._id || l.id;
                    const name = l.fullName || l.name;
                    return (
                      <option key={lid} value={lid}>
                        {name} {l.country ? `(${l.country})` : ''}
                      </option>
                    );
                  })}
                </select>
                {landlords.length === 0 && (
                  <p className="text-[11px] text-amber-600 font-semibold mt-1">
                    No landlords registered yet.{' '}
                    <Link to="/landlords/create" className="underline font-bold">
                      Click here to add a landlord first.
                    </Link>
                  </p>
                )}
              </div>

              {/* PROPERTY NAME */}
              <div className="space-y-1.5 md:col-span-1">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                  Property Name / Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shop 1, Flat 4B, Office 201, 14 High Street"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20 focus:border-[#04A26F] font-extrabold text-slate-900"
                />
              </div>

              {/* PROPERTY TYPE */}
              <div className="space-y-1.5 md:col-span-1">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                  Property Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20 focus:border-[#04A26F] bg-white cursor-pointer"
                >
                  {propertyTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* MONTHLY RENT */}
              <div className="space-y-1.5 md:col-span-1">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                  Monthly Rent (£) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 1200"
                  value={formData.monthlyRent}
                  onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value, price: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20 focus:border-[#04A26F] font-bold text-slate-900"
                />
              </div>

              {/* STATUS */}
              <div className="space-y-1.5 md:col-span-1">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20 focus:border-[#04A26F] bg-white cursor-pointer font-bold"
                >
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Reserved">Reserved</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              {/* FLOOR & SIZE */}
              <div className="space-y-1.5 md:col-span-1">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                  Floor / Level
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ground, 1st Floor, Basement"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20 focus:border-[#04A26F]"
                />
              </div>

              <div className="space-y-1.5 md:col-span-1">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                  Size (e.g. sq ft)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 750 sq ft, 2 Beds"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20 focus:border-[#04A26F]"
                />
              </div>

              {/* ADDRESS */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                  Street Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. 12 Oxford Road"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20 focus:border-[#04A26F]"
                />
              </div>

              {/* CITY & POSTCODE */}
              <div className="space-y-1.5 md:col-span-1">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                  City
                </label>
                <input
                  type="text"
                  placeholder="e.g. London, Manchester, Leeds"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20 focus:border-[#04A26F]"
                />
              </div>

              <div className="space-y-1.5 md:col-span-1">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                  Postcode
                </label>
                <input
                  type="text"
                  placeholder="e.g. M1 4BT, SW1A 1AA"
                  value={formData.postcode}
                  onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20 focus:border-[#04A26F]"
                />
              </div>

              {/* AREA & COUNTY */}
              <div className="space-y-1.5 md:col-span-1">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                  Area / Neighborhood
                </label>
                <input
                  type="text"
                  placeholder="e.g. City Centre, Camden"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20 focus:border-[#04A26F]"
                />
              </div>

              <div className="space-y-1.5 md:col-span-1">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                  County
                </label>
                <input
                  type="text"
                  placeholder="e.g. Greater Manchester"
                  value={formData.county}
                  onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20 focus:border-[#04A26F]"
                />
              </div>

              {/* DESCRIPTION */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Summary of property structure and location..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20 focus:border-[#04A26F]"
                />
              </div>

              {/* NOTES */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                  Internal Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Private management notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20 focus:border-[#04A26F]"
                />
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate('/properties')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Cancel</span>
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-extrabold text-white bg-[#04A26F] hover:bg-[#038b5e] active:bg-[#02754e] rounded-lg transition-all cursor-pointer shadow-xs focus:ring-2 focus:ring-[#04A26F] disabled:opacity-50"
              >
                <Save className="w-4 h-4 stroke-[2.5]" />
                <span>{submitting ? 'Saving Property...' : 'Save Property'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}

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
import { fetchLandlordsFromAPI, createPropertyAPI } from '../services/apiData';

export function CreatePropertyPage() {
  const navigate = useNavigate();
  const { propertyId } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(propertyId);

  const initialLandlordId = searchParams.get('landlordId') || '';

  const [landlords, setLandlords] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Commercial',
    landlordId: initialLandlordId,
    address: '',
    city: '',
    area: '',
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
      const properties = getSavedProperties();
      const existing = properties.find((p) => p.id === propertyId || p._id === propertyId);
      if (existing) {
        setFormData({
          name: existing.name || existing.propertyName || '',
          type: existing.type || 'Commercial',
          landlordId: existing.landlordId?._id || existing.landlordId || '',
          address: existing.address || '',
          city: existing.city || '',
          area: existing.area || '',
          description: existing.description || '',
          notes: existing.notes || '',
        });
      }
    }
  }, [propertyId, isEditing]);

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
      if (isEditing) {
        updateProperty(propertyId, {
          name: formData.name.trim(),
          type: formData.type,
          landlordId: formData.landlordId,
          address: formData.address.trim(),
          city: formData.city.trim(),
          area: formData.area.trim(),
          description: formData.description.trim(),
          notes: formData.notes.trim(),
        });
        navigate(`/properties/${propertyId}`);
      } else {
        try {
          const resData = await createPropertyAPI({
            name: formData.name.trim(),
            type: formData.type,
            landlordId: formData.landlordId,
            address: formData.address.trim(),
            city: formData.city.trim(),
            area: formData.area.trim(),
            description: formData.description.trim(),
            notes: formData.notes.trim(),
          });
          if (resData) {
            saveProperty(resData);
          }
        } catch (apiErr) {
          console.warn('[API Save Warning] Saving locally:', apiErr.message);
          const selectedL = landlords.find((l) => l.id === formData.landlordId || l._id === formData.landlordId);
          const newProp = {
            id: `prop-${Date.now()}`,
            _id: `prop-${Date.now()}`,
            name: formData.name.trim(),
            type: formData.type,
            landlordId: formData.landlordId,
            landlordName: selectedL?.fullName || selectedL?.name || '',
            address: formData.address.trim(),
            city: formData.city.trim(),
            area: formData.area.trim(),
            description: formData.description.trim(),
            notes: formData.notes.trim(),
            status: 'Active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          saveProperty(newProp);
        }
        setSubmitting(false);
        navigate('/properties');
      }
    } catch (err) {
      setError(err.message || 'Failed to save property.');
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
              Select the owning landlord and enter core property details. You can add units inside this property after saving.
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
                  Property Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Shopping Plaza, City Office Building"
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

              {/* ADDRESS */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                  Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Main Boulevard, Peshawar Road"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20 focus:border-[#04A26F]"
                />
              </div>

              {/* CITY & AREA */}
              <div className="space-y-1.5 md:col-span-1">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                  City
                </label>
                <input
                  type="text"
                  placeholder="e.g. London, Manchester, Birmingham"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20 focus:border-[#04A26F]"
                />
              </div>

              <div className="space-y-1.5 md:col-span-1">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                  Area / Region
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gulberg III, DHA Phase 5"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
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

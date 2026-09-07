import React from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Building, MapPin, Calendar } from 'lucide-react';
import { demoPropertiesList } from '../data/propertiesData';
import { formatCurrency } from '../utils/currencyFormatter';
import { PropertyStatusBadge } from '../components/properties/PropertyStatusBadge';

export function PropertyDetailPage() {
  const { propertyId } = useParams();

  // Find in localStorage first or fallback to demo list
  const saved = JSON.parse(localStorage.getItem('landlordvision_properties') || '[]');
  const allProperties = [...saved, ...demoPropertiesList];
  const property = allProperties.find((p) => p.id === propertyId) || allProperties[0];

  return (
    <AppLayout>
      <div className="space-y-6 text-left">
        <div className="flex items-center gap-3">
          <Link
            to="/properties"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-[#00a36f] shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Properties</span>
          </Link>
          <span className="text-xs text-slate-400">/</span>
          <span className="text-xs font-bold text-slate-900">{property.reference}</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-emerald-50 text-[#00a36f] shrink-0">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900">{property.reference}</h1>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {property.address?.streetAddress}, {property.address?.townCity},{' '}
                    {property.address?.postcode}
                  </span>
                </p>
              </div>
            </div>

            <PropertyStatusBadge status={property.status} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Property Type</span>
              <span className="font-extrabold text-slate-800">{property.propertyType}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Furnishing</span>
              <span className="font-extrabold text-slate-800">{property.furnishing}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Rent</span>
              <span className="font-extrabold text-[#00a36f] text-sm">
                {formatCurrency(property.targetRent)} / {property.paymentTerm || 'Monthly'}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Tenancies</span>
              <span className="font-extrabold text-slate-800">
                {property.activeTenanciesCount || 0} ({property.totalUnitsCount || 0} units)
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

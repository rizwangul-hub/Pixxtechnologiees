import React, { useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Building } from 'lucide-react';
import { PropertyImageUpload } from '../components/properties/PropertyImageUpload';
import { PropertyFormDetails } from '../components/properties/PropertyFormDetails';
import { PropertyFormAddress } from '../components/properties/PropertyFormAddress';
import { PropertyFormFinancials } from '../components/properties/PropertyFormFinancials';
import { PropertyFormFacilities } from '../components/properties/PropertyFormFacilities';
import { PropertyFormNotes } from '../components/properties/PropertyFormNotes';

export function CreatePropertyPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Image State
  const [image, setImage] = useState(null);

  // Main Form Data State
  const [formData, setFormData] = useState({
    reference: '',
    propertyType: '',
    furnishing: '',
    constructionDate: '',
    address: {
      streetAddress: '',
      townCity: '',
      countyRegion: '',
      postcode: '',
      country: 'United Kingdom',
    },
    targetRent: '',
    paymentTerm: 'Monthly',
    purchase: { date: '', price: '' },
    selling: { date: '', price: '' },
    notAvailableForLetting: false,
    facilities: {
      parkingSpaces: 0,
      garage: false,
      smokeAlarm: 0,
      coAlarm: 0,
      houseAlarm: false,
    },
    notes: '',
  });

  const validateForm = () => {
    const newErrors = {};
    if (!formData.reference || !formData.reference.trim()) {
      newErrors.reference = 'Property reference is required.';
    }
    if (!formData.propertyType) {
      newErrors.propertyType = 'Please select a property type.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const newProperty = {
        id: `prop-${Date.now()}`,
        portfolioId: 'port-1',
        reference: formData.reference,
        propertyType: formData.propertyType,
        furnishing: formData.furnishing || 'None',
        constructionDate: formData.constructionDate || 'N/A',
        habitableRooms: 0,
        status: formData.notAvailableForLetting ? 'Not Available' : 'Vacant',
        activeTenanciesCount: 0,
        totalUnitsCount: 1,
        address: formData.address,
        targetRent: Number(formData.targetRent) || 0,
        paymentTerm: formData.paymentTerm,
        purchase: formData.purchase,
        selling: formData.selling,
        notAvailableForLetting: formData.notAvailableForLetting,
        facilities: formData.facilities,
        notes: formData.notes,
        image: image,
      };

      // Save to localStorage
      const existingSaved = JSON.parse(localStorage.getItem('landlordvision_properties') || '[]');
      localStorage.setItem(
        'landlordvision_properties',
        JSON.stringify([newProperty, ...existingSaved])
      );

      setIsSubmitting(false);
      navigate('/properties');
    }, 600);
  };

  return (
    <AppLayout>
      <form onSubmit={handleSubmit} className="space-y-6 pb-12 text-left">
        {/* BREADCRUMB / TOP HEADER */}
        <div className="flex items-center gap-3">
          <Link
            to="/properties"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-[#00a36f] shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Properties</span>
          </Link>
          <span className="text-xs text-slate-400">/</span>
          <span className="text-xs font-bold text-slate-900">Add Property</span>
        </div>

        {/* TOP PROMINENT REFERENCE & IMAGE SECTION */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building className="w-6 h-6 text-[#00a36f]" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Add New Property</h1>
          </div>

          {/* Property Reference Input */}
          <div className="space-y-1">
            <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1">
              <span>Property Reference</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, reference: e.target.value }));
                if (errors.reference) setErrors((prev) => ({ ...prev, reference: null }));
              }}
              placeholder="e.g. 10 CROMWELL ROAD GRAYS ESSEX RM17 5HF"
              className={`w-full h-11 px-4 text-sm font-bold bg-amber-50/50 border rounded-xl text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:border-[#00a36f] focus:ring-2 focus:ring-[#00a36f]/20 outline-none transition-all ${
                errors.reference ? 'border-red-500 bg-red-50/50' : 'border-amber-200'
              }`}
            />
            {errors.reference && (
              <p className="text-xs font-bold text-red-600 mt-1">{errors.reference}</p>
            )}
          </div>

          {/* Image Upload Area */}
          <PropertyImageUpload image={image} setImage={setImage} />
        </div>

        {/* 2-COLUMN MAIN FORM LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* LEFT COLUMN: Property Details, Financials, Facilities, Notes */}
          <div className="space-y-6">
            {/* Property Details */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <PropertyFormDetails
                formData={formData}
                setFormData={setFormData}
                errors={errors}
              />
            </div>

            {/* Financials (Projected Rents, Purchase, Selling) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <PropertyFormFinancials formData={formData} setFormData={setFormData} />
            </div>

            {/* Facilities */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <PropertyFormFacilities formData={formData} setFormData={setFormData} />
            </div>

            {/* Notes & Availability */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <PropertyFormNotes formData={formData} setFormData={setFormData} />
            </div>
          </div>

          {/* RIGHT COLUMN: Address */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs sticky top-20">
              <PropertyFormAddress formData={formData} setFormData={setFormData} />
            </div>
          </div>
        </div>

        {/* BOTTOM FORM ACTIONS */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-end gap-3">
          <Link
            to="/properties"
            className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-all cursor-pointer"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-extrabold text-white bg-[#00a36f] hover:bg-[#008f61] active:bg-[#007a53] disabled:opacity-50 transition-all cursor-pointer shadow-xs focus:ring-2 focus:ring-[#00a36f]"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving Property...' : 'Save Property'}</span>
          </button>
        </div>
      </form>
    </AppLayout>
  );
}

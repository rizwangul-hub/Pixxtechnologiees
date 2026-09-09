import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  Globe,
  FileText,
  UploadCloud,
  X,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import {
  getSavedLandlords,
  saveLandlord as saveLocalLandlord,
  updateLandlord as updateLocalLandlord,
} from '../data/landlordsData';
import {
  fetchLandlordByIdAPI,
  createLandlordAPI,
  updateLandlordAPI,
  uploadFileToCloudinaryAPI,
} from '../services/apiData';

export default function CreateLandlordPage() {
  const navigate = useNavigate();
  const { landlordId } = useParams();
  const isEditMode = Boolean(landlordId);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    country: 'United Kingdom',
    region: '',
    notes: '',
    logo: { url: '', publicId: '' },
  });

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      const loadExisting = async () => {
        try {
          const apiLandlord = await fetchLandlordByIdAPI(landlordId);
          if (apiLandlord) {
            setFormData({
              fullName: apiLandlord.fullName || apiLandlord.name || '',
              email: apiLandlord.email || '',
              phone: apiLandlord.phone || apiLandlord.contactNumber || '',
              address: apiLandlord.address || '',
              country: apiLandlord.country || 'United Kingdom',
              region: apiLandlord.region || '',
              notes: apiLandlord.notes || '',
              logo: apiLandlord.logo || { url: '', publicId: '' },
            });
            return;
          }
        } catch (e) {
          console.warn('[Create Landlord API Notice]', e.message);
        }

        const localList = getSavedLandlords();
        const existing = localList.find((l) => l.id === landlordId || l._id === landlordId);
        if (existing) {
          setFormData({
            fullName: existing.fullName || existing.name || '',
            email: existing.email || '',
            phone: existing.phone || existing.contactNumber || '',
            address: existing.address || '',
            country: existing.country || 'United Kingdom',
            region: existing.region || '',
            notes: existing.notes || '',
            logo: existing.logo || { url: '', publicId: '' },
          });
        } else {
          setError('Landlord profile not found.');
        }
      };
      loadExisting();
    }
  }, [landlordId, isEditMode]);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingLogo(true);
    setError('');

    try {
      const res = await uploadFileToCloudinaryAPI(file, 'pixxtechnologies/landlords');
      setFormData((prev) => ({
        ...prev,
        logo: {
          url: res.url,
          publicId: res.public_id,
        },
      }));
      setUploadingLogo(false);
    } catch (err) {
      console.warn('[Logo Upload Warning]', err.message);
      // Fallback local preview
      const localUrl = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        logo: { url: localUrl, publicId: '' },
      }));
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({
      ...prev,
      logo: { url: '', publicId: '' },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setError('Landlord full name is required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (isEditMode) {
        const updated = await updateLandlordAPI(landlordId, formData);
        updateLocalLandlord(landlordId, updated || formData);
      } else {
        const created = await createLandlordAPI(formData);
        saveLocalLandlord(created || formData);
      }
      setSubmitting(false);
      navigate('/landlords');
    } catch (err) {
      console.warn('[Save Landlord API Error]', err.message);
      // Fallback local save
      if (isEditMode) {
        updateLocalLandlord(landlordId, formData);
      } else {
        saveLocalLandlord(formData);
      }
      setSubmitting(false);
      navigate('/landlords');
    }
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6 text-left">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              to="/landlords"
              className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditMode ? 'Edit Landlord' : 'Add New Landlord'}
              </h1>
              <p className="text-xs text-gray-500">
                Enter landlord details, location, contact info, and upload company/owner logo.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
          {/* LOGO UPLOADER SECTION */}
          <div className="border-b border-gray-100 pb-6">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Landlord / Company Logo (Optional)
            </label>
            <div className="flex items-center space-x-6">
              {formData.logo?.url ? (
                <div className="relative group">
                  <img
                    src={formData.logo.url}
                    alt="Landlord Logo Preview"
                    className="w-24 h-24 rounded-xl object-cover border-2 border-emerald-200 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors shadow-md cursor-pointer"
                    title="Remove Logo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-xl bg-gray-50 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-[10px] font-semibold mt-1">No Logo</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2 bg-emerald-50 text-[#04A26F] border border-emerald-200 text-xs font-bold rounded-lg hover:bg-emerald-100 transition-colors">
                  {uploadingLogo ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading Logo...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>{formData.logo?.url ? 'Replace Logo' : 'Upload Logo'}</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-gray-500">
                  Supported formats: JPG, PNG, WEBP. Uploads directly to Cloudinary.
                </p>
              </div>
            </div>
          </div>

          {/* MAIN FORM FIELDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Full Name / Business Title *
              </label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Ahmed Khan or Centennial Properties"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm font-semibold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. landlord@example.com"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Contact Number / Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. +92 300 1234567"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Country
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="e.g. United Kingdom"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                State / Region
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  placeholder="e.g. Punjab, London, Essex"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Office / Residential Address
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full office or home address"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Internal Management Notes (Optional)
            </label>
            <textarea
              rows="3"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Enter internal notes, preferred payment accounts, or investment portfolio details..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
            <Link
              to="/landlords"
              className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || uploadingLogo}
              className="px-6 py-2.5 bg-[#04A26F] text-white text-sm font-semibold rounded-lg hover:bg-[#03885c] transition-colors flex items-center space-x-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : isEditMode ? 'Update Landlord' : 'Save Landlord'}</span>
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

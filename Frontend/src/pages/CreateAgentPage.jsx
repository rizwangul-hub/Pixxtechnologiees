import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, User, Phone, Mail, MapPin, Globe, FileText, Upload, X, Loader2 } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { fetchAgentByIdAPI, createAgentAPI, updateAgentAPI } from '../services/apiData';

export default function CreateAgentPage() {
  const navigate = useNavigate();
  const { agentId } = useParams();
  const isEditMode = Boolean(agentId);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    country: 'United Kingdom',
    region: '',
    notes: '',
    status: 'Active',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [existingImageUrl, setExistingImageUrl] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingAgent, setLoadingAgent] = useState(isEditMode);

  useEffect(() => {
    if (isEditMode && agentId) {
      loadAgentDetails();
    }
  }, [agentId, isEditMode]);

  const loadAgentDetails = async () => {
    setLoadingAgent(true);
    try {
      const data = await fetchAgentByIdAPI(agentId);
      if (data && data.agent) {
        const ag = data.agent;
        setFormData({
          fullName: ag.fullName || '',
          phone: ag.phone || '',
          email: ag.email || '',
          address: ag.address || '',
          country: ag.country || 'United Kingdom',
          region: ag.region || '',
          notes: ag.notes || '',
          status: ag.status || 'Active',
        });
        if (ag.profileImage) {
          setExistingImageUrl(ag.profileImage);
          setImagePreview(ag.profileImage);
        }
      }
    } catch (e) {
      setError('Failed to load agent details.');
    }
    setLoadingAgent(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setExistingImageUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setError('Agent full name is required.');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Contact phone number is required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const dataToSend = new FormData();
      dataToSend.append('fullName', formData.fullName.trim());
      dataToSend.append('phone', formData.phone.trim());
      dataToSend.append('email', formData.email.trim());
      dataToSend.append('address', formData.address.trim());
      dataToSend.append('country', formData.country.trim());
      dataToSend.append('region', formData.region.trim());
      dataToSend.append('notes', formData.notes.trim());
      dataToSend.append('status', formData.status);

      if (imageFile) {
        dataToSend.append('profileImage', imageFile);
      }

      if (isEditMode) {
        await updateAgentAPI(agentId, dataToSend);
      } else {
        await createAgentAPI(dataToSend);
      }

      setSubmitting(false);
      navigate('/agents');
    } catch (err) {
      setError(err.message || 'Failed to save agent. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6 text-left">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              to="/agents"
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-900">
                {isEditMode ? 'Edit Agent Profile' : 'Add New Agent'}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Enter agent contact details, assigned region, and profile picture.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl">
            {error}
          </div>
        )}

        {loadingAgent ? (
          <div className="p-12 text-center text-slate-500 flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#04A26F]" />
            <span>Loading agent profile...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            {/* PROFILE IMAGE UPLOAD SECTION */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative shrink-0">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Agent Profile Preview"
                      className="w-20 h-20 rounded-full object-cover border-2 border-[#04A26F] shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-1 -right-1 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-emerald-100 text-[#04A26F] flex items-center justify-center font-black text-2xl border-2 border-emerald-200">
                    {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 'A'}
                  </div>
                )}
              </div>

              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Agent Profile Picture</h3>
                <p className="text-[11px] text-slate-500">
                  Upload agent logo or photo (JPG, PNG, WEBP up to 5MB). Saved to Cloudinary.
                </p>
                <div className="pt-1">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-[#04A26F]" />
                    <span>Choose Photo</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* FORM INPUT FIELDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  Agent Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Ali Khan"
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  Contact Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. 03000000000"
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. agent@example.com"
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  Region / Assigned Operating Area
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    placeholder="e.g. Greater London, Essex, Kent"
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  Country
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="e.g. United Kingdom"
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-xs font-bold"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Full Office / Residential Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Agent full address details..."
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Additional Notes
              </label>
              <textarea
                rows="3"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Enter any reference notes or background..."
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-xs font-semibold"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <Link
                to="/agents"
                className="px-5 py-2.5 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-[#04A26F] text-white text-xs font-extrabold rounded-xl hover:bg-[#03885c] transition-colors flex items-center space-x-2 shadow-sm"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{submitting ? 'Saving...' : isEditMode ? 'Update Agent' : 'Save Agent'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  );
}

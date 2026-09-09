import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, User, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import {
  customerTypes,
  getSavedCustomers,
  saveCustomer,
  updateCustomer,
} from '../data/customersData';
import { createCustomerAPI, uploadTenantDocumentAPI } from '../services/apiData';
import { TenantDocumentSection } from '../components/tenants/TenantDocumentSection';

export default function CreateCustomerPage() {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const isEditMode = Boolean(customerId);
  const [savedTenantId, setSavedTenantId] = useState('');
  const [pendingDocuments, setPendingDocuments] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    type: 'Individual',
    phone: '',
    email: '',
    cnicOrReg: '',
    address: '',
    city: '',
    notes: '',
    status: 'Active',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEditMode && customerId) {
      const customers = getSavedCustomers();
      const found = customers.find((c) => c.id === customerId);
      if (found) {
        setFormData({
          name: found.name || '',
          type: found.type || 'Individual',
          phone: found.phone || '',
          email: found.email || '',
          cnicOrReg: found.cnicOrReg || '',
          address: found.address || '',
          city: found.city || '',
          notes: found.notes || '',
          status: found.status || 'Active',
        });
      }
    }
  }, [customerId, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Tenant name is required.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      let targetTenantId = customerId;

      if (isEditMode) {
        updateCustomer(customerId, formData);
      } else {
        try {
          const apiRes = await createCustomerAPI(formData);
          targetTenantId = apiRes?._id || apiRes?.id || apiRes?.data?._id || apiRes?.data?.id;
          saveCustomer(apiRes || formData);
        } catch (apiErr) {
          const saved = saveCustomer(formData);
          targetTenantId = saved?.id || saved?._id;
        }
      }

      // Upload any selected pending documents to Cloudinary after acquiring tenant ID
      if (targetTenantId && pendingDocuments.length > 0) {
        for (const pDoc of pendingDocuments) {
          try {
            await uploadTenantDocumentAPI(
              targetTenantId,
              pDoc.file,
              pDoc.documentName,
              pDoc.documentType || 'standard',
              pDoc.expiryDate || ''
            );
          } catch (docErr) {
            console.warn(`[Document Upload Notice] Failed to upload ${pDoc.documentName}:`, docErr.message);
          }
        }
      }

      setSubmitting(false);
      navigate('/tenants');
    } catch (err) {
      setError('Failed to save tenant. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              to="/tenants"
              className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditMode ? 'Edit Tenant' : 'Add New Tenant'}
              </h1>
              <p className="text-xs text-gray-500">
                Enter tenant personal and contact details.
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Full Name / Business Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Centennial Property Ltd or Danial Butt"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Tenant Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm"
                required
              >
                {customerTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Phone Number
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
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. customer@example.com"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                NINO / Business Registration Number
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={formData.cnicOrReg}
                  onChange={(e) => setFormData({ ...formData, cnicOrReg: e.target.value })}
                  placeholder="e.g. QQ 12 34 56 A or REG-9876"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                City / Region
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Karachi"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Full Residential / Office Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="House/Plot/Street Address"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Additional Notes
            </label>
            <textarea
              rows="3"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Enter any reference notes or customer background..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F] text-sm"
            />
          </div>

          {/* TENANT DOCUMENT MANAGEMENT SECTION */}
          <TenantDocumentSection
            tenantId={savedTenantId || customerId}
            onPendingDocumentsChange={setPendingDocuments}
          />

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
            <Link
              to="/tenants"
              className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-[#04A26F] text-white text-sm font-semibold rounded-lg hover:bg-[#03885c] transition-colors flex items-center space-x-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : isEditMode ? 'Update Tenant' : 'Save Tenant'}</span>
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

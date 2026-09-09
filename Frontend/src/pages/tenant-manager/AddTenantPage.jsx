import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout';
import { ArrowLeft, Save, Plus, UserCheck, Edit } from 'lucide-react';
import { demoContacts, saveTenant } from '../../data/tenantsData';

export function AddTenantPage() {
  const navigate = useNavigate();
  const [selectedContact, setSelectedContact] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const nameToSave = isAddingNew ? newContactName : selectedContact;

    if (!nameToSave || nameToSave.trim() === '') {
      alert('Please select a contact or enter a new contact name.');
      return;
    }

    const newTenant = {
      id: Date.now(),
      name: nameToSave,
      title: 'Mr',
      organisation: '',
      phone1: '07000 000000',
      phone2: '',
      email1: `${nameToSave.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`,
      email2: '',
      street: '123 Main Street',
      city: 'London',
      region: '',
      postcode: 'SW1A 1AA',
      country: 'United Kingdom',
      website: '',
      birthday: '',
      notes: 'Added via Add Tenant form',
      moduleAccess: 'No',
      property: '31 Morley Avenue',
      tenancies: [
        {
          property: '31 Morley Avenue',
          directDebit: 'No',
          tenantType: 'Primary Tenant',
          paymentTerm: 'Monthly',
          rent: '£1,500.00',
          startDate: new Date().toISOString().split('T')[0],
          expiryDate: '01/01/2027',
          daysLeft: '365',
          status: 'Active Tenancies',
          rolling: 'Yes',
          extendBy: '1 Month',
        },
      ],
    };

    saveTenant(newTenant);
    navigate('/tenant-manager/tenants');
  };

  return (
    <AppLayout>
      <div className="space-y-6 text-left pb-12 max-w-4xl mx-auto">
        {/* BREADCRUMB */}
        <div className="flex items-center gap-3">
          <Link
            to="/tenant-manager/tenants"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-[#00a36f] shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Tenants</span>
          </Link>
          <span className="text-xs text-slate-400">/</span>
          <span className="text-xs font-bold text-slate-900">Add Tenant</span>
        </div>

        {/* MAIN FORM CONTAINER */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Add Tenant</span>
              <UserCheck className="w-6 h-6 text-[#00a36f]" />
            </h1>
            <p className="text-xs text-slate-600 font-medium mt-2">
              Please choose a person from your contact list or add a contact. Press <strong>Save</strong> to make the selected person a tenant.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
            <div className="space-y-3">
              <label className="text-xs font-extrabold text-slate-800">Contact *</label>

              {!isAddingNew ? (
                <div className="space-y-2">
                  <select
                    required
                    value={selectedContact}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setIsAddingNew(true);
                      } else {
                        setSelectedContact(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a36f]/20 focus:border-[#00a36f] bg-amber-50/30 font-semibold cursor-pointer"
                  >
                    <option value="">- Select -</option>
                    <option value="__add_new__" className="font-bold text-[#00a36f]">
                      + Add Contact
                    </option>
                    {demoContacts.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Available Contacts List:</p>
                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
                      {demoContacts.map((contact) => (
                        <div
                          key={contact}
                          onClick={() => setSelectedContact(contact)}
                          className={`px-3 py-2 text-xs flex items-center justify-between cursor-pointer hover:bg-emerald-50/50 ${
                            selectedContact === contact ? 'bg-emerald-50 text-[#00a36f] font-bold' : 'text-slate-700'
                          }`}
                        >
                          <span>{contact}</span>
                          <Edit className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Enter new contact full name..."
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a36f]/20 focus:border-[#00a36f] font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setIsAddingNew(false)}
                      className="px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer shrink-0"
                    >
                      Choose Existing
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate('/tenant-manager/tenants')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-extrabold text-white bg-[#00a36f] hover:bg-[#008f61] active:bg-[#007a53] rounded-lg transition-all cursor-pointer shadow-xs focus:ring-2 focus:ring-[#00a36f]"
              >
                <Save className="w-4 h-4 stroke-[2.5]" />
                <span>Save</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}

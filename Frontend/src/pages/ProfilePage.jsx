import React from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { User, Building2, Mail, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function ProfilePage() {
  const { user } = useAuth();

  return (
    <AppLayout>
      <div className="space-y-6 text-left">
        <div className="pb-4 border-b border-slate-200">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <User className="w-7 h-7 text-[#00a36f]" />
            <span>User Profile</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Account manager details, contact email, and security settings.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-6 max-w-2xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#00a36f] text-white flex items-center justify-center text-2xl font-extrabold shadow-md">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">{user?.name}</h3>
              <p className="text-xs text-slate-500 font-medium">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100 text-xs sm:text-sm">
            <div className="flex items-center gap-3 text-slate-700">
              <Building2 className="w-4 h-4 text-[#00a36f]" />
              <span className="font-semibold text-slate-500 w-32">Company:</span>
              <span className="font-bold text-slate-900">{user?.company}</span>
            </div>

            <div className="flex items-center gap-3 text-slate-700">
              <Mail className="w-4 h-4 text-[#00a36f]" />
              <span className="font-semibold text-slate-500 w-32">Email Address:</span>
              <span className="font-bold text-slate-900">{user?.email}</span>
            </div>

            <div className="flex items-center gap-3 text-slate-700">
              <Shield className="w-4 h-4 text-[#00a36f]" />
              <span className="font-semibold text-slate-500 w-32">Account Level:</span>
              <span className="font-bold text-[#00a36f]">Landlord Admin</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

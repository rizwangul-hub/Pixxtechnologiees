import React from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { HelpCircle, Phone, Mail, GraduationCap } from 'lucide-react';

export function HelpPage() {
  return (
    <AppLayout>
      <div className="space-y-6 text-left">
        <div className="pb-4 border-b border-slate-200">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <HelpCircle className="w-7 h-7 text-[#00a36f]" />
            <span>Help &amp; Support</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Contact LandlordVision support team, read guides, and explore video tutorials.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-2">
            <Phone className="w-6 h-6 text-[#00a36f]" />
            <h3 className="font-extrabold text-slate-900">Phone Support</h3>
            <p className="text-xs text-slate-500">01925 357 355 (9am - 5pm, Mon - Fri)</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-2">
            <Mail className="w-6 h-6 text-[#00a36f]" />
            <h3 className="font-extrabold text-slate-900">Email Support</h3>
            <p className="text-xs text-slate-500">info@landlordvision.co.uk</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-2">
            <GraduationCap className="w-6 h-6 text-[#00a36f]" />
            <h3 className="font-extrabold text-slate-900">Learning Lounge</h3>
            <p className="text-xs text-slate-500">Video tutorials &amp; user guides</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

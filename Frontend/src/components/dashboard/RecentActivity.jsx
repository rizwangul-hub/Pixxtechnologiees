import React from 'react';
import { UserPlus, CreditCard, Building, FileCheck, ShieldCheck } from 'lucide-react';

export function RecentActivity() {
  const activities = [
    {
      id: 'act-1',
      title: 'New tenant added',
      description: 'Ahmed Khan was assigned to Unit A-102 at 127 Southend Road',
      time: '2 hours ago',
      icon: UserPlus,
      iconBg: 'bg-emerald-50 text-[#00a36f]',
    },
    {
      id: 'act-2',
      title: 'Payment received',
      description: '£1,200.00 rent payment recorded for Unit B-204 (Parkview Heights)',
      time: '5 hours ago',
      icon: CreditCard,
      iconBg: 'bg-blue-50 text-blue-600',
    },
    {
      id: 'act-3',
      title: 'Safety certificate updated',
      description: 'Gas Safety Certificate (CP12) renewed for Willow Creek Apt 4B',
      time: '1 day ago',
      icon: ShieldCheck,
      iconBg: 'bg-amber-50 text-amber-600',
    },
    {
      id: 'act-4',
      title: 'Tenancy agreement uploaded',
      description: 'Signed AST Agreement uploaded for High Street Suite 301',
      time: '2 days ago',
      icon: FileCheck,
      iconBg: 'bg-purple-50 text-purple-600',
    },
  ];

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs text-left space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
          Recent Portfolio Activity
        </h3>
        <span className="text-xs font-semibold text-[#00a36f] hover:underline cursor-pointer">
          View All
        </span>
      </div>

      <div className="space-y-3">
        {activities.map((act) => {
          const Icon = act.icon;
          return (
            <div key={act.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
              <div className={`w-8 h-8 rounded-lg ${act.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-900 truncate">{act.title}</p>
                  <span className="text-[10px] font-medium text-slate-400 shrink-0">{act.time}</span>
                </div>
                <p className="text-xs text-slate-500 font-medium truncate pt-0.5">{act.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

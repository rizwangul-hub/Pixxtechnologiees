import React from 'react';
import { LayoutDashboard, Building2, Users, Wallet, FileText, X } from 'lucide-react';
import { SidebarItem } from './SidebarItem';
import { PortfolioSelector } from './PortfolioSelector';

export function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }) {
  const menuItems = [
    { name: 'Portfolio Dashboard', path: '/dashboard', icon: LayoutDashboard },
    {
      name: 'Property Manager',
      path: '/properties',
      icon: Building2,
      subItems: [
        { name: 'Properties', path: '/properties' },
        { name: 'Expenses', path: '/expenses' },
        { name: 'Income', path: '/income' },
        { name: 'Payments', path: '/payments' },
      ],
    },
    { name: 'Tenant Manager', path: '/tenants', icon: Users },
    { name: 'Account Manager', path: '/accounts', icon: Wallet },
    { name: 'Reports', path: '/reports', icon: FileText },
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 bg-white border-r border-slate-200/80 min-h-[calc(100vh-7rem)] p-4 space-y-6">
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 pb-2">
            Main Management
          </p>
          <nav className="space-y-1.5">
            {menuItems.map((item) => (
              <SidebarItem key={item.name} {...item} />
            ))}
          </nav>
        </div>
      </aside>

      {/* MOBILE OFF-CANVAS DRAWER OVERLAY */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs md:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="w-72 max-w-[80vw] h-full bg-white shadow-2xl p-5 flex flex-col justify-between overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-5 text-left">
              {/* Header inside Mobile Drawer */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-sm font-extrabold text-slate-900">LandlordVision Menu</span>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Portfolio Selector in Drawer */}
              <div className="space-y-1 pt-1">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Current Portfolio
                </p>
                <PortfolioSelector />
              </div>

              {/* Navigation Items */}
              <div className="space-y-1 pt-3">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 pb-1">
                  Navigation
                </p>
                <nav className="space-y-1.5">
                  {menuItems.map((item) => (
                    <SidebarItem
                      key={item.name}
                      {...item}
                      onClick={() => setIsMobileMenuOpen(false)}
                    />
                  ))}
                </nav>
              </div>
            </div>

            {/* Bottom info */}
            <div className="pt-6 border-t border-slate-100 text-xs text-slate-400 text-center">
              LandlordVision SaaS &copy; {new Date().getFullYear()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

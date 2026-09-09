import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, Wallet, FileText, Settings, LogOut, X, UserCheck, Briefcase, Landmark } from 'lucide-react';
import { SidebarItem } from './SidebarItem';
import { PixxLogo } from '../common/PixxLogo';
import { useAuth } from '../../context/AuthContext';

export function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Landlords', path: '/landlords', icon: UserCheck },
    { name: 'Agents', path: '/agents', icon: Briefcase },
    { name: 'Properties', path: '/properties', icon: Building2 },
    { name: 'Tenants', path: '/tenants', icon: Users },
    { name: 'Payments', path: '/payments', icon: Wallet },
    { name: 'Mortgages', path: '/mortgages', icon: Landmark },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 bg-white border-r border-slate-200/80 h-full overflow-y-auto p-4 justify-between">
        <div className="space-y-4 text-left">
          <p className="px-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Main Management
          </p>

          <nav className="space-y-1.5">
            {menuItems.map((item) => (
              <SidebarItem key={item.name} {...item} />
            ))}
          </nav>
        </div>

        {/* BOTTOM LOGOUT BUTTON */}
        <div className="pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full h-11 px-3.5 rounded-xl text-xs font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all flex items-center gap-3 cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
              <LogOut className="w-4 h-4" />
            </div>
            <span>Logout</span>
          </button>
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
            <div className="space-y-6 text-left">
              {/* Header inside Mobile Drawer */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <PixxLogo variant="light" />
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items */}
              <div className="space-y-1">
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

            {/* Bottom Logout in Drawer */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full h-11 px-3.5 rounded-xl text-xs font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all flex items-center gap-3 cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                  <LogOut className="w-4 h-4" />
                </div>
                <span>Logout</span>
              </button>

              <div className="text-[11px] font-semibold text-slate-400 text-center">
                Pixx Technologies &copy; {new Date().getFullYear()}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

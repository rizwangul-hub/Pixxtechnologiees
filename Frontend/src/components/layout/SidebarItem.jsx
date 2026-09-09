import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export function SidebarItem({ name, path, icon: Icon, onClick }) {
  const location = useLocation();

  // Check if active page matches route
  const isActive =
    location.pathname === path ||
    (path !== '/dashboard' && location.pathname.startsWith(path)) ||
    ((path === '/tenants' || path === '/customers') && (location.pathname.startsWith('/tenant-manager') || location.pathname.startsWith('/customers') || location.pathname.startsWith('/tenants')));

  return (
    <Link
      to={path}
      onClick={onClick}
      className={`
        w-full h-11 px-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150
        flex items-center justify-between select-none cursor-pointer group text-left
        ${
          isActive
            ? 'bg-emerald-50 text-[#04A26F] font-bold shadow-2xs border border-emerald-100'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
        }
      `}
    >
      <div className="flex items-center gap-3 truncate">
        <div
          className={`
            w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0
            ${
              isActive
                ? 'bg-[#04A26F] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
            }
          `}
        >
          <Icon className="w-4 h-4" />
        </div>
        <span className="truncate">{name}</span>
      </div>
    </Link>
  );
}

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

export function SidebarItem({
  itemKey,
  name,
  path,
  icon: Icon,
  subItems,
  activeManager,
  onToggleManager,
  onMobileClick,
}) {
  const location = useLocation();

  const isExpandable = Boolean(subItems && subItems.length > 0);
  const isOpen = isExpandable && activeManager === itemKey;

  // Check if current route matches parent path or any subItem path
  const isParentRouteActive =
    location.pathname === path ||
    (subItems && subItems.some((sub) => location.pathname === sub.path));

  // Handle header row click
  const handleHeaderClick = (e) => {
    if (isExpandable) {
      e.preventDefault();
      onToggleManager?.(itemKey);
    } else {
      onMobileClick?.();
    }
  };

  return (
    <div className="space-y-1">
      {isExpandable ? (
        <button
          type="button"
          onClick={handleHeaderClick}
          aria-expanded={isOpen}
          aria-controls={`submenu-${itemKey}`}
          className={`
            w-full h-11 px-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150
            flex items-center justify-between select-none cursor-pointer group text-left
            ${
              isOpen || isParentRouteActive
                ? 'bg-emerald-50 text-[#00a36f] font-bold shadow-xs border border-emerald-100'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }
          `}
        >
          <div className="flex items-center gap-3 truncate">
            <div
              className={`
                w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0
                ${
                  isOpen || isParentRouteActive
                    ? 'bg-[#00a36f] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                }
              `}
            >
              <Icon className="w-4 h-4" />
            </div>
            <span className="truncate">{name}</span>
          </div>

          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 shrink-0 ${
              isOpen ? 'rotate-180 text-[#00a36f]' : 'text-slate-400 group-hover:text-slate-600'
            }`}
          />
        </button>
      ) : (
        <Link
          to={path}
          onClick={onMobileClick}
          className={`
            w-full h-11 px-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150
            flex items-center justify-between select-none cursor-pointer group
            ${
              isParentRouteActive
                ? 'bg-emerald-50 text-[#00a36f] font-bold shadow-xs border border-emerald-100'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }
          `}
        >
          <div className="flex items-center gap-3 truncate">
            <div
              className={`
                w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0
                ${
                  isParentRouteActive
                    ? 'bg-[#00a36f] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                }
              `}
            >
              <Icon className="w-4 h-4" />
            </div>
            <span className="truncate">{name}</span>
          </div>
        </Link>
      )}

      {/* SUBMENU ITEMS */}
      {isExpandable && isOpen && (
        <div
          id={`submenu-${itemKey}`}
          className="ml-5 pl-3 border-l-2 border-emerald-200/80 space-y-1 py-1 text-left animate-fade-in"
        >
          {subItems.map((sub) => {
            const isSubActive = location.pathname === sub.path;
            return (
              <Link
                key={sub.path}
                to={sub.path}
                onClick={onMobileClick}
                className={`
                  block px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150
                  ${
                    isSubActive
                      ? 'bg-[#00a36f] text-white font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }
                `}
              >
                {sub.name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

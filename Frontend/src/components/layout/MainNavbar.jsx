import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Menu, X } from 'lucide-react';
import { PortfolioSelector } from './PortfolioSelector';

export function MainNavbar({ isMobileMenuOpen, setIsMobileMenuOpen }) {
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/dashboard' },
    { name: 'Portfolios', path: '/portfolios' },
    { name: 'Contacts', path: '/contacts' },
    { name: 'Settings', path: '/settings' },
    { name: 'Account', path: '/account' },
    { name: 'Help', path: '/help' },
  ];

  return (
    <nav className="w-full bg-slate-800 text-white border-b border-slate-700/80 sticky top-16 z-30 shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
        
        {/* Mobile Hamburger Toggle Button */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="text-xs font-bold text-slate-300">Menu</span>
        </div>

        {/* Mobile Portfolio Selector (shown only on small screens < sm) */}
        <div className="sm:hidden">
          <PortfolioSelector />
        </div>

        {/* DESKTOP NAV LINKS */}
        <div className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`
                  px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all duration-150
                  ${
                    isActive
                      ? 'bg-[#00a36f] text-white shadow-xs font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/70'
                  }
                `}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* RIGHT: "+ Create Tenancy" CTA BUTTON */}
        <div className="flex items-center">
          <Link
            to="/tenancies/create"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#00a36f] hover:bg-[#008f61] active:bg-[#007a53] text-white text-xs font-extrabold tracking-wide uppercase shadow-sm transition-all hover:scale-102 cursor-pointer outline-none focus:ring-2 focus:ring-[#00a36f]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create Tenancy</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

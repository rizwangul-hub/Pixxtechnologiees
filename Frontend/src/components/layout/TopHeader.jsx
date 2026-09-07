import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { PortfolioSelector } from './PortfolioSelector';
import { UserProfileMenu } from './UserProfileMenu';
import { useAuth } from '../../context/AuthContext';
import logoImg from '../../assets/image/logo.png';

export function TopHeader({ onToggleMobileMenu }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="w-full bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-md">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* LEFT & CENTER: Brand Logo + Portfolio Selector */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Brand Logo Link */}
          <Link to="/dashboard" className="flex items-center gap-2 transition-transform hover:scale-102">
            <img
              src={logoImg}
              alt="LandlordVision Logo"
              className="h-9 sm:h-10 w-auto object-contain max-w-[200px]"
            />
          </Link>

          {/* Vertical Divider */}
          <div className="hidden sm:block w-[1px] h-6 bg-slate-800" />

          {/* Portfolio Dropdown Selector */}
          <div className="hidden sm:block">
            <PortfolioSelector />
          </div>
        </div>

        {/* RIGHT: User Profile & Sign Out Button */}
        <div className="flex items-center gap-3">
          {/* User Profile Menu */}
          <UserProfileMenu />

          {/* Direct Sign Out Button */}
          <button
            type="button"
            onClick={handleSignOut}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700/80 cursor-pointer outline-none focus:ring-2 focus:ring-[#00a36f]"
            aria-label="Sign out of account"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}

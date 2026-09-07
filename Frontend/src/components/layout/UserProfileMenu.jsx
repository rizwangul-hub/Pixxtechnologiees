import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Settings, HelpCircle, LogOut, ChevronDown, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function UserProfileMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSignOut = () => {
    logout();
    setIsOpen(false);
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* User Profile Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-800/60 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-[#00a36f] focus:ring-offset-2 focus:ring-offset-slate-900"
        aria-label="User profile menu"
        aria-expanded={isOpen}
      >
        {/* User Avatar */}
        <div className="w-9 h-9 rounded-lg bg-[#00a36f] text-white flex items-center justify-center font-extrabold text-sm shadow-md shrink-0">
          {user.name.charAt(0)}
        </div>

        {/* User Name & Details */}
        <div className="hidden lg:flex flex-col text-left leading-tight">
          <span className="text-xs font-extrabold text-white truncate max-w-[160px]">
            {user.name}
          </span>
          <span className="text-[10px] text-slate-400 font-medium truncate max-w-[160px]">
            {user.email}
          </span>
        </div>

        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Profile Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-200 z-50 overflow-hidden animate-fade-in py-1">
          {/* Header info */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 text-left">
            <p className="text-xs font-extrabold text-slate-900 truncate">{user.name}</p>
            <p className="text-[11px] text-slate-500 font-medium truncate pt-0.5">{user.email}</p>
            <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-[#00a36f]">
              <Building2 className="w-3 h-3" />
              <span className="truncate">{user.company}</span>
            </div>
          </div>

          {/* Links */}
          <div className="py-1 border-b border-slate-100 text-left">
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 transition-colors"
            >
              <User className="w-4 h-4 text-slate-400" />
              <span>Profile</span>
            </Link>

            <Link
              to="/settings"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Account Settings</span>
            </Link>

            <Link
              to="/help"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>Help & Support</span>
            </Link>
          </div>

          {/* Sign Out Action */}
          <div className="py-1 text-left">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

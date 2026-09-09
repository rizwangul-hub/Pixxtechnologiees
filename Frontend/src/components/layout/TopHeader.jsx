import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Menu, Bell, Check, Trash2, X, AlertCircle } from 'lucide-react';
import { PixxLogo } from '../common/PixxLogo';
import { useAuth } from '../../context/AuthContext';
import {
  fetchNotificationsAPI,
  markNotificationReadAPI,
  markAllNotificationsReadAPI,
  deleteNotificationAPI,
} from '../../services/apiData';

export function TopHeader({ onToggleMobileMenu }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const loadNotifications = async () => {
    try {
      const res = await fetchNotificationsAPI();
      if (res && res.success) {
        setNotifications(res.data || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (e) {
      console.warn('[Header Notification Warning]', e.message);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // refresh every 30s

    const handleCustomUpdate = () => loadNotifications();
    window.addEventListener('pixx_notification_updated', handleCustomUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('pixx_notification_updated', handleCustomUpdate);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const handleMarkRead = async (id, e) => {
    if (e) {
      e.stopPropagation();
      if (e.preventDefault) e.preventDefault();
    }
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await markNotificationReadAPI(id);
    } catch (err) {
      console.error('Mark read failed:', err);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsReadAPI();
    } catch (err) {
      console.error('Mark all read failed:', err);
    }
  };

  const handleDelete = async (id, e) => {
    if (e) {
      e.stopPropagation();
      if (e.preventDefault) e.preventDefault();
    }
    // Instant optimistic removal from UI state
    const target = notifications.find((n) => n._id === id);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    if (target && !target.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    try {
      const res = await deleteNotificationAPI(id);
      if (!res || !res.success) {
        // Re-fetch only if delete failed
        loadNotifications();
      }
    } catch (err) {
      console.error('Delete notification error:', err);
      loadNotifications();
    }
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  // Map route to page title
  const getPageTitle = (path) => {
    if (path.startsWith('/dashboard')) return 'Dashboard';
    if (path.startsWith('/landlords')) return 'Landlords';
    if (path.startsWith('/agents')) return 'Agents';
    if (path.startsWith('/properties')) return 'Properties';
    if (path.startsWith('/expenses')) return 'Properties / Expenses';
    if (path.startsWith('/income')) return 'Properties / Income';
    if (path.startsWith('/payments')) return 'Payments';
    if (path.startsWith('/mortgages')) return 'Mortgages';
    if (path.startsWith('/customers') || path.startsWith('/tenant-manager') || path.startsWith('/tenants')) return 'Tenants';
    if (path.startsWith('/reports')) return 'Reports';
    if (path.startsWith('/settings') || path.startsWith('/account')) return 'Settings';
    return 'Management Portal';
  };

  const pageTitle = getPageTitle(location.pathname);

  return (
    <header className="w-full bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* LEFT: Mobile Menu Button + Brand Logo + Page Title */}
        <div className="flex items-center gap-3 sm:gap-6">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            aria-label="Open mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/dashboard" className="flex items-center transition-transform hover:scale-102">
            <PixxLogo variant="dark" />
          </Link>

          <div className="hidden sm:block w-[1px] h-6 bg-slate-800" />

          {/* Current Page Title Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-extrabold text-emerald-400">
            <span>{pageTitle}</span>
          </div>
        </div>

        {/* RIGHT: Notifications, Manager Profile & Logout */}
        <div className="flex items-center gap-3 relative">
          {/* Notification Bell Icon */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors border border-slate-700/80 relative cursor-pointer"
              title="Manager Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {isOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-gray-900 rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden text-left">
                <div className="p-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-sm">Manager Alerts</span>
                    {unreadCount > 0 && (
                      <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-medium text-emerald-400 hover:underline cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-500 space-y-1">
                      <AlertCircle className="w-6 h-6 text-gray-300 mx-auto" />
                      <p className="font-semibold text-gray-700">No Notifications</p>
                      <p>All tenant document reminders are up to date.</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif._id}
                        onClick={() => {
                          if (notif.tenantId) navigate(`/tenants/${notif.tenantId}`);
                          setIsOpen(false);
                        }}
                        className={`p-3.5 hover:bg-gray-50 transition cursor-pointer flex items-start justify-between gap-2 ${
                          !notif.isRead ? 'bg-amber-50/60 border-l-4 border-amber-500' : ''
                        }`}
                      >
                        <div className="space-y-1 pr-2">
                          <p className="text-xs font-bold text-gray-900 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                            {notif.title}
                          </p>
                          <p className="text-xs text-gray-600 leading-snug">{notif.message}</p>
                          <span className="text-[10px] text-gray-400 font-mono block">
                            {new Date(notif.createdAt).toLocaleDateString()} at{' '}
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!notif.isRead && (
                            <button
                              onClick={(e) => handleMarkRead(notif._id, e)}
                              title="Mark read"
                              className="p-1 rounded text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelete(notif._id, e)}
                            title="Delete alert"
                            className="p-1 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700/80 text-xs text-left">
            <div className="w-7 h-7 rounded-lg bg-[#04A26F] text-white flex items-center justify-center font-black text-xs shrink-0">
              {(user?.name || 'Fahad Rasheed')[0]}
            </div>
            <div className="hidden md:flex flex-col leading-tight">
              <span className="font-bold text-slate-200">{user?.name || 'Fahad Rasheed'}</span>
              <span className="text-[10px] text-slate-400 font-medium">{user?.role || 'Manager Accounts'}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700/80 cursor-pointer outline-none focus:ring-2 focus:ring-[#04A26F]"
            aria-label="Logout"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

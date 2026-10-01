import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Plus,
  ShoppingCart,
  User as UserIcon,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  Menu,
  ChevronDown,
  Shield,
  Briefcase,
  Users,
} from 'lucide-react';
import { User, UserRole, StockAlert } from '../../types';
import { storage } from '../../services/storage';
import { getRoleColor, normalizeUserRole } from '../../utils/authorization';

interface NavbarProps {
  user: User;
  onOpenSearch: () => void;
  onNavigate: (page: string) => void;
  onOpenStockIn: () => void;
  onLogout: () => void;
  onChangeRole?: (newRole: UserRole) => void;
  toggleSidebar: () => void;
  isDark: boolean;
  toggleDark: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenSearch,
  onNavigate,
  onOpenStockIn,
  onLogout,
  onChangeRole,
  toggleSidebar,
  isDark,
  toggleDark,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const safeRole = normalizeUserRole(user?.role);
  const roleColors = getRoleColor(safeRole);

  useEffect(() => {
    setAlerts(storage.getAlerts().filter((a) => a.status === 'ACTIVE'));
  }, [showNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const criticalCount = alerts.filter((a) => a.alertType === 'CRITICAL').length;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
      {/* Left: Mobile hamburger & Search trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle Navigation Menu"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-sm text-slate-500 transition-all hover:border-cyan-500 hover:bg-white hover:text-slate-800 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:border-cyan-500 dark:hover:bg-slate-800"
        >
          <Search className="h-4 w-4 text-slate-400 group-hover:text-cyan-600 dark:text-slate-500 dark:group-hover:text-cyan-400" />
          <span className="hidden sm:inline">Search products, SKU, invoices, customers...</span>
          <span className="sm:hidden">Search...</span>
          <kbd className="hidden rounded bg-slate-200/60 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 sm:inline dark:bg-slate-700/80 dark:text-slate-400">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Quick Actions, Notifications, Theme, User */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick New Sale POS Button */}
        <button
          onClick={() => onNavigate('pos')}
          className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 active:scale-95 transition-all"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New Sale</span>
        </button>

        {/* Quick Stock In Button */}
        <button
          onClick={onOpenStockIn}
          className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/70"
        >
          <Plus className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>Stock In</span>
        </button>

        {/* Dark / Light Toggle */}
        <button
          onClick={toggleDark}
          aria-label="Toggle Theme"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="View notifications"
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <Bell className="h-4 w-4" />
            {alerts.length > 0 && (
              <span className={`absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full ${criticalCount > 0 ? 'bg-rose-500 ring-2 ring-white dark:ring-slate-900' : 'bg-amber-500'}`} />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 px-1 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">Inventory Notifications</span>
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                    {alerts.length} active
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    onNavigate('alerts');
                  }}
                  className="text-xs font-medium text-cyan-600 hover:underline dark:text-cyan-400"
                >
                  View All
                </button>
              </div>

              <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto pt-1 dark:divide-slate-800/60">
                {alerts.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    <CheckCircle2 className="mx-auto mb-1.5 h-6 w-6 text-emerald-500" />
                    All stock levels are currently healthy!
                  </div>
                ) : (
                  alerts.slice(0, 5).map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => {
                        setShowNotifications(false);
                        onNavigate('alerts');
                      }}
                      className="group flex cursor-pointer items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <div className={`mt-0.5 rounded-md p-1.5 ${alert.alertType === 'CRITICAL' ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400'}`}>
                        <AlertTriangle className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate dark:text-slate-200">
                          {alert.productName}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-2 dark:text-slate-400">
                          {alert.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 text-xs font-bold text-white shadow-sm overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                user.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="hidden text-left md:block">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight truncate max-w-[120px]">
                  {user.name}
                </p>
                <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-extrabold border ${roleColors.bg} ${roleColors.text} ${roleColors.border}`}>
                  {safeRole}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                {user.storeName || 'Store Staff'}
              </p>
            </div>
            <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 md:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50">
              <div className="border-b border-slate-100 pb-2.5 px-2 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold border ${roleColors.bg} ${roleColors.text} ${roleColors.border}`}>
                    {safeRole}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate dark:text-slate-400 mt-0.5">{user.email}</p>
              </div>

              {/* Quick Role Switcher (for testing Authorization in UI) */}
              {onChangeRole && (
                <div className="py-2 px-1 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
                    Switch Active Role
                  </p>
                  <div className="grid grid-cols-3 gap-1">
                    {(['Admin', 'Manager', 'Cashier'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          onChangeRole(r);
                          setShowProfileMenu(false);
                        }}
                        className={`rounded-lg py-1 px-1.5 text-[10px] font-bold transition-all ${
                          user.role === r
                            ? 'bg-slate-900 text-white dark:bg-cyan-600'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="py-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onNavigate('settings');
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <UserIcon className="h-3.5 w-3.5" />
                  <span>Business Profile & Roles</span>
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onNavigate('inventory');
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Package className="h-3.5 w-3.5" />
                  <span>Manage Inventory</span>
                </button>
              </div>
              <div className="border-t border-slate-100 pt-1 dark:border-slate-800">
                <button
                  onClick={onLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

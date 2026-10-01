import React from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  Users,
  Truck,
  BarChart3,
  BellRing,
  Bot,
  Settings,
  PlusCircle,
  TrendingUp,
  X,
  Store,
  Lock,
} from 'lucide-react';
import { User, StockAlert } from '../../types';
import { hasPermission } from '../../utils/authorization';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
  alerts: StockAlert[];
  user?: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isOpen,
  onClose,
  alerts,
  user,
}) => {
  const activeAlertCount = alerts.filter((a) => a.status === 'ACTIVE').length;

  const role = user?.role || 'Admin';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'pos', label: 'Sales & POS', icon: ShoppingCart },
    { id: 'sales-history', label: 'Sales History', icon: Receipt },
    { id: 'customers', label: 'Customers', icon: Users },
    {
      id: 'suppliers',
      label: 'Suppliers',
      icon: Truck,
      minRole: 'Manager',
      locked: role === 'Cashier',
    },
    {
      id: 'reports',
      label: 'Reports & Profit',
      icon: BarChart3,
      minRole: 'Manager',
      locked: role === 'Cashier',
    },
    { id: 'alerts', label: 'Low Stock Alerts', icon: BellRing, badge: activeAlertCount },
    { id: 'ai-insights', label: 'StockFlow AI', icon: Bot, isSpecial: true },
    {
      id: 'settings',
      label: 'Settings & Roles',
      icon: Settings,
      minRole: 'Admin',
      locked: role !== 'Admin',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200/80 bg-white transition-transform duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-100 dark:border-slate-800">
          <div
            onClick={() => {
              onNavigate('dashboard');
              onClose();
            }}
            className="flex cursor-pointer items-center gap-2.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-md shadow-cyan-500/20">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                STOCK<span className="text-cyan-600 dark:text-cyan-400">FLOW</span>
              </span>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 leading-none">
                Inventory & POS
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Operations
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                  isActive
                    ? item.isSpecial
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/25'
                      : 'bg-slate-900 text-white shadow-sm dark:bg-cyan-600 dark:text-white'
                    : item.isSpecial
                    ? 'text-cyan-700 hover:bg-cyan-50 dark:text-cyan-300 dark:hover:bg-cyan-950/40'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                      isActive
                        ? 'text-white'
                        : item.isSpecial
                        ? 'text-cyan-600 dark:text-cyan-400'
                        : 'text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isActive
                        ? 'bg-white text-rose-600'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.isSpecial && !isActive && (
                  <span className="rounded bg-cyan-100 px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-300">
                    AI
                  </span>
                )}
                {item.locked && (
                  <span className="flex items-center gap-1 rounded bg-slate-200/70 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400" title={`Requires ${item.minRole} role`}>
                    <Lock className="h-2.5 w-2.5" />
                    <span>{item.minRole}</span>
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Action Footer Card */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/60 dark:bg-slate-800/60 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                System Status
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 leading-tight">
              Ready for high-speed POS scanning & real-time stock sync.
            </p>
            <button
              onClick={() => {
                onNavigate('pos');
                onClose();
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Launch POS</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

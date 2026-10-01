import React, { useState, useEffect } from 'react';
import {
  BellRing,
  AlertTriangle,
  ArrowDownRight,
  CheckCircle2,
  X,
  Filter,
  Check,
  Package,
} from 'lucide-react';
import { StockAlert } from '../types';
import { storage } from '../services/storage';

interface AlertsProps {
  onOpenStockIn: (productId: string) => void;
}

export const Alerts: React.FC<AlertsProps> = ({ onOpenStockIn }) => {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'RESOLVED' | 'ALL'>('ACTIVE');

  const refreshData = () => {
    setAlerts(storage.getAlerts());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleDismiss = (id: string) => {
    storage.dismissAlert(id);
    refreshData();
  };

  const handleResolve = (id: string) => {
    storage.resolveAlert(id);
    refreshData();
  };

  const filteredAlerts = alerts.filter((a) => {
    if (statusFilter === 'ALL') return true;
    return a.status === statusFilter;
  });

  const criticalCount = alerts.filter((a) => a.alertType === 'CRITICAL' && a.status === 'ACTIVE').length;
  const warningCount = alerts.filter((a) => a.alertType === 'WARNING' && a.status === 'ACTIVE').length;

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Low Stock Alerts & Notifications
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time automated warnings for items dropping below safe procurement thresholds.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800 text-xs">
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`rounded-lg px-3 py-1 font-semibold transition-all ${
              statusFilter === 'ACTIVE'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            Active ({criticalCount + warningCount})
          </button>
          <button
            onClick={() => setStatusFilter('RESOLVED')}
            className={`rounded-lg px-3 py-1 font-semibold transition-all ${
              statusFilter === 'RESOLVED'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            Resolved
          </button>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`rounded-lg px-3 py-1 font-semibold transition-all ${
              statusFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            All Logs
          </button>
        </div>
      </div>

      {/* Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900/60 dark:bg-rose-950/20">
          <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase">
            🔴 Critical Alerts
          </span>
          <p className="text-2xl font-extrabold text-rose-700 dark:text-rose-300 mt-1">
            {criticalCount}
          </p>
          <span className="text-[10px] text-rose-600 dark:text-rose-400">0 or critically low units</span>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase">
            🟡 Warning Alerts
          </span>
          <p className="text-2xl font-extrabold text-amber-700 dark:text-amber-300 mt-1">
            {warningCount}
          </p>
          <span className="text-[10px] text-amber-600 dark:text-amber-400">Below minimum buffer stock</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Automated Sync</span>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-2">
            Auto-triggered on sales & stock movements
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold">● Ledger linked</span>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No active stock alerts!</p>
            <p className="mt-1">All products are currently stocked at or above minimum safety levels.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.alertType === 'CRITICAL';

            return (
              <div
                key={alert.id}
                className={`rounded-2xl border p-4.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCritical
                    ? 'border-rose-200 bg-rose-50/30 dark:border-rose-900/40 dark:bg-rose-950/20'
                    : 'border-amber-200 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/20'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`rounded-xl p-2.5 shrink-0 ${
                      isCritical
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          isCritical
                            ? 'bg-rose-600 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {isCritical ? 'Critical' : 'Warning'}
                      </span>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                        {alert.productName}
                      </h3>
                      <span className="font-mono text-xs text-slate-400">({alert.sku})</span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      {alert.message}
                    </p>

                    <div className="mt-2 flex items-center gap-4 text-xs">
                      <span className="text-slate-500">
                        Current Stock: <strong className={isCritical ? 'text-rose-600' : 'text-amber-600'}>{alert.currentStock}</strong>
                      </span>
                      <span className="text-slate-500">
                        Minimum Stock Level: <strong>{alert.minimumStock}</strong>
                      </span>
                      {alert.status !== 'ACTIVE' && (
                        <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                          {alert.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => onOpenStockIn(alert.productId)}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition-all"
                  >
                    <ArrowDownRight className="h-4 w-4" />
                    <span>Restock Now</span>
                  </button>

                  {alert.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      title="Mark as Resolved"
                      className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 hover:text-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}

                  {alert.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleDismiss(alert.id)}
                      title="Dismiss Alert"
                      className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

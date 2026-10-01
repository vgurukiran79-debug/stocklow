import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Store,
  Receipt,
  Package,
  User,
  Database,
  Check,
  RotateCcw,
  Copy,
  ExternalLink,
  Shield,
  ShieldAlert,
  Users,
  Briefcase,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Business, User as UserType, UserRole } from '../types';
import { storage } from '../services/storage';
import { syncUserProfile } from '../services/firebase';
import { ROLE_PERMISSIONS, getRoleColor } from '../utils/authorization';

interface SettingsProps {
  onResetDemoData: () => void;
  currentUser?: UserType | null;
  onUpdateUser?: (user: UserType) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  onResetDemoData,
  currentUser,
  onUpdateUser,
}) => {
  const [business, setBusiness] = useState<Business>(storage.getBusiness());
  const [user, setUser] = useState<UserType>(currentUser || storage.getCurrentUser());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
      setUserName(currentUser.name);
      setUserEmail(currentUser.email);
      setUserRole(currentUser.role || 'Admin');
    }
  }, [currentUser]);

  // Business form state
  const [name, setName] = useState(business.name);
  const [ownerName, setOwnerName] = useState(business.ownerName);
  const [email, setEmail] = useState(business.email);
  const [phone, setPhone] = useState(business.phone);
  const [address, setAddress] = useState(business.address);
  const [gstNumber, setGstNumber] = useState(business.gstNumber);
  const [currency, setCurrency] = useState(business.currency || '₹');
  const [taxRate, setTaxRate] = useState<string>(business.taxRate.toString());
  const [invoicePrefix, setInvoicePrefix] = useState(business.invoicePrefix);
  const [invoiceFooter, setInvoiceFooter] = useState(business.invoiceFooter);
  const [defaultMinStock, setDefaultMinStock] = useState<string>(business.defaultMinStock.toString());

  // User profile state
  const [userName, setUserName] = useState(user.name);
  const [userEmail, setUserEmail] = useState(user.email);
  const [userRole, setUserRole] = useState<UserRole>(user.role || 'Admin');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedBiz = storage.updateBusiness({
      name: name.trim(),
      ownerName: ownerName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      gstNumber: gstNumber.trim(),
      currency: currency.trim(),
      taxRate: parseFloat(taxRate) || 18,
      invoicePrefix: invoicePrefix.trim().toUpperCase(),
      invoiceFooter: invoiceFooter.trim(),
      defaultMinStock: parseInt(defaultMinStock, 10) || 5,
    });

    const updatedUser = storage.updateCurrentUser({
      name: userName.trim(),
      email: userEmail.trim(),
      role: userRole,
    });
    syncUserProfile(updatedUser).catch(() => {});
    if (onUpdateUser) onUpdateUser(updatedUser);

    setBusiness(updatedBiz);
    setUser(updatedUser);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const sqlSchema = storage.getPostgresSchema();

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            System Settings & Profile
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure enterprise tax rules, invoice layouts, store identity, and database schemas.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
            <Check className="h-4 w-4" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business Information Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Store className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Business & Store Identity
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Business Legal Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Store Owner / Manager Name
              </label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Store Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                GSTIN / Tax ID
              </label>
              <input
                type="text"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                className="w-full uppercase font-mono rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Store Physical Address
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {/* Invoice & Tax Settings */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Receipt className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Invoice & Tax Settings
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Invoice Number Prefix
              </label>
              <input
                type="text"
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                placeholder="INV"
                className="w-full uppercase font-mono rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Standard GST Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="18"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="₹"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Invoice Footer Note / Return Policy
            </label>
            <input
              type="text"
              value={invoiceFooter}
              onChange={(e) => setInvoiceFooter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {/* Inventory Alert Thresholds */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Package className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Inventory Alert Thresholds
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Default Minimum Stock Reorder Point
              </label>
              <input
                type="number"
                min="1"
                value={defaultMinStock}
                onChange={(e) => setDefaultMinStock(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Items falling at or below this number automatically raise a stock warning.
              </p>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <User className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              User Profile
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Operator Full Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Operator Email
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Assigned Authorization Role
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['Admin', 'Manager', 'Cashier'] as UserRole[]).map((r) => {
                const color = getRoleColor(r);
                const isSelected = userRole === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setUserRole(r)}
                    className={`rounded-2xl border p-3.5 text-left transition-all ${
                      isSelected
                        ? `border-cyan-500 bg-cyan-50/50 shadow-sm dark:bg-cyan-950/30`
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold border ${color.bg} ${color.text} ${color.border}`}>
                        {r}
                      </span>
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {r === 'Admin' && 'Full store control, financial reports, tax & team management.'}
                      {r === 'Manager' && 'Catalog edits, inventory stock in/out, sales, and analytics.'}
                      {r === 'Cashier' && 'High-speed POS billing, receipt print, customer CRM only.'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Role-Based Access Control (RBAC) Permission Matrix */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Authorization & Role Security Matrix
              </h2>
              <p className="text-xs text-slate-500">
                Summary of operational permissions enforced across all store modules
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-2.5 px-3">System Permission</th>
                  <th className="py-2.5 px-3 text-center">Admin</th>
                  <th className="py-2.5 px-3 text-center">Manager</th>
                  <th className="py-2.5 px-3 text-center">Cashier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">Point of Sale (POS) & Receipt Invoicing</td>
                  <td className="py-2.5 px-3 text-center text-emerald-500 font-bold">✓ Allowed</td>
                  <td className="py-2.5 px-3 text-center text-emerald-500 font-bold">✓ Allowed</td>
                  <td className="py-2.5 px-3 text-center text-emerald-500 font-bold">✓ Allowed</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">Catalog Product Management (Create / Edit)</td>
                  <td className="py-2.5 px-3 text-center text-emerald-500 font-bold">✓ Allowed</td>
                  <td className="py-2.5 px-3 text-center text-emerald-500 font-bold">✓ Allowed</td>
                  <td className="py-2.5 px-3 text-center text-rose-500">✕ Denied (Read-Only)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">Direct Stock Adjustments (Stock In / Damage Out)</td>
                  <td className="py-2.5 px-3 text-center text-emerald-500 font-bold">✓ Allowed</td>
                  <td className="py-2.5 px-3 text-center text-emerald-500 font-bold">✓ Allowed</td>
                  <td className="py-2.5 px-3 text-center text-rose-500">✕ Denied</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">Financial Profit & Cost Margin Reports</td>
                  <td className="py-2.5 px-3 text-center text-emerald-500 font-bold">✓ Allowed</td>
                  <td className="py-2.5 px-3 text-center text-emerald-500 font-bold">✓ Allowed</td>
                  <td className="py-2.5 px-3 text-center text-rose-500">✕ Masked</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">Supplier Procurement & Vendor CRM</td>
                  <td className="py-2.5 px-3 text-center text-emerald-500 font-bold">✓ Allowed</td>
                  <td className="py-2.5 px-3 text-center text-emerald-500 font-bold">✓ Allowed</td>
                  <td className="py-2.5 px-3 text-center text-rose-500">✕ Denied</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">Store Settings & Tax Rate Configuration</td>
                  <td className="py-2.5 px-3 text-center text-emerald-500 font-bold">✓ Allowed</td>
                  <td className="py-2.5 px-3 text-center text-rose-500">✕ Denied</td>
                  <td className="py-2.5 px-3 text-center text-rose-500">✕ Denied</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">Database Clear Slate & Purge</td>
                  <td className="py-2.5 px-3 text-center text-emerald-500 font-bold">✓ Allowed</td>
                  <td className="py-2.5 px-3 text-center text-rose-500">✕ Denied</td>
                  <td className="py-2.5 px-3 text-center text-rose-500">✕ Denied</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Save Changes Button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-cyan-700 active:scale-95 transition-all"
          >
            <Check className="h-4 w-4" />
            <span>Save All Settings</span>
          </button>
        </div>
      </form>

      {/* Database Schema & Supabase Architecture */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Database className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                PostgreSQL & Supabase Architecture Schema
              </h2>
              <p className="text-xs text-slate-500">
                Production-grade DDL SQL script ready to deploy in any Supabase / PostgreSQL instance
              </p>
            </div>
          </div>

          <button
            onClick={handleCopySql}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {copiedSql ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Schema'}</span>
          </button>
        </div>

        <div className="rounded-xl bg-slate-950 p-4 overflow-x-auto max-h-60 border border-slate-800">
          <pre className="font-mono text-[11px] text-slate-300 leading-relaxed">
            {sqlSchema}
          </pre>
        </div>
      </div>

      {/* Clear Data Card */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50/30 p-6 dark:border-rose-900/40 dark:bg-rose-950/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
            Clear Store Data & Start Fresh
          </h3>
          <p className="text-xs text-rose-700/80 dark:text-rose-300/80 mt-0.5">
            Wipes all products, sales invoices, customer orders, and inventory audit logs so you can enter your clean business data.
          </p>
        </div>

        {isConfirmingClear ? (
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                onResetDemoData();
                setIsConfirmingClear(false);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 active:scale-95 transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Yes, Wipe All & Start Fresh</span>
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmingClear(false)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsConfirmingClear(true)}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 active:scale-95 transition-all self-start sm:self-auto shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Clear All Data (Clean Slate)</span>
          </button>
        )}
      </div>
    </div>
  );
};

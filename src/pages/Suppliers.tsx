import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Building,
  DollarSign,
  Package,
  Edit,
  Trash2,
  ArrowDownRight,
  X,
} from 'lucide-react';
import { Supplier, Product, InventoryTransaction } from '../types';
import { storage } from '../services/storage';
import { formatCurrency, formatDate } from '../utils/formatters';

interface SuppliersProps {
  onOpenAddSupplier: () => void;
  onEditSupplier: (supplier: Supplier) => void;
  onOpenStockIn: () => void;
}

export const Suppliers: React.FC<SuppliersProps> = ({
  onOpenAddSupplier,
  onEditSupplier,
  onOpenStockIn,
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const refreshData = () => {
    setSuppliers(storage.getSuppliers());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleDelete = (id: string, company: string) => {
    if (confirm(`Are you sure you want to remove supplier "${company}"?`)) {
      storage.deleteSupplier(id);
      refreshData();
      if (selectedSupplier?.id === id) setSelectedSupplier(null);
    }
  };

  const filteredSuppliers = suppliers.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      s.company.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.phone.toLowerCase().includes(q) ||
      s.gstNumber.toLowerCase().includes(q)
    );
  });

  // Calculate supplied products count and list
  const allProducts = storage.getProducts().filter((p) => p.isActive);
  const supplierProducts = selectedSupplier
    ? allProducts.filter((p) => p.supplierId === selectedSupplier.id)
    : [];

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Suppliers & Procurement Vendors
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage wholesale distributors, procurement contracts, GST numbers, and catalog stock origin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenStockIn}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <ArrowDownRight className="h-4 w-4 text-emerald-600" />
            <span>Stock In</span>
          </button>
          <button
            onClick={onOpenAddSupplier}
            className="flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-cyan-700 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search suppliers by company name, contact person, or GSTIN..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.length === 0 ? (
          <div className="col-span-3 rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900">
            <Truck className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">No suppliers found</p>
            <p className="mt-1">Add wholesale distributors to track procurement purchases.</p>
          </div>
        ) : (
          filteredSuppliers.map((sup) => {
            const suppliedProds = allProducts.filter((p) => p.supplierId === sup.id);

            return (
              <div
                key={sup.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold text-xs">
                        <Truck className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                          {sup.company}
                        </h3>
                        <p className="text-[11px] text-slate-500">{sup.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditSupplier(sup)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(sup.id, sup.company)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Contact info details */}
                  <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{sup.phone}</span>
                    </div>
                    {sup.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{sup.email}</span>
                      </div>
                    )}
                    {sup.gstNumber && (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded dark:bg-slate-800">
                          GST: {sup.gstNumber}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom stats */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Purchases</p>
                    <p className="font-extrabold text-slate-900 dark:text-white text-sm">
                      {formatCurrency(sup.totalPurchases || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold text-center">Products</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-center">
                      {suppliedProds.length} SKUs
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedSupplier(sup)}
                    className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Catalog →
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Supplier Catalog Modal */}
      {selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-auto dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 font-bold text-xs">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {selectedSupplier.company}
                  </h3>
                  <p className="text-xs text-slate-500">Contact: {selectedSupplier.name} · {selectedSupplier.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSupplier(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold uppercase tracking-wider text-slate-400">
                  Supplied Products ({supplierProducts.length})
                </span>
                <span className="text-slate-500 font-semibold">
                  GSTIN: {selectedSupplier.gstNumber}
                </span>
              </div>

              {supplierProducts.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  No active catalog items mapped to this supplier yet.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto text-xs">
                  {supplierProducts.map((p) => (
                    <div key={p.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{p.name}</p>
                        <p className="font-mono text-[10px] text-slate-400">SKU: {p.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900 dark:text-white">
                          Cost: {formatCurrency(p.purchasePrice)}
                        </p>
                        <p className="text-[10px] text-slate-500">Stock: {p.quantity} {p.unit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

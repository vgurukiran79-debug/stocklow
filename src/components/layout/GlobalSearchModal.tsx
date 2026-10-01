import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Package, User, Truck, Receipt, ArrowRight, CornerDownLeft } from 'lucide-react';
import { storage } from '../../services/storage';
import { Product, Customer, Supplier, Sale } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  onSelectSale: (sale: Sale) => void;
  onNavigate: (page: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  onSelectSale,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent or shortcut
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const products = q
    ? storage.getProducts().filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      )
    : [];

  const customers = q
    ? storage.getCustomers().filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      )
    : [];

  const suppliers = q
    ? storage.getSuppliers().filter(
        (s) =>
          s.company.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.phone.toLowerCase().includes(q)
      )
    : [];

  const sales = q
    ? storage.getSales().filter(
        (s) =>
          s.invoiceNumber.toLowerCase().includes(q) ||
          s.customerName.toLowerCase().includes(q)
      )
    : [];

  const totalResults = products.length + customers.length + suppliers.length + sales.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        {/* Search Input Box */}
        <div className="flex items-center border-b border-slate-200 px-4 dark:border-slate-800">
          <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by product name, SKU, barcode, customer, or invoice #..."
            className="w-full bg-transparent px-3 py-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white dark:placeholder:text-slate-500"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-2 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!q && (
            <div className="py-8 text-center text-xs text-slate-400">
              <p className="font-medium text-slate-600 dark:text-slate-400">Quick Global Search</p>
              <p className="mt-1">Type anything to instantly find products, customer records, supplier profiles or invoice histories.</p>
            </div>
          )}

          {q && totalResults === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching records found for "{query}". Try checking the SKU or invoice number.
            </div>
          )}

          {/* Products Results */}
          {products.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <Package className="h-3 w-3" /> Products ({products.length})
              </div>
              <div className="space-y-1">
                {products.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectProduct(p);
                      onClose();
                    }}
                    className="flex cursor-pointer items-center justify-between rounded-xl p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <Package className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">{p.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          SKU: {p.sku} · Barcode: {p.barcode} · Stock: {p.quantity} {p.unit}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {formatCurrency(p.sellingPrice)}
                      </p>
                      <span className={`text-[10px] font-semibold ${p.quantity === 0 ? 'text-rose-600' : p.quantity <= p.minimumStock ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {p.quantity === 0 ? 'Out of Stock' : p.quantity <= p.minimumStock ? 'Low Stock' : 'In Stock'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sales Invoices Results */}
          {sales.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <Receipt className="h-3 w-3" /> Invoices ({sales.length})
              </div>
              <div className="space-y-1">
                {sales.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      onSelectSale(s);
                      onClose();
                    }}
                    className="flex cursor-pointer items-center justify-between rounded-xl p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">
                          {s.invoiceNumber}
                        </span>
                        <span className="text-xs text-slate-700 dark:text-slate-300">
                          {s.customerName}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {s.items.length} items · {s.paymentMethod} · {s.paymentStatus}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {formatCurrency(s.total)}
                      </p>
                      <span className="text-[10px] text-slate-400">View Invoice →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers Results */}
          {customers.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <User className="h-3 w-3" /> Customers ({customers.length})
              </div>
              <div className="space-y-1">
                {customers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onNavigate('customers');
                      onClose();
                    }}
                    className="flex cursor-pointer items-center justify-between rounded-xl p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">{c.name}</p>
                      <p className="text-[11px] text-slate-500">{c.phone} · {c.email}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {c.totalOrders} orders
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suppliers Results */}
          {suppliers.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <Truck className="h-3 w-3" /> Suppliers ({suppliers.length})
              </div>
              <div className="space-y-1">
                {suppliers.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      onNavigate('suppliers');
                      onClose();
                    }}
                    className="flex cursor-pointer items-center justify-between rounded-xl p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">{s.company}</p>
                      <p className="text-[11px] text-slate-500">Contact: {s.name} · {s.phone}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        GST: {s.gstNumber}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
          <span>Navigate using search keywords</span>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded bg-slate-200 px-1 py-0.5 text-[10px] dark:bg-slate-700">ESC</kbd> to close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

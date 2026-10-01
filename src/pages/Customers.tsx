import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingBag,
  DollarSign,
  Edit,
  Trash2,
  Receipt,
  X,
} from 'lucide-react';
import { Customer, Sale } from '../types';
import { storage } from '../services/storage';
import { formatCurrency, formatDate } from '../utils/formatters';

interface CustomersProps {
  onOpenAddCustomer: () => void;
  onEditCustomer: (customer: Customer) => void;
  onSelectSale: (sale: Sale) => void;
}

export const Customers: React.FC<CustomersProps> = ({
  onOpenAddCustomer,
  onEditCustomer,
  onSelectSale,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const refreshData = () => {
    setCustomers(storage.getCustomers());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove customer "${name}"?`)) {
      storage.deleteCustomer(id);
      refreshData();
      if (selectedCustomer?.id === id) setSelectedCustomer(null);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q)
    );
  });

  // Purchase history for selected customer
  const customerSales = selectedCustomer
    ? storage.getSales().filter((s) => s.customerId === selectedCustomer.id)
    : [];

  const avgOrderValue = selectedCustomer && selectedCustomer.totalOrders > 0
    ? Math.round(selectedCustomer.totalSpent / selectedCustomer.totalOrders)
    : 0;

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Customer Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage buyer profiles, lifetime customer spending, order frequency, and loyalty records.
          </p>
        </div>

        <button
          onClick={onOpenAddCustomer}
          className="flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-cyan-700 active:scale-95 transition-all self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4" />
          <span>+ Add Customer</span>
        </button>
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers by name, phone number, email, or address..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* Main Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-3 rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900">
            <Users className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">No customers found</p>
            <p className="mt-1">Add regular buyers to personalize counter invoices and track repeat sales.</p>
          </div>
        ) : (
          filteredCustomers.map((cust) => (
            <div
              key={cust.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-sm font-bold text-white shadow-xs">
                      {cust.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                        {cust.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{cust.phone}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditCustomer(cust)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cust.id, cust.name)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Contact info details */}
                <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 pt-3 dark:border-slate-800">
                  {cust.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{cust.email}</span>
                    </div>
                  )}
                  {cust.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 text-[11px] text-slate-500">{cust.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Lifetime stats */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Spent</p>
                  <p className="font-extrabold text-cyan-700 dark:text-cyan-400 text-sm">
                    {formatCurrency(cust.totalSpent)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold text-center">Orders</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-center">
                    {cust.totalOrders}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCustomer(cust)}
                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  History →
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Customer Purchase History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-auto dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-600 text-white font-bold text-xs">
                  {selectedCustomer.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {selectedCustomer.name}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedCustomer.phone} · {selectedCustomer.email || 'No email'}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Lifetime stats strip */}
              <div className="grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-3 text-center border border-slate-200 dark:bg-slate-800/40 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Orders</span>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedCustomer.totalOrders}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Spent</span>
                  <p className="text-lg font-bold text-cyan-600 dark:text-cyan-400">{formatCurrency(selectedCustomer.totalSpent)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Avg Order Value</span>
                  <p className="text-lg font-bold text-emerald-600">{formatCurrency(avgOrderValue)}</p>
                </div>
              </div>

              {/* Order history table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Order Invoices History
                </h4>
                {customerSales.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-400">
                    No orders linked specifically to this customer account yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400">
                          <th className="py-2">Invoice #</th>
                          <th className="py-2">Date</th>
                          <th className="py-2">Items</th>
                          <th className="py-2 text-right">Total</th>
                          <th className="py-2 text-center">Status</th>
                          <th className="py-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {customerSales.map((sale) => (
                          <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-2 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                              {sale.invoiceNumber}
                            </td>
                            <td className="py-2 text-slate-500">{formatDate(sale.createdAt)}</td>
                            <td className="py-2 text-slate-600 dark:text-slate-300">
                              {sale.items.length} items
                            </td>
                            <td className="py-2 text-right font-bold text-slate-900 dark:text-white">
                              {formatCurrency(sale.total)}
                            </td>
                            <td className="py-2 text-center">
                              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                {sale.paymentStatus}
                              </span>
                            </td>
                            <td className="py-2 text-right">
                              <button
                                onClick={() => {
                                  setSelectedCustomer(null);
                                  onSelectSale(sale);
                                }}
                                className="text-cyan-600 hover:underline font-semibold"
                              >
                                View Invoice
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

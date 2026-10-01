import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Eye,
  Printer,
  RotateCcw,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { Sale } from '../types';
import { storage } from '../services/storage';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';

interface SalesHistoryProps {
  onSelectSale: (sale: Sale) => void;
  onOpenReturn: (sale: Sale) => void;
  onNavigateToPOS: () => void;
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({
  onSelectSale,
  onOpenReturn,
  onNavigateToPOS,
}) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');

  const refreshData = () => {
    setSales(storage.getSales());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Filter
  const filteredSales = sales.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.invoiceNumber.toLowerCase().includes(q) ||
      s.customerName.toLowerCase().includes(q) ||
      s.customerPhone?.toLowerCase().includes(q) ||
      s.items.some((i) => i.productName.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q));

    const matchesPayment = selectedPayment === 'all' || s.paymentMethod === selectedPayment;

    let matchesDate = true;
    if (selectedDateFilter === 'today') {
      matchesDate = new Date(s.createdAt).toDateString() === new Date().toDateString();
    } else if (selectedDateFilter === 'week') {
      const weekAgo = Date.now() - 7 * 86400000;
      matchesDate = new Date(s.createdAt).getTime() >= weekAgo;
    } else if (selectedDateFilter === 'month') {
      const monthAgo = Date.now() - 30 * 86400000;
      matchesDate = new Date(s.createdAt).getTime() >= monthAgo;
    }

    return matchesSearch && matchesPayment && matchesDate;
  });

  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
  const totalProfit = filteredSales.reduce((acc, s) => acc + s.profit, 0);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Invoice #', 'Customer', 'Phone', 'Date', 'Items Count', 'Subtotal', 'Tax', 'Total Amount', 'Profit', 'Payment Method', 'Payment Status'];
    const rows = filteredSales.map((s) => [
      s.invoiceNumber,
      `"${s.customerName.replace(/"/g, '""')}"`,
      s.customerPhone || '',
      s.createdAt,
      s.items.length,
      s.subtotal,
      s.tax,
      s.total,
      s.profit,
      s.paymentMethod,
      s.paymentStatus,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `StockFlow_Sales_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Sales & Invoice History
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit trail of completed sales, receipts, GST breakdowns, and customer returns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onNavigateToPOS}
            className="flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-cyan-700 active:scale-95 transition-all"
          >
            <Receipt className="h-4 w-4" />
            <span>+ New Sale (POS)</span>
          </button>
        </div>
      </div>

      {/* Metrics strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Filtered Orders</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {filteredSales.length}
          </p>
          <span className="text-[10px] text-slate-500">Invoices on record</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Filtered Revenue</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalRevenue)}
          </p>
          <span className="text-[10px] text-slate-500">Gross customer billings</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase">Gross Profit</span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
            {formatCurrency(totalProfit)}
          </p>
          <span className="text-[10px] text-slate-500">Net after product costs</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by invoice #, customer name, or product item..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex w-full sm:w-auto items-center gap-2">
            <select
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
            </select>

            <select
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="all">All Payment Modes</option>
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sales Invoices Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Items Purchased</th>
                <th className="py-3 px-3 text-right">Total Amount</th>
                <th className="py-3 px-3 text-right">Profit</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-slate-400">
                    <Receipt className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No sales records found</p>
                    <p className="mt-1">Use the POS module to create your first customer sale.</p>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Invoice Number */}
                    <td className="py-3 px-4 font-mono font-bold text-cyan-600 dark:text-cyan-400 whitespace-nowrap">
                      {sale.invoiceNumber}
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-900 dark:text-white">{sale.customerName}</p>
                      {sale.customerPhone && (
                        <p className="text-[10px] text-slate-400">{sale.customerPhone}</p>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {formatDate(sale.createdAt)}
                    </td>

                    {/* Items Summary */}
                    <td className="py-3 px-3">
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {sale.items.length} {sale.items.length === 1 ? 'item' : 'items'}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate max-w-xs">
                        {sale.items.map((i) => `${i.productName} (${i.quantity})`).join(', ')}
                      </p>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3 px-3 text-right font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(sale.total)}
                    </td>

                    {/* Profit */}
                    <td className="py-3 px-3 text-right font-bold text-emerald-600">
                      +{formatCurrency(sale.profit)}
                    </td>

                    {/* Payment Method */}
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {sale.paymentMethod}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        ● {sale.paymentStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectSale(sale)}
                          title="View / Print Tax Invoice"
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => onOpenReturn(sale)}
                          title="Process Return & Restock"
                          className="flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50/60 px-2 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Return</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

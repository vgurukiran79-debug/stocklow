import React, { useRef } from 'react';
import { Printer, Download, X, CheckCircle2, Share2, Store } from 'lucide-react';
import { Sale, Business } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

interface InvoiceModalProps {
  sale: Sale | null;
  business: Business;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ sale, business, onClose }) => {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-auto dark:border-slate-800 dark:bg-slate-900">
        {/* Header Action Bar (Hidden when printing) */}
        <div className="no-print flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Sale Receipt: {sale.invoiceNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-cyan-700 active:scale-95 transition-all"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Area */}
        <div id="printable-invoice" className="p-6 sm:p-8 bg-white text-slate-900">
          {/* Top Brand & Invoice Metadata */}
          <div className="flex flex-col sm:flex-row items-start justify-between border-b border-slate-200 pb-6 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-sm">
                  SF
                </div>
                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  STOCK<span className="text-cyan-600">FLOW</span>
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Digital Inventory & Sales Management
              </p>
              <div className="pt-2 text-xs text-slate-600 space-y-0.5">
                <p className="font-bold text-slate-800">{business.name}</p>
                <p>{business.address}</p>
                <p>Phone: {business.phone} · Email: {business.email}</p>
                {business.gstNumber && <p className="font-semibold text-slate-700">GSTIN: {business.gstNumber}</p>}
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="inline-block rounded bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-800 border border-cyan-200">
                TAX INVOICE
              </span>
              <p className="text-sm font-mono font-bold text-slate-900 mt-2">
                {sale.invoiceNumber}
              </p>
              <p className="text-xs text-slate-500">
                Date: {formatDateTime(sale.createdAt)}
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                  ● {sale.paymentStatus.toUpperCase()} ({sale.paymentMethod})
                </span>
              </div>
            </div>
          </div>

          {/* Billed To / Customer Info */}
          <div className="py-4 border-b border-slate-200 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Customer Details
            </span>
            <div className="flex flex-col sm:flex-row justify-between pt-1">
              <div>
                <p className="font-bold text-slate-900 text-sm">{sale.customerName}</p>
                {sale.customerPhone && <p className="text-slate-500">Phone: {sale.customerPhone}</p>}
              </div>
              {sale.notes && (
                <div className="mt-1 sm:mt-0 text-slate-500 sm:text-right max-w-xs">
                  <span className="font-semibold text-slate-700">Notes:</span> {sale.notes}
                </div>
              )}
            </div>
          </div>

          {/* Products Line Items Table */}
          <div className="py-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-300 text-[11px] font-bold uppercase text-slate-600">
                  <th className="py-2">Item Description</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Price</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sale.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5">
                      <p className="font-semibold text-slate-800">{item.productName}</p>
                      <p className="font-mono text-[10px] text-slate-400">{item.sku}</p>
                    </td>
                    <td className="py-2.5 text-center font-medium text-slate-700">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 text-right font-medium text-slate-700">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-2.5 text-right font-bold text-slate-900">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculation Summary */}
          <div className="border-t border-slate-300 pt-4 flex flex-col items-end text-xs space-y-1.5">
            <div className="flex w-64 justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold">{formatCurrency(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex w-64 justify-between text-emerald-600">
                <span>Discount Applied:</span>
                <span className="font-semibold">-{formatCurrency(sale.discount)}</span>
              </div>
            )}
            <div className="flex w-64 justify-between text-slate-600">
              <span>GST / Tax ({business.taxRate}%):</span>
              <span className="font-semibold">{formatCurrency(sale.tax)}</span>
            </div>
            <div className="flex w-64 justify-between border-t border-slate-300 pt-2 text-base font-extrabold text-slate-900">
              <span>Grand Total:</span>
              <span className="text-cyan-700">{formatCurrency(sale.total)}</span>
            </div>
          </div>

          {/* Footer note & greeting */}
          <div className="mt-8 border-t border-slate-200 pt-4 text-center text-xs text-slate-500">
            <p className="font-semibold text-slate-700">{business.invoiceFooter}</p>
            <p className="mt-1 text-[11px] text-slate-400">
              Tracked & Managed with STOCKFLOW Digital Inventory Engine.
            </p>
          </div>
        </div>

        {/* Modal Bottom buttons */}
        <div className="no-print flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-700"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};

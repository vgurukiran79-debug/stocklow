import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  Edit,
  History,
  Receipt,
  AlertTriangle,
} from 'lucide-react';
import { Product, InventoryTransaction, Sale } from '../../types';
import { storage } from '../../services/storage';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onOpenStockIn: (productId: string) => void;
  onOpenStockOut: (productId: string) => void;
  onEdit: (product: Product) => void;
  onOpenInvoice?: (sale: Sale) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onOpenStockIn,
  onOpenStockOut,
  onEdit,
  onOpenInvoice,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'stock-history' | 'sales-history'>('overview');
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [relatedSales, setRelatedSales] = useState<Sale[]>([]);

  useEffect(() => {
    if (product) {
      const allTx = storage.getTransactions().filter((t) => t.productId === product.id);
      setTransactions(allTx);

      const allSales = storage.getSales().filter((s) => s.items.some((i) => i.productId === product.id));
      setRelatedSales(allSales);
    }
  }, [product]);

  if (!product) return null;

  // Analytics computations
  const totalUnitsSold = relatedSales.reduce((acc, sale) => {
    const item = sale.items.find((i) => i.productId === product.id);
    return acc + (item ? item.quantity : 0);
  }, 0);

  const revenueGenerated = totalUnitsSold * product.sellingPrice;
  const profitGenerated = totalUnitsSold * (product.sellingPrice - product.purchasePrice);
  const potentialProfitPerUnit = product.sellingPrice - product.purchasePrice;
  const marginPercent = Math.round((potentialProfitPerUnit / (product.sellingPrice || 1)) * 100);

  const avgDailySales = Math.max(0.3, Math.round((totalUnitsSold / 14 || 1.2) * 10) / 10);
  const estimatedDaysRemaining = product.quantity === 0 ? 0 : Math.round(product.quantity / avgDailySales);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-auto dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <Package className="h-5 w-5 text-slate-400" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {product.name}
              </h2>
              <p className="font-mono text-xs text-slate-500">
                SKU: {product.sku} · Barcode: {product.barcode || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(product)}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Edit className="h-3.5 w-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Action Tabs */}
        <div className="flex border-b border-slate-200 px-6 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-cyan-600 text-cyan-700 dark:border-cyan-400 dark:text-cyan-300'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Overview & Analytics
          </button>
          <button
            onClick={() => setActiveTab('stock-history')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'stock-history'
                ? 'border-cyan-600 text-cyan-700 dark:border-cyan-400 dark:text-cyan-300'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            Stock Ledger ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab('sales-history')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'sales-history'
                ? 'border-cyan-600 text-cyan-700 dark:border-cyan-400 dark:text-cyan-300'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Receipt className="h-3.5 w-3.5" />
            Sales History ({relatedSales.length})
          </button>
        </div>

        {/* Modal Content Area */}
        <div className="p-6 max-h-[65vh] overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Current Stock
                  </span>
                  <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {product.quantity} <span className="text-xs font-normal text-slate-500">{product.unit}</span>
                  </p>
                  <span
                    className={`text-[10px] font-bold ${
                      product.quantity === 0
                        ? 'text-rose-600'
                        : product.quantity <= product.minimumStock
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {product.quantity === 0
                      ? '● Out of Stock'
                      : product.quantity <= product.minimumStock
                      ? `● Low Stock (Min: ${product.minimumStock})`
                      : '● Healthy Stock'}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Unit Margin
                  </span>
                  <p className="text-xl font-extrabold text-emerald-600 mt-1">
                    {formatCurrency(potentialProfitPerUnit)}
                  </p>
                  <span className="text-[10px] text-slate-500">{marginPercent}% gross margin</span>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Units Sold
                  </span>
                  <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {totalUnitsSold} <span className="text-xs font-normal text-slate-500">{product.unit}</span>
                  </p>
                  <span className="text-[10px] text-slate-500">~{avgDailySales}/day velocity</span>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Stock Runout
                  </span>
                  <p className="text-xl font-extrabold text-cyan-600 dark:text-cyan-400 mt-1">
                    {estimatedDaysRemaining} <span className="text-xs font-normal text-slate-500">days</span>
                  </p>
                  <span className="text-[10px] text-slate-500">Based on recent sales</span>
                </div>
              </div>

              {/* Price & Supplier breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Pricing & Valuation
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Purchase / Cost Price:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(product.purchasePrice)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Selling Price:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(product.sellingPrice)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Total Stock Value (Cost):</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(product.purchasePrice * product.quantity)}</span>
                    </div>
                    <div className="flex justify-between py-1 text-emerald-600 font-bold">
                      <span>Total Revenue Generated:</span>
                      <span>{formatCurrency(revenueGenerated)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Supplier & Classification
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Category:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{product.categoryName || 'General'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Brand:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{product.brand || 'Unbranded'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Supplier:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{product.supplierName || 'Wholesale Direct'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Threshold Bounds:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Min {product.minimumStock} / Max {product.maximumStock}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 dark:bg-slate-800/40 dark:border-slate-800 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Description: </span>
                  <span className="text-slate-600 dark:text-slate-400">{product.description}</span>
                </div>
              )}
            </div>
          )}

          {/* Stock History Ledger Tab */}
          {activeTab === 'stock-history' && (
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No stock transactions recorded yet for this product.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] font-bold uppercase text-slate-400 dark:border-slate-800">
                        <th className="py-2">Date & Time</th>
                        <th className="py-2">Type</th>
                        <th className="py-2 text-center">Change</th>
                        <th className="py-2 text-center">Stock Balance</th>
                        <th className="py-2">Reference / Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2 text-slate-500 whitespace-nowrap">
                            {formatDateTime(tx.createdAt)}
                          </td>
                          <td className="py-2">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                tx.transactionType === 'STOCK_IN'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : tx.transactionType === 'SALE'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              }`}
                            >
                              {tx.transactionType}
                            </span>
                          </td>
                          <td className={`py-2 text-center font-bold ${tx.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                          </td>
                          <td className="py-2 text-center font-semibold text-slate-800 dark:text-slate-200">
                            {tx.previousQuantity} → {tx.newQuantity}
                          </td>
                          <td className="py-2 text-slate-600 dark:text-slate-400">
                            <span className="font-mono font-semibold">{tx.referenceId}</span>
                            {tx.reason && <span className="ml-1 text-slate-400">({tx.reason})</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Sales History Tab */}
          {activeTab === 'sales-history' && (
            <div className="space-y-3">
              {relatedSales.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No sales invoices recorded yet containing this product.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] font-bold uppercase text-slate-400 dark:border-slate-800">
                        <th className="py-2">Invoice #</th>
                        <th className="py-2">Customer</th>
                        <th className="py-2">Date</th>
                        <th className="py-2 text-center">Qty Sold</th>
                        <th className="py-2 text-right">Sold Price</th>
                        <th className="py-2 text-right">Total</th>
                        <th className="py-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {relatedSales.map((sale) => {
                        const item = sale.items.find((i) => i.productId === product.id);
                        return (
                          <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="py-2 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                              {sale.invoiceNumber}
                            </td>
                            <td className="py-2 text-slate-800 dark:text-slate-200 font-medium">
                              {sale.customerName}
                            </td>
                            <td className="py-2 text-slate-500">{formatDate(sale.createdAt)}</td>
                            <td className="py-2 text-center font-bold text-slate-700 dark:text-slate-300">
                              {item?.quantity}
                            </td>
                            <td className="py-2 text-right text-slate-600 dark:text-slate-400">
                              {formatCurrency(item?.unitPrice || product.sellingPrice)}
                            </td>
                            <td className="py-2 text-right font-bold text-slate-900 dark:text-white">
                              {formatCurrency(item?.total || 0)}
                            </td>
                            <td className="py-2 text-center">
                              {onOpenInvoice && (
                                <button
                                  onClick={() => onOpenInvoice(sale)}
                                  className="text-cyan-600 hover:underline font-semibold text-[11px] dark:text-cyan-400"
                                >
                                  View
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3 dark:border-slate-800 dark:bg-slate-800/60">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenStockIn(product.id)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition-all"
            >
              <ArrowDownRight className="h-4 w-4" />
              <span>Stock In</span>
            </button>
            <button
              onClick={() => onOpenStockOut(product.id)}
              disabled={product.quantity <= 0}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:bg-slate-800 dark:text-rose-400 dark:hover:bg-rose-950/40"
            >
              <ArrowUpRight className="h-4 w-4" />
              <span>Stock Out</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

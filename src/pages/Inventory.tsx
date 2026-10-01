import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  MoreVertical,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Edit,
  Trash2,
  FileSpreadsheet,
} from 'lucide-react';
import { Product, Category, Supplier, User } from '../types';
import { storage } from '../services/storage';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Lock } from 'lucide-react';

interface InventoryProps {
  onOpenAddProduct: () => void;
  onOpenStockIn: (productId?: string) => void;
  onOpenStockOut: (productId?: string) => void;
  onViewProduct: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  user?: User | null;
}

export const Inventory: React.FC<InventoryProps> = ({
  onOpenAddProduct,
  onOpenStockIn,
  onOpenStockOut,
  onViewProduct,
  onEditProduct,
  user,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const isManagerOrAdmin = !user || user.role === 'Admin' || user.role === 'Manager';
  const isAdmin = !user || user.role === 'Admin';

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'price' | 'value'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const refreshData = () => {
    setProducts(storage.getProducts().filter((p) => p.isActive));
    setCategories(storage.getCategories());
    setSuppliers(storage.getSuppliers());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to archive/remove "${name}" from active catalog?`)) {
      storage.deleteProduct(id);
      refreshData();
    }
  };

  // Filter & Search logic
  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q);

    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSupplier = selectedSupplier === 'all' || p.supplierId === selectedSupplier;

    let matchesStatus = true;
    if (selectedStatus === 'in_stock') {
      matchesStatus = p.quantity > p.minimumStock;
    } else if (selectedStatus === 'low_stock') {
      matchesStatus = p.quantity > 0 && p.quantity <= p.minimumStock;
    } else if (selectedStatus === 'out_of_stock') {
      matchesStatus = p.quantity === 0;
    }

    return matchesSearch && matchesCategory && matchesSupplier && matchesStatus;
  });

  // Sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === 'stock') {
      comparison = a.quantity - b.quantity;
    } else if (sortBy === 'price') {
      comparison = a.sellingPrice - b.sellingPrice;
    } else if (sortBy === 'value') {
      comparison = a.purchasePrice * a.quantity - b.purchasePrice * b.quantity;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Quick stats
  const totalItems = products.reduce((acc, p) => acc + p.quantity, 0);
  const totalValue = products.reduce((acc, p) => acc + p.purchasePrice * p.quantity, 0);
  const lowCount = products.filter((p) => p.quantity > 0 && p.quantity <= p.minimumStock).length;
  const outCount = products.filter((p) => p.quantity === 0).length;

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Product Name', 'SKU', 'Barcode', 'Category', 'Stock Qty', 'Unit', 'Purchase Price', 'Selling Price', 'Stock Value', 'Status'];
    const rows = sortedProducts.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      p.sku,
      p.barcode || '',
      p.categoryName || '',
      p.quantity,
      p.unit,
      p.purchasePrice,
      p.sellingPrice,
      p.purchasePrice * p.quantity,
      p.quantity === 0 ? 'Out of Stock' : p.quantity <= p.minimumStock ? 'Low Stock' : 'In Stock',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `StockFlow_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
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
            Inventory Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage catalog products, stock levels, valuations, and real-time inventory ledger movements.
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
          {isManagerOrAdmin ? (
            <button
              onClick={onOpenAddProduct}
              className="flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-cyan-700 active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>+ Add Product</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-500 text-xs dark:bg-slate-800 dark:text-slate-400">
              <Lock className="h-3.5 w-3.5 text-amber-500" />
              <span>Read-Only Catalog</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Catalog SKUs</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{products.length}</p>
          <span className="text-[10px] text-slate-500">{totalItems} total units</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Stock Valuation</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(totalValue)}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">At procurement cost</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold text-amber-600 uppercase">Low Stock SKUs</span>
          <p className="text-xl font-bold text-amber-600 mt-1">{lowCount}</p>
          <span className="text-[10px] text-slate-500">Approaching reorder point</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold text-rose-600 uppercase">Out of Stock</span>
          <p className="text-xl font-bold text-rose-600 mt-1">{outCount}</p>
          <span className="text-[10px] text-rose-500 font-semibold">Lost sales risk</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, SKU code, or barcode..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Category Filter */}
          <div className="flex w-full md:w-auto items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="all">All Statuses</option>
              <option value="in_stock">🟢 In Stock</option>
              <option value="low_stock">🟡 Low Stock</option>
              <option value="out_of_stock">🔴 Out of Stock</option>
            </select>

            {/* Sort by */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="name">Sort: Name</option>
              <option value="stock">Sort: Stock Qty</option>
              <option value="price">Sort: Selling Price</option>
              <option value="value">Sort: Stock Value</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Products Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                <th className="py-3 px-4">Product Info</th>
                <th className="py-3 px-3">SKU / Code</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-center">Stock</th>
                <th className="py-3 px-3 text-right">Cost Price</th>
                <th className="py-3 px-3 text-right">Selling Price</th>
                <th className="py-3 px-3 text-right">Stock Value</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-slate-400">
                    <Package className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No products found</p>
                    <p className="mt-1">Try adjusting your filters or search keywords, or add your first product.</p>
                    <button
                      onClick={onOpenAddProduct}
                      className="mt-3 inline-flex items-center gap-1 rounded-xl bg-cyan-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-cyan-700"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Product
                    </button>
                  </td>
                </tr>
              ) : (
                sortedProducts.map((p) => {
                  const isOutOfStock = p.quantity === 0;
                  const isLowStock = p.quantity > 0 && p.quantity <= p.minimumStock;
                  const stockValue = p.purchasePrice * p.quantity;

                  return (
                    <tr
                      key={p.id}
                      className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Product Name & Image */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                            ) : (
                              <Package className="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p
                              onClick={() => onViewProduct(p)}
                              className="font-bold text-slate-900 dark:text-white hover:text-cyan-600 cursor-pointer truncate max-w-xs"
                            >
                              {p.name}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">{p.brand || 'General'}</p>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-3 font-mono font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {p.sku}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {p.categoryName || 'General'}
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-bold text-xs ${
                            isOutOfStock
                              ? 'text-rose-600'
                              : isLowStock
                              ? 'text-amber-600'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {p.quantity}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-0.5">{p.unit}</span>
                      </td>

                      {/* Cost Price */}
                      <td className="py-3 px-3 text-right font-medium text-slate-600 dark:text-slate-300">
                        {formatCurrency(p.purchasePrice)}
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(p.sellingPrice)}
                      </td>

                      {/* Stock Value */}
                      <td className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                        {formatCurrency(stockValue)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {isOutOfStock
                            ? '🔴 Out of Stock'
                            : isLowStock
                            ? '🟡 Low Stock'
                            : '🟢 In Stock'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isManagerOrAdmin && (
                            <>
                              <button
                                onClick={() => onOpenStockIn(p.id)}
                                title="Stock In / Purchase"
                                className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60"
                              >
                                <ArrowDownRight className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => onOpenStockOut(p.id)}
                                title="Stock Out / Damage"
                                disabled={p.quantity <= 0}
                                className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 disabled:opacity-30 dark:hover:bg-rose-950/60"
                              >
                                <ArrowUpRight className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => onViewProduct(p)}
                            title="View Ledger & Analytics"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {isManagerOrAdmin && (
                            <button
                              onClick={() => onEditProduct(p)}
                              title="Edit Product"
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(p.id, p.name)}
                              title="Archive Product"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Count */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
          <span>
            Showing <strong className="text-slate-800 dark:text-slate-200">{sortedProducts.length}</strong> of {products.length} products
          </span>
          <span className="text-[11px] text-slate-400">
            Real-time multi-location double-entry inventory ledger
          </span>
        </div>
      </div>
    </div>
  );
};

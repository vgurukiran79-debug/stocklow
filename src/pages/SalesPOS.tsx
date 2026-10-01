import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Check,
  CreditCard,
  Banknote,
  QrCode,
  Building,
  User,
  AlertCircle,
  Sparkles,
  Barcode,
  Receipt,
  Printer,
} from 'lucide-react';
import { Product, Customer, PaymentMethod, Sale } from '../types';
import { storage } from '../services/storage';
import { formatCurrency } from '../utils/formatters';

interface SalesPOSProps {
  onSaleCompleted: (sale: Sale) => void;
  onOpenAddCustomer: () => void;
  onOpenAddProduct?: () => void;
}

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
}

export const SalesPOS: React.FC<SalesPOSProps> = ({
  onSaleCompleted,
  onOpenAddCustomer,
  onOpenAddProduct,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [saleNotes, setSaleNotes] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  const barcodeRef = useRef<HTMLInputElement>(null);

  const refreshData = () => {
    setProducts(storage.getProducts().filter((p) => p.isActive));
    setCustomers(storage.getCustomers());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Filter products for POS grid
  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode?.toLowerCase().includes(q);

    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = storage.getCategories();

  // Add product to cart
  const addToCart = (product: Product) => {
    setError(null);
    if (product.quantity <= 0) {
      setError(`Cannot add "${product.name}" - out of stock.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          setError(`Cannot add more than ${product.quantity} units available in stock.`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1, unitPrice: product.sellingPrice }];
    });
  };

  // Adjust quantity
  const updateQuantity = (productId: string, delta: number) => {
    setError(null);
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.quantity) {
              setError(`Only ${item.product.quantity} units available for ${item.product.name}.`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setError(null);
  };

  // Barcode quick scan handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matched = products.find(
      (p) =>
        p.barcode?.toLowerCase() === barcodeInput.trim().toLowerCase() ||
        p.sku?.toLowerCase() === barcodeInput.trim().toLowerCase()
    );

    if (matched) {
      addToCart(matched);
      setBarcodeInput('');
    } else {
      setError(`No product found with barcode/SKU "${barcodeInput}".`);
    }
  };

  // Cart financial calculations
  const subtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const discount = Math.min(subtotal, Math.max(0, parseFloat(discountAmount) || 0));
  const effectiveSubtotal = Math.max(0, subtotal - discount);
  const taxRate = storage.getBusiness().taxRate || 18;
  const tax = Math.round(effectiveSubtotal * (taxRate / 100) * 100) / 100;
  const total = effectiveSubtotal + tax;

  // Complete Sale Action
  const handleCompleteSale = () => {
    setError(null);
    if (cart.length === 0) {
      setError('Cannot complete sale with an empty cart.');
      return;
    }

    try {
      const sale = storage.createSale({
        customerId: selectedCustomerId || undefined,
        items: cart.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        discount,
        taxRate,
        paymentMethod,
        paymentStatus: 'Paid',
        notes: saleNotes.trim() || undefined,
      });

      // Clear cart & trigger completion state
      setCart([]);
      setDiscountAmount('0');
      setSaleNotes('');
      setCompletedSale(sale);
      refreshData();
      onSaleCompleted(sale);
    } catch (err: any) {
      setError(err.message || 'Failed to complete sale transaction');
    }
  };

  return (
    <div className="space-y-4 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* POS Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Point of Sale (POS)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Instant counter billing, automated inventory reduction, and GST invoice generation.
          </p>
        </div>

        {/* Barcode scanner simulator box */}
        <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Barcode className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              ref={barcodeRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan Barcode / SKU + Enter..."
              className="w-56 sm:w-64 rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-700"
          >
            Scan
          </button>
        </form>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Selection & Catalog (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Category Filter */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by title, SKU, or category..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`rounded-lg px-3 py-1.5 font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-slate-900 text-white dark:bg-cyan-600'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                All Items
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`rounded-lg px-3 py-1.5 font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === c.id
                      ? 'bg-slate-900 text-white dark:bg-cyan-600'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[620px] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="col-span-3 py-14 text-center text-xs text-slate-400">
                <ShoppingCart className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  {products.length === 0 ? 'No products in catalog yet' : `No active products match "${searchQuery}"`}
                </p>
                <p className="mt-1">
                  {products.length === 0
                    ? 'Add products with prices and initial stock to start selling in POS.'
                    : 'Try checking your search query or category filter.'}
                </p>
                {products.length === 0 && onOpenAddProduct && (
                  <button
                    onClick={onOpenAddProduct}
                    className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-cyan-700 active:scale-95 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ Add Your First Product</span>
                  </button>
                )}
              </div>
            ) : (
              filteredProducts.map((p) => {
                const inCart = cart.find((i) => i.product.id === p.id);
                const isOutOfStock = p.quantity <= 0;

                return (
                  <div
                    key={p.id}
                    onClick={() => !isOutOfStock && addToCart(p)}
                    className={`group relative flex flex-col justify-between rounded-xl border p-3 transition-all ${
                      isOutOfStock
                        ? 'cursor-not-allowed border-slate-200 bg-slate-50/50 opacity-60 dark:border-slate-800 dark:bg-slate-900'
                        : inCart
                        ? 'cursor-pointer border-cyan-500 bg-cyan-50/30 shadow-xs dark:bg-cyan-950/20'
                        : 'cursor-pointer border-slate-200 bg-white hover:border-cyan-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Badge if in cart */}
                    {inCart && (
                      <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-600 text-[10px] font-bold text-white shadow-xs">
                        {inCart.quantity}
                      </span>
                    )}

                    <div className="space-y-2">
                      <div className="h-24 w-full rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <ShoppingCart className="h-6 w-6 text-slate-400" />
                        )}
                      </div>

                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-xs line-clamp-1">
                          {p.name}
                        </p>
                        <p className="font-mono text-[10px] text-slate-400">{p.sku}</p>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                        {formatCurrency(p.sellingPrice)}
                      </span>
                      <span
                        className={`text-[10px] font-semibold ${
                          isOutOfStock
                            ? 'text-rose-600'
                            : p.quantity <= p.minimumStock
                            ? 'text-amber-600'
                            : 'text-slate-400'
                        }`}
                      >
                        {isOutOfStock ? 'Out of Stock' : `${p.quantity} in stock`}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Cart / Current Sale (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col overflow-hidden">
          {/* Cart Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Current Order</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {cart.reduce((a, b) => a + b.quantity, 0)} items
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] font-semibold text-rose-600 hover:underline dark:text-rose-400"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Customer Selection */}
          <div className="border-b border-slate-100 p-4 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span>Customer</span>
              </label>
              <button
                onClick={onOpenAddCustomer}
                className="text-[11px] font-semibold text-cyan-600 hover:underline dark:text-cyan-400"
              >
                + New Customer
              </button>
            </div>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Walk-in Customer (General Counter Sale)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 divide-y divide-slate-100 overflow-y-auto p-4 max-h-72 min-h-48 dark:divide-slate-800">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <ShoppingCart className="mx-auto mb-2 h-7 w-7 text-slate-300 dark:text-slate-600" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">Cart is empty</p>
                <p className="mt-0.5">Click products on the left or scan barcodes to begin sale.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {item.product.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {formatCurrency(item.unitPrice)} each · Stock: {item.product.quantity}
                    </p>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-0.5 dark:border-slate-700 dark:bg-slate-800">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="rounded p-0.5 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center font-bold text-slate-900 dark:text-white text-xs">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="rounded p-0.5 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <span className="w-16 text-right font-bold text-slate-900 dark:text-white">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </span>

                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Pricing Calculation Summary */}
          <div className="border-t border-slate-200 bg-slate-50/70 p-4 space-y-2 dark:border-slate-800 dark:bg-slate-800/40 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatCurrency(subtotal)}
              </span>
            </div>

            {/* Discount field */}
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span>Discount (₹):</span>
              <div className="w-24">
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-right text-xs font-semibold text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>GST Tax ({taxRate}%):</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatCurrency(tax)}
              </span>
            </div>

            <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-extrabold text-slate-900 dark:text-white dark:border-slate-700">
              <span>Grand Total:</span>
              <span className="text-cyan-700 text-lg dark:text-cyan-400">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="border-t border-slate-200 p-4 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Payment Method
            </span>
            <div className="grid grid-cols-4 gap-2">
              {(['UPI', 'Cash', 'Card', 'Bank Transfer'] as PaymentMethod[]).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`rounded-xl border py-2 text-center text-xs font-semibold transition-all ${
                    paymentMethod === method
                      ? 'border-cyan-600 bg-cyan-50/80 text-cyan-800 shadow-xs dark:bg-cyan-950 dark:text-cyan-300'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>

            {/* Notes */}
            <input
              type="text"
              value={saleNotes}
              onChange={(e) => setSaleNotes(e.target.value)}
              placeholder="Sale notes / transaction reference..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white mt-1"
            />
          </div>

          {/* Complete Sale Button */}
          <div className="p-4 pt-0">
            <button
              onClick={handleCompleteSale}
              disabled={cart.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-3 text-sm font-bold text-white shadow-md hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 active:scale-98 transition-all"
            >
              <Check className="h-4 w-4" />
              <span>Complete Sale · {formatCurrency(total)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sale Completed Celebration Notification Banner */}
      {completedSale && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-emerald-300 bg-white p-4 shadow-2xl dark:border-emerald-800 dark:bg-slate-900 max-w-sm animate-in slide-in-from-bottom">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Sale Completed! 🎉</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Invoice <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{completedSale.invoiceNumber}</span> generated. Stock reduced automatically.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => onSaleCompleted(completedSale)}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-700"
                >
                  View Invoice
                </button>
                <button
                  onClick={() => setCompletedSale(null)}
                  className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

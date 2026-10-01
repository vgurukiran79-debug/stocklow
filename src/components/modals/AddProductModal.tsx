import React, { useState, useEffect } from 'react';
import { X, AlertCircle, PackagePlus, Sparkles } from 'lucide-react';
import { Product, Category, Supplier } from '../../types';
import { storage } from '../../services/storage';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (product: Product) => void;
  categories: Category[];
  suppliers: Supplier[];
  editProduct?: Product | null;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  categories,
  suppliers,
  editProduct,
}) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brand, setBrand] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<string>('0');
  const [sellingPrice, setSellingPrice] = useState<string>('0');
  const [quantity, setQuantity] = useState<string>('10');
  const [minimumStock, setMinimumStock] = useState<string>('5');
  const [maximumStock, setMaximumStock] = useState<string>('100');
  const [unit, setUnit] = useState('pcs');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editProduct) {
      setName(editProduct.name);
      setSku(editProduct.sku);
      setBarcode(editProduct.barcode || '');
      setCategoryId(editProduct.categoryId);
      setBrand(editProduct.brand || '');
      setSupplierId(editProduct.supplierId || '');
      setPurchasePrice(editProduct.purchasePrice.toString());
      setSellingPrice(editProduct.sellingPrice.toString());
      setQuantity(editProduct.quantity.toString());
      setMinimumStock(editProduct.minimumStock.toString());
      setMaximumStock(editProduct.maximumStock.toString());
      setUnit(editProduct.unit || 'pcs');
      setDescription(editProduct.description || '');
      setImageUrl(editProduct.imageUrl || '');
    } else {
      setName('');
      setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
      setBarcode('');
      setCategoryId(categories[0]?.id || '');
      setBrand('');
      setSupplierId(suppliers[0]?.id || '');
      setPurchasePrice('');
      setSellingPrice('');
      setQuantity('0');
      setMinimumStock('5');
      setMaximumStock('100');
      setUnit('pcs');
      setDescription('');
      setImageUrl('');
    }
    setError(null);
  }, [editProduct, isOpen, categories, suppliers]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Product Name is required.');
      return;
    }
    if (!sku.trim()) {
      setError('SKU is required.');
      return;
    }

    const pPrice = parseFloat(purchasePrice);
    const sPrice = parseFloat(sellingPrice);
    const qty = parseInt(quantity, 10);
    const minStk = parseInt(minimumStock, 10);
    const maxStk = parseInt(maximumStock, 10);

    if (isNaN(pPrice) || pPrice < 0) {
      setError('Purchase price must be a valid non-negative number.');
      return;
    }
    if (isNaN(sPrice) || sPrice < 0) {
      setError('Selling price must be a valid non-negative number.');
      return;
    }
    if (isNaN(qty) || qty < 0) {
      setError('Quantity cannot be negative.');
      return;
    }
    if (isNaN(minStk) || minStk < 0) {
      setError('Minimum stock cannot be negative.');
      return;
    }

    try {
      const saved = storage.saveProduct(
        {
          name: name.trim(),
          sku: sku.trim().toUpperCase(),
          barcode: barcode.trim(),
          categoryId: categoryId || categories[0]?.id || 'cat_1',
          brand: brand.trim() || 'General',
          supplierId: supplierId || suppliers[0]?.id || 'sup_1',
          description: description.trim(),
          purchasePrice: pPrice,
          sellingPrice: sPrice,
          quantity: qty,
          minimumStock: minStk,
          maximumStock: maxStk || 100,
          unit: unit || 'pcs',
          imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        editProduct ? editProduct.id : undefined
      );

      onSuccess(saved);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    }
  };

  const potentialProfit = Math.max(0, (parseFloat(sellingPrice) || 0) - (parseFloat(purchasePrice) || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-auto dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">
              <PackagePlus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <p className="text-xs text-slate-500">Record item specs, pricing, and stock bounds</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: Name & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Logitech Wireless Mouse M331"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Brand / Manufacturer
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Logitech, HP, Dell"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Row 2: SKU & Barcode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                SKU (Stock Keeping Unit) *
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="MOU-LOG-001"
                className="w-full font-mono rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Barcode (EAN / UPC)
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="8901234567890"
                className="w-full font-mono rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Row 3: Category & Supplier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Primary Supplier
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.company} ({s.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Pricing & Margin indicator */}
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80 dark:bg-slate-800/40 dark:border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Purchase Price (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Selling Price (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex flex-col justify-center">
                <span className="text-[11px] font-medium text-slate-500">Unit Margin Profit</span>
                <span className={`text-sm font-bold ${potentialProfit > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  ₹{potentialProfit.toFixed(2)}
                  <span className="text-[10px] text-slate-400 font-normal ml-1">
                    ({((potentialProfit / (parseFloat(sellingPrice) || 1)) * 100).toFixed(0)}%)
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Row 5: Stock Quantities & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Initial Stock Qty *
              </label>
              <input
                type="number"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Min Stock Alert Level
              </label>
              <input
                type="number"
                value={minimumStock}
                onChange={(e) => setMinimumStock(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Max Stock Level
              </label>
              <input
                type="number"
                value={maximumStock}
                onChange={(e) => setMaximumStock(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unit of Measure
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="boxes">Boxes</option>
                <option value="packs">Packs</option>
                <option value="sets">Sets</option>
                <option value="kg">Kilograms (kg)</option>
              </select>
            </div>
          </div>

          {/* Image URL & Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Product Image URL
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed specifications, warranty details, box contents..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-cyan-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-cyan-700 active:scale-95 transition-all"
            >
              {editProduct ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

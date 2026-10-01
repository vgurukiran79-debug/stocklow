import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, Package, Truck, Check, AlertCircle } from 'lucide-react';
import { Product, Supplier } from '../../types';
import { storage } from '../../services/storage';
import { formatCurrency } from '../../utils/formatters';

interface StockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (product: Product) => void;
  preSelectedProductId?: string;
}

export const StockInModal: React.FC<StockInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preSelectedProductId,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [quantity, setQuantity] = useState<string>('10');
  const [purchasePrice, setPurchasePrice] = useState<string>('0');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const prods = storage.getProducts().filter((p) => p.isActive);
      const sups = storage.getSuppliers();
      setProducts(prods);
      setSuppliers(sups);

      const targetId = preSelectedProductId || (prods[0]?.id ?? '');
      setSelectedProductId(targetId);

      const activeProd = prods.find((p) => p.id === targetId);
      if (activeProd) {
        setPurchasePrice(activeProd.purchasePrice.toString());
        setSelectedSupplierId(activeProd.supplierId || (sups[0]?.id ?? ''));
      }
      setQuantity('1');
      setReferenceNumber('');
      setNotes('');
      setError(null);
    }
  }, [isOpen, preSelectedProductId]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleProductChange = (id: string) => {
    setSelectedProductId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setPurchasePrice(prod.purchasePrice.toString());
      if (prod.supplierId) setSelectedSupplierId(prod.supplierId);
    }
  };

  if (!isOpen) return null;

  if (products.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-center">
          <Package className="mx-auto mb-2 h-8 w-8 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Products in Catalog</h3>
          <p className="text-xs text-slate-500 mt-1">
            Please add at least one product before recording a Stock In procurement transaction.
          </p>
          <button
            onClick={onClose}
            className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const currentStock = selectedProduct?.quantity ?? 0;
  const addedQty = parseInt(quantity, 10) || 0;
  const newStock = currentStock + addedQty;
  const totalCost = addedQty * (parseFloat(purchasePrice) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedProductId) {
      setError('Please select a product.');
      return;
    }
    if (addedQty <= 0) {
      setError('Quantity to add must be greater than zero.');
      return;
    }

    try {
      const result = storage.stockIn({
        productId: selectedProductId,
        quantity: addedQty,
        supplierId: selectedSupplierId,
        purchasePrice: parseFloat(purchasePrice) || undefined,
        referenceNumber: referenceNumber.trim(),
        notes: notes.trim(),
      });

      onSuccess(result.product);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record Stock In');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-auto dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <ArrowDownRight className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Purchase / Stock In
              </h2>
              <p className="text-xs text-slate-500">Record incoming inventory batch from supplier</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Product *
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Current: {p.quantity} {p.unit}
                </option>
              ))}
            </select>
          </div>

          {/* Supplier Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Supplier
            </label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.company} ({s.name})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Unit Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Quantity to Add *
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Purchase Price per unit (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* PO Invoice Number & Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Invoice / PO Number
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="PO-2026-001"
                className="w-full font-mono rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Procurement Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Batch info / carrier"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Dynamic Stock Calculation Preview Card */}
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Inventory Ledger Preview
            </span>
            <div className="mt-2 grid grid-cols-3 text-center divide-x divide-slate-200 dark:divide-slate-700">
              <div>
                <p className="text-[10px] text-slate-500">Before</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{currentStock}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500">Added</p>
                <p className="text-sm font-bold text-emerald-600">+{addedQty}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500">After</p>
                <p className="text-sm font-bold text-cyan-600 dark:text-cyan-400">{newStock}</p>
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-xs">
              <span className="text-slate-500">Total Purchase Value:</span>
              <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(totalCost)}</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 active:scale-95 transition-all"
            >
              <Check className="h-4 w-4" />
              <span>Confirm Stock In</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

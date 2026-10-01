import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, AlertCircle, Check } from 'lucide-react';
import { Product } from '../../types';
import { storage } from '../../services/storage';

interface StockOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (product: Product) => void;
  preSelectedProductId?: string;
}

export const StockOutModal: React.FC<StockOutModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preSelectedProductId,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState<string>('1');
  const [reasonType, setReasonType] = useState<'DAMAGE' | 'LOSS' | 'MANUAL_ADJUSTMENT'>('DAMAGE');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const prods = storage.getProducts().filter((p) => p.isActive && p.quantity > 0);
      setProducts(prods);
      const targetId = preSelectedProductId || (prods[0]?.id ?? '');
      setSelectedProductId(targetId);
      setQuantity('1');
      setReasonType('DAMAGE');
      setNotes('');
      setError(null);
    }
  }, [isOpen, preSelectedProductId]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  if (!isOpen) return null;

  if (products.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-center">
          <AlertCircle className="mx-auto mb-2 h-8 w-8 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Stock Available</h3>
          <p className="text-xs text-slate-500 mt-1">
            There are currently no products with available inventory to write off.
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
  const deductedQty = parseInt(quantity, 10) || 0;
  const newStock = Math.max(0, currentStock - deductedQty);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedProductId) {
      setError('Please select a product.');
      return;
    }
    if (deductedQty <= 0) {
      setError('Deduction quantity must be greater than zero.');
      return;
    }
    if (deductedQty > currentStock) {
      setError(`Cannot deduct ${deductedQty} units. Current stock is only ${currentStock}. Stock cannot become negative.`);
      return;
    }

    try {
      const result = storage.stockOut({
        productId: selectedProductId,
        quantity: deductedQty,
        reasonType,
        notes: notes.trim(),
      });

      onSuccess(result.product);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record Stock Out');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-auto dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
              <ArrowUpRight className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Record Stock Out / Write-Off
              </h2>
              <p className="text-xs text-slate-500">Record damage, loss, or internal shrinkage</p>
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
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Available: {p.quantity} {p.unit}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Reason */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Quantity to Deduct *
              </label>
              <input
                type="number"
                min="1"
                max={currentStock}
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reason Type *
              </label>
              <select
                value={reasonType}
                onChange={(e) => setReasonType(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="DAMAGE">Damaged Goods</option>
                <option value="LOSS">Loss / Missing</option>
                <option value="MANUAL_ADJUSTMENT">Inventory Adjustment / Internal Use</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Explanation & Incident Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide reason for stock write-off for audit ledger..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Ledger Calculation Preview */}
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Audit Stock Impact
            </span>
            <div className="mt-2 grid grid-cols-3 text-center divide-x divide-slate-200 dark:divide-slate-700">
              <div>
                <p className="text-[10px] text-slate-500">Before</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{currentStock}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500">Deduction</p>
                <p className="text-sm font-bold text-rose-600">-{deductedQty}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500">After</p>
                <p className={`text-sm font-bold ${newStock === 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                  {newStock}
                </p>
              </div>
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
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-700 active:scale-95 transition-all"
            >
              <Check className="h-4 w-4" />
              <span>Deduct Stock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

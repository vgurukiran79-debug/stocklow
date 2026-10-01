import React, { useState, useEffect } from 'react';
import { X, RotateCcw, AlertCircle, Check } from 'lucide-react';
import { Sale, ReturnRecord } from '../../types';
import { storage } from '../../services/storage';
import { formatCurrency } from '../../utils/formatters';

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (returnRecord: ReturnRecord) => void;
  preSelectedSale?: Sale | null;
}

export const ReturnModal: React.FC<ReturnModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preSelectedSale,
}) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSaleId, setSelectedSaleId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState<string>('1');
  const [reason, setReason] = useState<ReturnRecord['reason']>('Defective');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const allSales = storage.getSales();
      setSales(allSales);

      const targetSale = preSelectedSale || allSales[0];
      if (targetSale) {
        setSelectedSaleId(targetSale.id);
        setSelectedProductId(targetSale.items[0]?.productId || '');
      }
      setQuantity('1');
      setReason('Defective');
      setNotes('');
      setError(null);
    }
  }, [isOpen, preSelectedSale]);

  const selectedSale = sales.find((s) => s.id === selectedSaleId);
  const selectedItem = selectedSale?.items.find((i) => i.productId === selectedProductId);

  const handleSaleChange = (saleId: string) => {
    setSelectedSaleId(saleId);
    const sale = sales.find((s) => s.id === saleId);
    if (sale && sale.items.length > 0) {
      setSelectedProductId(sale.items[0].productId);
    }
  };

  if (!isOpen) return null;

  const returnQty = parseInt(quantity, 10) || 0;
  const maxQty = selectedItem?.quantity || 1;
  const refundAmount = returnQty * (selectedItem?.unitPrice || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedSaleId || !selectedProductId) {
      setError('Please select a valid sale and product.');
      return;
    }
    if (returnQty <= 0 || returnQty > maxQty) {
      setError(`Return quantity must be between 1 and ${maxQty}.`);
      return;
    }

    try {
      const retRecord = storage.processReturn({
        saleId: selectedSaleId,
        productId: selectedProductId,
        quantity: returnQty,
        reason,
        notes: notes.trim(),
      });

      onSuccess(retRecord);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to process return');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-auto dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <RotateCcw className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Process Sale Return & Restock
              </h2>
              <p className="text-xs text-slate-500">Restore inventory balance and issue refund credit</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Sale Invoice Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Invoice *
            </label>
            <select
              value={selectedSaleId}
              onChange={(e) => handleSaleChange(e.target.value)}
              className="w-full font-mono rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {sales.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.invoiceNumber} — {s.customerName} ({formatCurrency(s.total)})
                </option>
              ))}
            </select>
          </div>

          {/* Item in Invoice */}
          {selectedSale && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Item to Return *
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {selectedSale.items.map((i) => (
                  <option key={i.productId} value={i.productId}>
                    {i.productName} (Qty Sold: {i.quantity} @ {formatCurrency(i.unitPrice)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quantity & Reason */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Return Qty (Max: {maxQty}) *
              </label>
              <input
                type="number"
                min="1"
                max={maxQty}
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Return Reason *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="Damaged">Damaged in Box</option>
                <option value="Wrong Product">Wrong Product Delivered</option>
                <option value="Customer Changed Mind">Customer Changed Mind</option>
                <option value="Defective">Defective / Malfunctioning</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Internal Return Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Serial # verified, item placed back into shelf"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Refund calculation preview */}
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700 flex justify-between items-center text-xs">
            <div>
              <span className="text-slate-500">Refund Amount Due:</span>
              <p className="text-[11px] text-slate-400">Inventory will increase by +{returnQty}</p>
            </div>
            <span className="text-base font-extrabold text-rose-600">
              {formatCurrency(refundAmount)}
            </span>
          </div>

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
              className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-amber-700 active:scale-95 transition-all"
            >
              <Check className="h-4 w-4" />
              <span>Confirm Return</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

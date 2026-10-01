import React, { useState, useEffect } from 'react';
import { X, Truck, AlertCircle } from 'lucide-react';
import { Supplier } from '../../types';
import { storage } from '../../services/storage';

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (supplier: Supplier) => void;
  editSupplier?: Supplier | null;
}

export const AddSupplierModal: React.FC<AddSupplierModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editSupplier,
}) => {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editSupplier) {
      setName(editSupplier.name);
      setCompany(editSupplier.company);
      setPhone(editSupplier.phone);
      setEmail(editSupplier.email);
      setAddress(editSupplier.address);
      setGstNumber(editSupplier.gstNumber);
      setNotes(editSupplier.notes || '');
    } else {
      setName('');
      setCompany('');
      setPhone('');
      setEmail('');
      setAddress('');
      setGstNumber('');
      setNotes('');
    }
    setError(null);
  }, [editSupplier, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim()) {
      setError('Company / Vendor name is required.');
      return;
    }
    if (!name.trim()) {
      setError('Primary contact person name is required.');
      return;
    }
    if (!phone.trim()) {
      setError('Phone number is required.');
      return;
    }

    try {
      const saved = storage.saveSupplier(
        {
          name: name.trim(),
          company: company.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          gstNumber: gstNumber.trim(),
          notes: notes.trim(),
        },
        editSupplier ? editSupplier.id : undefined
      );

      onSuccess(saved);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save supplier');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-auto dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editSupplier ? 'Edit Supplier' : 'Add New Supplier'}
              </h2>
              <p className="text-xs text-slate-500">Wholesale partner & procurement vendor profile</p>
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Company / Vendor Name *
            </label>
            <input
              type="text"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. ABC Electronics Ltd."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contact Person *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rajesh Varma"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98800 11223"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="orders@vendor.in"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                GSTIN Number
              </label>
              <input
                type="text"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                placeholder="29AABCA1234F1Z5"
                className="w-full uppercase font-mono rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Office / Warehouse Address
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full warehouse or dispatch depot location"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Procurement Terms / Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 15-day credit cycle, free delivery over ₹50,000"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
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
              className="rounded-xl bg-cyan-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-cyan-700 active:scale-95 transition-all"
            >
              {editSupplier ? 'Update Supplier' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

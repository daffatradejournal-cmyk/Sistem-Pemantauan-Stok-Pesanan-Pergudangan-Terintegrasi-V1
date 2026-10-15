'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';
import { ProductItem } from './tabs/ProductsView';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewOrderModal({ isOpen, onClose, onSuccess }: Props) {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [customerName, setCustomerName] = useState('');
  const [customerLocation, setCustomerLocation] = useState('Toko Utama');
  const [quantity, setQuantity] = useState(1);
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/products')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.products?.length > 0) {
            setProducts(data.products);
            setSelectedProductId(data.products[0].id);
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !customerName.trim()) return;

    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          customerName: customerName.trim(),
          customerLocation: customerLocation.trim(),
          quantity,
          orderDate,
        }),
      });
      const data = await res.json();
      setFeedback(data);
      if (data.success) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 800);
      }
    } catch (err: any) {
      setFeedback({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === Number(selectedProductId));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-darkCard rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-darkBorder shadow-2xl relative">
        <button
          onClick={onClose}
          aria-label="Tutup Modal"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          + Catat Pesanan Pembeli Baru
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Pesanan otomatis memotong stok barang dengan aman dan akurat (proteksi anti-stok minus).
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Pilih Barang Dagangan
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(Number(e.target.value))}
              aria-label="Pilih Produk Pesanan"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandBlue cursor-pointer"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Sisa: {p.currentStock} pcs
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nama Pembeli / Warung Pelanggan
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Contoh: Warung Bu Siti / Pak Joko"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandBlue"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tujuan / Alamat Pengiriman
            </label>
            <input
              type="text"
              required
              value={customerLocation}
              onChange={(e) => setCustomerLocation(e.target.value)}
              placeholder="Contoh: Toko Cabang Pasar Baru / Diantar ke Rumah"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandBlue"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Jumlah Beli (Qty)
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandBlue"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Transaksi
              </label>
              <input
                type="datetime-local"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandBlue"
              />
            </div>
          </div>

          {selectedProduct && (
            <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Total Tagihan (Harga Jual):</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  Rp {(selectedProduct.price * quantity).toLocaleString('id-ID')}
                </span>
              </div>
              {selectedProduct.costPrice !== undefined && (
                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/60 dark:border-white/10">
                  <span className="text-slate-400">
                    Modal: Rp {((selectedProduct.costPrice || 0) * quantity).toLocaleString('id-ID')}
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    Untung: +Rp {(((selectedProduct.price || 0) - (selectedProduct.costPrice || 0)) * quantity).toLocaleString('id-ID')}
                  </span>
                </div>
              )}
            </div>
          )}

          {feedback && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 ${
                feedback.success
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-600'
              }`}
            >
              {feedback.success ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{feedback.message || feedback.error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-white/5"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !selectedProductId}
              className="px-4 py-2 bg-brandBlue hover:bg-blue-600 text-white font-bold rounded-xl shadow-md shadow-brandBlue/30 disabled:opacity-50"
            >
              {loading ? 'Memproses Pesanan...' : 'Simpan & Catat Pesanan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

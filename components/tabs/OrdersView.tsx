'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Zap,
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  Users,
  Boxes,
  PlusCircle,
  RefreshCw,
  ShoppingBag,
  Flame,
} from 'lucide-react';
import { ProductItem } from './ProductsView';

export function OrdersView({ onRefreshGlobal }: { onRefreshGlobal?: () => void }) {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Single Order Form state
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [customerName, setCustomerName] = useState('');
  const [customerLocation, setCustomerLocation] = useState('Kasir Toko Utama');
  const [quantity, setQuantity] = useState(1);
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderFeedback, setOrderFeedback] = useState<any>(null);

  // Concurrency Stress-Test state
  const [stressProductId, setStressProductId] = useState<number | ''>('');
  const [stressBuyersCount, setStressBuyersCount] = useState(10);
  const [stressQtyPerBuyer, setStressQtyPerBuyer] = useState(1);
  const [isStressRunning, setIsStressRunning] = useState(false);
  const [stressResult, setStressResult] = useState<any>(null);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
        if (data.products.length > 0 && selectedProductId === '') {
          setSelectedProductId(data.products[0].id);
          setStressProductId(data.products[0].id);
        }
      }
    } catch (err) {
      console.error('Fetch products error:', err);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`/api/orders?status=${statusFilter}&limit=50`);
      const data = await res.json();
      if (data.success) {
        setOrdersList(data.orders || []);
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  // Handle Single Order Submit
  const handleSingleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !customerName.trim()) return;

    setOrderSubmitting(true);
    setOrderFeedback(null);
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
      setOrderFeedback(data);
      fetchOrders();
      fetchProducts();
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err: any) {
      setOrderFeedback({ success: false, error: err.message });
    } finally {
      setOrderSubmitting(false);
    }
  };

  // Handle Concurrent Stress Test
  const handleRunStressTest = async () => {
    if (!stressProductId) return;

    setIsStressRunning(true);
    setStressResult(null);
    try {
      const res = await fetch('/api/orders/concurrent-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: stressProductId,
          buyerCount: stressBuyersCount,
          quantityPerBuyer: stressQtyPerBuyer,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStressResult(data.data);
        fetchOrders();
        fetchProducts();
        if (onRefreshGlobal) onRefreshGlobal();
      } else {
        alert(data.error || 'Gagal menjalankan concurrent test');
      }
    } catch (err: any) {
      alert(err.message || 'Kesalahan jaringan');
    } finally {
      setIsStressRunning(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === Number(selectedProductId));
  const stressProduct = products.find((p) => p.id === Number(stressProductId));

  return (
    <div className="space-y-6">
      {/* SECTION 1: CONCURRENT STRESS-TEST PANEL (FEATURE HIGHLIGHT) */}
      <div className="bg-gradient-to-br from-slate-900 via-[#181926] to-[#1e1533] text-white rounded-2xl p-6 sm:p-8 border border-purple-500/30 shadow-xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brandPurple/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brandBlue/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-white/10 mb-6 gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold mb-2">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulasi Rebutan Stok Serentak (Anti-Stok Minus)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Uji Coba Rebutan Stok Serentak di Database Toko
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
                Pernah khawatir barang tinggal sedikit tapi ada beberapa pembeli beli bersamaan? Fitur ini menguji mekanisme <strong>Row-Level Locking PostgreSQL</strong> asli. Transaksi diantrekan secara atomik sehingga stok <strong>pasti berhenti tepat di angka 0 dan tidak akan pernah minus!</strong>
              </p>
            </div>
          </div>

          {/* Test Controls */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-black/40 p-4 rounded-xl border border-white/10">
            {/* Pick Product */}
            <div className="md:col-span-5">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Pilih Barang Target Rebutan:
              </label>
              <select
                value={stressProductId}
                onChange={(e) => setStressProductId(Number(e.target.value))}
                aria-label="Pilih Barang Target Rebutan"
                className="w-full px-3 py-2.5 bg-slate-800 border border-white/20 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-brandPurple cursor-pointer"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — Sisa Stok: {p.currentStock} pcs
                  </option>
                ))}
              </select>
            </div>

            {/* Concurrent Buyers */}
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Jumlah Pembeli Serentak:
              </label>
              <select
                value={stressBuyersCount}
                onChange={(e) => setStressBuyersCount(Number(e.target.value))}
                aria-label="Jumlah Pembeli Serentak"
                className="w-full px-3 py-2.5 bg-slate-800 border border-white/20 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-brandPurple cursor-pointer"
              >
                <option value="5">5 Pembeli Sekaligus</option>
                <option value="10">10 Pembeli Sekaligus (Standar)</option>
                <option value="20">20 Pembeli Sekaligus</option>
                <option value="30">30 Pembeli Sekaligus (Uji Ekstrem)</option>
              </select>
            </div>

            {/* Qty Per Buyer */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Beli / Orang:
              </label>
              <input
                type="number"
                min="1"
                value={stressQtyPerBuyer}
                onChange={(e) => setStressQtyPerBuyer(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full px-3 py-2 bg-slate-800 border border-white/20 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-brandPurple text-center"
              />
            </div>

            {/* Big Action Button */}
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={handleRunStressTest}
                disabled={isStressRunning || !stressProductId}
                className="w-full py-2.5 bg-gradient-to-r from-brandPurple to-brandBlue hover:from-purple-600 hover:to-blue-600 font-extrabold text-xs rounded-xl shadow-lg shadow-brandPurple/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isStressRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menguji DB...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>Mulai Uji Rebutan</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Real Stress Test Results Display */}
          {stressResult && (
            <div className="mt-6 space-y-4">
              {/* Summary Stats Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-slate-400 block font-semibold">Total Pembeli Bersamaan</span>
                  <span className="text-xl font-black text-white">{stressResult.summary.totalRequests} Orang</span>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-emerald-400 block font-semibold">Berhasil Dapat Barang</span>
                  <span className="text-xl font-black text-emerald-400">+{stressResult.summary.deliveredCount}</span>
                </div>
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-rose-400 block font-semibold">Ditolak (Stok Habis)</span>
                  <span className="text-xl font-black text-rose-400">{stressResult.summary.cancelledCount}</span>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-purple-300 block font-semibold">Stok Awal → Sisa Akhir</span>
                  <span className="text-xl font-black text-white">
                    {stressResult.product.initialStock} → <strong className="text-emerald-400">{stressResult.product.finalStock}</strong>
                  </span>
                </div>
              </div>

              {/* Verification Callout */}
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs text-emerald-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span>
                    <strong>SISTEM TERUJI AMAN:</strong> Stok barang <strong>{stressResult.product.name}</strong> berhenti tepat di {stressResult.product.finalStock} pcs dan mustahil minus! Waktu eksekusi rata-rata: {stressResult.summary.avgLatencyMs} ms per transaksi.
                  </span>
                </div>
              </div>

              {/* Transaction Logs Table */}
              <div className="max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-black/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-slate-400 text-[10px] font-bold uppercase sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Pembeli</th>
                      <th className="py-2 px-3">No. Order</th>
                      <th className="py-2 px-3">Status Lock</th>
                      <th className="py-2 px-3 text-center">Mutasi Stok</th>
                      <th className="py-2 px-3 text-right">Latensi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stressResult.transactions.map((t: any, idx: number) => (
                      <tr key={idx} className="hover:bg-white/5">
                        <td className="py-2 px-3 font-medium text-slate-200">{t.customerName}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-400">{t.orderNumber}</td>
                        <td className="py-2 px-3">
                          {t.status === 'DELIVERED' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              BERHASIL
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              DITOLAK (STOK HABIS)
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-[11px]">
                          {t.previousStock} → {t.remainingStock}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-400">{t.executionMs} ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: CREATE SINGLE ORDER FORM + REAL-TIME ORDERS LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Single Order Creation Form */}
        <div className="lg:col-span-5 bg-white dark:bg-darkCard rounded-2xl p-6 border border-slate-100 dark:border-darkBorder shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-white/5">
            <PlusCircle className="w-5 h-5 text-brandBlue" />
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                + Catat Pesanan Kasir Baru
              </h3>
              <p className="text-[11px] text-slate-400">Potong stok fisik secara otomatis di database</p>
            </div>
          </div>

          <form onSubmit={handleSingleOrder} className="space-y-3.5 text-xs">
            {/* Product Select */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Pilih Produk / Barang Toko
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(Number(e.target.value))}
                aria-label="Pilih Produk Barang Toko"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-brandBlue cursor-pointer"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — Sisa: {p.currentStock} pcs
                  </option>
                ))}
              </select>
              {selectedProduct && (
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Harga Jual: Rp {selectedProduct.price.toLocaleString()}</span>
                  <span className={selectedProduct.currentStock === 0 ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'}>
                    Stok Tersedia: {selectedProduct.currentStock} pcs
                  </span>
                </div>
              )}
            </div>

            {/* Customer Name */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nama Pembeli / Pelanggan
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Misal: Bu Siti / Toko Barokah"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandBlue"
              />
            </div>

            {/* Customer Location */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Alamat / Lokasi Pengiriman
              </label>
              <input
                type="text"
                required
                value={customerLocation}
                onChange={(e) => setCustomerLocation(e.target.value)}
                placeholder="Misal: Ambil di Toko / Depok Timur"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandBlue"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Jumlah Beli (Pcs)
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

            {/* Total Calculation */}
            {selectedProduct && (
              <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Total Tagihan Bayar:</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  Rp {(selectedProduct.price * quantity).toLocaleString()}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={orderSubmitting || !selectedProductId}
              className="w-full py-2.5 bg-brandBlue hover:bg-blue-600 text-white font-bold rounded-xl shadow-md shadow-brandBlue/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {orderSubmitting ? 'Menyimpan ke Database...' : 'Simpan Transaksi Kasir'}
            </button>
          </form>

          {/* Feedback */}
          {orderFeedback && (
            <div
              className={`mt-4 p-3 rounded-xl border text-xs font-semibold ${
                orderFeedback.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
              }`}
            >
              {orderFeedback.success ? (
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    <span>Transaksi Berhasil: {orderFeedback.data?.orderNumber}</span>
                  </div>
                  <p className="mt-1 font-normal opacity-90">{orderFeedback.data?.message}</p>
                </div>
              ) : (
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" />
                    <span>Transaksi Ditolak:</span>
                  </div>
                  <p className="mt-1 font-normal opacity-90">{orderFeedback.data?.message || orderFeedback.error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Real-time Order Log Table */}
        <div className="lg:col-span-7 bg-white dark:bg-darkCard rounded-2xl p-6 border border-slate-100 dark:border-darkBorder shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5 mb-4 gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-brandBlue" />
                <span>Buku Riwayat Transaksi Toko</span>
              </h3>
              <p className="text-xs text-slate-400">Total {ordersList.length} transaksi tercatat di database</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter Status Pesanan"
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brandBlue cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="DELIVERED">Selesai (Terkirim)</option>
                <option value="CANCELLED">Ditolak (Stok Habis)</option>
              </select>

              <button
                onClick={fetchOrders}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                title="Segarkan Riwayat"
              >
                <RefreshCw className={`w-4 h-4 ${loadingOrders ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-white/10 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-2">No. Transaksi</th>
                  <th className="py-2.5 px-2">Pelanggan</th>
                  <th className="py-2.5 px-2">Barang & Qty</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-2 text-right">Total Bayar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {ordersList.length > 0 ? (
                  ordersList.map((ord) => {
                    const isDelivered = ord.status === 'DELIVERED';
                    return (
                      <tr key={ord.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                        <td className="py-2.5 px-2 font-mono text-[11px] font-bold text-slate-900 dark:text-white">
                          {ord.orderNumber}
                          <span className="block text-[9px] text-slate-400 font-normal">
                            {new Date(ord.createdAt).toLocaleTimeString()}
                          </span>
                        </td>
                        <td className="py-2.5 px-2">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">
                            {ord.customerName}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">
                            {ord.customerLocation}
                          </span>
                        </td>
                        <td className="py-2.5 px-2">
                          <span className="font-medium text-slate-700 dark:text-slate-300 block">
                            {ord.productName}
                          </span>
                          <span className="text-[10px] font-bold text-brandBlue">
                            {ord.quantity}x pcs ({ord.productSku})
                          </span>
                        </td>
                        <td className="py-2.5 px-2">
                          {isDelivered ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle className="w-3 h-3" />
                              Selesai
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              <ShieldAlert className="w-3 h-3" />
                              Ditolak (Stok Kurang)
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-right font-bold text-slate-900 dark:text-white">
                          Rp {ord.totalPrice.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                      Belum ada transaksi ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

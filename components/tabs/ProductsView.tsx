'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  ScanLine,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  RefreshCw,
  QrCode,
  Tag,
} from 'lucide-react';
import { BarcodeCameraScanner } from '../BarcodeCameraScanner';
import { SvgBarcode } from '../SvgBarcode';

export interface ProductItem {
  id: number;
  sku: string;
  name: string;
  category: string;
  price: number;
  currentStock: number;
  minStockThreshold: number;
  stockStatus: 'SAFE' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  totalOrderedTimes: number;
  createdAt: string;
}

interface Props {
  onRefreshGlobal?: () => void;
}

export function ProductsView({ onRefreshGlobal }: Props) {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Scanner Form state
  const [scanSku, setScanSku] = useState('');
  const [scanAction, setScanAction] = useState<'IN' | 'OUT'>('IN');
  const [scanQty, setScanQty] = useState(1);
  const [scanDate, setScanDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [scanNotes, setScanNotes] = useState('');
  const [isScanningActive, setIsScanningActive] = useState(true);
  const [scanFeedback, setScanFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Add Product Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newPrice, setNewPrice] = useState(100000);
  const [newStock, setNewStock] = useState(10);
  const [newMinThreshold, setNewMinThreshold] = useState(5);
  const [addLoading, setAddLoading] = useState(false);

  // Edit Threshold Modal
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [editThreshold, setEditThreshold] = useState(5);
  const [editPrice, setEditPrice] = useState(0);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(searchTerm)}&category=${encodeURIComponent(categoryFilter)}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Fetch products error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, categoryFilter]);

  // Handle Barcode Scan execution
  const handleExecuteScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!scanSku.trim()) return;

    setScanFeedback(null);
    try {
      const res = await fetch('/api/inventory/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: scanSku.trim(),
          action: scanAction,
          quantity: scanQty,
          transactionDate: scanDate,
          notes: scanNotes || `Pemindaian Barcode via Web (${scanAction === 'IN' ? 'Barang Masuk' : 'Barang Keluar'})`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setScanFeedback({
          success: true,
          message: `${data.message} | Stok Sekarang: ${data.data.product.newStock} (${data.data.executionMs}ms)`,
        });
        setScanSku('');
        fetchProducts();
        if (onRefreshGlobal) onRefreshGlobal();
      } else {
        setScanFeedback({
          success: false,
          message: data.error || 'Gagal memproses barcode',
        });
      }
    } catch (err: any) {
      setScanFeedback({
        success: false,
        message: err.message || 'Kesalahan jaringan saat scan barcode',
      });
    }
  };

  // When camera decodes barcode
  const handleCameraScan = (code: string) => {
    setScanSku(code);
  };

  // Add new product submit
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku || !newName || !newCategory) return;

    setAddLoading(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: newSku,
          name: newName,
          category: newCategory,
          price: newPrice,
          current_stock: newStock,
          min_stock_threshold: newMinThreshold,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsAddModalOpen(false);
        setNewSku('');
        setNewName('');
        setNewCategory('');
        fetchProducts();
        if (onRefreshGlobal) onRefreshGlobal();
      } else if (data.error && data.error.includes('does not exist')) {
        // Auto-heal: inisialisasi tabel otomatis jika belum ada lalu coba simpan kembali
        await fetch('/api/db/init', { method: 'POST' });
        const retryRes = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sku: newSku,
            name: newName,
            category: newCategory,
            price: newPrice,
            current_stock: newStock,
            min_stock_threshold: newMinThreshold,
          }),
        });
        const retryData = await retryRes.json();
        if (retryData.success) {
          setIsAddModalOpen(false);
          setNewSku('');
          setNewName('');
          setNewCategory('');
          fetchProducts();
          if (onRefreshGlobal) onRefreshGlobal();
        } else {
          alert(retryData.error || 'Gagal menambahkan produk');
        }
      } else {
        alert(data.error || 'Gagal menambahkan produk');
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan produk');
    } finally {
      setAddLoading(false);
    }
  };

  // Update product threshold/price
  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    try {
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          min_stock_threshold: editThreshold,
          price: editPrice,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingProduct(null);
        fetchProducts();
        if (onRefreshGlobal) onRefreshGlobal();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete product
  const handleDeleteProduct = async (prod: ProductItem) => {
    if (!confirm(`Hapus produk "${prod.name}" (${prod.sku})?`)) return;
    try {
      const res = await fetch(`/api/products/${prod.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchProducts();
        if (onRefreshGlobal) onRefreshGlobal();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* SECTION 1: BARCODE SCANNER WORKSTATION */}
      <div className="bg-white dark:bg-darkCard rounded-2xl p-6 border border-slate-100 dark:border-darkBorder shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5 mb-6 gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-brandBlue" />
              <span>Pemindai Barcode Produk Toko (Kamera HP & Scanner USB)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Gunakan kamera HP/laptop atau alat scanner barcode untuk mencatat barang masuk (kulakan) atau barang keluar (penjualan) secara instan.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Pilih Aksi:</span>
            <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setScanAction('IN')}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  scanAction === 'IN'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <ArrowDownCircle className="w-3.5 h-3.5" />
                Barang Masuk / Kulakan (+ IN)
              </button>
              <button
                type="button"
                onClick={() => setScanAction('OUT')}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  scanAction === 'OUT'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <ArrowUpCircle className="w-3.5 h-3.5" />
                Barang Keluar / Jual Langsung (- OUT)
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Real Camera Scanner */}
          <div className="lg:col-span-5">
            <BarcodeCameraScanner onScan={handleCameraScan} isScanningActive={isScanningActive} />
          </div>

          {/* Right: Manual Input / Fast Barcode Execution Form */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <form onSubmit={handleExecuteScan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kode Barcode / SKU Barang (Terisi otomatis saat kamera mendeteksi barcode)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={scanSku}
                    onChange={(e) => setScanSku(e.target.value.toUpperCase())}
                    placeholder="Contoh: BRG-BML-001"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandBlue"
                    autoFocus
                  />
                  <ScanLine className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jumlah Barang (Pcs)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={scanQty}
                    onChange={(e) => setScanQty(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandBlue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal & Waktu Transaksi
                  </label>
                  <input
                    type="datetime-local"
                    value={scanDate}
                    onChange={(e) => setScanDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandBlue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Catatan / Pembeli
                  </label>
                  <input
                    type="text"
                    value={scanNotes}
                    onChange={(e) => setScanNotes(e.target.value)}
                    placeholder="Misal: Bu Siti / Kulakan Pasar"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandBlue"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!scanSku.trim()}
                className={`w-full py-3 rounded-xl font-bold text-sm text-white transition-all shadow-md flex items-center justify-center gap-2 ${
                  scanAction === 'IN'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {scanAction === 'IN' ? (
                  <>
                    <ArrowDownCircle className="w-4 h-4" />
                    <span>Simpan Barang Masuk / Tambah Stok (+{scanQty})</span>
                  </>
                ) : (
                  <>
                    <ArrowUpCircle className="w-4 h-4" />
                    <span>Catat Barang Keluar / Pengurangan Stok (-{scanQty})</span>
                  </>
                )}
              </button>
            </form>

            {/* Feedback Alert Banner */}
            {scanFeedback && (
              <div
                className={`mt-4 p-3.5 rounded-xl border flex items-center gap-3 text-xs font-semibold ${
                  scanFeedback.success
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                }`}
              >
                {scanFeedback.success ? (
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                )}
                <span>{scanFeedback.message}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: PRODUCT MANAGEMENT & SVG BARCODE CATALOG */}
      <div className="bg-white dark:bg-darkCard rounded-2xl p-6 border border-slate-100 dark:border-darkBorder shadow-sm">
        {/* Table Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5 mb-6 gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-brandBlue" />
              <span>Katalog Produk Toko UMKM & Label Barcode</span>
            </h2>
            <p className="text-xs text-slate-400">
              Total {products.length} produk terdaftar di database toko. Label barcode dapat langsung dipindai dari layar HP Anda atau dicetak.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchProducts()}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              title="Segarkan Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 bg-brandBlue text-white text-xs font-bold rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-1.5 shadow-sm shadow-brandBlue/30"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Barang Baru</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama barang, kode barcode SKU, atau kategori..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandBlue"
            />
          </div>

          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter Kategori Produk"
              className="px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brandBlue cursor-pointer"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-white/10 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3">Label Barcode (Bisa Di-scan)</th>
                <th className="py-3 px-3">Nama Barang & SKU</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3">Harga Jual (Pcs)</th>
                <th className="py-3 px-3 text-center">Sisa Stok</th>
                <th className="py-3 px-3 text-center">Batas Aman</th>
                <th className="py-3 px-3">Kondisi</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
              {products.length > 0 ? (
                products.map((p) => {
                  const isSafe = p.stockStatus === 'SAFE';
                  const isLow = p.stockStatus === 'LOW_STOCK';
                  const isOut = p.stockStatus === 'OUT_OF_STOCK';

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                    >
                      {/* Barcode SVG */}
                      <td className="py-3 px-3">
                        <SvgBarcode value={p.sku} height={36} showText={true} />
                      </td>

                      {/* Product Name & SKU */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 dark:text-white block text-sm">
                          {p.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setScanSku(p.sku)}
                          title="Gunakan SKU ini di scanner"
                          className="font-mono text-[11px] text-brandBlue hover:underline inline-flex items-center gap-1 mt-0.5"
                        >
                          <Tag className="w-3 h-3" />
                          <span>{p.sku}</span>
                        </button>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300">
                          {p.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                        Rp {p.price.toLocaleString()}
                      </td>

                      {/* Current Stock */}
                      <td className="py-3 px-3 text-center">
                        <span className="text-base font-black text-slate-900 dark:text-white">
                          {p.currentStock}
                        </span>
                        <span className="text-[10px] text-slate-400 block">unit</span>
                      </td>

                      {/* Min Threshold */}
                      <td className="py-3 px-3 text-center font-mono font-medium text-slate-500">
                        {p.minStockThreshold} unit
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        {isSafe && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Aman
                          </span>
                        )}
                        {isLow && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Menipis
                          </span>
                        )}
                        {isOut && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Habis (0)
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setScanSku(p.sku);
                              setScanAction('IN');
                              setScanQty(10);
                            }}
                            title="Isi Form Scan (+10)"
                            className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold transition-colors"
                          >
                            +10
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(p);
                              setEditThreshold(p.minStockThreshold);
                              setEditPrice(p.price);
                            }}
                            title="Edit Ambang Batas & Harga"
                            className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p)}
                            title="Hapus Produk"
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                    Tidak ada produk ditemukan. Tambah produk baru atau klik Seed Data di Settings.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD NEW PRODUCT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-darkCard rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-darkBorder shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              + Tambah Barang Dagangan Baru
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Daftarkan produk toko agar bisa langsung discan barcode dan dicatat penjualannya.
            </p>
            <form onSubmit={handleAddProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kode Barcode / SKU (Unik)
                </label>
                <input
                  type="text"
                  required
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value.toUpperCase())}
                  placeholder="Contoh: BRG-009"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandBlue"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Barang / Produk
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Kopi Robusta Lampung 200g"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandBlue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori
                  </label>
                  <input
                    type="text"
                    required
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Sembako / Camilan"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandBlue"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Harga Jual Satuan (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandBlue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Stok Awal Fisik (Pcs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newStock}
                    onChange={(e) => setNewStock(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandBlue"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Batas Aman Peringatan (Pcs)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newMinThreshold}
                    onChange={(e) => setNewMinThreshold(parseInt(e.target.value, 10) || 5)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandBlue"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-4 py-2 rounded-xl bg-brandBlue text-white font-bold hover:bg-blue-600 shadow-md shadow-brandBlue/30 disabled:opacity-50"
                >
                  {addLoading ? 'Menyimpan...' : 'Simpan Barang ke Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT THRESHOLD & PRICE */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-darkCard rounded-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-darkBorder shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Ubah Harga & Batas Stok Toko
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-medium">
              {editingProduct.name} ({editingProduct.sku})
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Batas Aman Peringatan Stok (Pcs)
                </label>
                <input
                  type="number"
                  min="1"
                  value={editThreshold}
                  onChange={(e) => setEditThreshold(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandBlue"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Harga Jual Satuan (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editPrice}
                  onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandBlue"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-3 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-white/5"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleUpdateProduct}
                className="px-4 py-2 rounded-xl bg-brandBlue text-white font-bold hover:bg-blue-600 shadow-md shadow-brandBlue/30"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

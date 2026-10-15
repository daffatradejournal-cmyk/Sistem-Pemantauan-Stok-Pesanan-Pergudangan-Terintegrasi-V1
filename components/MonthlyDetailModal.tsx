'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  TrendingUp,
  DollarSign,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Printer,
  RefreshCw,
  ShoppingBag,
  Award,
  ArrowRight,
  Layers,
} from 'lucide-react';

interface MonthlyDetailData {
  period: {
    year: number;
    month: number;
    monthName: string;
    formattedLabel: string;
  };
  summary: {
    approvedOrders: number;
    totalOrders: number;
    itemsSold: number;
    totalRevenue: number;
    totalCost: number;
    netProfit: number;
    profitMargin: number;
    inflowQty: number;
    outflowQty: number;
    totalMovements: number;
  };
  topProducts: Array<{
    id: number;
    sku: string;
    name: string;
    category: string;
    price: number;
    costPrice: number;
    totalSold: number;
    totalRevenue: number;
    totalCost: number;
    netProfit: number;
    profitMargin: number;
    orderCount: number;
  }>;
  stockMovements: Array<{
    id: number;
    sku: string;
    productName: string;
    productCategory: string;
    changeType: string;
    quantityChange: number;
    previousStock: number;
    newStock: number;
    notes: string;
    createdAt: string;
  }>;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialYear?: string;
  initialMonth?: number; // 1 to 12
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// Support tahun dari 2024 sampai 2100 dinamis
const YEARS = Array.from({ length: 2100 - 2024 + 1 }, (_, i) => (2024 + i).toString());

export function MonthlyDetailModal({
  isOpen,
  onClose,
  initialYear,
  initialMonth,
}: Props) {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<string>(
    initialYear || currentDate.getFullYear().toString()
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    initialMonth || (currentDate.getMonth() + 1)
  );

  const [activeSubTab, setActiveSubTab] = useState<'products' | 'movements'>('products');
  const [searchFilter, setSearchFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [detailData, setDetailData] = useState<MonthlyDetailData | null>(null);

  // Sync initial props
  useEffect(() => {
    if (initialYear) setSelectedYear(initialYear);
    if (initialMonth) setSelectedMonth(initialMonth);
  }, [initialYear, initialMonth]);

  // Fetch monthly report
  const fetchMonthlyDetail = async () => {
    if (!isOpen) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/dashboard/monthly-detail?year=${selectedYear}&month=${selectedMonth}`
      );
      const data = await res.json();
      if (data.success) {
        setDetailData(data.data);
      }
    } catch (err) {
      console.error('Failed to load monthly detail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMonthlyDetail();
    }
  }, [isOpen, selectedYear, selectedMonth]);

  if (!isOpen) return null;

  const summary = detailData?.summary || {
    approvedOrders: 0,
    totalOrders: 0,
    itemsSold: 0,
    totalRevenue: 0,
    totalCost: 0,
    netProfit: 0,
    profitMargin: 0,
    inflowQty: 0,
    outflowQty: 0,
    totalMovements: 0,
  };

  const filteredProducts = (detailData?.topProducts || []).filter((p) => {
    const q = searchFilter.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  const filteredMovements = (detailData?.stockMovements || []).filter((m) => {
    const q = searchFilter.toLowerCase();
    return (
      m.productName.toLowerCase().includes(q) ||
      m.sku.toLowerCase().includes(q) ||
      m.notes.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-darkCard rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col border border-slate-200 dark:border-darkBorder shadow-2xl overflow-hidden animate-in fade-in duration-200">
        
        {/* Header Bar */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brandBlue/10 text-brandBlue flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  Laporan & Tracking Bulanan Toko
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brandBlue/10 text-brandBlue border border-brandBlue/20">
                  {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pantau barang yang paling laku, omzet, modal (HPP), keuntungan bersih nyata, dan mutasi keluar-masuk.
              </p>
            </div>
          </div>

          {/* Month & Year Selectors + Close Button */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Bulan Selector */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              aria-label="Pilih Bulan Laporan"
              className="bg-white dark:bg-darkCard border border-slate-200 dark:border-white/10 text-xs font-bold rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brandBlue shadow-sm cursor-pointer"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={idx} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>

            {/* Tahun Selector (2024 s/d 2100) */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              aria-label="Pilih Tahun Laporan"
              className="bg-white dark:bg-darkCard border border-slate-200 dark:border-white/10 text-xs font-bold rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brandBlue shadow-sm cursor-pointer"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  Tahun {y}
                </option>
              ))}
            </select>

            {/* Refresh button */}
            <button
              type="button"
              onClick={fetchMonthlyDetail}
              disabled={isLoading}
              title="Perbarui Data Bulan Ini"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Print button */}
            <button
              type="button"
              onClick={() => window.print()}
              title="Cetak Laporan Bulanan"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* 4 Financial Highlight Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Total Omzet Penjualan */}
            <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
                <span className="text-xs font-bold uppercase tracking-wider">Total Omzet Penjualan</span>
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="mt-2">
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Rp {summary.totalRevenue.toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Dari {summary.approvedOrders} pesanan ({summary.itemsSold} unit laku)
                </p>
              </div>
            </div>

            {/* Card 2: Total Modal (HPP Kulakan) */}
            <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Total Modal (HPP)</span>
                <Layers className="w-4 h-4" />
              </div>
              <div className="mt-2">
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Rp {summary.totalCost.toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Modal kulakan atas barang terjual
                </p>
              </div>
            </div>

            {/* Card 3: Keuntungan Bersih (Laba Bersih) */}
            <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                <span className="text-xs font-bold uppercase tracking-wider">Keuntungan Bersih (Laba)</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="mt-2">
                <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  Rp {summary.netProfit.toLocaleString()}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                    Margin: {summary.profitMargin}%
                  </span>
                  <span className="text-[10px] text-slate-400">
                    (Omzet - Modal)
                  </span>
                </div>
              </div>
            </div>

            {/* Card 4: Arus Keluar Masuk Stok */}
            <div className="bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-purple-600 dark:text-purple-400">
                <span className="text-xs font-bold uppercase tracking-wider">Arus Mutasi Barang</span>
                <Package className="w-4 h-4" />
              </div>
              <div className="mt-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ArrowDownLeft className="w-3.5 h-3.5" /> +{summary.inflowQty} Masuk
                  </span>
                  <span className="text-sm font-bold text-rose-500 flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" /> -{summary.outflowQty} Keluar
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Total {summary.totalMovements} kali pergerakan stok
                </p>
              </div>
            </div>

          </div>

          {/* Sub Navigation Tabs & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveSubTab('products')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeSubTab === 'products'
                    ? 'bg-white dark:bg-darkCard text-brandBlue shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Barang Laku / Terjual ({detailData?.topProducts?.length || 0})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('movements')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeSubTab === 'movements'
                    ? 'bg-white dark:bg-darkCard text-brandBlue shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Mutasi Keluar & Masuk ({detailData?.stockMovements?.length || 0})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Cari nama barang atau kode SKU..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandBlue"
              />
            </div>
          </div>

          {/* TAB 1: BARANG TERJUAL / LAKU */}
          {activeSubTab === 'products' && (
            <div className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-3 text-center">Rank</th>
                      <th className="py-3 px-3">Nama Produk & SKU</th>
                      <th className="py-3 px-3">Kategori</th>
                      <th className="py-3 px-3 text-center">Terjual (Unit)</th>
                      <th className="py-3 px-3 text-right">Harga Modal</th>
                      <th className="py-3 px-3 text-right">Harga Jual</th>
                      <th className="py-3 px-3 text-right">Total Omzet</th>
                      <th className="py-3 px-3 text-right">Total Modal</th>
                      <th className="py-3 px-3 text-right">Untung Bersih</th>
                      <th className="py-3 px-3 text-center">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((p, idx) => (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors"
                        >
                          <td className="py-3 px-3 text-center font-bold text-slate-400">
                            #{idx + 1}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {p.name}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {p.sku}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300">
                              {p.category}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="font-black text-sm text-slate-900 dark:text-white">
                              {p.totalSold}
                            </span>
                            <span className="text-[10px] text-slate-400 block">{p.orderCount} transaksi</span>
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-slate-500">
                            Rp {p.costPrice.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-slate-800 dark:text-slate-200">
                            Rp {p.price.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-brandBlue">
                            Rp {p.totalRevenue.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-slate-500">
                            Rp {p.totalCost.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                            +Rp {p.netProfit.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              {p.profitMargin}%
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-400 text-xs">
                          {isLoading
                            ? 'Memuat data penjualan...'
                            : `Belum ada produk yang terjual pada periode ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}.`}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: MUTASI KELUAR & MASUK */}
          {activeSubTab === 'movements' && (
            <div className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-3">Waktu & Tanggal</th>
                      <th className="py-3 px-3">Nama Produk & SKU</th>
                      <th className="py-3 px-3">Tipe Mutasi</th>
                      <th className="py-3 px-3 text-center">Perubahan Qty</th>
                      <th className="py-3 px-3 text-center">Sisa Stok</th>
                      <th className="py-3 px-3">Keterangan / Referensi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {filteredMovements.length > 0 ? (
                      filteredMovements.map((m) => {
                        const isInflow = m.quantityChange > 0;
                        const formattedDate = new Date(m.createdAt).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <tr
                            key={m.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors"
                          >
                            <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                              {formattedDate}
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-bold text-slate-900 dark:text-white block">
                                {m.productName}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">
                                {m.sku}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              {isInflow ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  <ArrowDownLeft className="w-3 h-3" />
                                  Barang Masuk ({m.changeType})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                  <ArrowUpRight className="w-3 h-3" />
                                  Barang Keluar ({m.changeType})
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`text-sm font-black ${
                                  isInflow
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-rose-500'
                                }`}
                              >
                                {isInflow ? `+${m.quantityChange}` : m.quantityChange} unit
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                              {m.newStock} pcs
                            </td>
                            <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-[11px]">
                              {m.notes || '-'}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                          {isLoading
                            ? 'Memuat mutasi stok...'
                            : `Belum ada riwayat mutasi stok pada periode ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}.`}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between text-xs text-slate-500">
          <span>
            Periode Laporan Aktif: <strong className="text-slate-800 dark:text-white">{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity"
          >
            Tutup Laporan
          </button>
        </div>

      </div>
    </div>
  );
}

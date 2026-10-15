'use client';

import React, { useState, useEffect } from 'react';
import {
  BellRing,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Clock,
  History,
  PlusCircle,
  Search,
  Filter,
  RefreshCw,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';

export function AlertsView({ onRefreshGlobal }: { onRefreshGlobal?: () => void }) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertFilter, setAlertFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  // Audit Logs state
  const [logs, setLogs] = useState<any[]>([]);
  const [logTypeFilter, setLogTypeFilter] = useState('ALL');
  const [logSearch, setLogSearch] = useState('');
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const res = await fetch(`/api/alerts?status=${alertFilter}`);
      const data = await res.json();
      if (data.success) {
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error('Fetch alerts error:', err);
    } finally {
      setLoadingAlerts(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch(`/api/logs?type=${logTypeFilter}&search=${encodeURIComponent(logSearch)}&limit=100`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Fetch logs error:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [alertFilter]);

  useEffect(() => {
    fetchLogs();
  }, [logTypeFilter, logSearch]);

  const handleQuickRestock = async (alertId: number, minThreshold: number) => {
    const qty = Math.max(minThreshold * 2, 10);
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId,
          action: 'quick_restock',
          restockQuantity: qty,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAlerts();
        fetchLogs();
        if (onRefreshGlobal) onRefreshGlobal();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResolveAlert = async (alertId: number) => {
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId,
          action: 'resolve',
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAlerts();
        if (onRefreshGlobal) onRefreshGlobal();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: ACTIVE STOCK ALERTS */}
      <div className="bg-white dark:bg-darkCard rounded-2xl p-6 border border-slate-100 dark:border-darkBorder shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5 mb-6 gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <BellRing className="w-5 h-5 text-brandAmber" />
              <span>Peringatan Stok Menipis & Habis (Waktunya Kulakan)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Notifikasi otomatis saat stok barang mulai menipis mendekati batas aman, agar toko tidak kehabisan barang saat pembeli datang.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setAlertFilter('unresolved')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  alertFilter === 'unresolved'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Perlu Kulakan ({alerts.filter(a => !a.isResolved).length})
              </button>
              <button
                type="button"
                onClick={() => setAlertFilter('resolved')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  alertFilter === 'resolved'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Sudah Terpenuhi
              </button>
              <button
                type="button"
                onClick={() => setAlertFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  alertFilter === 'all'
                    ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Semua
              </button>
            </div>

            <button
              onClick={fetchAlerts}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              title="Segarkan Peringatan"
            >
              <RefreshCw className={`w-4 h-4 ${loadingAlerts ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {alerts.length > 0 ? (
            alerts.map((a) => {
              const isOutOfStock = a.alertType === 'OUT_OF_STOCK';
              return (
                <div
                  key={a.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    a.isResolved
                      ? 'bg-slate-50/50 dark:bg-white/5 border-slate-200 dark:border-white/10 opacity-75'
                      : isOutOfStock
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-200'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      {isOutOfStock ? (
                        <AlertOctagon className="w-5 h-5 text-rose-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase ${
                            isOutOfStock
                              ? 'bg-rose-500 text-white'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          {isOutOfStock ? 'STOK HABIS (0)' : 'STOK MENIPIS'}
                        </span>
                        <span className="font-bold text-xs text-slate-800 dark:text-white">
                          {a.productName} ({a.productSku})
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(a.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs mt-1 text-slate-700 dark:text-slate-300 font-medium">
                        {a.message}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Sisa Stok: <strong>{a.currentStock} pcs</strong></span>
                        <span>Batas Aman Toko: <strong>{a.minStockThreshold} pcs</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {!a.isResolved && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleQuickRestock(a.id, a.minStockThreshold)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Kulakan Cepat (+{Math.max(a.minStockThreshold * 2, 10)})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResolveAlert(a.id)}
                        className="px-3 py-1.5 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-800 dark:text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        Tandai Selesai
                      </button>
                    </div>
                  )}

                  {a.isResolved && (
                    <div className="flex items-center gap-1 text-xs text-emerald-500 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Stok Sudah Aman</span>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              Tidak ada notifikasi peringatan pada filter ini. Semua stok barang dalam kondisi aman!
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: AUDIT TRAIL LOGS */}
      <div className="bg-white dark:bg-darkCard rounded-2xl p-6 border border-slate-100 dark:border-darkBorder shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5 mb-6 gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-brandBlue" />
              <span>Buku Catatan Arus Barang Toko (Mutasi Real-Time)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Catatan otomatis setiap kali ada barang masuk (kulakan), barang keluar (penjualan kasir), atau koreksi stok.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              title="Segarkan Log"
            >
              <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              placeholder="Cari kode SKU, nama barang, atau keterangan..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandBlue"
            />
          </div>

          <select
            value={logTypeFilter}
            onChange={(e) => setLogTypeFilter(e.target.value)}
            aria-label="Filter Tipe Mutasi Stok"
            className="px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brandBlue cursor-pointer"
          >
            <option value="ALL">Semua Aktivitas</option>
            <option value="BARCODE_IN">Barang Masuk / Kulakan (IN)</option>
            <option value="BARCODE_OUT">Barang Keluar Langsung (OUT)</option>
            <option value="ORDER_DEDUCTION">Penjualan Kasir (Pesanan)</option>
            <option value="MANUAL_ADJUST">Penyesuaian / Koreksi Stok</option>
          </select>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-white/10 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">Waktu Catat</th>
                <th className="py-2.5 px-3">Barang & SKU</th>
                <th className="py-2.5 px-3">Aktivitas</th>
                <th className="py-2.5 px-3 text-center">Selisih (Pcs)</th>
                <th className="py-2.5 px-3 text-center">Stok Awal → Sisa</th>
                <th className="py-2.5 px-3">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {logs.length > 0 ? (
                logs.map((log) => {
                  const isPositive = log.quantityChange > 0;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {log.productName}
                        </span>
                        <span className="font-mono text-[10px] text-brandBlue">
                          {log.sku}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300">
                          {log.changeType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-0.5 font-bold ${
                            isPositive ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {isPositive ? `+${log.quantityChange}` : log.quantityChange} unit
                          </span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        {log.previousStock} → <strong className="text-slate-900 dark:text-white">{log.newStock}</strong>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 truncate max-w-xs">
                        {log.notes || '-'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada riwayat mutasi stok ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server,
  Terminal,
  Layers,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  Copy,
} from 'lucide-react';

interface Props {
  dbStatus: any;
  onRefreshStatus: () => void;
  onRefreshGlobal?: () => void;
}

export function SettingsView({ dbStatus, onRefreshStatus, onRefreshGlobal }: Props) {
  const [customDbUrl, setCustomDbUrl] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [configFeedback, setConfigFeedback] = useState<any>(null);

  const [initLoading, setInitLoading] = useState(false);
  const [initFeedback, setInitFeedback] = useState<any>(null);

  const [seedLoading, setSeedLoading] = useState(false);
  const [seedFeedback, setSeedFeedback] = useState<any>(null);

  const handleApplyCustomUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDbUrl.trim()) return;

    setTestingConnection(true);
    setConfigFeedback(null);
    try {
      const res = await fetch('/api/db/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ databaseUrl: customDbUrl.trim() }),
      });
      const data = await res.json();
      setConfigFeedback(data);
      onRefreshStatus();
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err: any) {
      setConfigFeedback({ success: false, error: err.message });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleInitDatabase = async () => {
    setInitLoading(true);
    setInitFeedback(null);
    try {
      const res = await fetch('/api/db/init', { method: 'POST' });
      const data = await res.json();
      setInitFeedback(data);
      onRefreshStatus();
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err: any) {
      setInitFeedback({ success: false, error: err.message });
    } finally {
      setInitLoading(false);
    }
  };

  const handleSeedDatabase = async () => {
    if (!confirm('Apakah Anda ingin mengisi database dengan katalog sampel gudang & transaksi awal? Data pesanan lama akan di-reset.')) return;
    setSeedLoading(true);
    setSeedFeedback(null);
    try {
      const res = await fetch('/api/db/seed', { method: 'POST' });
      const data = await res.json();
      setSeedFeedback(data);
      onRefreshStatus();
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err: any) {
      setSeedFeedback({ success: false, error: err.message });
    } finally {
      setSeedLoading(false);
    }
  };

  const isConnected = dbStatus?.status?.connected;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* SECTION 1: LIVE CONNECTION MONITOR */}
      <div className="bg-white dark:bg-darkCard rounded-2xl p-6 border border-slate-100 dark:border-darkBorder shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5 mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isConnected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                Status Koneksi Database PostgreSQL Toko
              </h2>
              <p className="text-xs text-slate-400">
                Terhubung langsung menggunakan koneksi pool PostgreSQL <code>pg.Pool</code>
              </p>
            </div>
          </div>

          <button
            onClick={onRefreshStatus}
            className="px-3 py-1.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Cek Kecepatan Respon</span>
          </button>
        </div>

        {/* Status Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
            <span className="text-[11px] text-slate-400 font-semibold block">Status Koneksi</span>
            <div className="flex items-center gap-2 mt-1">
              {isConnected ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-bold text-emerald-500">TERHUBUNG (Aktif)</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <span className="text-sm font-bold text-rose-500">BELUM TERHUBUNG</span>
                </>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
            <span className="text-[11px] text-slate-400 font-semibold block">Kecepatan Respon (Ping)</span>
            <div className="text-sm font-black text-slate-900 dark:text-white mt-1 font-mono">
              {dbStatus?.status?.latencyMs !== undefined ? `${dbStatus.status.latencyMs} ms` : '-'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
            <span className="text-[11px] text-slate-400 font-semibold block">Nama Database</span>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 font-mono truncate">
              {dbStatus?.status?.database || 'none'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
            <span className="text-[11px] text-slate-400 font-semibold block">Tabel Siap Digunakan</span>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
              {dbStatus?.status?.tableCount !== undefined ? `${dbStatus.status.tableCount} / 4 Tabel` : '0 / 4 Tabel'}
            </div>
          </div>
        </div>

        {/* Current Active Connection String */}
        <div className="mt-4 p-3 bg-slate-100 dark:bg-black/30 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-mono text-slate-600 dark:text-slate-300 truncate">
            <Server className="w-4 h-4 flex-shrink-0 text-brandBlue" />
            <span className="text-slate-400">URL Database Aktif:</span>
            <span className="truncate">{dbStatus?.databaseUrl || 'postgresql://...'}</span>
          </div>
        </div>

        {!isConnected && (
          <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
            <strong>Pemberitahuan:</strong> {dbStatus?.status?.error || 'Database belum terhubung. Tempelkan link database PostgreSQL gratis (misal dari Neon.tech atau Supabase) di bawah.'}
          </div>
        )}
      </div>

      {/* SECTION 2: 1-CLICK MIGRATION & SEEDING */}
      <div className="bg-white dark:bg-darkCard rounded-2xl p-6 border border-slate-100 dark:border-darkBorder shadow-sm">
        <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">
          Inisialisasi Tabel & Data Sampel Toko UMKM (1-Klik Siap Pakai)
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Untuk toko baru yang baru mulai, cukup gunakan 2 tombol praktis berikut untuk langsung memulai:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Init Tables Button */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 font-bold text-sm text-slate-900 dark:text-white">
                <Layers className="w-4 h-4 text-brandBlue" />
                <span>1. Buat Struktur Tabel Toko</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Membuat 4 tabel utama: produk barang, pesanan kasir, catatan mutasi stok, dan sistem peringatan otomatis.
              </p>
            </div>
            <button
              type="button"
              onClick={handleInitDatabase}
              disabled={initLoading || !isConnected}
              className="mt-4 w-full py-2.5 px-4 bg-brandBlue hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-brandBlue/20 disabled:opacity-50"
            >
              {initLoading ? 'Membuat Struktur Tabel...' : 'Buat Struktur Tabel Sekarang'}
            </button>
          </div>

          {/* Seed Sample Data Button */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 font-bold text-sm text-slate-900 dark:text-white">
                <Sparkles className="w-4 h-4 text-brandAmber" />
                <span>2. Isi Contoh Produk & Transaksi UMKM</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Langsung mengisi katalog 8 produk sembako/makanan (Minyak Bimoli, Beras Ramos, Gulaku, Kopi Robusta, dsb.) beserta transaksi awal toko.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSeedDatabase}
              disabled={seedLoading || !isConnected}
              className="mt-4 w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              {seedLoading ? 'Mengisi Data Toko...' : 'Isi Data Contoh UMKM Sekarang'}
            </button>
          </div>
        </div>

        {initFeedback && (
          <div className={`mt-4 p-3 rounded-xl border text-xs font-semibold ${initFeedback.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' : 'bg-rose-500/10 border-rose-500/30 text-rose-600'}`}>
            {initFeedback.message || initFeedback.error}
          </div>
        )}

        {seedFeedback && (
          <div className={`mt-4 p-3 rounded-xl border text-xs font-semibold ${seedFeedback.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' : 'bg-rose-500/10 border-rose-500/30 text-rose-600'}`}>
            {seedFeedback.message || seedFeedback.error}
          </div>
        )}
      </div>

      {/* SECTION 3: EDIT CONNECTION STRING FORM */}
      <div className="bg-white dark:bg-darkCard rounded-2xl p-6 border border-slate-100 dark:border-darkBorder shadow-sm">
        <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">
          Ubah Connection String Database (Session Override)
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Tempelkan URL koneksi PostgreSQL Anda dari <strong>Neon, Supabase, Railway, Render, atau Local PostgreSQL</strong>. Perubahan akan langsung diuji secara real-time.
        </p>

        <form onSubmit={handleApplyCustomUrl} className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={customDbUrl}
              onChange={(e) => setCustomDbUrl(e.target.value)}
              placeholder="postgresql://user:password@ep-sample-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brandBlue"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Tips: Untuk cloud hosting (Neon/Supabase), tambahkan <code>?sslmode=require</code> di akhir URL.
            </span>
            <button
              type="submit"
              disabled={testingConnection || !customDbUrl.trim()}
              className="px-4 py-2 bg-brandBlue hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-brandBlue/30 disabled:opacity-50"
            >
              {testingConnection ? 'Menghubungkan...' : 'Terapkan & Uji Koneksi'}
            </button>
          </div>
        </form>

        {configFeedback && (
          <div className={`mt-4 p-3 rounded-xl border text-xs font-semibold ${configFeedback.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' : 'bg-rose-500/10 border-rose-500/30 text-rose-600'}`}>
            {configFeedback.message || configFeedback.error}
          </div>
        )}
      </div>
    </div>
  );
}

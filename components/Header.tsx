'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Sun,
  Moon,
  Bell,
  Database,
  User,
  Camera,
  CheckCircle,
  X,
  Edit2,
} from 'lucide-react';

interface Props {
  title: string;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  unresolvedAlertsCount: number;
  onAlertsClick: () => void;
  dbConnected: boolean;
  onDbClick: () => void;
}

export function Header({
  title,
  isDarkMode,
  onToggleTheme,
  unresolvedAlertsCount,
  onAlertsClick,
  dbConnected,
  onDbClick,
}: Props) {
  const [profile, setProfile] = useState({
    ownerName: 'Muhammad',
    storeName: 'StokPintar UMKM',
    roleTitle: 'Pemilik Usaha (UMKM)',
    avatarUrl: '',
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('Muhammad');
  const [editStore, setEditStore] = useState('StokPintar UMKM');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Load profile from PostgreSQL
  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
        setEditName(data.profile.ownerName || 'Muhammad');
        setEditStore(data.profile.storeName || 'StokPintar UMKM');
        setEditAvatarUrl(data.profile.avatarUrl || '');
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [dbConnected]);

  // Handle Photo File Upload to Data URL
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran foto maksimal 2MB agar hemat penyimpanan database.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setEditAvatarUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Profile to PostgreSQL
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setSaveMessage(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerName: editName.trim() || 'Muhammad',
          storeName: editStore.trim() || 'StokPintar UMKM',
          roleTitle: 'Pemilik Usaha (UMKM)',
          avatarUrl: editAvatarUrl,
        }),
      });
      const data = await res.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
        setSaveMessage('Profil berhasil disimpan ke database PostgreSQL!');
        setTimeout(() => {
          setIsEditModalOpen(false);
          setSaveMessage(null);
        }, 1000);
      } else {
        alert(data.error || 'Gagal menyimpan profil');
      }
    } catch (err: any) {
      alert(err.message || 'Kesalahan saat menyimpan profil');
    } finally {
      setSavingProfile(false);
    }
  };

  const initial = profile.ownerName ? profile.ownerName.charAt(0).toUpperCase() : 'M';

  return (
    <>
      <header className="h-20 bg-white/80 dark:bg-darkBg/80 backdrop-blur-md border-b border-slate-200/80 dark:border-darkBorder px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20 transition-colors">
        {/* Left: Title & Subtitle */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {title}
            </h1>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              {profile.storeName} — Sistem Inventaris & Kasir Usaha Mikro, Kecil, dan Menengah
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* PostgreSQL Connection Indicator */}
          <button
            onClick={onDbClick}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              dbConnected
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 animate-pulse'
            }`}
            title="Klik untuk membuka status database PostgreSQL"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {dbConnected ? 'Database Terhubung (Live)' : 'Setup DB Diperlukan'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                dbConnected ? 'bg-emerald-500 shadow-[0_0_6px_#10B981]' : 'bg-amber-500'
              }`}
            />
          </button>

          {/* Theme Toggle Pill */}
          <div className="flex items-center bg-slate-100 dark:bg-darkCard rounded-full p-1 border border-slate-200/80 dark:border-darkBorder">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
              title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold transition-all"
            >
              <div
                className={`p-1 rounded-full ${
                  !isDarkMode
                    ? 'bg-white text-amber-500 shadow-sm'
                    : 'text-slate-400'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
              </div>
              <div
                className={`p-1 rounded-full ${
                  isDarkMode
                    ? 'bg-brandBlue text-white shadow-sm'
                    : 'text-slate-400'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>

          {/* Bell Notification with Live Count */}
          <button
            onClick={onAlertsClick}
            className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-darkCard transition-colors"
            title={`${unresolvedAlertsCount} peringatan stok perlu kulakan ulang`}
          >
            <Bell className="w-5 h-5" />
            {unresolvedAlertsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-bounce">
                {unresolvedAlertsCount}
              </span>
            )}
          </button>

          {/* Clickable UMKM User Profile (Stored in PostgreSQL) */}
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-darkBorder group text-left hover:opacity-90 transition-opacity"
            title="Klik untuk mengubah nama & foto profil di database"
          >
            <div className="relative w-9 h-9 rounded-full bg-gradient-to-tr from-brandBlue to-emerald-500 border-2 border-white dark:border-darkCard shadow-sm flex items-center justify-center text-xs font-black text-white overflow-hidden">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.ownerName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initial}</span>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Edit2 className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="hidden lg:block text-left">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight group-hover:text-brandBlue transition-colors">
                {profile.ownerName}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                {profile.roleTitle}
              </span>
            </div>
          </button>
        </div>
      </header>

      {/* MODAL EDIT PROFIL PEMILIK & FOTO TOKO */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-darkCard rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-darkBorder shadow-2xl relative">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <User className="w-5 h-5 text-brandBlue" />
              <span>Profil Pemilik Toko (PostgreSQL)</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Nama dan foto profil ini akan disimpan langsung ke database PostgreSQL toko Anda.
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              {/* Photo Preview & Upload */}
              <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-brandBlue to-emerald-500 flex items-center justify-center text-white text-lg font-black overflow-hidden shadow-inner flex-shrink-0">
                  {editAvatarUrl ? (
                    <img
                      src={editAvatarUrl}
                      alt="Pratinjau Foto"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{editName ? editName.charAt(0).toUpperCase() : 'M'}</span>
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Upload Foto Profil / Logo
                  </label>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brandBlue hover:bg-blue-600 text-white rounded-lg cursor-pointer text-xs font-semibold shadow-sm transition-all">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Pilih Foto dari Galeri</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {editAvatarUrl && (
                    <button
                      type="button"
                      onClick={() => setEditAvatarUrl('')}
                      className="block text-[10px] text-rose-500 hover:underline"
                    >
                      Hapus Foto (Gunakan Inisial)
                    </button>
                  )}
                </div>
              </div>

              {/* Owner Name Input */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Pemilik Usaha
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Contoh: Muhammad"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-brandBlue"
                />
              </div>

              {/* Store Name Input */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Toko / Usaha UMKM
                </label>
                <input
                  type="text"
                  required
                  value={editStore}
                  onChange={(e) => setEditStore(e.target.value)}
                  placeholder="Contoh: Toko Berkah Mandiri"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-brandBlue"
                />
              </div>

              {/* Optional Photo URL */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Atau Tempel Link URL Foto (Opsional)
                </label>
                <input
                  type="url"
                  value={editAvatarUrl.startsWith('data:') ? '' : editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  placeholder="https://example.com/foto-saya.jpg"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brandBlue"
                />
              </div>

              {saveMessage && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{saveMessage}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingProfile || !editName.trim()}
                  className="px-4 py-2 bg-brandBlue hover:bg-blue-600 text-white font-bold rounded-xl shadow-md shadow-brandBlue/30 disabled:opacity-50"
                >
                  {savingProfile ? 'Menyimpan ke DB...' : 'Simpan Profil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

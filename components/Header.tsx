'use client';

import React from 'react';
import {
  Calendar,
  Sun,
  Moon,
  Bell,
  Database,
  Store,
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
  return (
    <header className="h-20 bg-white/80 dark:bg-darkBg/80 backdrop-blur-md border-b border-slate-200/80 dark:border-darkBorder px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20 transition-colors">
      {/* Left: Title & Subtitle */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {title}
          </h1>
          <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
            Sistem Inventaris Pergudangan & Kasir Usaha Mikro, Kecil, dan Menengah
          </p>
        </div>

        <div className="hidden xl:flex items-center gap-2 bg-slate-100 dark:bg-darkCard px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-darkBorder text-xs text-slate-600 dark:text-slate-300 font-medium ml-2">
          <Calendar className="w-3.5 h-3.5 text-brandBlue" />
          <span>Bulan Berjalan 2024</span>
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

        {/* Indonesian UMKM User Profile */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-darkBorder">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brandBlue to-emerald-500 border-2 border-white dark:border-darkCard shadow-sm flex items-center justify-center text-xs font-black text-white">
            BS
          </div>
          <div className="hidden lg:block text-left">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight">
              Budi Santoso
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
              Pemilik Usaha (UMKM)
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

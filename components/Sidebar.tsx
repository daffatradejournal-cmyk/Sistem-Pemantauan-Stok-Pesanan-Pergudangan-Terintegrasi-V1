'use client';

import React from 'react';
import {
  BarChart3,
  Package,
  Layers,
  BellRing,
  Settings,
  RefreshCw,
  HelpCircle,
  Store,
  Sparkles,
} from 'lucide-react';

export type NavTab = 'analytics' | 'products' | 'orders' | 'alerts' | 'settings';

interface Props {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  unresolvedAlertsCount?: number;
}

export function Sidebar({ activeTab, onTabChange, unresolvedAlertsCount = 0 }: Props) {
  const navItems: Array<{
    id: NavTab;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
    {
      id: 'analytics',
      label: 'Ringkasan Toko',
      sublabel: 'Dasbor & Omzet',
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      id: 'products',
      label: 'Katalog & Barcode',
      sublabel: 'Scan Masuk / Keluar',
      icon: <Package className="w-5 h-5" />,
    },
    {
      id: 'orders',
      label: 'Pesanan & Kasir',
      sublabel: 'Anti-Stok Minus DB',
      icon: <Layers className="w-5 h-5" />,
    },
    {
      id: 'alerts',
      label: 'Peringatan & Mutasi',
      sublabel: 'Stok Menipis & Log',
      icon: <BellRing className="w-5 h-5" />,
      badge: unresolvedAlertsCount,
    },
    {
      id: 'settings',
      label: 'Pengaturan Database',
      sublabel: 'Koneksi & Data Awal',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-darkSidebar border-r border-slate-200 dark:border-darkBorder flex flex-col justify-between p-5 select-none flex-shrink-0 transition-colors">
      {/* Top Brand Logo */}
      <div>
        <div className="flex items-center gap-3 px-2 mb-7">
          {/* Stylized Logo Mark */}
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-brandBlue to-brandPurple flex items-center justify-center text-white shadow-md shadow-brandBlue/20 flex-shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                StokPintar
              </span>
              <span className="px-1.5 py-0.2 text-[9px] font-black rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                UMKM
              </span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block leading-tight">
              Manajemen Stok & Kasir Toko
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md shadow-black/5 dark:shadow-white/5'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={isActive ? 'text-brandBlue dark:text-brandBlue' : 'text-slate-400 dark:text-slate-500'}>
                    {item.icon}
                  </div>
                  <div className="min-w-0 truncate">
                    <span className="block text-xs font-bold leading-tight truncate">
                      {item.label}
                    </span>
                    <span className={`block text-[10px] truncate ${isActive ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400'}`}>
                      {item.sublabel}
                    </span>
                  </div>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`ml-2 px-1.5 py-0.5 text-[10px] font-black rounded-full flex-shrink-0 ${
                      isActive
                        ? 'bg-rose-500 text-white'
                        : 'bg-rose-500/15 text-rose-500 dark:text-rose-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Support Card & Footer Actions */}
      <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/5">
        {/* Support Card for UMKM */}
        <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-3.5 border border-slate-200/60 dark:border-white/5 relative overflow-hidden text-center">
          <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-tr from-brandBlue to-emerald-500 flex items-center justify-center text-white mb-2 shadow-sm">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <p className="text-xs font-bold text-slate-800 dark:text-white">
            Mudah Digunakan
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5 mb-2.5 leading-snug">
            Dirancang khusus agar pemilik toko & kasir UMKM bisa langsung operasional tanpa ribet.
          </p>
          <button
            onClick={() => onTabChange('products')}
            className="w-full py-1.5 px-3 bg-brandBlue hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm shadow-brandBlue/30 flex items-center justify-center gap-1.5"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Mulai Scan Barang</span>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="space-y-1">
          <button
            onClick={() => onTabChange('settings')}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Koneksi Database</span>
          </button>
          <button
            onClick={() => {
              window.location.reload();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
            <span>Segarkan Tampilan</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

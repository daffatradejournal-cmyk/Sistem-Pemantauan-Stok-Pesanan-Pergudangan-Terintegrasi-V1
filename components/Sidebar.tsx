'use client';

import React from 'react';
import {
  BarChart3,
  Package,
  Layers,
  BellRing,
  Settings,
  LogOut,
  HelpCircle,
  ExternalLink,
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
    icon: React.ReactNode;
    badge?: number;
  }> = [
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      id: 'products',
      label: 'Products & Barcode',
      icon: <Package className="w-5 h-5" />,
    },
    {
      id: 'orders',
      label: 'Orders & Locking',
      icon: <Layers className="w-5 h-5" />,
    },
    {
      id: 'alerts',
      label: 'Alerts & Logs',
      icon: <BellRing className="w-5 h-5" />,
      badge: unresolvedAlertsCount,
    },
    {
      id: 'settings',
      label: 'Settings & DB',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-darkSidebar border-r border-slate-200 dark:border-darkBorder flex flex-col justify-between p-6 select-none flex-shrink-0 transition-colors">
      {/* Top Brand Logo */}
      <div>
        <div className="flex items-center gap-3 px-2 mb-8">
          {/* Stylized Logo Mark matching the reference image */}
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute w-4 h-4 rounded-sm bg-brandPurple top-0 left-0 opacity-90 transform rotate-12" />
            <div className="absolute w-4 h-4 rounded-sm bg-brandBlue bottom-0 right-0 opacity-90 transform -rotate-12" />
            <div className="absolute w-3.5 h-3.5 rounded-full bg-brandAmber top-1 right-1" />
            <div className="absolute w-2 h-2 rounded-full bg-white dark:bg-darkSidebar" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white block">
              Business
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider block -mt-1">
              Warehouse Flow
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
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
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
      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
        {/* Support Card matching the 3D character banner in the reference image */}
        <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200/60 dark:border-white/5 relative overflow-hidden text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-tr from-brandBlue to-purple-500 flex items-center justify-center text-white mb-2 shadow-md">
            <HelpCircle className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-800 dark:text-white">
            Need help?
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5 mb-3 leading-tight">
            Feel free to contact warehouse operations
          </p>
          <button
            onClick={() => onTabChange('settings')}
            className="w-full py-1.5 px-3 bg-brandBlue hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm shadow-brandBlue/30"
          >
            Get support
          </button>
        </div>

        {/* Settings & Sign Out */}
        <div className="space-y-1">
          <button
            onClick={() => onTabChange('settings')}
            className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Database Setup</span>
          </button>
          <button
            onClick={() => {
              if (confirm('Muat ulang seluruh state halaman?')) {
                window.location.reload();
              }
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Refresh Session</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

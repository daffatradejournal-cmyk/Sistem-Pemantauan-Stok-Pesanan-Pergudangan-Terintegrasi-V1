'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { AnalyticsView } from '@/components/tabs/AnalyticsView';
import { ProductsView } from '@/components/tabs/ProductsView';
import { OrdersView } from '@/components/tabs/OrdersView';
import { AlertsView } from '@/components/tabs/AlertsView';
import { SettingsView } from '@/components/tabs/SettingsView';
import { NewOrderModal } from '@/components/NewOrderModal';

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>('analytics');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);

  // Global state
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState('2024');
  const [isLoading, setIsLoading] = useState(false);

  // Theme initialization from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('warehouse_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('warehouse_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('warehouse_theme', 'light');
      }
      return next;
    });
  };

  // Fetch DB Status
  const fetchDbStatus = async () => {
    try {
      const res = await fetch('/api/db/status');
      const data = await res.json();
      setDbStatus(data);
    } catch (err) {
      console.error('Check DB status failed:', err);
    }
  };

  // Fetch Dashboard Data
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/dashboard?year=${selectedYear}`);
      const data = await res.json();
      if (data.success) {
        setDashboardData(data.data);
      }
    } catch (err) {
      console.error('Fetch dashboard failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDbStatus();
    fetchDashboardData();
  }, [selectedYear]);

  const handleGlobalRefresh = () => {
    fetchDbStatus();
    fetchDashboardData();
  };

  // Get active title
  const getTabTitle = () => {
    switch (activeTab) {
      case 'analytics':
        return 'Ringkasan & Laporan Usaha';
      case 'products':
        return 'Katalog Barang & Scan Barcode';
      case 'orders':
        return 'Kasir & Transaksi Penjualan';
      case 'alerts':
        return 'Peringatan Stok & Mutasi Barang';
      case 'settings':
        return 'Pengaturan Database Toko';
      default:
        return 'Ringkasan & Laporan Usaha';
    }
  };

  return (
    <div className="flex min-h-screen bg-lightBg dark:bg-darkBg transition-colors duration-200">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        unresolvedAlertsCount={dashboardData?.kpi?.activeAlertsCount || 0}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        {/* Top Header */}
        <Header
          title={getTabTitle()}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          unresolvedAlertsCount={dashboardData?.kpi?.activeAlertsCount || 0}
          onAlertsClick={() => setActiveTab('alerts')}
          dbConnected={dbStatus?.status?.connected || false}
          onDbClick={() => setActiveTab('settings')}
        />

        {/* Content Body */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'analytics' && (
            <AnalyticsView
              data={dashboardData}
              isLoading={isLoading}
              onRefresh={handleGlobalRefresh}
              onNewOrderClick={() => setIsNewOrderModalOpen(true)}
              selectedYear={selectedYear}
              onYearChange={(y) => setSelectedYear(y)}
            />
          )}

          {activeTab === 'products' && (
            <ProductsView onRefreshGlobal={handleGlobalRefresh} />
          )}

          {activeTab === 'orders' && (
            <OrdersView onRefreshGlobal={handleGlobalRefresh} />
          )}

          {activeTab === 'alerts' && (
            <AlertsView onRefreshGlobal={handleGlobalRefresh} />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              dbStatus={dbStatus}
              onRefreshStatus={fetchDbStatus}
              onRefreshGlobal={handleGlobalRefresh}
            />
          )}
        </main>
      </div>

      {/* Modal Quick Create Order */}
      <NewOrderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        onSuccess={handleGlobalRefresh}
      />
    </div>
  );
}

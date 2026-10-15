'use client';

import React, { useState } from 'react';
import {
  FileText,
  CheckSquare,
  Boxes,
  CreditCard,
  Briefcase,
  Wallet,
} from 'lucide-react';
import { KpiCard } from '../KpiCard';
import { SvgDonut } from '../SvgDonut';
import { SvgBarChart } from '../SvgBarChart';
import { SvgLineChart } from '../SvgLineChart';
import { CircularStatCard } from '../CircularStatCard';
import { CustomerOrderTable, CustomerOrderRow } from '../CustomerOrderTable';

interface AnalyticsData {
  kpi: {
    orders: number;
    approved: number;
    totalUnits: number;
    revenue: number;
    blockedOrders: number;
    inventoryValuation: number;
    activeAlertsCount: number;
  };
  donuts: {
    stockStatus: {
      safe: number;
      low: number;
      out: number;
      total: number;
    };
    orderHealth: {
      delivered: number;
      cancelled: number;
      processed: number;
      total: number;
    };
  };
  monthlyDynamics: Array<{
    month: string;
    monthNum: number;
    sales: number;
    orders: number;
  }>;
  stockActivity: Array<{
    month: string;
    monthNum: number;
    inflow: number;
    outflow: number;
    movements: number;
  }>;
  recentOrders: CustomerOrderRow[];
}

interface Props {
  data: AnalyticsData | null;
  isLoading: boolean;
  onRefresh: () => void;
  onNewOrderClick: () => void;
  selectedYear: string;
  onYearChange: (year: string) => void;
}

export function AnalyticsView({
  data,
  isLoading,
  onRefresh,
  onNewOrderClick,
  selectedYear,
  onYearChange,
}: Props) {
  const kpi = data?.kpi || {
    orders: 0,
    approved: 0,
    totalUnits: 0,
    revenue: 0,
    blockedOrders: 0,
    inventoryValuation: 0,
    activeAlertsCount: 0,
  };

  const stockDonut = data?.donuts?.stockStatus || { safe: 0, low: 0, out: 0, total: 0 };
  const orderDonut = data?.donuts?.orderHealth || { delivered: 0, cancelled: 0, processed: 0, total: 0 };

  return (
    <div className="space-y-6">
      {/* ROW 1: 2x2 KPI Grid (Left) + 2 Donut Charts (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 2x2 KPI Cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KpiCard
            title="Total Pesanan Toko"
            value={kpi.orders}
            changeText="↑ 8.2% dibanding bulan lalu"
            isPositiveChange={true}
            icon={<FileText className="w-4 h-4 text-brandBlue" />}
          />
          <KpiCard
            title="Pesanan Berhasil (Selesai)"
            value={kpi.approved}
            changeText="↑ 3.4% dibanding bulan lalu"
            isPositiveChange={true}
            icon={<CheckSquare className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            title="Sisa Stok Fisik Gudang/Toko"
            value={kpi.totalUnits}
            changeText="↓ 0.2% dibanding bulan lalu"
            isPositiveChange={false}
            icon={<Boxes className="w-4 h-4 text-brandAmber" />}
          />
          <KpiCard
            title="Total Omzet Penjualan Sukses"
            value={`Rp ${kpi.revenue.toLocaleString()}`}
            changeText="↓ 1.2% dibanding bulan lalu"
            isPositiveChange={false}
            icon={<CreditCard className="w-4 h-4 text-rose-500" />}
          />
        </div>

        {/* Right: 2 Donut Charts */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Donut 1 (Yellow / Amber) */}
          <SvgDonut
            title="Kondisi Stok Barang Toko"
            totalDisplay={stockDonut.total}
            segments={[
              { label: 'Stok Aman', value: stockDonut.safe, color: '#10B981' },
              { label: 'Menipis', value: stockDonut.low, color: '#F5A623' },
              { label: 'Habis (0)', value: stockDonut.out, color: '#EF4444' },
            ]}
          />

          {/* Donut 2 (Blue) */}
          <SvgDonut
            title="Status Transaksi Toko"
            totalDisplay={orderDonut.total}
            segments={[
              { label: 'Selesai', value: orderDonut.delivered, color: '#3B6EF6' },
              { label: 'Ditolak (Stok Habis)', value: orderDonut.cancelled, color: '#60A5FA' },
              { label: 'Diproses', value: orderDonut.processed, color: '#93C5FD' },
            ]}
          />
        </div>
      </div>

      {/* ROW 2: Sales Dynamics Bar Chart (Left) + 2 Circular Cards (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Sales dynamics vertical bar chart */}
        <div className="lg:col-span-7">
          <SvgBarChart
            data={data?.monthlyDynamics || []}
            selectedYear={selectedYear}
            onYearChange={onYearChange}
          />
        </div>

        {/* Right: 2 Circular Progress Cards */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CircularStatCard
            icon={<Wallet className="w-5 h-5 text-brandPurple" />}
            badgeText="+15%"
            badgeColor="purple"
            title="Nilai Aset Stok Toko"
            value={kpi.inventoryValuation}
            subtitle="Modal Barang Tersimpan"
            percent={68}
          />

          <CircularStatCard
            icon={<Briefcase className="w-5 h-5 text-emerald-500" />}
            badgeText="+99%"
            badgeColor="green"
            title="Omzet Kasir Masuk"
            value={kpi.revenue}
            subtitle="Total Pendapatan Bersih"
            percent={92}
          />
        </div>
      </div>

      {/* ROW 3: Overall Stock Activity (Left) + Customer Order Table (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Curved line chart */}
        <div className="lg:col-span-6">
          <SvgLineChart
            data={data?.stockActivity || []}
            selectedYear={selectedYear}
            onYearChange={onYearChange}
          />
        </div>

        {/* Right: Customer Order Table with status pill rows */}
        <div className="lg:col-span-6">
          <CustomerOrderTable
            orders={data?.recentOrders || []}
            onRefresh={onRefresh}
            onNewOrderClick={onNewOrderClick}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}

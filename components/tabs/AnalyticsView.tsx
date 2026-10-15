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
import { MonthlyDetailModal } from '../MonthlyDetailModal';
import { Calendar, Sparkles } from 'lucide-react';

interface AnalyticsData {
  kpi: {
    orders: number;
    approved: number;
    totalUnits: number;
    revenue: number;
    totalCost?: number;
    netProfit?: number;
    inventoryValuationCost?: number;
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
    cost?: number;
    netProfit?: number;
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
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailMonth, setSelectedDetailMonth] = useState<number>(new Date().getMonth() + 1);

  const kpi = data?.kpi || {
    orders: 0,
    approved: 0,
    totalUnits: 0,
    revenue: 0,
    totalCost: 0,
    netProfit: 0,
    blockedOrders: 0,
    inventoryValuation: 0,
    inventoryValuationCost: 0,
    activeAlertsCount: 0,
  };

  const netProfitCalculated = kpi.netProfit !== undefined ? kpi.netProfit : (kpi.revenue - (kpi.totalCost || 0));
  const profitMarginPercent = kpi.revenue > 0 ? Math.round((netProfitCalculated / kpi.revenue) * 100) : 0;
  const profitBadgeText = profitMarginPercent > 0 ? `+${profitMarginPercent}%` : `${profitMarginPercent}%`;
  const profitProgressPercent = Math.min(100, Math.max(0, profitMarginPercent));

  const stockDonut = data?.donuts?.stockStatus || { safe: 0, low: 0, out: 0, total: 0 };
  const safeStockPercent = stockDonut.total > 0
    ? Math.round((stockDonut.safe / stockDonut.total) * 100)
    : 100;
  const safeStockBadgeText = `${safeStockPercent}%`;
  const orderDonut = data?.donuts?.orderHealth || { delivered: 0, cancelled: 0, processed: 0, total: 0 };

  return (
    <div className="space-y-6">
      {/* Monthly Tracking Callout Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-5 sm:p-6 text-white shadow-xl shadow-blue-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-sm flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Tracking s/d 2100
            </span>
            <span className="text-xs text-white/80">Laporan Finansial & Mutasi Barang</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black">
            Laporan Bulanan: Pantau Barang Laku, Omzet, Modal & Keuntungan Bersih
          </h3>
          <p className="text-xs text-white/80 max-w-2xl">
            Ketahui produk terlaris di setiap bulan, perbandingan harga modal (HPP) vs harga jual, keuntungan bersih riil, serta mutasi stok keluar-masuk.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedDetailMonth(new Date().getMonth() + 1);
            setIsDetailModalOpen(true);
          }}
          className="px-5 py-3 rounded-2xl bg-white text-slate-900 font-black text-xs hover:bg-slate-100 transition-all shadow-lg shrink-0 flex items-center justify-center gap-2 self-start md:self-auto cursor-pointer"
        >
          <Calendar className="w-4 h-4 text-brandBlue" />
          <span>Buka Rincian Bulan Ini →</span>
        </button>
      </div>
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
              { label: 'Ditolak', value: orderDonut.cancelled, color: '#EF4444' },
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
            onSelectMonth={(monthNum) => {
              setSelectedDetailMonth(monthNum);
              setIsDetailModalOpen(true);
            }}
          />
        </div>

        {/* Right: 2 Circular Progress Cards */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CircularStatCard
            icon={<Wallet className="w-5 h-5 text-brandPurple" />}
            badgeText={safeStockBadgeText}
            badgeColor="purple"
            title="Nilai Aset Stok Toko"
            value={kpi.inventoryValuation}
            subtitle={`${stockDonut.safe} dari ${stockDonut.total} produk berstatus aman`}
            percent={safeStockPercent}
          />

          <CircularStatCard
            icon={<Briefcase className="w-5 h-5 text-emerald-500" />}
            badgeText={profitBadgeText}
            badgeColor="green"
            title="Keuntungan Bersih"
            value={netProfitCalculated}
            subtitle={`Margin Laba: ${profitMarginPercent}% dari Total Omzet`}
            percent={profitProgressPercent}
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

      {/* Modal Detail Bulanan Drilldown (s/d 2100) */}
      <MonthlyDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        initialYear={selectedYear}
        initialMonth={selectedDetailMonth}
      />
    </div>
  );
}

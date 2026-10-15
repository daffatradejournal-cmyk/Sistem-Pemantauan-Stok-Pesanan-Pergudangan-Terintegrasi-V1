'use client';

import React, { useState } from 'react';

interface MonthlyData {
  month: string;
  monthNum: number;
  sales: number;
  orders: number;
}

interface Props {
  data: MonthlyData[];
  selectedYear: string;
  onYearChange: (year: string) => void;
  onSelectMonth?: (monthNum: number) => void;
}

const YEARS = Array.from({ length: 2100 - 2024 + 1 }, (_, i) => (2024 + i).toString());

export function SvgBarChart({ data, selectedYear, onYearChange, onSelectMonth }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Fallback 12 bulan dalam format Indonesia
  const defaultMonths = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
  const chartItems = defaultMonths.map((m, idx) => {
    const found = data?.find(d => d.monthNum === idx + 1);
    return {
      month: m,
      monthNum: idx + 1,
      sales: found ? found.sales : 0,
      orders: found ? found.orders : 0,
    };
  });

  const maxVal = Math.max(...chartItems.map(d => d.sales), 1000000);
  const chartHeight = 160;

  return (
    <div className="bg-white dark:bg-darkCard rounded-2xl p-6 border border-slate-100 dark:border-darkBorder shadow-sm flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              Grafik Omzet Penjualan Bulanan (Rp)
            </h3>
            {onSelectMonth && (
              <span className="hidden sm:inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-brandBlue border border-blue-500/20">
                Bisa diklik untuk detail
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">Total nilai transaksi toko yang berhasil setiap bulannya</p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {onSelectMonth && (
            <button
              type="button"
              onClick={() => onSelectMonth(new Date().getMonth() + 1)}
              className="text-xs font-bold text-brandBlue hover:text-blue-600 dark:hover:text-blue-400 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/50 transition-colors"
            >
              Lihat Detail Bulan Ini →
            </button>
          )}

          <select
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            aria-label="Pilih Tahun Analitik"
            className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-semibold rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brandBlue cursor-pointer"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                Tahun {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative pt-6 pb-2">
        {/* Y-axis grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-slate-400 dark:text-slate-500 pr-2">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-0.5">
            <span>400k</span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-0.5">
            <span>300k</span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-0.5">
            <span>200k</span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-0.5">
            <span>100k</span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-0.5">
            <span>0</span>
          </div>
        </div>

        {/* 12 Bars container */}
        <div className="relative z-10 flex items-end justify-between gap-1 sm:gap-2 h-44 px-8">
          {chartItems.map((item, idx) => {
            const heightPercent = Math.min(Math.max((item.sales / maxVal) * 100, item.orders > 0 ? 15 : 6), 95);
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => onSelectMonth?.(item.monthNum)}
                title={`Klik untuk lihat rincian transaksi bulan ${item.month}`}
              >
                {/* Hover Tooltip */}
                {isHovered && (
                  <div className="absolute -top-14 z-30 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[11px] font-semibold py-1.5 px-3 rounded-xl shadow-xl whitespace-nowrap pointer-events-none transition-all text-center">
                    Rp {item.sales.toLocaleString()}
                    <span className="block text-[9px] font-normal opacity-80">
                      {item.orders} pesanan
                    </span>
                    <span className="block text-[8px] font-bold text-blue-400 dark:text-blue-600 mt-0.5">
                      Klik untuk rincian detail →
                    </span>
                  </div>
                )}

                {/* Vertical Bar track */}
                <div className="w-2.5 sm:w-3.5 bg-slate-100 dark:bg-white/5 rounded-t-full h-full flex items-end overflow-hidden group-hover:scale-110 transition-transform">
                  <div
                    className="w-full bg-brandBlue rounded-t-full transition-all duration-500 ease-out group-hover:bg-blue-400 group-hover:brightness-110 shadow-[0_0_8px_rgba(59,110,246,0.3)]"
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>

                {/* X-axis label */}
                <span className="mt-2 text-[9px] sm:text-[10px] font-medium text-slate-400 dark:text-slate-500 group-hover:text-brandBlue transition-colors uppercase">
                  {item.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

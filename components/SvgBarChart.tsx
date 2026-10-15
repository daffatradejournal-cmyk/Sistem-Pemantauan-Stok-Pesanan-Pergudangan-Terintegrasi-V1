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
}

export function SvgBarChart({ data, selectedYear, onYearChange }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Fallback 12 months if data is empty
  const defaultMonths = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const chartItems = defaultMonths.map((m, idx) => {
    const found = data?.find(d => d.monthNum === idx + 1);
    return {
      month: m,
      sales: found ? found.sales : 0,
      orders: found ? found.orders : 0,
    };
  });

  const maxVal = Math.max(...chartItems.map(d => d.sales), 1000000);
  const chartHeight = 160;

  return (
    <div className="bg-white dark:bg-darkCard rounded-2xl p-6 border border-slate-100 dark:border-darkBorder shadow-sm flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            Order & Stock Dynamics
          </h3>
          <p className="text-xs text-slate-400">Dinamika transaksi pesanan per bulan</p>
        </div>

        <select
          value={selectedYear}
          onChange={(e) => onYearChange(e.target.value)}
          aria-label="Pilih Tahun Analitik"
          className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-semibold rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brandBlue cursor-pointer"
        >
          <option value="2026">2026</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
        </select>
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
              >
                {/* Hover Tooltip */}
                {isHovered && (
                  <div className="absolute -top-12 z-30 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[11px] font-semibold py-1 px-2.5 rounded-lg shadow-xl whitespace-nowrap pointer-events-none transition-all">
                    Rp {item.sales.toLocaleString()}
                    <span className="block text-[9px] font-normal opacity-80">
                      {item.orders} pesanan
                    </span>
                  </div>
                )}

                {/* Vertical Bar track */}
                <div className="w-2.5 sm:w-3.5 bg-slate-100 dark:bg-white/5 rounded-t-full h-full flex items-end overflow-hidden">
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

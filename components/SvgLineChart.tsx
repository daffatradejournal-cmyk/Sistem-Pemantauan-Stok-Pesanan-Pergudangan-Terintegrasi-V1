'use client';

import React, { useState } from 'react';

interface ActivityPoint {
  month: string;
  monthNum: number;
  inflow: number;
  outflow: number;
  movements: number;
}

interface Props {
  data: ActivityPoint[];
  selectedYear: string;
  onYearChange: (year: string) => void;
}

const YEARS = Array.from({ length: 2100 - 2024 + 1 }, (_, i) => (2024 + i).toString());

export function SvgLineChart({ data, selectedYear, onYearChange }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const defaultMonths = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
  const chartItems = defaultMonths.map((m, idx) => {
    const found = data?.find(d => d.monthNum === idx + 1);
    return {
      month: m,
      inflow: found ? found.inflow : 0,
      outflow: found ? found.outflow : 0,
      movements: found ? found.movements : 0,
      total: found ? found.inflow + found.outflow : 0,
    };
  });

  const maxVal = Math.max(...chartItems.map(d => d.total), 100);
  const width = 600;
  const height = 150;
  const paddingX = 20;
  const paddingY = 20;

  // Calculate coordinates for points
  const points = chartItems.map((item, idx) => {
    const x = paddingX + (idx / (chartItems.length - 1)) * (width - paddingX * 2);
    // Invert y: high values near 0 (top)
    const normalized = maxVal === 0 ? 0 : item.total / maxVal;
    const y = height - paddingY - normalized * (height - paddingY * 2);
    return { x, y, item };
  });

  // Build smooth cubic bezier SVG path
  let pathD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cx1 = p0.x + (p1.x - p0.x) / 2;
      const cy1 = p0.y;
      const cx2 = p0.x + (p1.x - p0.x) / 2;
      const cy2 = p1.y;
      pathD += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p1.x} ${p1.y}`;
    }
  }

  // Area path for gradient fill
  const areaD = `${pathD} L ${points[points.length - 1]?.x || width} ${height} L ${points[0]?.x || 0} ${height} Z`;

  return (
    <div className="bg-white dark:bg-darkCard rounded-2xl p-6 border border-slate-100 dark:border-darkBorder shadow-sm flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            Aktivitas Mutasi Keluar-Masuk Barang
          </h3>
          <p className="text-xs text-slate-400">Total mutasi stok toko (kulakan masuk vs penjualan keluar)</p>
        </div>

        <select
          value={selectedYear}
          onChange={(e) => onYearChange(e.target.value)}
          aria-label="Pilih Tahun Aktivitas Stok"
          className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-semibold rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brandPurple cursor-pointer"
        >
          {YEARS.map((y) => (
            <option key={y} value={y}>
              Tahun {y}
            </option>
          ))}
        </select>
      </div>

      {/* Line Chart Area */}
      <div className="relative pt-2 pb-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-36 overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A855F7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#A855F7" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1={paddingY} x2={width} y2={paddingY} stroke="currentColor" className="text-slate-100 dark:text-white/5" strokeDasharray="3 3" />
          <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="currentColor" className="text-slate-100 dark:text-white/5" strokeDasharray="3 3" />
          <line x1="0" y1={height - paddingY} x2={width} y2={height - paddingY} stroke="currentColor" className="text-slate-200 dark:text-white/10" />

          {/* Area under curve */}
          <path d={areaD} fill="url(#purpleGrad)" />

          {/* Smooth line */}
          <path
            d={pathD}
            fill="none"
            stroke="#A855F7"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="filter drop-shadow-[0_2px_8px_rgba(168,85,247,0.4)]"
          />

          {/* Circles at data points */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={hoveredIdx === idx ? 6 : 3.5}
              fill="#A855F7"
              stroke="#FFFFFF"
              strokeWidth="2"
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}
        </svg>

        {/* Floating tooltip */}
        {hoveredIdx !== null && points[hoveredIdx] && (
          <div
            className="absolute -top-6 z-30 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[11px] font-semibold py-1 px-3 rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2"
            style={{ left: `${(points[hoveredIdx].x / width) * 100}%` }}
          >
            <div>{chartItems[hoveredIdx].month}: {chartItems[hoveredIdx].total} unit</div>
            <div className="text-[9px] opacity-80 font-normal">
              +{chartItems[hoveredIdx].inflow} Masuk / -{chartItems[hoveredIdx].outflow} Keluar
            </div>
          </div>
        )}

        {/* X-axis Month Labels */}
        <div className="flex justify-between items-center px-2 mt-2 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
          {chartItems.map((item, idx) => (
            <span
              key={idx}
              className={`transition-colors ${hoveredIdx === idx ? 'text-brandPurple font-bold' : ''}`}
            >
              {item.month}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

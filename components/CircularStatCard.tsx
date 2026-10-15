'use client';

import React from 'react';

interface Props {
  icon: React.ReactNode;
  badgeText: string;
  badgeColor: 'purple' | 'green';
  title: string;
  value: string | number;
  subtitle?: string;
  percent: number; // 0 to 100
}

export function CircularStatCard({
  icon,
  badgeText,
  badgeColor,
  title,
  value,
  subtitle = `Tahun Berjalan ${new Date().getFullYear()}`,
  percent,
}: Props) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  const strokeColor = badgeColor === 'purple' ? '#A855F7' : '#10B981';

  return (
    <div className="bg-white dark:bg-darkCard rounded-2xl p-5 border border-slate-100 dark:border-darkBorder shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        {/* Left icon in subtle container */}
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-700 dark:text-slate-300">
          {icon}
        </div>

        {/* Circular progress badge with +% in center */}
        <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 48 48">
            <circle
              cx="24"
              cy="24"
              r={radius}
              stroke="currentColor"
              strokeWidth="3.5"
              fill="transparent"
              className="text-slate-100 dark:text-white/5"
            />
            <circle
              cx="24"
              cy="24"
              r={radius}
              stroke={strokeColor}
              strokeWidth="3.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <span
            className="absolute text-[11px] font-bold"
            style={{ color: strokeColor }}
          >
            {badgeText}
          </span>
        </div>
      </div>

      <div>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
          {title}
        </p>
        <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
          {typeof value === 'number' ? `Rp ${value.toLocaleString()}` : value}
        </h4>
        <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
          {subtitle}
        </span>
      </div>
    </div>
  );
}

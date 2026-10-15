'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  changeText?: string;
  isPositiveChange?: boolean;
  icon: React.ReactNode;
}

export function KpiCard({
  title,
  value,
  changeText = 'since last month',
  isPositiveChange = true,
  icon,
}: Props) {
  return (
    <div className="bg-white dark:bg-darkCard rounded-2xl p-5 border border-slate-100 dark:border-darkBorder shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-300">
          {icon}
        </div>
      </div>

      <div>
        <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>

        {changeText && (
          <div className="flex items-center gap-1 mt-2 text-xs">
            <span
              className={`flex items-center font-bold ${
                isPositiveChange ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {isPositiveChange ? (
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5 inline" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5 inline" />
              )}
            </span>
            <span className="text-slate-400 dark:text-slate-500 text-[11px]">
              {changeText}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React from 'react';

interface Segment {
  label: string;
  value: number;
  color: string;
}

interface Props {
  title: string;
  totalDisplay: string | number;
  segments: Segment[];
  accentColor?: string;
}

export function SvgDonut({ title, totalDisplay, segments }: Props) {
  const total = segments.reduce((acc, s) => acc + s.value, 0) || 1;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="bg-white dark:bg-darkCard rounded-2xl p-5 border border-slate-100 dark:border-darkBorder shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </h3>
      </div>

      <div className="flex items-center justify-between gap-4 my-auto">
        {/* Left side: Big Stat & Legends */}
        <div className="space-y-3">
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {typeof totalDisplay === 'number' ? totalDisplay.toLocaleString() : totalDisplay}
          </div>

          <div className="space-y-1.5">
            {segments.map((seg, idx) => {
              const pct = Math.round((seg.value / total) * 100);
              return (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {pct}%
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 truncate max-w-[90px]">
                    {seg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right side: Pure SVG Donut */}
        <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background track circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-slate-100 dark:text-white/5"
            />

            {/* Segments */}
            {segments.map((seg, idx) => {
              const segPercent = seg.value / total;
              const strokeDasharray = `${segPercent * circumference} ${circumference}`;
              const strokeDashoffset = -accumulatedPercent * circumference;
              accumulatedPercent += segPercent;

              return (
                <circle
                  key={idx}
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke={seg.color}
                  strokeWidth="12"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
              {total.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

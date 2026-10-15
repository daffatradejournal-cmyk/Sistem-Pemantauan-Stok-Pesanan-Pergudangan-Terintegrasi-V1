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
  const actualTotal = segments.reduce((acc, s) => acc + s.value, 0);
  const total = actualTotal > 0 ? actualTotal : 1;
  const radius = 35;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="bg-white dark:bg-darkCard rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-darkBorder shadow-sm flex flex-col justify-between h-full overflow-hidden">
      {/* Title */}
      <div className="mb-3">
        <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
          {title}
        </h3>
      </div>

      {/* Content: Donut + Legend */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 my-auto">
        {/* SVG Donut */}
        <div className="relative w-20 h-20 sm:w-22 sm:h-22 flex-shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background track circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="currentColor"
              strokeWidth="10"
              fill="transparent"
              className="text-slate-100 dark:text-white/10"
            />

            {/* Segments: ONLY render if actualTotal > 0 and seg.value > 0 to avoid zero-value dots! */}
            {actualTotal > 0 &&
              segments.map((seg, idx) => {
                if (seg.value <= 0) return null;
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
                    strokeWidth="10"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap={segments.filter((s) => s.value > 0).length === 1 ? 'butt' : 'round'}
                    fill="transparent"
                    className="transition-all duration-700 ease-out"
                  />
                );
              })}
          </svg>

          {/* Value in the center of the Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-none">
              {typeof totalDisplay === 'number' ? totalDisplay.toLocaleString() : totalDisplay}
            </span>
            <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
              Total
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-1.5 w-full sm:w-auto flex-1 min-w-0 pl-1">
          {segments.map((seg, idx) => {
            const pct = actualTotal > 0 ? Math.round((seg.value / actualTotal) * 100) : 0;
            return (
              <div key={idx} className="flex items-center justify-between sm:justify-start gap-1.5 text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                    {seg.label}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 ml-auto pl-1">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

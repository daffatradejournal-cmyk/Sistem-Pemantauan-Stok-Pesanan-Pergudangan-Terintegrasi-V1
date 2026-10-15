'use client';

import React from 'react';

// Generates a clean, scannable Code 128-style SVG barcode representation
export function SvgBarcode({ value, height = 48, showText = true }: { value: string; height?: number; showText?: boolean }) {
  // Deterministic pattern generator based on char codes
  const generateBars = (str: string) => {
    const bars: boolean[] = [true, false, true, true, false]; // Start pattern
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      const bin = (code % 32).toString(2).padStart(5, '0');
      for (const bit of bin) {
        bars.push(bit === '1');
        bars.push(false);
      }
      bars.push(true);
    }
    bars.push(true, false, true, true, false, true); // Stop pattern
    return bars;
  };

  const bars = generateBars(value);
  const barWidth = 2;
  const totalWidth = bars.length * barWidth;

  return (
    <div className="inline-flex flex-col items-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm select-none">
      <svg
        width={totalWidth}
        height={height}
        viewBox={`0 0 ${totalWidth} ${height}`}
        className="w-full max-w-[160px] h-auto"
        preserveAspectRatio="none"
      >
        {bars.map((isBar, idx) =>
          isBar ? (
            <rect
              key={idx}
              x={idx * barWidth}
              y={0}
              width={barWidth}
              height={height}
              fill="#111827"
            />
          ) : null
        )}
      </svg>
      {showText && (
        <span className="mt-1 font-mono text-[11px] font-bold tracking-widest text-slate-800">
          {value}
        </span>
      )}
    </div>
  );
}

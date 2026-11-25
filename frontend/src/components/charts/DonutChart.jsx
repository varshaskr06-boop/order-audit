import React, { useState } from 'react';

export default function DonutChart({
  data = [],
  title = '',
  height = 240,
  centerLabel = '',
  centerValue = '',
  valFormat = (v) => v
}) {
  const [hoveredSlice, setHoveredSlice] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-50 border border-gray-100 rounded-lg text-gray-400 text-sm">
        No chart data available
      </div>
    );
  }

  const defaultColors = ['#16a34a', '#2563eb', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];
  const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  const size = 200;
  const radius = size / 2;
  const innerRadius = radius * 0.65;
  const cx = radius;
  const cy = radius;

  // Compute angles
  let currentAngle = -Math.PI / 2;
  const slices = data.map((item, idx) => {
    const val = Number(item.value) || 0;
    const sliceAngle = total > 0 ? (val / total) * 2 * Math.PI : 0;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle += sliceAngle;

    // Outer arc coordinates
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);

    // Inner arc coordinates
    const ix1 = cx + innerRadius * Math.cos(startAngle);
    const iy1 = cy + innerRadius * Math.sin(startAngle);
    const ix2 = cx + innerRadius * Math.cos(endAngle);
    const iy2 = cy + innerRadius * Math.sin(endAngle);

    const largeArc = sliceAngle > Math.PI ? 1 : 0;
    const pathD = `
      M ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
      L ${ix2} ${iy2}
      A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}
      Z
    `;

    const percentage = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';

    return {
      ...item,
      color: item.color || defaultColors[idx % defaultColors.length],
      pathD,
      percentage,
      val
    };
  });

  return (
    <div className="w-full bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center">
      {title && <h4 className="text-sm font-semibold text-gray-800 mb-3 self-start">{title}</h4>}

      <div className="flex flex-col md:flex-row items-center gap-6 w-full justify-around">
        {/* SVG Donut */}
        <div className="relative w-48 h-48 flex-shrink-0">
          <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full transform transition-all select-none">
            {slices.map((slice, idx) => (
              <path
                key={idx}
                d={slice.pathD}
                fill={slice.color}
                className="cursor-pointer transition-transform duration-200 hover:opacity-85"
                onMouseEnter={() => setHoveredSlice(slice)}
                onMouseLeave={() => setHoveredSlice(null)}
              />
            ))}
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            {hoveredSlice ? (
              <>
                <div className="text-[11px] text-gray-500 font-medium">{hoveredSlice.label}</div>
                <div className="text-base font-bold text-gray-800">{hoveredSlice.percentage}%</div>
                <div className="text-[10px] text-emerald-600 font-semibold">{valFormat(hoveredSlice.val)}</div>
              </>
            ) : (
              <>
                <div className="text-[11px] text-gray-500 font-medium">{centerLabel || 'Total'}</div>
                <div className="text-base font-bold text-gray-800">{centerValue || valFormat(total)}</div>
              </>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2 max-w-xs w-full">
          {slices.map((slice, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between text-xs p-1.5 rounded transition-colors ${
                hoveredSlice?.label === slice.label ? 'bg-gray-100' : ''
              }`}
              onMouseEnter={() => setHoveredSlice(slice)}
              onMouseLeave={() => setHoveredSlice(null)}
            >
              <div className="flex items-center gap-2 truncate pr-2">
                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: slice.color }} />
                <span className="text-gray-700 truncate font-medium">{slice.label}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-gray-500 font-mono">{slice.percentage}%</span>
                <span className="font-semibold text-gray-800">{valFormat(slice.val)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

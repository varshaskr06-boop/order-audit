import React, { useState } from 'react';

export default function AreaChart({
  data = [],
  xKey = 'label',
  yKey = 'value',
  color = '#16a34a',
  gradientId = 'area-grad',
  height = 240,
  title = '',
  yFormat = (v) => v
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-50 border border-gray-100 rounded-lg text-gray-400 text-sm">
        No chart data available
      </div>
    );
  }

  const padding = { top: 25, right: 20, bottom: 40, left: 55 };
  const width = 600;
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  let maxVal = 0;
  data.forEach((d) => {
    const val = Number(d[yKey]) || 0;
    if (val > maxVal) maxVal = val;
  });
  if (maxVal === 0) maxVal = 100;
  maxVal = Math.ceil(maxVal * 1.15);

  const stepX = data.length > 1 ? innerWidth / (data.length - 1) : innerWidth;

  const points = data.map((d, idx) => {
    const x = padding.left + idx * stepX;
    const val = Number(d[yKey]) || 0;
    const y = padding.top + innerHeight - (val / maxVal) * innerHeight;
    return { x, y, val, label: d[xKey] };
  });

  const lineD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = `
    ${lineD}
    L ${points[points.length - 1].x} ${padding.top + innerHeight}
    L ${points[0].x} ${padding.top + innerHeight}
    Z
  `;

  return (
    <div className="w-full bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
      {title && <h4 className="text-sm font-semibold text-gray-800 mb-2">{title}</h4>}

      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Y Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = padding.top + innerHeight * (1 - pct);
            const val = Math.round(maxVal * pct);
            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeDasharray={pct === 0 ? '' : '3 3'}
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-gray-400"
                >
                  {yFormat(val)}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaD} fill={`url(#${gradientId})`} />

          {/* Line stroke */}
          <path d={lineD} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />

          {/* Points & X labels */}
          {points.map((p, idx) => (
            <g key={idx}>
              <text
                x={p.x}
                y={height - 12}
                textAnchor="middle"
                className="text-[11px] fill-gray-500 font-medium"
              >
                {p.label}
              </text>
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredPoint?.label === p.label ? 5 : 3.5}
                fill="#ffffff"
                stroke={color}
                strokeWidth={2.5}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredPoint(p)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            </g>
          ))}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-10 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100}%`
            }}
          >
            <div className="font-semibold text-gray-200">{hoveredPoint.label}</div>
            <div className="text-emerald-400 font-bold">{yFormat(hoveredPoint.val)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

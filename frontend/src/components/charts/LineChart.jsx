import React, { useState } from 'react';

export default function LineChart({
  data = [],
  xKey = 'label',
  lines = [{ key: 'value', color: '#16a34a', label: 'Value' }],
  height = 260,
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

  const padding = { top: 30, right: 20, bottom: 45, left: 55 };
  const width = 600;
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  let maxVal = 0;
  data.forEach((d) => {
    lines.forEach((l) => {
      const val = Number(d[l.key]) || 0;
      if (val > maxVal) maxVal = val;
    });
  });
  if (maxVal === 0) maxVal = 100;
  maxVal = Math.ceil(maxVal * 1.15);

  const stepX = data.length > 1 ? innerWidth / (data.length - 1) : innerWidth;

  return (
    <div className="w-full bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
      {title && <h4 className="text-sm font-semibold text-gray-800 mb-2">{title}</h4>}

      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
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

          {/* X Axis labels */}
          {data.map((d, idx) => {
            const x = padding.left + idx * stepX;
            const xLabel = d[xKey] || '';
            return (
              <text
                key={idx}
                x={x}
                y={height - 12}
                textAnchor="middle"
                className="text-[11px] fill-gray-500 font-medium"
              >
                {xLabel}
              </text>
            );
          })}

          {/* Lines and points */}
          {lines.map((l, lIdx) => {
            const points = data.map((d, dIdx) => {
              const x = padding.left + dIdx * stepX;
              const val = Number(d[l.key]) || 0;
              const y = padding.top + innerHeight - (val / maxVal) * innerHeight;
              return { x, y, val, label: d[xKey] };
            });

            const pathD = points.reduce((acc, p, idx) => {
              return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
            }, '');

            return (
              <g key={lIdx}>
                {/* Line Path */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={l.color || '#16a34a'}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Point Circles */}
                {points.map((p, pIdx) => (
                  <circle
                    key={pIdx}
                    cx={p.x}
                    cy={p.y}
                    r={hoveredPoint?.idx === pIdx && hoveredPoint?.series === l.key ? 5 : 3.5}
                    fill="#ffffff"
                    stroke={l.color || '#16a34a'}
                    strokeWidth={2.5}
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={() =>
                      setHoveredPoint({
                        idx: pIdx,
                        series: l.key,
                        label: p.label,
                        title: l.label || l.key,
                        value: p.val,
                        x: p.x,
                        y: p.y
                      })
                    }
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                ))}
              </g>
            );
          })}
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
            <div className="text-emerald-400">
              {hoveredPoint.title}: <span className="font-bold text-white">{yFormat(hoveredPoint.value)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Legends */}
      {lines.length > 1 && (
        <div className="flex items-center justify-center gap-6 mt-3 pt-2 border-t border-gray-50">
          {lines.map((l, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
              <span className="w-3 h-0.5" style={{ backgroundColor: l.color }} />
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
              <span>{l.label || l.key}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

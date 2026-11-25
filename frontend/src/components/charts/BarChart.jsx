import React, { useState } from 'react';

export default function BarChart({
  data = [],
  xKey = 'label',
  bars = [{ key: 'value', color: '#16a34a', label: 'Value' }],
  height = 260,
  title = '',
  yFormat = (v) => v
}) {
  const [hoveredItem, setHoveredItem] = useState(null);

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

  // Max calculation
  let maxVal = 0;
  data.forEach((d) => {
    bars.forEach((b) => {
      const val = Number(d[b.key]) || 0;
      if (val > maxVal) maxVal = val;
    });
  });
  if (maxVal === 0) maxVal = 100;
  maxVal = Math.ceil(maxVal * 1.15); // headroom

  const groupWidth = innerWidth / data.length;
  const barWidth = Math.max(8, (groupWidth * 0.65) / bars.length);

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

          {/* Bars */}
          {data.map((d, dIdx) => {
            const groupX = padding.left + dIdx * groupWidth + (groupWidth - barWidth * bars.length) / 2;
            const xLabel = d[xKey] || '';

            return (
              <g key={dIdx}>
                {bars.map((b, bIdx) => {
                  const val = Number(d[b.key]) || 0;
                  const barH = (val / maxVal) * innerHeight;
                  const barY = padding.top + innerHeight - barH;
                  const barX = groupX + bIdx * barWidth;

                  return (
                    <rect
                      key={bIdx}
                      x={barX}
                      y={barY}
                      width={Math.max(4, barWidth - 3)}
                      height={Math.max(2, barH)}
                      fill={b.color || '#16a34a'}
                      rx={3}
                      className="transition-all duration-200 cursor-pointer hover:opacity-80"
                      onMouseEnter={() =>
                        setHoveredItem({
                          label: xLabel,
                          series: b.label || b.key,
                          value: val,
                          x: barX + barWidth / 2,
                          y: barY
                        })
                      }
                      onMouseLeave={() => setHoveredItem(null)}
                    />
                  );
                })}

                {/* X Axis Label */}
                <text
                  x={padding.left + dIdx * groupWidth + groupWidth / 2}
                  y={height - 12}
                  textAnchor="middle"
                  className="text-[11px] fill-gray-500 font-medium"
                >
                  {xLabel.length > 12 ? `${xLabel.slice(0, 10)}…` : xLabel}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredItem && (
          <div
            className="absolute z-10 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2"
            style={{
              left: `${(hoveredItem.x / width) * 100}%`,
              top: `${(hoveredItem.y / height) * 100}%`
            }}
          >
            <div className="font-semibold text-gray-200">{hoveredItem.label}</div>
            <div className="text-emerald-400">
              {hoveredItem.series}: <span className="font-bold text-white">{yFormat(hoveredItem.value)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Legends */}
      {bars.length > 1 && (
        <div className="flex items-center justify-center gap-6 mt-3 pt-2 border-t border-gray-50">
          {bars.map((b, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: b.color }} />
              <span>{b.label || b.key}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

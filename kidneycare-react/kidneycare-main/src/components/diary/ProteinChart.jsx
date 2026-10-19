import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';

const PROTEIN_NUM = { 'Negative': 0, 'Trace': 0.5, '1+': 1, '2+': 2, '3+': 3, '4+': 4 };
const PROTEIN_LABELS = { 0: 'Neg', 0.5: 'Tr', 1: '1+', 2: '2+', 3: '3+', 4: '4+' };

const DOT_COLOR = (val) => {
  if (val <= 0.5) return '#16a34a';
  if (val <= 1) return '#d97706';
  if (val <= 2) return '#ea580c';
  return '#dc2626';
};

const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  return <circle cx={cx} cy={cy} r={5} fill={DOT_COLOR(payload.protein)} stroke="white" strokeWidth={1.5} />;
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white shadow-lg rounded-lg px-3 py-2 text-xs border border-gray-100">
      <p className="font-semibold text-gray-800">{d.dateLabel}</p>
      <p className="text-gray-600">प्रोटीन / Protein: <span className="font-bold">{d.level}</span></p>
    </div>
  );
};

export default function ProteinChart({ dipstickResults }) {
  const data = [...dipstickResults]
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    .map(r => ({
      dateLabel: format(new Date(r.created_date), 'd MMM'),
      date: r.created_date,
      protein: PROTEIN_NUM[r.protein_level] ?? 0,
      level: r.protein_level || 'N/A',
    }));

  const heatmapDots = [...dipstickResults]
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  return (
    <div className="bg-white rounded-2xl p-4 mx-4 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-gray-900 text-sm">
          मूत्र प्रोटीन ट्रेंड / Urine Protein Trend
        </h3>
      </div>

      {data.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="proteinGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fca5a5" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#fca5a5" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 9, fill: '#6b7280' }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 4]}
                ticks={[0, 0.5, 1, 2, 3, 4]}
                tickFormatter={v => PROTEIN_LABELS[v] || ''}
                tick={{ fontSize: 9, fill: '#6b7280' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={2} stroke="#ef4444" strokeDasharray="4 3" label={{ value: 'रिलैप्स सीमा', position: 'insideTopRight', fontSize: 9, fill: '#ef4444' }} />
              <Area
                type="monotone"
                dataKey="protein"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#proteinGrad)"
                dot={<CustomDot />}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Heatmap row */}
          <div className="flex flex-wrap gap-1 mt-3">
            {heatmapDots.map((r, i) => {
              const val = PROTEIN_NUM[r.protein_level] ?? 0;
              const color = val <= 0.5 ? '#16a34a' : val <= 1 ? '#d97706' : val <= 2 ? '#ea580c' : '#dc2626';
              return (
                <div
                  key={i}
                  title={`${format(new Date(r.created_date), 'd MMM')}: ${r.protein_level}`}
                  style={{ width: 20, height: 20, backgroundColor: color, borderRadius: 4 }}
                />
              );
            })}
          </div>
          <div className="flex gap-3 mt-2 text-[10px] text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: '#16a34a' }} /> Neg/Trace</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: '#d97706' }} /> 1+</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: '#ea580c' }} /> 2+</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: '#dc2626' }} /> 3+/4+</span>
          </div>
        </>
      ) : (
        <p className="text-gray-400 text-center py-8 text-sm">No dipstick data</p>
      )}
    </div>
  );
}
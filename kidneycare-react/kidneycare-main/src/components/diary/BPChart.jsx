import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend
} from 'recharts';
import { format } from 'date-fns';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const sys = payload.find(p => p.dataKey === 'systolic')?.value;
  const dia = payload.find(p => p.dataKey === 'diastolic')?.value;
  const d = payload[0]?.payload;
  const map = sys && dia ? Math.round((sys + 2 * dia) / 3) : null;
  return (
    <div className="bg-white shadow-lg rounded-lg px-3 py-2 text-xs border border-gray-100">
      <p className="font-semibold text-gray-800 mb-1">{d?.dateLabel}</p>
      {sys && <p className="text-red-600">Systolic: <b>{sys} mmHg</b></p>}
      {dia && <p className="text-teal-600">Diastolic: <b>{dia} mmHg</b></p>}
      {map && <p className="text-gray-500">MAP: <b>{map} mmHg</b></p>}
    </div>
  );
};

export default function BPChart({ healthMetrics }) {
  const bpData = healthMetrics
    .filter(m => m.metric_type === 'BP' && m.value)
    .sort((a, b) => new Date(a.recorded_at || a.created_date) - new Date(b.recorded_at || b.created_date))
    .map(m => ({
      dateLabel: format(new Date(m.recorded_at || m.created_date), 'd MMM'),
      systolic: parseFloat(m.value) || null,
      diastolic: parseFloat(m.value_secondary) || null,
    }))
    .filter(d => d.systolic || d.diastolic);

  return (
    <div className="bg-white rounded-2xl p-4 mx-4 mb-4 shadow-sm">
      <h3 className="font-semibold text-gray-900 text-sm mb-3">
        रक्तचाप / Blood Pressure
      </h3>
      {bpData.length > 0 ? (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={bpData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="dateLabel" tick={{ fontSize: 9, fill: '#6b7280' }} interval="preserveStartEnd" />
            <YAxis domain={[60, 150]} tick={{ fontSize: 9, fill: '#6b7280' }} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={110} stroke="#f59e0b" strokeDasharray="4 3" label={{ value: 'HTN', position: 'insideTopRight', fontSize: 9, fill: '#f59e0b' }} />
            <Line type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Systolic" />
            <Line type="monotone" dataKey="diastolic" stroke="#0d9488" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3 }} name="Diastolic" />
            <Legend wrapperStyle={{ fontSize: 10 }} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-gray-400 text-center py-8 text-sm">No BP data</p>
      )}
    </div>
  );
}
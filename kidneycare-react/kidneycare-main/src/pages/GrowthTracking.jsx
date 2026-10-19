import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, differenceInMonths } from 'date-fns';
import { ChevronLeft, Plus, TrendingUp, Ruler, Scale, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Link } from 'react-router-dom';
import { LanguageProvider, useLanguage } from '../components/shared/LanguageContext';

// IAP Growth Chart percentile data (simplified WHO/IAP z-scores for boys/girls 2-18 yrs)
// Height-for-age P3, P10, P25, P50, P75, P90, P97 (cm) at given ages in months
// Source: IAP 2015 growth charts
const IAP_HEIGHT_BOYS = {
  24:[81.7,83.7,85.5,87.8,90.0,91.9,93.9],
  36:[89.0,91.4,93.5,96.1,98.7,100.9,103.2],
  48:[95.4,98.2,100.7,103.3,106.2,108.5,111.0],
  60:[101.2,104.3,107.1,110.0,113.2,115.8,118.7],
  72:[106.4,109.8,112.9,116.0,119.4,122.3,125.4],
  84:[111.5,115.2,118.5,121.9,125.4,128.5,131.7],
  96:[116.5,120.4,124.0,127.7,131.5,134.8,138.3],
  108:[121.3,125.5,129.4,133.4,137.5,141.1,144.9],
  120:[126.0,130.6,134.9,139.2,143.7,147.6,151.7],
  132:[130.9,136.0,140.6,145.3,150.2,154.5,159.1],
  144:[136.4,142.0,147.2,152.3,157.8,162.6,167.7],
  156:[142.8,149.1,154.9,160.6,166.7,172.0,177.6],
  168:[150.5,157.2,163.4,169.6,176.3,181.9,187.9],
  180:[158.1,164.9,171.2,177.5,184.1,189.6,195.4],
  192:[163.6,170.2,176.2,182.3,188.6,193.8,199.4],
  204:[166.5,172.8,178.7,184.5,190.5,195.5,200.8],
  216:[167.9,174.1,179.8,185.5,191.4,196.2,201.5],
};
const IAP_HEIGHT_GIRLS = {
  24:[80.0,82.2,84.0,86.4,88.7,90.7,92.9],
  36:[87.7,89.9,91.9,94.4,96.9,99.1,101.4],
  48:[94.1,96.8,99.1,101.9,104.7,107.1,109.7],
  60:[100.0,103.0,105.7,108.9,112.0,114.8,117.8],
  72:[105.3,108.7,111.8,115.2,118.6,121.7,125.1],
  84:[110.4,114.1,117.6,121.3,125.0,128.4,132.2],
  96:[115.3,119.4,123.3,127.4,131.4,135.2,139.4],
  108:[120.1,124.7,128.9,133.4,137.9,142.1,146.7],
  120:[124.8,129.8,134.5,139.4,144.4,149.0,154.1],
  132:[129.5,135.2,140.3,145.8,151.3,156.5,162.3],
  144:[134.8,141.3,147.0,153.2,159.4,165.2,171.8],
  156:[141.3,148.3,154.6,161.4,168.1,174.4,181.5],
  168:[147.3,154.3,160.7,167.3,173.8,179.8,186.4],
  180:[150.6,157.3,163.3,169.5,175.6,181.2,187.2],
  192:[152.0,158.5,164.3,170.2,176.1,181.6,187.4],
  204:[152.7,159.1,164.8,170.6,176.4,181.8,187.5],
  216:[152.8,159.2,164.9,170.6,176.4,181.8,187.5],
};

const IAP_WEIGHT_BOYS = {
  24:[10.2,11.0,11.8,12.7,13.8,14.8,16.1],
  36:[12.0,13.0,14.0,15.1,16.4,17.6,19.2],
  48:[13.6,14.8,16.0,17.3,18.9,20.3,22.2],
  60:[15.1,16.5,17.9,19.5,21.4,23.1,25.4],
  72:[16.7,18.3,19.9,21.8,24.0,26.0,28.7],
  84:[18.4,20.2,22.1,24.3,26.8,29.2,32.5],
  96:[20.3,22.3,24.5,27.0,29.9,32.7,36.7],
  108:[22.3,24.6,27.1,30.0,33.4,36.7,41.5],
  120:[24.5,27.2,30.0,33.3,37.3,41.2,47.0],
  132:[27.2,30.3,33.5,37.4,42.1,46.7,53.7],
  144:[30.4,33.9,37.5,42.1,47.6,53.0,61.4],
  156:[34.2,38.1,42.2,47.5,54.0,60.4,70.5],
  168:[38.6,43.0,47.7,53.8,61.3,68.8,80.8],
  180:[43.7,48.5,53.8,60.6,69.1,77.7,91.3],
  192:[48.6,53.9,59.6,66.9,76.1,85.4,99.9],
  204:[52.5,58.1,64.1,71.7,81.2,90.8,105.6],
  216:[55.2,61.0,67.1,74.8,84.3,93.9,108.6],
};

function calcAgeMonths(dob) {
  if (!dob) return null;
  return differenceInMonths(new Date(), new Date(dob));
}

function getPercentile(val, arr) {
  const percentiles = [3, 10, 25, 50, 75, 90, 97];
  for (let i = arr.length - 1; i >= 0; i--) {
    if (val >= arr[i]) return percentiles[i];
  }
  return '<P3';
}

function getNearestAge(ageMonths, table) {
  const ages = Object.keys(table).map(Number).sort((a, b) => a - b);
  let nearest = ages[0];
  for (const a of ages) {
    if (Math.abs(a - ageMonths) < Math.abs(nearest - ageMonths)) nearest = a;
  }
  return nearest;
}

function calcBMI(weight, height) {
  if (!weight || !height) return null;
  const h = height / 100;
  return (weight / (h * h)).toFixed(1);
}

function calcBSA(weight, height) {
  if (!weight || !height) return null;
  return Math.sqrt((height * weight) / 3600).toFixed(2);
}

function GrowthContent() {
  const { language } = useLanguage();
  const hi = language === 'hi';
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({ height_cm: '', weight_kg: '', date: format(new Date(), 'yyyy-MM-dd') });

  const { data: patient } = useQuery({
    queryKey: ['currentPatient'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const pts = await base44.entities.Patient.filter({ created_by: user.email });
      return pts[0];
    }
  });

  const { data: growthRecords = [], isLoading } = useQuery({
    queryKey: ['growthRecords', patient?.id],
    queryFn: () => base44.entities.HealthMetric.filter({ patient_id: patient.id, metric_type: 'Weight' }, 'recorded_at', 50),
    enabled: !!patient?.id,
    select: d => d.filter(m => m.notes?.includes('height:')).sort((a, b) => new Date(a.recorded_at || a.created_date) - new Date(b.recorded_at || b.created_date))
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.HealthMetric.create({
        patient_id: patient.id,
        metric_type: 'Weight',
        value: newEntry.weight_kg,
        unit: 'kg',
        recorded_at: new Date(newEntry.date).toISOString(),
        notes: `height:${newEntry.height_cm}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['growthRecords']);
      setShowAdd(false);
      setNewEntry({ height_cm: '', weight_kg: '', date: format(new Date(), 'yyyy-MM-dd') });
    }
  });

  const ageMonths = calcAgeMonths(patient?.dob);
  const gender = patient?.gender;

  const chartData = growthRecords.map(r => {
    const h = parseFloat(r.notes?.match(/height:(\d+\.?\d*)/)?.[1] || 0);
    const w = parseFloat(r.value);
    const bmi = calcBMI(w, h);
    const bsa = calcBSA(w, h);
    const recDate = new Date(r.recorded_at || r.created_date);
    const ageAtRecord = differenceInMonths(recDate, new Date(patient?.dob || recDate));
    const htTable = gender === 'Female' ? IAP_HEIGHT_GIRLS : IAP_HEIGHT_BOYS;
    const wtTable = gender === 'Female' ? null : IAP_WEIGHT_BOYS;
    const nearestAge = getNearestAge(ageAtRecord, htTable);
    const htPctRow = htTable[nearestAge] || [];
    const htPct = htPctRow.length ? getPercentile(h, htPctRow) : '—';
    const wtPctRow = wtTable ? (wtTable[nearestAge] || []) : [];
    const wtPct = wtPctRow.length ? getPercentile(w, wtPctRow) : '—';
    return {
      date: format(recDate, 'dd/MM'),
      height: h,
      weight: w,
      bmi: parseFloat(bmi),
      bsa: parseFloat(bsa),
      htPct,
      wtPct,
    };
  });

  const latest = chartData[chartData.length - 1];
  const latestBMI = latest?.bmi;
  const latestBSA = latest?.bsa;

  // Reference lines: P3, P50, P97 for current age
  const htTable = gender === 'Female' ? IAP_HEIGHT_GIRLS : IAP_HEIGHT_BOYS;
  const nearestCurrentAge = ageMonths ? getNearestAge(ageMonths, htTable) : null;
  const refHeights = nearestCurrentAge ? htTable[nearestCurrentAge] : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-teal-600 px-4 py-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/TodaysTasks">
              <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-white/20">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold">{hi ? 'विकास ट्रैकर' : 'Growth Tracker'}</h1>
              <p className="text-green-100 text-xs">{hi ? 'ऊँचाई · वज़न · BMI · IAP' : 'Height · Weight · BMI · IAP Percentiles'}</p>
            </div>
          </div>
          <Button onClick={() => setShowAdd(true)} className="rounded-full bg-white/20 hover:bg-white/30 text-white border-none">
            <Plus className="w-4 h-4 mr-1" />{hi ? 'जोड़ें' : 'Add'}
          </Button>
        </div>
      </div>

      <div className="px-4 pt-4 max-w-2xl mx-auto space-y-4">
        {/* Current stats */}
        {latest && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Ruler, label: hi ? 'ऊँचाई' : 'Height', value: `${latest.height} cm`, sub: `${hi ? 'प.' : 'P'}: ${latest.htPct}`, color: 'blue' },
              { icon: Scale, label: hi ? 'वज़न' : 'Weight', value: `${latest.weight} kg`, sub: `${hi ? 'प.' : 'P'}: ${latest.wtPct}`, color: 'green' },
              { label: 'BMI', value: latestBMI ? `${latestBMI}` : '—', sub: latestBMI ? (latestBMI < 14 ? '⚠ Underweight' : latestBMI > 25 ? '⚠ Overweight' : '✓ Normal') : '—', color: 'amber' },
              { label: 'BSA', value: latestBSA ? `${latestBSA} m²` : '—', sub: hi ? 'डोज़ कैलकुलेशन' : 'Dose calculation', color: 'purple' },
            ].map((s, i) => (
              <Card key={i} className="p-4 border-none shadow-sm bg-white dark:bg-gray-800">
                <div className="flex items-center gap-2 mb-1">
                  {s.icon && <s.icon className={`w-4 h-4 text-${s.color}-500`} />}
                  <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                <p className={`text-xs mt-0.5 ${s.sub?.includes('⚠') ? 'text-amber-500' : 'text-gray-400'}`}>{s.sub}</p>
              </Card>
            ))}
          </div>
        )}

        {/* Age info */}
        {ageMonths && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl px-4 py-2.5 text-sm text-blue-700 dark:text-blue-300">
            {hi ? 'आयु' : 'Age'}: {Math.floor(ageMonths / 12)}{hi ? ' वर्ष' : 'y'} {ageMonths % 12}{hi ? ' माह' : 'm'} · {hi ? 'लिंग' : 'Sex'}: {patient?.gender || '—'}
          </div>
        )}

        {/* Height trend chart */}
        {chartData.length > 1 && (
          <Card className="p-4 border-none shadow-sm bg-white dark:bg-gray-800">
            <p className="font-semibold text-gray-800 dark:text-white text-sm mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />{hi ? 'ऊँचाई प्रवृत्ति (cm)' : 'Height Trend (cm)'}
            </p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip />
                {refHeights && [
                  { val: refHeights[0], label: 'P3', color: '#fca5a5' },
                  { val: refHeights[3], label: 'P50', color: '#86efac' },
                  { val: refHeights[6], label: 'P97', color: '#fca5a5' },
                ].map(ref => (
                  <ReferenceLine key={ref.label} y={ref.val} stroke={ref.color} strokeDasharray="4 4" label={{ value: ref.label, fontSize: 9, fill: '#9ca3af' }} />
                ))}
                <Line type="monotone" dataKey="height" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Weight trend chart */}
        {chartData.length > 1 && (
          <Card className="p-4 border-none shadow-sm bg-white dark:bg-gray-800">
            <p className="font-semibold text-gray-800 dark:text-white text-sm mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />{hi ? 'वज़न प्रवृत्ति (kg)' : 'Weight Trend (kg)'}
            </p>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* BMI chart */}
        {chartData.length > 1 && (
          <Card className="p-4 border-none shadow-sm bg-white dark:bg-gray-800">
            <p className="font-semibold text-gray-800 dark:text-white text-sm mb-3">BMI {hi ? 'प्रवृत्ति' : 'Trend'}</p>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <ReferenceLine y={14} stroke="#fca5a5" strokeDasharray="4 4" label={{ value: '14', fontSize: 9, fill: '#9ca3af' }} />
                <ReferenceLine y={25} stroke="#fca5a5" strokeDasharray="4 4" label={{ value: '25', fontSize: 9, fill: '#9ca3af' }} />
                <Line type="monotone" dataKey="bmi" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* History table */}
        {chartData.length > 0 && (
          <Card className="border-none shadow-sm bg-white dark:bg-gray-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <p className="font-semibold text-gray-800 dark:text-white text-sm">{hi ? 'इतिहास' : 'History'}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    {[hi ? 'तारीख' : 'Date', hi ? 'ऊँचाई' : 'Ht (cm)', hi ? 'वज़न' : 'Wt (kg)', 'BMI', 'BSA', hi ? 'Ht %ile' : 'Ht %ile', hi ? 'Wt %ile' : 'Wt %ile'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-gray-500 dark:text-gray-400 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...chartData].reverse().map((r, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{r.date}</td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{r.height}</td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{r.weight}</td>
                      <td className="px-3 py-2 font-medium text-amber-600">{r.bmi}</td>
                      <td className="px-3 py-2 text-blue-600">{r.bsa}</td>
                      <td className="px-3 py-2 text-green-600">{r.htPct}</td>
                      <td className="px-3 py-2 text-purple-600">{r.wtPct}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {chartData.length === 0 && !isLoading && (
          <Card className="p-10 text-center border-none shadow-sm bg-white dark:bg-gray-800">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">{hi ? 'अभी तक कोई विकास रिकॉर्ड नहीं है' : 'No growth records yet'}</p>
            <Button onClick={() => setShowAdd(true)} className="mt-4 rounded-xl bg-green-500 hover:bg-green-600">
              <Plus className="w-4 h-4 mr-1" />{hi ? 'पहला माप जोड़ें' : 'Add First Measurement'}
            </Button>
          </Card>
        )}

        {/* IAP percentile legend */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 text-xs text-gray-600 dark:text-gray-400">
          <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{hi ? 'संदर्भ: IAP 2015 विकास चार्ट' : 'Reference: IAP 2015 Growth Charts'}</p>
          <p>{hi ? 'P3–P97: 3वाँ–97वाँ प्रतिशतक। P50 औसत है। P3 से नीचे: कम, P97 से ऊपर: अधिक।' : 'P3–P97 = 3rd–97th percentile. P50 is average. <P3 = underweight/short; >P97 = overweight/tall.'}</p>
        </div>
      </div>

      {/* Add Entry Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>{hi ? 'नया माप जोड़ें' : 'Add New Measurement'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>{hi ? 'तारीख' : 'Date'}</Label>
              <Input type="date" value={newEntry.date} onChange={e => setNewEntry(p => ({ ...p, date: e.target.value }))} className="h-12 rounded-xl mt-1" />
            </div>
            <div>
              <Label>🔹 {hi ? 'ऊँचाई (cm)' : 'Height (cm)'}</Label>
              <Input type="number" placeholder="e.g. 110" value={newEntry.height_cm} onChange={e => setNewEntry(p => ({ ...p, height_cm: e.target.value }))} className="h-12 rounded-xl mt-1" />
            </div>
            <div>
              <Label>🔹 {hi ? 'वज़न (kg)' : 'Weight (kg)'}</Label>
              <Input type="number" placeholder="e.g. 18.5" value={newEntry.weight_kg} onChange={e => setNewEntry(p => ({ ...p, weight_kg: e.target.value }))} className="h-12 rounded-xl mt-1" />
            </div>
            {newEntry.height_cm && newEntry.weight_kg && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">BMI:</span> <span className="font-bold text-green-700">{calcBMI(parseFloat(newEntry.weight_kg), parseFloat(newEntry.height_cm))}</span></div>
                <div><span className="text-gray-500">BSA:</span> <span className="font-bold text-blue-700">{calcBSA(parseFloat(newEntry.weight_kg), parseFloat(newEntry.height_cm))} m²</span></div>
              </div>
            )}
            <Button
              onClick={() => addMutation.mutate()}
              disabled={!newEntry.height_cm || !newEntry.weight_kg || addMutation.isPending}
              className="w-full h-12 rounded-xl bg-green-500 hover:bg-green-600">
              {addMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (hi ? 'सेव करें' : 'Save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function GrowthTracking() {
  return (
    <LanguageProvider>
      <GrowthContent />
    </LanguageProvider>
  );
}
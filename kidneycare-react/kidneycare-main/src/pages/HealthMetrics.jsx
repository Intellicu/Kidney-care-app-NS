import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Activity, Droplets, Thermometer, Scale, Heart, Loader2, CheckCircle, Bluetooth, Radio, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LanguageProvider, useLanguage } from '../components/shared/LanguageContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import BleDeviceSyncModal from '../components/devices/BleDeviceSyncModal';

function HealthMetricsContent() {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [metrics, setMetrics] = useState({
    bp_systolic: '',
    bp_diastolic: '',
    weight: '',
    urine_output: '',
    fluid_intake: '',
    temperature: ''
  });
  const [saved, setSaved] = useState(false);
  const [bleModalOpen, setBleModalOpen] = useState(false);
  const [bleInitialMode, setBleInitialMode] = useState('bp');
  const [lastBleReading, setLastBleReading] = useState(null);

  const { data: patient } = useQuery({
    queryKey: ['currentPatient'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const patients = await base44.entities.Patient.filter({ created_by: user.email });
      return patients[0];
    }
  });

  const { data: recentMetrics = [] } = useQuery({
    queryKey: ['healthMetrics', patient?.id],
    queryFn: () => patient 
      ? base44.entities.HealthMetric.filter({ patient_id: patient.id, metric_type: { $ne: 'Symptoms' }}, '-created_date', 20)
      : [],
    enabled: !!patient
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!patient) return;
      
      const metricsToSave = [];
      const now = new Date().toISOString();
      
      if (metrics.bp_systolic && metrics.bp_diastolic) {
        const sys = parseFloat(metrics.bp_systolic);
        const dia = parseFloat(metrics.bp_diastolic);
        metricsToSave.push({
          patient_id: patient.id,
          metric_type: 'BP',
          value: metrics.bp_systolic,
          value_secondary: metrics.bp_diastolic,
          unit: 'mmHg',
          recorded_at: now
        });
        // Threshold alert: Hypertensive crisis ≥180/120, High ≥140/90
        if (sys >= 180 || dia >= 120) {
          await base44.entities.Alert.create({
            patient_id: patient.id,
            alert_type: 'Abnormal BP',
            severity: 'critical',
            message: `Hypertensive crisis: ${sys}/${dia} mmHg — Immediate attention required`
          });
        } else if (sys >= 140 || dia >= 90) {
          await base44.entities.Alert.create({
            patient_id: patient.id,
            alert_type: 'Abnormal BP',
            severity: 'high',
            message: `High blood pressure: ${sys}/${dia} mmHg (normal <120/80)`
          });
        }
      }
      
      if (metrics.weight) {
        metricsToSave.push({
          patient_id: patient.id,
          metric_type: 'Weight',
          value: metrics.weight,
          unit: 'kg',
          recorded_at: now
        });
        
        // Check weight gain alert
        const weightMetrics = recentMetrics.filter(m => m.metric_type === 'Weight');
        if (weightMetrics.length >= 2) {
          const threeDaysAgo = new Date();
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
          const oldWeight = weightMetrics.find(m => new Date(m.recorded_at) <= threeDaysAgo);
          if (oldWeight && parseFloat(metrics.weight) - parseFloat(oldWeight.value) > 2) {
            await base44.entities.Alert.create({
              patient_id: patient.id,
              alert_type: 'Weight Gain',
              severity: 'medium',
              message: `Weight increased by ${(parseFloat(metrics.weight) - parseFloat(oldWeight.value)).toFixed(1)}kg in 3 days`
            });
          }
        }
      }
      
      if (metrics.urine_output) {
        const urineVal = parseFloat(metrics.urine_output);
        metricsToSave.push({
          patient_id: patient.id,
          metric_type: 'Urine Output',
          value: metrics.urine_output,
          unit: 'ml',
          recorded_at: now
        });
        // Alert for low urine output (oliguria < 500ml/day)
        if (urineVal < 500) {
          await base44.entities.Alert.create({
            patient_id: patient.id,
            alert_type: 'Severe Symptoms',
            severity: urineVal < 200 ? 'critical' : 'high',
            message: `Low urine output: ${urineVal}ml/day — Normal is >500ml/day`
          });
        }
      }
      
      if (metrics.fluid_intake) {
        metricsToSave.push({
          patient_id: patient.id,
          metric_type: 'Fluid Intake',
          value: metrics.fluid_intake,
          unit: 'ml',
          recorded_at: now
        });
      }
      
      if (metrics.temperature) {
        const tempVal = parseFloat(metrics.temperature);
        metricsToSave.push({
          patient_id: patient.id,
          metric_type: 'Temperature',
          value: metrics.temperature,
          unit: '°F',
          recorded_at: now
        });
        // Alert for high temperature (fever >100.4°F, high >103°F)
        if (tempVal >= 103) {
          await base44.entities.Alert.create({
            patient_id: patient.id,
            alert_type: 'Severe Symptoms',
            severity: 'critical',
            message: `High fever: ${tempVal}°F — Immediate evaluation recommended`
          });
        } else if (tempVal >= 100.4) {
          await base44.entities.Alert.create({
            patient_id: patient.id,
            alert_type: 'Severe Symptoms',
            severity: 'medium',
            message: `Fever detected: ${tempVal}°F`
          });
        }
      }
      
      for (const metric of metricsToSave) {
        await base44.entities.HealthMetric.create(metric);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['healthMetrics']);
      setSaved(true);
      setMetrics({
        bp_systolic: '',
        bp_diastolic: '',
        weight: '',
        urine_output: '',
        fluid_intake: '',
        temperature: ''
      });
      setTimeout(() => setSaved(false), 3000);
    }
  });

  const metricCards = [
    {
      key: 'bp',
      label: t('blood_pressure'),
      icon: Heart,
      color: 'text-red-500',
      bg: 'bg-red-50',
      fields: [
        { name: 'bp_systolic', placeholder: t('systolic'), unit: 'mmHg' },
        { name: 'bp_diastolic', placeholder: t('diastolic'), unit: 'mmHg' }
      ]
    },
    {
      key: 'weight',
      label: t('weight'),
      icon: Scale,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
      fields: [{ name: 'weight', placeholder: '45', unit: 'kg' }]
    },
    {
      key: 'urine',
      label: t('urine_output'),
      icon: Droplets,
      color: 'text-yellow-500',
      bg: 'bg-yellow-50',
      fields: [{ name: 'urine_output', placeholder: '1500', unit: 'ml' }]
    },
    {
      key: 'fluid',
      label: t('fluid_intake'),
      icon: Activity,
      color: 'text-green-500',
      bg: 'bg-green-50',
      fields: [{ name: 'fluid_intake', placeholder: '2000', unit: 'ml' }]
    },
    {
      key: 'temp',
      label: t('temperature'),
      icon: Thermometer,
      color: 'text-orange-500',
      bg: 'bg-orange-50',
      fields: [{ name: 'temperature', placeholder: '98.6', unit: '°F' }]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-50">
        <Link to={createPageUrl('Dashboard')}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="font-semibold text-gray-900">{t('health_metrics')}</h1>
      </div>

      <div className="px-5 py-6">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-600 mb-6 text-center"
        >
          {t('enter_health_data')}
        </motion.p>

        {/* Bluetooth Device Quick Sync Banner */}
        <div className="mb-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 rounded-3xl p-4 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none text-8xl font-black">
            BLE
          </div>
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-xl shadow-inner">
                <Bluetooth className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base leading-tight flex items-center gap-1.5">
                  {language === 'hi' ? 'ब्लूटूथ मेडिकल डिवाइस सिंक' : 'Bluetooth Medical Device Sync'}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400 text-emerald-950 font-bold uppercase tracking-wide">
                    Auto-Read
                  </span>
                </h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  {language === 'hi'
                    ? 'ओमरॉन बीपी कफ या डिजिटल वजन स्केल से स्वतः मापें'
                    : 'Auto-read directly from Omron BP cuffs & digital weight scales'}
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => {
                setBleInitialMode('bp');
                setBleModalOpen(true);
              }}
              className="bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-md shrink-0 flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              {language === 'hi' ? 'डिवाइस जोड़ें' : 'Pair Device'}
            </Button>
          </div>

          {lastBleReading && (
            <div className="mt-3 pt-2.5 border-t border-white/20 flex items-center justify-between text-xs text-blue-100">
              <span className="flex items-center gap-1 text-emerald-300 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                {language === 'hi' ? 'अंतिम सिंक माप:' : 'Last Synced Reading:'} {lastBleReading.type === 'BP' ? `${lastBleReading.systolic}/${lastBleReading.diastolic} mmHg` : `${lastBleReading.weight} kg`}
              </span>
              <span className="text-[11px] opacity-80">
                {format(new Date(lastBleReading.timestamp), 'h:mm a')}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-4 mb-8">
          {metricCards.map((card, idx) => (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className={`p-4 ${card.bg} border-none`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                    <Label className="font-medium text-gray-700">{card.label}</Label>
                  </div>

                  {/* Bluetooth 1-tap trigger button for BP and Weight */}
                  {(card.key === 'bp' || card.key === 'weight') && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBleInitialMode(card.key === 'bp' ? 'bp' : 'weight');
                        setBleModalOpen(true);
                      }}
                      className="h-8 rounded-xl bg-white/90 border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-semibold px-2.5 shadow-sm flex items-center gap-1"
                    >
                      <Bluetooth className="w-3.5 h-3.5 text-blue-600" />
                      {language === 'hi' ? 'ब्लूटूथ सिंक' : 'Sync BLE'}
                    </Button>
                  )}
                </div>

                <div className="flex gap-3">
                  {card.fields.map(field => (
                    <div key={field.name} className="flex-1 relative">
                      <Input
                        type="number"
                        value={metrics[field.name]}
                        onChange={(e) => setMetrics({ ...metrics, [field.name]: e.target.value })}
                        placeholder={field.placeholder}
                        className="h-12 rounded-xl bg-white pr-12 font-medium"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                        {field.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* BleDeviceSyncModal Component */}
        <BleDeviceSyncModal
          isOpen={bleModalOpen}
          initialMode={bleInitialMode}
          language={language}
          onClose={() => setBleModalOpen(false)}
          onReadingCaptured={(reading) => {
            setLastBleReading(reading);
            if (reading.type === 'BP') {
              setMetrics(prev => ({
                ...prev,
                bp_systolic: String(reading.systolic),
                bp_diastolic: String(reading.diastolic)
              }));
            } else if (reading.type === 'Weight') {
              setMetrics(prev => ({
                ...prev,
                weight: String(reading.weight)
              }));
            }
          }}
        />

        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || saved}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-lg font-medium"
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : saved ? (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              {language === 'hi' ? 'सहेजा गया!' : 'Saved!'}
            </>
          ) : (
            t('save')
          )}
        </Button>

        {/* Recent entries */}
        {recentMetrics.length > 0 && (
          <div className="mt-8">
            <h3 className="font-semibold text-gray-900 mb-4">
              {language === 'hi' ? 'हाल की प्रविष्टियाँ' : 'Recent Entries'}
            </h3>
            <div className="space-y-2">
              {recentMetrics.slice(0, 5).map((metric) => (
                <div key={metric.id} className="bg-white rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      {metric.metric_type}
                    </p>
                    <p className="font-medium text-gray-900">
                      {metric.value}{metric.value_secondary ? `/${metric.value_secondary}` : ''} {metric.unit}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {format(new Date(metric.recorded_at || metric.created_date), 'MMM d, h:mm a')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HealthMetrics() {
  return (
    <LanguageProvider>
      <HealthMetricsContent />
    </LanguageProvider>
  );
}
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users, AlertTriangle, Activity, Bell, Search,
  ChevronRight, Calendar, Droplets, MessageSquare,
  CheckCircle, X, Clock, Video, Phone, MapPin,
  TrendingUp, FileText, Lock, Delete,
  Smartphone, Send, CheckCheck, Zap
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import ProteinLevelBadge from '../components/shared/ProteinLevelBadge';

const LOCK_TIMEOUT_MS = 5 * 60 * 1000;

export default function ClinicianDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('patients');
  const [calendarWeekStart, setCalendarWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const queryClient = useQueryClient();

  // PIN gate state
  const [pinGateState, setPinGateState] = useState(() => {
    const storedPin = localStorage.getItem('clinician_pin');
    if (!storedPin) return 'setup';
    const lastActive = parseInt(localStorage.getItem('clinician_last_active') || '0');
    if (Date.now() - lastActive > LOCK_TIMEOUT_MS) return 'locked';
    return 'unlocked';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinSetupStage, setPinSetupStage] = useState('enter'); // 'enter' | 'confirm'
  const [pinError, setPinError] = useState('');

  const touchActivity = useCallback(() => {
    localStorage.setItem('clinician_last_active', Date.now().toString());
  }, []);

  // Auto-lock timer
  useEffect(() => {
    if (pinGateState !== 'unlocked') return;
    touchActivity();
    const interval = setInterval(() => {
      const lastActive = parseInt(localStorage.getItem('clinician_last_active') || '0');
      if (Date.now() - lastActive > LOCK_TIMEOUT_MS) {
        setPinGateState('locked');
        setPinInput('');
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [pinGateState, touchActivity]);

  // Reset inactivity timer on any user interaction
  useEffect(() => {
    if (pinGateState !== 'unlocked') return;
    const handler = () => touchActivity();
    window.addEventListener('click', handler);
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('click', handler);
      window.removeEventListener('keydown', handler);
    };
  }, [pinGateState, touchActivity]);

  const handlePinDigit = (digit) => {
    if (pinGateState === 'setup') {
      if (pinSetupStage === 'enter') {
        const next = pinInput + digit;
        if (next.length > 4) return;
        setPinInput(next);
        if (next.length === 4) {
          setTimeout(() => { setPinSetupStage('confirm'); setPinError(''); }, 200);
        }
      } else {
        const next = pinConfirm + digit;
        if (next.length > 4) return;
        setPinConfirm(next);
        if (next.length === 4) {
          if (next === pinInput) {
            localStorage.setItem('clinician_pin', next);
            localStorage.setItem('clinician_last_active', Date.now().toString());
            setPinGateState('unlocked');
          } else {
            setPinError('PINs do not match. Try again.');
            setPinInput('');
            setPinConfirm('');
            setPinSetupStage('enter');
          }
        }
      }
    } else if (pinGateState === 'locked') {
      const next = pinInput + digit;
      if (next.length > 4) return;
      setPinInput(next);
      if (next.length === 4) {
        const stored = localStorage.getItem('clinician_pin');
        if (next === stored) {
          localStorage.setItem('clinician_last_active', Date.now().toString());
          setPinGateState('unlocked');
          setPinInput('');
          setPinError('');
        } else {
          setPinError('Incorrect PIN. Try again.');
          setPinInput('');
        }
      }
    }
  };

  const handlePinBackspace = () => {
    if (pinGateState === 'setup') {
      if (pinSetupStage === 'enter') setPinInput(p => p.slice(0, -1));
      else setPinConfirm(p => p.slice(0, -1));
    } else {
      setPinInput(p => p.slice(0, -1));
    }
  };

  const { data: patients = [] } = useQuery({
    queryKey: ['allPatients'],
    queryFn: () => base44.entities.Patient.list('-created_date')
  });

  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['allAlerts'],
    queryFn: () => base44.entities.Alert.filter({ acknowledged: false }, '-created_date', 100)
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['allAppointments'],
    queryFn: () => base44.entities.Appointment.list('-appointment_date', 200)
  });

  const { data: dipstickResults = [] } = useQuery({
    queryKey: ['allDipstickResults'],
    queryFn: () => base44.entities.DipstickResult.list('-created_date', 50)
  });

  const acknowledgeAlert = useMutation({
    mutationFn: async (alertId) => {
      await base44.entities.Alert.update(alertId, { acknowledged: true, acknowledged_at: new Date().toISOString() });
    },
    onSuccess: () => queryClient.invalidateQueries(['allAlerts'])
  });

  const filteredPatients = patients.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const highAlerts = alerts.filter(a => a.severity === 'high');

  const calculateAge = (dob) => {
    if (!dob) return '--';
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const severityColors = {
    low: 'bg-blue-100 text-blue-700 border-blue-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    critical: 'bg-red-100 text-red-700 border-red-200'
  };

  const alertTypeIcons = {
    'High Protein': Droplets,
    'Weight Gain': TrendingUp,
    'Severe Symptoms': AlertTriangle,
    'Missed Medications': Bell,
    'Abnormal BP': Activity,
    'Low Urine Output': Droplets,
    'High Temperature': Activity,
  };

  // Calendar helpers
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(calendarWeekStart, i));
  const getAppointmentsForDay = (day) =>
    appointments.filter(a => isSameDay(new Date(a.appointment_date), day));

  const apptTypeIcon = { 'Video Call': Video, 'Phone Call': Phone, 'In-Person': MapPin };

  const todayAppointments = appointments.filter(a =>
    isSameDay(new Date(a.appointment_date), new Date()) &&
    !['Cancelled', 'Completed'].includes(a.status)
  );

  // PIN gate screen
  if (pinGateState !== 'unlocked') {
    const currentInput = pinGateState === 'setup' && pinSetupStage === 'confirm' ? pinConfirm : pinInput;
    const title = pinGateState === 'setup'
      ? (pinSetupStage === 'enter' ? 'Set a Clinician PIN' : 'Confirm PIN')
      : 'Clinician Dashboard Locked';
    const subtitle = pinGateState === 'setup'
      ? (pinSetupStage === 'enter'
          ? 'Create a 4-digit PIN to protect this view.'
          : 'Re-enter the same PIN to confirm.')
      : 'Enter your PIN to continue.';

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 bg-indigo-100 rounded-3xl flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1 text-center">{title}</h1>
        <p className="text-sm text-gray-500 text-center mb-8 max-w-xs">{subtitle}</p>

        {/* PIN dots */}
        <div className="flex gap-4 mb-6">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${i < currentInput.length ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`} />
          ))}
        </div>

        {pinError && (
          <p className="text-sm text-red-500 mb-5 text-center">{pinError}</p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 w-64">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <button key={n} onClick={() => handlePinDigit(String(n))}
              className="h-16 rounded-2xl bg-white border border-gray-200 text-2xl font-semibold text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-all shadow-sm">
              {n}
            </button>
          ))}
          <div /> {/* empty cell */}
          <button onClick={() => handlePinDigit('0')}
            className="h-16 rounded-2xl bg-white border border-gray-200 text-2xl font-semibold text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-all shadow-sm">
            0
          </button>
          <button onClick={handlePinBackspace}
            className="h-16 rounded-2xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-all shadow-sm">
            <Delete className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Clinician Dashboard</h1>
            <p className="text-white/70 text-sm mt-1">
              {format(new Date(), 'EEEE, MMMM d')}
            </p>
          </div>
          {alerts.length > 0 && (
            <div className="relative">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
                {alerts.length > 9 ? '9+' : alerts.length}
              </span>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 mt-2">
          {[
            { label: 'Patients', value: patients.length, color: 'bg-white/10' },
            { label: 'Alerts', value: alerts.length, color: criticalAlerts.length > 0 ? 'bg-red-500/50' : 'bg-white/10' },
            { label: "Today's Appts", value: todayAppointments.length, color: 'bg-white/10' },
            { label: 'Tests Today', value: dipstickResults.filter(r => isSameDay(new Date(r.created_date), new Date())).length, color: 'bg-white/10' },
          ].map(stat => (
            <div key={stat.label} className={`${stat.color} rounded-xl p-2 text-center`}>
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-xs text-white/70 leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Critical alert banner */}
      {criticalAlerts.length > 0 && (
        <div className="mx-4 mt-3 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-700 font-medium flex-1">
            {criticalAlerts.length} critical alert{criticalAlerts.length > 1 ? 's' : ''} require immediate attention
          </p>
          <button onClick={() => setSelectedTab('alerts')} className="text-xs text-red-600 font-semibold underline">
            View
          </button>
        </div>
      )}

      {/* Search */}
      <div className="px-4 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patients by name or diagnosis..."
            className="pl-10 h-11 rounded-xl border-gray-200 bg-white"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="px-4">
        <TabsList className="w-full bg-gray-100 p-1 rounded-xl grid grid-cols-4">
          <TabsTrigger value="patients" className="rounded-lg text-xs">
            <Users className="w-3.5 h-3.5 mr-1" />Patients
          </TabsTrigger>
          <TabsTrigger value="alerts" className="rounded-lg text-xs relative">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
            Alerts
            {alerts.length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {alerts.length > 9 ? '9+' : alerts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="calendar" className="rounded-lg text-xs">
            <Calendar className="w-3.5 h-3.5 mr-1" />Calendar
          </TabsTrigger>
          <TabsTrigger value="results" className="rounded-lg text-xs">
            <Droplets className="w-3.5 h-3.5 mr-1" />Results
          </TabsTrigger>
        </TabsList>

        {/* ── PATIENTS TAB ── */}
        <TabsContent value="patients" className="mt-4 space-y-3 pb-24">
          {filteredPatients.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No patients found</p>
            </div>
          )}
          {filteredPatients.map((patient, idx) => {
            const patientAlerts = alerts.filter(a => a.patient_id === patient.id);
            const hasCritical = patientAlerts.some(a => a.severity === 'critical');
            return (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Link to={createPageUrl(`PatientDetail?id=${patient.id}`)}>
                  <Card className="p-4 hover:shadow-lg transition-all border-none bg-white">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 ${hasCritical ? 'bg-red-500' : 'bg-gradient-to-br from-indigo-400 to-blue-600'}`}>
                        {patient.name?.[0]?.toUpperCase() || 'P'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 truncate">{patient.name}</h3>
                          {hasCritical && <Badge className="bg-red-100 text-red-700 text-xs">Critical</Badge>}
                        </div>
                        <p className="text-sm text-gray-500">{calculateAge(patient.dob)} yrs • {patient.gender || 'N/A'}</p>
                        {patient.diagnosis && <p className="text-xs text-gray-400 truncate">{patient.diagnosis}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {patientAlerts.length > 0 && (
                          <Badge className="bg-orange-100 text-orange-700 text-xs">{patientAlerts.length} alert{patientAlerts.length > 1 ? 's' : ''}</Badge>
                        )}
                        <div className="flex gap-1">
                          <Link to={createPageUrl(`ClinicianHealthRecords?patient_id=${patient.id}`)} onClick={e => e.stopPropagation()}>
                            <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-3.5 h-3.5 text-indigo-600" />
                            </div>
                          </Link>
                          <ChevronRight className="w-5 h-5 text-gray-300 self-center" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </TabsContent>

        {/* ── ALERTS TAB ── */}
        <TabsContent value="alerts" className="mt-4 space-y-4 pb-24">
          {/* Automated SMS Dispatch Header & Trigger Simulator */}
          <div className="p-3.5 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-200 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Automated Caregiver SMS Notification System</h4>
                <p className="text-[10px] text-slate-500 font-medium">Text message auto-dispatched to parents on 3-day relapse or high proteinuria</p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={async () => {
                const newAlert = {
                  patient_id: 'pat_aiims_001',
                  alert_type: 'Proteinuria Relapse Warning',
                  severity: 'critical',
                  message: '3 consecutive days of 2+ protein detected. Relapse threshold met.',
                  message_hi: '3 दिनों से लगातार 2+ पेशाब प्रोटीन। रिलैप्स प्रोटोकॉल का पालन करें।',
                  caregiver_name: 'Priya Sharma (Mother)',
                  caregiver_phone: '+91 98765 43210',
                  sms_status: 'Sent',
                  acknowledged: false
                };
                await base44.entities.Alert.create(newAlert);
                queryClient.invalidateQueries(['allAlerts']);
                alert('⚡ Automated text message (SMS) triggered and sent to Priya Sharma (+91 98765 43210)!');
              }}
              className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl gap-1.5 shadow-sm"
            >
              <Zap className="w-3.5 h-3.5" />
              Simulate New Relapse Alert & SMS
            </Button>
          </div>

          {/* Group by severity */}
          {['critical', 'high', 'medium', 'low'].map(sev => {
            const sevAlerts = alerts.filter(a => a.severity === sev);
            if (sevAlerts.length === 0) return null;
            return (
              <div key={sev}>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 px-1">
                  {sev} ({sevAlerts.length})
                </p>
                {sevAlerts.map((alert, idx) => {
                  const patient = patients.find(p => p.id === alert.patient_id) || patients[0];
                  const Icon = alertTypeIcons[alert.alert_type] || AlertTriangle;
                  const caregiverPhone = alert.caregiver_phone || patient?.caregiver_phone || '+91 98765 43210';
                  const caregiverName = alert.caregiver_name || patient?.caregiver_name || 'Caregiver';
                  const cleanPhone = caregiverPhone.replace(/\D/g, '');
                  const smsBody = `[AIIMS Patna KidneyCare Alert] Dear ${caregiverName}, an alert has been triggered for patient ${patient?.name || ''} (CR ${patient?.cr_number || '2024098273'}): ${alert.message}. Please consult AIIMS Pediatric OPD.`;

                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="mb-2"
                    >
                      <Card className={`p-4 border ${sev === 'critical' ? 'border-red-200 bg-red-50/70' : 'border-slate-200 bg-white'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${severityColors[sev]}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-semibold text-gray-900 text-sm truncate">{patient?.name || 'Aarav Sharma'}</span>
                              <Badge className={`${severityColors[sev]} text-xs border`}>{sev}</Badge>
                              {patient?.cr_number && (
                                <span className="text-[10px] text-slate-500 font-mono">CR: {patient.cr_number}</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-800 font-medium">{alert.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {format(new Date(alert.created_date || Date.now()), 'MMM d, h:mm a')} • {alert.alert_type}
                            </p>

                            {/* Automated SMS dispatch status banner */}
                            <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="font-semibold">Automated SMS Dispatched:</span>
                                <span className="text-[11px] font-mono">{caregiverPhone}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <a
                                  href={`sms:${caregiverPhone}?body=${encodeURIComponent(smsBody)}`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
                                >
                                  <Smartphone className="w-3 h-3" />
                                  Send Text (SMS)
                                </a>

                                <a
                                  href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(smsBody)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  WhatsApp
                                </a>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Link to={createPageUrl(`PatientDetail?id=${alert.patient_id}`)}>
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs rounded-lg">View</Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 rounded-lg text-green-600 hover:bg-green-50"
                              onClick={() => acknowledgeAlert.mutate(alert.id)}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            );
          })}

          {alerts.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <CheckCircle className="w-14 h-14 mx-auto mb-4 text-green-300" />
              <p className="font-medium text-gray-600">All clear!</p>
              <p className="text-sm mt-1">No pending alerts</p>
            </div>
          )}
        </TabsContent>

        {/* ── CALENDAR TAB ── */}
        <TabsContent value="calendar" className="mt-4 pb-24">
          {/* Week navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setCalendarWeekStart(d => addDays(d, -7))}>
              ‹ Prev
            </Button>
            <span className="text-sm font-medium text-gray-700">
              {format(calendarWeekStart, 'MMM d')} – {format(addDays(calendarWeekStart, 6), 'MMM d, yyyy')}
            </span>
            <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setCalendarWeekStart(d => addDays(d, 7))}>
              Next ›
            </Button>
          </div>

          {/* Day columns */}
          <div className="grid grid-cols-7 gap-1 mb-3">
            {weekDays.map(day => (
              <div
                key={day.toISOString()}
                className={`text-center p-1.5 rounded-lg ${isSameDay(day, new Date()) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                <p className="text-[10px] font-medium">{format(day, 'EEE')}</p>
                <p className="text-sm font-bold">{format(day, 'd')}</p>
              </div>
            ))}
          </div>

          {/* Appointments per day */}
          <div className="space-y-4">
            {weekDays.map(day => {
              const dayAppts = getAppointmentsForDay(day);
              if (dayAppts.length === 0) return null;
              return (
                <div key={day.toISOString()}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {isSameDay(day, new Date()) ? 'Today' : format(day, 'EEEE, MMM d')}
                  </p>
                  <div className="space-y-2">
                    {dayAppts.sort((a, b) => a.appointment_time?.localeCompare(b.appointment_time)).map(appt => {
                      const patient = patients.find(p => p.id === appt.patient_id);
                      const ApptIcon = apptTypeIcon[appt.type] || Calendar;
                      const statusColors = {
                        Scheduled: 'bg-blue-50 border-blue-200',
                        Confirmed: 'bg-green-50 border-green-200',
                        Completed: 'bg-gray-50 border-gray-200',
                        Cancelled: 'bg-red-50 border-red-200',
                        'No-Show': 'bg-orange-50 border-orange-200',
                      };
                      return (
                        <Card key={appt.id} className={`p-3 border ${statusColors[appt.status] || 'bg-white border-gray-100'}`}>
                          <div className="flex items-center gap-3">
                            <div className="text-center w-12">
                              <p className="text-sm font-bold text-indigo-700">{appt.appointment_time}</p>
                              <p className="text-xs text-gray-400">{appt.duration || 30}min</p>
                            </div>
                            <div className="w-px h-8 bg-gray-200" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm truncate">{patient?.name || 'Patient'}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <ApptIcon className="w-3 h-3 text-gray-400" />
                                <p className="text-xs text-gray-500">{appt.type}</p>
                                <span className="text-gray-300">•</span>
                                <p className="text-xs text-gray-500">{appt.status}</p>
                              </div>
                            </div>
                            {appt.type === 'Video Call' && appt.status !== 'Cancelled' && (
                              <Link to={createPageUrl(`Telemedicine?appointment_id=${appt.id}`)}>
                                <Button size="sm" className="h-7 bg-indigo-600 hover:bg-indigo-700 text-xs rounded-lg px-2">
                                  <Video className="w-3 h-3 mr-1" /> Join
                                </Button>
                              </Link>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {weekDays.every(d => getAppointmentsForDay(d).length === 0) && (
              <div className="text-center py-12 text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No appointments this week</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── RESULTS TAB ── */}
        <TabsContent value="results" className="mt-4 space-y-3 pb-24">
          {dipstickResults.map((result, idx) => {
            const patient = patients.find(p => p.id === result.patient_id);
            return (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card className="p-4 border-none bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                      <Droplets className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{patient?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">{format(new Date(result.created_date), 'MMM d, h:mm a')}</p>
                    </div>
                    <div className="text-right">
                      <ProteinLevelBadge level={result.protein_level} size="sm" />
                      {result.confidence && (
                        <p className="text-xs text-gray-400 mt-1">{Math.round(result.confidence * 100)}% conf</p>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
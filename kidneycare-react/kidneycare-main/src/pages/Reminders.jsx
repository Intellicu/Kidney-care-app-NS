import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Plus, Bell, Clock, Trash2, Loader2, Sun, Moon, Globe } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LanguageProvider, useLanguage } from '../components/shared/LanguageContext';
import { useTheme } from '../components/shared/ThemeContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

function RemindersContent() {
  const { t, language, changeLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newReminder, setNewReminder] = useState({
    reminder_type: 'Medication',
    time: '08:00',
    channel: 'Push'
  });

  const { data: patient } = useQuery({
    queryKey: ['currentPatient'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const patients = await base44.entities.Patient.filter({ created_by: user.email });
      return patients[0];
    }
  });

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['reminders', patient?.id],
    queryFn: () => patient 
      ? base44.entities.Reminder.filter({ patient_id: patient.id })
      : [],
    enabled: !!patient
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!patient) return;
      await base44.entities.Reminder.create({
        ...newReminder,
        patient_id: patient.id,
        active: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reminders']);
      setShowAdd(false);
      setNewReminder({ reminder_type: 'Medication', time: '08:00', channel: 'Push' });
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }) => {
      await base44.entities.Reminder.update(id, { active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reminders']);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Reminder.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reminders']);
    }
  });

  const typeLabels = {
    'Medication': language === 'hi' ? 'दवा रिमाइंडर' : 'Medication Reminder',
    'Dipstick Test': language === 'hi' ? 'डिपस्टिक टेस्ट' : 'Dipstick Test',
    'Metrics': language === 'hi' ? 'स्वास्थ्य डेटा' : 'Health Data Entry',
    'Appointment': language === 'hi' ? 'अपॉइंटमेंट' : 'Appointment'
  };

  const channelLabels = {
    'Push': language === 'hi' ? 'पुश नोटिफिकेशन' : 'Push Notification',
    'SMS': 'SMS',
    'WhatsApp': 'WhatsApp'
  };

  const typeColors = {
    'Medication': 'from-orange-400 to-orange-600',
    'Dipstick Test': 'from-blue-400 to-blue-600',
    'Metrics': 'from-green-400 to-green-600',
    'Appointment': 'from-purple-400 to-purple-600'
  };

  const typeBgColors = {
    'Medication': 'bg-orange-50',
    'Dipstick Test': 'bg-blue-50',
    'Metrics': 'bg-green-50',
    'Appointment': 'bg-purple-50'
  };

  return (
    <div className={`min-h-screen pb-24 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`border-b px-4 py-3 flex items-center justify-between sticky top-0 z-50 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
        <div className="flex items-center gap-3">
          <Link to="/TodaysTasks">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('reminders')}</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <select value={language} onChange={e => changeLanguage(e.target.value)}
            className={`text-xs px-2 py-1.5 rounded-lg border focus:outline-none ${isDark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-600'}`}>
            <option value="en">EN</option>
            <option value="hi">हिं</option>
          </select>
          {/* Theme toggle */}
          <button onClick={toggleTheme} className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-800 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}>
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <Button size="icon" className="rounded-full bg-blue-500 hover:bg-blue-600" onClick={() => setShowAdd(true)}>
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="px-5 py-6 space-y-4">
        {/* Language & Theme settings card */}
        <div className={`rounded-2xl border p-4 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
          <h2 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('theme_toggle')}</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isDark ? <Moon className="w-4 h-4 text-cyan-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <Switch checked={isDark} onCheckedChange={toggleTheme} />
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('language_toggle')}</span>
            </div>
            <div className="flex gap-1.5">
              {[{code:'en',label:'EN'},{code:'hi',label:'हिं'}].map(l => (
                <button key={l.code} onClick={() => changeLanguage(l.code)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${language === l.code ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600' : isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="px-5 pb-6 -mt-4">
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
          </div>
        ) : reminders.length === 0 ? (
          <Card className="p-8 text-center bg-blue-50 border-none">
            <Bell className="w-12 h-12 text-blue-300 mx-auto mb-4" />
            <p className="text-gray-600">
              {language === 'hi' ? 'कोई रिमाइंडर नहीं' : 'No reminders set'}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder, idx) => (
              <motion.div
                key={reminder.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className={`p-4 border-none ${typeBgColors[reminder.reminder_type] || 'bg-gray-50'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${typeColors[reminder.reminder_type] || 'from-gray-400 to-gray-600'} rounded-xl flex items-center justify-center shadow-lg`}>
                      <Bell className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {typeLabels[reminder.reminder_type]}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-sm text-gray-500">{reminder.time}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-400">{channelLabels[reminder.channel]}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={reminder.active}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: reminder.id, active: checked })}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => deleteMutation.mutate(reminder.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Reminder Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t('add_reminder')}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>
                {language === 'hi' ? 'रिमाइंडर प्रकार' : 'Reminder Type'}
              </Label>
              <Select
                value={newReminder.reminder_type}
                onValueChange={(value) => setNewReminder({ ...newReminder, reminder_type: value })}
              >
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Medication">{typeLabels['Medication']}</SelectItem>
                  <SelectItem value="Dipstick Test">{typeLabels['Dipstick Test']}</SelectItem>
                  <SelectItem value="Metrics">{typeLabels['Metrics']}</SelectItem>
                  <SelectItem value="Appointment">{typeLabels['Appointment']}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>{t('reminder_time')}</Label>
              <Input
                type="time"
                value={newReminder.time}
                onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>
                {language === 'hi' ? 'चैनल' : 'Channel'}
              </Label>
              <Select
                value={newReminder.channel}
                onValueChange={(value) => setNewReminder({ ...newReminder, channel: value })}
              >
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Push">{channelLabels['Push']}</SelectItem>
                  <SelectItem value="SMS">{channelLabels['SMS']}</SelectItem>
                  <SelectItem value="WhatsApp">{channelLabels['WhatsApp']}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => addMutation.mutate()}
              disabled={addMutation.isPending}
              className="w-full h-12 rounded-xl bg-blue-500 hover:bg-blue-600"
            >
              {addMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                t('save')
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Reminders() {
  return (
    <LanguageProvider>
      <RemindersContent />
    </LanguageProvider>
  );
}
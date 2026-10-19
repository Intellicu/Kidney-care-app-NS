import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Calendar, Clock, Video, Phone, MapPin, Plus, CheckCircle, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LanguageProvider, useLanguage } from '../components/shared/LanguageContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';

function AppointmentsContent() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [showBook, setShowBook] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newAppt, setNewAppt] = useState({
    appointment_time: '',
    type: 'In-Person',
    reason: ''
  });

  const { data: patient } = useQuery({
    queryKey: ['currentPatient'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const patients = await base44.entities.Patient.filter({ created_by: user.email });
      return patients[0];
    }
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments', patient?.id],
    queryFn: () => patient 
      ? base44.entities.Appointment.filter({ patient_id: patient.id }, '-appointment_date')
      : [],
    enabled: !!patient
  });

  const { data: clinicians = [] } = useQuery({
    queryKey: ['clinicians'],
    queryFn: () => base44.entities.Patient.filter({ user_role: 'clinician' })
  });

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!patient || !patient.assigned_clinician_id) return;
      await base44.entities.Appointment.create({
        patient_id: patient.id,
        clinician_id: patient.assigned_clinician_id,
        appointment_date: selectedDate,
        ...newAppt,
        status: 'Scheduled'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments']);
      setShowBook(false);
      setNewAppt({ appointment_time: '', type: 'In-Person', reason: '' });
    }
  });

  const statusColors = {
    'Scheduled': 'bg-blue-100 text-blue-700',
    'Confirmed': 'bg-green-100 text-green-700',
    'Completed': 'bg-gray-100 text-gray-700',
    'Cancelled': 'bg-red-100 text-red-700'
  };

  const typeIcons = {
    'In-Person': MapPin,
    'Video Call': Video,
    'Phone Call': Phone
  };

  const upcomingAppointments = appointments.filter(a => 
    new Date(a.appointment_date) >= new Date() && a.status !== 'Cancelled' && a.status !== 'Completed'
  );

  // Find appointments within 24 hours
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const imminent = upcomingAppointments.filter(a => {
    const apptDateTime = new Date(`${a.appointment_date}T${a.appointment_time || '09:00'}:00`);
    return apptDateTime <= in24h && apptDateTime >= now;
  });

  const pastAppointments = appointments.filter(a => 
    new Date(a.appointment_date) < new Date() || a.status === 'Completed' || a.status === 'Cancelled'
  );

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-white/20">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">
              {language === 'hi' ? 'अपॉइंटमेंट' : 'Appointments'}
            </h1>
          </div>
          <Button
            size="icon"
            className="rounded-full bg-white/20 hover:bg-white/30"
            onClick={() => setShowBook(true)}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-purple-100 text-sm">
          {language === 'hi' ? `${upcomingAppointments.length} आगामी अपॉइंटमेंट` : `${upcomingAppointments.length} upcoming`}
        </p>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* 24-hour reminder banner */}
        {imminent.map(appt => (
          <div key={appt.id} className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔔</span>
              <div className="flex-1">
                <p className="font-bold text-amber-800">
                  {language === 'hi' ? 'कल डॉक्टर मिलना है!' : 'Doctor appointment tomorrow!'}
                </p>
                <p className="text-amber-700 text-sm mt-1">
                  {format(new Date(appt.appointment_date), 'EEEE, d MMM')} {language === 'hi' ? 'को' : 'at'} {appt.appointment_time}
                </p>
                <p className="text-amber-600 text-xs mt-2">
                  {language === 'hi' ? 'सभी रिपोर्ट और दवाएँ साथ लाएँ। 15 मिनट पहले पहुँचें।' : 'Bring all reports & medications. Arrive 15 min early.'}
                </p>
                {patient?.assigned_clinician_id && (
                  <p className="text-xs text-amber-700 mt-1 font-medium">
                    📞 {language === 'hi' ? 'आपातकाल में संपर्क करें:' : 'For emergencies:'} {patient?.caregiver_phone || '—'}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Upcoming */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">
            {language === 'hi' ? 'आगामी' : 'Upcoming'}
          </h3>
          {upcomingAppointments.length === 0 ? (
            <Card className="p-8 text-center bg-purple-50 border-none">
              <Calendar className="w-12 h-12 text-purple-300 mx-auto mb-4" />
              <p className="text-gray-600">
                {language === 'hi' ? 'कोई आगामी अपॉइंटमेंट नहीं' : 'No upcoming appointments'}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((appt, idx) => {
                const TypeIcon = typeIcons[appt.type] || MapPin;
                return (
                  <motion.div
                    key={appt.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="p-4 bg-white border-none hover:shadow-lg transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                          <TypeIcon className="w-6 h-6 text-purple-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={statusColors[appt.status]}>
                              {appt.status}
                            </Badge>
                            <Badge variant="outline">{appt.type}</Badge>
                          </div>
                          <p className="font-semibold text-gray-900">{appt.reason || 'Consultation'}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(appt.appointment_date), 'MMM d, yyyy')}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {appt.appointment_time}
                            </div>
                          </div>
                        </div>
                        {appt.type === 'Video Call' && appt.status === 'Confirmed' && (
                          <Link to={createPageUrl(`Telemedicine?room=${appt.video_room_id || appt.id}`)}>
                            <Button size="sm" className="bg-purple-500 hover:bg-purple-600 rounded-full">
                              <Video className="w-4 h-4 mr-2" />
                              Join
                            </Button>
                          </Link>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Past */}
        {pastAppointments.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              {language === 'hi' ? 'पिछले' : 'Past'}
            </h3>
            <div className="space-y-3">
              {pastAppointments.slice(0, 5).map(appt => {
                const TypeIcon = typeIcons[appt.type] || MapPin;
                return (
                  <Card key={appt.id} className="p-4 bg-gray-50 border-none">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                        <TypeIcon className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={statusColors[appt.status]}>{appt.status}</Badge>
                        </div>
                        <p className="text-sm font-medium text-gray-700">{appt.reason || 'Consultation'}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {format(new Date(appt.appointment_date), 'MMM d')} at {appt.appointment_time}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Book Appointment Dialog */}
      <Dialog open={showBook} onOpenChange={setShowBook}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {language === 'hi' ? 'अपॉइंटमेंट बुक करें' : 'Book Appointment'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>{language === 'hi' ? 'तारीख' : 'Date'}</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>{language === 'hi' ? 'समय' : 'Time'}</Label>
              <Select
                value={newAppt.appointment_time}
                onValueChange={(value) => setNewAppt({ ...newAppt, appointment_time: value })}
              >
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map(time => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{language === 'hi' ? 'प्रकार' : 'Type'}</Label>
              <Select
                value={newAppt.type}
                onValueChange={(value) => setNewAppt({ ...newAppt, type: value })}
              >
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="In-Person">In-Person</SelectItem>
                  <SelectItem value="Video Call">Video Call</SelectItem>
                  <SelectItem value="Phone Call">Phone Call</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{language === 'hi' ? 'कारण' : 'Reason'}</Label>
              <Textarea
                value={newAppt.reason}
                onChange={(e) => setNewAppt({ ...newAppt, reason: e.target.value })}
                placeholder="e.g., Follow-up check"
                className="rounded-xl"
                rows={3}
              />
            </div>

            <Button
              onClick={() => bookMutation.mutate()}
              disabled={!newAppt.appointment_time || bookMutation.isPending}
              className="w-full h-12 rounded-xl bg-purple-500 hover:bg-purple-600"
            >
              {bookMutation.isPending ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                  <Clock className="w-5 h-5" />
                </motion.div>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {language === 'hi' ? 'बुक करें' : 'Book Appointment'}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Appointments() {
  return (
    <LanguageProvider>
      <AppointmentsContent />
    </LanguageProvider>
  );
}
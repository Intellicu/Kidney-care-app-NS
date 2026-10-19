import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Video, Phone } from 'lucide-react';
import { format, addDays, isToday, isTomorrow } from 'date-fns';

const typeIcons = {
  'Video Call': Video,
  'Phone Call': Phone,
  'In-Person': Calendar,
};

const statusColors = {
  'Scheduled': 'bg-blue-100 text-blue-700',
  'Confirmed': 'bg-green-100 text-green-700',
  'Completed': 'bg-gray-100 text-gray-600',
  'Cancelled': 'bg-red-100 text-red-700',
  'No-Show': 'bg-orange-100 text-orange-700',
};

export default function CalendarTab({ appointments, patients }) {
  const next7Days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  const getDayLabel = (date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEEE');
  };

  const getDayAppointments = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointments
      .filter(a => a.appointment_date === dateStr)
      .sort((a, b) => a.appointment_time?.localeCompare(b.appointment_time));
  };

  return (
    <div className="mt-4 space-y-4 pb-24">
      {next7Days.map((date) => {
        const dayApts = getDayAppointments(date);
        return (
          <div key={date.toISOString()}>
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className={`text-sm font-semibold ${isToday(date) ? 'text-blue-600' : 'text-gray-500'}`}>
                {getDayLabel(date)}
              </span>
              <span className="text-xs text-gray-400">{format(date, 'MMM d')}</span>
              {dayApts.length > 0 && (
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                  {dayApts.length}
                </span>
              )}
            </div>

            {dayApts.length === 0 ? (
              <div className="bg-white rounded-xl p-3 text-center text-gray-400 text-sm border border-dashed border-gray-200">
                No appointments
              </div>
            ) : (
              <div className="space-y-2">
                {dayApts.map(apt => {
                  const patient = patients.find(p => p.id === apt.patient_id);
                  const Icon = typeIcons[apt.type] || Calendar;
                  return (
                    <Card key={apt.id} className={`p-3 border-none ${isToday(date) ? 'bg-blue-50' : 'bg-white'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isToday(date) ? 'bg-blue-500' : 'bg-gray-100'}`}>
                          <Icon className={`w-5 h-5 ${isToday(date) ? 'text-white' : 'text-gray-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 text-sm truncate">
                              {patient?.name || 'Unknown Patient'}
                            </p>
                            <Badge className={`text-xs ${statusColors[apt.status] || 'bg-gray-100 text-gray-600'}`}>
                              {apt.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">{apt.appointment_time}</span>
                            <span className="text-xs text-gray-400">• {apt.type}</span>
                            {apt.duration && <span className="text-xs text-gray-400">• {apt.duration}min</span>}
                          </div>
                          {apt.reason && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{apt.reason}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Droplets, 
  Activity, 
  Heart, 
  Pill, 
  BookOpen, 
  Stethoscope,
  Calendar,
  ClipboardList
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '../shared/LanguageContext';

export default function QuickActions() {
  const { t, language } = useLanguage();

  const actions = [
    {
      icon: ClipboardList,
      label: language === 'hi' ? 'दैनिक लॉग' : 'Daily Log',
      color: 'from-teal-400 to-teal-600',
      bgColor: 'bg-teal-50',
      page: 'DailyLog'
    },
    {
      icon: Calendar,
      label: language === 'hi' ? 'अपॉइंटमेंट' : 'Appointments',
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-50',
      page: 'Appointments'
    },
    {
      icon: Droplets,
      label: t('urine_test'),
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-50',
      page: 'DipstickTest'
    },
    {
      icon: Pill,
      label: t('medications'),
      color: 'from-orange-400 to-orange-600',
      bgColor: 'bg-orange-50',
      page: 'Medications'
    },
    {
      icon: BookOpen,
      label: t('education'),
      color: 'from-pink-400 to-pink-600',
      bgColor: 'bg-pink-50',
      page: 'Education'
    },
    {
      icon: Activity,
      label: language === 'hi' ? 'स्वास्थ्य रिकॉर्ड' : 'Health Records',
      color: 'from-indigo-400 to-indigo-600',
      bgColor: 'bg-indigo-50',
      page: 'HealthRecords'
    }
  ];

  return (
    <div className="px-5 py-6">
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action, idx) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Link to={createPageUrl(action.page)}>
              <div className={`${action.bgColor} rounded-2xl p-5 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer`}>
                <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center mb-3 shadow-lg`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <p className="font-medium text-gray-800">{action.label}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
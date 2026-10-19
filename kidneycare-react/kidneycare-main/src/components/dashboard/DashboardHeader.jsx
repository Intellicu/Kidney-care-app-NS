import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Settings, Heart } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useLanguage } from '../shared/LanguageContext';

export default function DashboardHeader({ patient, unreadAlerts = 0 }) {
  const { t, language } = useLanguage();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (language === 'hi') {
      if (hour < 12) return 'सुप्रभात';
      if (hour < 17) return 'नमस्ते';
      return 'शुभ संध्या';
    }
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 rounded-b-3xl px-5 pt-6 pb-8 text-white"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white/70 text-sm">{getGreeting()}</p>
            <h1 className="text-xl font-bold">{patient?.name || 'Patient'}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 relative"
          >
            <Bell className="w-5 h-5" />
            {unreadAlerts > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                {unreadAlerts}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
        <p className="text-white/70 text-sm mb-2">{t('todays_status')}</p>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-xs text-white/60">{t('protein_level')}</p>
            <p className="text-lg font-semibold">--</p>
          </div>
          <div className="w-px h-10 bg-white/20" />
          <div className="flex-1">
            <p className="text-xs text-white/60">{t('medications_due')}</p>
            <p className="text-lg font-semibold">--</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
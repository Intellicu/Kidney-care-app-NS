import React from 'react';
import { motion } from 'framer-motion';
import { Droplets, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '../shared/LanguageContext';
import ProteinLevelBadge from '../shared/ProteinLevelBadge';

export default function RecentResults({ results = [] }) {
  const { t, language } = useLanguage();

  if (results.length === 0) {
    return (
      <div className="px-5 py-4">
        <div className="bg-blue-50 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Droplets className="w-8 h-8 text-blue-400" />
          </div>
          <p className="text-gray-600 mb-4">{t('no_test_today')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {language === 'hi' ? 'हाल के परिणाम' : 'Recent Results'}
        </h3>
        <button className="text-blue-500 text-sm font-medium flex items-center">
          {language === 'hi' ? 'सभी देखें' : 'View All'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {results.slice(0, 3).map((result, idx) => (
          <motion.div
            key={result.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {format(new Date(result.created_date), 'MMM d, h:mm a')}
                  </p>
                  <ProteinLevelBadge level={result.protein_level} language={language} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">{t('confidence')}</p>
                <p className="font-semibold text-gray-700">
                  {Math.round(result.confidence * 100)}%
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
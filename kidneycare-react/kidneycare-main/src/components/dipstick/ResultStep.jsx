import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, Home, RotateCcw, Share2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useLanguage } from '../shared/LanguageContext';
import ProteinLevelBadge from '../shared/ProteinLevelBadge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ResultStep({ result, onRetake }) {
  const { t, language } = useLanguage();

  const isHighProtein = ['2+', '3+', '4+'].includes(result.protein_level);

  const shareWhatsApp = () => {
    const msg = language === 'hi'
      ? `KidneyCare: आज की जाँच का परिणाम *${result.protein_level}* है। ${isHighProtein ? 'कृपया डॉक्टर से संपर्क करें।' : 'सब ठीक है।'}`
      : `KidneyCare: Today's dipstick result is *${result.protein_level}*. ${isHighProtein ? 'Please contact your clinician.' : 'All looks good.'}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-5 py-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="text-center mb-8"
      >
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
          isHighProtein 
            ? 'bg-gradient-to-br from-red-400 to-red-600' 
            : 'bg-gradient-to-br from-green-400 to-green-600'
        }`}>
          {isHighProtein ? (
            <AlertTriangle className="w-12 h-12 text-white" />
          ) : (
            <CheckCircle className="w-12 h-12 text-white" />
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('result')}
        </h1>
      </motion.div>

      {/* Result Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 mb-6"
      >
        <div className="text-center mb-6">
          <p className="text-sm text-gray-500 mb-2">{t('protein_level')}</p>
          <div className="flex justify-center">
            <ProteinLevelBadge 
              level={result.protein_level} 
              language={language}
              showDescription
              size="lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500">{t('confidence')}</p>
            <p className="text-2xl font-bold text-gray-900">
              {Math.round(result.confidence * 100)}%
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500">
              {language === 'hi' ? 'समय' : 'Time'}
            </p>
            <p className="text-lg font-bold text-gray-900">
              {new Date().toLocaleTimeString(language === 'hi' ? 'hi-IN' : 'en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
        </div>

        {/* Pad readings */}
        {result.pads_json && result.pads_json.length > 0 && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">
              {language === 'hi' ? 'विस्तृत रीडिंग' : 'Detailed Readings'}
            </p>
            <div className="space-y-2">
              {result.pads_json.map((pad, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                  <span className="text-gray-600">{pad.pad_name}</span>
                  <span className="font-medium text-gray-900">{pad.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Alert message */}
      {isHighProtein && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-red-50 rounded-2xl p-4 mb-6 border border-red-100"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">
              {t('high_protein_alert')}
            </p>
          </div>
        </motion.div>
      )}

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="space-y-3"
      >
        <Link to="/TodaysTasks">
          <Button className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-lg font-medium shadow-lg shadow-blue-200">
            <Home className="w-5 h-5 mr-2" />
            {t('go_to_dashboard')}
          </Button>
        </Link>

        <Button variant="outline" onClick={shareWhatsApp} className="w-full h-14 rounded-2xl text-green-700 border-green-300 hover:bg-green-50">
          <Share2 className="w-5 h-5 mr-2" />
          {t('whatsapp_share')}
        </Button>
        
        <Button variant="outline" onClick={onRetake} className="w-full h-14 rounded-2xl text-gray-700">
          <RotateCcw className="w-5 h-5 mr-2" />
          {language === 'hi' ? 'फिर से जाँच करें' : 'Retake Test'}
        </Button>
      </motion.div>
    </div>
  );
}
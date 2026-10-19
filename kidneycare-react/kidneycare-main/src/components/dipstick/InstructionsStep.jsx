import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useLanguage } from '../shared/LanguageContext';

export default function InstructionsStep({ onStart }) {
  const { t, language } = useLanguage();

  const instructions = [
    { titleKey: 'step1_title', descKey: 'step1_desc', icon: '💧' },
    { titleKey: 'step2_title', descKey: 'step2_desc', icon: '🧪' },
    { titleKey: 'step3_title', descKey: 'step3_desc', icon: '⏱️' },
    { titleKey: 'step4_title', descKey: 'step4_desc', icon: '🖐️' },
    { titleKey: 'step5_title', descKey: 'step5_desc', icon: '⏲️' },
    { titleKey: 'step6_title', descKey: 'step6_desc', icon: '👁️' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-5 py-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t('dipstick_instructions_title')}
        </h1>
        <p className="text-gray-500">
          {language === 'hi' 
            ? 'कृपया इन निर्देशों का पालन करें' 
            : 'Please follow these instructions carefully'}
        </p>
      </motion.div>

      <div className="space-y-4 mb-8">
        {instructions.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-start gap-4"
          >
            <span className="text-2xl">{item.icon}</span>
            <div className="flex-1">
              <p className="font-semibold text-gray-800 text-sm mb-0.5">{t(item.titleKey)}</p>
              <p className="text-gray-600 text-sm">{t(item.descKey)}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-amber-50 rounded-2xl p-4 mb-8 border border-amber-100"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            {language === 'hi' 
              ? 'सुनिश्चित करें कि अच्छी रोशनी में फोटो लें।' 
              : 'Make sure to take photos in good lighting.'}
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <Button
          onClick={onStart}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-lg font-medium shadow-lg shadow-blue-200"
        >
          {t('start_test')}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}
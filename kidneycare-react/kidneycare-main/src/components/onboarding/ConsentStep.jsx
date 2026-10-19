import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Check } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from '../shared/LanguageContext';

export default function ConsentStep({ consented, onConsent }) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('consent_title')}</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-sm"
      >
        <div className="bg-gray-50 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <p className="text-gray-700 leading-relaxed">
                {t('consent_text')}
              </p>
            </div>
          </div>
        </div>

        <label
          className={`flex items-center gap-4 p-5 rounded-xl cursor-pointer transition-all duration-300 border-2 ${
            consented
              ? 'border-green-500 bg-green-50/50 shadow-lg shadow-green-100'
              : 'border-gray-200 hover:border-green-200'
          }`}
          onClick={() => onConsent(!consented)}
        >
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
            consented ? 'bg-green-500' : 'bg-gray-200'
          }`}>
            {consented && <Check className="w-5 h-5 text-white" />}
          </div>
          <span className="font-medium text-gray-700">
            {consented ? (
              <span className="text-green-700">✓ {t('consent_title')}</span>
            ) : (
              t('consent_title')
            )}
          </span>
        </label>

        {!consented && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-amber-600 mt-4 text-center"
          >
            {t('consent_required')}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
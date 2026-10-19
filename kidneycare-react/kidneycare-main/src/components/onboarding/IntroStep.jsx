import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useLanguage } from '../shared/LanguageContext';

export default function IntroStep({ onComplete }) {
  const { t, language } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      {/* Animated Assistant */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", duration: 1 }}
        className="relative mb-8"
      >
        <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-xl shadow-blue-200">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Heart className="w-16 h-16 text-white" />
          </motion.div>
        </div>
        
        {/* Floating sparkles */}
        <motion.div
          className="absolute -top-2 -right-2"
          animate={{ 
            y: [0, -5, 0],
            rotate: [0, 10, 0]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="w-8 h-8 text-yellow-400" />
        </motion.div>
        
        <motion.div
          className="absolute -bottom-1 -left-3"
          animate={{ 
            y: [0, 5, 0],
            rotate: [0, -10, 0]
          }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <Sparkles className="w-6 h-6 text-pink-400" />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-4 mb-10"
      >
        <h1 className="text-3xl font-bold text-gray-900">
          {language === 'hi' ? 'नमस्ते!' : 'Hello!'}
        </h1>
        
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 max-w-sm">
          <p className="text-lg text-gray-700 leading-relaxed">
            {t('assistant_intro')}
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <Button
          onClick={onComplete}
          size="lg"
          className="h-14 px-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-200 text-lg font-medium"
        >
          {t('go_to_dashboard') || 'Go to Dashboard'}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>

      {/* Background decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-10 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-1/4 right-10 w-40 h-40 bg-pink-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-48 h-48 bg-purple-100 rounded-full blur-3xl opacity-30" />
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { LanguageProvider, useLanguage } from '../components/shared/LanguageContext';
import { ThemeProvider } from '../components/shared/ThemeContext';
import InstructionsStep from '../components/dipstick/InstructionsStep';
import UploadStep from '../components/dipstick/UploadStep';
import ResultStep from '../components/dipstick/ResultStep';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

function DipstickTestContent() {
  const { t, language } = useLanguage();
  const [step, setStep] = useState('instructions');
  const [result, setResult] = useState(null);

  // Fetch patient
  const { data: patient, isLoading } = useQuery({
    queryKey: ['currentPatient'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const patients = await base44.entities.Patient.filter({ created_by: user.email });
      return patients[0];
    }
  });

  const handleComplete = (resultData) => {
    setResult(resultData);
    setStep('result');
  };

  const handleRetake = () => {
    setStep('instructions');
    setResult(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-50">
        <Link to="/Dashboard">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="font-semibold text-gray-900">{t('urine_test')}</h1>
      </div>

      {/* Progress */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex gap-2">
          {['instructions', 'upload', 'result'].map((s, idx) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                ['instructions', 'upload', 'result'].indexOf(step) >= idx
                  ? 'bg-blue-500'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          {step === 'instructions' && (
            <InstructionsStep onStart={() => setStep('upload')} />
          )}
          {step === 'upload' && (
            <UploadStep 
              patientId={patient?.id}
              onComplete={handleComplete} 
            />
          )}
          {step === 'result' && result && (
            <ResultStep 
              result={result}
              onRetake={handleRetake}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function DipstickTest() {
  return <DipstickTestContent />;
}
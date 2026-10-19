import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Check } from 'lucide-react';
import { Card } from "@/components/ui/card";

export default function LanguageStep({ selectedLanguage, onSelect }) {
  const languages = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Globe className="w-10 h-10 text-blue-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Select Your Language</h1>
        <p className="text-gray-500">अपनी भाषा चुनें</p>
      </motion.div>

      <div className="w-full max-w-sm space-y-4">
        {languages.map((lang, idx) => (
          <motion.div
            key={lang.code}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card
              className={`p-5 cursor-pointer transition-all duration-300 border-2 ${
                selectedLanguage === lang.code
                  ? 'border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-100'
                  : 'border-gray-100 hover:border-blue-200 hover:shadow-md'
              }`}
              onClick={() => onSelect(lang.code)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{lang.flag}</span>
                  <div>
                    <p className="font-semibold text-gray-900">{lang.name}</p>
                    <p className="text-sm text-gray-500">{lang.nativeName}</p>
                  </div>
                </div>
                {selectedLanguage === lang.code && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center"
                  >
                    <Check className="w-5 h-5 text-white" />
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
import React from 'react';
import { cn } from "@/lib/utils";

const levelColors = {
  'Negative': 'bg-green-100 text-green-700 border-green-200',
  'Trace': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  '1+': 'bg-orange-100 text-orange-700 border-orange-200',
  '2+': 'bg-red-100 text-red-700 border-red-200',
  '3+': 'bg-red-200 text-red-800 border-red-300',
  '4+': 'bg-red-300 text-red-900 border-red-400',
};

const levelDescriptions = {
  en: {
    'Negative': 'Normal',
    'Trace': 'Trace Amount',
    '1+': 'Mild',
    '2+': 'Moderate - Alert',
    '3+': 'High - Alert',
    '4+': 'Very High - Urgent',
  },
  hi: {
    'Negative': 'सामान्य',
    'Trace': 'थोड़ी मात्रा',
    '1+': 'हल्का',
    '2+': 'मध्यम - सतर्क',
    '3+': 'उच्च - सतर्क',
    '4+': 'बहुत उच्च - तत्काल',
  }
};

export default function ProteinLevelBadge({ level, language = 'en', showDescription = false, size = 'md' }) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <span
        className={cn(
          "font-semibold rounded-full border inline-block",
          levelColors[level] || 'bg-gray-100 text-gray-700 border-gray-200',
          sizeClasses[size]
        )}
      >
        {level}
      </span>
      {showDescription && levelDescriptions[language]?.[level] && (
        <span className="text-xs text-gray-500">
          {levelDescriptions[language][level]}
        </span>
      )}
    </div>
  );
}
import React from 'react';
import { LanguageProvider, useLanguage } from './components/shared/LanguageContext';
import { ThemeProvider } from './components/shared/ThemeContext';
import { Link, useLocation } from 'react-router-dom';
import { Home, TestTube, Camera, Utensils, Stethoscope, Bell, History } from 'lucide-react';
import { useUserRole } from './context/UserRoleContext';

function BottomNav({ currentPageName }) {
  const location = useLocation();
  const currentPath = location.pathname.toLowerCase();
  const { isClinician, isNutrition } = useUserRole();
  const { language } = useLanguage();
  const hi = language === 'hi';

  // Standalone Nutrition App has its own self-contained navigation tabs
  const isStandaloneNutrition = typeof window !== 'undefined' && window.KIDNEYCARE_APP_FLAVOR === 'nutrition';
  if (isStandaloneNutrition) {
    return null;
  }

  // Dedicated Caregiver Navigation — Purely patient & home monitoring
  const CAREGIVER_NAV_ITEMS = [
    { name: 'Dashboard', path: '/Dashboard', labelEn: 'Home', labelHi: 'होम', icon: Home },
    { name: 'DipstickTest', path: '/DipstickTest', labelEn: 'Urine Test', labelHi: 'मूत्र जाँच', icon: TestTube },
    { name: 'DocScanner', path: '/DocScanner', labelEn: 'Doc Scanner', labelHi: 'स्कैनर', icon: Camera, highlight: true },
    { name: 'NutritionHub', path: '/NutritionHub', labelEn: 'Diet', labelHi: 'डाइट', icon: Utensils },
    { name: 'Itihaas', path: '/Itihaas', labelEn: 'History', labelHi: 'इतिहास', icon: History }
  ];

  // Dedicated Clinician Navigation — Purely OPD & hospital clinic
  const CLINICIAN_NAV_ITEMS = [
    { name: 'OPDWorkstation', path: '/OPDWorkstation', labelEn: 'OPD Queue', labelHi: 'ओपीडी', icon: Stethoscope },
    { name: 'DocScanner', path: '/DocScanner', labelEn: 'Doc Scanner', labelHi: 'स्कैनर', icon: Camera, highlight: true },
    { name: 'NutritionHub', path: '/NutritionHub', labelEn: 'PRINT Diet', labelHi: 'डाइट', icon: Utensils },
    { name: 'ClinicianDashboard', path: '/ClinicianDashboard', labelEn: 'Alerts', labelHi: 'अलर्ट', icon: Bell }
  ];

  const navItems = isClinician ? CLINICIAN_NAV_ITEMS : CAREGIVER_NAV_ITEMS;

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-50 py-1.5 px-3 shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            currentPath === item.path.toLowerCase() ||
            currentPageName === item.name ||
            (item.name === 'Dashboard' && (currentPath === '/' || currentPath === '/home'));
          const Icon = item.icon;
          const label = hi ? item.labelHi : item.labelEn;

          if (item.highlight) {
            return (
              <Link
                key={item.name}
                to={item.path}
                className="flex flex-col items-center relative -top-3 group"
              >
                <div className={`w-12 h-12 rounded-full text-white flex items-center justify-center shadow-lg group-active:scale-95 transition-transform border-2 border-white ${
                  isClinician ? 'bg-indigo-600 shadow-indigo-500/30' : 'bg-blue-600 shadow-blue-500/30'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold mt-0.5 ${isClinician ? 'text-indigo-700' : 'text-blue-700'}`}>
                  {label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? isClinician ? 'text-indigo-600 font-bold' : 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] mt-0.5 leading-tight">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function Layout({ children, currentPageName }) {
  const noNavPages = ['Onboarding'];
  const showNav = !noNavPages.includes(currentPageName);

  return (
    <>
      <style>{`
        :root {
          --color-primary: #2563eb;
          --color-primary-dark: #1d4ed8;
          --color-secondary: #64748b;
          --color-background: #f8fafc;
          --color-surface: #ffffff;
          --color-text: #0f172a;
        }
        
        body {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          background-color: var(--color-background);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-size: 15px;
          letter-spacing: -0.01em;
        }

        /* Enhanced Mobile Card Typography & Legibility */
        .text-xs {
          font-size: 0.8125rem !important; /* 13px */
          line-height: 1.25rem !important;
        }
        .text-\[10px\] {
          font-size: 0.72rem !important; /* ~11.5px */
          line-height: 1rem !important;
        }
        .text-\[9px\] {
          font-size: 0.68rem !important; /* ~11px */
          line-height: 0.95rem !important;
        }

        * {
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
      
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
        {children}
        {showNav && <BottomNav currentPageName={currentPageName} />}
      </div>
    </>
  );
}
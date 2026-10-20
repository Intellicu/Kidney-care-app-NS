import React, { Component } from 'react';
import './App.css';
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from '@tanstack/react-query'
import OfflineBanner from '@/components/shared/OfflineBanner'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { HashRouter as Router, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { UserRoleProvider, useUserRole } from './context/UserRoleContext';
import { LanguageProvider } from '@/components/shared/LanguageContext';
import { ThemeProvider } from '@/components/shared/ThemeContext';

// Eagerly import subpages for 100% reliable offline mobile navigation with zero dynamic chunk fetch failures
import MonthlyReport from './pages/MonthlyReport';
import DailyCheckin from './pages/DailyCheckin';
import GrowthTracking from './pages/GrowthTracking';
import DoctorSummary from './pages/DoctorSummary';
import NephroBot from './pages/NephroBot';
import NutritionHub from './pages/NutritionHub';
import Itihaas from './pages/Itihaas';
import PatientQR from './pages/PatientQR';
import OPDWorkstation from './pages/OPDWorkstation';
import AppPortal from './pages/AppPortal';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

// Isolated page error boundary to prevent full-app crash if a sub-tab encounters an issue
class PageErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('PageErrorBoundary caught error in page:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 max-w-md mx-auto my-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
            ⚠️
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">Module Temporarily Unavailable</h3>
          <p className="text-xs text-slate-500 mb-4">
            {this.state.error?.message || 'A minor error occurred while displaying this section.'}
          </p>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl active:scale-95 transition-transform"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.hash = '#/Dashboard';
                this.setState({ hasError: false, error: null });
              }}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl active:scale-95 transition-transform"
            >
              Return Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const LayoutWrapper = ({ children, currentPageName }) => {
  const content = (
    <PageErrorBoundary>
      {children}
    </PageErrorBoundary>
  );

  return Layout ? (
    <Layout currentPageName={currentPageName}>
      {content}
    </Layout>
  ) : (
    content
  );
};

function RootRedirector() {
  const { isClinician, isNutrition } = useUserRole();

  if (typeof window !== 'undefined' && window.KIDNEYCARE_APP_FLAVOR === 'nutrition') {
    return (
      <LayoutWrapper currentPageName="NutritionHub">
        <NutritionHub isStandalone={true} />
      </LayoutWrapper>
    );
  }

  if (typeof window !== 'undefined' && window.KIDNEYCARE_APP_FLAVOR === 'clinician') {
    return (
      <LayoutWrapper currentPageName="OPDWorkstation">
        <OPDWorkstation />
      </LayoutWrapper>
    );
  }

  if (typeof window !== 'undefined' && window.KIDNEYCARE_APP_FLAVOR === 'caregiver') {
    return (
      <LayoutWrapper currentPageName={mainPageKey}>
        <MainPage />
      </LayoutWrapper>
    );
  }

  const selectedApp = typeof localStorage !== 'undefined' ? localStorage.getItem('kidneycare_selected_app') : null;
  if (!selectedApp) {
    return (
      <LayoutWrapper currentPageName="AppPortal">
        <AppPortal />
      </LayoutWrapper>
    );
  }
  if (selectedApp === 'nutrition' || isNutrition) {
    return (
      <LayoutWrapper currentPageName="NutritionHub">
        <NutritionHub isStandalone={true} />
      </LayoutWrapper>
    );
  }
  if (selectedApp === 'clinician' || isClinician) {
    return (
      <LayoutWrapper currentPageName="OPDWorkstation">
        <OPDWorkstation />
      </LayoutWrapper>
    );
  }
  return (
    <LayoutWrapper currentPageName={mainPageKey}>
      <MainPage />
    </LayoutWrapper>
  );
}

function CaregiverView() {
  const { setRole } = useUserRole();
  React.useEffect(() => {
    setRole('caregiver');
    if (typeof localStorage !== 'undefined') localStorage.setItem('kidneycare_selected_app', 'caregiver');
  }, []);
  return (
    <LayoutWrapper currentPageName="Dashboard">
      <MainPage />
    </LayoutWrapper>
  );
}

function ClinicianView() {
  const { setRole } = useUserRole();
  React.useEffect(() => {
    setRole('clinician');
    if (typeof localStorage !== 'undefined') localStorage.setItem('kidneycare_selected_app', 'clinician');
  }, []);
  return (
    <LayoutWrapper currentPageName="OPDWorkstation">
      <OPDWorkstation />
    </LayoutWrapper>
  );
}

function NutritionView() {
  const { setRole } = useUserRole();
  const isNutritionFlavor = typeof window !== 'undefined' && window.KIDNEYCARE_APP_FLAVOR === 'nutrition';

  React.useEffect(() => {
    if (isNutritionFlavor) {
      setRole('nutrition');
      if (typeof localStorage !== 'undefined') localStorage.setItem('kidneycare_selected_app', 'nutrition');
    }
  }, [isNutritionFlavor]);

  return (
    <LayoutWrapper currentPageName="NutritionHub">
      <NutritionHub isStandalone={isNutritionFlavor} />
    </LayoutWrapper>
  );
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  // Render the main app routes with case-insensitive route mappings
  return (
    <Routes>
      <Route path="/" element={<RootRedirector />} />
      <Route path="/home" element={<LayoutWrapper currentPageName="Dashboard"><MainPage /></LayoutWrapper>} />
      <Route path="/Home" element={<LayoutWrapper currentPageName="Dashboard"><MainPage /></LayoutWrapper>} />
      <Route path="/Dashboard" element={<LayoutWrapper currentPageName="Dashboard"><MainPage /></LayoutWrapper>} />
      <Route path="/dashboard" element={<LayoutWrapper currentPageName="Dashboard"><MainPage /></LayoutWrapper>} />

      <Route path="/portal" element={<LayoutWrapper currentPageName="AppPortal"><AppPortal /></LayoutWrapper>} />
      <Route path="/Portal" element={<LayoutWrapper currentPageName="AppPortal"><AppPortal /></LayoutWrapper>} />
      <Route path="/AppPortal" element={<LayoutWrapper currentPageName="AppPortal"><AppPortal /></LayoutWrapper>} />

      <Route path="/caregiver" element={<CaregiverView />} />
      <Route path="/clinician" element={<ClinicianView />} />
      <Route path="/nutrition" element={<NutritionView />} />
      <Route path="/Nutrition" element={<NutritionView />} />
      <Route path="/NutritionApp" element={<NutritionView />} />
      <Route path="/diet" element={<NutritionView />} />
      <Route path="/Diet" element={<NutritionView />} />
      <Route path="/NutritionHub" element={<NutritionView />} />
      <Route path="/nutritionhub" element={<NutritionView />} />

      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}

      {/* Aliases for case-insensitive mobile URL navigation */}
      <Route path="/docscanner" element={<LayoutWrapper currentPageName="DocScanner"><Pages.DocScanner /></LayoutWrapper>} />
      <Route path="/dailylog" element={<LayoutWrapper currentPageName="DailyLog"><Pages.DailyLog /></LayoutWrapper>} />
      <Route path="/dipsticktest" element={<LayoutWrapper currentPageName="DipstickTest"><Pages.DipstickTest /></LayoutWrapper>} />
      <Route path="/medications" element={<LayoutWrapper currentPageName="Medications"><Pages.Medications /></LayoutWrapper>} />
      <Route path="/appointments" element={<LayoutWrapper currentPageName="Appointments"><Pages.Appointments /></LayoutWrapper>} />
      <Route path="/education" element={<LayoutWrapper currentPageName="Education"><Pages.Education /></LayoutWrapper>} />
      <Route path="/healthmetrics" element={<LayoutWrapper currentPageName="HealthMetrics"><Pages.HealthMetrics /></LayoutWrapper>} />
      <Route path="/healthrecords" element={<LayoutWrapper currentPageName="HealthRecords"><Pages.HealthRecords /></LayoutWrapper>} />
      <Route path="/reminders" element={<LayoutWrapper currentPageName="Reminders"><Pages.Reminders /></LayoutWrapper>} />
      <Route path="/symptomchecker" element={<LayoutWrapper currentPageName="SymptomChecker"><Pages.SymptomChecker /></LayoutWrapper>} />

      <Route path="/MonthlyReport" element={<LayoutWrapper currentPageName="MonthlyReport"><MonthlyReport /></LayoutWrapper>} />
      <Route path="/monthlyreport" element={<LayoutWrapper currentPageName="MonthlyReport"><MonthlyReport /></LayoutWrapper>} />

      <Route path="/DailyCheckin" element={<LayoutWrapper currentPageName="DailyCheckin"><DailyCheckin /></LayoutWrapper>} />
      <Route path="/dailycheckin" element={<LayoutWrapper currentPageName="DailyCheckin"><DailyCheckin /></LayoutWrapper>} />

      <Route path="/GrowthTracking" element={<LayoutWrapper currentPageName="GrowthTracking"><GrowthTracking /></LayoutWrapper>} />
      <Route path="/growthtracking" element={<LayoutWrapper currentPageName="GrowthTracking"><GrowthTracking /></LayoutWrapper>} />

      <Route path="/DoctorSummary" element={<LayoutWrapper currentPageName="DoctorSummary"><DoctorSummary /></LayoutWrapper>} />
      <Route path="/doctorsummary" element={<LayoutWrapper currentPageName="DoctorSummary"><DoctorSummary /></LayoutWrapper>} />

      <Route path="/NephroBot" element={<LayoutWrapper currentPageName="NephroBot"><NephroBot /></LayoutWrapper>} />
      <Route path="/nephrobot" element={<LayoutWrapper currentPageName="NephroBot"><NephroBot /></LayoutWrapper>} />

      <Route path="/OPDWorkstation" element={<LayoutWrapper currentPageName="OPDWorkstation"><OPDWorkstation /></LayoutWrapper>} />
      <Route path="/opdworkstation" element={<LayoutWrapper currentPageName="OPDWorkstation"><OPDWorkstation /></LayoutWrapper>} />

      <Route path="/Itihaas" element={<LayoutWrapper currentPageName="Itihaas"><Itihaas /></LayoutWrapper>} />
      <Route path="/itihaas" element={<LayoutWrapper currentPageName="Itihaas"><Itihaas /></LayoutWrapper>} />

      <Route path="/PatientQR" element={<LayoutWrapper currentPageName="PatientQR"><PatientQR /></LayoutWrapper>} />
      <Route path="/patientqr" element={<LayoutWrapper currentPageName="PatientQR"><PatientQR /></LayoutWrapper>} />

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('AppErrorBoundary caught:', error, errorInfo);
    this.setState({ errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 text-2xl font-bold">
            🏥
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">KidneyCare AI — AIIMS Patna</h2>
          <p className="text-xs text-slate-600 mb-3 max-w-sm">
            {this.state.error?.message || 'A temporary issue occurred while rendering this page.'}
          </p>
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.hash = '#/Dashboard';
              }}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-md active:scale-95 transition-all"
            >
              Go to Dashboard
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof localStorage !== 'undefined') localStorage.clear();
                window.location.hash = '#/Dashboard';
                window.location.reload();
              }}
              className="px-4 py-2 bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl shadow-xs active:scale-95 transition-all"
            >
              Clear Cache & Reset
            </button>
          </div>
          {this.state.error?.stack && (
            <details className="text-[10px] text-slate-400 max-w-xs text-left bg-white p-2 rounded border border-slate-200 overflow-x-auto">
              <summary className="cursor-pointer font-bold text-slate-600">Technical Details</summary>
              <pre className="mt-1 whitespace-pre-wrap">{String(this.state.error.stack).slice(0, 300)}</pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

// Mobile & Hardware Back Button Navigation Handler
function GlobalBackHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    let unlisten = null;
    if (window.Capacitor?.isPluginAvailable?.('App')) {
      const { App: CapApp } = window.Capacitor.Plugins;
      CapApp.addListener('backButton', () => {
        const currentHash = window.location.hash;
        if (
          currentHash === '#/Dashboard' ||
          currentHash === '#/' ||
          currentHash === '#/OPDWorkstation' ||
          currentHash === ''
        ) {
          CapApp.exitApp();
        } else {
          window.history.back();
        }
      }).then(u => { unlisten = u; });
    }

    return () => {
      if (unlisten && typeof unlisten.remove === 'function') unlisten.remove();
    };
  }, [navigate, location]);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <UserRoleProvider>
          <ThemeProvider>
            <LanguageProvider>
              <AppErrorBoundary>
                <OfflineBanner />
                <Router>
                  <GlobalBackHandler />
                  <AuthenticatedApp />
                </Router>
                <Toaster />
              </AppErrorBoundary>
            </LanguageProvider>
          </ThemeProvider>
        </UserRoleProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;

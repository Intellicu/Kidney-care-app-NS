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

// Code-split heavy subpages for instant mobile initial load
const MonthlyReport = React.lazy(() => import('./pages/MonthlyReport'));
const DailyCheckin = React.lazy(() => import('./pages/DailyCheckin'));
const GrowthTracking = React.lazy(() => import('./pages/GrowthTracking'));
const DoctorSummary = React.lazy(() => import('./pages/DoctorSummary'));
const NephroBot = React.lazy(() => import('./pages/NephroBot'));
const NutritionHub = React.lazy(() => import('./pages/NutritionHub'));
const Itihaas = React.lazy(() => import('./pages/Itihaas'));
const PatientQR = React.lazy(() => import('./pages/PatientQR'));
const OPDWorkstation = React.lazy(() => import('./pages/OPDWorkstation'));
const AppPortal = React.lazy(() => import('./pages/AppPortal'));

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

function PageFallback() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-xs font-bold text-slate-500">Loading module...</p>
    </div>
  );
}

const LayoutWrapper = ({ children, currentPageName }) => Layout ? (
  <Layout currentPageName={currentPageName}>
    <React.Suspense fallback={<PageFallback />}>
      {children}
    </React.Suspense>
  </Layout>
) : (
  <React.Suspense fallback={<PageFallback />}>
    {children}
  </React.Suspense>
);

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

  const selectedApp = localStorage.getItem('kidneycare_selected_app');
  if (!selectedApp) {
    return (
      <React.Suspense fallback={<PageFallback />}>
        <AppPortal />
      </React.Suspense>
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
    localStorage.setItem('kidneycare_selected_app', 'caregiver');
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
    localStorage.setItem('kidneycare_selected_app', 'clinician');
  }, []);
  return (
    <LayoutWrapper currentPageName="OPDWorkstation">
      <OPDWorkstation />
    </LayoutWrapper>
  );
}

function NutritionView() {
  const { setRole } = useUserRole();
  React.useEffect(() => {
    setRole('nutrition');
    localStorage.setItem('kidneycare_selected_app', 'nutrition');
  }, []);
  return (
    <LayoutWrapper currentPageName="NutritionHub">
      <NutritionHub isStandalone={true} />
    </LayoutWrapper>
  );
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();

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
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<RootRedirector />} />
      <Route path="/portal" element={<AppPortal />} />
      <Route path="/caregiver" element={<CaregiverView />} />
      <Route path="/clinician" element={<ClinicianView />} />
      <Route path="/nutrition" element={<NutritionView />} />
      <Route path="/Nutrition" element={<NutritionView />} />
      <Route path="/NutritionApp" element={<NutritionView />} />
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
      <Route path="/MonthlyReport" element={<LayoutWrapper currentPageName="MonthlyReport"><MonthlyReport /></LayoutWrapper>} />
      <Route path="/DailyCheckin" element={<LayoutWrapper currentPageName="DailyCheckin"><DailyCheckin /></LayoutWrapper>} />
      <Route path="/GrowthTracking" element={<LayoutWrapper currentPageName="GrowthTracking"><GrowthTracking /></LayoutWrapper>} />
      <Route path="/DoctorSummary" element={<LayoutWrapper currentPageName="DoctorSummary"><DoctorSummary /></LayoutWrapper>} />
      <Route path="/NephroBot" element={<LayoutWrapper currentPageName="NephroBot"><NephroBot /></LayoutWrapper>} />
      <Route path="/NutritionHub" element={<NutritionView />} />
      <Route path="/OPDWorkstation" element={<LayoutWrapper currentPageName="OPDWorkstation"><OPDWorkstation /></LayoutWrapper>} />
      <Route path="/Itihaas" element={<LayoutWrapper currentPageName="Itihaas"><Itihaas /></LayoutWrapper>} />
      <Route path="/PatientQR" element={<LayoutWrapper currentPageName="PatientQR"><PatientQR /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('AppErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 text-2xl font-bold">
            🏥
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">KidneyCare AI — AIIMS Patna</h2>
          <p className="text-xs text-slate-600 mb-4 max-w-sm">
            A temporary issue occurred while rendering this page.
          </p>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.hash = '#/Dashboard';
              window.location.reload();
            }}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-md"
          >
            Reset to Dashboard
          </button>
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
    // Capacitor App backButton plugin support if available
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
          <AppErrorBoundary>
            <OfflineBanner />
            <Router>
              <GlobalBackHandler />
              <AuthenticatedApp />
            </Router>
            <Toaster />
          </AppErrorBoundary>
        </UserRoleProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
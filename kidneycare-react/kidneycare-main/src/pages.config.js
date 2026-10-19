import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import DipstickTest from './pages/DipstickTest';
import SymptomChecker from './pages/SymptomChecker';
import HealthMetrics from './pages/HealthMetrics';
import Medications from './pages/Medications';
import Education from './pages/Education';
import Reminders from './pages/Reminders';
import ClinicianDashboard from './pages/ClinicianDashboard';
import PatientDetail from './pages/PatientDetail';
import Home from './pages/Home';
import DailyLog from './pages/DailyLog.jsx';
import HealthRecords from './pages/HealthRecords';
import Appointments from './pages/Appointments';
import Telemedicine from './pages/Telemedicine';
import ClinicianHealthRecords from './pages/ClinicianHealthRecords';
import TodaysTasks from './pages/TodaysTasks';
import MonthlyReport from './pages/MonthlyReport';
import DocScanner from './pages/DocScanner';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Onboarding": Onboarding,
    "Dashboard": Dashboard,
    "DipstickTest": DipstickTest,
    "SymptomChecker": SymptomChecker,
    "HealthMetrics": HealthMetrics,
    "Medications": Medications,
    "Education": Education,
    "Reminders": Reminders,
    "ClinicianDashboard": ClinicianDashboard,
    "PatientDetail": PatientDetail,
    "Home": Home,
    "DailyLog": DailyLog,
    "HealthRecords": HealthRecords,
    "DocScanner": DocScanner,
    "Appointments": Appointments,
    "Telemedicine": Telemedicine,
    "ClinicianHealthRecords": ClinicianHealthRecords,
    "TodaysTasks": TodaysTasks,
    "MonthlyReport": MonthlyReport,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
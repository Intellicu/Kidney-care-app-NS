import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

const DEFAULT_USERS = {
  clinician: {
    id: 'doc_aiims_001',
    email: 'pediatrics@aiimspatna.edu.in',
    name: 'Dr. AIIMS Pediatric Nephrology',
    role: 'clinician',
    department: 'Department of Pediatrics, AIIMS Patna',
    cr_number: 'CR-2024098273'
  },
  patient: {
    id: 'pat_aiims_001',
    email: 'caregiver.aarav@example.com',
    name: 'Aarav Sharma (Caregiver: Priya)',
    role: 'patient',
    cr_number: '2024098273',
    age: 5,
    gender: 'Male',
    diagnosis: 'Steroid-Sensitive Nephrotic Syndrome (SSNS)'
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('kidneycare_current_user');
    return saved ? JSON.parse(saved) : DEFAULT_USERS.clinician;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState({
    id: 'aiims-patna-kidneycare',
    public_settings: { offline_mode: true, institute: 'AIIMS Patna' }
  });

  useEffect(() => {
    // Sync current user to local client
    if (user) {
      localStorage.setItem('kidneycare_current_user', JSON.stringify(user));
    }
  }, [user]);

  const switchRole = (role) => {
    const newUser = role === 'patient' ? DEFAULT_USERS.patient : DEFAULT_USERS.clinician;
    setUser(newUser);
    localStorage.setItem('kidneycare_current_user', JSON.stringify(newUser));
  };

  const logout = (shouldRedirect = false) => {
    // In local mode, simply toggle or reset user
    setUser(DEFAULT_USERS.patient);
  };

  const navigateToLogin = () => {
    setIsAuthenticated(true);
  };

  const checkAppState = async () => {
    setIsLoadingPublicSettings(false);
    setIsLoadingAuth(false);
    setIsAuthenticated(true);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState,
      switchRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

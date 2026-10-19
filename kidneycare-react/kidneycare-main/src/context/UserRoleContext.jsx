import React, { createContext, useContext, useState, useEffect } from 'react';

const UserRoleContext = createContext();

export function UserRoleProvider({ children }) {
  // 'caregiver' | 'clinician' | 'nutrition'
  const [role, setRoleState] = useState(() => {
    if (typeof window !== 'undefined' && window.KIDNEYCARE_APP_FLAVOR === 'clinician') {
      return 'clinician';
    }
    if (typeof window !== 'undefined' && window.KIDNEYCARE_APP_FLAVOR === 'nutrition') {
      return 'nutrition';
    }
    if (typeof window !== 'undefined' && window.KIDNEYCARE_APP_FLAVOR === 'caregiver') {
      return 'caregiver';
    }
    return localStorage.getItem('kc_user_role') || 'caregiver';
  });

  // Active patient CR number for OPD/Clinic session
  const [activePatientCr, setActivePatientCrState] = useState(() => {
    return localStorage.getItem('kc_active_patient_cr') || 'AIIMS/PED/2026/0412';
  });

  const setRole = (newRole) => {
    setRoleState(newRole);
    localStorage.setItem('kc_user_role', newRole);
  };

  const setActivePatientCr = (cr) => {
    setActivePatientCrState(cr);
    localStorage.setItem('kc_active_patient_cr', cr);
  };

  const toggleRole = () => {
    setRole(role === 'caregiver' ? 'clinician' : 'caregiver');
  };

  return (
    <UserRoleContext.Provider
      value={{
        role,
        setRole,
        toggleRole,
        isClinician: role === 'clinician',
        isCaregiver: role === 'caregiver',
        isNutrition: role === 'nutrition',
        activePatientCr,
        setActivePatientCr
      }}
    >
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  const context = useContext(UserRoleContext);
  if (!context) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
}

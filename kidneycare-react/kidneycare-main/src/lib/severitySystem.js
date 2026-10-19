export const SEVERITY_LEVELS = {
  EMERGENCY: 'emergency',
  URGENT: 'urgent',
  WARNING: 'warning',
  INFO: 'info',
};

export const SEVERITY_CONFIG = {
  emergency: {
    label: '🔴 EMERGENCY',
    icon: '🔴',
    bgColor: '#fecaca',
    borderColor: '#dc2626',
    textColor: '#991b1b',
    badgeBg: '#fecaca',
    badgeText: '#991b1b',
  },
  urgent: {
    label: '🟠 URGENT',
    icon: '🟠',
    bgColor: '#fed7aa',
    borderColor: '#f97316',
    textColor: '#c2410c',
    badgeBg: '#fed7aa',
    badgeText: '#c2410c',
  },
  warning: {
    label: '🟡 WARNING',
    icon: '🟡',
    bgColor: '#fef08a',
    borderColor: '#eab308',
    textColor: '#b45309',
    badgeBg: '#fef08a',
    badgeText: '#b45309',
  },
  info: {
    label: '🔵 INFO',
    icon: '🔵',
    bgColor: '#bfdbfe',
    borderColor: '#3b82f6',
    textColor: '#1e3a8a',
    badgeBg: '#bfdbfe',
    badgeText: '#1e3a8a',
  },
};

export const ALERT_RULES = {
  vitals: {
    bp_systolic_emergency: 180,
    bp_systolic_urgent: 140,
    bp_diastolic_emergency: 120,
    bp_diastolic_urgent: 90,
    hr_emergency_high: 150,
    hr_urgent_high: 120,
    hr_emergency_low: 40,
    hr_urgent_low: 60,
    rr_emergency: 30,
    rr_urgent: 25,
  },
  labs: {
    creatinine_emergency: 3.0,
    creatinine_urgent: 1.5,
    egfr_emergency: 15,
    egfr_urgent: 30,
    potassium_emergency_high: 6.5,
    potassium_urgent_high: 5.5,
    potassium_emergency_low: 2.5,
    potassium_urgent_low: 3.0,
    sodium_emergency: 120,
    sodium_urgent: 130,
  },
  proteinuria: {
    emergency: 3.0,
    urgent: 1.0,
    warning: 0.3,
  },
};

export function classifySeverity(findingType, value) {
  if (findingType === 'bp_systolic') {
    if (value >= ALERT_RULES.vitals.bp_systolic_emergency) return SEVERITY_LEVELS.EMERGENCY;
    if (value >= ALERT_RULES.vitals.bp_systolic_urgent) return SEVERITY_LEVELS.URGENT;
    return SEVERITY_LEVELS.INFO;
  }

  if (findingType === 'creatinine') {
    if (value >= ALERT_RULES.labs.creatinine_emergency) return SEVERITY_LEVELS.EMERGENCY;
    if (value >= ALERT_RULES.labs.creatinine_urgent) return SEVERITY_LEVELS.URGENT;
    return SEVERITY_LEVELS.INFO;
  }

  if (findingType === 'egfr') {
    if (value <= ALERT_RULES.labs.egfr_emergency) return SEVERITY_LEVELS.EMERGENCY;
    if (value <= ALERT_RULES.labs.egfr_urgent) return SEVERITY_LEVELS.URGENT;
    return SEVERITY_LEVELS.INFO;
  }

  if (findingType === 'potassium') {
    if (value >= ALERT_RULES.labs.potassium_emergency_high || value <= ALERT_RULES.labs.potassium_emergency_low) {
      return SEVERITY_LEVELS.EMERGENCY;
    }
    if (value >= ALERT_RULES.labs.potassium_urgent_high || value <= ALERT_RULES.labs.potassium_urgent_low) {
      return SEVERITY_LEVELS.URGENT;
    }
    return SEVERITY_LEVELS.INFO;
  }

  return SEVERITY_LEVELS.INFO;
}

export function getSeverityCSSClass(severity) {
  const classMap = {
    emergency: 'bg-red-100 border-l-4 border-red-600 text-red-900',
    urgent: 'bg-orange-100 border-l-4 border-orange-500 text-orange-900',
    warning: 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900',
    info: 'bg-blue-100 border-l-4 border-blue-500 text-blue-900',
  };
  return classMap[severity];
}

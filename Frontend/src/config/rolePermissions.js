export const ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  RECEPTIONIST: 'receptionist',
  PHARMACIST: 'pharmacist',
  PATIENT: 'patient'
};

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    'dashboard',
    'patients',
    'appointments',
    'doctors',
    'nurses',
    'rooms_beds',
    'pharmacy',
    'blood_bank',
    'visitors',
    'diet',
    'billing',
    'reports',
    'notifications',
    'settings',
    'ai_diet_planner',
    'ai_report_summarizer'
  ],
  [ROLES.DOCTOR]: [
    'dashboard',
    'patients',
    'appointments',
    'rooms_beds',
    'pharmacy',
    'blood_bank',
    'ai_diet_planner',
    'ai_report_summarizer'
  ],
  [ROLES.NURSE]: [
    'dashboard',
    'patients',
    'appointments',
    'rooms_beds',
    'pharmacy',
    'blood_bank',
    'ai_diet_planner',
    'ai_report_summarizer'
  ],
  [ROLES.RECEPTIONIST]: [
    'dashboard',
    'patients',
    'appointments',
    'rooms_beds',
    'blood_bank',
    'visitors',
    'billing',
    'ai_diet_planner',
    'ai_report_summarizer'
  ],
  [ROLES.PHARMACIST]: [
    'dashboard',
    'pharmacy',
    'patients',
    'rooms_beds',
    'ai_diet_planner',
    'ai_report_summarizer'
  ],
  [ROLES.PATIENT]: [
    'dashboard',
    'rooms_beds',
    'pharmacy',
    'blood_bank',
    'ai_diet_planner',
    'ai_report_summarizer'
  ]
};

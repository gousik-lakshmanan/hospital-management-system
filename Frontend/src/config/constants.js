export const SYSTEM_NAME = 'MediSync AI';
export const SYSTEM_SUBTITLE = 'Intelligent Hospital Management System';

export const USER_ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  RECEPTIONIST: 'receptionist',
  PHARMACIST: 'pharmacist',
  PATIENT: 'patient'
};

export const ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Administrator',
  [USER_ROLES.DOCTOR]: 'Doctor / Physician',
  [USER_ROLES.NURSE]: 'Head Nurse',
  [USER_ROLES.RECEPTIONIST]: 'Receptionist',
  [USER_ROLES.PHARMACIST]: 'Chief Pharmacist',
  [USER_ROLES.PATIENT]: 'Patient'
};

export const DEFAULT_DASHBOARD_ROUTES = {
  [USER_ROLES.ADMIN]: '/admin/dashboard',
  [USER_ROLES.DOCTOR]: '/doctor/dashboard',
  [USER_ROLES.NURSE]: '/nurse/dashboard',
  [USER_ROLES.RECEPTIONIST]: '/receptionist/dashboard',
  [USER_ROLES.PHARMACIST]: '/pharmacist/dashboard',
  [USER_ROLES.PATIENT]: '/patient/dashboard'
};

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const ROOM_STATUSES = {
  AVAILABLE: 'AVAILABLE',
  OCCUPIED: 'OCCUPIED',
  RESERVED: 'RESERVED',
  MAINTENANCE: 'MAINTENANCE'
};

export const MEDICINE_STATUSES = {
  IN_STOCK: 'IN STOCK',
  LOW_STOCK: 'LOW STOCK',
  OUT_OF_STOCK: 'OUT OF STOCK',
  EXPIRING_SOON: 'EXPIRING SOON'
};

export const APPOINTMENT_STATUSES = {
  SCHEDULED: 'Scheduled',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  RESCHEDULED: 'Rescheduled'
};

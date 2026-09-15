import React, { createContext, useState, useEffect } from 'react';
import { USER_ROLES } from '../config/constants';

export const AuthContext = createContext();

// Default accounts mapping for testing (4 Doctors, 4 Nurses, Admin, Patient, etc.)
export const PRESET_USERS = {
  // Admin
  'admin@medisync.com': { id: 'ADM001', name: 'Gousik (Admin)', email: 'admin@medisync.com', role: USER_ROLES.ADMIN },
  
  // 4 Doctors
  'arun.kumar@medisync.com': { id: 'DOC001', name: 'Dr. Arun Kumar', email: 'arun.kumar@medisync.com', role: USER_ROLES.DOCTOR, department: 'Cardiology', specialty: 'Cardiologist' },
  'priya.sharma@medisync.com': { id: 'DOC002', name: 'Dr. Priya Sharma', email: 'priya.sharma@medisync.com', role: USER_ROLES.DOCTOR, department: 'General Medicine', specialty: 'General Physician' },
  'rahul.menon@medisync.com': { id: 'DOC003', name: 'Dr. Rahul Menon', email: 'rahul.menon@medisync.com', role: USER_ROLES.DOCTOR, department: 'Orthopedics', specialty: 'Orthopedic Specialist' },
  'sneha.iyer@medisync.com': { id: 'DOC004', name: 'Dr. Sneha Iyer', email: 'sneha.iyer@medisync.com', role: USER_ROLES.DOCTOR, department: 'Dermatology', specialty: 'Dermatologist' },
  'doctor@medisync.com': { id: 'DOC001', name: 'Dr. Arun Kumar', email: 'arun.kumar@medisync.com', role: USER_ROLES.DOCTOR, department: 'Cardiology', specialty: 'Cardiologist' }, // legacy shortcut alias

  // 4 Nurses
  'anitha@medisync.com': { id: 'NUR001', name: 'Nurse Anitha', email: 'anitha@medisync.com', role: USER_ROLES.NURSE, department: 'General Nursing' },
  'meena@medisync.com': { id: 'NUR002', name: 'Nurse Meena', email: 'meena@medisync.com', role: USER_ROLES.NURSE, department: 'Diagnostic Services' },
  'kavya@medisync.com': { id: 'NUR003', name: 'Nurse Kavya', email: 'kavya@medisync.com', role: USER_ROLES.NURSE, department: 'Health Screening' },
  'divya@medisync.com': { id: 'NUR004', name: 'Nurse Divya', email: 'divya@medisync.com', role: USER_ROLES.NURSE, department: 'Laboratory Support' },
  'nurse@medisync.com': { id: 'NUR001', name: 'Nurse Anitha', email: 'anitha@medisync.com', role: USER_ROLES.NURSE, department: 'General Nursing' }, // legacy shortcut alias

  // Staff & Patient
  'receptionist@medisync.com': { id: 'REC001', name: 'Sarah Patel', email: 'receptionist@medisync.com', role: USER_ROLES.RECEPTIONIST },
  'pharmacist@medisync.com': { id: 'PHARM001', name: 'John Miller (PharmD)', email: 'pharmacist@medisync.com', role: USER_ROLES.PHARMACIST },
  'patient@medisync.com': { id: 'P-105', name: 'Gousik Lakshmanan', email: 'patient@medisync.com', role: USER_ROLES.PATIENT }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('medisync_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    // Simulating API latency
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const lowerEmail = email.toLowerCase().trim();
        const matched = PRESET_USERS[lowerEmail];
        
        // Simple password check (password matches role prefix, or just 'password')
        if (matched) {
          setUser(matched);
          localStorage.setItem('medisync_user', JSON.stringify(matched));
          setLoading(false);
          resolve(matched);
        } else {
          setLoading(false);
          reject(new Error('Invalid email or password. Please use one of the Demo Login shortcuts below.'));
        }
      }, 300);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('medisync_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user, currentRole: user?.role }}>
      {children}
    </AuthContext.Provider>
  );
};

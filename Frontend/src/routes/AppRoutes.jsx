import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout
import AppLayout from '../components/layout/AppLayout';

// Guard Wrappers
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

// Authentication Pages
import Login from '../pages/auth/Login';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import Unauthorized from '../pages/auth/Unauthorized';

// Role Dashboards
import AdminDashboard from '../pages/admin/AdminDashboard';
import DoctorDashboard from '../pages/doctor/DoctorDashboard';
import NurseDashboard from '../pages/nurse/NurseDashboard';
import ReceptionistDashboard from '../pages/receptionist/ReceptionistDashboard';
import PharmacistDashboard from '../pages/pharmacist/PharmacistDashboard';
import PatientDashboard from '../pages/patient/PatientDashboard';

// Module Components
import PatientsPage from '../components/patients/PatientsPage';
import AppointmentsPage from '../components/appointments/AppointmentsPage';
import DoctorsPage from '../components/doctors/DoctorsPage';
import NursesPage from '../components/nurses/NursesPage';
import RoomsPage from '../components/rooms/RoomsPage';
import PharmacyPage from '../components/pharmacy/PharmacyPage';
import BloodBankPage from '../components/bloodbank/BloodBankPage';
import VisitorsPage from '../components/visitors/VisitorsPage';
import DietPlanningPage from '../components/diet/DietPlanningPage';
import BillingPage from '../components/billing/BillingPage';
import ReportsPage from '../components/reports/ReportsPage';
import NotificationsPage from '../components/notifications/NotificationsPage';
import SettingsPage from '../components/settings/SettingsPage';

// Shared AI components
import AIDietPlanner from '../components/ai/AIDietPlanner';
import AIReportSummarizer from '../components/ai/AIReportSummarizer';

// Universal Profile Page
import ProfilePage from '../pages/profile/ProfilePage';

import Loader from '../components/common/Loader';
import { useAuth } from '../hooks/useAuth';

// Landing redirection logic helper
const RootRedirect = () => {
  const { isAuthenticated, currentRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader size="lg" />
      </div>
    );
  }

  const validRoles = ['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'patient'];
  if (!isAuthenticated || !currentRole || !validRoles.includes(currentRole)) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={`/${currentRole}/dashboard`} replace />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected Layout Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* 1. Landing Redirection */}
        <Route path="/" element={<RootRedirect />} />

        {/* 2. Universal Profile Route */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin/profile" element={<Navigate to="/profile" replace />} />
        <Route path="/doctor/profile" element={<Navigate to="/profile" replace />} />
        <Route path="/nurse/profile" element={<Navigate to="/profile" replace />} />
        <Route path="/receptionist/profile" element={<Navigate to="/profile" replace />} />
        <Route path="/pharmacist/profile" element={<Navigate to="/profile" replace />} />
        <Route path="/patient/profile" element={<Navigate to="/profile" replace />} />

        {/* 3. Administrator Specific Paths */}
        <Route path="/admin/dashboard" element={<RoleRoute module="dashboard"><AdminDashboard /></RoleRoute>} />
        <Route path="/admin/patients" element={<RoleRoute module="patients"><PatientsPage /></RoleRoute>} />
        <Route path="/admin/appointments" element={<RoleRoute module="appointments"><AppointmentsPage /></RoleRoute>} />
        <Route path="/admin/doctors" element={<RoleRoute module="doctors"><DoctorsPage /></RoleRoute>} />
        <Route path="/admin/nurses" element={<RoleRoute module="nurses"><NursesPage /></RoleRoute>} />
        <Route path="/admin/rooms" element={<RoleRoute module="rooms"><RoomsPage /></RoleRoute>} />
        <Route path="/admin/pharmacy" element={<RoleRoute module="pharmacy"><PharmacyPage /></RoleRoute>} />
        <Route path="/admin/blood-bank" element={<RoleRoute module="blood-bank"><BloodBankPage /></RoleRoute>} />
        <Route path="/admin/visitors" element={<RoleRoute module="visitors"><VisitorsPage /></RoleRoute>} />
        <Route path="/admin/diet" element={<RoleRoute module="diet"><DietPlanningPage /></RoleRoute>} />
        <Route path="/admin/billing" element={<RoleRoute module="billing"><BillingPage /></RoleRoute>} />
        <Route path="/admin/reports" element={<RoleRoute module="reports"><ReportsPage /></RoleRoute>} />
        <Route path="/admin/notifications" element={<RoleRoute module="notifications"><NotificationsPage /></RoleRoute>} />
        <Route path="/admin/settings" element={<RoleRoute module="settings"><SettingsPage /></RoleRoute>} />

        {/* 4. Doctor Specific Paths */}
        <Route path="/doctor/dashboard" element={<RoleRoute module="dashboard"><DoctorDashboard /></RoleRoute>} />
        <Route path="/doctor/patients" element={<RoleRoute module="patients"><PatientsPage /></RoleRoute>} />
        <Route path="/doctor/appointments" element={<RoleRoute module="appointments"><AppointmentsPage /></RoleRoute>} />
        <Route path="/doctor/rooms" element={<RoleRoute module="rooms"><RoomsPage /></RoleRoute>} />
        <Route path="/doctor/pharmacy" element={<RoleRoute module="pharmacy"><PharmacyPage /></RoleRoute>} />
        <Route path="/doctor/blood-bank" element={<RoleRoute module="blood-bank"><BloodBankPage /></RoleRoute>} />

        {/* 5. Nurse Specific Paths */}
        <Route path="/nurse/dashboard" element={<RoleRoute module="dashboard"><NurseDashboard /></RoleRoute>} />
        <Route path="/nurse/patients" element={<RoleRoute module="patients"><PatientsPage /></RoleRoute>} />
        <Route path="/nurse/appointments" element={<RoleRoute module="appointments"><AppointmentsPage /></RoleRoute>} />
        <Route path="/nurse/rooms" element={<RoleRoute module="rooms"><RoomsPage /></RoleRoute>} />
        <Route path="/nurse/pharmacy" element={<RoleRoute module="pharmacy"><PharmacyPage /></RoleRoute>} />
        <Route path="/nurse/blood-bank" element={<RoleRoute module="blood-bank"><BloodBankPage /></RoleRoute>} />

        {/* 6. Receptionist Specific Paths */}
        <Route path="/receptionist/dashboard" element={<RoleRoute module="dashboard"><ReceptionistDashboard /></RoleRoute>} />
        <Route path="/receptionist/patients" element={<RoleRoute module="patients"><PatientsPage /></RoleRoute>} />
        <Route path="/receptionist/appointments" element={<RoleRoute module="appointments"><AppointmentsPage /></RoleRoute>} />
        <Route path="/receptionist/rooms" element={<RoleRoute module="rooms"><RoomsPage /></RoleRoute>} />
        <Route path="/receptionist/blood-bank" element={<RoleRoute module="blood-bank"><BloodBankPage /></RoleRoute>} />
        <Route path="/receptionist/visitors" element={<RoleRoute module="visitors"><VisitorsPage /></RoleRoute>} />
        <Route path="/receptionist/billing" element={<RoleRoute module="billing"><BillingPage /></RoleRoute>} />

        {/* 7. Pharmacist Specific Paths */}
        <Route path="/pharmacist/dashboard" element={<RoleRoute module="dashboard"><PharmacistDashboard /></RoleRoute>} />
        <Route path="/pharmacist/pharmacy" element={<RoleRoute module="pharmacy"><PharmacyPage /></RoleRoute>} />
        <Route path="/pharmacist/patients" element={<RoleRoute module="patients"><PatientsPage /></RoleRoute>} />
        <Route path="/pharmacist/rooms" element={<RoleRoute module="rooms"><RoomsPage /></RoleRoute>} />

        {/* 8. Patient Specific Paths */}
        <Route path="/patient/dashboard" element={<RoleRoute module="dashboard"><PatientDashboard /></RoleRoute>} />
        <Route path="/patient/rooms" element={<RoleRoute module="rooms"><RoomsPage /></RoleRoute>} />
        <Route path="/patient/pharmacy" element={<RoleRoute module="pharmacy"><PharmacyPage /></RoleRoute>} />
        <Route path="/patient/blood-bank" element={<RoleRoute module="blood-bank"><BloodBankPage /></RoleRoute>} />

        {/* 9. Common Shared AI Assistance Paths */}
        <Route path="/ai/diet-planner" element={<RoleRoute module="diet-planner"><AIDietPlanner /></RoleRoute>} />
        <Route path="/ai/report-summarizer" element={<RoleRoute module="report-summarizer"><AIReportSummarizer /></RoleRoute>} />

        {/* Redirection fallback */}
        <Route path="*" element={<RootRedirect />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;

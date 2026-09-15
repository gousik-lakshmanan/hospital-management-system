import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { DEFAULT_DASHBOARD_ROUTES } from '../../config/constants';
import Button from '../../components/common/Button';
import { Activity, ShieldAlert, KeyRound, Mail } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const loggedUser = await login(email, password);
      // Redirect to the default dashboard for their role
      const redirectPath = DEFAULT_DASHBOARD_ROUTES[loggedUser.role];
      navigate(redirectPath);
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const fillQuickLogin = (presetEmail) => {
    setEmail(presetEmail);
    setPassword('password'); // mock default password
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 mb-4">
          <Activity className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">
          Sign in to MediSync AI
        </h2>
        <p className="mt-1.5 text-xs text-slate-500">
          Intelligent Role-Based Hospital Management Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-slate-200 shadow-sm rounded-xl sm:px-10">
          {errorMsg && (
            <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg flex items-start gap-2 text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700">
                Email Address
              </label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@medisync.com"
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <div className="text-xs">
                  <Link to="/forgot-password" className="font-semibold text-blue-600 hover:text-blue-500">
                    Forgot password?
                  </Link>
                </div>
              </div>
              <div className="mt-1 relative">
                <KeyRound className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="w-full"
              >
                Sign In
              </Button>
            </div>
          </form>

          {/* Demo Login / Persona Shortcuts */}
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
            <div className="text-center">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Demo Login Shortcuts
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Click any persona below to immediately log in with full role authorization
              </p>
            </div>

            {/* DOCTORS GRID */}
            <div>
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block mb-2 flex items-center gap-1">
                👨‍⚕️ DOCTORS (4 Clinical Departments)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Doctor 1 */}
                <div className="p-2.5 bg-blue-50/40 border border-blue-100 rounded-xl flex items-center justify-between hover:bg-blue-50 transition-colors">
                  <div className="overflow-hidden">
                    <span className="font-bold text-xs text-slate-800 block truncate">👨‍⚕️ Dr. Arun Kumar</span>
                    <span className="text-[10px] text-blue-600 font-medium block">Cardiology</span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const u = await login('arun.kumar@medisync.com', 'password');
                      navigate(DEFAULT_DASHBOARD_ROUTES[u.role]);
                    }}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-semibold shrink-0 shadow-xs cursor-pointer"
                  >
                    Login as Doctor
                  </button>
                </div>

                {/* Doctor 2 */}
                <div className="p-2.5 bg-blue-50/40 border border-blue-100 rounded-xl flex items-center justify-between hover:bg-blue-50 transition-colors">
                  <div className="overflow-hidden">
                    <span className="font-bold text-xs text-slate-800 block truncate">👩‍⚕️ Dr. Priya Sharma</span>
                    <span className="text-[10px] text-blue-600 font-medium block">General Medicine</span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const u = await login('priya.sharma@medisync.com', 'password');
                      navigate(DEFAULT_DASHBOARD_ROUTES[u.role]);
                    }}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-semibold shrink-0 shadow-xs cursor-pointer"
                  >
                    Login as Doctor
                  </button>
                </div>

                {/* Doctor 3 */}
                <div className="p-2.5 bg-blue-50/40 border border-blue-100 rounded-xl flex items-center justify-between hover:bg-blue-50 transition-colors">
                  <div className="overflow-hidden">
                    <span className="font-bold text-xs text-slate-800 block truncate">👨‍⚕️ Dr. Rahul Menon</span>
                    <span className="text-[10px] text-blue-600 font-medium block">Orthopedics</span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const u = await login('rahul.menon@medisync.com', 'password');
                      navigate(DEFAULT_DASHBOARD_ROUTES[u.role]);
                    }}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-semibold shrink-0 shadow-xs cursor-pointer"
                  >
                    Login as Doctor
                  </button>
                </div>

                {/* Doctor 4 */}
                <div className="p-2.5 bg-blue-50/40 border border-blue-100 rounded-xl flex items-center justify-between hover:bg-blue-50 transition-colors">
                  <div className="overflow-hidden">
                    <span className="font-bold text-xs text-slate-800 block truncate">👩‍⚕️ Dr. Sneha Iyer</span>
                    <span className="text-[10px] text-blue-600 font-medium block">Dermatology</span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const u = await login('sneha.iyer@medisync.com', 'password');
                      navigate(DEFAULT_DASHBOARD_ROUTES[u.role]);
                    }}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-semibold shrink-0 shadow-xs cursor-pointer"
                  >
                    Login as Doctor
                  </button>
                </div>
              </div>
            </div>

            {/* NURSES GRID */}
            <div>
              <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block mb-2 flex items-center gap-1">
                👩‍⚕️ NURSES (4 Clinical Services)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Nurse 1 */}
                <div className="p-2.5 bg-teal-50/40 border border-teal-100 rounded-xl flex items-center justify-between hover:bg-teal-50 transition-colors">
                  <div className="overflow-hidden">
                    <span className="font-bold text-xs text-slate-800 block truncate">👩‍⚕️ Nurse Anitha</span>
                    <span className="text-[10px] text-teal-700 font-medium block">General Nursing</span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const u = await login('anitha@medisync.com', 'password');
                      navigate(DEFAULT_DASHBOARD_ROUTES[u.role]);
                    }}
                    className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-semibold shrink-0 shadow-xs cursor-pointer"
                  >
                    Login as Nurse
                  </button>
                </div>

                {/* Nurse 2 */}
                <div className="p-2.5 bg-teal-50/40 border border-teal-100 rounded-xl flex items-center justify-between hover:bg-teal-50 transition-colors">
                  <div className="overflow-hidden">
                    <span className="font-bold text-xs text-slate-800 block truncate">👩‍⚕️ Nurse Meena</span>
                    <span className="text-[10px] text-teal-700 font-medium block">Diagnostic Services</span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const u = await login('meena@medisync.com', 'password');
                      navigate(DEFAULT_DASHBOARD_ROUTES[u.role]);
                    }}
                    className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-semibold shrink-0 shadow-xs cursor-pointer"
                  >
                    Login as Nurse
                  </button>
                </div>

                {/* Nurse 3 */}
                <div className="p-2.5 bg-teal-50/40 border border-teal-100 rounded-xl flex items-center justify-between hover:bg-teal-50 transition-colors">
                  <div className="overflow-hidden">
                    <span className="font-bold text-xs text-slate-800 block truncate">👩‍⚕️ Nurse Kavya</span>
                    <span className="text-[10px] text-teal-700 font-medium block">Health Screening</span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const u = await login('kavya@medisync.com', 'password');
                      navigate(DEFAULT_DASHBOARD_ROUTES[u.role]);
                    }}
                    className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-semibold shrink-0 shadow-xs cursor-pointer"
                  >
                    Login as Nurse
                  </button>
                </div>

                {/* Nurse 4 */}
                <div className="p-2.5 bg-teal-50/40 border border-teal-100 rounded-xl flex items-center justify-between hover:bg-teal-50 transition-colors">
                  <div className="overflow-hidden">
                    <span className="font-bold text-xs text-slate-800 block truncate">👩‍⚕️ Nurse Divya</span>
                    <span className="text-[10px] text-teal-700 font-medium block">Laboratory Support</span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const u = await login('divya@medisync.com', 'password');
                      navigate(DEFAULT_DASHBOARD_ROUTES[u.role]);
                    }}
                    className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-semibold shrink-0 shadow-xs cursor-pointer"
                  >
                    Login as Nurse
                  </button>
                </div>
              </div>
            </div>

            {/* OTHER ROLES (Patient, Admin, Receptionist, Pharmacist) */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                👤 PATIENT & OTHER STAFF ROLES
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const u = await login('patient@medisync.com', 'password');
                    navigate(DEFAULT_DASHBOARD_ROUTES[u.role]);
                  }}
                  className="p-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 text-left transition-colors cursor-pointer"
                >
                  <span className="block font-bold text-blue-700">Patient</span>
                  <span className="text-[10px] text-slate-500 block truncate">Gousik (P-105)</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const u = await login('admin@medisync.com', 'password');
                    navigate(DEFAULT_DASHBOARD_ROUTES[u.role]);
                  }}
                  className="p-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 text-left transition-colors cursor-pointer"
                >
                  <span className="block font-bold text-purple-700">Admin</span>
                  <span className="text-[10px] text-slate-500 block truncate">Administrator</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const u = await login('receptionist@medisync.com', 'password');
                    navigate(DEFAULT_DASHBOARD_ROUTES[u.role]);
                  }}
                  className="p-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 text-left transition-colors cursor-pointer"
                >
                  <span className="block font-bold text-amber-700">Receptionist</span>
                  <span className="text-[10px] text-slate-500 block truncate">Front Desk</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const u = await login('pharmacist@medisync.com', 'password');
                    navigate(DEFAULT_DASHBOARD_ROUTES[u.role]);
                  }}
                  className="p-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 text-left transition-colors cursor-pointer"
                >
                  <span className="block font-bold text-emerald-700">Pharmacist</span>
                  <span className="text-[10px] text-slate-500 block truncate">Pharmacy Unit</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

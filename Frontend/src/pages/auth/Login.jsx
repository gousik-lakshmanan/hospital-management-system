import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { DEFAULT_DASHBOARD_ROUTES } from '../../config/constants';
import Button from '../../components/common/Button';
import {
  Activity,
  ShieldAlert,
  CheckCircle2,
  KeyRound,
  Mail,
  User,
  Phone,
  ShieldCheck,
  UserPlus,
  LogIn
} from 'lucide-react';

export const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  
  // Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register Form State
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'patient',
    password: '',
    confirmPassword: '',
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const loggedUser = await login(email, password);
      const redirectPath = DEFAULT_DASHBOARD_ROUTES[loggedUser.role] || '/patient/dashboard';
      navigate(redirectPath);
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Frontend Validations
    if (!registerData.firstName.trim() || !registerData.lastName.trim()) {
      setErrorMsg('Please enter both first and last name.');
      return;
    }
    if (!registerData.email.trim()) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (registerData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (registerData.password !== registerData.confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }

    try {
      const payload = {
        firstName: registerData.firstName.trim(),
        lastName: registerData.lastName.trim(),
        email: registerData.email.trim(),
        phone: registerData.phone.trim(),
        password: registerData.password,
        role: registerData.role,
      };

      await register(payload);

      // Registration successful -> transition to login
      setSuccessMsg('Registration successful. You can now log in.');
      setEmail(registerData.email.trim());
      setPassword('');
      setIsRegister(false);
      setRegisterData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'patient',
        password: '',
        confirmPassword: '',
      });
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    }
  };

  const toggleMode = (targetRegisterMode) => {
    setIsRegister(targetRegisterMode);
    setErrorMsg('');
    setSuccessMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 mb-4">
          <Activity className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">
          {isRegister ? 'Create Patient Account' : 'Sign in to MediSync AI'}
        </h2>
        <p className="mt-1.5 text-xs text-slate-500">
          {isRegister ? 'New patient registration portal' : 'Intelligent Role-Based Hospital Management Platform'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-slate-200 shadow-sm rounded-xl sm:px-10">
          {/* Mode Switch Tabs */}
          <div className="flex rounded-lg bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => toggleMode(false)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                !isRegister
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => toggleMode(true)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                isRegister
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Register Patient
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg flex items-start gap-2 text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-lg flex items-start gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {!isRegister ? (
            <form className="space-y-4" onSubmit={handleLoginSubmit}>
              <div>
                <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700">
                  Email Address
                </label>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@medisync.local"
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">
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
                    id="login-password"
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

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  New patient?{' '}
                  <button
                    type="button"
                    onClick={() => toggleMode(true)}
                    className="font-semibold text-blue-600 hover:text-blue-500 cursor-pointer"
                  >
                    Register Patient Account
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* REGISTER FORM (STRICTLY PATIENT ONLY) */
            <form className="space-y-3.5" onSubmit={handleRegisterSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="block text-xs font-semibold text-slate-700">
                    First Name
                  </label>
                  <div className="mt-1 relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={registerData.firstName}
                      onChange={handleRegisterChange}
                      placeholder="John"
                      className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-xs font-semibold text-slate-700">
                    Last Name
                  </label>
                  <div className="mt-1 relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={registerData.lastName}
                      onChange={handleRegisterChange}
                      placeholder="Doe"
                      className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-700">
                  Email Address
                </label>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    required
                    value={registerData.email}
                    onChange={handleRegisterChange}
                    placeholder="john.doe@example.com"
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-phone" className="block text-xs font-semibold text-slate-700">
                  Phone Number
                </label>
                <div className="mt-1 relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    id="reg-phone"
                    name="phone"
                    type="tel"
                    value={registerData.phone}
                    onChange={handleRegisterChange}
                    placeholder="9876543210"
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-password" className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      id="reg-password"
                      name="password"
                      type="password"
                      required
                      value={registerData.password}
                      onChange={handleRegisterChange}
                      placeholder="Min 6 chars"
                      className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-confirm" className="block text-xs font-semibold text-slate-700">
                    Confirm Password
                  </label>
                  <div className="mt-1 relative">
                    <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      id="reg-confirm"
                      name="confirmPassword"
                      type="password"
                      required
                      value={registerData.confirmPassword}
                      onChange={handleRegisterChange}
                      placeholder="Repeat password"
                      className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  className="w-full"
                >
                  {loading ? 'Creating Patient Account...' : 'Create Patient Account'}
                </Button>
              </div>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => toggleMode(false)}
                    className="font-semibold text-blue-600 hover:text-blue-500 cursor-pointer"
                  >
                    Sign In here
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;

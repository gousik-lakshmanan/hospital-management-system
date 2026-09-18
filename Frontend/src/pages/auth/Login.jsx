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
  LogIn,
  Eye,
  EyeOff,
  HeartPulse,
  Stethoscope,
  Sparkles,
  Building2,
  Hospital
} from 'lucide-react';

export const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  
  // Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Subtle Healthcare Background Decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-200/50 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-200/50 rounded-full blur-3xl" />
        <svg
          className="absolute top-1/2 left-0 w-full h-32 -translate-y-1/2 text-blue-200/40"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M0,60 L250,60 L280,60 L295,20 L310,100 L325,40 L340,75 L355,60 L600,60 L630,60 L645,15 L660,105 L675,35 L690,80 L705,60 L950,60 L980,60 L995,25 L1010,95 L1025,45 L1040,70 L1055,60 L1200,60" />
        </svg>
      </div>

      {/* Main Container */}
      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* LEFT PANEL: Healthcare Branding & System Highlights (Desktop/Laptop) */}
        <div className="lg:col-span-6 hidden lg:flex flex-col justify-between space-y-6 pr-4">
          <div>
            {/* Logo and Brand Title */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight text-slate-900">MediSync <span className="text-blue-600">AI</span></h1>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 rounded-full border border-blue-200">v2.0</span>
                </div>
                <p className="text-xs font-medium text-slate-500">Integrated Healthcare Intelligence System</p>
              </div>
            </div>

            {/* Main Tagline */}
            <h2 className="text-2xl font-bold text-slate-800 leading-snug">
              Smart Hospital Management & Seamless Healthcare Delivery.
            </h2>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Unified digital infrastructure connecting doctors, nursing staff, pharmacy, blood bank, administrators, and patients in a secure clinical ecosystem.
            </p>
          </div>

          {/* Healthcare Feature Highlights */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/70 backdrop-blur-xs border border-slate-200/80 shadow-xs hover:border-blue-200 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Secure Healthcare Management</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Enterprise role-based security, audit trails, and strict medical record isolation.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/70 backdrop-blur-xs border border-slate-200/80 shadow-xs hover:border-blue-200 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                <HeartPulse className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Connected Patient Care</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Real-time room/bed allocations, doctor scheduling, donor tracking, and pharmacy.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/70 backdrop-blur-xs border border-slate-200/80 shadow-xs hover:border-blue-200 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Intelligent Hospital Operations</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">AI-powered recovery diet formulations and diagnostic report summaries.</p>
              </div>
            </div>
          </div>

          {/* Network Status indicator */}
          <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200/80">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Hospital Network Active
            </span>
            <span className="text-[11px] text-slate-400">• HIPAA & MongoDB Atlas Secured</span>
          </div>
        </div>

        {/* RIGHT PANEL: Authentication Form Card */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="bg-white/95 backdrop-blur-md py-7 px-5 sm:px-8 border border-slate-200/90 shadow-xl shadow-slate-200/50 rounded-2xl">
            
            {/* Mobile / Tablet Header */}
            <div className="lg:hidden text-center mb-6">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 mb-2.5">
                <Activity className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-black text-slate-900">MediSync <span className="text-blue-600">AI</span></h1>
              <p className="text-xs text-slate-500 mt-0.5">Hospital Management System</p>
            </div>

            {/* Form Title & Subtitle */}
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-800">
                {isRegister ? 'Register Patient File' : 'Healthcare Portal Access'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isRegister ? 'Fill in your details to create your digital hospital record' : 'Sign in with your verified institutional credentials'}
              </p>
            </div>

            {/* Mode Switch Tabs */}
            <div className="flex rounded-xl bg-slate-100/90 p-1 mb-5 border border-slate-200/60">
              <button
                type="button"
                onClick={() => toggleMode(false)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  !isRegister
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200/40'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
              <button
                type="button"
                onClick={() => toggleMode(true)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  isRegister
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200/40'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Register Patient
              </button>
            </div>

            {/* Feedback Messages */}
            {errorMsg && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl flex items-start gap-2 text-xs animate-in fade-in duration-200">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl flex items-start gap-2 text-xs animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* SIGN IN FORM */}
            {!isRegister ? (
              <form className="space-y-4" onSubmit={handleLoginSubmit}>
                <div>
                  <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700">
                    Institutional Email
                  </label>
                  <div className="mt-1 relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      id="login-email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. admin@medisync.local"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/60 hover:bg-slate-100/50 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">
                      Security Password
                    </label>
                    <div className="text-xs">
                      <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
                        Forgot password?
                      </Link>
                    </div>
                  </div>
                  <div className="mt-1 relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/60 hover:bg-slate-100/50 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-800 placeholder:text-slate-400"
                    />
                    {/* Password Show / Hide Toggle Button */}
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus:text-blue-600 focus:outline-none transition-colors cursor-pointer rounded-md"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    className="w-full py-2.5 rounded-xl font-semibold shadow-md shadow-blue-500/20"
                    icon={LogIn}
                  >
                    Authenticate & Sign In
                  </Button>
                </div>

                <div className="text-center pt-2">
                  <p className="text-xs text-slate-500">
                    New patient to the hospital?{' '}
                    <button
                      type="button"
                      onClick={() => toggleMode(true)}
                      className="font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
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
                      First Name *
                    </label>
                    <div className="mt-1 relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        value={registerData.firstName}
                        onChange={handleRegisterChange}
                        placeholder="John"
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:outline-none focus:border-blue-600 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-xs font-semibold text-slate-700">
                      Last Name *
                    </label>
                    <div className="mt-1 relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        value={registerData.lastName}
                        onChange={handleRegisterChange}
                        placeholder="Doe"
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:outline-none focus:border-blue-600 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-700">
                    Email Address *
                  </label>
                  <div className="mt-1 relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      id="reg-email"
                      name="email"
                      type="email"
                      required
                      value={registerData.email}
                      onChange={handleRegisterChange}
                      placeholder="john.doe@example.com"
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:outline-none focus:border-blue-600 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-phone" className="block text-xs font-semibold text-slate-700">
                    Phone Number
                  </label>
                  <div className="mt-1 relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      id="reg-phone"
                      name="phone"
                      type="tel"
                      value={registerData.phone}
                      onChange={handleRegisterChange}
                      placeholder="9876543210"
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:outline-none focus:border-blue-600 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="reg-password" className="block text-xs font-semibold text-slate-700">
                      Password *
                    </label>
                    <div className="mt-1 relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        id="reg-password"
                        name="password"
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={registerData.password}
                        onChange={handleRegisterChange}
                        placeholder="Min 6 chars"
                        className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:outline-none focus:border-blue-600 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword((prev) => !prev)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors cursor-pointer rounded"
                        aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                        title={showRegPassword ? 'Hide password' : 'Show password'}
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-confirm" className="block text-xs font-semibold text-slate-700">
                      Confirm Password *
                    </label>
                    <div className="mt-1 relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        id="reg-confirm"
                        name="confirmPassword"
                        type={showRegConfirmPassword ? 'text' : 'password'}
                        required
                        value={registerData.confirmPassword}
                        onChange={handleRegisterChange}
                        placeholder="Repeat password"
                        className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:outline-none focus:border-blue-600 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegConfirmPassword((prev) => !prev)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors cursor-pointer rounded"
                        aria-label={showRegConfirmPassword ? 'Hide password' : 'Show password'}
                        title={showRegConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    className="w-full py-2 rounded-xl font-semibold shadow-md shadow-blue-500/20"
                    icon={UserPlus}
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
                      className="font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
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
    </div>
  );
};

export default Login;

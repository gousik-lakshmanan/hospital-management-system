import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle, ChevronLeft } from 'lucide-react';
import Button from '../../components/common/Button';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">
          Recover Password
        </h2>
        <p className="mt-1.5 text-xs text-slate-500">
          Enter your email to receive recovery instructions.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-slate-200 shadow-sm rounded-xl sm:px-10">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 border border-emerald-100 mb-2">
                <CheckCircle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">Reset Email Dispatched</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-normal">
                If the account is registered in our directories, an email containing key recovery steps will arrive shortly.
              </p>
              <div className="pt-4">
                <Link to="/login">
                  <Button variant="outline" size="sm" icon={ChevronLeft}>
                    Back to login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-700">
                  Email Address
                </label>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@medisync.com"
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" className="w-full">
                  Send Recovery Link
                </Button>
              </div>

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1">
                  <ChevronLeft className="w-3 h-3" /> Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  UserPlus,
  ChevronDown,
  ChevronRight,
  Shield,
  Ship,
  Settings,
  Package,
  AlertCircle,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import bgImage from '../assets/maritime-login-bg.jpg';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [demoExpanded, setDemoExpanded] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [infoModal, setInfoModal] = useState({ open: false, title: '', message: '' });

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Login failed. Please verify credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (quickEmail, quickPassword) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
    setError('');
    setLoading(true);
    try {
      await login(quickEmail, quickPassword);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  const demoRoles = [
    {
      name: 'Admin',
      email: 'admin@vesselfleet.com',
      password: 'Password123!',
      icon: Shield,
    },
    {
      name: 'Fleet Operator',
      email: 'operator@vesselfleet.com',
      password: 'Password123!',
      icon: Ship,
    },
    {
      name: 'Marine Engineer',
      email: 'engineer@vesselfleet.com',
      password: 'Password123!',
      icon: Settings,
    },
    {
      name: 'Cargo Manager',
      email: 'cargo@vesselfleet.com',
      password: 'Password123!',
      icon: Package,
    },
  ];

  return (
    <div
      className="min-h-screen w-full relative bg-cover bg-no-repeat flex flex-col justify-between overflow-x-hidden"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundPosition: 'center right',
      }}
    >
      {/* Subtle gradient wash over left side to blend seamlessly while preserving background clarity */}
      <div className="absolute inset-0 bg-gradient-to-r from-sky-50/70 via-sky-50/20 to-transparent pointer-events-none" />

      {/* Top Left Minimal VesselFleet Logo */}
      <header className="relative z-20 pt-6 pl-6 sm:pt-8 sm:pl-10 lg:pl-16">
        <div className="flex items-center gap-2.5 select-none">
          {/* Custom Anchor with subtle ocean wave */}
          <div className="w-8 h-8 rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Anchor Ring */}
              <circle cx="12" cy="5" r="2" stroke="#0ea5e9" />
              {/* Anchor Shank */}
              <line x1="12" y1="7" x2="12" y2="18.5" stroke="#0ea5e9" />
              {/* Crossbar */}
              <line x1="8.5" y1="9.5" x2="15.5" y2="9.5" stroke="#0ea5e9" />
              {/* Anchor Arms / Flukes */}
              <path d="M5 13.5a7 7 0 0 0 14 0" stroke="#0ea5e9" />
              {/* Ocean Wave crossing anchor base */}
              <path
                d="M3.5 17.5c2.5-1.5 5-1.5 7.5 0s5 1.5 7.5 0 2-0.8 2.5-0.8"
                stroke="#38bdf8"
                strokeWidth="2"
              />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Vessel<span className="text-sky-500">Fleet</span>
          </span>
        </div>
      </header>

      {/* Main Login Area - positioned cleanly on the left side */}
      <main className="relative z-10 w-full max-w-[420px] mx-auto lg:mx-0 lg:ml-16 xl:ml-24 my-auto py-8 px-4 sm:px-0">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800 tracking-tight">
            Welcome to
          </h1>
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Vessel<span className="text-sky-500">Fleet</span>
          </div>
          <p className="text-slate-500 text-sm mt-1.5 font-normal">
            Your fleet. Our focus.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50/90 border border-rose-200/80 backdrop-blur-sm flex items-start gap-2.5 text-rose-700 text-xs font-medium animate-fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Transparent Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Email Address Field */}
          <div>
            <div className="relative flex items-center bg-white/50 hover:bg-white/60 focus-within:bg-white/80 backdrop-blur-md border border-white/80 rounded-xl px-3.5 py-2.5 transition-all shadow-sm focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-400/20">
              <Mail className="w-4 h-4 text-slate-400 mr-2.5 flex-shrink-0" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="relative flex items-center bg-white/50 hover:bg-white/60 focus-within:bg-white/80 backdrop-blur-md border border-white/80 rounded-xl px-3.5 py-2.5 transition-all shadow-sm focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-400/20">
              <Lock className="w-4 h-4 text-slate-400 mr-2.5 flex-shrink-0" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 transition ml-2 flex-shrink-0"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-sky-500 focus:ring-sky-400 cursor-pointer accent-sky-500"
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              onClick={() =>
                setInfoModal({
                  open: true,
                  title: 'Forgot Password',
                  message:
                    'To reset your password, please contact your organization administrator or operations manager at admin@vesselfleet.com.',
                })
              }
              className="text-sky-600 hover:text-sky-700 font-medium transition"
            >
              Forgot password?
            </button>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-sky-500/25 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* OR Divider */}
          <div className="relative py-1 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300/60" />
            </div>
            <div className="relative bg-white/60 backdrop-blur-md px-3 text-[11px] uppercase tracking-wider text-slate-400 font-semibold rounded-full">
              OR
            </div>
          </div>

          {/* Create Account Button */}
          <button
            type="button"
            onClick={() =>
              setInfoModal({
                open: true,
                title: 'Create Account',
                message:
                  'Staff accounts are registered centrally by enterprise fleet administrators. Please use the Explore Demo Access section below to test all role features.',
              })
            }
            className="w-full py-2.5 px-4 rounded-xl bg-white/40 hover:bg-white/70 backdrop-blur-md border border-white/80 text-slate-700 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <UserPlus className="w-4 h-4 text-slate-600" />
            <span>Create Account</span>
          </button>
        </form>

        {/* Explore Demo Access (Compact, Expandable Section) */}
        <div className="mt-5 rounded-xl border border-white/80 bg-white/45 backdrop-blur-md overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => setDemoExpanded(!demoExpanded)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-white/40 transition select-none"
          >
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs">
              <Users className="w-4 h-4 text-sky-500" />
              <span>Explore Demo Access</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                demoExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {demoExpanded && (
            <div className="divide-y divide-sky-100/60 bg-white/30 backdrop-blur-sm">
              {demoRoles.map((role) => {
                const IconComponent = role.icon;
                return (
                  <button
                    key={role.name}
                    type="button"
                    onClick={() => handleQuickLogin(role.email, role.password)}
                    className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-sky-50/70 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className="w-4 h-4 text-sky-600 group-hover:text-sky-700" />
                      <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900">
                        {role.name}
                      </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Empty bottom spacer to balance layout without any footer clutter */}
      <footer className="relative z-10 py-3" />

      {/* Info Dialog Modal */}
      {infoModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white/95 backdrop-blur-md border border-white/80 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              {infoModal.title}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              {infoModal.message}
            </p>
            <button
              type="button"
              onClick={() =>
                setInfoModal({ open: false, title: '', message: '' })
              }
              className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium text-xs shadow-md shadow-sky-500/20 transition"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

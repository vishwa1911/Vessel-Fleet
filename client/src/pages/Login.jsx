import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Anchor, Shield, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="min-h-screen bg-maritime-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-ocean-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="p-3 bg-gradient-to-br from-ocean-500 to-teal-500 rounded-2xl shadow-xl shadow-ocean-500/20 text-white">
            <Anchor className="w-9 h-9" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-white tracking-tight">
          Vessel<span className="text-ocean-400">Fleet</span>
        </h2>
        <p className="mt-1 text-center text-xs uppercase tracking-widest text-slate-400">
          Smart Maritime Fleet Management & Voyage Optimization
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="glass-panel py-8 px-6 sm:px-10 rounded-2xl border border-slate-800 shadow-2xl">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@vesselfleet.com"
                className="w-full px-3.5 py-2.5 bg-maritime-900 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-ocean-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-maritime-900 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-ocean-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-ocean-600 hover:bg-ocean-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-lg shadow-ocean-600/30"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Ops Center</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Role Logins */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <UserCheck className="w-4 h-4 text-ocean-400" />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
                1-Click Demo Logins by Role:
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@vesselfleet.com', 'Password123!')}
                className="p-2.5 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 text-left transition"
              >
                <div className="font-semibold text-white">Admin</div>
                <div className="text-[10px] text-purple-300 truncate">Full Access</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('operator@vesselfleet.com', 'Password123!')}
                className="p-2.5 rounded-lg border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-200 text-left transition"
              >
                <div className="font-semibold text-white">Fleet Operator</div>
                <div className="text-[10px] text-sky-300 truncate">Vessels & Voyages</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('engineer@vesselfleet.com', 'Password123!')}
                className="p-2.5 rounded-lg border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-200 text-left transition"
              >
                <div className="font-semibold text-white">Marine Engineer</div>
                <div className="text-[10px] text-teal-300 truncate">Maintenance & Fuel</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('cargo@vesselfleet.com', 'Password123!')}
                className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 text-left transition"
              >
                <div className="font-semibold text-white">Cargo Manager</div>
                <div className="text-[10px] text-amber-300 truncate">Shipments & Logistics</div>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <span>Secured with JWT authentication, bcrypt & RBAC authorization</span>
        </div>
      </div>
    </div>
  );
};

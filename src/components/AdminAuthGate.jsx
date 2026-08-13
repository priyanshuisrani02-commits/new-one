import React, { useEffect, useState } from 'react';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const AdminAuthGate = ({ children }) => {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState(import.meta.env.VITE_ADMIN_EMAIL || '');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkAdminSession = async () => {
    if (!isSupabaseConfigured) {
      setSessionChecked(true);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    const isVerified = Boolean(user?.email_confirmed_at);
    const isAuthorized = Boolean(user && isVerified && user.app_metadata?.role === 'admin');

    setAuthenticated(isAuthorized);
    setSessionChecked(true);
  };

  useEffect(() => {
    checkAdminSession();

    if (!isSupabaseConfigured) return undefined;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdminSession();
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    if (!isSupabaseConfigured) {
      setErrorMessage('Supabase authentication is not configured.');
      return;
    }

    if (!email.trim() || !password) {
      setErrorMessage('Enter your admin email and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (!data.user?.email_confirmed_at) {
        await supabase.auth.signOut({ scope: 'local' });
        setErrorMessage('This email has not been verified. Check your verification email before signing in.');
        return;
      }

      if (data.user.app_metadata?.role !== 'admin') {
        await supabase.auth.signOut({ scope: 'local' });
        setErrorMessage('This account is not authorized to access the admin panel.');
        return;
      }

      setAuthenticated(true);
      setPassword('');
    } catch (error) {
      console.error('Admin authentication failed:', error);
      setErrorMessage(error?.message || 'Unable to sign in. Check your email and password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!sessionChecked) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="text-center text-rose-200/70 text-sm">Checking secure admin session…</div>
      </div>
    );
  }

  if (authenticated) return children;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full glass-panel p-6 sm:p-10 rounded-3xl border border-rose-500/30 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 mx-auto mb-6">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <h2 className="font-serif text-3xl font-bold text-white mb-2">Secure Admin Portal</h2>
        <p className="text-xs text-rose-200/70 mb-6">
          Sign in with the verified admin account. Email verification and Supabase authorization are required.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <label className="block">
            <span className="block text-xs text-rose-300 mb-1.5">Admin email</span>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400/60" />
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-velvet-950/80 border border-rose-800/40 text-white placeholder-rose-400/40 text-sm focus:outline-none focus:border-rose-500"
              />
            </div>
          </label>

          <label className="block">
            <span className="block text-xs text-rose-300 mb-1.5">Password</span>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400/60" />
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your Supabase account password"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-velvet-950/80 border border-rose-800/40 text-white placeholder-rose-400/40 text-sm focus:outline-none focus:border-rose-500"
              />
            </div>
          </label>

          {errorMessage && (
            <p className="text-xs text-rose-300 font-medium bg-rose-950/40 border border-rose-900/50 rounded-xl px-3 py-2">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 text-white font-semibold text-sm shadow-lg shadow-rose-600/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Verifying…' : 'Sign in securely'}
          </button>
        </form>

        <p className="text-[11px] text-rose-300/40 mt-6">
          Only verified Supabase users explicitly authorized as admins can enter this area.
        </p>
      </div>
    </div>
  );
};

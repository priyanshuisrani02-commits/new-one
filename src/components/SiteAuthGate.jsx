import React, { useEffect, useState } from 'react';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const ALLOWED_EMAILS = new Set([
  'admin.velvet7241@4everurs.app',
  'nasteiva7@gmail.com',
  'priyanshuisrani02@gmail.com',
]);

export const SiteAuthGate = ({ children }) => {
  const [checked, setChecked] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (!isSupabaseConfigured) { if (mounted) setChecked(true); return; }
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      const ok = Boolean(user?.email_confirmed_at && ALLOWED_EMAILS.has((user.email || '').trim().toLowerCase()));
      if (user && !ok) await supabase.auth.signOut({ scope: 'local' });
      if (mounted) { setAuthorized(ok); setChecked(true); }
    };
    void init();
    const { data: authData } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      const ok = Boolean(user?.email_confirmed_at && ALLOWED_EMAILS.has((user.email || '').trim().toLowerCase()));
      if (mounted) setAuthorized(ok);
      if (user && !ok) void supabase.auth.signOut({ scope: 'local' });
    });
    return () => { mounted = false; authData.subscription.unsubscribe(); };
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    const normalized = email.trim().toLowerCase();
    if (!ALLOWED_EMAILS.has(normalized)) { setErrorMessage('This email is not authorized for 4EVER URS.'); return; }
    if (!password) { setErrorMessage('Enter your Supabase password.'); return; }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: normalized, password });
      if (error) throw error;
      if (!data.user?.email_confirmed_at) { await supabase.auth.signOut({ scope: 'local' }); throw new Error('Verify this email before signing in.'); }
      if (!ALLOWED_EMAILS.has((data.user.email || '').trim().toLowerCase())) { await supabase.auth.signOut({ scope: 'local' }); throw new Error('This account is not authorized for 4EVER URS.'); }
      setAuthorized(true); setPassword('');
    } catch (error) { setAuthorized(false); setErrorMessage(error?.message || 'Unable to sign in.'); }
    finally { setSubmitting(false); }
  };

  if (!checked) return <div className='min-h-screen flex items-center justify-center bg-velvet-950 text-rose-100'>Checking secure access…</div>;
  if (authorized) return children;

  return <div className='min-h-screen flex items-center justify-center bg-velvet-950 px-4 py-10'><div className='w-full max-w-md glass-panel p-7 sm:p-10 rounded-[2rem] border border-rose-500/30 shadow-2xl'>
    <div className='w-16 h-16 rounded-full bg-rose-500/15 flex items-center justify-center text-rose-300 mx-auto mb-5'><ShieldCheck className='w-8 h-8'/></div>
    <h1 className='font-serif text-3xl sm:text-4xl text-white text-center'>4EVER URS</h1>
    <p className='text-sm text-rose-200/65 text-center mt-2'>Private space. Sign in with one of the three approved accounts.</p>
    <form onSubmit={submit} className='mt-7 space-y-4'>
      <label className='block'><span className='block text-xs text-rose-300 mb-2'>Email</span><div className='relative'><Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400/60'/><input type='email' autoComplete='username' required value={email} onChange={(e)=>setEmail(e.target.value)} placeholder='your@email.com' className='w-full pl-10 pr-4 py-3 rounded-2xl bg-velvet-950/80 border border-rose-800/40 text-white outline-none focus:border-rose-500'/></div></label>
      <label className='block'><span className='block text-xs text-rose-300 mb-2'>Password</span><div className='relative'><Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400/60'/><input type='password' autoComplete='current-password' required value={password} onChange={(e)=>setPassword(e.target.value)} placeholder='Your Supabase password' className='w-full pl-10 pr-4 py-3 rounded-2xl bg-velvet-950/80 border border-rose-800/40 text-white outline-none focus:border-rose-500'/></div></label>
      {errorMessage && <div className='rounded-xl border border-rose-800/40 bg-rose-950/50 px-3 py-2 text-xs text-rose-200'>{errorMessage}</div>}
      <button type='submit' disabled={submitting} className='w-full rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 text-white py-3.5 font-semibold disabled:opacity-50'>{submitting ? 'Signing in…' : 'Enter 4EVER URS'}</button>
    </form>
    <p className='mt-5 text-center text-[11px] text-rose-300/35'>Only the three approved accounts can enter.</p>
  </div></div>;
};
import React, { useEffect, useState } from 'react';
import { Edit3, Eye, EyeOff, Lock, Plus, Save, ShieldCheck, Trash2, X } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const WordSphereAdmin = () => {
  const [authorized, setAuthorized] = useState(false);
  const [email, setEmail] = useState(import.meta.env.VITE_ADMIN_EMAIL || '');
  const [password, setPassword] = useState('');
  const [words, setWords] = useState([]);
  const [newWord, setNewWord] = useState('');
  const [weight, setWeight] = useState(3);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const check = async () => { if (!isSupabaseConfigured) return false; const { data } = await supabase.rpc('is_active_admin'); const ok = Boolean(data); setAuthorized(ok); return ok; };
  const load = async () => { if (!(await check())) return; const { data, error } = await supabase.from('word_sphere_words').select('*').order('created_at', { ascending: true }); if (!error) setWords(data || []); };
  useEffect(() => { load(); }, []);

  const login = async (event) => {
    event.preventDefault(); setLoading(true); setMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setMessage(error.message); else if (!(await check())) setMessage('This account is authenticated but is not an active admin.'); else { setPassword(''); await load(); }
    setLoading(false);
  };
  const add = async (event) => {
    event.preventDefault(); const word = newWord.trim(); if (!word) return;
    const { data, error } = await supabase.from('word_sphere_words').insert({ word, weight: Number(weight), is_active: true }).select().single();
    if (error) setMessage(error.message); else { setWords((prev) => [...prev, data]); setNewWord(''); setMessage('Word added.'); }
  };
  const save = async (id, value, nextWeight, active) => {
    const { data, error } = await supabase.from('word_sphere_words').update({ word: value.trim(), weight: Number(nextWeight), is_active: active }).eq('id', id).select().single();
    if (error) setMessage(error.message); else { setWords((prev) => prev.map((item) => item.id === id ? data : item)); setEditing(null); setMessage('Word updated.'); }
  };
  const remove = async (id) => {
    if (!window.confirm('Delete this word from the sphere?')) return;
    const { error } = await supabase.from('word_sphere_words').delete().eq('id', id);
    if (error) setMessage(error.message); else { setWords((prev) => prev.filter((item) => item.id !== id)); setMessage('Word deleted.'); }
  };

  if (!authorized) return <div className="max-w-xl mx-auto px-5 py-16"><div className="glass-panel rounded-[2rem] p-8 border border-rose-300/10"><Lock className="w-8 h-8 text-rose-300 mx-auto mb-4" /><h1 className="font-serif text-3xl text-white text-center">Word Sphere Admin</h1><p className="text-xs text-rose-200/50 text-center mt-2 mb-7">Sign in with the verified Supabase admin account.</p><form onSubmit={login} className="space-y-4"><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="Admin email" className="w-full px-4 py-3 rounded-xl bg-black/30 border border-rose-900/40 text-white" /><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required placeholder="Password" className="w-full px-4 py-3 rounded-xl bg-black/30 border border-rose-900/40 text-white" /><button disabled={loading} className="w-full rounded-xl py-3 bg-rose-600 text-white font-semibold disabled:opacity-50">{loading ? 'Checking…' : 'Unlock'}</button></form>{message && <p className="mt-4 text-xs text-rose-300 text-center">{message}</p>}</div></div>;

  return <div className="max-w-5xl mx-auto px-5 py-10"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"><div><div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-400" /><span className="text-[10px] uppercase tracking-[0.3em] text-emerald-300">Admin secured</span></div><h1 className="font-serif text-4xl text-white mt-2">Word Sphere</h1><p className="text-sm text-rose-200/50 mt-2">CRUD controls for the words floating across Home.</p></div><div className="px-4 py-3 rounded-2xl bg-black/20 border border-rose-300/10 text-xs text-rose-200/60">{words.length} words • live sync</div></div>
    <div className="grid lg:grid-cols-[.8fr_1.2fr] gap-6"><form onSubmit={add} className="glass-panel rounded-[2rem] p-6 border border-rose-300/10 h-fit"><h2 className="font-serif text-2xl text-white flex items-center gap-2"><Plus className="w-5 h-5 text-rose-300" /> Add a word</h2><input value={newWord} onChange={(e) => setNewWord(e.target.value)} maxLength={40} placeholder="e.g. ALWAYS" className="mt-6 w-full px-4 py-3 rounded-xl bg-black/30 border border-rose-900/40 text-white" /><label className="block mt-4 text-xs text-rose-200/60">Visual weight: {weight}</label><input type="range" min="1" max="5" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full accent-rose-500" /><button className="mt-5 w-full py-3 rounded-xl bg-rose-600 text-white font-semibold">Add to sphere</button>{message && <p className="mt-4 text-xs text-rose-300">{message}</p>}</form>
      <div className="space-y-3">{words.map((item) => editing?.id === item.id ? <EditRow key={item.id} item={item} onCancel={() => setEditing(null)} onSave={save} /> : <div key={item.id} className="glass-panel rounded-2xl p-4 border border-rose-300/10 flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center"><span className="font-serif text-rose-200">{item.word.slice(0, 1)}</span></div><div className="flex-1"><p className="font-serif text-lg text-white">{item.word}</p><p className="text-[10px] uppercase tracking-widest text-rose-300/40">Weight {item.weight}</p></div><button title={item.is_active ? 'Hide' : 'Show'} onClick={() => save(item.id, item.word, item.weight, !item.is_active)} className="p-2 text-rose-300/70 hover:text-white">{item.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button><button onClick={() => setEditing(item)} className="p-2 text-rose-300/70 hover:text-white"><Edit3 className="w-4 h-4" /></button><button onClick={() => remove(item.id)} className="p-2 text-rose-300/70 hover:text-rose-400"><Trash2 className="w-4 h-4" /></button></div>)}</div>
    </div>
  </div>;
};

const EditRow = ({ item, onCancel, onSave }) => { const [word, setWord] = useState(item.word); const [weight, setWeight] = useState(item.weight); const [active, setActive] = useState(item.is_active); return <div className="glass-panel rounded-2xl p-4 border border-rose-400/20 space-y-3"><input value={word} onChange={(e) => setWord(e.target.value)} maxLength={40} className="w-full px-3 py-2 rounded-xl bg-black/30 border border-rose-900/40 text-white" /><div className="flex items-center gap-3"><input type="range" min="1" max="5" value={weight} onChange={(e) => setWeight(e.target.value)} className="flex-1 accent-rose-500" /><button onClick={() => setActive(!active)} className="text-xs text-rose-200/70">{active ? 'Visible' : 'Hidden'}</button></div><div className="flex gap-2 justify-end"><button onClick={onCancel} className="px-3 py-2 rounded-lg text-xs text-rose-200/60"><X className="w-4 h-4" /></button><button onClick={() => onSave(item.id, word, weight, active)} className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs flex items-center gap-2"><Save className="w-3.5 h-3.5" />Save</button></div></div>; };

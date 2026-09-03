import React, { useEffect, useMemo, useState } from 'react';
import { Clock3, Heart, LockKeyhole, Plus, Send, Timer, Upload, X, Image as ImageIcon, FileAudio, FileVideo, FileText } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const formatRemaining = (ms) => {
  if (ms <= 0) return 'OPEN NOW';
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return d ? `${d}d ${String(h).padStart(2,'0')}h` : `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
};

const mediaIcon = (type) => type?.startsWith('image/') ? ImageIcon : type?.startsWith('audio/') ? FileAudio : type?.startsWith('video/') ? FileVideo : FileText;

export const TimeCapsulePage = () => {
  const [capsules, setCapsules] = useState([]);
  const [selected, setSelected] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [unlockAt, setUnlockAt] = useState('');
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const { data, error: e } = await supabase.from('time_capsules').select('*').order('unlock_at', { ascending: true });
    if (e) setError(e.message); else setCapsules(data || []);
  };

  useEffect(() => {
    load();
    const interval = setInterval(() => setNow(Date.now()), 1000);
    const channel = supabase.channel('time-capsules').on('postgres_changes', { event: '*', schema: 'public', table: 'time_capsules' }, load).subscribe();
    return () => { clearInterval(interval); supabase.removeChannel(channel); };
  }, []);

  const createCapsule = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim() || !unlockAt) return setError('Add a title, message and unlock time.');
    const unlock = new Date(unlockAt);
    if (Number.isNaN(unlock.getTime()) || unlock.getTime() <= Date.now()) return setError('Choose a future unlock time.');
    setSaving(true); setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please sign in first.');
      const uploaded = [];
      for (const file of files) {
        const path = `${user.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const { error: uploadError } = await supabase.storage.from('time-capsule-media').upload(path, file, { upsert: false });
        if (uploadError) throw uploadError;
        const { data: publicData } = supabase.storage.from('time-capsule-media').getPublicUrl(path);
        uploaded.push({ name: file.name, type: file.type || 'application/octet-stream', url: publicData.publicUrl });
      }
      const { error: insertError } = await supabase.from('time_capsules').insert({ title: title.trim(), message: message.trim(), unlock_at: unlock.toISOString(), media: uploaded, author_id: user.id });
      if (insertError) throw insertError;
      setTitle(''); setMessage(''); setUnlockAt(''); setFiles([]); setShowNew(false); await load();
    } catch (e) { setError(e.message || 'Could not create capsule.'); }
    finally { setSaving(false); }
  };

  const openCapsule = (capsule) => {
    if (new Date(capsule.unlock_at).getTime() > Date.now()) return;
    setSelected(capsule);
  };

  return <div className="min-h-[calc(100vh-5rem)] px-4 sm:px-6 py-10 sm:py-16">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-950/40 px-4 py-2 text-xs text-rose-300"><Timer className="w-4 h-4"/> Messages from another moment</div>
        <h1 className="mt-5 font-serif text-5xl sm:text-7xl italic text-white">Time Capsules</h1>
        <p className="mt-4 text-sm sm:text-base text-rose-200/65 max-w-xl mx-auto">Leave a message, photo, voice note, video or little piece of your world — then let time decide when it can be opened.</p>
        <button onClick={() => setShowNew(true)} className="mt-7 inline-flex items-center gap-2 rounded-full bg-rose-600 hover:bg-rose-500 px-6 py-3 text-sm font-semibold text-white"><Plus className="w-4 h-4"/> Create a capsule</button>
      </div>
      {error && <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-950/50 px-4 py-3 text-sm text-rose-200">{error}</div>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {capsules.map(c => {
          const locked = new Date(c.unlock_at).getTime() > now;
          return <button key={c.id} onClick={() => openCapsule(c)} className={`text-left rounded-[2rem] border p-6 transition-all ${locked ? 'border-rose-900/40 bg-rose-950/35 hover:border-rose-700/50' : 'border-rose-500/25 bg-rose-950/55 hover:-translate-y-1 hover:border-rose-400/50'}`}>
            <div className="flex justify-between items-start"><div className={`w-11 h-11 rounded-full flex items-center justify-center ${locked ? 'bg-black/25 text-rose-300/60' : 'bg-rose-600/20 text-rose-300'}`}>{locked ? <LockKeyhole className="w-5 h-5"/> : <Heart className="w-5 h-5 fill-rose-400/30"/>}</div><span className="text-[10px] uppercase tracking-[.18em] text-rose-300/50">{locked ? 'Locked' : 'Unlocked'}</span></div>
            <h2 className="mt-6 font-serif text-2xl text-white">{c.title}</h2>
            <div className="mt-3 flex items-center gap-2 font-mono text-sm text-rose-200"><Clock3 className="w-4 h-4"/>{formatRemaining(new Date(c.unlock_at).getTime() - now)}</div>
            {locked ? <p className="mt-3 text-xs text-rose-200/45">Opens {new Date(c.unlock_at).toLocaleString()}</p> : <p className="mt-3 text-xs text-rose-300/60">Click to open your memory.</p>}
          </button>;
        })}
      </div>
      {!capsules.length && <div className="text-center py-16 text-rose-200/50 font-serif italic">Nothing sealed yet. Create the first one. ❤️</div>}
    </div>

    {showNew && <div className="fixed inset-0 z-50 bg-velvet-950/90 backdrop-blur-xl p-4 sm:p-8 overflow-y-auto">
      <form onSubmit={createCapsule} className="max-w-2xl mx-auto my-6 sm:my-12 rounded-[2rem] border border-rose-500/20 bg-[#fff8ec] text-[#35151e] p-6 sm:p-9 shadow-2xl">
        <div className="flex justify-between items-center mb-6"><div><div className="text-[10px] uppercase tracking-[.25em] text-[#8b5362]">Seal a moment</div><h2 className="font-serif text-4xl italic">New Time Capsule</h2></div><button type="button" onClick={() => setShowNew(false)}><X/></button></div>
        <div className="space-y-4">
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Give it a name…" className="w-full rounded-2xl border border-[#a86b73]/25 bg-white/70 px-4 py-3 outline-none"/>
          <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Write the message that waits inside…" rows={7} className="w-full rounded-2xl border border-[#a86b73]/25 bg-white/70 px-4 py-3 outline-none resize-y"/>
          <label className="block text-sm font-semibold">Unlock date & time<input type="datetime-local" value={unlockAt} onChange={e=>setUnlockAt(e.target.value)} min={new Date(Date.now()+60000).toISOString().slice(0,16)} className="mt-2 w-full rounded-2xl border border-[#a86b73]/25 bg-white/70 px-4 py-3"/></label>
          <label className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#a86b73]/25 bg-white/40 px-4 py-6 cursor-pointer"><Upload className="w-5 h-5"/><span className="text-sm">Add photos, audio, videos or files</span><input type="file" multiple onChange={e=>setFiles(Array.from(e.target.files || []))} className="hidden"/></label>
          {files.length > 0 && <div className="flex flex-wrap gap-2">{files.map((f,i)=><span key={i} className="text-xs rounded-full bg-[#f4dbe2] px-3 py-1.5">{f.name}</span>)}</div>}
        </div>
        <button disabled={saving} className="mt-7 w-full rounded-2xl bg-[#5a1c2c] py-3 text-white font-semibold disabled:opacity-50">{saving ? 'Sealing…' : 'Seal the capsule ❤️'}</button>
      </form>
    </div>}

    {selected && <div className="fixed inset-0 z-[60] bg-velvet-950/95 backdrop-blur-xl overflow-y-auto p-4 sm:p-8" onClick={()=>setSelected(null)}>
      <div className="max-w-3xl mx-auto py-8" onClick={e=>e.stopPropagation()}>
        <div className="flex justify-end"><button onClick={()=>setSelected(null)} className="w-10 h-10 rounded-full bg-rose-950/70 text-rose-200"><X className="mx-auto"/></button></div>
        <article className="mt-4 rounded-[2rem] bg-[#fff8ec] text-[#35151e] p-6 sm:p-10 shadow-2xl"><div className="text-center text-xs uppercase tracking-[.2em] text-[#8b5362]">Opened after the wait</div><h2 className="mt-3 text-center font-serif text-4xl sm:text-5xl italic">{selected.title}</h2><p className="mt-7 whitespace-pre-wrap font-serif text-lg sm:text-xl leading-relaxed">{selected.message}</p>
          {Array.isArray(selected.media) && selected.media.length > 0 && <div className="mt-8 grid gap-5">{selected.media.map((m,i)=>{ const Icon=mediaIcon(m.type); return <div key={i} className="rounded-2xl overflow-hidden bg-[#f4e5d5]">{m.type.startsWith('image/') ? <img src={m.url} alt={m.name} className="w-full max-h-[60vh] object-contain"/> : m.type.startsWith('video/') ? <video controls className="w-full max-h-[60vh]" src={m.url}/> : m.type.startsWith('audio/') ? <div className="p-5 flex items-center gap-3"><Icon/><audio controls className="w-full" src={m.url}/></div> : <a href={m.url} target="_blank" rel="noreferrer" className="p-5 flex items-center gap-3 underline"><Icon/>{m.name}</a>}</div>;})}</div>}
        </article>
      </div>
    </div>}
  </div>;
};

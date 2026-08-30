import React, { useEffect, useMemo, useState } from 'react';
import { BookHeart, CalendarDays, Heart, Plus, Search, Star, Trash2, X, Save, Sparkles, Smile } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const MOODS = [
  { emoji: '🥰', label: 'In love' },
  { emoji: '❤️', label: 'Loved' },
  { emoji: '🫶', label: 'Grateful' },
  { emoji: '😂', label: 'Silly' },
  { emoji: '🥹', label: 'Emotional' },
  { emoji: '😍', label: 'Excited' },
  { emoji: '😌', label: 'Peaceful' },
  { emoji: '✨', label: 'Magical' },
  { emoji: '🌙', label: 'Nostalgic' },
  { emoji: '💌', label: 'Missing you' },
];

const EMPTY = { title: '', content: '', entry_date: new Date().toISOString().slice(0, 10), mood: 'In love', mood_emoji: '🥰', favorite: false };

export const JournalPage = () => {
  const [entries, setEntries] = useState([]);
  const [query, setQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState('All');
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadEntries = async () => {
    const { data, error: loadError } = await supabase.from('journal_entries').select('*').order('entry_date', { ascending: false }).order('created_at', { ascending: false });
    if (loadError) setError(loadError.message);
    else setEntries(data || []);
  };

  useEffect(() => {
    loadEntries();
    const channel = supabase.channel('journal-live').on('postgres_changes', { event: '*', schema: 'public', table: 'journal_entries' }, loadEntries).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = useMemo(() => entries.filter((entry) => {
    const matchesText = !query || [entry.title, entry.content, entry.mood].join(' ').toLowerCase().includes(query.toLowerCase());
    const matchesMood = moodFilter === 'All' || entry.mood_emoji === moodFilter;
    return matchesText && matchesMood;
  }), [entries, query, moodFilter]);

  const openNew = () => { setForm(EMPTY); setError(''); setEditorOpen(true); };
  const openEdit = (entry) => { setForm({ ...entry }); setError(''); setEditorOpen(true); };

  const save = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true); setError('');
    const payload = { title: form.title.trim(), content: form.content.trim(), entry_date: form.entry_date, mood: form.mood, mood_emoji: form.mood_emoji, favorite: Boolean(form.favorite) };
    const result = form.id
      ? await supabase.from('journal_entries').update(payload).eq('id', form.id).select('*').single()
      : await supabase.from('journal_entries').insert(payload).select('*').single();
    setSaving(false);
    if (result.error) { setError(result.error.message); return; }
    setEditorOpen(false); await loadEntries();
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this journal entry?')) return;
    const { error: deleteError } = await supabase.from('journal_entries').delete().eq('id', id);
    if (deleteError) setError(deleteError.message); else await loadEntries();
  };

  const toggleFavorite = async (entry) => {
    const { error: updateError } = await supabase.from('journal_entries').update({ favorite: !entry.favorite }).eq('id', entry.id);
    if (updateError) setError(updateError.message); else await loadEntries();
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] pb-20">
      <section className="relative overflow-hidden px-4 pt-12 sm:pt-16 pb-10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-72 h-72 rounded-full bg-rose-600/10 blur-3xl -top-20 left-1/2 -translate-x-1/2" />
          <Heart className="absolute top-16 left-[12%] w-7 h-7 text-rose-400/20 fill-rose-400/10 rotate-12" />
          <Sparkles className="absolute top-28 right-[13%] w-6 h-6 text-rose-300/20" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-950/40 px-4 py-2 text-xs text-rose-300 mb-5">
            <BookHeart className="w-4 h-4" /> Little pieces of us
          </div>
          <h1 className="font-serif text-4xl sm:text-6xl font-bold text-white">Our Journal</h1>
          <p className="mt-4 text-sm sm:text-base text-rose-200/65 max-w-xl mx-auto leading-relaxed">The thoughts, tiny moments, inside jokes and feelings we never want to forget. ❤️</p>
          <button onClick={openNew} className="mt-7 inline-flex items-center gap-2 rounded-full bg-rose-600 hover:bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-rose-950/40 transition-all">
            <Plus className="w-4 h-4" /> Write a memory
          </button>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="glass-panel rounded-3xl p-3 sm:p-4 mb-8 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400/60" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search our story..." className="w-full rounded-2xl bg-velvet-950/70 border border-rose-900/40 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-rose-500/50" />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <button onClick={() => setMoodFilter('All')} className={`shrink-0 rounded-2xl px-4 py-2.5 text-xs border ${moodFilter === 'All' ? 'bg-rose-600 text-white border-rose-500' : 'bg-velvet-950/70 text-rose-200/70 border-rose-900/40'}`}>All</button>
            {MOODS.map((mood) => <button key={mood.emoji} title={mood.label} onClick={() => setMoodFilter(mood.emoji)} className={`shrink-0 rounded-2xl px-3 py-2 text-base border ${moodFilter === mood.emoji ? 'bg-rose-900/70 border-rose-500/50' : 'bg-velvet-950/70 border-rose-900/40'}`}>{mood.emoji}</button>)}
          </div>
        </div>

        {error && <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">{error}</div>}

        {filtered.length === 0 ? (
          <div className="glass-panel rounded-[2rem] text-center py-16 px-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-rose-950/70 flex items-center justify-center mb-5"><BookHeart className="w-7 h-7 text-rose-400" /></div>
            <h2 className="font-serif text-2xl text-white">Our first page is waiting</h2>
            <p className="text-sm text-rose-200/60 mt-2 mb-6">Write down a little moment you'll want to read again someday.</p>
            <button onClick={openNew} className="rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white"><Plus className="inline w-4 h-4 mr-1" /> Start the journal</button>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-5 sm:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-rose-500/30 via-rose-900/40 to-transparent" />
            <div className="space-y-8 sm:space-y-12">
              {filtered.map((entry, index) => (
                <article key={entry.id} className={`relative sm:w-[calc(50%-2rem)] ${index % 2 ? 'sm:ml-auto' : ''}`}>
                  <div className="absolute left-[0.95rem] sm:left-auto sm:right-[-2.55rem] top-6 w-3 h-3 rounded-full bg-rose-500 ring-4 ring-velvet-950 shadow-lg shadow-rose-500/40" style={index % 2 ? { left: '-2.55rem' } : {}} />
                  <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-rose-900/30 hover:border-rose-500/30 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[.16em] text-rose-300/60"><CalendarDays className="w-3.5 h-3.5" />{new Date(entry.entry_date + 'T12:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      <button onClick={() => toggleFavorite(entry)} className="p-1.5 rounded-full" aria-label="Favorite">{entry.favorite ? <Star className="w-4 h-4 text-amber-300 fill-amber-300" /> : <Star className="w-4 h-4 text-rose-300/40" />}</button>
                    </div>
                    <div className="flex items-center gap-2 mt-4"><span className="text-2xl">{entry.mood_emoji || '❤️'}</span><span className="text-xs text-rose-300/60">{entry.mood || 'A little feeling'}</span></div>
                    <h2 className="font-serif text-2xl font-semibold text-white mt-2">{entry.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-rose-100/75 whitespace-pre-wrap break-words">{entry.content}</p>
                    <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-rose-900/30">
                      <button onClick={() => openEdit(entry)} className="text-xs px-3 py-2 rounded-xl bg-rose-950/60 text-rose-200">Edit</button>
                      <button onClick={() => remove(entry.id)} className="text-xs px-3 py-2 rounded-xl bg-rose-950/60 text-rose-300"><Trash2 className="w-3.5 h-3.5 inline mr-1" />Delete</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      {editorOpen && (
        <div className="fixed inset-0 z-50 bg-velvet-950/90 backdrop-blur-xl overflow-y-auto p-4 sm:p-6">
          <div className="min-h-full flex items-center justify-center">
            <form onSubmit={save} className="w-full max-w-2xl glass-panel rounded-[2rem] p-5 sm:p-8 border border-rose-500/25 shadow-2xl">
              <div className="flex items-start justify-between mb-6">
                <div><div className="text-xs uppercase tracking-[.2em] text-rose-400">A page from our story</div><h2 className="font-serif text-3xl text-white mt-1">{form.id ? 'Edit entry' : 'Write a new entry'}</h2></div>
                <button type="button" onClick={() => setEditorOpen(false)} className="p-2 rounded-full bg-rose-950/70 text-rose-200"><X /></button>
              </div>
              <div className="space-y-4">
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Give this moment a title..." className="w-full rounded-2xl bg-velvet-950 border border-rose-900/40 p-4 text-lg text-white font-serif outline-none focus:border-rose-500/50" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="rounded-2xl bg-velvet-950 border border-rose-900/40 p-3"><span className="block text-[10px] uppercase tracking-wider text-rose-300/60 mb-2">Date</span><input type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} className="w-full bg-transparent text-sm text-white outline-none" /></label>
                  <div className="rounded-2xl bg-velvet-950 border border-rose-900/40 p-3"><span className="block text-[10px] uppercase tracking-wider text-rose-300/60 mb-2">Feeling</span><div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">{MOODS.map((mood) => <button type="button" key={mood.emoji} title={mood.label} onClick={() => setForm({ ...form, mood: mood.label, mood_emoji: mood.emoji })} className={`shrink-0 text-2xl p-1 rounded-xl ${form.mood_emoji === mood.emoji ? 'bg-rose-900/70 ring-1 ring-rose-500/50' : ''}`}>{mood.emoji}</button>)}</div></div>
                </div>
                <textarea required rows="10" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Write whatever you want to remember... emojis are welcome ❤️✨" className="w-full resize-none rounded-2xl bg-velvet-950 border border-rose-900/40 p-4 text-sm leading-7 text-white outline-none focus:border-rose-500/50" />
                <label className="flex items-center gap-3 text-sm text-rose-200/80"><input type="checkbox" checked={form.favorite} onChange={(e) => setForm({ ...form, favorite: e.target.checked })} className="accent-rose-600 w-4 h-4" /><Star className="w-4 h-4 text-amber-300" /> Keep this one close to our hearts</label>
                {error && <p className="text-sm text-rose-300">{error}</p>}
                <button disabled={saving} className="w-full rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 py-3.5 text-sm font-semibold text-white"><Save className="inline w-4 h-4 mr-2" />{saving ? 'Saving...' : 'Save to our story ❤️'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

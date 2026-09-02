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

const EMOJIS = ['❤️','🥰','🫶','😘','😍','😂','🥹','😭','✨','🌙','💌','💋','💕','💗','💖','💞','💓','💫','🌹','🌸','☀️','🌧️','⭐','🦋','🍓','☕','🎀','🎵','📸','✈️','🏠','🥳','🤭','😌','😏','😊','🙈','💭','🫂','🤍','🩷','💐','🍰','🎂','🎁','🌎'];
const EMPTY = { title: '', content: '', entry_date: new Date().toISOString().slice(0, 10), mood: 'In love', mood_emoji: '🥰', author: 'both', favorite: false };

export const JournalPage = () => {
  const [entries, setEntries] = useState([]);
  const [query, setQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState('All');
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [bookOpen, setBookOpen] = useState(false);
  const [openingBook, setOpeningBook] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

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

  const openNew = () => { setForm(EMPTY); setError(''); setEmojiOpen(false); setEditorOpen(true); };
  const startOpeningBook = () => { if (openingBook) return; setOpeningBook(true); window.setTimeout(() => setBookOpen(true), 2800); };
  const openEdit = (entry) => { setForm({ ...entry }); setError(''); setEmojiOpen(false); setSelectedEntry(null); setEditorOpen(true); };
  const openEntry = (entry) => { setSelectedEntry(entry); setError(''); };

  const save = async (event) => {
    event.preventDefault();
    if (!form.content.trim()) { setError('Please write something on this page before saving.'); return; }
    setSaving(true); setError('');
    const payload = { title: form.title.trim() || 'A little memory', content: form.content.trim(), entry_date: form.entry_date, mood: form.mood, mood_emoji: form.mood_emoji, author: form.author || 'both', favorite: Boolean(form.favorite) };
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

  if (!bookOpen) return (<div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-5 py-16 relative overflow-hidden"><style>{`@keyframes bookHover {0%,100%{transform:translateY(0) rotateY(0deg)}50%{transform:translateY(-8px) rotateY(-2deg)}}
@keyframes coverOpen {0%{transform:rotateY(0deg) translateZ(0);opacity:1}18%{transform:rotateY(-15deg) translateZ(10px)}48%{transform:rotateY(-85deg) translateX(-4%)}72%{transform:rotateY(-145deg) translateX(-9%);opacity:.85}100%{transform:rotateY(-178deg) translateX(-15%);opacity:0;visibility:hidden}}
@keyframes pageFly {0%{transform:translate3d(0,12px,0) rotate(0deg) scale(.82);opacity:0}14%{opacity:.9}48%{transform:translate3d(calc((var(--i) - 2.5) * 22px),calc(-65px - var(--i) * 8px),30px) rotate(calc((var(--i) - 2.5) * 15deg)) scale(1)}78%{transform:translate3d(calc((var(--i) - 2.5) * 52px),calc(-125px - var(--i) * 12px),60px) rotate(calc((var(--i) - 2.5) * 28deg)) scale(.86);opacity:.65}100%{transform:translate3d(calc((var(--i) - 2.5) * 82px),calc(-175px - var(--i) * 18px),90px) rotate(calc((var(--i) - 2.5) * 42deg)) scale(.62);opacity:0}}
@keyframes innerBook {0%{opacity:0;transform:rotateY(-90deg) scale(.9)}55%{opacity:1}100%{opacity:1;transform:rotateY(0) scale(1)}}
@keyframes petalFloat {0%{opacity:0;transform:translateY(30px) scale(.6)}20%{opacity:.8}100%{opacity:0;transform:translate(20px,-190px) rotate(220deg) scale(1)}}
.book-cover{animation:bookHover 5s ease-in-out infinite;transform-origin:left center;transform-style:preserve-3d}
.book-stage{transform-style:preserve-3d}
.opening-cover{animation:coverOpen 2.35s cubic-bezier(.18,.72,.15,1) forwards}
.opening-cover .book-pages{animation:innerBook 1.05s 1.05s cubic-bezier(.2,.8,.2,1) forwards}
.book-pages{position:absolute;inset:2%;opacity:0;transform-origin:left center;border-radius:0 1rem 1rem 0;background:linear-gradient(90deg,#9d7258 0,#ead9c5 5%,#f7ebd8 50%,#e3c8ac 100%);border:1px solid rgba(185,145,108,.5);box-shadow:0 22px 50px rgba(0,0,0,.45);pointer-events:none;overflow:visible;transform-style:preserve-3d}
.flying-page{position:absolute;left:39%;top:32%;width:26%;height:35%;background:linear-gradient(135deg,#fff5e5,#d7b795);border:1px solid rgba(105,62,38,.22);box-shadow:0 10px 22px rgba(40,12,8,.3);border-radius:2px;opacity:0}
.opening-cover .flying-page{animation:pageFly 1.65s calc(.82s + var(--i)*.12s) cubic-bezier(.18,.78,.18,1) forwards}
.opening-cover::after{content:'❤️';position:absolute;left:47%;top:48%;font-size:22px;opacity:0;animation:petalFloat 1.9s 1.25s ease-out forwards;filter:drop-shadow(0 0 12px rgba(244,114,182,.5))}
@media (prefers-reduced-motion:reduce){.book-cover{animation:none}.opening-cover{animation:none;opacity:0}.opening-cover .book-pages{animation:none;opacity:1}.opening-cover .flying-page{animation:none;opacity:0}}`}</style><div className="absolute inset-0 pointer-events-none"><div className="absolute w-96 h-96 rounded-full bg-rose-600/10 blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"/><Heart className="absolute top-24 left-[12%] text-rose-400/10 fill-rose-400/5 w-12 h-12"/><Sparkles className="absolute top-32 right-[14%] text-rose-300/15 w-8 h-8"/></div><div className="relative z-10 text-center"><p className="text-[10px] uppercase tracking-[.4em] text-rose-300/60 mb-5">A story written by two</p><button onClick={startOpeningBook} disabled={openingBook} className={`book-cover group relative block mx-auto w-[min(82vw,430px)] aspect-[1.38] rounded-r-[1.4rem] rounded-l-lg bg-gradient-to-br from-rose-950 via-[#3b0d1b] to-[#17050c] border border-rose-300/20 shadow-[0_35px_80px_rgba(0,0,0,.65)] ${openingBook ? 'opening-cover' : ''}`}><div className="absolute left-0 top-0 bottom-0 w-[7%] rounded-l-lg bg-gradient-to-r from-[#16040a] to-rose-900/40 border-r border-rose-300/10"/><div className="book-pages"><span className="absolute inset-[8%] border border-[#9d7658]/30 rounded"/><span className="flying-page" style={{'--i':0}}/><span className="flying-page" style={{'--i':1}}/><span className="flying-page" style={{'--i':2}}/><span className="flying-page" style={{'--i':3}}/><span className="flying-page" style={{'--i':4}}/><span className="flying-page" style={{'--i':5}}/></div><div className="absolute inset-[9%] border border-rose-300/15 rounded-r-[1rem] flex flex-col items-center justify-center"><BookHeart className="w-12 h-12 text-rose-300/80 mb-4"/><span className="font-serif text-4xl sm:text-5xl italic text-rose-100">Our Journal</span><span className="mt-3 text-[9px] uppercase tracking-[.35em] text-rose-300/50">little pieces of us</span><span className="mt-8 px-4 py-2 rounded-full border border-rose-300/15 bg-black/15 text-[10px] uppercase tracking-[.2em] text-rose-200/60 group-hover:text-white">{openingBook ? 'Opening our story…' : 'Open the book'}</span></div><Heart className="absolute bottom-[9%] right-[9%] w-5 h-5 text-rose-300/40 fill-rose-300/20"/></button><p className="mt-7 text-sm text-rose-100/40 italic">Every page keeps a little piece of us.</p></div></div>);

  return (
    <div className="journal-book min-h-[calc(100vh-5rem)] pb-20">
      <style>{`@keyframes pageTurn {0%{opacity:0;transform:perspective(1200px) rotateY(-12deg) translateX(-20px)}100%{opacity:1;transform:none}} .journal-book{animation:pageTurn .75s cubic-bezier(.2,.8,.2,1) both} @media (prefers-reduced-motion:reduce){.journal-book{animation:none}}`}</style><section className="relative overflow-hidden px-4 pt-8 sm:pt-12 pb-8">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-72 h-72 rounded-full bg-rose-600/10 blur-3xl -top-20 left-1/2 -translate-x-1/2" />
          <Heart className="absolute top-16 left-[12%] w-7 h-7 text-rose-400/20 fill-rose-400/10 rotate-12" />
          <Sparkles className="absolute top-28 right-[13%] w-6 h-6 text-rose-300/20" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center"><button onClick={()=>setBookOpen(false)} className="absolute left-0 top-0 text-xs text-rose-300/60 hover:text-white">← Close book</button>
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-950/40 px-4 py-2 text-xs text-rose-300 mb-5">
            <BookHeart className="w-4 h-4" /> Little pieces of us
          </div>
          <BookHeart className="mx-auto w-8 h-8 text-rose-300/70 mb-3"/><h1 className="font-serif text-4xl sm:text-6xl italic text-white">Our Journal</h1>
          <p className="mt-4 text-sm sm:text-base text-rose-200/65 max-w-xl mx-auto leading-relaxed">The thoughts, tiny moments, inside jokes and feelings we never want to forget. ❤️</p>
          <button onClick={openNew} className="mt-7 inline-flex items-center gap-2 rounded-full bg-rose-600 hover:bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-rose-950/40 transition-all">
            <Plus className="w-4 h-4" /> Write a memory
          </button>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="glass-panel rounded-3xl p-3 sm:p-4 mb-8 flex flex-col sm:flex-row gap-3"><button onClick={openNew} className="sm:order-last shrink-0 rounded-2xl bg-rose-600 px-4 py-3 text-xs font-semibold text-white"><Plus className="inline w-4 h-4 mr-1"/> New page</button>
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
                  <button type="button" onClick={() => openEntry(entry)} className="w-full text-left glass-panel rounded-3xl p-5 sm:p-6 border border-rose-900/30 hover:border-rose-500/40 hover:-translate-y-0.5 transition-all cursor-pointer group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[.16em] text-rose-300/60"><CalendarDays className="w-3.5 h-3.5" />{new Date(entry.entry_date + 'T12:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      <span onClick={(e) => { e.stopPropagation(); toggleFavorite(entry); }} role="button" tabIndex={0} className="p-1.5 rounded-full" aria-label="Favorite">{entry.favorite ? <Star className="w-4 h-4 text-amber-300 fill-amber-300" /> : <Star className="w-4 h-4 text-rose-300/40" />}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 mt-3"><div><span className="text-xl">{entry.mood_emoji || '❤️'}</span><span className="text-xs text-rose-300/60 ml-2">{entry.mood || 'A little feeling'}</span></div><span className="text-xs text-rose-300/50">{entry.author === 'his' ? '🖤 Him' : entry.author === 'her' ? '💗 Her' : '💞 Both'}</span></div>
                    <h2 className="font-serif text-xl sm:text-2xl font-semibold text-white mt-2">{entry.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-rose-100/65 line-clamp-3">{entry.content}</p>
                    <span className="mt-3 inline-flex text-[10px] uppercase tracking-[.18em] text-rose-300/50 group-hover:text-rose-200 transition-colors">Open this page →</span>
                  </button>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      {selectedEntry && (
        <div className="fixed inset-0 z-50 bg-velvet-950/90 backdrop-blur-xl overflow-y-auto p-4 sm:p-8" onClick={() => setSelectedEntry(null)}>
          <div className="min-h-full flex items-center justify-center py-6 sm:py-10">
            <article onClick={(e) => e.stopPropagation()} className="relative w-full max-w-4xl min-h-[78vh] rounded-[2rem] sm:rounded-[2.5rem] border border-rose-300/15 bg-[#fff8ec] text-[#35151e] shadow-[0_35px_100px_rgba(0,0,0,.65)] overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-3 sm:w-5 bg-gradient-to-r from-[#9c6d4f] via-[#ead4b7] to-transparent opacity-80" />
              <div className="absolute inset-0 pointer-events-none opacity-30" style={{backgroundImage:'repeating-linear-gradient(0deg, transparent 0, transparent 31px, rgba(130,82,55,.16) 32px)'}} />
              <button type="button" onClick={() => setSelectedEntry(null)} aria-label="Close entry" className="absolute right-4 top-4 z-20 w-10 h-10 rounded-full bg-[#5a1c2c]/10 text-[#5a1c2c] hover:bg-[#5a1c2c]/20 cursor-pointer"><X className="w-5 h-5 mx-auto" /></button>
              <div className="relative z-10 px-7 py-10 sm:px-16 sm:py-14 md:px-20">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] uppercase tracking-[.2em] text-[#8b5362]">
                  <span>{new Date(selectedEntry.entry_date + 'T12:00:00').toLocaleDateString(undefined, { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</span>
                  <span>•</span>
                  <span>{selectedEntry.author === 'his' ? '🖤 Him' : selectedEntry.author === 'her' ? '💗 Her' : '💞 Both of us'}</span>
                  <span>•</span>
                  <span>{selectedEntry.mood_emoji || '❤️'} {selectedEntry.mood || 'A little feeling'}</span>
                </div>
                <h2 className="mt-8 font-serif text-4xl sm:text-6xl italic leading-tight text-[#4a1724]">{selectedEntry.title}</h2>
                <div className="mt-8 h-px bg-[#a86b73]/25" />
                <p className="mt-9 whitespace-pre-wrap break-words font-serif text-lg sm:text-xl leading-[2] text-[#4a2630]">{selectedEntry.content}</p>
                <div className="mt-12 pt-5 border-t border-[#a86b73]/20 flex flex-wrap items-center justify-between gap-3">
                  <button type="button" onClick={() => toggleFavorite(selectedEntry)} className="inline-flex items-center gap-2 text-sm text-[#8b5362]">{selectedEntry.favorite ? <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> : <Star className="w-4 h-4" />} {selectedEntry.favorite ? 'Close to our hearts' : 'Keep this one close'}</button>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => openEdit(selectedEntry)} className="text-xs px-4 py-2 rounded-xl bg-[#5a1c2c]/10 text-[#5a1c2c]">Edit</button>
                    <button type="button" onClick={() => { setSelectedEntry(null); remove(selectedEntry.id); }} className="text-xs px-4 py-2 rounded-xl bg-[#5a1c2c]/10 text-[#8b5362]"><Trash2 className="w-3.5 h-3.5 inline mr-1" />Delete</button>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      )}

      {editorOpen && (
        <div className="fixed inset-0 z-50 bg-velvet-950/90 backdrop-blur-xl overflow-y-auto p-4 sm:p-6">
          <div className="min-h-full flex items-center justify-center py-4">
            <form onSubmit={save} className="w-full max-w-2xl glass-panel rounded-[2rem] p-5 sm:p-8 border border-rose-500/25 shadow-2xl">
              <div className="flex items-start justify-between mb-6">
                <div><div className="text-xs uppercase tracking-[.2em] text-rose-400">A page from our story</div><h2 className="font-serif text-3xl text-white mt-1">{form.id ? 'Edit entry' : 'Write a new entry'}</h2></div>
                <button type="button" onClick={() => setEditorOpen(false)} className="p-2 rounded-full bg-rose-950/70 text-rose-200"><X /></button>
              </div>
              <div className="space-y-4">
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Give this moment a title... (optional)" className="w-full rounded-2xl bg-velvet-950 border border-rose-900/40 p-4 text-lg text-white font-serif outline-none focus:border-rose-500/50" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="rounded-2xl bg-velvet-950 border border-rose-900/40 p-3"><span className="block text-[10px] uppercase tracking-wider text-rose-300/60 mb-2">Date</span><input type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} className="w-full bg-transparent text-sm text-white outline-none" /></label>
                  <label className="rounded-2xl bg-velvet-950 border border-rose-900/40 p-3"><span className="block text-[10px] uppercase tracking-wider text-rose-300/60 mb-2">Written by</span><select value={form.author || 'both'} onChange={(e)=>setForm({...form,author:e.target.value})} className="w-full bg-transparent text-sm text-white outline-none"><option value="his" className="bg-[#17050c]">Him</option><option value="her" className="bg-[#17050c]">Her</option><option value="both" className="bg-[#17050c]">Both of us</option></select></label><div className="rounded-2xl bg-velvet-950 border border-rose-900/40 p-3"><span className="block text-[10px] uppercase tracking-wider text-rose-300/60 mb-2">Feeling</span><div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">{MOODS.map((mood) => <button type="button" key={mood.emoji} title={mood.label} onClick={() => setForm({ ...form, mood: mood.label, mood_emoji: mood.emoji })} className={`shrink-0 text-2xl p-1 rounded-xl ${form.mood_emoji === mood.emoji ? 'bg-rose-900/70 ring-1 ring-rose-500/50' : ''}`}>{mood.emoji}</button>)}</div></div>
                </div>
                <div className="relative"><textarea required rows="10" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Write whatever you want to remember... emojis are welcome ❤️✨" className="w-full resize-none rounded-2xl bg-velvet-950 border border-rose-900/40 p-4 pr-14 text-sm leading-7 text-white outline-none focus:border-rose-500/50" /><button type="button" onClick={()=>setEmojiOpen(!emojiOpen)} aria-label="Open emoji picker" title="Add emoji" className="absolute right-3 top-3 w-9 h-9 rounded-xl bg-rose-900/60 border border-rose-700/40 text-xl hover:bg-rose-800/70"><Smile className="w-5 h-5 mx-auto text-rose-200"/></button></div>{emojiOpen && <div className="rounded-2xl border border-rose-800/40 bg-[#17050c] p-3 shadow-2xl"><div className="grid grid-cols-8 sm:grid-cols-12 gap-1.5 max-h-44 overflow-y-auto">{EMOJIS.map((emoji,index)=><button type="button" key={index} onClick={()=>setForm({...form,content:form.content+emoji})} className="text-xl sm:text-2xl p-1.5 rounded-lg hover:bg-rose-900/60 active:scale-90 transition-transform">{emoji}</button>)}</div></div>}
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

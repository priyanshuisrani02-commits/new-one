import React, { useEffect, useMemo, useState } from 'react';
import { BookHeart, CalendarDays, Heart, Plus, Search, Star, Trash2, X, Save, Sparkles, Smile, PenLine, Send } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { LiveJournalMessageActions } from '../components/LiveJournalMessageActions';

const MOODS = [
  { emoji: '🥰', label: 'In love' }, { emoji: '❤️', label: 'Loved' }, { emoji: '🫶', label: 'Grateful' },
  { emoji: '😂', label: 'Silly' }, { emoji: '🥹', label: 'Emotional' }, { emoji: '😍', label: 'Excited' },
  { emoji: '😌', label: 'Peaceful' }, { emoji: '✨', label: 'Magical' }, { emoji: '🌙', label: 'Nostalgic' }, { emoji: '💌', label: 'Missing you' },
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
  const [liveOpen, setLiveOpen] = useState(false);
  const [liveMessages, setLiveMessages] = useState([]);
  const [liveText, setLiveText] = useState('');
  const [liveUserId, setLiveUserId] = useState(null);
  const [liveUnread, setLiveUnread] = useState(0);
  const [liveEmojiOpen, setLiveEmojiOpen] = useState(false);
  const [liveReactions, setLiveReactions] = useState([]);
  const liveMessagesRef = React.useRef(null);
  const liveInitialScrollRef = React.useRef(false);
  const liveMessagesSnapshotRef = React.useRef([]);
  const liveShouldStickToBottomRef = React.useRef(true);

  const loadEntries = async () => {
    const { data, error: loadError } = await supabase.from('journal_entries').select('*').order('entry_date', { ascending: false }).order('created_at', { ascending: false });
    if (loadError) setError(loadError.message); else setEntries(data || []);
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
  const openNormalJournal = () => { if (openingBook) return; setLiveOpen(false); setOpeningBook(true); window.setTimeout(() => setBookOpen(true), 2800); };
  const openEdit = (entry) => { setForm({ ...entry }); setError(''); setEmojiOpen(false); setSelectedEntry(null); setEditorOpen(true); };
  const openEntry = (entry) => { setSelectedEntry(entry); setError(''); };

  const openLiveJournal = () => {
    setBookOpen(false); setOpeningBook(false); setLiveOpen(true); setLiveUnread(0); liveInitialScrollRef.current = true; setError(''); loadLiveJournal();
  };

  const loadLiveJournal = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setLiveUserId(user?.id || null);
      const { data, error: liveError } = await supabase.from('live_journal_messages').select('*').order('created_at', { ascending: true });
      if (liveError) { setError(liveError.message); return; }
      const messages = data || [];
      liveMessagesSnapshotRef.current = messages;
      setLiveMessages(messages);
      const { data: reactionRows } = await supabase.from('live_journal_reactions').select('id,message_id,user_id,emoji');
      setLiveReactions(reactionRows || []);
      const savedLastRead = window.localStorage.getItem('live-journal-last-read');
      const unreadIndex = savedLastRead ? messages.findIndex((m) => m.id === savedLastRead) + 1 : messages.length;
      const targetIndex = unreadIndex >= 0 && unreadIndex < messages.length ? unreadIndex : Math.max(messages.length - 1, 0);
      window.setTimeout(() => {
        const box = liveMessagesRef.current;
        if (!box || !messages.length) return;
        box.children[targetIndex]?.scrollIntoView({ block: 'center' });
        window.setTimeout(() => window.localStorage.setItem('live-journal-last-read', messages[messages.length - 1].id), 300);
      }, 100);
    } catch (e) { setError(e?.message || 'Could not open Live Journal.'); }
  };

  const liveChannelRef = React.useRef(null);

  useEffect(() => {
    if (!liveOpen) return undefined;

    let disposed = false;

    const syncLatestMessages = async () => {
      const { data, error } = await supabase
        .from('live_journal_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (disposed || error || !data) return;

      setLiveMessages((prev) => {
        const pending = prev.filter((message) => message.__optimistic);
        const merged = [...data, ...pending.filter((pendingMessage) => !data.some(
          (message) => message.client_id && message.client_id === pendingMessage.client_id
        ))];
        liveMessagesSnapshotRef.current = merged;
        return merged;
      });
    };

    // Realtime is the fast path; this short-lived sync loop is a reliability
    // fallback while the Live Journal is actually open.
    syncLatestMessages();
    const poll = window.setInterval(syncLatestMessages, 500);

    const messageChannel = supabase
      .channel(`live-journal-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_journal_messages' }, (payload) => {
        setLiveMessages((prev) => {
          const existing = prev.find(
            (m) => m.id === payload.new.id ||
              (m.client_id && payload.new.client_id && m.client_id === payload.new.client_id)
          );
          const next = existing
            ? prev.map((m) => (m.id === existing.id || (m.client_id && payload.new.client_id && m.client_id === payload.new.client_id)) ? payload.new : m)
            : [...prev, payload.new];
          liveMessagesSnapshotRef.current = next;
          return next;
        });
      })
      .subscribe();

    return () => {
      disposed = true;
      window.clearInterval(poll);
      liveChannelRef.current = null;
      supabase.removeChannel(messageChannel);
    };
  }, [liveOpen]);


  useEffect(() => {
    if (!liveOpen) return;
    if (liveInitialScrollRef.current) { liveInitialScrollRef.current = false; return; }
    const box = liveMessagesRef.current;
    if (box && liveShouldStickToBottomRef.current) {
      box.scrollTop = box.scrollHeight;
    }
  }, [liveMessages, liveOpen]);

  const handleLiveScroll = () => {
    const box = liveMessagesRef.current;
    if (!box) return;
    const distanceFromBottom = box.scrollHeight - box.scrollTop - box.clientHeight;
    liveShouldStickToBottomRef.current = distanceFromBottom < 80;
  };

  const addLiveMessage = (message) => {
    setLiveMessages((prev) => prev.some((m) => m.id === message.id) ? prev : [...prev, message]);
  };

  const sendLiveMessage = async (event) => {
    event.preventDefault();
    const content = liveText.trim();
    if (!content) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Please sign in to use Live Journal.'); return; }

    const clientId = crypto.randomUUID();
    const optimisticId = `pending-${clientId}`;
    const optimisticMessage = { id: optimisticId, client_id: clientId, content, author_id: user.id, created_at: new Date().toISOString(), __optimistic: true };
    liveMessagesSnapshotRef.current = [...liveMessagesSnapshotRef.current, optimisticMessage];
    setLiveMessages(liveMessagesSnapshotRef.current);
    setLiveText('');

    if (liveChannelRef.current) {
      liveChannelRef.current.send({
        type: 'broadcast',
        event: 'new-message',
        payload: { client_id: clientId, content, author_id: user.id, created_at: optimisticMessage.created_at },
      }).catch(() => {});
    }

    const { data, error: sendError } = await supabase.from('live_journal_messages').insert({ content, author_id: user.id, client_id: clientId }).select('*').single();
    if (sendError) {
      setLiveMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setError(sendError.message);
      return;
    }
    liveMessagesSnapshotRef.current = liveMessagesSnapshotRef.current.map((m) => m.id === optimisticId ? data : m);
    setLiveMessages(liveMessagesSnapshotRef.current);
  };

  const save = async (event) => {
    event.preventDefault();
    if (!form.content.trim()) { setError('Please write something on this page before saving.'); return; }
    setSaving(true); setError('');
    const payload = { title: form.title.trim() || 'A little memory', content: form.content.trim(), entry_date: form.entry_date, mood: form.mood, mood_emoji: form.mood_emoji, author: form.author || 'both', favorite: Boolean(form.favorite) };
    const result = form.id ? await supabase.from('journal_entries').update(payload).eq('id', form.id).select('*').single() : await supabase.from('journal_entries').insert(payload).select('*').single();
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

  if (!bookOpen && !liveOpen) return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-5 py-16 relative overflow-hidden">
      <style>{`@keyframes bookHover{0%,100%{transform:translateY(0) rotateY(0)}50%{transform:translateY(-8px) rotateY(-2deg)}}@keyframes coverOpen{0%{transform:rotateY(0);opacity:1}45%{transform:rotateY(-85deg)}100%{transform:rotateY(-178deg) translateX(-15%);opacity:0;visibility:hidden}}@keyframes pageFly{0%{opacity:0;transform:translateY(10px) scale(.8)}25%{opacity:.9}100%{opacity:0;transform:translate(calc((var(--i) - 2.5)*80px),calc(-160px - var(--i)*15px)) rotate(calc((var(--i) - 2.5)*35deg)) scale(.6)}}.book-cover{animation:bookHover 5s ease-in-out infinite;transform-style:preserve-3d}.opening-cover{animation:coverOpen 2.35s cubic-bezier(.18,.72,.15,1) forwards}.flying-page{position:absolute;left:39%;top:32%;width:26%;height:35%;background:#f4e4d0;border:1px solid rgba(105,62,38,.2);box-shadow:0 10px 22px rgba(40,12,8,.3);opacity:0}.opening-cover .flying-page{animation:pageFly 1.65s calc(.82s + var(--i)*.12s) cubic-bezier(.18,.78,.18,1) forwards}@media(prefers-reduced-motion:reduce){.book-cover{animation:none}.opening-cover{animation:none;opacity:0}}`}</style>
      <div className="absolute inset-0 pointer-events-none"><div className="absolute w-96 h-96 rounded-full bg-rose-600/10 blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"/></div>
      <div className="relative z-10 text-center w-full"><p className="text-[10px] uppercase tracking-[.4em] text-rose-300/60 mb-5">A story written by two</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10 max-w-5xl mx-auto">
          <button onClick={openNormalJournal} disabled={openingBook} className={`book-cover group relative block mx-auto w-[min(82vw,430px)] aspect-[1.38] rounded-r-[1.4rem] rounded-l-lg bg-gradient-to-br from-rose-950 via-[#3b0d1b] to-[#17050c] border border-rose-300/20 shadow-[0_35px_80px_rgba(0,0,0,.65)] ${openingBook ? 'opening-cover' : ''}`}>
            <div className="absolute left-0 top-0 bottom-0 w-[7%] rounded-l-lg bg-gradient-to-r from-[#16040a] to-rose-900/40 border-r border-rose-300/10"/>
            <div className="absolute inset-[9%] border border-rose-300/15 rounded-r-[1rem] flex flex-col items-center justify-center"><BookHeart className="w-12 h-12 text-rose-300/80 mb-4"/><span className="font-serif text-4xl sm:text-5xl italic text-rose-100">Our Journal</span><span className="mt-3 text-[9px] uppercase tracking-[.35em] text-rose-300/50">little pieces of us</span><span className="mt-8 px-4 py-2 rounded-full border border-rose-300/15 text-[10px] uppercase tracking-[.2em] text-rose-200/60">{openingBook ? 'Opening our story…' : 'Open the book'}</span></div>
            <span className="flying-page" style={{'--i':0}}/><span className="flying-page" style={{'--i':1}}/><span className="flying-page" style={{'--i':2}}/><span className="flying-page" style={{'--i':3}}/><span className="flying-page" style={{'--i':4}}/><span className="flying-page" style={{'--i':5}}/>
          </button>
          <button type="button" onClick={openLiveJournal} className="book-cover group relative block mx-auto w-[min(82vw,430px)] aspect-[1.38] rounded-r-[1.4rem] rounded-l-lg bg-gradient-to-br from-[#24152a] via-[#4b2039] to-[#130913] border border-fuchsia-300/20 shadow-[0_35px_80px_rgba(0,0,0,.65)]">
            <div className={`absolute -top-4 -right-4 z-20 flex items-center justify-center min-w-10 h-10 px-2 rounded-full bg-[#fff3df] text-[#7a243c] text-xs font-bold border-2 border-rose-300/40 shadow-lg ${liveUnread > 0 ? '' : 'hidden'}`}>{liveUnread > 99 ? '99+' : liveUnread}</div>
            <div className="absolute inset-[9%] border border-fuchsia-200/15 rounded-r-[1rem] flex flex-col items-center justify-center"><PenLine className="w-12 h-12 text-fuchsia-200/80 mb-4"/><span className="font-serif text-4xl sm:text-5xl italic text-fuchsia-100">Live Journal</span><span className="mt-3 text-[9px] uppercase tracking-[.35em] text-fuchsia-200/50">write together, now</span><span className="mt-8 px-4 py-2 rounded-full border border-fuchsia-200/15 text-[10px] uppercase tracking-[.2em] text-fuchsia-100/60">Open together</span></div>
          </button>
        </div>
        <p className="mt-7 text-sm text-rose-100/40 italic">One keeps our memories. One keeps us in the moment. ❤️</p>
      </div>
    </div>
  );

  return (
    <div className="journal-book min-h-[calc(100vh-5rem)] pb-20">
      <section className="relative overflow-hidden px-4 pt-8 sm:pt-12 pb-8"><div className="relative max-w-4xl mx-auto text-center"><button onClick={() => setBookOpen(false)} className="absolute left-0 top-0 text-xs text-rose-300/60 hover:text-white">← Close book</button><div className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-950/40 px-4 py-2 text-xs text-rose-300 mb-5"><BookHeart className="w-4 h-4"/> Little pieces of us</div><BookHeart className="mx-auto w-8 h-8 text-rose-300/70 mb-3"/><h1 className="font-serif text-4xl sm:text-6xl italic text-white">Our Journal</h1><p className="mt-4 text-sm sm:text-base text-rose-200/65 max-w-xl mx-auto">The thoughts, tiny moments, inside jokes and feelings we never want to forget. ❤️</p><button onClick={openNew} className="mt-7 inline-flex items-center gap-2 rounded-full bg-rose-600 hover:bg-rose-500 px-6 py-3 text-sm font-semibold text-white"><Plus className="w-4 h-4"/> Write a memory</button></div></section>
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="glass-panel rounded-3xl p-3 sm:p-4 mb-8 flex flex-col sm:flex-row gap-3"><button onClick={openNew} className="sm:order-last shrink-0 rounded-2xl bg-rose-600 px-4 py-3 text-xs font-semibold text-white"><Plus className="inline w-4 h-4 mr-1"/> New page</button><div className="relative flex-1"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400/60"/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search our story..." className="w-full rounded-2xl bg-velvet-950/70 border border-rose-900/40 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-rose-500/50"/></div><div className="flex gap-2 overflow-x-auto no-scrollbar pb-1"><button onClick={()=>setMoodFilter('All')} className={`shrink-0 rounded-2xl px-4 py-2.5 text-xs border ${moodFilter==='All'?'bg-rose-600 text-white border-rose-500':'bg-velvet-950/70 text-rose-200/70 border-rose-900/40'}`}>All</button>{MOODS.map(m=><button key={m.emoji} title={m.label} onClick={()=>setMoodFilter(m.emoji)} className={`shrink-0 rounded-2xl px-3 py-2 text-base border ${moodFilter===m.emoji?'bg-rose-900/70 border-rose-500/50':'bg-velvet-950/70 border-rose-900/40'}`}>{m.emoji}</button>)}</div></div>
        {error && <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">{error}</div>}
        {filtered.length===0 ? <div className="glass-panel rounded-[2rem] text-center py-16 px-6"><BookHeart className="mx-auto w-12 h-12 text-rose-400 mb-5"/><h2 className="font-serif text-2xl text-white">Our first page is waiting</h2><p className="text-sm text-rose-200/60 mt-2 mb-6">Write down a little moment you'll want to read again someday.</p><button onClick={openNew} className="rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white"><Plus className="inline w-4 h-4 mr-1"/> Start the journal</button></div> : <div className="relative"><div className="absolute left-5 sm:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-rose-500/30 via-rose-900/40 to-transparent"/><div className="space-y-8 sm:space-y-12">{filtered.map((entry,index)=><article key={entry.id} className={`relative sm:w-[calc(50%-2rem)] ${index%2?'sm:ml-auto':''}`}><div className="absolute left-[0.95rem] sm:left-auto sm:right-[-2.55rem] top-6 w-3 h-3 rounded-full bg-rose-500 ring-4 ring-velvet-950" style={index%2?{left:'-2.55rem'}:{}}/><button type="button" onClick={()=>openEntry(entry)} className="w-full text-left glass-panel rounded-3xl p-5 sm:p-6 border border-rose-900/30 hover:border-rose-500/40 transition-all"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2 text-[11px] uppercase tracking-[.16em] text-rose-300/60"><CalendarDays className="w-3.5 h-3.5"/>{new Date(entry.entry_date+'T12:00:00').toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})}</div><span onClick={(e)=>{e.stopPropagation();toggleFavorite(entry)}} role="button" className="p-1.5 rounded-full" aria-label="Favorite">{entry.favorite?<Star className="w-4 h-4 text-amber-300 fill-amber-300"/>:<Star className="w-4 h-4 text-rose-300/40"/>}</span></div><div className="flex items-center justify-between gap-3 mt-3"><div><span className="text-xl">{entry.mood_emoji||'❤️'}</span><span className="text-xs text-rose-300/60 ml-2">{entry.mood||'A little feeling'}</span></div><span className="text-xs text-rose-300/50">{entry.author==='his'?'🖤 Him':entry.author==='her'?'💗 Her':'💞 Both'}</span></div><h2 className="font-serif text-xl sm:text-2xl font-semibold text-white mt-2">{entry.title}</h2><p className="mt-2 text-sm leading-6 text-rose-100/65 line-clamp-3">{entry.content}</p><span className="mt-3 inline-flex text-[10px] uppercase tracking-[.18em] text-rose-300/50">Open this page →</span></button></article>)}</div></div>}
      </section>

      {liveOpen && <div className="fixed inset-0 z-[60] bg-velvet-950/95 backdrop-blur-xl overflow-y-auto p-4 sm:p-8"><div className="max-w-3xl mx-auto min-h-full py-4 sm:py-8"><div className="flex items-center justify-between mb-5"><div><div className="text-[10px] uppercase tracking-[.25em] text-fuchsia-300/60">Write together, now</div><h2 className="font-serif text-4xl italic text-white">Live Journal ✍️</h2><p className="text-xs text-rose-200/50 mt-1">Messages appear here instantly for both of you.</p></div><button type="button" onClick={()=>setLiveOpen(false)} aria-label="Close live journal" className="w-10 h-10 rounded-full bg-rose-950/70 text-rose-200"><X className="mx-auto"/></button></div>
        <div className="rounded-[2rem] border border-fuchsia-300/15 bg-[#fff8ec] text-[#35151e] min-h-[70vh] p-5 sm:p-9 shadow-2xl flex flex-col"><div className="text-center text-xs uppercase tracking-[.2em] text-[#8b5362] mb-6">Our shared pages · all time</div>
          <div ref={liveMessagesRef} onScroll={handleLiveScroll} className="flex-1 space-y-4 overflow-y-auto max-h-[58vh] pr-1">
            {liveMessages.length===0 && <div className="h-full min-h-64 flex items-center justify-center text-center font-serif italic text-[#8b5362]">The page is blank.<br/>Start writing together. ❤️</div>}
            {liveMessages.map((message)=><div key={message.id} className={`flex ${message.author_id===liveUserId?'justify-end':'justify-start'}`}><div className={`max-w-[88%] px-4 py-3 rounded-2xl shadow-sm ${message.author_id===liveUserId?'bg-[#f4dbe2] rounded-br-sm':'bg-[#f7ead8] rounded-bl-sm'}`}><span className="block text-[9px] font-sans uppercase tracking-[.15em] text-[#8b5362] mb-1">{message.author_id===liveUserId?'You':'Your person'} · {new Date(message.created_at).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}</span><div className="whitespace-pre-wrap break-words font-serif text-lg leading-relaxed">{message.content}</div><LiveJournalMessageActions message={message} userId={liveUserId} messages={liveMessages} reactions={liveReactions.filter((reaction) => reaction.message_id === message.id)} onSent={addLiveMessage} onReactionRefresh={async () => {
  const { data } = await supabase.from('live_journal_reactions').select('id,message_id,user_id,emoji');
  setLiveReactions(data || []);
}} /></div></div>)}
          </div>
          <form onSubmit={sendLiveMessage} className="mt-6 flex gap-2 border-t border-[#a86b73]/20 pt-5"><div className="relative"><button type="button" onClick={()=>setLiveEmojiOpen(!liveEmojiOpen)} className="h-12 w-12 rounded-2xl border border-[#a86b73]/25 bg-white/70 text-xl">😊</button>{liveEmojiOpen&&<div className="absolute bottom-14 left-0 z-10 w-72 rounded-2xl border border-[#a86b73]/25 bg-[#fff8ec] p-3 shadow-2xl"><div className="grid grid-cols-8 gap-1 max-h-40 overflow-y-auto">{EMOJIS.map((emoji,index)=><button type="button" key={index} onClick={()=>{setLiveText(v=>v+emoji);setLiveEmojiOpen(false)}} className="text-xl p-1 rounded-lg hover:bg-[#f4dbe2]">{emoji}</button>)}</div></div>}</div><input value={liveText} onChange={(e)=>setLiveText(e.target.value)} placeholder="Write something for them…" className="flex-1 rounded-2xl border border-[#a86b73]/25 bg-white/70 px-4 py-3 font-serif text-base outline-none focus:border-[#8b5362]/50"/><button type="submit" disabled={!liveText.trim()} className="rounded-2xl bg-[#5a1c2c] px-5 text-white disabled:opacity-40"><Send className="w-5 h-5"/></button></form>
        </div></div></div>}

      {selectedEntry && <div className="fixed inset-0 z-50 bg-velvet-950/90 backdrop-blur-xl overflow-y-auto p-4 sm:p-8" onClick={()=>setSelectedEntry(null)}><div className="min-h-full flex items-center justify-center py-6 sm:py-10"><article onClick={e=>e.stopPropagation()} className="relative w-full max-w-4xl min-h-[78vh] rounded-[2rem] border border-rose-300/15 bg-[#fff8ec] text-[#35151e] shadow-2xl overflow-hidden"><button type="button" onClick={()=>setSelectedEntry(null)} className="absolute right-4 top-4 z-20 w-10 h-10 rounded-full bg-[#5a1c2c]/10 text-[#5a1c2c]"><X className="w-5 h-5 mx-auto"/></button><div className="relative z-10 px-7 py-10 sm:px-16 sm:py-14 md:px-20"><div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] uppercase tracking-[.2em] text-[#8b5362]"><span>{new Date(selectedEntry.entry_date+'T12:00:00').toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</span><span>•</span><span>{selectedEntry.author==='his'?'🖤 Him':selectedEntry.author==='her'?'💗 Her':'💞 Both of us'}</span><span>•</span><span>{selectedEntry.mood_emoji||'❤️'} {selectedEntry.mood||'A little feeling'}</span></div><h2 className="mt-8 font-serif text-4xl sm:text-6xl italic leading-tight text-[#4a1724]">{selectedEntry.title}</h2><div className="mt-8 h-px bg-[#a86b73]/25"/><p className="mt-9 whitespace-pre-wrap break-words font-serif text-lg sm:text-xl leading-[2] text-[#4a2630]">{selectedEntry.content}</p><div className="mt-12 pt-5 border-t border-[#a86b73]/20 flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={()=>toggleFavorite(selectedEntry)} className="inline-flex items-center gap-2 text-sm text-[#8b5362]">{selectedEntry.favorite?<Star className="w-4 h-4 text-amber-500 fill-amber-500"/>:<Star className="w-4 h-4"/>} {selectedEntry.favorite?'Close to our hearts':'Keep this one close'}</button><div className="flex gap-2"><button type="button" onClick={()=>openEdit(selectedEntry)} className="text-xs px-4 py-2 rounded-xl bg-[#5a1c2c]/10 text-[#5a1c2c]">Edit</button><button type="button" onClick={()=>{setSelectedEntry(null);remove(selectedEntry.id)}} className="text-xs px-4 py-2 rounded-xl bg-[#5a1c2c]/10 text-[#8b5362]"><Trash2 className="w-3.5 h-3.5 inline mr-1"/>Delete</button></div></div></div></article></div></div>}

      {editorOpen && <div className="fixed inset-0 z-50 bg-velvet-950/90 backdrop-blur-xl overflow-y-auto p-4 sm:p-6"><div className="min-h-full flex items-center justify-center py-4"><form onSubmit={save} className="w-full max-w-2xl glass-panel rounded-[2rem] p-5 sm:p-8 border border-rose-500/25 shadow-2xl"><div className="flex items-start justify-between mb-6"><div><div className="text-xs uppercase tracking-[.2em] text-rose-400">A page from our story</div><h2 className="font-serif text-3xl text-white mt-1">{form.id?'Edit entry':'Write a new entry'}</h2></div><button type="button" onClick={()=>setEditorOpen(false)} className="p-2 rounded-full bg-rose-950/70 text-rose-200"><X/></button></div><div className="space-y-4"><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Give this moment a title... (optional)" className="w-full rounded-2xl bg-velvet-950 border border-rose-900/40 p-4 text-lg text-white font-serif outline-none"/><div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><label className="rounded-2xl bg-velvet-950 border border-rose-900/40 p-3"><span className="block text-[10px] uppercase tracking-wider text-rose-300/60 mb-2">Date</span><input type="date" value={form.entry_date} onChange={e=>setForm({...form,entry_date:e.target.value})} className="w-full bg-transparent text-sm text-white outline-none"/></label><label className="rounded-2xl bg-velvet-950 border border-rose-900/40 p-3"><span className="block text-[10px] uppercase tracking-wider text-rose-300/60 mb-2">Written by</span><select value={form.author||'both'} onChange={e=>setForm({...form,author:e.target.value})} className="w-full bg-transparent text-sm text-white outline-none"><option value="his">Him</option><option value="her">Her</option><option value="both">Both of us</option></select></label><div className="rounded-2xl bg-velvet-950 border border-rose-900/40 p-3"><span className="block text-[10px] uppercase tracking-wider text-rose-300/60 mb-2">Feeling</span><div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">{MOODS.map(m=><button type="button" key={m.emoji} title={m.label} onClick={()=>setForm({...form,mood:m.label,mood_emoji:m.emoji})} className={`shrink-0 text-2xl p-1 rounded-xl ${form.mood_emoji===m.emoji?'bg-rose-900/70 ring-1 ring-rose-500/50':''}`}>{m.emoji}</button>)}</div></div></div><div className="relative"><textarea required rows="10" value={form.content} onChange={e=>setForm({...form,content:e.target.value})} placeholder="Write whatever you want to remember... emojis are welcome ❤️✨" className="w-full resize-none rounded-2xl bg-velvet-950 border border-rose-900/40 p-4 pr-14 text-sm leading-7 text-white outline-none"/><button type="button" onClick={()=>setEmojiOpen(!emojiOpen)} aria-label="Open emoji picker" className="absolute right-3 top-3 w-9 h-9 rounded-xl bg-rose-900/60 border border-rose-700/40 text-xl"><Smile className="w-5 h-5 mx-auto text-rose-200"/></button></div>{emojiOpen&&<div className="rounded-2xl border border-rose-800/40 bg-[#17050c] p-3 shadow-2xl"><div className="grid grid-cols-8 sm:grid-cols-12 gap-1.5 max-h-44 overflow-y-auto">{EMOJIS.map((emoji,index)=><button type="button" key={index} onClick={()=>setForm({...form,content:form.content+emoji})} className="text-xl sm:text-2xl p-1.5 rounded-lg hover:bg-rose-900/60">{emoji}</button>)}</div></div>}<label className="flex items-center gap-3 text-sm text-rose-200/80"><input type="checkbox" checked={form.favorite} onChange={e=>setForm({...form,favorite:e.target.checked})} className="accent-rose-600 w-4 h-4"/><Star className="w-4 h-4 text-amber-300"/> Keep this one close to our hearts</label>{error&&<p className="text-sm text-rose-300">{error}</p>}<button disabled={saving} className="w-full rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 py-3.5 text-sm font-semibold text-white"><Save className="inline w-4 h-4 mr-2"/>{saving?'Saving...':'Save to our story ❤️'}</button></div></form></div></div>}
    </div>
  );
};

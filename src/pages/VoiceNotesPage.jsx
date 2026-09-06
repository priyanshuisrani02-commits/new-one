import React, { useMemo, useState } from 'react';
import { Heart, Play, Pause, Mic, Sparkles, Radio, Volume2, Search, Headphones, Clock3, UserRound, ChevronRight, X, Wand2 } from 'lucide-react';
import { useCouple } from '../context/CoupleContext';

export const VoiceNotesPage = ({ setActiveTab }) => {
  const {
    voiceNotes,
    activeVoiceNote,
    isPlayingAudio,
    playVoiceNote,
    stopVoiceNote,
    coupleSettings,
  } = useCouple();

  const [selectedPerson, setSelectedPerson] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);

  const himNotes = voiceNotes.filter((v) => v.person === 'him');
  const herNotes = voiceNotes.filter((v) => v.person === 'her');

  const filteredNotes = useMemo(() => {
    const byPerson = selectedPerson === 'all' ? voiceNotes : voiceNotes.filter((note) => note.person === selectedPerson);
    const q = query.trim().toLowerCase();
    return q ? byPerson.filter((note) => [note.title, note.transcript_or_note, note.person].join(' ').toLowerCase().includes(q)) : byPerson;
  }, [voiceNotes, selectedPerson, query]);

  const playLatest = (person) => {
    const notes = person === 'him' ? himNotes : herNotes;
    if (notes.length) playVoiceNote(notes[0]);
  };

  const currentName = activeVoiceNote?.person === 'him'
    ? (coupleSettings.his_name || 'Him')
    : (coupleSettings.her_name || 'Her');

  const waveform = [22, 38, 28, 52, 35, 64, 48, 76, 44, 68, 31, 56, 40, 72, 26, 50, 34, 62, 42, 70];

  return (
    <div className="relative overflow-hidden">
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-8">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-rose-950/30 to-transparent pointer-events-none" />
        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/25 bg-rose-950/40 px-4 py-2 text-[10px] sm:text-xs uppercase tracking-[.24em] text-rose-200/75">
            <Headphones className="w-4 h-4" /> The sound of us
          </div>
          <h1 className="mt-5 font-serif text-5xl sm:text-7xl italic text-white">Voice of Us</h1>
          <p className="mt-5 text-sm sm:text-base text-rose-100/60 max-w-2xl mx-auto leading-relaxed">
            Little pieces of a voice, saved for the moments when hearing them matters more than reading them.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[.2em] text-rose-300/45">
            <Radio className="w-3.5 h-3.5" /> A private shelf of voices
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-10">
        <div className="grid md:grid-cols-2 gap-5">
          {[
            { person: 'him', name: coupleSettings.his_name || 'Him', notes: himNotes, tone: 'blue' },
            { person: 'her', name: coupleSettings.her_name || 'Her', notes: herNotes, tone: 'rose' },
          ].map(({ person, name, notes, tone }) => (
            <button
              key={person}
              type="button"
              onClick={() => playLatest(person)}
              className="group relative overflow-hidden rounded-[2rem] border border-rose-200/10 bg-black/20 backdrop-blur-xl p-6 sm:p-8 text-left hover:border-rose-300/30 transition-all hover:-translate-y-1"
            >
              <div className={`absolute -right-12 -top-12 w-44 h-44 rounded-full blur-3xl ${tone === 'blue' ? 'bg-blue-500/15' : 'bg-rose-500/15'}`} />
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${tone === 'blue' ? 'bg-blue-950/60 border-blue-400/20' : 'bg-rose-950/60 border-rose-400/20'}`}>
                      <Mic className={`w-7 h-7 ${tone === 'blue' ? 'text-blue-300' : 'text-rose-300'}`} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[.22em] text-rose-300/45">{person === 'him' ? 'His voice' : 'Her voice'}</p>
                      <h2 className="font-serif text-2xl sm:text-3xl text-white">{name}</h2>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-rose-200/30 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
                <div className="mt-7 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs text-rose-100/45">{notes.length ? `${notes.length} voice note${notes.length === 1 ? '' : 's'} saved` : 'No voice notes yet'}</p>
                    <div className="mt-3 flex items-center gap-1.5 h-8">{waveform.slice(0, 12).map((h, i) => <span key={i} className={`w-1 rounded-full bg-gradient-to-t from-rose-700 to-rose-300 opacity-70 group-hover:opacity-100 ${activeVoiceNote?.person === person && isPlayingAudio ? 'wave-bar' : ''}`} style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }} />)}</div>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-xs text-rose-100/70">{activeVoiceNote?.person === person && isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />} {activeVoiceNote?.person === person && isPlayingAudio ? 'Pause' : 'Play latest'}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {activeVoiceNote && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">
          <div className="rounded-[2rem] border border-rose-300/15 bg-gradient-to-br from-rose-950/45 to-black/20 backdrop-blur-xl p-6 sm:p-9 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[.22em] text-rose-300/60"><Radio className="w-3.5 h-3.5 animate-pulse" /> Now playing</div>
                <h3 className="mt-2 font-serif text-2xl sm:text-3xl text-white">“{activeVoiceNote.title}”</h3>
                <p className="mt-1 text-xs text-rose-200/55">{currentName}</p>
              </div>
              <button type="button" onClick={stopVoiceNote} className="rounded-full border border-rose-300/15 bg-white/5 px-4 py-2 text-xs text-rose-100/75 hover:bg-rose-500/10">Stop</button>
            </div>
            <div className="mt-7 flex items-center gap-1 h-14 overflow-hidden justify-center">{waveform.map((h, i) => <span key={i} className={`w-1.5 sm:w-2 rounded-full bg-gradient-to-t from-rose-700 via-rose-400 to-rose-200 ${isPlayingAudio ? 'wave-bar' : 'opacity-40'}`} style={{ height: `${h}%`, animationDelay: `${i * 0.06}s` }} />)}</div>
            {activeVoiceNote.transcript_or_note && <p className="mt-6 text-sm text-rose-100/65 leading-relaxed italic text-center max-w-2xl mx-auto">“{activeVoiceNote.transcript_or_note}”</p>}
          </div>
        </section>
      )}

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <div className="rounded-[2rem] border border-rose-200/10 bg-black/15 backdrop-blur-xl p-5 sm:p-7">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-[.3em] text-rose-300/50">Your library</span>
              <h2 className="font-serif text-3xl text-white mt-1">All our little recordings</h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-300/35" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search voice notes…" className="w-full sm:w-60 rounded-xl bg-velvet-950/70 border border-rose-900/40 py-2.5 pl-9 pr-3 text-sm text-white outline-none" />
              </div>
              <div className="flex gap-1 rounded-xl bg-velvet-950/70 border border-rose-900/40 p-1">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'him', label: coupleSettings.his_name || 'Him' },
                  { id: 'her', label: coupleSettings.her_name || 'Her' },
                ].map((filter) => <button key={filter.id} type="button" onClick={() => setSelectedPerson(filter.id)} className={`px-3 py-2 rounded-lg text-xs ${selectedPerson === filter.id ? 'bg-rose-600 text-white' : 'text-rose-200/55 hover:text-white'}`}>{filter.label}</button>)}
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {filteredNotes.map((note) => (
              <button key={note.id} type="button" onClick={() => setSelectedNote(note)} className="w-full flex items-center gap-4 rounded-2xl border border-rose-900/25 bg-rose-950/15 hover:bg-rose-950/30 hover:border-rose-500/25 p-4 text-left transition-all">
                <span className="w-11 h-11 rounded-full bg-rose-900/50 border border-rose-700/30 flex items-center justify-center shrink-0">
                  {activeVoiceNote?.id === note.id && isPlayingAudio ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-rose-200 fill-current" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 flex-wrap"><span className="font-serif text-lg text-white truncate">{note.title}</span><span className="text-[9px] uppercase tracking-wider rounded-full bg-rose-900/40 px-2 py-0.5 text-rose-200/65">{note.person === 'him' ? coupleSettings.his_name || 'Him' : coupleSettings.her_name || 'Her'}</span></span>
                  <span className="block text-xs text-rose-200/45 mt-1 truncate">{note.transcript_or_note || 'A little voice from us.'}</span>
                </span>
                <span className="hidden sm:flex items-center gap-1 text-xs text-rose-300/45"><Clock3 className="w-3.5 h-3.5" />{note.duration || '0:30'}</span>
              </button>
            ))}
            {!filteredNotes.length && <div className="py-12 text-center text-sm text-rose-200/45">No voice notes match this search.</div>}
          </div>
        </div>
      </section>

      {selectedNote && (
        <div className="fixed inset-0 z-50 bg-velvet-950/85 backdrop-blur-xl flex items-center justify-center p-5" onClick={() => setSelectedNote(null)}>
          <div className="w-full max-w-xl rounded-[2rem] bg-[#fff8ec] text-[#35151e] p-7 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4"><div><div className="text-[10px] uppercase tracking-[.25em] text-[#8b5362]">A voice worth keeping</div><h3 className="font-serif text-3xl italic mt-2">{selectedNote.title}</h3></div><button type="button" onClick={() => setSelectedNote(null)} className="w-10 h-10 rounded-full bg-[#5a1c2c]/10"><X className="mx-auto w-5 h-5" /></button></div>
            <p className="mt-4 text-sm text-[#6f4b55]">{selectedNote.person === 'him' ? coupleSettings.his_name || 'Him' : coupleSettings.her_name || 'Her'}</p>
            {selectedNote.transcript_or_note && <p className="mt-6 font-serif italic text-lg leading-relaxed">“{selectedNote.transcript_or_note}”</p>}
            <button type="button" onClick={() => { playVoiceNote(selectedNote); setSelectedNote(null); }} className="mt-7 w-full rounded-2xl bg-[#5a1c2c] py-3 text-white font-semibold flex items-center justify-center gap-2"><Play className="w-4 h-4 fill-current"/> Play this voice note</button>
          </div>
        </div>
      )}
    </div>
  );
};

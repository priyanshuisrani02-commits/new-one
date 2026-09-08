import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MailOpen, RotateCcw, Play, Mic2, LockKeyhole, X, Volume2 } from 'lucide-react';
import { useCouple } from '../context/CoupleContext';

const OPEN_WHEN = [
  { key:'miss', emoji:'💌', title:'Open when you miss me' },
  { key:'smile', emoji:'😊', title:'Open when you need a smile' },
  { key:'sleep', emoji:'🌙', title:'Open when you cannot sleep' },
  { key:'hug', emoji:'🫂', title:'Open when you need a hug' },
  { key:'motivation', emoji:'✨', title:'Open when you need motivation' },
  { key:'bad-day', emoji:'❤️', title:'Open when today is hard' },
  { key:'remember', emoji:'📸', title:'Open when you want to remember us' },
  { key:'morning', emoji:'☀️', title:'Open when you wake up' }
];

export const OpenWhenPage = () => {
  const { voiceNotes } = useCouple();
  const [selected, setSelected] = useState(null);
  const [stage, setStage] = useState('idle');
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState('');
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  const recordings = useMemo(() => OPEN_WHEN.map((prompt) => {
    const exact = voiceNotes.filter((note) => note.open_when_key === prompt.key && note.audio_url);
    const fallback = voiceNotes.filter((note) => !note.open_when_key).find((note) => {
      const text = ((note.title || '') + ' ' + (note.transcript_or_note || '')).toLowerCase();
      return prompt.key === 'miss' ? text.includes('miss') : prompt.key === 'sleep' ? text.includes('sleep') || text.includes('night') : text.includes(prompt.key);
    });
    return { ...prompt, note: exact[0] || fallback || null };
  }), [voiceNotes]);

  useEffect(() => () => {
    window.clearTimeout(timerRef.current);
    audioRef.current?.pause();
    audioRef.current = null;
  }, []);

  const closeEnvelope = () => {
    window.clearTimeout(timerRef.current);
    audioRef.current?.pause();
    audioRef.current = null;
    setSelected(null);
    setStage('idle');
    setFinished(false);
    setError('');
  };

  const openEnvelope = (item) => {
    if (!item.note?.audio_url) return;
    window.clearTimeout(timerRef.current);
    audioRef.current?.pause();
    setError('');
    setSelected(item);
    setFinished(false);
    setStage('opening');

    const audio = new Audio(item.note.audio_url);
    audio.preload = 'auto';
    audio.volume = 1;
    audioRef.current = audio;
    audio.onended = () => {
      setStage('finished');
      setFinished(true);
    };
    audio.onerror = () => {
      setStage('ready');
      setFinished(false);
      setError('This voice note could not be played.');
    };

    // Start playback from the click gesture so mobile browsers are less likely
    // to reject autoplay after the envelope animation delay.
    audio.play().then(() => {
      timerRef.current = window.setTimeout(() => setStage('playing'), 850);
    }).catch(() => {
      setStage('ready');
      setError('Tap play to hear this voice note.');
    });
  };

  const playAgain = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setFinished(false);
    setError('');
    setStage('playing');
    audioRef.current.play().catch(() => setStage('ready'));
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] px-4 sm:px-6 py-10 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-300/20 bg-rose-950/40 px-4 py-2 text-xs text-rose-300">
            <MailOpen className="w-4 h-4" /> Sealed voices
          </div>
          <h1 className="mt-5 font-serif text-5xl sm:text-7xl italic text-white">Open When…</h1>
          <p className="mt-4 text-sm sm:text-base text-rose-100/60">
            Little voice notes, sealed inside envelopes for the moment you need them.
          </p>
        </div>

        {error && !selected && (
          <div className="max-w-2xl mx-auto mt-6 rounded-2xl border border-rose-500/25 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">{error}</div>
        )}

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {recordings.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => openEnvelope(item)}
              disabled={!item.note?.audio_url}
              className="group relative min-h-64 overflow-hidden rounded-[2rem] border border-rose-200/10 bg-gradient-to-br from-[#fff8ec] to-[#ead8cf] p-6 text-left shadow-xl transition-all hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-55"
            >
              <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-rose-200/25 blur-2xl" />
              <div className="relative z-10 flex h-full flex-col">
                <div className="flex items-start justify-between">
                  <span className="text-5xl">{item.emoji}</span>
                  {item.note ? <Mic2 className="w-5 h-5 text-[#8b5362]/55" /> : <LockKeyhole className="w-5 h-5 text-[#8b5362]/35" />}
                </div>
                <div className="mt-auto">
                  <div className="text-[9px] uppercase tracking-[.2em] text-[#8b5362]/70">Open when…</div>
                  <h2 className="mt-2 font-serif text-2xl text-[#35151e] leading-tight">{item.title}</h2>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#6f4b55]">
                      {item.note ? <><Volume2 className="w-3.5 h-3.5" /> Voice sealed</> : 'Not sealed yet'}
                    </span>
                    <span className="text-[10px] uppercase tracking-[.18em] text-[#7a243c]">{item.note ? 'Open →' : 'Waiting'}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[70] bg-[#12060b]/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-xl text-center">
            <button type="button" onClick={closeEnvelope} aria-label="Close" className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/10 border border-white/10 text-white">
              <X className="mx-auto w-5 h-5" />
            </button>

            <div className="relative mx-auto h-64 w-80 sm:h-72 sm:w-96 [perspective:1200px]">
              <div className="absolute inset-x-0 bottom-3 mx-auto h-44 sm:h-48 w-[88%] rounded-b-2xl bg-gradient-to-br from-[#d9aa8d] to-[#f1d6bf] shadow-2xl" />
              <div className={'absolute left-1/2 top-2 h-48 w-[88%] -translate-x-1/2 origin-top rounded-t-2xl bg-gradient-to-b from-[#f6dfca] to-[#d9aa8d] shadow-xl transition-transform duration-900 ease-in-out [clip-path:polygon(0_0,100%_0,50%_90%)] ' + ((stage === 'opening' || stage === 'playing' || stage === 'finished') ? 'rotate-x-180 -translate-y-8 opacity-70' : '')} />
              <div className={'absolute left-1/2 top-20 -translate-x-1/2 text-6xl transition-all duration-500 ' + (stage === 'opening' ? 'scale-110 opacity-0' : '')}>{selected.emoji}</div>
            </div>

            <div className="text-[10px] uppercase tracking-[.28em] text-rose-300/55">
              {stage === 'opening' ? 'Opening your envelope…' : stage === 'finished' ? 'A little voice, just for you' : stage === 'ready' ? 'Ready to play' : 'Playing your voice…'}
            </div>
            <h2 className="mt-2 font-serif text-4xl italic text-white">{selected.title}</h2>
            {error && <p className="mt-3 text-xs text-rose-200/70">{error}</p>}

            {stage === 'playing' && (
              <div className="mt-7 flex items-center justify-center gap-1.5 h-12">
                {[18,32,22,42,28,50,34,46,25,38,20,45,30,40].map((height, index) => (
                  <span key={index} className="w-1.5 rounded-full bg-rose-300 animate-pulse" style={{ height }} />
                ))}
              </div>
            )}

            {(stage === 'ready' || stage === 'finished') && (
              <div className="mt-8 flex justify-center gap-3">
                <button type="button" onClick={closeEnvelope} className="rounded-full bg-white/10 border border-white/15 px-7 py-3 text-sm text-white">Close</button>
                <button type="button" onClick={playAgain} className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-7 py-3 text-sm font-semibold text-white">
                  <RotateCcw className="w-4 h-4" /> Play again
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useMemo, useRef, useState } from "react";
import { MailOpen, Heart, X, RotateCcw, Play, Mic2, LockKeyhole } from "lucide-react";
import { useCouple } from "../context/CoupleContext";

const OPEN_WHEN = [
  { key:"miss", emoji:"💌", title:"Open when you miss me", words:["miss","missing"] },
  { key:"smile", emoji:"😊", title:"Open when you need a smile", words:["smile","happy","laugh"] },
  { key:"sleep", emoji:"🌙", title:"Open when you cannot sleep", words:["sleep","goodnight","night"] },
  { key:"hug", emoji:"🫂", title:"Open when you need a hug", words:["hug","comfort"] },
  { key:"motivation", emoji:"✨", title:"Open when you need motivation", words:["motivation","proud","strong"] },
  { key:"bad-day", emoji:"❤️", title:"Open when today is hard", words:["bad day","hard","sad"] },
  { key:"remember", emoji:"📸", title:"Open when you want to remember us", words:["remember","memory","us"] },
  { key:"morning", emoji:"☀️", title:"Open when you wake up", words:["morning","wake"] }
];

export const OpenWhenPage = () => {
  const { voiceNotes } = useCouple();
  const [selected, setSelected] = useState(null);
  const [stage, setStage] = useState("idle");
  const [isPlaying, setIsPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const audioRef = useRef(null);

  const recordings = useMemo(() => OPEN_WHEN.map((prompt) => {
    const note = voiceNotes.find((item) => {
      const text = ((item.title || "") + " " + (item.transcript_or_note || "")).toLowerCase();
      return prompt.words.some((word) => text.includes(word));
    });
    return { ...prompt, note: note || null };
  }), [voiceNotes]);

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  const openEnvelope = (item) => {
    if (!item.note?.audio_url) return;
    audioRef.current?.pause();
    const audio = new Audio(item.note.audio_url);
    audioRef.current = audio;
    audio.onended = () => { setIsPlaying(false); setFinished(true); };
    setSelected(item); setFinished(false); setIsPlaying(false); setStage("opening");
    window.setTimeout(() => audio.play().then(() => { setStage("playing"); setIsPlaying(true); }).catch(() => setStage("ready")), 1050);
  };
  const playAgain = () => { if (!audioRef.current) return; audioRef.current.currentTime=0; setFinished(false); audioRef.current.play().then(() => { setStage("playing"); setIsPlaying(true); }).catch(() => {}); };
  const closeEnvelope = () => { audioRef.current?.pause(); audioRef.current=null; setSelected(null); setStage("idle"); setIsPlaying(false); setFinished(false); };

  return <div className="min-h-[calc(100vh-5rem)] px-4 sm:px-6 py-10 pb-20"><div className="max-w-6xl mx-auto">
    <div className="text-center max-w-3xl mx-auto"><div className="inline-flex items-center gap-2 rounded-full border border-rose-300/20 bg-rose-950/40 px-4 py-2 text-xs text-rose-300"><MailOpen className="w-4 h-4"/> Sealed voices</div><h1 className="mt-5 font-serif text-5xl sm:text-7xl italic text-white">Open When…</h1><p className="mt-4 text-sm sm:text-base text-rose-100/60">Voice messages sealed inside little envelopes for the exact moment you need them.</p></div>
    <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">{recordings.map((item) => <button key={item.key} type="button" onClick={() => openEnvelope(item)} disabled={!item.note?.audio_url} className="group relative min-h-64 overflow-hidden rounded-[2rem] border border-rose-200/10 bg-gradient-to-br from-[#fff8ec] to-[#ead8cf] p-6 text-left shadow-xl transition-all hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-55"><div className="flex h-full flex-col"><div className="flex justify-between"><span className="text-5xl">{item.emoji}</span>{item.note ? <Mic2 className="w-5 h-5 text-[#8b5362]/55"/> : <LockKeyhole className="w-5 h-5 text-[#8b5362]/35"/>}</div><div className="mt-auto"><div className="text-[9px] uppercase tracking-[.2em] text-[#8b5362]/70">Open when…</div><h2 className="mt-2 font-serif text-2xl text-[#35151e] leading-tight">{item.title}</h2><div className="mt-4 flex justify-between items-center"><span className="text-xs text-[#6f4b55]">{item.note ? "Voice sealed" : "Waiting for a voice note"}</span><span className="text-[10px] uppercase tracking-[.18em] text-[#7a243c]">{item.note ? "Open →" : "Sealed"}</span></div></div></div></button>)}</div>
    <p className="mt-10 text-center text-xs text-rose-100/35">To add one, use Admin Panel → Voice Notes and give the recording a title containing the moment, such as “Open when you miss me”.</p>
  </div>
  {selected && <div className="fixed inset-0 z-50 bg-[#12060b]/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8"><div className="w-full max-w-xl text-center"><div className="relative mx-auto h-64 w-80 sm:h-72 sm:w-96 [perspective:1200px]"><div className="absolute inset-x-0 bottom-3 mx-auto h-44 w-[88%] rounded-b-2xl bg-gradient-to-br from-[#d9aa8d] to-[#f1d6bf] shadow-2xl"/><div className={"absolute left-1/2 top-2 h-48 w-[88%] -translate-x-1/2 origin-top rounded-t-2xl bg-gradient-to-b from-[#f6dfca] to-[#d9aa8d] shadow-xl transition-transform duration-1000 ease-in-out [clip-path:polygon(0_0,100%_0,50%_90%)] " + ((stage==="opening" || stage==="playing") ? "rotate-x-180 -translate-y-8 opacity-70" : "")}/><div className={"absolute left-1/2 top-20 -translate-x-1/2 text-6xl transition-all duration-500 " + (stage==="opening" ? "scale-110 opacity-0" : "")}>{selected.emoji}</div></div><div className="text-[10px] uppercase tracking-[.28em] text-rose-300/55">{stage==="opening" ? "Opening your envelope…" : isPlaying ? "Playing your voice…" : finished ? "A little voice, just for you" : "Your sealed voice"}</div><h2 className="mt-2 font-serif text-4xl italic text-white">{selected.title}</h2>{isPlaying && <div className="mt-7 flex items-center justify-center gap-1.5 h-12">{[18,32,22,42,28,50,34,46,25,38,20,45].map((h,i)=><span key={i} className="w-1.5 rounded-full bg-rose-300 animate-pulse" style={{height:h}}/>)}</div>}{finished && <div className="mt-8 flex justify-center gap-3"><button type="button" onClick={closeEnvelope} className="rounded-full bg-white/10 border border-white/15 px-7 py-3 text-sm text-white">Close</button><button type="button" onClick={playAgain} className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-7 py-3 text-sm font-semibold text-white"><RotateCcw className="w-4 h-4"/> Play again</button></div>}</div></div>}
  };
};
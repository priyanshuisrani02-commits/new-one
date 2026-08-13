import React, { useEffect, useMemo, useState } from 'react';
import { Heart, Sparkles, Calendar, Clock, Image, Mic, Dices, ArrowRight, Quote, ChevronDown, Star } from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import { WordSphere } from '../components/WordSphere';

const nextMonthiversary = (dateString, now) => {
  const source = new Date(`${dateString || '2023-02-14'}T12:00:00`);
  const day = source.getDate();
  let next = new Date(now.getFullYear(), now.getMonth(), Math.min(day, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()), 12);
  if (next < now) {
    const month = next.getMonth() + 1;
    next = new Date(next.getFullYear(), month, Math.min(day, new Date(next.getFullYear(), month + 1, 0).getDate()), 12);
  }
  return next;
};

const monthsSince = (dateString, now) => {
  const start = new Date(`${dateString || '2023-02-14'}T12:00:00`);
  let value = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth();
  if (now.getDate() < start.getDate()) value -= 1;
  return Math.max(0, value);
};

export const LandingPage = ({ setActiveTab }) => {
  const { memories, coupleSettings, voiceNotes } = useCouple();
  const [now, setNow] = useState(new Date());
  const [counter, setCounter] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const current = new Date();
      setNow(current);
      const start = new Date(`${coupleSettings.anniversary_date || '2023-02-14'}T12:00:00`);
      const diff = Math.max(0, current - start);
      setCounter({ days: Math.floor(diff / 86400000), hours: Math.floor(diff / 3600000) % 24, minutes: Math.floor(diff / 60000) % 60, seconds: Math.floor(diff / 1000) % 60 });
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [coupleSettings.anniversary_date]);

  const next = useMemo(() => nextMonthiversary(coupleSettings.anniversary_date, now), [coupleSettings.anniversary_date, now]);
  const daysUntil = Math.max(0, Math.ceil((next - now) / 86400000));
  const today = next.toDateString() === now.toDateString();
  const months = monthsSince(coupleSettings.anniversary_date, now);
  const names = `${coupleSettings.his_name || 'Alex'} & ${coupleSettings.her_name || 'Maya'}`;
  const featured = memories.find((item) => item.is_featured) || memories[0];
  const navigate = (tab) => { setActiveTab(tab); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const doors = [
    { tab: 'memories', icon: Image, title: 'Hall of Memories', text: 'The places, faces and tiny moments we refused to forget.', glow: 'from-rose-500/25' },
    { tab: 'voicenotes', icon: Mic, title: 'Voice of Us', text: 'Keep the sound of us close, even when the room is quiet.', glow: 'from-fuchsia-500/20' },
    { tab: 'activities', icon: Dices, title: 'Date Night', text: 'A little spark when we need an idea for tonight.', glow: 'from-amber-500/15' },
  ];

  return <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden pb-24">
    <section className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center px-5 py-20 overflow-hidden">
      <WordSphere />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(92,20,42,0.18),transparent_55%)] pointer-events-none" />
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-rose-400/20 bg-black/20 backdrop-blur-xl text-rose-200/80 text-[11px] uppercase tracking-[0.28em] shadow-2xl mb-8"><Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400 animate-heart-pulse" />Your little corner of forever<Sparkles className="w-3.5 h-3.5 text-amber-200" /></div>
        <p className="text-rose-300/60 text-xs sm:text-sm tracking-[0.5em] uppercase mb-5">{names}</p>
        <h1 className="font-serif text-6xl sm:text-8xl lg:text-[9rem] leading-[0.82] font-semibold tracking-[-0.06em] text-white drop-shadow-2xl">4EVER<span className="block italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-rose-200 via-white to-amber-100">URS</span></h1>
        <p className="max-w-xl mx-auto mt-8 text-base sm:text-lg text-rose-100/70 leading-relaxed">Not a website. Not a gallery. Just a tiny universe built around the two people who made it worth keeping.</p>
        <button onClick={() => document.getElementById('our-story')?.scrollIntoView({ behavior: 'smooth' })} className="mt-12 group inline-flex flex-col items-center gap-3 text-rose-200/70 hover:text-white"><span className="text-[10px] uppercase tracking-[0.35em]">Enter our story</span><span className="w-11 h-11 rounded-full border border-rose-300/20 bg-white/5 flex items-center justify-center group-hover:bg-rose-500/20 transition-all animate-bounce"><ChevronDown className="w-4 h-4" /></span></button>
      </div>
    </section>

    <section id="our-story" className="max-w-6xl mx-auto px-5 py-24">
      <div className="text-center max-w-2xl mx-auto mb-14"><span className="text-rose-400 text-[10px] uppercase tracking-[0.4em] font-semibold">Then. Now. Always.</span><h2 className="font-serif text-4xl sm:text-6xl text-white mt-4">Somewhere between then and now,<br /><span className="italic text-rose-200">we became us.</span></h2></div>
      <div className="glass-panel rounded-[2rem] p-6 sm:p-10 border border-rose-300/10 overflow-hidden shadow-2xl"><div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">{Object.entries(counter).map(([unit, value]) => <div key={unit} className="romantic-stat-card rounded-2xl p-5 sm:p-7 text-center"><span className="block font-serif text-3xl sm:text-5xl text-white">{value}</span><span className="block mt-2 text-[9px] uppercase tracking-[0.3em] text-rose-300/60">{unit}</span></div>)}</div><p className="text-center mt-7 text-sm text-rose-200/50 italic">...and we still haven't run out of seconds.</p></div>
    </section>

    <section className="max-w-6xl mx-auto px-5 pb-24"><div className={`relative overflow-hidden rounded-[2rem] border ${today ? 'border-rose-300/50 bg-rose-500/10' : 'border-rose-300/10 bg-black/20'} backdrop-blur-xl p-7 sm:p-10 shadow-2xl`}><div className="relative z-10 flex flex-col md:flex-row items-center gap-7 justify-between"><div className="flex items-center gap-5"><div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-300/20 flex items-center justify-center"><Calendar className="w-6 h-6 text-rose-300" /></div><div><p className="text-[10px] uppercase tracking-[0.3em] text-rose-400 font-semibold">Monthly reminder</p><h3 className="font-serif text-2xl sm:text-3xl text-white mt-1">{today ? `Happy monthiversary, ${names} ❤️` : `${daysUntil} day${daysUntil === 1 ? '' : 's'} until your next little anniversary`}</h3><p className="text-xs text-rose-100/50 mt-2">Calculated automatically from the anniversary date in Couple Settings.</p></div></div><div className="text-center md:text-right"><span className="block font-serif text-4xl text-rose-100">{months}</span><span className="text-[9px] uppercase tracking-[0.25em] text-rose-300/50">months together</span></div></div>{today && <div className="absolute top-4 right-6 flex gap-2 text-rose-300/60"><Heart className="w-4 h-4 fill-current animate-pulse" /><Heart className="w-3 h-3 fill-current animate-pulse" /></div>}</div></section>

    <section className="max-w-6xl mx-auto px-5 pb-24"><div className="flex items-end justify-between mb-8"><div><span className="text-rose-400 text-[10px] uppercase tracking-[0.4em] font-semibold">Choose a door</span><h2 className="font-serif text-4xl sm:text-5xl text-white mt-2">A little world for us.</h2></div><Star className="hidden sm:block w-5 h-5 text-amber-200/50" /></div><div className="grid grid-cols-1 md:grid-cols-3 gap-5">{doors.map(({ tab, icon: Icon, title, text, glow }, index) => <button key={tab} onClick={() => navigate(tab)} className="romantic-door group relative min-h-[270px] text-left rounded-[2rem] overflow-hidden border border-rose-200/10 bg-black/20 backdrop-blur-xl p-7 sm:p-8"><div className={`absolute inset-0 bg-gradient-to-br ${glow} to-transparent opacity-70 group-hover:opacity-100 transition-opacity`} /><div className="relative z-10 h-full flex flex-col"><div className="flex items-center justify-between"><span className="text-[10px] uppercase tracking-[0.3em] text-rose-300/50">0{index + 1}</span><div className="w-12 h-12 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500"><Icon className="w-5 h-5 text-rose-200" /></div></div><div className="mt-auto"><h3 className="font-serif text-3xl text-white group-hover:text-rose-100">{title}</h3><p className="mt-3 text-sm leading-relaxed text-rose-100/55">{text}</p><span className="mt-6 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-rose-300 group-hover:gap-3">Open <ArrowRight className="w-3.5 h-3.5" /></span></div></div><Heart className="card-heart-pop absolute -right-4 -bottom-4 w-24 h-24 text-rose-400/10 fill-rose-400/10" /></button>)}</div></section>

    <section className="max-w-6xl mx-auto px-5 pb-24"><div className="relative rounded-[2rem] overflow-hidden min-h-[320px] border border-rose-200/10 bg-black/20">{featured?.media_url && <img src={featured.media_url} alt="A favorite memory" className="absolute inset-0 w-full h-full object-cover opacity-35 scale-105" />}<div className="absolute inset-0 bg-gradient-to-r from-[#0d0307] via-[#0d0307]/80 to-transparent" /><div className="relative z-10 p-8 sm:p-12 max-w-2xl min-h-[320px] flex flex-col justify-center"><span className="text-[10px] uppercase tracking-[0.35em] text-rose-300/60">A moment worth keeping</span><h2 className="font-serif text-4xl sm:text-5xl text-white mt-3">{featured?.title || 'Our favorite little moments.'}</h2><p className="mt-4 text-sm text-rose-100/60 leading-relaxed">{featured?.description || 'Every memory gets a place here, because the small things become the big story.'}</p><button onClick={() => navigate('memories')} className="mt-7 self-start inline-flex items-center gap-2 rounded-full px-5 py-3 bg-white/10 hover:bg-rose-500/20 border border-white/10 text-xs font-semibold text-white">Visit the memories <ArrowRight className="w-4 h-4" /></button></div></div></section>

    <section className="max-w-4xl mx-auto px-5 pb-10 text-center"><div className="glass-panel rounded-[2rem] p-8 sm:p-12 border border-rose-300/10"><Quote className="w-9 h-9 mx-auto text-rose-400/30" /><p className="font-serif italic text-2xl sm:text-3xl text-rose-100 mt-5 leading-relaxed">“{coupleSettings.daily_love_note || 'Distance means so little when someone means so much.'}”</p><p className="mt-5 text-[10px] uppercase tracking-[0.35em] text-rose-400/60">Forever & always</p>{voiceNotes.length > 0 && <p className="mt-3 text-xs text-rose-100/35">{voiceNotes.length} voice note{voiceNotes.length === 1 ? '' : 's'} waiting in your world.</p>}</div></section>
  </div>;
};

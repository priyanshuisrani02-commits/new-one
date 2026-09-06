import React, { useState, useEffect } from 'react';
import { Heart, Sparkles, Image as ImageIcon, Dices, Lock, Menu, X, ShieldCheck, BookHeart, Timer, MailOpen } from 'lucide-react';
import { useCouple, playMelodiousChime } from '../context/CoupleContext';

const isManualTime = (value) => /^\d{2}:\d{2}$/.test(value || '');

const manualClock = (key, value, now) => {
  if (!isManualTime(value)) return null;
  const storageKey = '4ever-urs-manual-time-' + key;
  let anchor = null;
  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey) || 'null');
    if (saved && saved.value === value && Number.isFinite(saved.anchorMs)) anchor = saved;
  } catch {}
  if (!anchor) {
    anchor = { value, anchorMs: now.getTime() };
    try { window.localStorage.setItem(storageKey, JSON.stringify(anchor)); } catch {}
  }
  const parts = value.split(':').map(Number);
  const hours = parts[0];
  const minutes = parts[1];
  const elapsedMs = Math.max(0, now.getTime() - anchor.anchorMs);
  const startMs = (hours * 60 + minutes) * 60 * 1000;
  const currentMs = (startMs + elapsedMs) % 86400000;
  const totalSeconds = Math.floor(currentMs / 1000);
  const currentHours = Math.floor(totalSeconds / 3600);
  const currentMinutes = Math.floor((totalSeconds % 3600) / 60);
  const display = new Date(now);
  display.setHours(currentHours, currentMinutes, totalSeconds % 60, 0);
  return display.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
};

const formatTimezoneTime = (timeZone, now) => {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone, hour: '2-digit', minute: '2-digit', hour12: true }).format(now);
  } catch {
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
};

const getConfiguredTime = (key, value, now) => isManualTime(value) ? manualClock(key, value, now) : formatTimezoneTime(value, now);

export const Navbar = ({ activeTab, setActiveTab }) => {
  const { coupleSettings, isAdmin } = useCouple();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hisTime, setHisTime] = useState('');
  const [herTime, setHerTime] = useState('');

  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      setHisTime(getConfiguredTime('his', coupleSettings.his_timezone || 'America/New_York', now));
      setHerTime(getConfiguredTime('her', coupleSettings.her_timezone || 'Asia/Tokyo', now));
    };
    updateClocks();
    const interval = window.setInterval(updateClocks, 1000);
    return () => window.clearInterval(interval);
  }, [coupleSettings.his_timezone, coupleSettings.her_timezone]);

  const navItems = [
    { id: 'home', label: 'Home', icon: Heart },
    { id: 'memories', label: 'Hall of Memories', icon: ImageIcon },
    { id: 'journal', label: 'Journal', icon: BookHeart },
    { id: 'openwhen', label: 'Open When…', icon: MailOpen },
    { id: 'timecapsule', label: 'Time Capsule', icon: Timer },
    { id: 'activities', label: 'Date Generator', icon: Dices },
    { id: 'admin', label: 'Admin Panel', icon: Lock }
  ];

  const handleTabChange = (tabId) => {
    playMelodiousChime();
    setActiveTab(tabId);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-rose-900/30 bg-velvet-950/90 backdrop-blur-xl">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between min-h-16 sm:min-h-20 gap-3">

          <button onClick={() => handleTabChange('home')} className="flex items-center gap-2.5 shrink-0 text-left group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-rose-600 to-rose-400 p-0.5 shadow-lg shadow-rose-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-velvet-950 rounded-full flex items-center justify-center">
                <Heart className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-rose-400 fill-rose-400/30 animate-heart-pulse" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-200 via-rose-100 to-champagne-200 whitespace-nowrap">4EVER URS</span>
                <Sparkles className="hidden sm:block w-4 h-4 text-champagne-300 animate-pulse shrink-0" />
              </div>
              <p className="hidden sm:block text-xs font-cursive text-rose-300/80 tracking-wide">made with love</p>
            </div>
          </button>

          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center justify-center rounded-2xl bg-rose-950/55 border border-rose-800/30 shadow-lg shadow-black/10 px-4 py-2 max-w-[44vw] min-w-[340px]">
            <div className="flex items-center gap-4 lg:gap-6 text-xs whitespace-nowrap">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
                <span className="text-rose-300 font-medium truncate max-w-[8rem]">{coupleSettings.his_name || 'Him'}</span>
                <span className="font-mono text-rose-100 tabular-nums">{hisTime}</span>
              </div>
              <span className="text-rose-700/70">|</span>
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse shrink-0" />
                <span className="text-rose-300 font-medium truncate max-w-[8rem]">{coupleSettings.her_name || 'Her'}</span>
                <span className="font-mono text-rose-100 tabular-nums">{herTime}</span>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex md:hidden flex-1 justify-end" />

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            className="shrink-0 p-2.5 sm:p-3 rounded-xl bg-rose-950/60 text-rose-300 border border-rose-800/40 hover:text-white hover:bg-rose-900/60 transition-all"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-rose-900/30 bg-velvet-950/98 backdrop-blur-xl shadow-2xl">
          <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="md:hidden grid grid-cols-2 gap-2 mb-3">
              <div className="rounded-2xl bg-rose-950/60 border border-rose-800/30 p-3 min-w-0">
                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-rose-300/60"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" />{coupleSettings.his_name || 'Him'}</div>
                <p className="font-mono text-sm text-rose-100 mt-1 truncate">{hisTime}</p>
              </div>
              <div className="rounded-2xl bg-rose-950/60 border border-rose-800/30 p-3 min-w-0">
                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-rose-300/60"><span className="w-1.5 h-1.5 rounded-full bg-pink-400" />{coupleSettings.her_name || 'Her'}</div>
                <p className="font-mono text-sm text-rose-100 mt-1 truncate">{herTime}</p>
              </div>
            </div>

            <nav className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={'shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-left min-w-[185px] ' + (isActive ? 'bg-rose-900/70 text-white border border-rose-500/40' : 'text-rose-200/80 bg-rose-950/25 border border-rose-900/25 hover:bg-rose-900/45 hover:text-white')}
                  >
                    <Icon className={'w-5 h-5 shrink-0 ' + (isActive ? 'text-rose-300' : 'text-rose-400/60')} />
                    <span className="truncate">{item.label}</span>
                    {item.id === 'admin' && isAdmin && <ShieldCheck className="w-4 h-4 text-emerald-400 ml-auto shrink-0" />}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

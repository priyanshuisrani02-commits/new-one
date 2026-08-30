import React, { useState, useEffect } from 'react';
import { Heart, Sparkles, Image as ImageIcon, Dices, Mic, Lock, Menu, X, ShieldCheck, BookHeart } from 'lucide-react';
import { useCouple, playMelodiousChime } from '../context/CoupleContext';

export const Navbar = ({ activeTab, setActiveTab }) => {
  const { coupleSettings, isAdmin } = useCouple();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hisTime, setHisTime] = useState('');
  const [herTime, setHerTime] = useState('');

  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      try {
        setHisTime(new Intl.DateTimeFormat('en-US', { timeZone: coupleSettings.his_timezone || 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: true }).format(now));
        setHerTime(new Intl.DateTimeFormat('en-US', { timeZone: coupleSettings.her_timezone || 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hour12: true }).format(now));
      } catch {
        const fallback = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setHisTime(fallback); setHerTime(fallback);
      }
    };
    updateClocks();
    const interval = setInterval(updateClocks, 1000);
    return () => clearInterval(interval);
  }, [coupleSettings]);

  const navItems = [
    { id: 'home', label: 'Home', icon: Heart },
    { id: 'memories', label: 'Hall of Memories', icon: ImageIcon },
    { id: 'journal', label: 'Journal', icon: BookHeart },
    { id: 'activities', label: 'Date Generator', icon: Dices },
    { id: 'voicenotes', label: 'Voice of Us', icon: Mic },
    { id: 'admin', label: 'Admin Panel', icon: Lock },
  ];

  const handleTabChange = (tabId) => {
    playMelodiousChime();
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-velvet-950/85 border-b border-rose-900/30">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <button onClick={() => handleTabChange('home')} className="flex items-center gap-2.5 cursor-pointer group min-h-0 text-left">
            <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full bg-gradient-to-tr from-rose-600 to-rose-400 p-0.5 shadow-lg shadow-rose-500/20 group-hover:scale-105 transition-transform duration-300">
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

          <div className="hidden lg:flex items-center space-x-4 px-4 py-1.5 rounded-full bg-rose-950/50 border border-rose-800/30 text-xs">
            <div className="flex items-center space-x-2"><span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span><span className="text-rose-300 font-medium">{coupleSettings.his_name || 'Him'}:</span><span className="font-mono text-rose-100">{hisTime}</span></div>
            <span className="text-rose-700">|</span>
            <div className="flex items-center space-x-2"><span className="w-2 h-2 rounded-full bg-pink-400 animate-ping"></span><span className="text-rose-300 font-medium">{coupleSettings.her_name || 'Her'}:</span><span className="font-mono text-rose-100">{herTime}</span></div>
          </div>

          <nav className="hidden md:flex items-center space-x-1 sm:space-x-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return <button key={item.id} onClick={() => handleTabChange(item.id)} className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${isActive ? 'text-white bg-rose-900/60 border border-rose-500/40 shadow-lg shadow-rose-950/50' : 'text-rose-200/70 hover:text-rose-100 hover:bg-rose-950/40'}`}>
                <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-rose-300/60'}`} />
                <span>{item.label}</span>
                {item.id === 'admin' && isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 ml-1" />}
              </button>;
            })}
          </nav>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileMenuOpen} className="md:hidden p-2.5 rounded-xl bg-rose-950/60 text-rose-300 border border-rose-800/40 hover:text-white min-h-0">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-rose-900/30 bg-velvet-950/98 backdrop-blur-xl px-3 pt-3 pb-4 animate-fade-in shadow-2xl">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="rounded-2xl bg-rose-950/60 border border-rose-800/30 p-3 min-w-0"><div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-rose-300/60"><span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>{coupleSettings.his_name || 'Him'}</div><p className="font-mono text-sm text-rose-100 mt-1 truncate">{hisTime}</p></div>
            <div className="rounded-2xl bg-rose-950/60 border border-rose-800/30 p-3 min-w-0"><div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-rose-300/60"><span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>{coupleSettings.her_name || 'Her'}</div><p className="font-mono text-sm text-rose-100 mt-1 truncate">{herTime}</p></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return <button key={item.id} onClick={() => handleTabChange(item.id)} className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-medium text-left min-w-0 ${isActive ? 'bg-rose-900/70 text-white border border-rose-500/40' : 'text-rose-200/80 bg-rose-950/25 border border-rose-900/25'}`}>
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-rose-300' : 'text-rose-400/60'}`} />
                <span className="truncate">{item.label}</span>
                {item.id === 'admin' && isAdmin && <ShieldCheck className="w-4 h-4 text-emerald-400 ml-auto shrink-0" />}
              </button>;
            })}
          </div>
        </div>
      )}
    </header>
  );
};

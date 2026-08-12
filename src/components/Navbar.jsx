import React, { useState, useEffect } from 'react';
import { Heart, Sparkles, Image as ImageIcon, Dices, Mic, Lock, Menu, X, ShieldCheck } from 'lucide-react';
import { useCouple, playMelodiousChime } from '../context/CoupleContext';

export const Navbar = ({ activeTab, setActiveTab }) => {
  const { coupleSettings, isAdmin } = useCouple();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dual Timezone Clocks
  const [hisTime, setHisTime] = useState('');
  const [herTime, setHerTime] = useState('');

  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      try {
        const hTime = new Intl.DateTimeFormat('en-US', {
          timeZone: coupleSettings.his_timezone || 'America/New_York',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }).format(now);

        const rTime = new Intl.DateTimeFormat('en-US', {
          timeZone: coupleSettings.her_timezone || 'Asia/Tokyo',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }).format(now);

        setHisTime(hTime);
        setHerTime(rTime);
      } catch (err) {
        setHisTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setHerTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    };

    updateClocks();
    const interval = setInterval(updateClocks, 1000);
    return () => clearInterval(interval);
  }, [coupleSettings]);

  const navItems = [
    { id: 'home', label: 'Home', icon: Heart },
    { id: 'memories', label: 'Hall of Memories', icon: ImageIcon },
    { id: 'activities', label: 'LDR Activity Generator', icon: Dices },
    { id: 'voicenotes', label: 'Voice of Us', icon: Mic },
    { id: 'admin', label: 'Admin Panel', icon: Lock },
  ];

  const handleTabChange = (tabId) => {
    playMelodiousChime();
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-velvet-950/80 border-b border-rose-900/30 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <div 
            onClick={() => handleTabChange('home')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-600 to-rose-400 p-0.5 shadow-lg shadow-rose-500/20 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-velvet-950 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-rose-400 fill-rose-400/30 animate-heart-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-serif text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-200 via-rose-100 to-champagne-200">
                  4EVER URS
                </span>
                <Sparkles className="w-4 h-4 text-champagne-300 animate-pulse" />
              </div>
              <p className="text-xs font-cursive text-rose-300/80 tracking-wide">made with love</p>
            </div>
          </div>

          {/* Desktop Dual Timezone Clocks */}
          <div className="hidden lg:flex items-center space-x-4 px-4 py-1.5 rounded-full bg-rose-950/50 border border-rose-800/30 text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
              <span className="text-rose-300 font-medium">{coupleSettings.his_name || 'Him'}:</span>
              <span className="font-mono text-rose-100">{hisTime}</span>
            </div>
            <span className="text-rose-700">|</span>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping"></span>
              <span className="text-rose-300 font-medium">{coupleSettings.her_name || 'Her'}:</span>
              <span className="font-mono text-rose-100">{herTime}</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'text-white bg-rose-900/60 border border-rose-500/40 shadow-lg shadow-rose-950/50'
                      : 'text-rose-200/70 hover:text-rose-100 hover:bg-rose-950/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-rose-300/60'}`} />
                  <span>{item.label}</span>
                  
                  {item.id === 'admin' && isAdmin && (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 ml-1" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Mobile Hamburger Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-rose-950/60 text-rose-300 border border-rose-800/40 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Slide-down Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-rose-900/40 bg-velvet-950/95 backdrop-blur-xl px-4 pt-3 pb-6 animate-fade-in space-y-3">
          
          {/* Mobile Dual Timezone Display */}
          <div className="flex items-center justify-around py-2 px-3 rounded-2xl bg-rose-950/60 border border-rose-800/30 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span className="text-rose-300 font-medium">{coupleSettings.his_name}:</span>
              <span className="font-mono text-rose-100">{hisTime}</span>
            </div>
            <span className="text-rose-700">|</span>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-pink-400"></span>
              <span className="text-rose-300 font-medium">{coupleSettings.her_name}:</span>
              <span className="font-mono text-rose-100">{herTime}</span>
            </div>
          </div>

          {/* Mobile Nav Links */}
          <div className="grid grid-cols-1 gap-2 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-rose-900/70 text-white border border-rose-500/40 font-semibold'
                      : 'text-rose-200/80 hover:bg-rose-950/40'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-rose-400' : 'text-rose-400/60'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.id === 'admin' && isAdmin && (
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>

        </div>
      )}

    </header>
  );
};

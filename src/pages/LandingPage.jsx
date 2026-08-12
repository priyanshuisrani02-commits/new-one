import React, { useState, useEffect } from 'react';
import { Heart, Sparkles, Calendar, Clock, Image, Mic, Dices, ArrowRight, Quote, Compass } from 'lucide-react';
import { useCouple } from '../context/CoupleContext';

export const LandingPage = ({ setActiveTab }) => {
  const { memories, coupleSettings, playVoiceNote, voiceNotes } = useCouple();

  // Relationship Counter State
  const [timeTogether, setTimeTogether] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTime = () => {
      const start = new Date(coupleSettings.anniversary_date || '2023-02-14');
      const now = new Date();
      const diff = Math.max(0, now - start);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeTogether({ days, hours, minutes, seconds });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [coupleSettings.anniversary_date]);

  const featuredMemories = memories.filter(m => m.is_featured).slice(0, 3);
  const sampleVoiceNote = voiceNotes[0];

  return (
    <div className="relative min-h-[calc(100vh-5rem)] pb-20 overflow-hidden">
      
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 px-4 text-center max-w-5xl mx-auto">
        
        {/* Floating Heart Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-rose-900/40 border border-rose-500/30 text-rose-200 text-xs sm:text-sm font-medium mb-8 shadow-inner animate-pulse">
          <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
          <span>{coupleSettings.his_name || 'Alex'} & {coupleSettings.her_name || 'Maya'}'s Sanctuary</span>
          <Sparkles className="w-4 h-4 text-champagne-300" />
        </div>

        {/* Romantic Main Headline */}
        <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-tight">
          Where Our Memories <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-rose-200 to-champagne-200">
            Live 4Ever Together
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-rose-200/80 font-sans leading-relaxed mb-10">
          No matter how many miles separate our hearts, this space holds our laughter, our quiet voice messages, our favorite photos, and every precious moment we build together.
        </p>

        {/* Relationship Counter Card */}
        <div className="max-w-3xl mx-auto mb-16 p-6 sm:p-8 rounded-3xl glass-panel border border-rose-500/30 shadow-2xl relative">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-rose-600 to-rose-500 text-white text-xs font-semibold uppercase tracking-widest shadow-md flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Time Together</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-3">
            <div className="p-4 rounded-2xl bg-velvet-950/60 border border-rose-900/40">
              <span className="block font-serif text-3xl sm:text-5xl font-bold text-rose-100">{timeTogether.days}</span>
              <span className="text-xs uppercase text-rose-300/70 tracking-wider font-medium">Days</span>
            </div>
            <div className="p-4 rounded-2xl bg-velvet-950/60 border border-rose-900/40">
              <span className="block font-serif text-3xl sm:text-5xl font-bold text-rose-100">{timeTogether.hours}</span>
              <span className="text-xs uppercase text-rose-300/70 tracking-wider font-medium">Hours</span>
            </div>
            <div className="p-4 rounded-2xl bg-velvet-950/60 border border-rose-900/40">
              <span className="block font-serif text-3xl sm:text-5xl font-bold text-rose-100">{timeTogether.minutes}</span>
              <span className="text-xs uppercase text-rose-300/70 tracking-wider font-medium">Minutes</span>
            </div>
            <div className="p-4 rounded-2xl bg-velvet-950/60 border border-rose-900/40">
              <span className="block font-serif text-3xl sm:text-5xl font-bold text-rose-100">{timeTogether.seconds}</span>
              <span className="text-xs uppercase text-rose-300/70 tracking-wider font-medium">Seconds</span>
            </div>
          </div>

          <p className="mt-4 text-xs text-rose-300/60 font-cursive text-lg">
            ...and counting every second with you
          </p>
        </div>

        {/* Quick Feature Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-5xl mx-auto">
          
          {/* Card 1: Hall of Memories */}
          <div 
            onClick={() => setActiveTab('memories')}
            className="group glass-panel glass-panel-hover p-6 rounded-3xl cursor-pointer relative overflow-hidden"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-300 mb-4 group-hover:scale-110 transition-transform">
              <Image className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-2xl font-semibold text-white mb-2 group-hover:text-rose-200 transition-colors">
              Hall of Memories
            </h3>
            <p className="text-xs text-rose-200/70 leading-relaxed mb-6">
              Our curated gallery of photos, videos, stories, and unforgettable milestones.
            </p>
            <div className="flex items-center text-xs font-semibold text-rose-400 group-hover:translate-x-1 transition-transform">
              <span>Explore Gallery</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Card 2: Voice of Us */}
          <div 
            onClick={() => setActiveTab('voicenotes')}
            className="group glass-panel glass-panel-hover p-6 rounded-3xl cursor-pointer relative overflow-hidden"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-300 mb-4 group-hover:scale-110 transition-transform">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-2xl font-semibold text-white mb-2 group-hover:text-rose-200 transition-colors">
              Voice of Us
            </h3>
            <p className="text-xs text-rose-200/70 leading-relaxed mb-6">
              Hear each other’s voice anytime. Tap "I Miss Him" or "I Miss Her" for instant comfort.
            </p>
            <div className="flex items-center text-xs font-semibold text-rose-400 group-hover:translate-x-1 transition-transform">
              <span>Listen to Voice Notes</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Card 3: LDR Activity Generator */}
          <div 
            onClick={() => setActiveTab('activities')}
            className="group glass-panel glass-panel-hover p-6 rounded-3xl cursor-pointer relative overflow-hidden"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-300 mb-4 group-hover:scale-110 transition-transform">
              <Dices className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-2xl font-semibold text-white mb-2 group-hover:text-rose-200 transition-colors">
              LDR Activity Generator
            </h3>
            <p className="text-xs text-rose-200/70 leading-relaxed mb-6">
              Never wonder what to do on date night across distance. Generate fun online date ideas!
            </p>
            <div className="flex items-center text-xs font-semibold text-rose-400 group-hover:translate-x-1 transition-transform">
              <span>Spin for Activity</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>

        </div>

        {/* Daily Love Note Banner */}
        <div className="mt-12 p-8 rounded-3xl bg-gradient-to-r from-rose-950/80 via-velvet-900 to-rose-950/80 border border-rose-500/30 text-left relative overflow-hidden shadow-xl">
          <div className="flex items-start space-x-4">
            <Quote className="w-8 h-8 text-rose-400/50 flex-shrink-0" />
            <div>
              <span className="text-xs uppercase tracking-widest text-rose-400 font-semibold">Today's Love Note</span>
              <p className="font-serif text-xl sm:text-2xl text-rose-100 italic mt-2 leading-snug">
                "{coupleSettings.daily_love_note || 'Distance means so little when someone means so much. You are 4ever urs.'}"
              </p>
              <span className="mt-4 inline-block text-sm font-cursive text-champagne-300">
                — Forever & Always ❤️
              </span>
            </div>
          </div>
        </div>

      </section>

    </div>
  );
};

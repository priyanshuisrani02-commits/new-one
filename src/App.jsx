import React, { useState, useEffect } from 'react';
import { CoupleProvider } from './context/CoupleContext';
import { Navbar } from './components/Navbar';
import { AdminAuthGate } from './components/AdminAuthGate';
import { LandingPage } from './pages/LandingPage';
import { HallOfMemories } from './pages/HallOfMemories';
import { ActivityGenerator } from './pages/ActivityGenerator';
import { VoiceNotesPage } from './pages/VoiceNotesPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { WordSphereAdmin } from './pages/WordSphereAdmin';
import { JournalPage } from './pages/JournalPage';
import { TimeCapsulePage } from './pages/TimeCapsulePage';
import { Heart } from 'lucide-react';

const MainApp = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [hearts, setHearts] = useState([]);

  useEffect(() => {
    setHearts(Array.from({ length: 12 }).map((_, i) => ({ id: i, left: `${Math.random() * 100}%`, size: `${Math.random() * 14 + 10}px`, duration: `${Math.random() * 10 + 14}s`, delay: `${Math.random() * 8}s` })));
  }, []);

  return <div className="min-h-screen flex flex-col relative selection:bg-rose-500 selection:text-white">
    {hearts.map((h) => <Heart key={h.id} className="floating-heart text-rose-500/15 fill-rose-500/10 pointer-events-none" style={{ left: h.left, width: h.size, height: h.size, animationDuration: h.duration, animationDelay: h.delay }} />)}
    <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
    <main className="flex-grow relative z-10">
      {activeTab === 'home' && <LandingPage setActiveTab={setActiveTab} />}
      {activeTab === 'memories' && <HallOfMemories setActiveTab={setActiveTab} />}
      {activeTab === 'journal' && <JournalPage />}
      {activeTab === 'timecapsule' && <TimeCapsulePage />}
      {activeTab === 'activities' && <ActivityGenerator />}
      {activeTab === 'voicenotes' && <VoiceNotesPage setActiveTab={setActiveTab} />}
      {activeTab === 'admin' && (
        <AdminAuthGate>
          <div className="space-y-10 pb-12">
            <AdminDashboard />
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="border-t border-rose-900/30 pt-10">
                <WordSphereAdmin />
              </div>
            </div>
          </div>
        </AdminAuthGate>
      )}
      {activeTab === 'word-sphere-admin' && (
        <AdminAuthGate>
          <WordSphereAdmin />
        </AdminAuthGate>
      )}
    </main>
    <footer className="relative z-10 border-t border-rose-900/30 bg-velvet-950/90 py-6 sm:py-8 text-center text-xs text-rose-300/60">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2"><Heart className="w-4 h-4 text-rose-500 fill-rose-500" /><span className="font-serif text-sm font-semibold text-rose-200">4EVER URS</span><span>— Made with love</span></div>
        <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 text-[11px] sm:text-xs">
          <button onClick={() => setActiveTab('home')} className="hover:text-rose-200">Home</button><button onClick={() => setActiveTab('memories')} className="hover:text-rose-200">Memories</button><button onClick={() => setActiveTab('journal')} className="hover:text-rose-200">Journal</button><button onClick={() => setActiveTab('activities')} className="hover:text-white">Date Generator</button><button onClick={() => setActiveTab('voicenotes')} className="hover:text-rose-200">Voice Notes</button><button onClick={() => setActiveTab('admin')} className="hover:text-rose-200">Admin</button><button onClick={() => setActiveTab('word-sphere-admin')} className="hover:text-rose-200">Word Sphere</button>
        </div>
      </div>
    </footer>
  </div>;
};

export default function App() { return <CoupleProvider><MainApp /></CoupleProvider>; }

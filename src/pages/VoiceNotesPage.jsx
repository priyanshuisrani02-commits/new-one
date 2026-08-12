import React, { useState } from 'react';
import { Mic, Play, Pause, Volume2, Heart, Sparkles, UserCheck, MessageSquare, Music, Plus, Radio } from 'lucide-react';
import { useCouple } from '../context/CoupleContext';

export const VoiceNotesPage = ({ setActiveTab }) => {
  const { 
    voiceNotes, 
    activeVoiceNote, 
    isPlayingAudio, 
    playVoiceNote, 
    stopVoiceNote,
    coupleSettings,
    isAdmin 
  } = useCouple();

  const [selectedPerson, setSelectedPerson] = useState('all');

  const himNotes = voiceNotes.filter(v => v.person === 'him');
  const herNotes = voiceNotes.filter(v => v.person === 'her');

  const handleMissHimClick = () => {
    if (himNotes.length > 0) {
      playVoiceNote(himNotes[0]);
    } else {
      alert("No voice note uploaded for Him yet! You can upload one in the Admin Dashboard.");
    }
  };

  const handleMissHerClick = () => {
    if (herNotes.length > 0) {
      playVoiceNote(herNotes[0]);
    } else {
      alert("No voice note uploaded for Her yet! You can upload one in the Admin Dashboard.");
    }
  };

  const filteredNotes = selectedPerson === 'all'
    ? voiceNotes
    : voiceNotes.filter(v => v.person === selectedPerson);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-rose-900/40 border border-rose-500/30 text-rose-300 text-xs font-medium mb-4">
          <Mic className="w-3.5 h-3.5" />
          <span>Voice Sanctuary</span>
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-4">
          Voice of Us
        </h1>
        <p className="text-rose-200/70 text-sm sm:text-base font-sans leading-relaxed">
          Whenever distance feels too heavy, tap a button below to hear the voice of the person who holds your heart.
        </p>
      </div>

      {/* Main Dual "I Miss Him" / "I Miss Her" Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
        
        {/* Button 1: I Miss Him */}
        <div className="glass-panel p-8 rounded-3xl text-center border-2 border-blue-500/30 hover:border-blue-400/60 transition-all duration-300 shadow-2xl relative overflow-hidden group">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-400 p-0.5 mx-auto mb-6 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
            <div className="w-full h-full bg-velvet-950 rounded-full flex items-center justify-center">
              <Heart className="w-8 h-8 text-blue-400 fill-blue-400/30 animate-pulse" />
            </div>
          </div>

          <h2 className="font-serif text-3xl font-bold text-white mb-2">
            I Miss Him
          </h2>
          <p className="text-xs text-rose-200/70 mb-6">
            Play latest voice message recorded by {coupleSettings.his_name || 'Him'}
          </p>

          <button
            onClick={handleMissHimClick}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-serif text-lg font-semibold shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-3 transition-all active:scale-98"
          >
            {isPlayingAudio && activeVoiceNote?.person === 'him' ? (
              <>
                <Pause className="w-5 h-5" />
                <span>Pause Voice Note</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-white" />
                <span>Play Voice Note</span>
              </>
            )}
          </button>
        </div>

        {/* Button 2: I Miss Her */}
        <div className="glass-panel p-8 rounded-3xl text-center border-2 border-rose-500/30 hover:border-rose-400/60 transition-all duration-300 shadow-2xl relative overflow-hidden group">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-600 to-pink-400 p-0.5 mx-auto mb-6 shadow-lg shadow-rose-500/30 group-hover:scale-110 transition-transform">
            <div className="w-full h-full bg-velvet-950 rounded-full flex items-center justify-center">
              <Heart className="w-8 h-8 text-rose-400 fill-rose-400/30 animate-pulse" />
            </div>
          </div>

          <h2 className="font-serif text-3xl font-bold text-white mb-2">
            I Miss Her
          </h2>
          <p className="text-xs text-rose-200/70 mb-6">
            Play latest voice message recorded by {coupleSettings.her_name || 'Her'}
          </p>

          <button
            onClick={handleMissHerClick}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-serif text-lg font-semibold shadow-lg shadow-rose-600/30 flex items-center justify-center space-x-3 transition-all active:scale-98"
          >
            {isPlayingAudio && activeVoiceNote?.person === 'her' ? (
              <>
                <Pause className="w-5 h-5" />
                <span>Pause Voice Note</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-white" />
                <span>Play Voice Note</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Active Playing Waveform Visualizer */}
      {activeVoiceNote && (
        <div className="mb-14 max-w-3xl mx-auto glass-panel p-8 rounded-3xl border border-rose-500/40 shadow-2xl text-center animate-fade-in relative">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-800/40 text-rose-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Radio className="w-3.5 h-3.5 text-rose-400 animate-ping" />
            <span>Currently Playing ({activeVoiceNote.person === 'him' ? coupleSettings.his_name : coupleSettings.her_name})</span>
          </div>

          <h3 className="font-serif text-2xl font-bold text-white mb-2">
            "{activeVoiceNote.title}"
          </h3>

          {/* Waveform Animation Bars */}
          <div className="flex items-center justify-center space-x-1.5 my-6 h-10">
            {[40, 75, 30, 90, 60, 100, 45, 80, 50, 95, 35, 70, 40].map((h, idx) => (
              <div
                key={idx}
                className={`w-1.5 rounded-full bg-gradient-to-t from-rose-600 to-rose-300 transition-all ${
                  isPlayingAudio ? 'wave-bar' : 'h-2 opacity-50'
                }`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              ></div>
            ))}
          </div>

          {activeVoiceNote.transcript_or_note && (
            <div className="p-4 rounded-2xl bg-velvet-950/60 border border-rose-900/40 text-xs text-rose-200/90 italic max-w-lg mx-auto">
              "{activeVoiceNote.transcript_or_note}"
            </div>
          )}
        </div>
      )}

      {/* Playlist Section */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-2xl font-bold text-white flex items-center space-x-2">
            <Music className="w-5 h-5 text-rose-400" />
            <span>All Voice Messages</span>
          </h3>

          <div className="flex space-x-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'him', label: `From ${coupleSettings.his_name || 'Him'}` },
              { id: 'her', label: `From ${coupleSettings.her_name || 'Her'}` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedPerson(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  selectedPerson === tab.id
                    ? 'bg-rose-600 text-white'
                    : 'bg-velvet-900/60 text-rose-300/70 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="glass-panel p-5 rounded-2xl flex items-center justify-between hover:border-rose-500/40 transition-all"
            >
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => playVoiceNote(note)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    activeVoiceNote?.id === note.id && isPlayingAudio
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-rose-950/80 text-rose-300 border border-rose-800/40 hover:bg-rose-900'
                  }`}
                >
                  {activeVoiceNote?.id === note.id && isPlayingAudio ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5 fill-current" />
                  )}
                </button>

                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-serif text-lg font-semibold text-white">{note.title}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      note.person === 'him' ? 'bg-blue-900/60 text-blue-300' : 'bg-rose-900/60 text-rose-300'
                    }`}>
                      {note.person === 'him' ? coupleSettings.his_name : coupleSettings.her_name}
                    </span>
                  </div>
                  <p className="text-xs text-rose-300/60 mt-1 line-clamp-1">{note.transcript_or_note}</p>
                </div>
              </div>

              <div className="text-xs text-rose-400 font-mono font-medium">
                {note.duration || '0:30'}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

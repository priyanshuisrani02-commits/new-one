import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, BUCKETS } from '../lib/supabaseClient';

const CoupleContext = createContext();

// Default Demo Data
const DEFAULT_SETTINGS = {
  his_name: 'Alex',
  her_name: 'Maya',
  his_timezone: 'America/New_York',
  her_timezone: 'Asia/Tokyo',
  anniversary_date: '2023-02-14',
  daily_love_note: 'Distance means so little when someone means so much. You are 4ever urs 💖'
};

const DEFAULT_CATEGORIES = ['Reunions', 'Vacation', 'Cozy Days', 'Surprises', 'Milestones'];

const DEFAULT_MEMORIES = [
  {
    id: 'mem-1',
    title: 'Our First Airport Reunion ✈️',
    description: 'Running through the terminal and hugging you tight after 4 months apart. The best feeling in the entire world.',
    media_url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=1000',
    media_type: 'image',
    memory_date: '2023-06-15',
    category: 'Reunions',
    location: 'Airport Gate 4',
    is_featured: true
  },
  {
    id: 'mem-2',
    title: 'Midnight Beach Walk & Stargazing 🌊✨',
    description: 'Listening to the waves, holding hands, and counting shooting stars under the warm summer sky.',
    media_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1000',
    media_type: 'image',
    memory_date: '2023-08-22',
    category: 'Vacation',
    location: 'Sunset Beach',
    is_featured: true
  },
  {
    id: 'mem-3',
    title: 'Cozy Virtual Coffee Morning ☕📖',
    description: 'Even with thousands of miles between us, sipping coffee on Facetime every Sunday morning feels like home.',
    media_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=1000',
    media_type: 'image',
    memory_date: '2023-11-05',
    category: 'Cozy Days',
    location: 'Video Call Sanctuary',
    is_featured: true
  }
];

const DEFAULT_VOICE_NOTES = [
  {
    id: 'vn-1',
    title: 'Thinking of you before sleep... 🌙',
    person: 'him',
    audio_url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
    duration: '0:42',
    transcript_or_note: 'Hey love, just wanted to leave you a gentle goodnight message. Close your eyes, I am right there with you.'
  },
  {
    id: 'vn-2',
    title: 'Good morning my sunshine! ☀️',
    person: 'her',
    audio_url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
    duration: '0:35',
    transcript_or_note: 'Good morning gorgeous! Hope your day is bright and sweet. Can not wait for our call tonight!'
  }
];

const DEFAULT_ACTIVITIES = [
  {
    id: 'act-1',
    title: 'Virtual Star Gazing & Chill 🌌',
    description: 'Open up Stellarium online together, share screen, pick a constellation, and talk about our future dreams while listening to low-fi beats.',
    category: 'online_date',
    estimated_minutes: 45,
    is_favorite: true
  },
  {
    id: 'act-2',
    title: 'Simultaneous Movie Watch Party 🍿',
    description: 'Use Teleparty or Discord to sync up our favorite romantic movie. Grab your favorite snacks and react in real-time!',
    category: 'online_date',
    estimated_minutes: 120,
    is_favorite: false
  },
  {
    id: 'act-3',
    title: '21 Deep Questions for Couples 💬',
    description: 'Take turns asking 3 deep questions from a relationship deck. No holding back—just honesty, vulnerability, and warmth.',
    category: 'deep_talk',
    estimated_minutes: 30,
    is_favorite: true
  },
  {
    id: 'act-4',
    title: 'Google Earth Exploration Date 🗺️',
    description: 'Pick a city we want to visit together in 5 years. Explore street views and map out our future dream vacation route.',
    category: 'game',
    estimated_minutes: 40,
    is_favorite: false
  },
  {
    id: 'act-5',
    title: 'Online Co-op Drawing Battle 🎨',
    description: 'Use Skribbl.io or Aggie.io to draw funny caricatures of each other or sketch our future dream house together.',
    category: 'creative',
    estimated_minutes: 25,
    is_favorite: false
  }
];

// Melodious Page Transition Chime
export const playMelodiousChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    const notes = [659.25, 830.61, 987.77, 1318.51];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);
      
      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + idx * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.05 + 0.7);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + idx * 0.05);
      osc.stop(ctx.currentTime + idx * 0.05 + 0.75);
    });
  } catch (e) {}
};

export const CoupleProvider = ({ children }) => {
  // State
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('4ever_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [memories, setMemories] = useState(() => {
    const saved = localStorage.getItem('4ever_memories');
    return saved ? JSON.parse(saved) : DEFAULT_MEMORIES;
  });

  const [voiceNotes, setVoiceNotes] = useState(() => {
    const saved = localStorage.getItem('4ever_voicenotes');
    return saved ? JSON.parse(saved) : DEFAULT_VOICE_NOTES;
  });

  const [activities, setActivities] = useState(() => {
    const saved = localStorage.getItem('4ever_activities');
    return saved ? JSON.parse(saved) : DEFAULT_ACTIVITIES;
  });

  const [coupleSettings, setCoupleSettings] = useState(() => {
    const saved = localStorage.getItem('4ever_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('4ever_is_admin') === 'true';
  });

  // Audio Voice Note Playback State
  const [currentAudio, setCurrentAudio] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeVoiceNote, setActiveVoiceNote] = useState(null);

  // Sync LocalStorage
  useEffect(() => {
    localStorage.setItem('4ever_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('4ever_memories', JSON.stringify(memories));
  }, [memories]);

  useEffect(() => {
    localStorage.setItem('4ever_voicenotes', JSON.stringify(voiceNotes));
  }, [voiceNotes]);

  useEffect(() => {
    localStorage.setItem('4ever_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('4ever_settings', JSON.stringify(coupleSettings));
  }, [coupleSettings]);

  useEffect(() => {
    localStorage.setItem('4ever_is_admin', isAdmin ? 'true' : 'false');
  }, [isAdmin]);

  // Category CRUD
  const addCategory = (name) => {
    const trimmed = name.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    setCategories(prev => [...prev, trimmed]);
  };

  const deleteCategory = (catToDelete) => {
    setCategories(prev => prev.filter(c => c !== catToDelete));
    // Update memories belonging to deleted category
    setMemories(prev => prev.map(m => m.category === catToDelete ? { ...m, category: 'Uncategorized' } : m));
  };

  const updateCategory = (oldName, newName) => {
    const trimmed = newName.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    setCategories(prev => prev.map(c => c === oldName ? trimmed : c));
    setMemories(prev => prev.map(m => m.category === oldName ? { ...m, category: trimmed } : m));
  };

  // Voice Note Playback Controller
  const playVoiceNote = (note) => {
    if (currentAudio) {
      currentAudio.pause();
    }

    if (activeVoiceNote?.id === note.id && isPlayingAudio) {
      setIsPlayingAudio(false);
      return;
    }

    const audio = new Audio(note.audio_url);
    audio.play().then(() => {
      setIsPlayingAudio(true);
      setActiveVoiceNote(note);
      setCurrentAudio(audio);
    }).catch(err => {
      console.error('Audio playback error:', err);
      setIsPlayingAudio(true);
      setActiveVoiceNote(note);
    });

    audio.onended = () => {
      setIsPlayingAudio(false);
    };
  };

  const stopVoiceNote = () => {
    if (currentAudio) {
      currentAudio.pause();
    }
    setIsPlayingAudio(false);
  };

  // Upload File Helper
  const uploadFileFromPC = async (file, bucketName) => {
    return new Promise(async (resolve, reject) => {
      if (isSupabaseConfigured) {
        try {
          const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
          const { data, error } = await supabase.storage.from(bucketName).upload(fileName, file);
          if (!error && data) {
            const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
            return resolve(publicUrlData.publicUrl);
          }
        } catch (e) {
          console.warn('Supabase storage fallback to local Base64:', e);
        }
      }

      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Memory CRUD
  const addMemory = async (newMem) => {
    const memItem = {
      ...newMem,
      id: newMem.id || `mem-${Date.now()}`,
      created_at: new Date().toISOString()
    };

    setMemories(prev => [memItem, ...prev]);

    if (isSupabaseConfigured) {
      await supabase.from('memories').insert([memItem]);
    }
  };

  const deleteMemory = async (id) => {
    setMemories(prev => prev.filter(m => m.id !== id));
    if (isSupabaseConfigured) {
      await supabase.from('memories').delete().eq('id', id);
    }
  };

  // Voice Note CRUD
  const addVoiceNote = async (newNote) => {
    const noteItem = {
      ...newNote,
      id: newNote.id || `vn-${Date.now()}`,
      created_at: new Date().toISOString()
    };

    setVoiceNotes(prev => [noteItem, ...prev]);

    if (isSupabaseConfigured) {
      await supabase.from('voice_notes').insert([noteItem]);
    }
  };

  const deleteVoiceNote = async (id) => {
    setVoiceNotes(prev => prev.filter(v => v.id !== id));
    if (isSupabaseConfigured) {
      await supabase.from('voice_notes').delete().eq('id', id);
    }
  };

  // Activity CRUD
  const addActivity = async (newAct) => {
    const actItem = {
      ...newAct,
      id: newAct.id || `act-${Date.now()}`,
      created_at: new Date().toISOString()
    };

    setActivities(prev => [actItem, ...prev]);

    if (isSupabaseConfigured) {
      await supabase.from('activities').insert([actItem]);
    }
  };

  const deleteActivity = async (id) => {
    setActivities(prev => prev.filter(a => a.id !== id));
    if (isSupabaseConfigured) {
      await supabase.from('activities').delete().eq('id', id);
    }
  };

  const toggleFavoriteActivity = (id) => {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, is_favorite: !a.is_favorite } : a));
  };

  // Admin Auth
  const loginAdmin = (password) => {
    if (password === '4everurs' || password === 'love123' || password === 'admin') {
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
  };

  const value = {
    categories,
    addCategory,
    deleteCategory,
    updateCategory,
    memories,
    voiceNotes,
    activities,
    coupleSettings,
    setCoupleSettings,
    isAdmin,
    loginAdmin,
    logoutAdmin,
    // Audio Controls
    activeVoiceNote,
    isPlayingAudio,
    playVoiceNote,
    stopVoiceNote,
    playMelodiousChime,
    uploadFileFromPC,
    // CRUD Operations
    addMemory,
    deleteMemory,
    addVoiceNote,
    deleteVoiceNote,
    addActivity,
    deleteActivity,
    toggleFavoriteActivity
  };

  return (
    <CoupleContext.Provider value={value}>
      {children}
    </CoupleContext.Provider>
  );
};

export const useCouple = () => useContext(CoupleContext);

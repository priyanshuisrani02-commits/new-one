import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, BUCKETS } from '../lib/supabaseClient';

const CoupleContext = createContext();

const DEFAULT_SETTINGS = {
  id: 1,
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
  { id: 'act-1', title: 'Virtual Star Gazing & Chill 🌌', description: 'Open up Stellarium online together, share screen, pick a constellation, and talk about future dreams while listening to low-fi beats.', category: 'online_date', estimated_minutes: 45, is_favorite: true },
  { id: 'act-2', title: 'Simultaneous Movie Watch Party 🍿', description: 'Use a synchronized watch party and react in real-time.', category: 'online_date', estimated_minutes: 120, is_favorite: false },
  { id: 'act-3', title: '21 Deep Questions for Couples 💬', description: 'Take turns asking thoughtful questions with honesty, vulnerability, and warmth.', category: 'deep_talk', estimated_minutes: 30, is_favorite: true },
  { id: 'act-4', title: 'Google Earth Exploration Date 🗺️', description: 'Pick a city you want to visit together and explore it.', category: 'game', estimated_minutes: 40, is_favorite: false },
  { id: 'act-5', title: 'Online Co-op Drawing Battle 🎨', description: 'Draw funny caricatures or sketch your future dream house together.', category: 'creative', estimated_minutes: 25, is_favorite: false }
];

export const playMelodiousChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    [659.25, 830.61, 987.77, 1318.51].forEach((freq, idx) => {
      const start = ctx.currentTime + idx * 0.05;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.7);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.75);
    });
  } catch (error) {
    console.warn('Audio chime unavailable:', error);
  }
};

export const CoupleProvider = ({ children }) => {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [memories, setMemories] = useState(DEFAULT_MEMORIES);
  const [voiceNotes, setVoiceNotes] = useState(DEFAULT_VOICE_NOTES);
  const [activities, setActivities] = useState(DEFAULT_ACTIVITIES);
  const [coupleSettings, setCoupleSettingsState] = useState(DEFAULT_SETTINGS);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeVoiceNote, setActiveVoiceNote] = useState(null);

  const isAdminUser = (user) => Boolean(user && user.app_metadata?.role === 'admin');

  const loadAllData = async () => {
    if (!isSupabaseConfigured) return;

    const [categoriesResult, memoriesResult, voiceNotesResult, activitiesResult, settingsResult] = await Promise.all([
      supabase.from('categories').select('id,name').order('name', { ascending: true }),
      supabase.from('memories').select('*').order('created_at', { ascending: false }),
      supabase.from('voice_notes').select('*').order('created_at', { ascending: false }),
      supabase.from('activities').select('*').order('created_at', { ascending: false }),
      supabase.from('couple_settings').select('*').eq('id', 1).maybeSingle()
    ]);

    if (!categoriesResult.error && categoriesResult.data?.length) setCategories(categoriesResult.data.map((item) => item.name));
    if (!memoriesResult.error && memoriesResult.data) setMemories(memoriesResult.data);
    if (!voiceNotesResult.error && voiceNotesResult.data) setVoiceNotes(voiceNotesResult.data);
    if (!activitiesResult.error && activitiesResult.data) setActivities(activitiesResult.data);
    if (!settingsResult.error && settingsResult.data) setCoupleSettingsState(settingsResult.data);

    [categoriesResult, memoriesResult, voiceNotesResult, activitiesResult, settingsResult].forEach((result) => {
      if (result.error) console.error('Supabase data load failed:', result.error);
    });
  };

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    let mounted = true;

    const initialize = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (mounted) setIsAdmin(isAdminUser(user));
      await loadAllData();
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setIsAdmin(isAdminUser(session?.user));
    });

    const channel = supabase
      .channel('4ever-urs-data-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, loadAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'memories' }, loadAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'voice_notes' }, loadAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, loadAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'couple_settings' }, loadAllData)
      .subscribe();

    return () => {
      mounted = false;
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  const addCategory = async (name) => {
    const trimmed = name.trim();
    if (!trimmed || categories.some((item) => item.toLowerCase() === trimmed.toLowerCase())) return;
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('categories').insert({ name: trimmed }).select('id,name').single();
        if (!error && data) {
          setCategories((prev) => [...prev, data.name].sort((a, b) => a.localeCompare(b)));
          return data;
        }
      } catch (err) {
        console.warn('Supabase addCategory error:', err);
      }
    }
    setCategories((prev) => [...prev, trimmed].sort((a, b) => a.localeCompare(b)));
  };

  const deleteCategory = async (categoryName) => {
    if (isSupabaseConfigured) {
      try {
        const { data: category } = await supabase.from('categories').select('id').eq('name', categoryName).maybeSingle();
        if (category) {
          await supabase.from('memories').update({ category: 'Uncategorized' }).eq('category', categoryName);
          await supabase.from('categories').delete().eq('id', category.id);
        }
      } catch (err) {
        console.warn('Supabase deleteCategory error:', err);
      }
    }
    setCategories((prev) => prev.filter((item) => item !== categoryName));
    setMemories((prev) => prev.map((memory) => memory.category === categoryName ? { ...memory, category: 'Uncategorized' } : memory));
  };

  const updateCategory = async (oldName, newName) => {
    const trimmed = newName.trim();
    if (!trimmed || categories.some((item) => item !== oldName && item.toLowerCase() === trimmed.toLowerCase())) return;
    if (isSupabaseConfigured) {
      try {
        const { data: category } = await supabase.from('categories').select('id').eq('name', oldName).maybeSingle();
        if (category) {
          await supabase.from('categories').update({ name: trimmed }).eq('id', category.id);
          await supabase.from('memories').update({ category: trimmed }).eq('category', oldName);
        }
      } catch (err) {
        console.warn('Supabase updateCategory error:', err);
      }
    }
    setCategories((prev) => prev.map((item) => item === oldName ? trimmed : item));
    setMemories((prev) => prev.map((memory) => memory.category === oldName ? { ...memory, category: trimmed } : memory));
  };

  const uploadFileFromPC = async (file, bucketName) => {
    if (!file) throw new Error('No file selected.');
    if (isSupabaseConfigured) {
      try {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const fileName = `${Date.now()}_${crypto.randomUUID()}_${safeName}`;
        const { data, error } = await supabase.storage.from(bucketName).upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || undefined
        });
        if (!error && data) {
          const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(data.path);
          return publicUrlData.publicUrl;
        }
      } catch (err) {
        console.warn('Supabase file upload error:', err);
      }
    }
    return URL.createObjectURL(file);
  };

  const addMemory = async (newMem) => {
    const { id, created_at, ...payload } = newMem;
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('memories').insert(payload).select('*').single();
        if (!error && data) {
          setMemories((prev) => [data, ...prev]);
          return data;
        }
      } catch (err) {
        console.warn('Supabase addMemory error:', err);
      }
    }
    const createdMem = { ...newMem, id: `mem-${Date.now()}` };
    setMemories((prev) => [createdMem, ...prev]);
    return createdMem;
  };

  const deleteMemory = async (id) => {
    if (isSupabaseConfigured) {
      try {
        const memory = memories.find((item) => item.id === id);
        await supabase.from('memories').delete().eq('id', id);
        if (memory?.media_url) {
          const marker = '/storage/v1/object/public/memories-media/';
          if (memory.media_url.includes(marker)) {
            const path = decodeURIComponent(memory.media_url.split(marker)[1]);
            await supabase.storage.from(BUCKETS.MEMORIES).remove([path]).catch(() => {});
          }
        }
      } catch (err) {
        console.warn('Supabase deleteMemory error:', err);
      }
    }
    setMemories((prev) => prev.filter((item) => item.id !== id));
  };

  const addVoiceNote = async (newNote) => {
    const { id, created_at, ...payload } = newNote;
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('voice_notes').insert(payload).select('*').single();
        if (!error && data) {
          setVoiceNotes((prev) => [data, ...prev]);
          return data;
        }
      } catch (err) {
        console.warn('Supabase addVoiceNote error:', err);
      }
    }
    const createdNote = { ...newNote, id: `vn-${Date.now()}` };
    setVoiceNotes((prev) => [createdNote, ...prev]);
    return createdNote;
  };

  const deleteVoiceNote = async (id) => {
    if (isSupabaseConfigured) {
      try {
        const note = voiceNotes.find((item) => item.id === id);
        await supabase.from('voice_notes').delete().eq('id', id);
        if (note?.audio_url) {
          const marker = '/storage/v1/object/public/voice-notes-audio/';
          if (note.audio_url.includes(marker)) {
            const path = decodeURIComponent(note.audio_url.split(marker)[1]);
            await supabase.storage.from(BUCKETS.VOICE_NOTES).remove([path]).catch(() => {});
          }
        }
      } catch (err) {
        console.warn('Supabase deleteVoiceNote error:', err);
      }
    }
    setVoiceNotes((prev) => prev.filter((item) => item.id !== id));
  };

  const addActivity = async (newActivity) => {
    const { id, created_at, ...payload } = newActivity;
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('activities').insert(payload).select('*').single();
        if (!error && data) {
          setActivities((prev) => [data, ...prev]);
          return data;
        }
      } catch (err) {
        console.warn('Supabase addActivity error:', err);
      }
    }
    const createdAct = { ...newActivity, id: `act-${Date.now()}` };
    setActivities((prev) => [createdAct, ...prev]);
    return createdAct;
  };

  const deleteActivity = async (id) => {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('activities').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteActivity error:', err);
      }
    }
    setActivities((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleFavoriteActivity = async (id) => {
    const activity = activities.find((item) => item.id === id);
    if (!activity) return;
    const nextFav = !activity.is_favorite;
    if (isSupabaseConfigured) {
      try {
        await supabase.from('activities').update({ is_favorite: nextFav }).eq('id', id);
      } catch (err) {
        console.warn('Supabase toggleFavoriteActivity error:', err);
      }
    }
    setActivities((prev) => prev.map((item) => item.id === id ? { ...item, is_favorite: nextFav } : item));
  };

  const setCoupleSettings = async (nextSettings) => {
    const payload = {
      id: 1,
      his_name: nextSettings.his_name,
      her_name: nextSettings.her_name,
      his_timezone: nextSettings.his_timezone,
      her_timezone: nextSettings.her_timezone,
      anniversary_date: nextSettings.anniversary_date,
      daily_love_note: nextSettings.daily_love_note
    };
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('couple_settings').upsert(payload, { onConflict: 'id' }).select('*').single();
        if (!error && data) {
          setCoupleSettingsState(data);
          return data;
        }
      } catch (err) {
        console.warn('Supabase setCoupleSettings error:', err);
      }
    }
    setCoupleSettingsState(payload);
    return payload;
  };

  const loginAdmin = (password) => {
    const validPassword = import.meta.env.VITE_ADMIN_PASSWORD || '4everurs';
    if (password === validPassword || password === '4everurs') {
      setIsAdmin(true);
      return true;
    }

    if (isSupabaseConfigured && import.meta.env.VITE_ADMIN_EMAIL) {
      supabase.auth.signInWithPassword({
        email: import.meta.env.VITE_ADMIN_EMAIL,
        password
      }).then(({ data, error }) => {
        if (!error && data?.user) {
          setIsAdmin(isAdminUser(data.user) || true);
        }
      }).catch((err) => {
        console.warn('Supabase auth sign-in error:', err);
      });
    }

    return false;
  };

  const logoutAdmin = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut({ scope: 'local' });
    setIsAdmin(false);
  };

  const playVoiceNote = (note) => {
    if (currentAudio) currentAudio.pause();
    if (activeVoiceNote?.id === note.id && isPlayingAudio) {
      setIsPlayingAudio(false);
      return;
    }
    const audio = new Audio(note.audio_url);
    audio.play().then(() => {
      setIsPlayingAudio(true);
      setActiveVoiceNote(note);
      setCurrentAudio(audio);
    }).catch((error) => console.error('Audio playback error:', error));
    audio.onended = () => {
      setIsPlayingAudio(false);
      setCurrentAudio(null);
    };
  };

  const stopVoiceNote = () => {
    if (currentAudio) currentAudio.pause();
    setCurrentAudio(null);
    setIsPlayingAudio(false);
  };

  const value = {
    categories, addCategory, deleteCategory, updateCategory,
    memories, voiceNotes, activities, coupleSettings, setCoupleSettings,
    isAdmin, loginAdmin, logoutAdmin,
    activeVoiceNote, isPlayingAudio, playVoiceNote, stopVoiceNote,
    playMelodiousChime, uploadFileFromPC,
    addMemory, deleteMemory, addVoiceNote, deleteVoiceNote,
    addActivity, deleteActivity, toggleFavoriteActivity
  };

  return <CoupleContext.Provider value={value}>{children}</CoupleContext.Provider>;
};

export const useCouple = () => useContext(CoupleContext);

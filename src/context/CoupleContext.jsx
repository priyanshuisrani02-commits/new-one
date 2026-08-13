import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, BUCKETS } from '../lib/supabaseClient';

const CoupleContext = createContext(null);

const DEFAULT_SETTINGS = {
  id: 1,
  his_name: 'Alex',
  her_name: 'Maya',
  his_timezone: 'America/New_York',
  her_timezone: 'Asia/Tokyo',
  anniversary_date: '2023-02-14',
  daily_love_note: 'Distance means so little when someone means so much. You are 4ever urs 💖',
};

export const playMelodiousChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    [659.25, 830.61, 987.77, 1318.51].forEach((frequency, index) => {
      const start = ctx.currentTime + index * 0.05;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.7);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.75);
    });
  } catch (error) {
    console.warn('Chime playback error:', error);
  }
};

export const CoupleProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [memories, setMemories] = useState([]);
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [activities, setActivities] = useState([]);
  const [coupleSettings, setCoupleSettingsState] = useState(DEFAULT_SETTINGS);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeVoiceNote, setActiveVoiceNote] = useState(null);

  const checkAdminAuthorization = async (user) => {
    if (!user || !user.email_confirmed_at) return false;
    const { data, error } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();
    if (error) {
      console.error('Admin authorization check failed:', error);
      return false;
    }
    return Boolean(data?.user_id);
  };

  const applySession = async (session) => {
    const user = session?.user || null;
    if (!user) {
      setCurrentUser(null);
      setIsAdmin(false);
      return;
    }
    setCurrentUser(user);
    setIsAdmin(await checkAdminAuthorization(user));
  };

  useEffect(() => {
    let mounted = true;
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      setDataLoading(false);
      return () => { mounted = false; };
    }

    const loadSession = async () => {
      setAuthLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) console.error('Failed to restore Supabase session:', error);
        if (mounted) await applySession(session);
      } catch (error) {
        console.error('Supabase authentication error:', error);
        if (mounted) {
          setCurrentUser(null);
          setIsAdmin(false);
        }
      } finally {
        if (mounted) setAuthLoading(false);
      }
    };

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setAuthLoading(true);
      window.setTimeout(async () => {
        if (!mounted) return;
        try {
          await applySession(session);
        } catch (error) {
          console.error('Failed to apply authentication state:', error);
          setCurrentUser(session?.user || null);
          setIsAdmin(false);
        } finally {
          if (mounted) setAuthLoading(false);
        }
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadData = async () => {
    if (!isSupabaseConfigured) {
      setDataLoading(false);
      return;
    }
    setDataLoading(true);
    try {
      const [categoriesResult, memoriesResult, voiceResult, activitiesResult, settingsResult] = await Promise.all([
        supabase.from('categories').select('*').order('name', { ascending: true }),
        supabase.from('memories').select('*').order('created_at', { ascending: false }),
        supabase.from('voice_notes').select('*').order('created_at', { ascending: false }),
        supabase.from('activities').select('*').order('created_at', { ascending: false }),
        supabase.from('couple_settings').select('*').eq('id', 1).maybeSingle(),
      ]);
      if (!categoriesResult.error) setCategories((categoriesResult.data || []).map((item) => item.name));
      if (!memoriesResult.error) setMemories(memoriesResult.data || []);
      if (!voiceResult.error) setVoiceNotes(voiceResult.data || []);
      if (!activitiesResult.error) setActivities(activitiesResult.data || []);
      if (!settingsResult.error && settingsResult.data) setCoupleSettingsState(settingsResult.data);
      [categoriesResult, memoriesResult, voiceResult, activitiesResult, settingsResult].forEach((result) => {
        if (result.error) console.error('Supabase data load failed:', result.error);
      });
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (!isSupabaseConfigured) return undefined;
    const channel = supabase.channel('4ever-urs-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'memories' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'voice_notes' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'couple_settings' }, loadData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const requireAdmin = async () => {
    if (!currentUser?.email_confirmed_at) return false;
    if (isAdmin) return true;
    const authorized = await checkAdminAuthorization(currentUser);
    setIsAdmin(authorized);
    return authorized;
  };

  const loginAdmin = async (email, password) => {
    if (!isSupabaseConfigured || !email?.trim() || !password) return false;
    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) return false;
      const user = data?.user;
      if (!user?.email_confirmed_at || !(await checkAdminAuthorization(user))) {
        await supabase.auth.signOut();
        setCurrentUser(null);
        setIsAdmin(false);
        return false;
      }
      setCurrentUser(user);
      setIsAdmin(true);
      return true;
    } catch (error) {
      console.error('Admin sign-in error:', error);
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const logoutAdmin = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut().catch((error) => console.error('Sign-out failed:', error));
    setCurrentUser(null);
    setIsAdmin(false);
    return true;
  };

  const addCategory = async (name) => {
    if (!(await requireAdmin())) return false;
    const trimmed = String(name || '').trim();
    if (!trimmed || categories.some((item) => item.toLowerCase() === trimmed.toLowerCase())) return false;
    const { data, error } = await supabase.from('categories').insert({ name: trimmed }).select().single();
    if (error) return false;
    setCategories((prev) => [...prev, data.name].sort((a, b) => a.localeCompare(b)));
    return true;
  };

  const deleteCategory = async (name) => {
    if (!(await requireAdmin())) return false;
    const { error } = await supabase.from('categories').delete().eq('name', name);
    if (error) return false;
    await supabase.from('memories').update({ category: 'Uncategorized' }).eq('category', name);
    setCategories((prev) => prev.filter((item) => item !== name));
    setMemories((prev) => prev.map((item) => item.category === name ? { ...item, category: 'Uncategorized' } : item));
    return true;
  };

  const updateCategory = async (oldName, newName) => {
    if (!(await requireAdmin())) return false;
    const trimmed = String(newName || '').trim();
    if (!trimmed || oldName === trimmed || categories.some((item) => item !== oldName && item.toLowerCase() === trimmed.toLowerCase())) return false;
    const { error } = await supabase.from('categories').update({ name: trimmed }).eq('name', oldName);
    if (error) return false;
    await supabase.from('memories').update({ category: trimmed }).eq('category', oldName);
    setCategories((prev) => prev.map((item) => item === oldName ? trimmed : item).sort((a, b) => a.localeCompare(b)));
    setMemories((prev) => prev.map((item) => item.category === oldName ? { ...item, category: trimmed } : item));
    return true;
  };

  const setCoupleSettings = async (settings) => {
    if (!(await requireAdmin())) return false;
    const { data, error } = await supabase.from('couple_settings').upsert({ id: 1, ...settings, updated_at: new Date().toISOString() }).select().single();
    if (error) return false;
    setCoupleSettingsState(data);
    return true;
  };

  const uploadFileFromPC = async (file, bucketName) => {
    if (!(await requireAdmin())) throw new Error('You are not authorized to upload files.');
    if (!file || !bucketName) throw new Error('A file and storage bucket are required.');
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const { data, error } = await supabase.storage.from(bucketName).upload(`${crypto.randomUUID()}_${safeName}`, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    return supabase.storage.from(bucketName).getPublicUrl(data.path).data.publicUrl;
  };

  const addMemory = async (memory) => {
    if (!(await requireAdmin())) throw new Error('You are not authorized to add memories.');
    const { id, created_at, ...payload } = memory;
    const { data, error } = await supabase.from('memories').insert(payload).select().single();
    if (error) throw error;
    setMemories((prev) => [data, ...prev]);
    return data;
  };

  const deleteMemory = async (id) => {
    if (!(await requireAdmin())) return false;
    const { error } = await supabase.from('memories').delete().eq('id', id);
    if (error) throw error;
    setMemories((prev) => prev.filter((item) => item.id !== id));
    return true;
  };

  const addVoiceNote = async (note) => {
    if (!(await requireAdmin())) throw new Error('You are not authorized to add voice notes.');
    const { id, created_at, ...payload } = note;
    const { data, error } = await supabase.from('voice_notes').insert(payload).select().single();
    if (error) throw error;
    setVoiceNotes((prev) => [data, ...prev]);
    return data;
  };

  const deleteVoiceNote = async (id) => {
    if (!(await requireAdmin())) return false;
    const { error } = await supabase.from('voice_notes').delete().eq('id', id);
    if (error) throw error;
    if (activeVoiceNote?.id === id) stopVoiceNote();
    setVoiceNotes((prev) => prev.filter((item) => item.id !== id));
    return true;
  };

  const addActivity = async (activity) => {
    if (!(await requireAdmin())) throw new Error('You are not authorized to add activities.');
    const { id, created_at, ...payload } = activity;
    const { data, error } = await supabase.from('activities').insert(payload).select().single();
    if (error) throw error;
    setActivities((prev) => [data, ...prev]);
    return data;
  };

  const deleteActivity = async (id) => {
    if (!(await requireAdmin())) return false;
    const { error } = await supabase.from('activities').delete().eq('id', id);
    if (error) throw error;
    setActivities((prev) => prev.filter((item) => item.id !== id));
    return true;
  };

  const toggleFavoriteActivity = async (id) => {
    if (!(await requireAdmin())) return false;
    const activity = activities.find((item) => item.id === id);
    if (!activity) return false;
    const { data, error } = await supabase.from('activities').update({ is_favorite: !activity.is_favorite }).eq('id', id).select().single();
    if (error) return false;
    setActivities((prev) => prev.map((item) => item.id === id ? data : item));
    return true;
  };

  const playVoiceNote = (note) => {
    if (!note?.audio_url) return;
    if (currentAudio) currentAudio.pause();
    if (activeVoiceNote?.id === note.id && isPlayingAudio) {
      setIsPlayingAudio(false);
      return;
    }
    const audio = new Audio(note.audio_url);
    audio.onended = () => { setIsPlayingAudio(false); setActiveVoiceNote(null); setCurrentAudio(null); };
    audio.onerror = () => { setIsPlayingAudio(false); setActiveVoiceNote(null); setCurrentAudio(null); };
    audio.play().then(() => { setCurrentAudio(audio); setActiveVoiceNote(note); setIsPlayingAudio(true); }).catch((error) => console.error('Audio playback error:', error));
  };

  const stopVoiceNote = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    setIsPlayingAudio(false);
    setActiveVoiceNote(null);
    setCurrentAudio(null);
  };

  useEffect(() => () => { if (currentAudio) currentAudio.pause(); }, [currentAudio]);

  return (
    <CoupleContext.Provider value={{
      categories, addCategory, deleteCategory, updateCategory,
      memories, voiceNotes, activities,
      coupleSettings, setCoupleSettings,
      isAdmin, authLoading, dataLoading, currentUser,
      loginAdmin, logoutAdmin,
      activeVoiceNote, isPlayingAudio, playVoiceNote, stopVoiceNote,
      playMelodiousChime, uploadFileFromPC,
      addMemory, deleteMemory, addVoiceNote, deleteVoiceNote,
      addActivity, deleteActivity, toggleFavoriteActivity,
      refreshData: loadData, BUCKETS,
    }}>
      {children}
    </CoupleContext.Provider>
  );
};

export const useCouple = () => useContext(CoupleContext);

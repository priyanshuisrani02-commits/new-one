import React, { useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const WordSphere = () => {
  const [words, setWords] = useState([]);
  const [rotation, setRotation] = useState(0);
  const [tilt, setTilt] = useState(0);
  const loadWords = async () => {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabase.from('word_sphere_words').select('id,word,weight').eq('is_active', true).order('created_at', { ascending: true });
    if (!error && data?.length) setWords(data);
  };
  useEffect(() => {
    loadWords();
    if (!isSupabaseConfigured) return undefined;
    const channel = supabase.channel('word-sphere-live').on('postgres_changes', { event: '*', schema: 'public', table: 'word_sphere_words' }, loadWords).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);
  useEffect(() => {
    let frame;
    const tick = () => { setRotation((value) => (value + 0.16) % 360); frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  const positionedWords = useMemo(() => {
    const source = words.length ? words : [
      { id: 'love', word: 'LOVE', weight: 5 }, { id: 'us', word: 'US', weight: 5 }, { id: 'forever', word: 'FOREVER', weight: 4 },
      { id: 'always', word: 'ALWAYS', weight: 4 }, { id: 'together', word: 'TOGETHER', weight: 4 }, { id: 'home', word: 'HOME', weight: 3 },
      { id: 'memories', word: 'MEMORIES', weight: 3 }, { id: 'laughter', word: 'LAUGHTER', weight: 3 }, { id: 'dreams', word: 'DREAMS', weight: 2 },
      { id: 'you', word: 'YOU', weight: 5 }, { id: 'me', word: 'ME', weight: 5 }, { id: 'ours', word: 'OURS', weight: 4 },
      { id: 'magic', word: 'MAGIC', weight: 2 }, { id: 'sunshine', word: 'SUNSHINE', weight: 2 }, { id: 'moonlight', word: 'MOONLIGHT', weight: 2 },
    ];
    return source.map((item, index) => {
      const phi = Math.acos(1 - (2 * (index + 0.5)) / source.length);
      const theta = Math.PI * (1 + Math.sqrt(5)) * index;
      return { ...item, x: Math.sin(phi) * Math.cos(theta), y: Math.cos(phi), z: Math.sin(phi) * Math.sin(theta), index };
    });
  }, [words]);
  return (
    <div className="word-sphere-wrap" onMouseMove={(event) => { const rect = event.currentTarget.getBoundingClientRect(); setTilt(((event.clientX - rect.left) / rect.width - 0.5) * 12); }} onMouseLeave={() => setTilt(0)} aria-hidden="true">
      <div className="word-sphere-haze" />
      <div className="word-sphere" style={{ transform: `rotateX(${tilt}deg) rotateY(${rotation}deg)` }}>
        {positionedWords.map((item) => {
          const depth = (item.z + 1) / 2;
          return <span key={item.id} className="sphere-word" style={{ left: `${50 + item.x * 42}%`, top: `${50 + item.y * 42}%`, transform: `translate(-50%, -50%) translateZ(${item.z * 100}px)`, opacity: 0.16 + depth * 0.62, fontSize: `${0.65 + item.weight * 0.11}rem`, zIndex: Math.round(depth * 100), animationDelay: `${(item.index % 7) * -0.7}s` }}>{item.word}</span>;
        })}
      </div>
    </div>
  );
};

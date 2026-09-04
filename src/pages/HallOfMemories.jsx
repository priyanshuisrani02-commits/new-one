import React, { useEffect, useRef, useState } from 'react';
import { Image, Video, Calendar, MapPin, Tag, Heart, X, Sparkles, Filter, Plus, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';
import { useCouple } from '../context/CoupleContext';

export const HallOfMemories = ({ setActiveTab }) => {
  const { memories, categories, isAdmin } = useCouple();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeMemory, setActiveMemory] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const imageViewportRef = useRef(null);
  const dragRef = useRef({ startX: 0, startY: 0, originX: 0, originY: 0 });
  const pinchRef = useRef({ distance: 0, zoom: 1 });

  const categoryOptions = ['All', ...categories];
  const filteredMemories = selectedCategory === 'All' ? memories : memories.filter(m => m.category === selectedCategory);

  const clampPan = (nextPan, nextZoom = zoom) => {
    if (nextZoom <= 1) return { x: 0, y: 0 };
    const box = imageViewportRef.current?.getBoundingClientRect();
    if (!box) return nextPan;
    const maxX = Math.max(0, (box.width * nextZoom - box.width) / 2);
    const maxY = Math.max(0, (box.height * nextZoom - box.height) / 2);
    return { x: Math.max(-maxX, Math.min(maxX, nextPan.x)), y: Math.max(-maxY, Math.min(maxY, nextPan.y)) };
  };

  const setZoomLevel = (nextZoom, focusPoint = null) => {
    const clamped = Math.max(1, Math.min(5, Number(nextZoom.toFixed(2))));
    if (!focusPoint || clamped <= 1) {
      setZoom(clamped);
      setPan(clampPan({ x: 0, y: 0 }, clamped));
      return;
    }
    const ratio = clamped / zoom;
    setPan(current => clampPan({ x: focusPoint.x + (current.x - focusPoint.x) * ratio, y: focusPoint.y + (current.y - focusPoint.y) * ratio }, clamped));
    setZoom(clamped);
  };

  const openLightbox = (memory) => {
    setActiveMemory(memory);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsFullscreen(false);
  };

  const closeLightbox = () => {
    setActiveMemory(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsFullscreen(false);
  };

  const navigateLightbox = (direction) => {
    if (!activeMemory) return;
    const currentIndex = filteredMemories.findIndex(m => m.id === activeMemory.id);
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= filteredMemories.length) newIndex = 0;
    if (newIndex < 0) newIndex = filteredMemories.length - 1;
    setActiveMemory(filteredMemories[newIndex]);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await imageViewportRef.current?.requestFullscreen?.();
      else await document.exitFullscreen?.();
    } catch { setIsFullscreen(value => !value); }
  };

  useEffect(() => {
    if (!activeMemory) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (document.fullscreenElement) document.exitFullscreen?.();
        else closeLightbox();
        return;
      }
      if (event.key === 'ArrowLeft') navigateLightbox('prev');
      if (event.key === 'ArrowRight') navigateLightbox('next');
      if (activeMemory.media_type === 'video') return;
      if (event.key === '+' || event.key === '=') setZoomLevel(zoom + 0.5);
      if (event.key === '-' || event.key === '_') setZoomLevel(zoom - 0.5);
      if (event.key === '0') setZoomLevel(1);
    };
    const handleFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreen);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreen);
    };
  }, [activeMemory, zoom]);

  const handleWheel = (event) => {
    if (activeMemory?.media_type === 'video') return;
    event.preventDefault();
    const rect = imageViewportRef.current?.getBoundingClientRect();
    const point = rect ? { x: event.clientX - rect.left - rect.width / 2, y: event.clientY - rect.top - rect.height / 2 } : null;
    setZoomLevel(zoom + (event.deltaY < 0 ? 0.25 : -0.25), point);
  };

  const handlePointerDown = (event) => {
    if (activeMemory?.media_type === 'video' || zoom <= 1) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = { startX: event.clientX, startY: event.clientY, originX: pan.x, originY: pan.y };
    setDragging(true);
  };

  const handlePointerMove = (event) => {
    if (!dragging || activeMemory?.media_type === 'video') return;
    setPan(clampPan({ x: dragRef.current.originX + event.clientX - dragRef.current.startX, y: dragRef.current.originY + event.clientY - dragRef.current.startY }));
  };

  const handlePointerUp = () => setDragging(false);

  const handleTouchStart = (event) => {
    if (activeMemory?.media_type === 'video') return;
    if (event.touches.length === 2) {
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      pinchRef.current = { distance: Math.hypot(dx, dy), zoom };
    }
  };

  const handleTouchMove = (event) => {
    if (activeMemory?.media_type === 'video' || event.touches.length !== 2) return;
    event.preventDefault();
    const dx = event.touches[0].clientX - event.touches[1].clientX;
    const dy = event.touches[0].clientY - event.touches[1].clientY;
    const distance = Math.hypot(dx, dy);
    if (pinchRef.current.distance) setZoomLevel(pinchRef.current.zoom * (distance / pinchRef.current.distance));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-rose-900/40 border border-rose-500/30 text-rose-300 text-xs font-medium mb-4"><Sparkles className="w-3.5 h-3.5" /><span>Our Visual Time Capsule</span></div>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-4">Hall of Memories</h1>
        <p className="text-rose-200/70 text-sm sm:text-base font-sans leading-relaxed">Every photo and video here holds a heartbeat from our story. Managed directly from our secret couple admin dashboard.</p>
        {isAdmin && <button onClick={() => setActiveTab('admin')} className="mt-6 inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 transition-all"><Plus className="w-4 h-4" /><span>Add Memory or Category in Admin</span></button>}
      </div>

      <div className="flex items-center justify-center space-x-2 overflow-x-auto pb-6 mb-8 no-scrollbar"><Filter className="w-4 h-4 text-rose-400 mr-2 flex-shrink-0" />{categoryOptions.map(cat => <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex-shrink-0 ${selectedCategory === cat ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-md shadow-rose-600/30 scale-105' : 'bg-velvet-900/60 text-rose-200/70 hover:text-white hover:bg-rose-950/60 border border-rose-900/40'}`}>{cat}</button>)}</div>

      {filteredMemories.length === 0 ? <div className="text-center py-20 glass-panel rounded-3xl max-w-md mx-auto"><Heart className="w-12 h-12 text-rose-500/40 mx-auto mb-4" /><h3 className="font-serif text-xl font-semibold text-white">No memories in this category yet</h3><p className="text-xs text-rose-300/60 mt-2">Switch categories or add memories in the admin panel!</p></div> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{filteredMemories.map(mem => <div key={mem.id} onClick={() => openLightbox(mem)} className="group glass-panel rounded-3xl overflow-hidden cursor-pointer border border-rose-900/30 hover:border-rose-500/40 transition-all duration-300 hover:-translate-y-1 shadow-xl"><div className="relative aspect-[4/3] bg-velvet-950 overflow-hidden">{mem.media_type === 'video' ? <video src={mem.media_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" muted /> : <img src={mem.media_url} alt={mem.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}<div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-velvet-950/70 backdrop-blur-md border border-rose-500/30 text-rose-200 text-xs flex items-center space-x-1">{mem.media_type === 'video' ? <Video className="w-3.5 h-3.5" /> : <Image className="w-3.5 h-3.5" />}<span className="capitalize">{mem.category || 'Memory'}</span></div></div><div className="p-5"><div className="flex items-center space-x-3 text-xs text-rose-300/70 mb-2"><span className="flex items-center space-x-1"><Calendar className="w-3.5 h-3.5 text-rose-400" /><span>{mem.memory_date}</span></span>{mem.location && <span className="flex items-center space-x-1"><MapPin className="w-3.5 h-3.5 text-champagne-300" /><span>{mem.location}</span></span>}</div><h3 className="font-serif text-xl font-semibold text-white group-hover:text-rose-200 transition-colors line-clamp-1">{mem.title}</h3><p className="text-xs text-rose-200/60 mt-1.5 line-clamp-2 leading-relaxed">{mem.description}</p></div></div>)}</div>}

      {activeMemory && <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-velvet-950/95 backdrop-blur-xl animate-fade-in" onWheel={handleWheel}>
        <button onClick={closeLightbox} aria-label="Close memory" className="absolute top-4 right-4 sm:top-6 sm:right-6 p-3 rounded-full bg-rose-950/80 text-rose-200 hover:text-white border border-rose-800/40 transition-all z-40"><X className="w-6 h-6" /></button>
        <button onClick={() => navigateLightbox('prev')} aria-label="Previous memory" className="absolute left-2 sm:left-8 p-3 rounded-full bg-rose-950/80 text-rose-200 hover:text-white border border-rose-800/40 transition-all z-40"><ChevronLeft className="w-6 h-6" /></button>
        <button onClick={() => navigateLightbox('next')} aria-label="Next memory" className="absolute right-2 sm:right-8 p-3 rounded-full bg-rose-950/80 text-rose-200 hover:text-white border border-rose-800/40 transition-all z-40"><ChevronRight className="w-6 h-6" /></button>

        <div className="max-w-6xl w-full max-h-[94vh] glass-panel rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col md:flex-row border border-rose-500/40 shadow-2xl">
          <div ref={imageViewportRef} className={`md:w-3/5 bg-black flex items-center justify-center min-h-[55vh] md:min-h-[70vh] relative overflow-hidden ${zoom > 1 && activeMemory.media_type !== 'video' ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : ''} ${isFullscreen ? 'w-full h-full' : ''}`} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onDoubleClick={() => activeMemory.media_type !== 'video' && setZoomLevel(zoom > 1 ? 1 : 2)}>
            {activeMemory.media_type === 'video' ? <video src={activeMemory.media_url} controls autoPlay className="max-h-[80vh] w-full object-contain" /> : <img src={activeMemory.media_url} alt={activeMemory.title} draggable="false" className="max-h-[82vh] max-w-full object-contain select-none will-change-transform transition-transform duration-100 ease-out" style={{ transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`, touchAction: zoom > 1 ? 'none' : 'pan-y' }} />}
            {activeMemory.media_type !== 'video' && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1.5 rounded-2xl bg-velvet-950/90 backdrop-blur-md border border-rose-500/30 shadow-xl z-20"><button onClick={() => setZoomLevel(zoom - 0.5)} disabled={zoom <= 1} aria-label="Zoom out" className="p-2.5 rounded-xl text-rose-200 hover:text-white hover:bg-rose-900/70 disabled:opacity-30 transition-all"><ZoomOut className="w-4 h-4" /></button><button onClick={() => setZoomLevel(1)} aria-label="Reset zoom" className="min-w-[58px] px-2 py-2.5 rounded-xl text-xs font-semibold text-rose-100 hover:bg-rose-900/70 transition-all">{Math.round(zoom * 100)}%</button><button onClick={() => setZoomLevel(zoom + 0.5)} disabled={zoom >= 5} aria-label="Zoom in" className="p-2.5 rounded-xl text-rose-200 hover:text-white hover:bg-rose-900/70 disabled:opacity-30 transition-all"><ZoomIn className="w-4 h-4" /></button><button onClick={() => setZoomLevel(1)} aria-label="Reset zoom" className="p-2.5 rounded-xl text-rose-200 hover:text-white hover:bg-rose-900/70 transition-all"><RotateCcw className="w-4 h-4" /></button><button onClick={toggleFullscreen} aria-label="Fullscreen image" className="p-2.5 rounded-xl text-rose-200 hover:text-white hover:bg-rose-900/70 transition-all"><Maximize2 className="w-4 h-4" /></button></div>}
            {activeMemory.media_type !== 'video' && zoom > 1 && <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-black/65 backdrop-blur px-3 py-1.5 text-[10px] text-white/80 pointer-events-none">Pinch to zoom · drag to move · double-click to reset</div>}
          </div>

          <div className="md:w-2/5 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto max-h-[38vh] md:max-h-none"><div><div className="flex items-center space-x-2 text-xs font-semibold text-rose-400 uppercase tracking-widest mb-3"><Tag className="w-3.5 h-3.5" /><span>{activeMemory.category}</span></div><h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-4">{activeMemory.title}</h2><div className="flex flex-wrap items-center gap-4 text-xs text-rose-300/80 pb-4 mb-4 border-b border-rose-900/40"><span className="flex items-center space-x-1"><Calendar className="w-4 h-4 text-rose-400" /><span>{activeMemory.memory_date}</span></span>{activeMemory.location && <span className="flex items-center space-x-1"><MapPin className="w-4 h-4 text-champagne-300" /><span>{activeMemory.location}</span></span>}</div><p className="text-sm text-rose-100/90 leading-relaxed font-sans">{activeMemory.description}</p></div><div className="pt-6 mt-6 border-t border-rose-900/40 flex items-center justify-between text-xs text-rose-300/60 font-cursive text-base"><span className="flex items-center space-x-1"><Heart className="w-4 h-4 text-rose-400 fill-rose-400" /><span>4EVER URS Memory</span></span></div></div>
        </div>
      </div>}
    </div>
  );
};
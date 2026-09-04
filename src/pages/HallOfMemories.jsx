import React, { useEffect, useState } from 'react';
import { Image, Video, Calendar, MapPin, Tag, Heart, X, Sparkles, Filter, Plus, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useCouple } from '../context/CoupleContext';

export const HallOfMemories = ({ setActiveTab }) => {
  const { memories, categories, isAdmin } = useCouple();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeMemory, setActiveMemory] = useState(null);
  const [zoom, setZoom] = useState(1);

  const categoryOptions = ['All', ...categories];

  const filteredMemories = selectedCategory === 'All'
    ? memories
    : memories.filter(m => m.category === selectedCategory);

  const openLightbox = (memory) => {
    setActiveMemory(memory);
    setZoom(1);
  };

  const closeLightbox = () => {
    setActiveMemory(null);
    setZoom(1);
  };

  const navigateLightbox = (direction) => {
    if (!activeMemory) return;
    const currentIndex = filteredMemories.findIndex(m => m.id === activeMemory.id);
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (newIndex >= filteredMemories.length) newIndex = 0;
    if (newIndex < 0) newIndex = filteredMemories.length - 1;

    setActiveMemory(filteredMemories[newIndex]);
    setZoom(1);
  };

  const zoomIn = () => setZoom(current => Math.min(4, Number((current + 0.5).toFixed(1))));
  const zoomOut = () => setZoom(current => Math.max(1, Number((current - 0.5).toFixed(1))));
  const resetZoom = () => setZoom(1);

  useEffect(() => {
    if (!activeMemory || activeMemory.media_type === 'video') return;

    const handleKeyDown = (event) => {
      if (event.key === '+' || event.key === '=') zoomIn();
      if (event.key === '-' || event.key === '_') zoomOut();
      if (event.key === '0') resetZoom();
      if (event.key === 'Escape') closeLightbox();
    };

    const handleWheel = (event) => {
      if (event.ctrlKey) {
        event.preventDefault();
        if (event.deltaY < 0) zoomIn();
        else zoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [activeMemory, zoom]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-rose-900/40 border border-rose-500/30 text-rose-300 text-xs font-medium mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Our Visual Time Capsule</span>
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-4">
          Hall of Memories
        </h1>
        <p className="text-rose-200/70 text-sm sm:text-base font-sans leading-relaxed">
          Every photo and video here holds a heartbeat from our story. Managed directly from our secret couple admin dashboard.
        </p>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className="mt-6 inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Memory or Category in Admin</span>
          </button>
        )}
      </div>

      <div className="flex items-center justify-center space-x-2 overflow-x-auto pb-6 mb-8 no-scrollbar">
        <Filter className="w-4 h-4 text-rose-400 mr-2 flex-shrink-0" />
        {categoryOptions.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex-shrink-0 ${
              selectedCategory === cat
                ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-md shadow-rose-600/30 scale-105'
                : 'bg-velvet-900/60 text-rose-200/70 hover:text-white hover:bg-rose-950/60 border border-rose-900/40'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredMemories.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-3xl max-w-md mx-auto">
          <Heart className="w-12 h-12 text-rose-500/40 mx-auto mb-4" />
          <h3 className="font-serif text-xl font-semibold text-white">No memories in this category yet</h3>
          <p className="text-xs text-rose-300/60 mt-2">Switch categories or add memories in the admin panel!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMemories.map((mem) => (
            <div
              key={mem.id}
              onClick={() => openLightbox(mem)}
              className="group glass-panel rounded-3xl overflow-hidden cursor-pointer border border-rose-900/30 hover:border-rose-500/40 transition-all duration-300 hover:-translate-y-1 shadow-xl"
            >
              <div className="relative aspect-[4/3] bg-velvet-950 overflow-hidden">
                {mem.media_type === 'video' ? (
                  <video
                    src={mem.media_url}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    muted
                  />
                ) : (
                  <img
                    src={mem.media_url}
                    alt={mem.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}

                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-velvet-950/70 backdrop-blur-md border border-rose-500/30 text-rose-200 text-xs flex items-center space-x-1">
                  {mem.media_type === 'video' ? <Video className="w-3.5 h-3.5" /> : <Image className="w-3.5 h-3.5" />}
                  <span className="capitalize">{mem.category || 'Memory'}</span>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center space-x-3 text-xs text-rose-300/70 mb-2">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-rose-400" />
                    <span>{mem.memory_date}</span>
                  </span>
                  {mem.location && (
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-champagne-300" />
                      <span>{mem.location}</span>
                    </span>
                  )}
                </div>

                <h3 className="font-serif text-xl font-semibold text-white group-hover:text-rose-200 transition-colors line-clamp-1">
                  {mem.title}
                </h3>

                <p className="text-xs text-rose-200/60 mt-1.5 line-clamp-2 leading-relaxed">
                  {mem.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeMemory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-velvet-950/90 backdrop-blur-xl animate-fade-in"
          onWheel={(event) => {
            if (activeMemory.media_type === 'video') return;
            if (event.ctrlKey) return;
            if (event.deltaY < 0) zoomIn();
            else if (event.deltaY > 0) zoomOut();
          }}
        >
          <button
            onClick={closeLightbox}
            aria-label="Close memory"
            className="absolute top-6 right-6 p-3 rounded-full bg-rose-950/80 text-rose-200 hover:text-white border border-rose-800/40 hover:bg-rose-900 transition-all z-30"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={() => navigateLightbox('prev')}
            aria-label="Previous memory"
            className="absolute left-4 sm:left-8 p-3 rounded-full bg-rose-950/80 text-rose-200 hover:text-white border border-rose-800/40 hover:bg-rose-900 transition-all z-30"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={() => navigateLightbox('next')}
            aria-label="Next memory"
            className="absolute right-4 sm:right-8 p-3 rounded-full bg-rose-950/80 text-rose-200 hover:text-white border border-rose-800/40 hover:bg-rose-900 transition-all z-30"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="max-w-5xl w-full max-h-[90vh] glass-panel rounded-3xl overflow-hidden flex flex-col md:flex-row border border-rose-500/40 shadow-2xl">
            <div className="md:w-3/5 bg-black flex items-center justify-center overflow-hidden min-h-[300px] relative">
              {activeMemory.media_type === 'video' ? (
                <video src={activeMemory.media_url} controls autoPlay className="max-h-[70vh] w-full object-contain" />
              ) : (
                <div
                  className="w-full h-full min-h-[300px] flex items-center justify-center overflow-auto touch-pan-x touch-pan-y"
                  onDoubleClick={() => setZoom(current => current > 1 ? 1 : 2)}
                >
                  <img
                    src={activeMemory.media_url}
                    alt={activeMemory.title}
                    draggable="false"
                    className="max-h-[70vh] max-w-full object-contain select-none transition-transform duration-200 ease-out"
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                  />
                </div>
              )}

              {activeMemory.media_type !== 'video' && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1.5 rounded-2xl bg-velvet-950/90 backdrop-blur-md border border-rose-500/30 shadow-xl z-20">
                  <button
                    onClick={zoomOut}
                    disabled={zoom <= 1}
                    aria-label="Zoom out"
                    className="p-2.5 rounded-xl text-rose-200 hover:text-white hover:bg-rose-900/70 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={resetZoom}
                    aria-label="Reset zoom"
                    className="min-w-[58px] px-2 py-2.5 rounded-xl text-xs font-semibold text-rose-100 hover:bg-rose-900/70 transition-all"
                  >
                    {Math.round(zoom * 100)}%
                  </button>
                  <button
                    onClick={zoomIn}
                    disabled={zoom >= 4}
                    aria-label="Zoom in"
                    className="p-2.5 rounded-xl text-rose-200 hover:text-white hover:bg-rose-900/70 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={resetZoom}
                    aria-label="Reset zoom"
                    className="p-2.5 rounded-xl text-rose-200 hover:text-white hover:bg-rose-900/70 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="md:w-2/5 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center space-x-2 text-xs font-semibold text-rose-400 uppercase tracking-widest mb-3">
                  <Tag className="w-3.5 h-3.5" />
                  <span>{activeMemory.category}</span>
                </div>

                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-4">
                  {activeMemory.title}
                </h2>

                <div className="flex flex-wrap items-center gap-4 text-xs text-rose-300/80 pb-4 mb-4 border-b border-rose-900/40">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4 text-rose-400" />
                    <span>{activeMemory.memory_date}</span>
                  </span>
                  {activeMemory.location && (
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4 text-champagne-300" />
                      <span>{activeMemory.location}</span>
                    </span>
                  )}
                </div>

                <p className="text-sm text-rose-100/90 leading-relaxed font-sans">
                  {activeMemory.description}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-rose-900/40 flex items-center justify-between text-xs text-rose-300/60 font-cursive text-base">
                <span className="flex items-center space-x-1">
                  <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
                  <span>4EVER URS Memory</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

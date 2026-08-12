import React, { useState } from 'react';
import { Dices, Sparkles, Heart, Clock, CheckCircle2, Bookmark, BookmarkCheck, Laptop, Gamepad2, MessageCircleHeart, Coffee, Palette } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCouple } from '../context/CoupleContext';

export const ActivityGenerator = () => {
  const { activities, toggleFavoriteActivity } = useCouple();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentActivity, setCurrentActivity] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const filteredActivities = selectedCategory === 'all'
    ? activities
    : activities.filter(a => a.category === selectedCategory);

  const generateActivity = () => {
    if (filteredActivities.length === 0) return;
    
    setIsSpinning(true);
    
    // Spinning animation interval effect
    let count = 0;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * filteredActivities.length);
      setCurrentActivity(filteredActivities[randomIdx]);
      count++;
      if (count >= 10) {
        clearInterval(interval);
        setIsSpinning(false);
        
        // Trigger celebratory confetti burst!
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f0a9b8', '#d94c6e', '#f5b142', '#ffffff']
        });
      }
    }, 100);
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'online_date': return Laptop;
      case 'game': return Gamepad2;
      case 'deep_talk': return MessageCircleHeart;
      case 'cozy': return Coffee;
      case 'creative': return Palette;
      default: return Sparkles;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-rose-900/40 border border-rose-500/30 text-rose-300 text-xs font-medium mb-4">
          <Dices className="w-3.5 h-3.5" />
          <span>Long Distance Couple Activity Generator</span>
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-4">
          What Should We Do Today?
        </h1>
        <p className="text-rose-200/70 text-sm sm:text-base font-sans">
          Never let miles limit your date nights! Tap the button below to generate a fun, intimate online activity for long-distance lovers.
        </p>
      </div>

      {/* Main Generator Button Section */}
      <div className="mb-14 text-center">
        <button
          onClick={generateActivity}
          disabled={isSpinning}
          className={`relative group inline-flex items-center justify-center space-x-3 px-8 sm:px-12 py-5 rounded-full bg-gradient-to-r from-rose-600 via-rose-500 to-champagne-500 text-white font-serif text-xl sm:text-2xl font-bold shadow-2xl shadow-rose-600/40 hover:shadow-rose-500/60 hover:scale-105 active:scale-95 transition-all duration-300 ${
            isSpinning ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          <Dices className={`w-8 h-8 ${isSpinning ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
          <span>{isSpinning ? 'Surprising Us...' : 'Spin for an LDR Date Idea!'}</span>
          <Sparkles className="w-6 h-6 text-champagne-200 animate-pulse" />
        </button>
      </div>

      {/* Generated Activity Card Display */}
      {currentActivity && (
        <div className="mb-14 max-w-3xl mx-auto glass-panel p-8 sm:p-10 rounded-3xl border-2 border-rose-500/50 shadow-2xl relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-800/40 text-rose-300 text-xs font-semibold uppercase tracking-wider">
              {React.createElement(getCategoryIcon(currentActivity.category), { className: 'w-3.5 h-3.5 text-rose-400' })}
              <span>{currentActivity.category.replace('_', ' ')}</span>
            </div>

            <button
              onClick={() => toggleFavoriteActivity(currentActivity.id)}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-velvet-950/60 text-xs font-medium text-rose-200 hover:text-white border border-rose-900/40 transition-all"
            >
              {currentActivity.is_favorite ? (
                <>
                  <BookmarkCheck className="w-4 h-4 text-champagne-300 fill-champagne-300" />
                  <span className="text-champagne-300">Saved in Bucket List</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4 text-rose-400" />
                  <span>Save to Bucket List</span>
                </>
              )}
            </button>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-4">
            {currentActivity.title}
          </h2>

          <p className="text-base text-rose-100/90 leading-relaxed font-sans mb-6">
            {currentActivity.description}
          </p>

          <div className="flex items-center space-x-2 text-xs font-semibold text-rose-300/80 bg-rose-950/40 px-4 py-2 rounded-xl w-fit">
            <Clock className="w-4 h-4 text-champagne-300" />
            <span>Estimated Duration: ~{currentActivity.estimated_minutes || 30} Minutes</span>
          </div>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center justify-center space-x-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
        {[
          { id: 'all', label: 'All Ideas' },
          { id: 'online_date', label: 'Virtual Date' },
          { id: 'game', label: 'Online Game' },
          { id: 'deep_talk', label: 'Deep Talk' },
          { id: 'creative', label: 'Creative & Fun' }
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex-shrink-0 ${
              selectedCategory === cat.id
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-velvet-900/60 text-rose-200/70 hover:text-white border border-rose-900/40'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Activity Deck List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredActivities.map((act) => {
          const IconComp = getCategoryIcon(act.category);

          return (
            <div
              key={act.id}
              onClick={() => setCurrentActivity(act)}
              className={`glass-panel p-6 rounded-3xl cursor-pointer border transition-all duration-300 hover:-translate-y-1 ${
                currentActivity?.id === act.id
                  ? 'border-rose-500/60 bg-rose-950/40 shadow-lg shadow-rose-900/30'
                  : 'border-rose-900/30 hover:border-rose-800/50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-300">
                  <IconComp className="w-5 h-5" />
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavoriteActivity(act.id);
                  }}
                  className="p-2 text-rose-400 hover:text-champagne-300"
                >
                  {act.is_favorite ? <BookmarkCheck className="w-5 h-5 text-champagne-300 fill-champagne-300" /> : <Bookmark className="w-5 h-5" />}
                </button>
              </div>

              <h3 className="font-serif text-xl font-semibold text-white mb-2">
                {act.title}
              </h3>
              <p className="text-xs text-rose-200/70 leading-relaxed line-clamp-2">
                {act.description}
              </p>

              <div className="mt-4 flex items-center justify-between text-xs text-rose-400/80 pt-3 border-t border-rose-900/30">
                <span className="capitalize">{act.category.replace('_', ' ')}</span>
                <span>{act.estimated_minutes} mins</span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

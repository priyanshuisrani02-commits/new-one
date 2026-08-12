import React, { useState } from 'react';
import { Lock, ShieldCheck, Plus, Trash2, Image, Video, Mic, Dices, Save, LogOut, Settings, Upload, CheckCircle2, FileAudio, FileImage, FolderPlus, Tag } from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import { BUCKETS } from '../lib/supabaseClient';

export const AdminDashboard = () => {
  const {
    isAdmin,
    loginAdmin,
    logoutAdmin,
    categories,
    addCategory,
    deleteCategory,
    memories,
    addMemory,
    deleteMemory,
    voiceNotes,
    addVoiceNote,
    deleteVoiceNote,
    activities,
    addActivity,
    deleteActivity,
    coupleSettings,
    setCoupleSettings,
    uploadFileFromPC
  } = useCouple();

  // Passcode State
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Admin Tab State
  const [activeAdminTab, setActiveAdminTab] = useState('memories');

  // New Category Input State
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Loading States
  const [isUploadingMem, setIsUploadingMem] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  // Form States
  const [newMem, setNewMem] = useState({
    title: '',
    description: '',
    media_url: '',
    media_type: 'image',
    memory_date: new Date().toISOString().split('T')[0],
    category: categories[0] || 'Vacation',
    location: '',
    is_featured: false
  });

  const [newNote, setNewNote] = useState({
    title: '',
    person: 'him',
    audio_url: '',
    duration: '0:30',
    transcript_or_note: ''
  });

  const [newAct, setNewAct] = useState({
    title: '',
    description: '',
    category: 'online_date',
    estimated_minutes: 30
  });

  const [settingsForm, setSettingsForm] = useState(coupleSettings);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const success = loginAdmin(password);
    if (!success) {
      setErrorMsg('Incorrect admin password. Try: 4everurs');
    } else {
      setErrorMsg('');
    }
  };

  // Category Add
  const handleAddCategorySubmit = (e) => {
    e.preventDefault();
    if (!newCategoryInput.trim()) return;
    addCategory(newCategoryInput.trim());
    setNewCategoryInput('');
    alert(`Category "${newCategoryInput.trim()}" added!`);
  };

  // Local PC File Upload for Memories
  const handleMemoryFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMem(true);
    try {
      const url = await uploadFileFromPC(file, BUCKETS.MEMORIES);
      const isVideo = file.type.startsWith('video');
      setNewMem(prev => ({
        ...prev,
        media_url: url,
        media_type: isVideo ? 'video' : 'image',
        title: prev.title || file.name.split('.')[0]
      }));
    } catch (err) {
      alert('Error loading file from PC: ' + err.message);
    } finally {
      setIsUploadingMem(false);
    }
  };

  // Local PC File Upload for Voice Notes
  const handleAudioFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAudio(true);
    try {
      const url = await uploadFileFromPC(file, BUCKETS.VOICE_NOTES);
      setNewNote(prev => ({
        ...prev,
        audio_url: url,
        title: prev.title || file.name.split('.')[0]
      }));
    } catch (err) {
      alert('Error loading audio file from PC: ' + err.message);
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const handleAddMemorySubmit = (e) => {
    e.preventDefault();
    if (!newMem.title || !newMem.media_url) {
      alert('Please upload a file or provide a URL!');
      return;
    }
    addMemory(newMem);
    setNewMem({
      title: '',
      description: '',
      media_url: '',
      media_type: 'image',
      memory_date: new Date().toISOString().split('T')[0],
      category: categories[0] || 'Vacation',
      location: '',
      is_featured: false
    });
    alert('Memory uploaded successfully!');
  };

  const handleAddVoiceNoteSubmit = (e) => {
    e.preventDefault();
    if (!newNote.title || !newNote.audio_url) {
      alert('Please upload an audio file or provide a URL!');
      return;
    }
    addVoiceNote(newNote);
    setNewNote({
      title: '',
      person: 'him',
      audio_url: '',
      duration: '0:30',
      transcript_or_note: ''
    });
    alert('Voice note uploaded successfully!');
  };

  const handleAddActivitySubmit = (e) => {
    e.preventDefault();
    if (!newAct.title || !newAct.description) return;
    addActivity(newAct);
    setNewAct({
      title: '',
      description: '',
      category: 'online_date',
      estimated_minutes: 30
    });
    alert('Activity idea saved!');
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setCoupleSettings(settingsForm);
    alert('Couple settings updated!');
  };

  // Lock Screen
  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full glass-panel p-6 sm:p-10 rounded-3xl border border-rose-500/30 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 mx-auto mb-6">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="font-serif text-3xl font-bold text-white mb-2">
            Couple Admin Portal
          </h2>
          <p className="text-xs text-rose-200/70 mb-6">
            Enter passcode to manage memories, categories, PC file uploads, and couple settings.
          </p>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="Enter Password (e.g. 4everurs)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-velvet-950/80 border border-rose-800/40 text-white placeholder-rose-400/50 text-sm focus:outline-none focus:border-rose-500 text-center"
            />

            {errorMsg && (
              <p className="text-xs text-rose-400 font-semibold">{errorMsg}</p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 text-white font-semibold text-sm shadow-lg shadow-rose-600/30 transition-all"
            >
              Unlock Admin Panel
            </button>
          </form>

          <p className="text-[11px] text-rose-300/40 mt-6">
            Passcode: <code className="text-rose-300">4everurs</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-6 border-b border-rose-900/40">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">Couple Admin Dashboard</h1>
          </div>
          <p className="text-xs text-rose-300/70 mt-1">Manage Memories, Memory Categories, Voice Notes & Settings</p>
        </div>

        <button
          onClick={logoutAdmin}
          className="mt-4 sm:mt-0 flex items-center space-x-2 px-4 py-2 rounded-xl bg-rose-950/80 text-rose-300 hover:text-white border border-rose-800/40 text-xs font-semibold"
        >
          <LogOut className="w-4 h-4" />
          <span>Lock Admin</span>
        </button>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
        {[
          { id: 'memories', label: 'Upload Memories', icon: Image },
          { id: 'categories', label: 'Manage Categories', icon: Tag },
          { id: 'voicenotes', label: 'Upload Voice Notes', icon: Mic },
          { id: 'activities', label: 'Manage Date Ideas', icon: Dices },
          { id: 'settings', label: 'Couple Settings', icon: Settings }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveAdminTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex-shrink-0 ${
                activeAdminTab === tab.id
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-velvet-900/60 text-rose-300/70 hover:text-white border border-rose-900/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Upload Memories from PC */}
      {activeAdminTab === 'memories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 glass-panel p-6 rounded-3xl border border-rose-500/30">
            <h3 className="font-serif text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Upload className="w-5 h-5 text-rose-400" />
              <span>Add Memory from PC</span>
            </h3>

            <form onSubmit={handleAddMemorySubmit} className="space-y-4 text-xs">
              
              <div className="p-4 rounded-2xl bg-velvet-950/80 border-2 border-dashed border-rose-800/60 text-center hover:border-rose-500 transition-colors">
                <input
                  type="file"
                  id="memoryFileInput"
                  accept="image/*,video/*"
                  onChange={handleMemoryFileUpload}
                  className="hidden"
                />
                <label htmlFor="memoryFileInput" className="cursor-pointer flex flex-col items-center justify-center">
                  <FileImage className="w-8 h-8 text-rose-400 mb-2" />
                  <span className="text-rose-200 font-semibold text-xs">
                    {isUploadingMem ? 'Loading File...' : 'Choose Photo or Video from PC'}
                  </span>
                  <span className="text-[10px] text-rose-400/60 mt-1">Supports JPG, PNG, MP4, MOV</span>
                </label>

                {newMem.media_url && (
                  <div className="mt-3 p-2 bg-rose-900/40 rounded-xl text-[11px] text-emerald-300 font-medium flex items-center justify-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Media File Attached!</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-rose-300 mb-1 font-medium">Memory Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunset Walk at Beach"
                  value={newMem.title}
                  onChange={(e) => setNewMem({ ...newMem, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-velvet-950 border border-rose-900/40 text-white placeholder-rose-400/40 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-rose-300 mb-1 font-medium">Category</label>
                  <select
                    value={newMem.category}
                    onChange={(e) => setNewMem({ ...newMem, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-velvet-950 border border-rose-900/40 text-white focus:outline-none focus:border-rose-500"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-rose-300 mb-1 font-medium">Date</label>
                  <input
                    type="date"
                    value={newMem.memory_date}
                    onChange={(e) => setNewMem({ ...newMem, memory_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-velvet-950 border border-rose-900/40 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-rose-300 mb-1 font-medium">Location (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Airport Gate 4"
                  value={newMem.location}
                  onChange={(e) => setNewMem({ ...newMem, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-velvet-950 border border-rose-900/40 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-rose-300 mb-1 font-medium">Story / Description</label>
                <textarea
                  rows="3"
                  placeholder="Tell the story behind this photo..."
                  value={newMem.description}
                  onChange={(e) => setNewMem({ ...newMem, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-velvet-950 border border-rose-900/40 text-white focus:outline-none focus:border-rose-500"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-md shadow-rose-600/30"
              >
                Save Memory
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-rose-900/40">
            <h3 className="font-serif text-xl font-bold text-white mb-4">
              Current Hall of Memories ({memories.length})
            </h3>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {memories.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-4 rounded-2xl bg-velvet-950/60 border border-rose-900/30">
                  <div className="flex items-center space-x-4">
                    {m.media_type === 'video' ? (
                      <video src={m.media_url} className="w-16 h-12 object-cover rounded-xl bg-black" />
                    ) : (
                      <img src={m.media_url} alt={m.title} className="w-16 h-12 object-cover rounded-xl" />
                    )}
                    <div>
                      <h4 className="font-serif text-base font-semibold text-white">{m.title}</h4>
                      <p className="text-xs text-rose-300/60">{m.memory_date} • {m.category}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteMemory(m.id)}
                    className="p-2 rounded-xl text-rose-400 hover:text-rose-200 hover:bg-rose-950"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Manage Categories (CRUD Categories for Memories) */}
      {activeAdminTab === 'categories' && (
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Add Category Form */}
          <div className="glass-panel p-6 rounded-3xl border border-rose-500/30">
            <h3 className="font-serif text-xl font-bold text-white mb-2 flex items-center space-x-2">
              <FolderPlus className="w-5 h-5 text-rose-400" />
              <span>Create New Memory Category</span>
            </h3>
            <p className="text-xs text-rose-300/70 mb-4">
              Categories help organize your photos and videos into custom themes in the Hall of Memories.
            </p>

            <form onSubmit={handleAddCategorySubmit} className="flex items-center space-x-3">
              <input
                type="text"
                required
                placeholder="e.g. Concerts, Late Night Calls, Anniversaries..."
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                className="flex-grow px-4 py-3 rounded-2xl bg-velvet-950 border border-rose-900/40 text-white placeholder-rose-400/40 text-xs focus:outline-none focus:border-rose-500"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/30 flex-shrink-0"
              >
                Add Category
              </button>
            </form>
          </div>

          {/* List & Delete Categories */}
          <div className="glass-panel p-6 rounded-3xl border border-rose-900/40">
            <h3 className="font-serif text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Tag className="w-5 h-5 text-champagne-300" />
              <span>Active Memory Categories ({categories.length})</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categories.map((cat) => {
                const count = memories.filter(m => m.category === cat).length;
                return (
                  <div
                    key={cat}
                    className="flex items-center justify-between p-4 rounded-2xl bg-velvet-950/70 border border-rose-900/30"
                  >
                    <div>
                      <span className="font-serif text-lg font-semibold text-white">{cat}</span>
                      <span className="block text-xs text-rose-300/60 mt-0.5">{count} {count === 1 ? 'memory' : 'memories'}</span>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete category "${cat}"? Memories in this category will be set to "Uncategorized".`)) {
                          deleteCategory(cat);
                        }
                      }}
                      className="p-2 rounded-xl text-rose-400 hover:text-rose-200 hover:bg-rose-950 transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* Tab 3: Upload Voice Notes from PC */}
      {activeAdminTab === 'voicenotes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 glass-panel p-6 rounded-3xl border border-rose-500/30">
            <h3 className="font-serif text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Upload className="w-5 h-5 text-rose-400" />
              <span>Add Voice Note from PC</span>
            </h3>

            <form onSubmit={handleAddVoiceNoteSubmit} className="space-y-4 text-xs">
              
              <div className="p-4 rounded-2xl bg-velvet-950/80 border-2 border-dashed border-rose-800/60 text-center hover:border-rose-500 transition-colors">
                <input
                  type="file"
                  id="audioFileInput"
                  accept="audio/*"
                  onChange={handleAudioFileUpload}
                  className="hidden"
                />
                <label htmlFor="audioFileInput" className="cursor-pointer flex flex-col items-center justify-center">
                  <FileAudio className="w-8 h-8 text-rose-400 mb-2" />
                  <span className="text-rose-200 font-semibold text-xs">
                    {isUploadingAudio ? 'Loading Audio...' : 'Choose Audio Clip from PC'}
                  </span>
                  <span className="text-[10px] text-rose-400/60 mt-1">Supports MP3, WAV, M4A, AAC</span>
                </label>

                {newNote.audio_url && (
                  <div className="mt-3 p-2 bg-rose-900/40 rounded-xl text-[11px] text-emerald-300 font-medium flex items-center justify-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Audio Clip Attached!</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-rose-300 mb-1 font-medium">Voice Note Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Goodnight my warmth"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-velvet-950 border border-rose-900/40 text-white placeholder-rose-400/40 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-rose-300 mb-1 font-medium">Assign To Button</label>
                <select
                  value={newNote.person}
                  onChange={(e) => setNewNote({ ...newNote, person: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-velvet-950 border border-rose-900/40 text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="him">Plays when clicking "I Miss Him"</option>
                  <option value="her">Plays when clicking "I Miss Her"</option>
                </select>
              </div>

              <div>
                <label className="block text-rose-300 mb-1 font-medium">Transcript or Note</label>
                <textarea
                  rows="3"
                  placeholder="Write a comforting message or transcript..."
                  value={newNote.transcript_or_note}
                  onChange={(e) => setNewNote({ ...newNote, transcript_or_note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-velvet-950 border border-rose-900/40 text-white focus:outline-none focus:border-rose-500"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-md shadow-rose-600/30"
              >
                Save Voice Note
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-rose-900/40">
            <h3 className="font-serif text-xl font-bold text-white mb-4">
              Current Voice Messages ({voiceNotes.length})
            </h3>

            <div className="space-y-3">
              {voiceNotes.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-4 rounded-2xl bg-velvet-950/60 border border-rose-900/30">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-serif text-base font-semibold text-white">{v.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${v.person === 'him' ? 'bg-blue-900/60 text-blue-300' : 'bg-rose-900/60 text-rose-300'}`}>
                        {v.person}
                      </span>
                    </div>
                    <p className="text-xs text-rose-300/60 mt-1">{v.transcript_or_note}</p>
                  </div>

                  <button
                    onClick={() => deleteVoiceNote(v.id)}
                    className="p-2 rounded-xl text-rose-400 hover:text-rose-200 hover:bg-rose-950"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Tab 4: Manage Date Ideas */}
      {activeAdminTab === 'activities' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 glass-panel p-6 rounded-3xl border border-rose-500/30">
            <h3 className="font-serif text-xl font-bold text-white mb-4">Add LDR Date Idea</h3>
            <form onSubmit={handleAddActivitySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-rose-300 mb-1 font-medium">Activity Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Online Karaoke Duet Night"
                  value={newAct.title}
                  onChange={(e) => setNewAct({ ...newAct, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-velvet-950 border border-rose-900/40 text-white"
                />
              </div>

              <div>
                <label className="block text-rose-300 mb-1 font-medium">Category</label>
                <select
                  value={newAct.category}
                  onChange={(e) => setNewAct({ ...newAct, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-velvet-950 border border-rose-900/40 text-white"
                >
                  <option value="online_date">Virtual Date</option>
                  <option value="game">Online Game</option>
                  <option value="deep_talk">Deep Talk</option>
                  <option value="creative">Creative & Fun</option>
                </select>
              </div>

              <div>
                <label className="block text-rose-300 mb-1 font-medium">Description</label>
                <textarea
                  rows="3"
                  value={newAct.description}
                  onChange={(e) => setNewAct({ ...newAct, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-velvet-950 border border-rose-900/40 text-white"
                ></textarea>
              </div>

              <button type="submit" className="w-full py-3 rounded-xl bg-rose-600 text-white font-semibold">
                Add Idea
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-rose-900/40">
            <h3 className="font-serif text-xl font-bold text-white mb-4">Current Ideas ({activities.length})</h3>
            <div className="space-y-3">
              {activities.map(a => (
                <div key={a.id} className="flex items-center justify-between p-4 rounded-2xl bg-velvet-950/60 border border-rose-900/30">
                  <div>
                    <h4 className="font-serif text-base font-semibold text-white">{a.title}</h4>
                    <p className="text-xs text-rose-300/60">{a.category}</p>
                  </div>
                  <button onClick={() => deleteActivity(a.id)} className="p-2 text-rose-400 hover:bg-rose-950 rounded-xl">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Couple Settings */}
      {activeAdminTab === 'settings' && (
        <div className="max-w-2xl mx-auto glass-panel p-6 sm:p-8 rounded-3xl border border-rose-500/30">
          <h3 className="font-serif text-2xl font-bold text-white mb-6">Relationship Settings</h3>
          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-rose-300 mb-1 font-medium">His Name</label>
                <input
                  type="text"
                  value={settingsForm.his_name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, his_name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-velvet-950 border border-rose-900/40 text-white"
                />
              </div>

              <div>
                <label className="block text-rose-300 mb-1 font-medium">Her Name</label>
                <input
                  type="text"
                  value={settingsForm.her_name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, her_name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-velvet-950 border border-rose-900/40 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-rose-300 mb-1 font-medium">His Timezone</label>
                <input
                  type="text"
                  value={settingsForm.his_timezone}
                  onChange={(e) => setSettingsForm({ ...settingsForm, his_timezone: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-velvet-950 border border-rose-900/40 text-white"
                />
              </div>

              <div>
                <label className="block text-rose-300 mb-1 font-medium">Her Timezone</label>
                <input
                  type="text"
                  value={settingsForm.her_timezone}
                  onChange={(e) => setSettingsForm({ ...settingsForm, her_timezone: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-velvet-950 border border-rose-900/40 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-rose-300 mb-1 font-medium">Anniversary Date</label>
              <input
                type="date"
                value={settingsForm.anniversary_date}
                onChange={(e) => setSettingsForm({ ...settingsForm, anniversary_date: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-velvet-950 border border-rose-900/40 text-white"
              />
            </div>

            <div>
              <label className="block text-rose-300 mb-1 font-medium">Daily Love Note</label>
              <textarea
                rows="3"
                value={settingsForm.daily_love_note}
                onChange={(e) => setSettingsForm({ ...settingsForm, daily_love_note: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-velvet-950 border border-rose-900/40 text-white"
              ></textarea>
            </div>

            <button type="submit" className="w-full py-3 rounded-xl bg-rose-600 text-white font-semibold">
              Save Relationship Settings
            </button>
          </form>
        </div>
      )}

    </div>
  );
};

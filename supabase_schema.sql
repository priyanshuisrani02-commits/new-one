-- ==========================================
-- 4EVER URS — SUPABASE DATABASE & STORAGE SCHEMA
-- ==========================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Memories Table (Hall of Memories)
CREATE TABLE IF NOT EXISTS public.memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    memory_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT DEFAULT 'Uncategorized',
    location TEXT,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Voice Notes Table ("I Miss Him" & "I Miss Her")
CREATE TABLE IF NOT EXISTS public.voice_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    person TEXT NOT NULL CHECK (person IN ('him', 'her')),
    audio_url TEXT NOT NULL,
    duration TEXT DEFAULT '0:30',
    transcript_or_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Activities Table (Long Distance Activity Generator)
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('online_date', 'game', 'deep_talk', 'cozy', 'creative')),
    estimated_minutes INTEGER DEFAULT 30,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Couple Settings Table
CREATE TABLE IF NOT EXISTS public.couple_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    his_name TEXT DEFAULT 'Him',
    her_name TEXT DEFAULT 'Her',
    his_timezone TEXT DEFAULT 'America/New_York',
    her_timezone TEXT DEFAULT 'Asia/Tokyo',
    anniversary_date DATE DEFAULT '2023-01-01',
    daily_love_note TEXT DEFAULT 'Distance means so little when someone means so much. You are 4ever urs.',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT single_row CHECK (id = 1)
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_settings ENABLE ROW LEVEL SECURITY;

-- Memories Policies
CREATE POLICY "Public Memories Read Access" 
ON public.memories FOR SELECT 
USING (true);

CREATE POLICY "Authenticated Admin Memories Write Access" 
ON public.memories FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Voice Notes Policies
CREATE POLICY "Public Voice Notes Read Access" 
ON public.voice_notes FOR SELECT 
USING (true);

CREATE POLICY "Authenticated Admin Voice Notes Write Access" 
ON public.voice_notes FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Activities Policies
CREATE POLICY "Public Activities Read Access" 
ON public.activities FOR SELECT 
USING (true);

CREATE POLICY "Authenticated Admin Activities Write Access" 
ON public.activities FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Couple Settings Policies
CREATE POLICY "Public Couple Settings Read Access" 
ON public.couple_settings FOR SELECT 
USING (true);

CREATE POLICY "Authenticated Admin Couple Settings Write Access" 
ON public.couple_settings FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- ==========================================
-- STORAGE BUCKET SETUP & POLICIES
-- ==========================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('memories-media', 'memories-media', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('voice-notes-audio', 'voice-notes-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Read Policy (Public)
CREATE POLICY "Public Read Access Memories Media"
ON storage.objects FOR SELECT
USING (bucket_id = 'memories-media');

CREATE POLICY "Public Read Access Voice Notes Audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'voice-notes-audio');

-- Storage Write Policy (Admin Only)
CREATE POLICY "Admin Upload Access Memories Media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'memories-media');

CREATE POLICY "Admin Upload Access Voice Notes Audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'voice-notes-audio');

-- ==========================================
-- INITIAL SEED DATA
-- ==========================================
INSERT INTO public.couple_settings (id, his_name, her_name, anniversary_date, daily_love_note)
VALUES (1, 'Alex', 'Maya', '2023-02-14', 'Every second spent apart is just counting down to when I wrap my arms around you again.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.activities (title, description, category, estimated_minutes) VALUES
('Virtual Star Gazing & Chill', 'Open up Stellarium online together, share screen, pick a constellation and talk about our future dreams while listening to low-fi beats.', 'online_date', 45),
('Simultaneous Movie Watch Party', 'Use Teleparty or Discord to sync up our favorite romantic movie. Grab your favorite snacks and react in real-time!', 'online_date', 120),
('21 Deep Questions for Couples', 'Take turns asking 3 deep questions from a relationship deck. No holding back—just honesty and warmth.', 'deep_talk', 30),
('Geoguessr / Google Earth Exploration', 'Pick a city we want to visit together in 5 years. Explore the street views and map out our future dream vacation route.', 'game', 40),
('Online Co-op Drawing Battle', 'Use Skribbl.io or Aggie.io to draw funny caricatures of each other or sketch our dream house together.', 'creative', 25);

INSERT INTO public.voice_notes (title, person, audio_url, duration, transcript_or_note) VALUES
('Thinking of you before sleep...', 'him', 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3', '0:45', 'Hey handsome, just wanted to leave you a gentle goodnight message. Close your eyes, I am right there with you.'),
('Good morning my love!', 'her', 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3', '0:35', 'Good morning gorgeous! Hope your day is bright and sweet. Can not wait for our call tonight!');

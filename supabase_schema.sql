-- ==========================================
-- 4EVER URS — SUPABASE DATABASE & STORAGE SCHEMA
-- Idempotent schema + secure RLS + realtime
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- TABLES
-- ==========================================

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS categories_name_lower_unique
ON public.categories (lower(name));

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

CREATE TABLE IF NOT EXISTS public.voice_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    person TEXT NOT NULL CHECK (person IN ('him', 'her')),
    audio_url TEXT NOT NULL,
    duration TEXT DEFAULT '0:30',
    transcript_or_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('online_date', 'game', 'deep_talk', 'cozy', 'creative')),
    estimated_minutes INTEGER DEFAULT 30 CHECK (estimated_minutes > 0),
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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

-- Keep updated_at current when settings are changed.
CREATE OR REPLACE FUNCTION public.set_couple_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS couple_settings_updated_at ON public.couple_settings;
CREATE TRIGGER couple_settings_updated_at
BEFORE UPDATE ON public.couple_settings
FOR EACH ROW EXECUTE FUNCTION public.set_couple_settings_updated_at();

CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL DEFAULT 'A little memory',
    content TEXT NOT NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    mood TEXT DEFAULT 'In love',
    mood_emoji TEXT DEFAULT '🥰',
    author TEXT NOT NULL DEFAULT 'both' CHECK (author IN ('his', 'her', 'both')),
    favorite BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS
-- ==========================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Remove the old overly-permissive policies before recreating them.
DROP POLICY IF EXISTS "Public Categories Read Access" ON public.categories;
DROP POLICY IF EXISTS "Authenticated Admin Categories Write Access" ON public.categories;
DROP POLICY IF EXISTS "Public Memories Read Access" ON public.memories;
DROP POLICY IF EXISTS "Authenticated Admin Memories Write Access" ON public.memories;
DROP POLICY IF EXISTS "Public Voice Notes Read Access" ON public.voice_notes;
DROP POLICY IF EXISTS "Authenticated Admin Voice Notes Write Access" ON public.voice_notes;
DROP POLICY IF EXISTS "Public Activities Read Access" ON public.activities;
DROP POLICY IF EXISTS "Authenticated Admin Activities Write Access" ON public.activities;
DROP POLICY IF EXISTS "Public Couple Settings Read Access" ON public.couple_settings;
DROP POLICY IF EXISTS "Authenticated Admin Couple Settings Write Access" ON public.couple_settings;

-- Public content is readable by everyone.
CREATE POLICY "Public Categories Read Access"
ON public.categories FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Public Memories Read Access"
ON public.memories FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Public Voice Notes Read Access"
ON public.voice_notes FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Public Activities Read Access"
ON public.activities FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Public Couple Settings Read Access"
ON public.couple_settings FOR SELECT
TO anon, authenticated
USING (true);

-- Admin authorization is checked against the server-side raw_app_meta_data in auth.users.
-- This avoids relying on a stale JWT app_metadata claim after an admin role is granted.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = auth.uid()
      AND COALESCE(raw_app_meta_data->>'role', '') = 'admin'
  );
$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;


CREATE POLICY "Admin Categories Insert"
ON public.categories FOR INSERT
TO authenticated
WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin Categories Update"
ON public.categories FOR UPDATE
TO authenticated
USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin Categories Delete"
ON public.categories FOR DELETE
TO authenticated
USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin Memories Insert"
ON public.memories FOR INSERT
TO authenticated
WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin Memories Update"
ON public.memories FOR UPDATE
TO authenticated
USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin Memories Delete"
ON public.memories FOR DELETE
TO authenticated
USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin Voice Notes Insert"
ON public.voice_notes FOR INSERT
TO authenticated
WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin Voice Notes Update"
ON public.voice_notes FOR UPDATE
TO authenticated
USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin Voice Notes Delete"
ON public.voice_notes FOR DELETE
TO authenticated
USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin Activities Insert"
ON public.activities FOR INSERT
TO authenticated
WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin Activities Update"
ON public.activities FOR UPDATE
TO authenticated
USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin Activities Delete"
ON public.activities FOR DELETE
TO authenticated
USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin Couple Settings Insert"
ON public.couple_settings FOR INSERT
TO authenticated
WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin Couple Settings Update"
ON public.couple_settings FOR UPDATE
TO authenticated
USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin Couple Settings Delete"
ON public.couple_settings FOR DELETE
TO authenticated
USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Public Journal Read Access" ON public.journal_entries;
DROP POLICY IF EXISTS "Admin Journal Insert" ON public.journal_entries;
DROP POLICY IF EXISTS "Admin Journal Update" ON public.journal_entries;
DROP POLICY IF EXISTS "Admin Journal Delete" ON public.journal_entries;

CREATE POLICY "Public Journal Read Access"
ON public.journal_entries FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admin Journal Insert"
ON public.journal_entries FOR INSERT
TO authenticated
WITH CHECK ((select public.is_admin()));

CREATE POLICY "Admin Journal Update"
ON public.journal_entries FOR UPDATE
TO authenticated
USING ((select public.is_admin()))
WITH CHECK ((select public.is_admin()));

CREATE POLICY "Admin Journal Delete"
ON public.journal_entries FOR DELETE
TO authenticated
USING ((select public.is_admin()));


-- ==========================================
-- LIVE JOURNAL
-- ==========================================

CREATE TABLE IF NOT EXISTS public.live_journal_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(trim(content)) > 0 AND char_length(content) <= 5000),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.live_journal_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Live Journal Read" ON public.live_journal_messages;
DROP POLICY IF EXISTS "Live Journal Insert" ON public.live_journal_messages;

CREATE POLICY "Live Journal Read"
ON public.live_journal_messages FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Live Journal Insert"
ON public.live_journal_messages FOR INSERT
TO authenticated
WITH CHECK (author_id = auth.uid());

DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'live_journal_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.live_journal_messages;
  END IF;
END $;

-- ==========================================
-- STORAGE
-- ==========================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('memories-media', 'memories-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-notes-audio', 'voice-notes-audio', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Read Access Memories Media" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access Voice Notes Audio" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Access Memories Media" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Access Voice Notes Audio" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Access Memories Media" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Access Voice Notes Audio" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Access Memories Media" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Access Voice Notes Audio" ON storage.objects;

CREATE POLICY "Public Read Access Memories Media"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'memories-media');

CREATE POLICY "Public Read Access Voice Notes Audio"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'voice-notes-audio');

CREATE POLICY "Admin Upload Access Memories Media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'memories-media'
  AND (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admin Upload Access Voice Notes Audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'voice-notes-audio'
  AND (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admin Update Access Memories Media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'memories-media'
  AND (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
  bucket_id = 'memories-media'
  AND (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admin Update Access Voice Notes Audio"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'voice-notes-audio'
  AND (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
  bucket_id = 'voice-notes-audio'
  AND (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admin Delete Access Memories Media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'memories-media'
  AND (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admin Delete Access Voice Notes Audio"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'voice-notes-audio'
  AND (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- ==========================================
-- REALTIME
-- ==========================================

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['categories','memories','voice_notes','activities','couple_settings'] LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = table_name
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', table_name);
    END IF;
  END LOOP;
END $$;

-- ==========================================
-- INITIAL DATA
-- ==========================================

INSERT INTO public.categories (name) VALUES
('Reunions'), ('Vacation'), ('Cozy Days'), ('Surprises'), ('Milestones')
ON CONFLICT DO NOTHING;

INSERT INTO public.couple_settings (id, his_name, her_name, anniversary_date, daily_love_note)
VALUES (1, 'Alex', 'Maya', '2023-02-14', 'Every second spent apart is just counting down to when I wrap my arms around you again.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.activities (title, description, category, estimated_minutes)
SELECT * FROM (VALUES
  ('Virtual Star Gazing & Chill', 'Open up Stellarium online together, share screen, pick a constellation and talk about future dreams while listening to low-fi beats.', 'online_date', 45),
  ('Simultaneous Movie Watch Party', 'Use a synchronized watch party and react in real-time.', 'online_date', 120),
  ('21 Deep Questions for Couples', 'Take turns asking thoughtful questions with honesty and warmth.', 'deep_talk', 30),
  ('Google Earth Exploration Date', 'Pick a city you want to visit together and explore it.', 'game', 40),
  ('Online Co-op Drawing Battle', 'Draw funny caricatures or sketch a future dream house together.', 'creative', 25)
) AS seed(title, description, category, estimated_minutes)
WHERE NOT EXISTS (SELECT 1 FROM public.activities);

INSERT INTO public.voice_notes (title, person, audio_url, duration, transcript_or_note)
SELECT * FROM (VALUES
  ('Thinking of you before sleep...', 'him', 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3', '0:45', 'Hey love, just wanted to leave you a gentle goodnight message.'),
  ('Good morning my love!', 'her', 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3', '0:35', 'Good morning! Hope your day is bright and sweet.')
) AS seed(title, person, audio_url, duration, transcript_or_note)
WHERE NOT EXISTS (SELECT 1 FROM public.voice_notes);

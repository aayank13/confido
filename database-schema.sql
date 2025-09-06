-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name text,
  avatar_url text,
  email text,
  provider text, -- 'google' or 'github'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create custom_agents table (user_id can be NULL for system/featured agents)
CREATE TABLE public.custom_agents (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL for system agents
  name text NOT NULL,
  description text,
  system_prompt text NOT NULL,
  voice_model text DEFAULT 'aura-asteria-en',
  personality_traits jsonb DEFAULT '{}',
  is_public boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create sessions table
CREATE TABLE public.sessions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  agent_type text NOT NULL, -- 'interview', 'conversation', 'confidence', 'networking', 'custom'
  custom_agent_id uuid REFERENCES public.custom_agents(id) ON DELETE SET NULL,
  title text,
  duration_seconds integer DEFAULT 0,
  status text DEFAULT 'active', -- 'active', 'completed', 'paused'
  session_metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create transcripts table
CREATE TABLE public.transcripts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  speaker text NOT NULL, -- 'user' or 'assistant'
  content text NOT NULL,
  timestamp_ms bigint NOT NULL,
  confidence_score real,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create session_analytics table
CREATE TABLE public.session_analytics (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  user_speaking_time_ms bigint DEFAULT 0,
  agent_speaking_time_ms bigint DEFAULT 0,
  total_words_user integer DEFAULT 0,
  total_words_agent integer DEFAULT 0,
  words_per_minute real DEFAULT 0,
  pause_count integer DEFAULT 0,
  interruption_count integer DEFAULT 0,
  filler_words_count integer DEFAULT 0,
  confidence_score real DEFAULT 0,
  fluency_score real DEFAULT 0,
  pace_score real DEFAULT 0,
  voice_analysis jsonb DEFAULT '{}',
  speaking_rate real DEFAULT 0,
  volume_consistency real DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_progress table
CREATE TABLE public.user_progress (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  skill_area text NOT NULL, -- 'interview', 'conversation', 'confidence', 'networking'
  total_sessions integer DEFAULT 0,
  total_time_minutes integer DEFAULT 0,
  average_confidence real DEFAULT 0,
  average_fluency real DEFAULT 0,
  average_pace real DEFAULT 0,
  improvement_score real DEFAULT 0,
  last_session_date timestamp with time zone,
  milestones_achieved text[] DEFAULT '{}',
  progress_data jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, skill_area)
);

-- Create session_summaries table
CREATE TABLE public.session_summaries (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  summary text NOT NULL,
  key_points text[],
  improvement_suggestions text[],
  strengths text[],
  areas_for_improvement text[],
  overall_rating real,
  ai_feedback text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create goals table
CREATE TABLE public.goals (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  target_metric text NOT NULL, -- 'confidence', 'fluency', 'pace', 'session_count'
  target_value real NOT NULL,
  current_value real DEFAULT 0,
  deadline date,
  status text DEFAULT 'active', -- 'active', 'completed', 'paused'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Custom agents policies
CREATE POLICY "Users can view own agents and public agents" ON public.custom_agents
  FOR SELECT USING (auth.uid() = user_id OR is_public = true OR user_id IS NULL);

CREATE POLICY "Users can create own agents" ON public.custom_agents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agents" ON public.custom_agents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own agents" ON public.custom_agents
  FOR DELETE USING (auth.uid() = user_id);

-- Sessions policies
CREATE POLICY "Users can view own sessions" ON public.sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON public.sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON public.sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Transcripts policies
CREATE POLICY "Users can view transcripts of own sessions" ON public.transcripts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sessions 
      WHERE sessions.id = transcripts.session_id 
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create transcripts for own sessions" ON public.transcripts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions 
      WHERE sessions.id = transcripts.session_id 
      AND sessions.user_id = auth.uid()
    )
  );

-- Session analytics policies
CREATE POLICY "Users can view own session analytics" ON public.session_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sessions 
      WHERE sessions.id = session_analytics.session_id 
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create session analytics" ON public.session_analytics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions 
      WHERE sessions.id = session_analytics.session_id 
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own progress" ON public.user_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own session summaries" ON public.session_summaries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sessions 
      WHERE sessions.id = session_summaries.session_id 
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own goals" ON public.goals
  FOR ALL USING (auth.uid() = user_id);

-- Functions and Triggers

-- Function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email, provider)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    new.raw_app_meta_data->>'provider'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to relevant tables
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.custom_agents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for performance
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_created_at ON public.sessions(created_at);
CREATE INDEX idx_transcripts_session_id ON public.transcripts(session_id);
CREATE INDEX idx_transcripts_timestamp ON public.transcripts(timestamp_ms);
CREATE INDEX idx_session_analytics_session_id ON public.session_analytics(session_id);
CREATE INDEX idx_custom_agents_user_id ON public.custom_agents(user_id);
CREATE INDEX idx_custom_agents_public ON public.custom_agents(is_public) WHERE is_public = true;
CREATE INDEX idx_custom_agents_featured ON public.custom_agents(is_featured) WHERE is_featured = true;
CREATE INDEX idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX idx_goals_user_id ON public.goals(user_id);

-- Insert default featured agents (no user_id needed since user_id can be NULL)
INSERT INTO public.custom_agents (id, user_id, name, description, system_prompt, voice_model, is_public, is_featured) VALUES
(
  '550e8400-e29b-41d4-a716-446655440001',
  NULL, -- No user_id for system agents
  'Senior Software Engineer Interview',
  'Practice technical interviews for senior software engineering positions',
  'You are an experienced engineering manager conducting a technical interview for a senior software engineer position. Ask challenging but fair technical questions about system design, algorithms, coding best practices, and leadership. Provide constructive feedback and follow up on answers. Be professional but approachable.',
  'aura-orion-en',
  true,
  true
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  NULL,
  'English Pronunciation Coach',
  'Specialized coach for improving English pronunciation and accent reduction',
  'You are a professional English pronunciation and accent coach. Help users improve their English pronunciation, reduce their accent if desired, and speak more clearly. Provide specific feedback on pronunciation, suggest exercises, and be encouraging about their progress.',
  'aura-asteria-en',
  true,
  true
),
(
  '550e8400-e29b-41d4-a716-446655440003',
  NULL,
  'TED Talk Presentation Coach',
  'Master the art of compelling presentations and public speaking',
  'You are a presentation coach who helps people deliver compelling TED-style talks. Focus on storytelling, clear message delivery, audience engagement, and confident presentation skills. Help users structure their ideas and practice their delivery.',
  'aura-luna-en',
  true,
  true
) ON CONFLICT (id) DO NOTHING;

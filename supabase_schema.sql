-- =========================================================================
-- PRANSCRIC PRODUCTION DATABASE SCHEMA (POSTGRESQL - SUPABASE OPTIMIZED)
-- Copy and paste this directly into your Supabase SQL Editor (Dashboard > SQL Editor)
-- Optimized for high concurrent read/write scaling (1000+ concurrent users)
-- =========================================================================

-- 1. ENUMS & ROLES
CREATE TYPE user_role AS ENUM ('admin', 'organizer', 'scorer', 'viewer');
CREATE TYPE match_status AS ENUM ('scheduled', 'live', 'completed', 'paused');
CREATE TYPE toss_choice AS ENUM ('bat', 'bowl');
CREATE TYPE extra_choice AS ENUM ('wide', 'noball', 'bye', 'legbye');
CREATE TYPE wicket_choice AS ENUM ('bowled', 'caught', 'lbw', 'stumped', 'runout', 'hitwicket', 'retired_hurt');

-- 2. PROFILES TABLE
-- References auth.users created by Supabase Auth automatically
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role user_role DEFAULT 'viewer'::user_role NOT NULL
);

-- Enable Row Level Security (RLS) on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'Player'), 'viewer'::user_role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 3. TOURNAMENTS TABLE
CREATE TABLE public.tournaments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  logo_url TEXT,
  location TEXT,
  ground TEXT,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  overs INTEGER DEFAULT 20 NOT NULL,
  entry_fee NUMERIC(10,2) DEFAULT 0.00,
  prize_pool NUMERIC(10,2) DEFAULT 0.00,
  rules TEXT,
  code TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tournaments are readable by everyone" ON public.tournaments
  FOR SELECT USING (true);

CREATE POLICY "Organizers and Admins can create tournaments" ON public.tournaments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND (role = 'organizer' OR role = 'admin')
    )
  );

CREATE POLICY "Tournament owner can update" ON public.tournaments
  FOR UPDATE USING (organizer_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));


-- 4. TEAMS TABLE
CREATE TABLE public.teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  captain_name TEXT,
  coach_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teams are viewable by everyone" ON public.teams
  FOR SELECT USING (true);

CREATE POLICY "Tournament owners/Admins can write teams" ON public.teams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = tournament_id AND (t.organizer_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
      ))
    )
  );


-- 5. PLAYERS TABLE
CREATE TABLE public.players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  photo_url TEXT,
  role TEXT, -- 'Batsman', 'Bowler', 'All-Rounder', 'Wicketkeeper'
  batting_style TEXT,
  bowling_style TEXT
);

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players are viewable by everyone" ON public.players
  FOR SELECT USING (true);

CREATE POLICY "Authorized managers can write players" ON public.players
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.teams tm
      JOIN public.tournaments t ON tm.tournament_id = t.id
      WHERE tm.id = team_id AND (t.organizer_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
      ))
    )
  );


-- 6. MATCHES TABLE
CREATE TABLE public.matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team1_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  team2_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  ground TEXT,
  match_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  overs INTEGER DEFAULT 20,
  status match_status DEFAULT 'scheduled'::match_status NOT NULL,
  toss_winner_id UUID REFERENCES public.teams(id),
  toss_decision toss_choice,
  winner_id UUID REFERENCES public.teams(id),
  match_code TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Matches are viewable by everyone" ON public.matches
  FOR SELECT USING (true);

CREATE POLICY "Authorized tournament owner can modify matches" ON public.matches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = tournament_id AND (t.organizer_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
      ))
    )
  );


-- 7. INNINGS TABLE
CREATE TABLE public.innings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  innings_number INTEGER NOT NULL, -- 1 or 2
  runs INTEGER DEFAULT 0 NOT NULL,
  wickets INTEGER DEFAULT 0 NOT NULL,
  overs_bowled NUMERIC(3,1) DEFAULT 0.0 NOT NULL,
  status TEXT DEFAULT 'yet_to_bat'::text NOT NULL
);

ALTER TABLE public.innings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Innings are viewable by everyone" ON public.innings
  FOR SELECT USING (true);

CREATE POLICY "Scorers, Organizers, and Admins can update scores" ON public.innings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      JOIN public.tournaments t ON m.tournament_id = t.id
      WHERE m.id = match_id AND (
        t.organizer_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'scorer' OR role = 'admin'))
      )
    )
  );


-- 8. BALLS TABLE
CREATE TABLE public.balls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  innings_id UUID REFERENCES public.innings(id) ON DELETE CASCADE,
  over_number INTEGER NOT NULL,
  ball_number INTEGER NOT NULL,
  batter_id UUID REFERENCES public.players(id),
  bowler_id UUID REFERENCES public.players(id),
  runs_batter INTEGER DEFAULT 0,
  runs_extras INTEGER DEFAULT 0,
  extra_type extra_choice,
  wicket_type wicket_choice,
  dismissed_id UUID REFERENCES public.players(id),
  commentary TEXT,
  wagon_angle NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.balls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Balls details are viewable by everyone" ON public.balls
  FOR SELECT USING (true);

CREATE POLICY "Scorers can register ball details" ON public.balls
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.innings inn
      JOIN public.matches m ON inn.match_id = m.id
      JOIN public.tournaments t ON m.tournament_id = t.id
      WHERE inn.id = innings_id AND (
        t.organizer_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'scorer' OR role = 'admin'))
      )
    )
  );


-- =========================================================================
-- 9. PERFORMANCE INDEXES (CRITICAL FOR 1000+ CONCURRENT SPECTATOR SCALING)
-- PostgreSQL uses indexes to bypass full-table scans, reducing CPU & read latency
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_tournaments_organizer ON public.tournaments(organizer_id);
CREATE INDEX IF NOT EXISTS idx_teams_tournament ON public.teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_players_team ON public.players(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON public.matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_innings_match ON public.innings(match_id);
CREATE INDEX IF NOT EXISTS idx_balls_innings ON public.balls(innings_id);
CREATE INDEX IF NOT EXISTS idx_balls_created_at ON public.balls(created_at DESC);


-- =========================================================================
-- 10. SUPABASE REALTIME REPLICATION (CRITICAL FOR BALL-BY-BALL SPECTOR FEED)
-- Enables WebSockets instead of polling, bypassing high database read overhead
-- =========================================================================
BEGIN;
  -- Enable realtime on tables that broadcast scoring adjustments
  ALTER TABLE public.matches REPLICA IDENTITY FULL;
  ALTER TABLE public.innings REPLICA IDENTITY FULL;
  ALTER TABLE public.balls REPLICA IDENTITY FULL;

  -- Add tables to the supabase_realtime publication
  ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.innings;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.balls;
COMMIT;

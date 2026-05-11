-- FlowJack Database Schema
-- Cinematic production hierarchy: User → Project → Script → Scene → Shot → Storyboard → Render

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  tier text not null default 'free' check (tier in ('free', 'creator', 'pro')),
  projects_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- PROJECTS
-- ============================================================
create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  logline text,
  genre text,
  tone text,
  duration_target text, -- 'short' | 'medium' | 'feature'
  aspect_ratio text default '16:9',
  status text not null default 'draft' check (status in ('draft', 'in_progress', 'complete', 'archived')),
  idea_input text, -- original user input
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- SCRIPTS (screenplay per project, versioned)
-- ============================================================
create table public.scripts (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  version int not null default 1,
  title text,
  content text not null,
  format text default 'fountain', -- fountain | plain | json
  word_count int,
  estimated_runtime_seconds int,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- SCENES
-- ============================================================
create table public.scenes (
  id uuid primary key default uuid_generate_v4(),
  script_id uuid not null references public.scripts(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  scene_number int not null,
  heading text not null, -- INT. COFFEE SHOP - DAY
  description text,
  location text,
  time_of_day text,
  interior_exterior text check (interior_exterior in ('INT', 'EXT', 'INT/EXT')),
  characters text[], -- array of character names
  mood text,
  estimated_duration_seconds int,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- SHOTS
-- ============================================================
create table public.shots (
  id uuid primary key default uuid_generate_v4(),
  scene_id uuid not null references public.scenes(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  shot_number int not null,
  shot_type text not null, -- wide, medium, close-up, extreme close-up, etc.
  camera_movement text, -- static, dolly, pan, tilt, crane, handheld, steadicam
  lens text, -- 24mm, 35mm, 50mm, 85mm, etc.
  framing text, -- rule of thirds, centered, dutch angle, etc.
  lighting text, -- natural, high-key, low-key, motivated, etc.
  description text not null,
  action text,
  dialogue text,
  duration_seconds int,
  transition text default 'cut', -- cut, dissolve, fade, wipe
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- STORYBOARDS (visual prompts per shot)
-- ============================================================
create table public.storyboards (
  id uuid primary key default uuid_generate_v4(),
  shot_id uuid not null references public.shots(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  image_prompt text not null, -- prompt for image generation
  video_prompt text, -- prompt for video generation
  style_reference text, -- style/aesthetic notes
  camera_notes text,
  image_url text, -- generated storyboard image
  thumbnail_url text,
  status text not null default 'pending' check (status in ('pending', 'generating', 'complete', 'failed')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- PRODUCTION PLANS
-- ============================================================
create table public.production_plans (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  voiceover_direction jsonb default '[]', -- per-scene VO notes
  music_direction jsonb default '{}', -- genre, tempo, mood, instruments
  sfx_direction jsonb default '[]', -- sound effects per scene
  color_palette jsonb default '[]', -- hex codes and mood
  visual_style text,
  reference_films text[],
  total_estimated_duration_seconds int,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- RENDERS (future: actual video generations)
-- ============================================================
create table public.renders (
  id uuid primary key default uuid_generate_v4(),
  shot_id uuid references public.shots(id) on delete set null,
  project_id uuid not null references public.projects(id) on delete cascade,
  provider text not null, -- 'kling' | 'runway' | 'luma' | 'pika' | 'fal'
  provider_job_id text,
  prompt text not null,
  status text not null default 'queued' check (status in ('queued', 'processing', 'complete', 'failed', 'cancelled')),
  video_url text,
  thumbnail_url text,
  duration_seconds int,
  resolution text,
  aspect_ratio text,
  cost_cents int,
  error_message text,
  metadata jsonb default '{}',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- EXPORTS (final assembled outputs)
-- ============================================================
create table public.exports (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  format text not null, -- 'mp4' | 'mov' | 'pdf' | 'json'
  type text not null, -- 'final_video' | 'screenplay_pdf' | 'shot_list' | 'storyboard_deck'
  file_url text,
  file_size_bytes bigint,
  status text not null default 'pending' check (status in ('pending', 'processing', 'complete', 'failed')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- AI GENERATION HISTORY
-- ============================================================
create table public.ai_generations (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  generation_type text not null, -- 'logline' | 'screenplay' | 'scenes' | 'shots' | 'storyboard' | 'production_plan'
  provider text not null, -- 'anthropic' | 'openai'
  model text not null,
  input_prompt text not null,
  output_content text not null,
  tokens_used int,
  cost_cents int,
  duration_ms int,
  accepted boolean default false, -- did user keep this generation?
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

-- ============================================================
-- VERSIONS (track all entity versions)
-- ============================================================
create table public.versions (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null, -- 'script' | 'scene' | 'shot' | 'storyboard' | 'production_plan'
  entity_id uuid not null,
  version_number int not null,
  snapshot jsonb not null, -- full state at this version
  change_description text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_projects_user on public.projects(user_id);
create index idx_scripts_project on public.scripts(project_id);
create index idx_scenes_script on public.scenes(script_id);
create index idx_scenes_project on public.scenes(project_id);
create index idx_shots_scene on public.shots(scene_id);
create index idx_shots_project on public.shots(project_id);
create index idx_storyboards_shot on public.storyboards(shot_id);
create index idx_renders_project on public.renders(project_id);
create index idx_renders_status on public.renders(status);
create index idx_ai_generations_project on public.ai_generations(project_id);
create index idx_versions_entity on public.versions(entity_type, entity_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.scripts enable row level security;
alter table public.scenes enable row level security;
alter table public.shots enable row level security;
alter table public.storyboards enable row level security;
alter table public.production_plans enable row level security;
alter table public.renders enable row level security;
alter table public.exports enable row level security;
alter table public.ai_generations enable row level security;
alter table public.versions enable row level security;

-- Users can only access their own data
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Users can CRUD own projects" on public.projects for all using (auth.uid() = user_id);
create policy "Users can CRUD own scripts" on public.scripts for all using (project_id in (select id from public.projects where user_id = auth.uid()));
create policy "Users can CRUD own scenes" on public.scenes for all using (project_id in (select id from public.projects where user_id = auth.uid()));
create policy "Users can CRUD own shots" on public.shots for all using (project_id in (select id from public.projects where user_id = auth.uid()));
create policy "Users can CRUD own storyboards" on public.storyboards for all using (project_id in (select id from public.projects where user_id = auth.uid()));
create policy "Users can CRUD own production_plans" on public.production_plans for all using (project_id in (select id from public.projects where user_id = auth.uid()));
create policy "Users can CRUD own renders" on public.renders for all using (project_id in (select id from public.projects where user_id = auth.uid()));
create policy "Users can CRUD own exports" on public.exports for all using (project_id in (select id from public.projects where user_id = auth.uid()));
create policy "Users can view own ai_generations" on public.ai_generations for all using (auth.uid() = user_id);
create policy "Users can view own versions" on public.versions for select using (
  entity_id in (select id from public.projects where user_id = auth.uid())
  or entity_id in (select id from public.scripts where project_id in (select id from public.projects where user_id = auth.uid()))
);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.profiles for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.projects for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.scenes for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.shots for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.production_plans for each row execute function public.handle_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

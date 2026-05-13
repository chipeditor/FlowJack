-- Dedicated characters table, separate from crew_members.
-- Characters are a creative/narrative concern; crew is production.

create table public.characters (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  description text,
  physical_traits jsonb not null default '{}',
  wardrobe text,
  reference_image_url text,
  reference_image_seed integer,
  reference_source text check (reference_source in ('uploaded', 'generated')),
  actor_id uuid references public.crew_members(id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Join tables for structured scene/shot <-> character relationships
create table public.scene_characters (
  scene_id uuid not null references public.scenes(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  primary key (scene_id, character_id)
);

create table public.shot_characters (
  shot_id uuid not null references public.shots(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  primary key (shot_id, character_id)
);

-- Indexes
create index idx_characters_project on public.characters(project_id);
create index idx_scene_characters_scene on public.scene_characters(scene_id);
create index idx_scene_characters_character on public.scene_characters(character_id);
create index idx_shot_characters_shot on public.shot_characters(shot_id);
create index idx_shot_characters_character on public.shot_characters(character_id);

-- RLS for characters
alter table public.characters enable row level security;

create policy "characters_select" on public.characters
  for select using (public.user_has_project_access(project_id));
create policy "characters_insert" on public.characters
  for insert with check (public.user_has_project_access(project_id));
create policy "characters_update" on public.characters
  for update using (public.user_has_project_access(project_id));
create policy "characters_delete" on public.characters
  for delete using (public.user_has_project_access(project_id));

-- RLS for scene_characters (derive project access from scene)
alter table public.scene_characters enable row level security;

create policy "scene_characters_select" on public.scene_characters
  for select using (
    exists (select 1 from public.scenes s where s.id = scene_id and public.user_has_project_access(s.project_id))
  );
create policy "scene_characters_insert" on public.scene_characters
  for insert with check (
    exists (select 1 from public.scenes s where s.id = scene_id and public.user_has_project_access(s.project_id))
  );
create policy "scene_characters_delete" on public.scene_characters
  for delete using (
    exists (select 1 from public.scenes s where s.id = scene_id and public.user_has_project_access(s.project_id))
  );

-- RLS for shot_characters (derive project access from shot)
alter table public.shot_characters enable row level security;

create policy "shot_characters_select" on public.shot_characters
  for select using (
    exists (select 1 from public.shots s where s.id = shot_id and public.user_has_project_access(s.project_id))
  );
create policy "shot_characters_insert" on public.shot_characters
  for insert with check (
    exists (select 1 from public.shots s where s.id = shot_id and public.user_has_project_access(s.project_id))
  );
create policy "shot_characters_delete" on public.shot_characters
  for delete using (
    exists (select 1 from public.shots s where s.id = shot_id and public.user_has_project_access(s.project_id))
  );

-- Add 'characters' to the module slugs for RBAC
-- (The check constraint on ModuleSlug is enforced in TypeScript, not SQL)

-- Storage bucket for character reference images will be created via dashboard
-- Bucket name: character-references (public)

-- ============================================================
-- COLLABORATION: project_members + project_invites
-- ============================================================

-- Helper function: does the current user have any access to this project?
create or replace function public.user_has_project_access(p_project_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.projects where id = p_project_id and user_id = auth.uid()
  ) or exists (
    select 1 from public.project_members where project_id = p_project_id and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer stable;

-- Helper function: what role does the current user have on this project?
create or replace function public.user_project_role(p_project_id uuid)
returns text as $$
begin
  if exists (select 1 from public.projects where id = p_project_id and user_id = auth.uid()) then
    return 'owner';
  end if;
  return (
    select role from public.project_members
    where project_id = p_project_id and user_id = auth.uid()
    limit 1
  );
end;
$$ language plpgsql security definer stable;

-- ============================================================
-- PROJECT MEMBERS (collaborators on a project)
-- ============================================================
create table public.project_members (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'viewer'
    check (role in ('editor', 'contributor', 'viewer')),
  permissions jsonb not null default '[]',
  invited_by uuid references public.profiles(id),
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, user_id)
);

create index idx_project_members_user on public.project_members(user_id);
create index idx_project_members_project on public.project_members(project_id);

alter table public.project_members enable row level security;

-- Members can view their own memberships
create policy "users_view_own_memberships" on public.project_members
  for select using (user_id = auth.uid());

-- Project owners can view all members of their projects
create policy "owners_view_project_members" on public.project_members
  for select using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

-- Only project owners can add/update/remove members
create policy "owners_manage_members" on public.project_members
  for insert with check (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

create policy "owners_update_members" on public.project_members
  for update using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

create policy "owners_delete_members" on public.project_members
  for delete using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

-- ============================================================
-- PROJECT INVITES
-- ============================================================
create table public.project_invites (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  invited_email text not null,
  role text not null default 'viewer'
    check (role in ('editor', 'contributor', 'viewer')),
  permissions jsonb not null default '[]',
  token uuid not null default uuid_generate_v4(),
  invited_by uuid not null references public.profiles(id),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'revoked', 'expired')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create unique index idx_project_invites_token on public.project_invites(token);
create index idx_project_invites_email on public.project_invites(invited_email);

alter table public.project_invites enable row level security;

-- Owners can manage invites for their projects
create policy "owners_manage_invites" on public.project_invites
  for all using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

-- Anyone can read an invite by token (for the acceptance flow)
-- This is handled via service role in the accept endpoint

-- ============================================================
-- UPDATE EXISTING RLS POLICIES
-- Replace owner-only access with owner+member access
-- ============================================================

-- SCRIPTS
drop policy if exists "users_crud_own_scripts" on public.scripts;
create policy "members_view_scripts" on public.scripts
  for select using (public.user_has_project_access(project_id));
create policy "members_modify_scripts" on public.scripts
  for insert with check (public.user_has_project_access(project_id));
create policy "members_update_scripts" on public.scripts
  for update using (public.user_has_project_access(project_id));
create policy "members_delete_scripts" on public.scripts
  for delete using (public.user_has_project_access(project_id));

-- SCENES
drop policy if exists "users_crud_own_scenes" on public.scenes;
create policy "members_view_scenes" on public.scenes
  for select using (public.user_has_project_access(project_id));
create policy "members_modify_scenes" on public.scenes
  for insert with check (public.user_has_project_access(project_id));
create policy "members_update_scenes" on public.scenes
  for update using (public.user_has_project_access(project_id));
create policy "members_delete_scenes" on public.scenes
  for delete using (public.user_has_project_access(project_id));

-- SHOTS
drop policy if exists "users_crud_own_shots" on public.shots;
create policy "members_view_shots" on public.shots
  for select using (public.user_has_project_access(project_id));
create policy "members_modify_shots" on public.shots
  for insert with check (public.user_has_project_access(project_id));
create policy "members_update_shots" on public.shots
  for update using (public.user_has_project_access(project_id));
create policy "members_delete_shots" on public.shots
  for delete using (public.user_has_project_access(project_id));

-- STORYBOARDS
drop policy if exists "users_crud_own_storyboards" on public.storyboards;
create policy "members_view_storyboards" on public.storyboards
  for select using (public.user_has_project_access(project_id));
create policy "members_modify_storyboards" on public.storyboards
  for insert with check (public.user_has_project_access(project_id));
create policy "members_update_storyboards" on public.storyboards
  for update using (public.user_has_project_access(project_id));
create policy "members_delete_storyboards" on public.storyboards
  for delete using (public.user_has_project_access(project_id));

-- PRODUCTION_PLANS
drop policy if exists "users_crud_own_production_plans" on public.production_plans;
create policy "members_view_production_plans" on public.production_plans
  for select using (public.user_has_project_access(project_id));
create policy "members_modify_production_plans" on public.production_plans
  for insert with check (public.user_has_project_access(project_id));
create policy "members_update_production_plans" on public.production_plans
  for update using (public.user_has_project_access(project_id));
create policy "members_delete_production_plans" on public.production_plans
  for delete using (public.user_has_project_access(project_id));

-- RENDERS
drop policy if exists "users_crud_own_renders" on public.renders;
create policy "members_view_renders" on public.renders
  for select using (public.user_has_project_access(project_id));
create policy "members_modify_renders" on public.renders
  for insert with check (public.user_has_project_access(project_id));
create policy "members_update_renders" on public.renders
  for update using (public.user_has_project_access(project_id));
create policy "members_delete_renders" on public.renders
  for delete using (public.user_has_project_access(project_id));

-- EXPORTS
drop policy if exists "users_crud_own_exports" on public.exports;
create policy "members_view_exports" on public.exports
  for select using (public.user_has_project_access(project_id));
create policy "members_modify_exports" on public.exports
  for insert with check (public.user_has_project_access(project_id));
create policy "members_update_exports" on public.exports
  for update using (public.user_has_project_access(project_id));
create policy "members_delete_exports" on public.exports
  for delete using (public.user_has_project_access(project_id));

-- SHOOT_PLANS
drop policy if exists "users_crud_own_shoot_plans" on public.shoot_plans;
create policy "members_view_shoot_plans" on public.shoot_plans
  for select using (public.user_has_project_access(project_id));
create policy "members_modify_shoot_plans" on public.shoot_plans
  for insert with check (public.user_has_project_access(project_id));
create policy "members_update_shoot_plans" on public.shoot_plans
  for update using (public.user_has_project_access(project_id));
create policy "members_delete_shoot_plans" on public.shoot_plans
  for delete using (public.user_has_project_access(project_id));

-- CREW_MEMBERS
drop policy if exists "users_crud_own_crew_members" on public.crew_members;
create policy "members_view_crew" on public.crew_members
  for select using (public.user_has_project_access(project_id));
create policy "members_modify_crew" on public.crew_members
  for insert with check (public.user_has_project_access(project_id));
create policy "members_update_crew" on public.crew_members
  for update using (public.user_has_project_access(project_id));
create policy "members_delete_crew" on public.crew_members
  for delete using (public.user_has_project_access(project_id));

-- CALL_SHEETS
drop policy if exists "users_crud_own_call_sheets" on public.call_sheets;
create policy "members_view_call_sheets" on public.call_sheets
  for select using (public.user_has_project_access(project_id));
create policy "members_modify_call_sheets" on public.call_sheets
  for insert with check (public.user_has_project_access(project_id));
create policy "members_update_call_sheets" on public.call_sheets
  for update using (public.user_has_project_access(project_id));
create policy "members_delete_call_sheets" on public.call_sheets
  for delete using (public.user_has_project_access(project_id));

-- AI_GENERATIONS: keep user-level select, widen insert/update for collaborators
drop policy if exists "users_view_own_generations" on public.ai_generations;
create policy "users_view_own_generations" on public.ai_generations
  for select using (user_id = auth.uid());
-- Insert policy: any project member can trigger AI generation (enforced in app layer)
create policy "members_insert_generations" on public.ai_generations
  for insert with check (public.user_has_project_access(project_id));

-- PROJECTS: keep owner-only for mutations, add member read access
drop policy if exists "users_crud_own_projects" on public.projects;
create policy "owners_manage_projects" on public.projects
  for all using (user_id = auth.uid());
create policy "members_view_projects" on public.projects
  for select using (public.user_has_project_access(id));

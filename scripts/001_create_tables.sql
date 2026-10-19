-- User app state table to persist all KidneyCare data per user
create table if not exists public.user_app_state (
  id uuid primary key references auth.users(id) on delete cascade,
  language text default 'en',
  has_consented boolean default false,
  has_completed_onboarding boolean default false,
  has_completed_patient_profile boolean default false,
  current_screen text default 'language-selection',
  patient_profile jsonb default '{}',
  health_data jsonb default '[]',
  medications jsonb default '[]',
  symptom_entries jsonb default '[]',
  urine_tests jsonb default '[]',
  daily_check_ins jsonb default '[]',
  is_voice_enabled boolean default true,
  theme text default 'system',
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.user_app_state enable row level security;

create policy "users_select_own_state" on public.user_app_state for select using (auth.uid() = id);
create policy "users_insert_own_state" on public.user_app_state for insert with check (auth.uid() = id);
create policy "users_update_own_state" on public.user_app_state for update using (auth.uid() = id);
create policy "users_delete_own_state" on public.user_app_state for delete using (auth.uid() = id);

-- Auto-create app state row when a new user signs up
create or replace function public.handle_new_user_app_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_app_state (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_app_state on auth.users;

create trigger on_auth_user_created_app_state
  after insert on auth.users
  for each row
  execute function public.handle_new_user_app_state();

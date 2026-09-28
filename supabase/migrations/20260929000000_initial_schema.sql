-- ============================================================
-- REMIRA — initial schema
-- Tables, constraints, indexes, triggers, RLS and storage.
-- Safe to run once on a fresh Supabase project (supabase db push
-- or paste into the SQL editor).
-- ============================================================

-- ------------------------------------------------------------
-- Shared helpers
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text check (full_name is null or char_length(full_name) <= 80),
  email       text,
  avatar_url  text check (avatar_url is null or char_length(avatar_url) <= 1024),
  preferences jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- categories
-- ------------------------------------------------------------
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (char_length(btrim(name)) between 1 and 40),
  icon       text check (icon is null or char_length(icon) <= 32),
  color      text check (color is null or char_length(color) <= 16),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- lets child tables enforce "category belongs to the same user"
  constraint categories_id_user_unique unique (id, user_id)
);

create unique index categories_user_name_unique on public.categories (user_id, lower(btrim(name)));
create index categories_user_id_idx on public.categories (user_id);

-- ------------------------------------------------------------
-- reminders
-- ------------------------------------------------------------
create table public.reminders (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title                       text not null check (char_length(btrim(title)) between 1 and 120),
  description                 text check (description is null or char_length(description) <= 2000),
  reminder_date               date not null,
  reminder_time               time not null,
  timezone                    text not null default 'UTC',
  category_id                 uuid,
  priority                    text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  repeat_type                 text not null default 'none' check (repeat_type in ('none', 'daily', 'weekly', 'monthly', 'custom')),
  repeat_config               jsonb not null default '{}'::jsonb check (jsonb_typeof(repeat_config) = 'object'),
  notification_enabled        boolean not null default true,
  notification_minutes_before integer not null default 0 check (notification_minutes_before between 0 and 10080),
  -- computed by trigger: the exact UTC instant the push should fire
  notify_at                   timestamptz,
  notification_sent_at        timestamptz,
  is_completed                boolean not null default false,
  completed_at                timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  constraint reminders_category_fk
    foreign key (category_id, user_id) references public.categories (id, user_id)
    on delete set null (category_id)
);

create index reminders_user_id_idx on public.reminders (user_id);
create index reminders_user_date_idx on public.reminders (user_id, reminder_date, reminder_time);
create index reminders_user_completed_idx on public.reminders (user_id, is_completed);
create index reminders_category_idx on public.reminders (category_id);
-- partial index used by the notification dispatcher
create index reminders_due_notifications_idx on public.reminders (notify_at)
  where notification_enabled and not is_completed and notification_sent_at is null;

create or replace function public.reminders_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- fall back to UTC for unknown timezones rather than failing the write
  if new.timezone is null
     or not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    new.timezone := 'UTC';
  end if;

  new.notify_at := ((new.reminder_date + new.reminder_time) at time zone new.timezone)
                   - make_interval(mins => new.notification_minutes_before);

  if tg_op = 'INSERT' then
    new.notification_sent_at := null;
    new.completed_at := case when new.is_completed then now() else null end;
  else
    -- re-arm the notification whenever the schedule changes or a reminder is reopened
    if new.notify_at is distinct from old.notify_at
       or new.notification_enabled is distinct from old.notification_enabled
       or (old.is_completed and not new.is_completed) then
      new.notification_sent_at := null;
    end if;

    if new.is_completed and not old.is_completed then
      new.completed_at := now();
    elsif not new.is_completed then
      new.completed_at := null;
    end if;
  end if;

  return new;
end;
$$;

create trigger reminders_before_write
  before insert or update on public.reminders
  for each row execute function public.reminders_before_write();

-- ------------------------------------------------------------
-- notes
-- ------------------------------------------------------------
create table public.notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title       text not null check (char_length(btrim(title)) between 1 and 160),
  content     text check (content is null or char_length(content) <= 50000),
  category_id uuid,
  tags        text[] not null default '{}' check (cardinality(tags) <= 12),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint notes_category_fk
    foreign key (category_id, user_id) references public.categories (id, user_id)
    on delete set null (category_id)
);

create index notes_user_id_idx on public.notes (user_id);
create index notes_user_updated_idx on public.notes (user_id, updated_at desc);
create index notes_tags_idx on public.notes using gin (tags);

-- ------------------------------------------------------------
-- calendar_events (optional; not required for core features)
-- ------------------------------------------------------------
create table public.calendar_events (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  external_event_id text,
  title             text check (title is null or char_length(title) <= 300),
  description       text check (description is null or char_length(description) <= 5000),
  start_at          timestamptz not null,
  end_at            timestamptz,
  location          text check (location is null or char_length(location) <= 300),
  calendar_name     text,
  source            text not null default 'other',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint calendar_events_range check (end_at is null or end_at >= start_at),
  constraint calendar_events_external_unique unique (user_id, source, external_event_id)
);

create index calendar_events_user_start_idx on public.calendar_events (user_id, start_at);

-- ------------------------------------------------------------
-- push_subscriptions
-- ------------------------------------------------------------
create table public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint   text not null unique check (endpoint like 'https://%'),
  p256dh     text not null,
  auth       text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

-- ------------------------------------------------------------
-- updated_at triggers
-- ------------------------------------------------------------
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
create trigger reminders_updated_at before update on public.reminders
  for each row execute function public.set_updated_at();
create trigger notes_updated_at before update on public.notes
  for each row execute function public.set_updated_at();
create trigger calendar_events_updated_at before update on public.calendar_events
  for each row execute function public.set_updated_at();
create trigger push_subscriptions_updated_at before update on public.push_subscriptions
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- New user bootstrap: profile + default categories
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    nullif(left(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 80), ''),
    new.email
  )
  on conflict (id) do nothing;

  insert into public.categories (user_id, name, icon, color)
  values
    (new.id, 'Study',             'book-open',      'teal'),
    (new.id, 'Clinical',          'stethoscope',    'cyan'),
    (new.id, 'Assignment',        'clipboard-list', 'sky'),
    (new.id, 'Exam',              'graduation-cap', 'indigo'),
    (new.id, 'Research',          'flask-conical',  'violet'),
    (new.id, 'Organization',      'users',          'amber'),
    (new.id, 'Personal',          'user',           'slate'),
    (new.id, 'Anatomy',           'bone',           'orange'),
    (new.id, 'Pharmacology',      'pill',           'emerald'),
    (new.id, 'Cardiology',        'heart-pulse',    'rose'),
    (new.id, 'Neurology',         'brain',          'pink'),
    (new.id, 'Pathology',         'microscope',     'lime'),
    (new.id, 'Clinical Rotation', 'hospital',       'cyan')
  on conflict do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- keep profile email in sync when the auth email changes
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- ------------------------------------------------------------
-- Privileges: only signed-in users reach these tables
-- ------------------------------------------------------------
revoke all on public.profiles, public.categories, public.reminders, public.notes,
              public.calendar_events, public.push_subscriptions from anon;
grant select, insert, update, delete on public.profiles, public.categories, public.reminders,
      public.notes, public.calendar_events, public.push_subscriptions to authenticated;

-- ------------------------------------------------------------
-- Row Level Security — users only ever see their own rows
-- ------------------------------------------------------------
alter table public.profiles           enable row level security;
alter table public.categories         enable row level security;
alter table public.reminders          enable row level security;
alter table public.notes              enable row level security;
alter table public.calendar_events    enable row level security;
alter table public.push_subscriptions enable row level security;

-- profiles (keyed by id)
create policy "profiles_select_own" on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy "profiles_insert_own" on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "profiles_delete_own" on public.profiles for delete to authenticated
  using (id = (select auth.uid()));

-- user_id-keyed tables
do $$
declare
  t text;
begin
  foreach t in array array['categories', 'reminders', 'notes', 'calendar_events', 'push_subscriptions']
  loop
    execute format('create policy %I on public.%I for select to authenticated using (user_id = (select auth.uid()))', t || '_select_own', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (user_id = (select auth.uid()))', t || '_insert_own', t);
    execute format('create policy %I on public.%I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t || '_update_own', t);
    execute format('create policy %I on public.%I for delete to authenticated using (user_id = (select auth.uid()))', t || '_delete_own', t);
  end loop;
end;
$$;

-- ------------------------------------------------------------
-- Storage: avatars bucket (public read, owner-only write)
-- Files are stored at avatars/<user_id>/<file>
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "avatars_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars_select_own" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ------------------------------------------------------------
-- Notification dispatcher support
-- Atomically claims due reminders so overlapping cron runs never
-- double-send. Only callable with the service role key.
-- ------------------------------------------------------------
create or replace function public.claim_due_reminder_notifications(max_rows integer default 200)
returns table (
  id uuid,
  user_id uuid,
  title text,
  description text,
  reminder_date date,
  reminder_time time,
  notification_minutes_before integer
)
language sql
security definer
set search_path = ''
as $$
  update public.reminders r
     set notification_sent_at = now()
   where r.id in (
     select c.id
       from public.reminders c
      where c.notification_enabled
        and not c.is_completed
        and c.notification_sent_at is null
        and c.notify_at <= now()
        and c.notify_at > now() - interval '6 hours'  -- skip stale backlog
      order by c.notify_at
      limit greatest(1, least(max_rows, 1000))
      for update skip locked
   )
  returning r.id, r.user_id, r.title, r.description, r.reminder_date, r.reminder_time,
            r.notification_minutes_before;
$$;

revoke all on function public.claim_due_reminder_notifications(integer) from public, anon, authenticated;
grant execute on function public.claim_due_reminder_notifications(integer) to service_role;
